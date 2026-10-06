/* momentum/handoffs.js: the "Hand-offs" tab. A proximity ("when X happens, Y follows within N moments") is an
   attention hand-off: X holds attention, then Y takes it. A hand-off to a DIFFERENT family keeps the film
   moving; one to the same family lets attention rest. This file lists the proximities that matter for a film
   (the app's own in model.js, the engine's links, and for a curated film the ones its moments show), says which
   kind each is and how often it happened, finds the stretches where attention rests too long, and suggests one
   new hand-off for each. On My film, "Add this hand-off" adds it as one engine link (one undo step).

   Part of the momentum core (no page) for the pure part; the tab draws only in a browser.

   window.CurioHandoffs
   - endFamily(end) / endLabel(end)    the family and plain name of one end ({ curiosity } or { suite })
   - classify(x, y) -> { from, to, kind: "moves" | "rests" | "unknown" }
   - flatten(beats)                     beats with "curiosity@track" keys read as "curiosity" (first track wins)
   - count(p, beats) -> { n, fired, at } how many times X happened and how many times Y followed in time
   - fromProximities(list, beats, opts) -> rows for the app's proximities that happened in the film
       (opts.all: every one whose curiosities are in the film, even if it never happened; opts.skip: ids to leave out)
   - fromLinks(state, events) -> rows for the engine's links, fired counted from the engine's events
   - summary(rows) -> { fired, moving, resting, share, total, movingRows }  share: hand-offs that moved attention
       to a new family, of all that happened (weighted by how often each happened)
   - stretches(reading) -> the family stretches that are Getting long or Too long (CurioMomentum.status)
   - suggest(reading, opts) -> [{ run, status, holder, target, text, reason }]  one new hand-off per stretch.
       opts: { candidates: [{ curiosity, track?, family, label, push }], compass: [options], limit }
       The target family is the Compass's first choice that is not the holder's family, else the family the
       film has used least; each suggestion counts toward the next, so two stretches do not get the same family.
   - plan(engine or state, opts) -> { reading, numbers, suggestions: [... + { commands, link, preview, helps }] }
       the suggestions for the engine's film, each with the one command that adds it and the numbers the film
       would read with it (the engine's own rewrite, in memory)
   - numbers(reading, rows?) -> { longest, over, long, moves, share }
   - add(suggestion) -> the engine's reply (one CurioEngine.send, one undo step) */
(function () {
  const root = typeof window !== "undefined" ? window : globalThis;
  const M = () => root.CurioMomentum;
  const A = () => root.CurioAttention;
  const S = () => root.CurioScale;
  const CS = () => root.CuriositySuites;
  const round = (n, d) => Math.round(n * Math.pow(10, d || 0)) / Math.pow(10, d || 0);
  const clone = (x) => JSON.parse(JSON.stringify(x));
  const plain = (t) => (M() && M().plain ? M().plain(String(t == null ? "" : t)) : String(t == null ? "" : t));
  const same = (a, b) => a != null && b != null && a !== "" && String(a) === String(b);
  const suites = () => (typeof SUITES !== "undefined" ? SUITES : root.SUITES || []);
  const famLabel = (f) => (M().family(f) || { label: f || "nothing" }).label;

  /* ---------- the ends of a hand-off ---------- */
  function suiteMembers(id) {
    if (CS() && CS().members) return CS().members(id);
    const s = suites().find((x) => x.id === id);
    return s && s.set ? Object.keys(s.set) : [];
  }
  /* A suite's family is the family most of its members belong to (the first one on a tie). */
  function endFamily(end) {
    if (!end) return null;
    if (end.suite) {
      const tally = {};
      suiteMembers(end.suite).forEach((c) => {
        const f = M().familyOf(c);
        if (f) tally[f] = (tally[f] || 0) + 1;
      });
      const best = Object.entries(tally).sort((a, b) => b[1] - a[1])[0];
      return best ? best[0] : null;
    }
    /* A curiosity the app does not know has no family we can tell. */
    return end.curiosity && M().find(end.curiosity) ? M().familyOf(end.curiosity) || null : null;
  }
  function endLabel(end) {
    if (!end) return "";
    if (end.suite) {
      const s = suites().find((x) => x.id === end.suite);
      return plain("the " + ((s && s.label) || end.suite) + " look");
    }
    const lab = S() && S().known && S().known(end.curiosity) ? S().label(end.curiosity) : M().note(end.curiosity).label;
    return plain(lab || end.curiosity);
  }
  function classify(x, y) {
    const from = endFamily(x);
    const to = endFamily(y);
    return { from, to, kind: !from || !to ? "unknown" : from === to ? "rests" : "moves" };
  }

  /* ---------- counting in a film ---------- */
  function flatten(beats) {
    return (beats || []).map((b) => {
      const values = {};
      Object.keys((b && b.values) || {}).forEach((k) => {
        const id = k.split("@")[0];
        if (values[id] == null) values[id] = b.values[k];
      });
      return { values, at: b && b.at, row: b && b.row, label: b && b.label };
    });
  }
  function rank(id, v) {
    const p = S() && S().pos ? S().pos(id, v) : null;
    return p != null ? p : Number(v);
  }
  /* Does a condition hold at moment i? A change compares with the moment before (as Study and the Prism do). */
  function holds(c, beats, i) {
    const beat = beats[i];
    if (!c || !beat) return false;
    if (c.suite) return !!CS() && !!CS().present(c.suite, beat.values);
    const v = beat.values[c.curiosity];
    if (c.is != null && !c.change) return same(v, c.is);
    if (i === 0) return false;
    const prev = beats[i - 1].values[c.curiosity];
    if (v == null || prev == null || v === "" || prev === "") return false;
    if (c.change === "rises") return rank(c.curiosity, v) > rank(c.curiosity, prev);
    if (c.change === "drops") return rank(c.curiosity, v) < rank(c.curiosity, prev);
    return !same(v, prev);
  }
  function count(p, beats) {
    let n = 0;
    const at = [];
    const w = Math.max(0, Number(p.within) || 0);
    beats.forEach((_, i) => {
      if (!holds(p.x, beats, i)) return;
      n++;
      for (let j = i; j <= i + w && j < beats.length; j++)
        if (holds(p.y, beats, j)) {
          at.push(i);
          break;
        }
    });
    return { n, fired: at.length, at };
  }
  function present(end, beats) {
    if (!end) return false;
    if (end.suite) return suiteMembers(end.suite).some((c) => beats.some((b) => b.values[c] != null));
    return beats.some((b) => b.values[end.curiosity] != null && b.values[end.curiosity] !== "");
  }
  function row(base, x, y, within, fired) {
    const k = classify(x, y);
    return Object.assign(base, {
      x,
      y,
      within: within || 0,
      from: k.from,
      to: k.to,
      kind: k.kind,
      fired,
      xLabel: endLabel(x),
      yLabel: endLabel(y),
    });
  }
  function fromProximities(list, beats, opts) {
    const o = opts || {};
    const flat = flatten(beats);
    const skip = new Set(o.skip || []);
    const out = [];
    (list || []).forEach((p) => {
      if (!p || !p.x || !p.y || skip.has(p.id)) return;
      if (!present(p.x, flat) || !present(p.y, flat)) return;
      const c = count(p, flat);
      if (!c.fired && !o.all) return;
      out.push(row({ id: "p:" + p.id, source: o.source || "app", when: plain(p.when || endLabel(p.x)), then: plain(p.then || endLabel(p.y)), at: c.at }, p.x, p.y, p.within, c.fired));
    });
    return out;
  }
  function fromLinks(state, events) {
    const st = state || { links: [], rows: [], tracks: [] };
    const tally = {};
    (events || []).forEach((e) => (tally[e.link] = (tally[e.link] || 0) + 1));
    const trackLabel = (id) => ((st.tracks || []).find((t) => t.id === id) || { label: id }).label;
    return (st.links || []).map((l) => {
      const x = { curiosity: l.from.curiosity };
      const y = { curiosity: l.to.curiosity };
      const r = row({ id: "l:" + l.id, link: l.id, source: "engine", on: l.on !== false, label: plain(l.label || ""), seed: l.seed || "" }, x, y, l.within, tally[l.id] || 0);
      r.when = plain(endLabel(x) + " on " + trackLabel(l.from.track) + (l.from.is != null ? " is " + l.from.is : l.from.change === "rises" ? " rises" : l.from.change === "drops" ? " drops" : " changes"));
      r.then = plain(endLabel(y) + " on " + trackLabel(l.to.track) + " changes");
      return r;
    });
  }
  function summary(rows) {
    const list = rows || [];
    let fired = 0;
    let moving = 0;
    let resting = 0;
    list.forEach((r) => {
      if (r.kind === "unknown") return;
      fired += r.fired;
      if (r.kind === "moves") moving += r.fired;
      else resting += r.fired;
    });
    return {
      fired,
      moving,
      resting,
      share: fired ? round(moving / fired, 2) : null,
      total: list.filter((r) => r.kind !== "unknown").length,
      movingRows: list.filter((r) => r.kind === "moves").length,
    };
  }

  /* ---------- where attention rests too long ---------- */
  function stretches(reading) {
    const lim = reading.limit || 20;
    return A()
      .familyRuns(reading.segments || [])
      .map((run) => Object.assign({}, run, { status: M().status(run.dur, lim) }))
      .filter((run) => run.status.key === "over" || run.status.key === "long")
      .sort((a, b) => (a.status.key === b.status.key ? b.dur - a.dur : a.status.key === "over" ? -1 : 1));
  }
  /* The curiosity that held attention longest inside a stretch. */
  function holderOf(reading, run) {
    let best = null;
    const sum = {};
    (reading.segments || []).forEach((s) => {
      if (s.from < run.from - 1e-9 || s.from >= run.to - 1e-9 || s.family !== run.family) return;
      sum[s.curiosity] = (sum[s.curiosity] || 0) + s.dur;
      if (!best || sum[s.curiosity] > sum[best.curiosity]) best = s;
    });
    return best;
  }
  /* Say one option for a stretch in words: the target, the sentence, and the reason. */
  function describe(s, opt, reading) {
    const fam = opt.family;
    const share = Math.round(((reading.stats && reading.stats.familyShare && reading.stats.familyShare[fam]) || 0) * 100);
    const held = `${famLabel(s.run.family)} holds attention for ${round(s.run.dur)} seconds here.`;
    s.target = { curiosity: opt.curiosity, track: opt.track || null, label: plain(opt.label), family: fam, onTrack: opt.onTrack !== false };
    s.why = opt.why;
    s.text = `When ${s.holder.label} happens, ${s.target.label} follows within 1 moment.`;
    s.reason =
      opt.why === "compass"
        ? `${held} The Compass points to ${famLabel(fam)} as the family to move to next, so handing attention to it keeps the film going somewhere.`
        : share > 0
        ? `${held} ${famLabel(fam)} holds attention only ${share}% of the time in this film, less than the other families, so it brings something new.`
        : `${held} ${famLabel(fam)} never holds attention in this film yet, so it brings something new.`;
    return s;
  }
  function suggest(reading, opts) {
    const o = opts || {};
    const cands = (o.candidates || []).filter((c) => c && c.curiosity && c.family);
    const used = Object.assign({}, (reading.stats && reading.stats.familyShare) || {});
    const total = reading.seconds || 1;
    const compass = (o.compass || []).map((x) => x && x.family).filter(Boolean);
    const out = [];
    stretches(reading).forEach((run) => {
      const seg = holderOf(reading, run);
      if (!seg) return;
      const others = cands.filter((c) => c.family !== run.family);
      if (!others.length) return;
      /* The best curiosity of each family: one already in the film first, then the one that pushes hardest. */
      const bestOf = {};
      others
        .slice()
        .sort((a, b) => (b.onTrack !== false ? 1 : 0) - (a.onTrack !== false ? 1 : 0) || (b.push || 0) - (a.push || 0))
        .forEach((c) => bestOf[c.family] || (bestOf[c.family] = c));
      const taken = new Set(out.map((x) => x.target.family));
      const fams = Object.keys(bestOf);
      const byUse = (a, b) => (taken.has(a) ? 1 : 0) - (taken.has(b) ? 1 : 0) || (used[a] || 0) - (used[b] || 0) || a.localeCompare(b);
      const order = compass
        .filter((f) => fams.includes(f) && !taken.has(f))
        .map((f) => ({ family: f, why: "compass" }))
        .concat(fams.filter((f) => bestOf[f].onTrack !== false).sort(byUse).map((f) => ({ family: f, why: "least" })))
        .concat(fams.filter((f) => bestOf[f].onTrack === false).sort(byUse).map((f) => ({ family: f, why: "least" })));
      const seen = new Set();
      const options = order.filter((x) => !seen.has(x.family) && seen.add(x.family)).map((x) => Object.assign({}, bestOf[x.family], { why: x.why }));
      const s = {
        run: { family: run.family, from: run.from, to: run.to, dur: run.dur },
        status: run.status,
        holder: { curiosity: seg.curiosity, label: plain(seg.label), family: run.family, beat: seg.beat },
        options: options.slice(0, 6),
      };
      describe(s, options[0], reading);
      used[s.target.family] = (used[s.target.family] || 0) + run.dur / total;
      out.push(s);
    });
    return out;
  }

  function numbers(reading, rows) {
    const runs = A().familyRuns(reading.segments || []);
    const lim = reading.limit || 20;
    const sum = rows ? summary(rows) : null;
    return {
      longest: round(Math.max(0, ...runs.map((r) => r.dur)), 1),
      over: runs.filter((r) => M().status(r.dur, lim).key === "over").length,
      long: runs.filter((r) => M().status(r.dur, lim).key === "long").length,
      moves: Math.max(0, runs.length - 1),
      share: sum ? sum.share : null,
    };
  }

  /* ---------- My film (the engine) ---------- */
  const TRACK_FOR = { camera: "camera", movement: "character", voice: "character", feeling: "character", wardrobe: "character", comedy: "character", mind: "character" };
  function stateOf(input) {
    const src = input || root.CurioEngine;
    if (!src) return null;
    const st = typeof src.state === "function" ? src.state() : src;
    return st && Array.isArray(st.rows) && Array.isArray(st.tracks) ? clone(st) : null;
  }
  function beatsOf(st, dest) {
    return st.rows.map((r) => {
      const values = {};
      st.tracks.forEach((t) =>
        t.curiosities.forEach((c) => {
          const v = dest[r.id + "|" + t.id + "|" + c];
          if (v != null && v !== "") values[c + "@" + t.id] = v;
        })
      );
      return { values, row: r.id, label: r.label };
    });
  }
  function readState(st, o) {
    const E = root.CurioEngine;
    const res = E.rewrite(E.normalize ? E.normalize(clone(st)) : st);
    const beats = beatsOf(st, res.dest);
    return { beats, events: res.events || [], reading: A().read(beats, { secondsPerBeat: o.secondsPerBeat, limit: o.limit }) };
  }
  /* Every curiosity on a track, and for each family with none, the one that pushes the story hardest. */
  function candidatesFor(st) {
    const out = [];
    st.tracks.forEach((t) =>
      t.curiosities.forEach((c) => {
        const n = M().note(c);
        out.push({ curiosity: c, track: t.id, family: n.family || M().familyOf(c), label: S() && S().known(c) ? S().label(c) : n.label, push: n.push || 0, onTrack: true });
      })
    );
    const have = new Set(out.map((c) => c.family));
    (M().all ? M().all() : [])
      .filter((n) => n.family && !have.has(n.family) && S() && S().known(n.id))
      .sort((a, b) => (b.push || 0) - (a.push || 0))
      .forEach((n) => {
        if (have.has(n.family)) return;
        const kind = TRACK_FOR[n.family] || "master";
        const t = st.tracks.find((x) => x.kind === kind) || st.tracks[0];
        if (!t) return;
        have.add(n.family);
        out.push({ curiosity: n.id, track: t.id, family: n.family, label: S().label(n.id), push: n.push || 0, onTrack: false });
      });
    return out;
  }
  /* The track whose value of the holder changed where the stretch's holder took attention. */
  function holderTrack(st, beats, holder) {
    const i = holder.beat || 0;
    const now = (beats[i] && beats[i].values) || {};
    const prev = (beats[i - 1] && beats[i - 1].values) || {};
    const keys = Object.keys(now).filter((k) => M().baseId(k) === holder.curiosity);
    const changed = keys.find((k) => !same(now[k], prev[k])) || keys[0];
    if (changed) return { track: changed.split("@")[1], curiosity: changed.split("@")[0] };
    const t = st.tracks.find((x) => x.curiosities.some((c) => M().baseId(c) === holder.curiosity));
    return t ? { track: t.id, curiosity: t.curiosities.find((c) => M().baseId(c) === holder.curiosity) } : null;
  }
  const pastLimit = (reading) => A().familyRuns(reading.segments || []).reduce((a, g) => a + Math.max(0, g.dur - (reading.limit || 20)), 0);
  function plan(input, opts) {
    const o = Object.assign({ secondsPerBeat: 3, limit: 20 }, opts || {});
    const st = stateOf(input);
    if (!st || !root.CurioEngine || !st.rows.length) return null;
    const now = readState(st, o);
    const rows = fromLinks(st, now.events);
    const cands = candidatesFor(st);
    const list = suggest(now.reading, { candidates: cands, compass: o.compass, limit: o.limit });
    const step = o.secondsPerBeat;
    const before = numbers(now.reading, rows);
    list.forEach((s, k) => {
      const lead = holderTrack(st, now.beats, s.holder);
      if (!lead) return;
      const first = Math.max(0, Math.min(st.rows.length - 1, Math.round(s.run.from / step)));
      const last = Math.max(first, Math.min(st.rows.length - 1, Math.ceil(s.run.to / step) - 1));
      /* Each option (best first) and each way the follower can move, tried in memory with the engine's own
         rewrite; the first that hands attention over best wins. */
      let best = null;
      s.options.forEach((opt) => {
        if (!opt.track) return;
        ["moveWith", "rise", "fall", "follow"].forEach((does) => {
          const link = {
            label: `Hand-off: ${s.holder.label} hands attention to ${plain(opt.label)}`.slice(0, 160),
            from: { track: lead.track, curiosity: lead.curiosity, change: "any" },
            to: { track: opt.track, curiosity: opt.curiosity },
            does,
            amount: 1,
            within: 1,
            scope: { from: st.rows[first].id, to: st.rows[last].id },
          };
          const trial = clone(st);
          const commands = [];
          if (opt.onTrack === false) {
            commands.push({ type: "addCuriosity", track: opt.track, curiosity: opt.curiosity });
            const t = trial.tracks.find((x) => x.id === opt.track);
            if (t && !t.curiosities.includes(opt.curiosity)) t.curiosities.push(opt.curiosity);
          }
          commands.push(Object.assign({ type: "addLink" }, link));
          trial.links = (trial.links || []).concat([Object.assign({ id: "lhandoff" + k, on: true }, link)]);
          let r;
          try {
            r = readState(trial, o);
          } catch (e) {
            return;
          }
          const gain = pastLimit(now.reading) - pastLimit(r.reading) + (before.longest - numbers(r.reading).longest) * 0.01;
          if (!best || gain > best.gain + 1e-9) best = { gain, opt, link, commands, reading: r.reading, events: r.events, trial };
        });
      });
      if (!best) return;
      describe(s, best.opt, now.reading);
      s.link = best.link;
      s.commands = best.commands;
      s.label = best.link.label;
      s.preview = numbers(best.reading, fromLinks(best.trial, best.events));
      s.helps = best.gain > 1e-9;
    });
    return { reading: now.reading, rows, numbers: before, suggestions: list.filter((s) => s.commands) };
  }
  function add(s) {
    const E = root.CurioEngine;
    if (!E) return { ok: false, error: "No engine here." };
    if (!s || !s.commands || !s.commands.length) return { ok: false, error: "That hand-off cannot be added to My film." };
    if (s.commands.length === 1) return E.send(Object.assign({}, s.commands[0], { label: s.commands[0].label }));
    return E.send({ type: "batch", label: s.label || "Add a hand-off", commands: s.commands });
  }

  const api = { endFamily, endLabel, classify, flatten, holds, count, fromProximities, fromLinks, summary, stretches, suggest, describe, numbers, plan, add, candidatesFor };
  root.CurioHandoffs = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;

  /* ---------- the tab ---------- */
  if (typeof document === "undefined") return;
  const esc = (s) =>
    String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  const ui = { flash: "", before: null, beforeRows: null, off: null, last: null };
  function markHtml(f) {
    if (!f) return `<span class="ho-fam ho-none">unknown family</span>`;
    const mk = M().mark(f);
    return `<span class="ho-fam"><b class="ho-letter" style="background:${mk.color};color:${mk.ink}">${esc(mk.letter)}</b>${esc(mk.label)}</span>`;
  }
  function kindHtml(r) {
    if (r.kind === "moves") return `<span class="ho-kind ho-moves">→ Moves on: hands attention to a new family, which keeps the film moving.</span>`;
    if (r.kind === "rests") return `<span class="ho-kind ho-rests">= Rests: keeps attention in the same family, which lets it rest.</span>`;
    return `<span class="ho-kind">We cannot tell the family of one end.</span>`;
  }
  function studyProximities() {
    try {
      const s = JSON.parse(localStorage.getItem("curiosities-studies-v1"));
      return (s && Array.isArray(s.proximities) && s.proximities) || [];
    } catch (e) {
      return [];
    }
  }
  function appProximities() {
    const base = typeof PROXIMITIES !== "undefined" ? PROXIMITIES : root.PROXIMITIES || [];
    return base.concat(studyProximities());
  }
  function rowsFor(ctx, id) {
    const beats = ctx.beatsOf(id);
    if (id === "engine" && root.CurioEngine) {
      const st = root.CurioEngine.state();
      const links = fromLinks(st, (root.CurioEngine.result() || {}).events);
      const skip = st.links.map((l) => String(l.seed || "").replace(/^catalog:/, "")).filter(Boolean);
      return links.concat(fromProximities(appProximities(), beats, { skip }));
    }
    return fromProximities(appProximities(), beats, { source: id.startsWith("study:") ? "study" : "app" });
  }
  function rowHtml(r) {
    const where = r.source === "engine" ? `A link in My film${r.on ? "" : " (switched off)"}` : r.source === "study" ? "Held in this curated film's moments" : "One of the app's sparks";
    const times = r.fired === 1 ? "once" : r.fired + " times";
    return `<li class="ho-row ho-${r.kind}">
      <p class="ho-say">When ${esc(r.when)}, ${esc(r.then)}${r.within ? `, within ${r.within} moment${r.within === 1 ? "" : "s"}` : ", at the same moment"}.</p>
      <p class="ho-ends">${markHtml(r.from)}<span class="ho-arrow" aria-hidden="true">→</span>${markHtml(r.to)}</p>
      <p>${kindHtml(r)}</p>
      <p class="mo-small">${esc(where)}. It happened ${times} in this film.</p></li>`;
  }
  function numsTable(a, b) {
    const pc = (x) => (x == null ? "–" : Math.round(x * 100) + "%");
    const tr = (label, x, y) => `<tr><th scope="row">${label}</th><td>${x}</td><td>${y}</td></tr>`;
    return `<div class="mo-scroll"><table class="ho-nums"><thead><tr><th></th><th>Before</th><th>After</th></tr></thead><tbody>
      ${tr("Longest stretch on one family", a.longest + " s", b.longest + " s")}
      ${tr("Stretches that are too long", a.over, b.over)}
      ${tr("Stretches that are getting long", a.long, b.long)}
      ${tr("Moves to a new family", a.moves, b.moves)}
      ${tr("Hand-offs that move to a new family", pc(a.share), pc(b.share))}
      </tbody></table></div>`;
  }
  function mount(el, ctx) {
    const src = ctx.source();
    const reading = ctx.readSource(src);
    const lim = ctx.limit();
    const step = ctx.secondsPerBeat();
    const isEngine = src === "engine";
    const rows = rowsFor(ctx, src).sort((a, b) => b.fired - a.fired || (a.kind === "moves" ? -1 : 1));
    const sum = summary(rows);
    let compass = [];
    try {
      compass = root.CurioCompass ? root.CurioCompass.point(reading, ctx.profiles()).options || [] : [];
    } catch (e) {}
    let sugg = [];
    let p = null;
    if (isEngine && root.CurioMomentumEngine && root.CurioMomentumEngine.available()) {
      p = plan(root.CurioEngine, { secondsPerBeat: step, limit: lim, compass });
      sugg = p ? p.suggestions : [];
    } else {
      const flat = flatten(ctx.beatsOf(src));
      const ids = [...new Set(flat.reduce((a, b) => a.concat(Object.keys(b.values)), []))];
      const cands = ids.map((c) => {
        const n = M().note(c);
        return { curiosity: c, family: n.family || M().familyOf(c), label: n.label, push: n.push || 0, onTrack: true };
      });
      sugg = suggest(reading, { candidates: cands, compass, limit: lim });
    }
    ui.last = sugg;
    const said = ui.flash;
    ui.flash = "";
    const fired = rows.filter((r) => r.fired > 0 || r.source === "engine");
    const quiet = rows.length - fired.length;
    const shareLine =
      sum.fired > 0
        ? `<p class="ho-big"><b>${Math.round(sum.share * 100)}%</b> of the hand-offs in this film move attention to a new family (${sum.moving} of ${sum.fired}). ${sum.resting === 0 ? "None keeps it in the same family." : sum.resting === 1 ? "The other one keeps it in the same family and lets it rest." : `The other ${sum.resting} keep it in the same family and let it rest.`}</p>`
        : `<p class="ho-big">No hand-off happened in this film yet, so there is no share to show.</p>`;
    const sugHtml = sugg.length
      ? `<ul class="ho-list">${sugg
          .map(
            (s, i) => `<li class="ho-sug">
          <p class="ho-ends">${markHtml(s.holder.family)}<span class="mo-status mo-${s.status.cls}">${s.status.icon} ${esc(s.status.words)}, ${round(s.run.dur)} s</span></p>
          <p class="ho-say"><b>Try:</b> ${esc(s.text)}</p>
          <p class="ho-ends">${markHtml(s.holder.family)}<span class="ho-arrow" aria-hidden="true">→</span>${markHtml(s.target.family)}</p>
          <p class="mo-small"><b>Why:</b> ${esc(s.reason)}${s.target.onTrack === false ? ` ${esc(s.target.label)} is not in My film yet, so it is added too.` : ""}</p>
          ${
            isEngine && s.commands
              ? `<p class="mo-small">With it, the longest stretch would be ${s.preview.longest} s and ${s.preview.over} stretch${s.preview.over === 1 ? " would be" : "es would be"} too long.${s.helps ? "" : " On its own it may not be enough here."}</p>
                 <div class="mo-controls"><button type="button" data-ho-add="${i}">Add this hand-off</button></div>`
              : ""
          }</li>`
          )
          .join("")}</ul>${
          isEngine
            ? `<p class="mo-small">Each hand-off goes into the engine as one link that works only in its stretch, as one step, so Undo in the engine takes it back.</p>`
            : `<p class="mo-small">Hand-offs can be added only to My film. Pick "The engine's timeline" above to add them there.</p>`
        }`
      : `<p class="mo-small"><span class="mo-status mo-good">● Fresh</span> No family holds attention long enough here to need a new hand-off.</p>`;
    const startBtn = !isEngine && !(root.CurioMomentumEngine && root.CurioMomentumEngine.available()) && root.CurioMomentumUI && root.CurioMomentumUI.startFilmButton ? root.CurioMomentumUI.startFilmButton() : "";
    el.innerHTML = `<div class="ho-root">
      ${said ? `<div class="mo-flash" role="status">${esc(said)}</div>` : ""}
      <p>A hand-off is a rule of the kind "when X happens, Y follows within a few moments". X holds the audience's attention, then Y takes it. When Y is a different family from X, the film keeps moving. When Y is the same family, attention rests.</p>
      <div class="mo-controls"><label>Film ${ctx.sourcePicker('data-ho="source"')}</label>${startBtn}</div>
      <section><h3>How much the hand-offs move attention</h3>${shareLine}</section>
      ${
        ui.before && isEngine
          ? `<section><h3>Before and after the hand-off you added</h3>${numsTable(ui.before, numbers(reading, rows))}<p class="mo-small">After is My film read again now, with the engine's links. Undo in the engine takes the hand-off back.</p></section>`
          : ""
      }
      <section><h3>Where attention rests too long</h3><p class="mo-small">One family may hold attention for ${lim} seconds before it counts as too long. For each stretch that is getting long or too long, here is one new hand-off to try.</p>${sugHtml}</section>
      <section><h3>The hand-offs in this film</h3>${
        fired.length ? `<ul class="ho-list">${fired.map(rowHtml).join("")}</ul>` : `<p class="mo-empty">None of the app's hand-offs happened in this film${isEngine ? ", and My film has no links yet" : ""}.</p>`
      }${quiet > 0 ? `<p class="mo-small">${quiet} more of the app's hand-offs have both their curiosities in this film but never happened.</p>` : ""}</section>
    </div>`;
    wire(el, ctx);
  }
  function wire(el, ctx) {
    if (el.__hoWired) return;
    el.__hoWired = true;
    el.addEventListener("change", (e) => {
      if (e.target.dataset.ho === "source") {
        ui.before = null;
        ctx.setSource(e.target.value);
        ctx.refresh();
      }
    });
    el.addEventListener("click", (e) => {
      const t = e.target.closest("button");
      if (!t || !el.contains(t)) return;
      if (t.dataset.hoAdd != null) {
        const s = ui.last && ui.last[Number(t.dataset.hoAdd)];
        if (!s) return;
        const src = ctx.source();
        const before = numbers(ctx.readSource(src), rowsFor(ctx, src));
        const res = add(s);
        if (res && res.ok) {
          ui.before = before;
          ui.flash = `Added the hand-off "${s.text}" to My film as one step. Undo in the engine takes it back.`;
        } else ui.flash = "The engine said: " + ((res && res.error) || "no");
        mount(el, ctx);
      } else if (t.dataset.m === "start-film" && root.CurioMomentumUI && root.CurioMomentumUI.startFilm) {
        root.CurioMomentumUI.startFilm();
        ctx.setSource("engine");
        ctx.refresh();
      }
    });
  }
  function register() {
    return !!(root.CurioMomentumUI && root.CurioMomentumUI.addTab({ id: "handoffs", label: "Hand-offs", group: "fix", mount }));
  }
  if (!register()) {
    let tries = 0;
    const t = setInterval(() => (register() || ++tries > 100) && clearInterval(t), 100);
  }
})();
