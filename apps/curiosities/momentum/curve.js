/* momentum/curve.js: the momentum curve. Jeremy asked for "a graph" of momentum, the feeling of going somewhere
   important, over the whole film. This draws it: one value from 0 to 5 for every moment, the push of whatever
   holds attention, worn down while one family of curiosities stays past the limit, smoothed over a window of
   seconds so the line shows the film's shape rather than every flicker. It marks where the film surges (peaks),
   where it stalls (sags: momentum stays low for a while), and the film in thirds (beginning, middle, end). One
   curated film can be laid over it, stretched to the same length, so the two shapes compare.

   The core (curve, stretch) is pure: it works in Node with no page. The tab ("Momentum curve") is the drawing.

   window.CurioCurve
   - curve(beats, opts) -> { points, peaks, sags, thirds, seconds, window, low, reading }
       beats: [{ at, values }] as attention.js reads them
       opts:  { secondsPerBeat: 3, limit: 20, window: 15 (seconds the line is smoothed over),
                low: 2 (a sag is momentum under this), minSag: 8 (seconds it must stay low),
                profiles: films to compare with (for each sag's Compass suggestion), samples: 240 }
       points: [{ t, value, raw, family, label, curiosity, beat }]  the film sampled evenly (about 240 points, and
               at least one per beat); value is smoothed, raw is the moment itself; beat is the index of the
               beat in effect (for the engine, the row)
       peaks:  [{ t, value, beat, family, label, prominence }]  where the film surges, highest first (at most 5)
       sags:   [{ from, to, dur, beat, lowest, family, label, curiosity, suggestion: { family, label, cue, text } }]
               stretches where the line stays under `low` for at least `minSag` seconds, in film order
       thirds: [{ id: "beginning"|"middle"|"end", label, from, to, mean }]
   - stretch(points, seconds) -> the same points with t stretched so the film lasts `seconds` (to lay one film's
     curve over another of a different length)
   - addTab() puts the tab in the Momentum window (CurioMomentumUI.addTab); it runs on its own once the window
     is loaded. Its own settings: localStorage key curiosities-momentum-curve-v1 (comparison film, window). */
(function () {
  const root = typeof window !== "undefined" ? window : globalThis;
  const A = () => root.CurioAttention;
  const M = () => root.CurioMomentum;
  const CP = () => root.CurioCompass;
  const DEFAULTS = { secondsPerBeat: 3, limit: 20, window: 15, low: 2, minSag: 8, samples: 240 };
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

  function curve(beats, options) {
    const o = Object.assign({}, DEFAULTS, options || {});
    const step = Number(o.secondsPerBeat) > 0 ? Number(o.secondsPerBeat) : DEFAULTS.secondsPerBeat;
    const limit = Number(o.limit) > 0 ? Number(o.limit) : DEFAULTS.limit;
    const win = Number(o.window) > 0 ? Number(o.window) : DEFAULTS.window;
    const low = o.low != null && isFinite(o.low) ? Number(o.low) : DEFAULTS.low;
    const minSag = Number(o.minSag) > 0 ? Number(o.minSag) : DEFAULTS.minSag;
    const list = (beats || []).filter((b) => b && b.values && typeof b.values === "object");
    const reading = A().read(list, { secondsPerBeat: step, limit, end: o.end });
    const empty = { points: [], peaks: [], sags: [], thirds: [], seconds: 0, window: win, low, limit, reading };
    if (!list.length || !reading.segments.length) return empty;
    const times = beatTimes(list, step);
    const t0 = times[0];
    const t1 = t0 + reading.seconds;
    const total = t1 - t0;
    if (!(total > 0)) return empty;
    const segs = reading.segments;
    const runs = reading.stats.familyRuns;

    /* The moment itself: the push of the curiosity holding attention, worn down past the limit (as the
       momentum reading in attention.js does, but at each moment instead of over the whole film). */
    function at(t) {
      let si = segs.length - 1;
      while (si > 0 && segs[si].from > t) si--;
      const s = segs[si];
      const run = runs.find((r) => r.from <= t && t <= r.to) || runs[runs.length - 1];
      const into = t - run.from;
      const fresh = into <= limit ? 1 : Math.max(0.2, limit / into);
      let bi = times.length - 1;
      while (bi > 0 && times[bi] > t) bi--;
      return { raw: s.push * fresh, family: s.family, label: s.label, curiosity: s.curiosity, beat: bi };
    }
    /* Sample evenly, plus every beat's start, so short films and long ones both get a smooth line. */
    const n = Math.max(2, Math.min(2000, Math.round(Number(o.samples) || DEFAULTS.samples)));
    const ts = new Set();
    for (let i = 0; i <= n; i++) ts.add(round(t0 + (total * i) / n, 3));
    times.forEach((t) => t < t1 && ts.add(round(t, 3)));
    const tlist = [...ts].sort((a, b) => a - b);
    const raw = tlist.map((t) => Object.assign({ t }, at(Math.min(t, t1 - 1e-6))));
    /* Smoothed: the average of the moment over a window centred on it (time-weighted, clipped to the film). */
    const fine = Math.max(0.25, total / 1200);
    const m = Math.ceil(total / fine);
    const prefix = [0];
    for (let i = 0; i < m; i++) prefix.push(prefix[i] + at(t0 + (i + 0.5) * fine).raw);
    const avg = (a, b) => {
      const i = Math.max(0, Math.floor((a - t0) / fine));
      const j = Math.min(m, Math.ceil((b - t0) / fine));
      return j > i ? (prefix[j] - prefix[i]) / (j - i) : 0;
    };
    const points = raw.map((p) => ({ t: round(p.t - t0, 2), value: round(avg(p.t - win / 2, p.t + win / 2), 2), raw: round(p.raw, 2), family: p.family, label: p.label, curiosity: p.curiosity, beat: p.beat }));

    const peaks = findPeaks(points, win);
    const sags = findSags(points, low, minSag, total).map((s) => Object.assign(s, { suggestion: suggest(list, times, s, o, step, limit) }));
    const thirds = [
      ["beginning", "Beginning"],
      ["middle", "Middle"],
      ["end", "End"],
    ].map(([id, label], i) => {
      const from = (total * i) / 3;
      const to = (total * (i + 1)) / 3;
      const inside = points.filter((p) => p.t >= from && (i === 2 ? p.t <= to : p.t < to));
      return { id, label, from: round(from, 2), to: round(to, 2), mean: inside.length ? round(inside.reduce((a, p) => a + p.value, 0) / inside.length, 2) : null };
    });
    return { points, peaks, sags, thirds, seconds: round(total, 2), window: win, low, limit, reading };
  }

  /* Peaks: high points that stand out from the valleys around them, at least half a window apart. */
  function findPeaks(points, win) {
    if (points.length < 3) return [];
    const vals = points.map((p) => p.value);
    const range = Math.max(...vals) - Math.min(...vals);
    const need = Math.max(0.4, range * 0.25);
    const top = Math.max(...vals);
    const mean = vals.reduce((a, x) => a + x, 0) / vals.length;
    const cands = [];
    for (let i = 0; i < points.length; i++) {
      const v = vals[i];
      const left = i > 0 ? vals[i - 1] : -Infinity;
      const right = i < vals.length - 1 ? vals[i + 1] : -Infinity;
      if (!(v >= left && v > right) && !(v > left && v >= right)) continue;
      /* The valley before it, back to an equal or higher point (a flat top counts once, from its start). */
      if (i > 0 && vals[i - 1] === v) continue;
      let lmin = v;
      let j = i - 1;
      for (; j >= 0 && vals[j] < v; j--) lmin = Math.min(lmin, vals[j]);
      const lEdge = j < 0;
      /* A surge is a climb: how far it rose from the valley before it (the film's highest point counts unless the
         film simply opens there). */
      const prom = v - lmin;
      if (range > 0 && v >= mean && i > 0 && (prom >= need || (v === top && lEdge))) cands.push(Object.assign({}, points[i], { prominence: round(prom, 2) }));
    }
    const kept = [];
    cands
      .sort((a, b) => b.value - a.value)
      .forEach((c) => {
        if (kept.length < 5 && kept.every((k) => Math.abs(k.t - c.t) >= win / 2)) kept.push(c);
      });
    return kept.map((p) => ({ t: p.t, value: p.value, beat: p.beat, family: p.family, label: p.label, prominence: p.prominence }));
  }

  /* Sags: the line stays under `low` for at least minSag seconds. */
  function findSags(points, low, minSag, total) {
    const out = [];
    let start = null;
    points.forEach((p, i) => {
      const under = p.value < low;
      if (under && start == null) start = i;
      if ((!under || i === points.length - 1) && start != null) {
        const end = under ? i : i - 1;
        const from = points[start].t;
        const to = under ? total : points[i].t;
        if (to - from >= minSag) {
          const part = points.slice(start, end + 1);
          /* What held attention: the curiosity that held it longest in the stretch. */
          const held = {};
          part.forEach((q, k) => {
            const next = part[k + 1] ? part[k + 1].t : to;
            const key = q.curiosity;
            held[key] = held[key] || { family: q.family, label: q.label, curiosity: q.curiosity, s: 0 };
            held[key].s += next - q.t;
          });
          const top = Object.values(held).sort((a, b) => b.s - a.s)[0];
          out.push({ from: round(from, 2), to: round(to, 2), dur: round(to - from, 1), beat: points[start].beat, lowest: round(Math.min(...part.map((q) => q.value)), 2), family: top.family, label: top.label, curiosity: top.curiosity });
        }
        start = null;
      }
    });
    return out;
  }

  /* One plain suggestion for a sag, from the Compass reading the film up to the middle of the sag. */
  function suggest(list, times, sag, o, step, limit) {
    const fam = (f) => (M() && M().family(f)) || { label: f };
    const cueLabel = (c) => ((M() && M().CUES.find((x) => x.id === c)) || { label: c || "plot" }).label.toLowerCase();
    const mid = times[0] + (sag.from + sag.to) / 2;
    const upto = list.filter((_, i) => times[i] <= mid);
    let best = null;
    if (CP() && upto.length) {
      try {
        const r = A().read(upto, { secondsPerBeat: step, limit, end: Math.max(step, mid - times[upto.length - 1]) });
        const res = CP().point(r, o.profiles || []);
        best = res.options[0] || null;
      } catch (e) {
        best = null;
      }
    }
    if (best) {
      const try_ = best.note ? ` Try ${best.note.label}: ${String(best.note.tryThis || "").replace(/\s+$/, "")}` : "";
      return { family: best.family, label: best.label, cue: best.cue, text: `Move attention away from ${fam(sag.family).label} to ${best.label}, with a ${cueLabel(best.cue)}.${try_}` };
    }
    return { family: null, label: null, cue: null, text: `Move attention away from ${fam(sag.family).label} to a different kind of curiosity, or give the one on screen a bigger change.` };
  }

  function stretch(points, total) {
    if (!points || !points.length) return [];
    const last = points[points.length - 1].t || 1;
    const k = total > 0 ? total / last : 1;
    return points.map((p) => Object.assign({}, p, { t: round(p.t * k, 2) }));
  }

  /* ---------------------------------------------------------------- the tab (browser only) */
  const KEY = "curiosities-momentum-curve-v1";
  const BLUE = "#2a78d6";
  const GRAY = "#8a8780";
  const esc = (s) =>
    String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  const clock = (s) => (A() ? A().clock(s) : String(Math.round(s)));
  const famLabel = (f) => ((M() && M().family(f)) || { label: f || "nothing" }).label;
  function loadOwn() {
    let p = null;
    try {
      p = JSON.parse(localStorage.getItem(KEY));
    } catch (e) {}
    p = p && typeof p === "object" ? p : {};
    return { compare: typeof p.compare === "string" ? p.compare : "", window: Number(p.window) > 0 ? Number(p.window) : DEFAULTS.window };
  }
  function saveOwn(own) {
    try {
      localStorage.setItem(KEY, JSON.stringify(own));
    } catch (e) {}
  }
  const shortName = (s) => {
    const t = String(s || "").replace(/^Model scene:\s*/i, "").replace(/\s*\(made-up practice scene\)$/, "");
    return t.length > 22 ? t.slice(0, 21).trim() + "…" : t;
  };

  function chartSvg(mine, theirs, W, theirName) {
    const H = 260;
    const padL = 34;
    const padR = W < 480 ? 74 : 112;
    const padT = 26;
    const padB = 30;
    const iw = Math.max(60, W - padL - padR);
    const ih = H - padT - padB;
    const T = mine.seconds || 1;
    const x = (t) => padL + (t / T) * iw;
    const y = (v) => padT + ih - (Math.max(0, Math.min(5, v)) / 5) * ih;
    const path = (pts) => pts.map((p, i) => (i ? "L" : "M") + x(p.t).toFixed(1) + " " + y(p.value).toFixed(1)).join("");
    let g = "";
    for (let v = 0; v <= 5; v++) g += `<line x1="${padL}" x2="${padL + iw}" y1="${y(v)}" y2="${y(v)}" class="mcv-grid"/><text x="${padL - 6}" y="${y(v) + 4}" text-anchor="end" class="mcv-axis">${v}</text>`;
    /* The low line under which a stretch counts as a sag. */
    g += `<line x1="${padL}" x2="${padL + iw}" y1="${y(mine.low)}" y2="${y(mine.low)}" class="mcv-low"/>`;
    const sags = mine.sags.map((s, i) => `<rect x="${x(s.from)}" y="${padT}" width="${Math.max(2, x(s.to) - x(s.from))}" height="${ih}" class="mcv-sag"/><text x="${(x(s.from) + x(s.to)) / 2}" y="${padT + ih - 6}" text-anchor="middle" class="mcv-sag-n">Sag ${i + 1}</text>`).join("");
    const thirds = mine.thirds.map((th, i) => `${i ? `<line x1="${x(th.from)}" x2="${x(th.from)}" y1="${padT - 18}" y2="${padT + ih}" class="mcv-third"/>` : ""}<text x="${(x(th.from) + x(th.to)) / 2}" y="${padT - 10}" text-anchor="middle" class="mcv-third-l">${th.label}</text>`).join("");
    const ticks = [0, T / 3, (2 * T) / 3, T].map((t, i) => `<text x="${x(t)}" y="${H - 10}" text-anchor="${i === 0 ? "start" : i === 3 ? "end" : "middle"}" class="mcv-axis">${clock(t)}</text>`).join("");
    const peaks = mine.peaks.map((p) => `<path d="M${x(p.t)} ${y(p.value) - 6} l-5 -8 h10 z" class="mcv-peak"><title>Surge at ${clock(p.t)}: ${p.value} of 5</title></path>`).join("");
    /* Direct labels at each line's end, nudged apart when they would touch. */
    const lastM = mine.points[mine.points.length - 1];
    let yM = y(lastM.value) + 4;
    let lab = "";
    let theirLine = "";
    if (theirs && theirs.length) {
      const lastT = theirs[theirs.length - 1];
      let yT = y(lastT.value) + 4;
      if (Math.abs(yT - yM) < 14) {
        if (yT >= yM) yT = yM + 14;
        else yT = yM - 14;
        if (yT > padT + ih + 4) {
          yT = padT + ih + 4;
          yM = yT - 14;
        }
      }
      theirLine = `<path d="${path(theirs)}" class="mcv-line-them"/>`;
      const endName = theirName.length > (W < 480 ? 9 : 15) ? theirName.slice(0, W < 480 ? 8 : 14).trim() + "…" : theirName;
      lab += `<text x="${padL + iw + 6}" y="${yT}" class="mcv-end mcv-end-them">${esc(endName)}<title>${esc(theirName)}</title></text>`;
    }
    lab = `<text x="${padL + iw + 6}" y="${yM}" class="mcv-end mcv-end-me">Your film</text>` + lab;
    return `<svg class="mcv-svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" tabindex="0" aria-label="Momentum curve. ${esc(summary(mine))} Use the left and right arrow keys to step through the film.">
      ${g}${sags}${thirds}${ticks}${theirLine}<path d="${path(mine.points)}" class="mcv-line-me"/>${peaks}${lab}
      <line class="mcv-guide" x1="0" x2="0" y1="${padT}" y2="${padT + ih}" visibility="hidden"/><circle class="mcv-dot" r="4.5" cx="0" cy="0" visibility="hidden"/>
      <rect class="mcv-hit" x="${padL}" y="${padT}" width="${iw}" height="${ih}" fill="transparent"/></svg>`;
  }
  function summary(c) {
    if (!c.points.length) return "Nothing to draw yet.";
    const th = c.thirds.map((t) => `${t.label.toLowerCase()} ${t.mean}`).join(", ");
    return `Average momentum by third: ${th}. ${c.peaks.length} surge${c.peaks.length === 1 ? "" : "s"} and ${c.sags.length} sag${c.sags.length === 1 ? "" : "s"}.`;
  }

  function mountTab(el, ctx) {
    const own = loadOwn();
    const sources = ctx.sources();
    let src = ctx.source();
    if (!sources.some((s) => s.id === src)) src = (sources.find((s) => s.id === "engine") || sources.find((s) => s.id.startsWith("study:")) || sources[0] || { id: "" }).id;
    const studies = sources.filter((s) => s.id.startsWith("study:"));
    let cmp = own.compare;
    if (cmp !== "none" && !studies.some((s) => s.id === cmp)) cmp = (studies.find((s) => s.id !== src) || studies[0] || { id: "none" }).id;
    const limit = ctx.limit();
    const spb = ctx.secondsPerBeat();
    const profiles = ctx.profiles();
    const opts = { secondsPerBeat: spb, limit, window: own.window, profiles };
    const mine = curve(src === "live" ? ctx.beatsOf("live") : ctx.beatsOf(src), opts);
    const them = cmp && cmp !== "none" ? curve(ctx.beatsOf(cmp), Object.assign({}, opts, { profiles: [] })) : null;
    const theirPts = them && them.points.length && mine.seconds ? stretch(them.points, mine.seconds) : null;
    const theirName = cmp && cmp !== "none" ? shortName((studies.find((s) => s.id === cmp) || {}).label) : "";
    const picker = ctx.sourcePicker("data-cv-source").replace(/<option value="([^"]*)"( selected)?>/g, (m0, v) => `<option value="${v}"${v === src ? " selected" : ""}>`);
    const wins = [8, 15, 30, 60].concat([own.window]).filter((v, i, a) => a.indexOf(v) === i).sort((a, b) => a - b);
    const isEngine = src === "engine";
    const sagItems = mine.sags
      .map((s, i) => {
        const go = isEngine ? `<button type="button" data-cv-sag="${i}">Go to moment ${s.beat + 1} on the Screen</button>` : "";
        return `<li class="mcv-sag-item"><div><b>Sag ${i + 1}: ${clock(s.from)} to ${clock(s.to)}</b> <small>(${Math.round(s.dur)} seconds, as low as ${s.lowest} of 5)</small></div>
          <div>What held attention: <span class="mo-fam"><i style="background:${famColor(s.family)}"></i>${esc(s.label)}</span> <small>(${esc(famLabel(s.family))})</small></div>
          <div class="mcv-try"><b>Try this:</b> ${esc(s.suggestion.text)}</div>${go}</li>`;
      })
      .join("");
    const peakText = mine.peaks.length
      ? `<p class="mo-small">▲ The film surges at ${mine.peaks
          .slice()
          .sort((a, b) => a.t - b.t)
          .map((p) => `${clock(p.t)} (${esc(p.label)}, ${p.value} of 5)`)
          .join(", ")}.</p>`
      : "";
    const thirdsText = mine.thirds.length ? `<p class="mo-small">Average momentum in each third: ${mine.thirds.map((t) => `${t.label.toLowerCase()} ${t.mean}`).join(", ")}${them && them.thirds.length ? `. ${esc(theirName)}: ${them.thirds.map((t) => `${t.label.toLowerCase()} ${t.mean}`).join(", ")}` : ""}.</p>` : "";
    el.innerHTML = `<div class="mcv">
      <p class="mcv-lede">How strongly the film feels like it is going somewhere, moment by moment, from 0 (stalled) to 5 (surging). Each moment counts how hard the curiosity holding attention pushes the story, and wears down while one kind of curiosity holds attention past the ${limit} second limit. The line is smoothed over ${own.window} seconds so it shows the film's shape.</p>
      <div class="mo-controls">
        <label>Film ${picker}</label>
        <label>Compare with <select data-cv-cmp aria-label="Compare with"><option value="none"${cmp === "none" ? " selected" : ""}>No other film</option>${studies.map((s) => `<option value="${esc(s.id)}"${s.id === cmp ? " selected" : ""}>${esc(shortName(s.label))}</option>`).join("")}</select></label>
        <label>Smooth over <select data-cv-win aria-label="Smooth over">${wins.map((v) => `<option value="${v}"${v === own.window ? " selected" : ""}>${v} seconds</option>`).join("")}</select></label>
      </div>
      ${
        mine.points.length
          ? `<div class="mcv-chart"><div class="mcv-plot"></div><div class="mo-tip mcv-tip" hidden></div></div>
      <p class="mo-small">The blue line is your film. ${them ? `The gray dashed line is ${esc(theirName)}, stretched to the same length so the shapes compare. ` : ""}Shaded stretches are sags, where momentum stays under ${mine.low} for at least ${DEFAULTS.minSag} seconds. The film is split into a beginning, a middle and an end, each a third of its length.</p>
      ${thirdsText}${peakText}
      <section><h3>Where the film stalls</h3>${
        mine.sags.length
          ? `<ol class="mcv-sags">${sagItems}</ol>`
          : `<p class="mo-small"><span class="mo-status mo-good">●</span> No sags: momentum never stays under ${mine.low} for ${DEFAULTS.minSag} seconds or more.</p>`
      }</section>`
          : `<p class="mo-empty">${src === "live" ? "Play or perform My film to draw its curve." : "This film has nothing to draw yet."}</p>`
      }</div>`;
    if (!mine.points.length) return wire(el, ctx, own, mine, isEngine);
    const plot = el.querySelector(".mcv-plot");
    const W = Math.max(280, Math.min(1200, Math.floor(plot.clientWidth || el.clientWidth || 640)));
    plot.innerHTML = chartSvg(mine, theirPts, W, theirName);
    wireChart(el, mine, theirPts, theirName);
    wire(el, ctx, own, mine, isEngine);
  }
  /* Family colors come from notes.js (CurioMomentum.mark), the same on every tab. */
  function famColor(f) {
    return M().mark(f).color;
  }
  function wireChart(el, mine, theirs, theirName) {
    const svg = el.querySelector(".mcv-svg");
    const hit = svg.querySelector(".mcv-hit");
    const tip = el.querySelector(".mcv-tip");
    const guide = svg.querySelector(".mcv-guide");
    const dot = svg.querySelector(".mcv-dot");
    const W = Number(svg.getAttribute("width"));
    const hx = Number(hit.getAttribute("x"));
    const hw = Number(hit.getAttribute("width"));
    const hy = Number(hit.getAttribute("y"));
    const hh = Number(hit.getAttribute("height"));
    const T = mine.seconds || 1;
    let idx = -1;
    const show = (i) => {
      idx = Math.max(0, Math.min(mine.points.length - 1, i));
      const p = mine.points[idx];
      const px = hx + (p.t / T) * hw;
      const py = hy + hh - (Math.max(0, Math.min(5, p.value)) / 5) * hh;
      guide.setAttribute("x1", px);
      guide.setAttribute("x2", px);
      guide.setAttribute("visibility", "visible");
      dot.setAttribute("cx", px);
      dot.setAttribute("cy", py);
      dot.setAttribute("visibility", "visible");
      let other = "";
      if (theirs && theirs.length) {
        const q = theirs.reduce((b, x) => (Math.abs(x.t - p.t) < Math.abs(b.t - p.t) ? x : b), theirs[0]);
        other = `<br><small>${esc(theirName)}: ${q.value} (${esc(q.label)})</small>`;
      }
      tip.innerHTML = `<b>${clock(p.t)}</b> · momentum ${p.value} of 5<br>${esc(p.label)} <small>(${esc(famLabel(p.family))})</small>${other}`;
      tip.hidden = false;
      const svgBox = svg.getBoundingClientRect();
      const boxW = el.querySelector(".mcv-chart").getBoundingClientRect().width;
      const scale = svgBox.width / W || 1;
      const left = Math.max(0, Math.min(boxW - 190, px * scale + 10 - (px * scale > boxW / 2 ? 200 : 0)));
      tip.style.left = left + "px";
      tip.style.top = "30px";
    };
    const fromEvent = (e) => {
      const b = svg.getBoundingClientRect();
      const sx = ((e.clientX - b.left) / Math.max(1, b.width)) * W;
      const t = ((sx - hx) / hw) * T;
      let best = 0;
      mine.points.forEach((p, i) => {
        if (Math.abs(p.t - t) < Math.abs(mine.points[best].t - t)) best = i;
      });
      show(best);
    };
    hit.addEventListener("pointermove", fromEvent);
    hit.addEventListener("pointerdown", fromEvent);
    hit.addEventListener("pointerleave", (e) => {
      if (e.pointerType === "mouse") {
        tip.hidden = true;
        guide.setAttribute("visibility", "hidden");
        dot.setAttribute("visibility", "hidden");
      }
    });
    svg.addEventListener("keydown", (e) => {
      const stepN = Math.max(1, Math.round(mine.points.length / 60));
      if (e.key === "ArrowRight") show((idx < 0 ? -1 : idx) + stepN);
      else if (e.key === "ArrowLeft") show((idx < 0 ? 0 : idx) - stepN);
      else return;
      e.preventDefault();
    });
  }
  function wire(el, ctx, own, mine, isEngine) {
    const pick = el.querySelector("[data-cv-source]");
    if (pick)
      pick.addEventListener("change", () => {
        ctx.setSource(pick.value);
        ctx.refresh();
      });
    const cmpSel = el.querySelector("[data-cv-cmp]");
    if (cmpSel)
      cmpSel.addEventListener("change", () => {
        own.compare = cmpSel.value;
        saveOwn(own);
        ctx.refresh();
      });
    const winSel = el.querySelector("[data-cv-win]");
    if (winSel)
      winSel.addEventListener("change", () => {
        own.window = Number(winSel.value) || DEFAULTS.window;
        saveOwn(own);
        ctx.refresh();
      });
    el.querySelectorAll("[data-cv-sag]").forEach((b) =>
      b.addEventListener("click", () => {
        const s = mine.sags[Number(b.dataset.cvSag)];
        const S = root.CurioScreen;
        let said;
        if (s && isEngine && S && typeof S.setRow === "function") {
          S.setRow(s.beat);
          said = `The Screen's playhead is now at moment ${s.beat + 1}, where sag ${Number(b.dataset.cvSag) + 1} begins.`;
        } else said = "Open the Screen to move its playhead here.";
        let f = el.querySelector(".mcv-said");
        if (!f) {
          f = document.createElement("div");
          f.className = "mo-flash mcv-said";
          f.setAttribute("role", "status");
          el.querySelector(".mcv").prepend(f);
        }
        f.textContent = said;
      })
    );
    /* Redraw at the new width when the window changes size. */
    if (!root.__cvResize && typeof root.addEventListener === "function") {
      root.__cvResize = true;
      let tm = null;
      root.addEventListener("resize", () => {
        clearTimeout(tm);
        tm = setTimeout(() => {
          if (document.querySelector(".mo-ext[data-ext='curve'] .mcv") && root.CurioMomentumUI) root.CurioMomentumUI.draw();
        }, 200);
      });
    }
  }

  function addTab() {
    const U = root.CurioMomentumUI;
    if (!U || typeof U.addTab !== "function") return false;
    return U.addTab({ id: "curve", label: "Momentum curve", mount: mountTab });
  }

  const api = { curve, stretch, findPeaks, findSags, addTab, DEFAULTS };
  root.CurioCurve = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (typeof document !== "undefined" && root.CurioMomentumUI) addTab();
})();
