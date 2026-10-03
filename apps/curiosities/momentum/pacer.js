/* momentum/pacer.js: "Pace my film like the films I love." Reads the engine's film (My film, the same film the
   Screen plays) for attention, compares how often attention moves with the films you picked (or one of them),
   and plans a few small changes that bring the pacing closer:
     move  where one family holds attention too long (past the limit, or much longer than your films usually
           allow when your film moves attention much less often than they do), one node at the right moment
           that moves attention to the family the Compass suggests (CurioCompass.point on the film up to that
           moment, then CurioMomentumEngine.moveAt for the node);
     rest  where attention moves far more often than in your films (it may feel rushed), keep one curiosity
           where it was for a moment instead of changing it, so that moment rests.
   Every change is checked by reading the film again with it applied in memory: a change that would not do
   what it says (or would make another stretch too long) is left out. The engine is never touched by plan();
   apply() sends the ticked changes as ONE engine batch, one undo step.

   Each change only ever touches its own column (one curiosity on one track), so any set of ticked changes
   applies cleanly. A column without automation points gets points in "hold" mode that keep every other moment
   exactly as it was (one lone point would set the whole column).

   Part of the momentum core (no page) plus a tab "Pace it" in the Momentum window when ui.js is loaded.

   window.CurioPacer
   - plan(input, profiles, opts) -> { before, after, target, limit, title, changes: [change] }
       input: the engine (window.CurioEngine, the default), anything with state(), or an engine state itself
       profiles: films to pace like (rates.js profiles); their average is the target (opts.target overrides)
       opts: { strength: "gentle" | "medium" | "strong" (2, 4 or 8 changes) or max: n, secondsPerBeat: 3, limit }
       before / after: { movesPerMinute, usualStretch, longestStretch, momentum, overLimit, moves, seconds }
       change: { row, rowLabel, at, track, trackLabel, curiosity, label, value, from, family, kind: "move" | "rest",
                 reason, text, commands }
   - preview(input, changes, opts) -> the numbers with only those changes applied (in memory)
   - apply(changes, title) -> the engine's reply: one batch, label "Momentum: pace like <title>"
   - numbers(reading), STRENGTH */
(function () {
  const root = typeof window !== "undefined" ? window : globalThis;
  const M = () => root.CurioMomentum;
  const A = () => root.CurioAttention;
  const R = () => root.CurioRates;
  const C = () => root.CurioCompass;
  const ME = () => root.CurioMomentumEngine;
  const S = () => root.CurioScale;
  const STRENGTH = { gentle: 2, medium: 4, strong: 8 };
  const SLOW = 0.75; /* fewer moves a minute than this share of your films: much less often */
  const RUSHED = 1.33; /* more than this: far more often (the same thresholds CurioRates.compare uses) */
  const round = (n, d) => Math.round(n * Math.pow(10, d || 0)) / Math.pow(10, d || 0);
  const clone = (x) => JSON.parse(JSON.stringify(x));
  const same = (a, b) => String(a) === String(b);
  const famLabel = (f) => (M().family(f) || { label: f }).label;
  const lk = (t, c) => t + "|" + c;

  /* ---------- the film in memory ---------- */
  function stateOf(input) {
    const src = input || root.CurioEngine;
    if (!src) return null;
    const st = typeof src.state === "function" ? src.state() : src;
    if (!st || !Array.isArray(st.rows) || !Array.isArray(st.tracks)) return null;
    return clone(st);
  }
  /* The engine's own rewrite, so the values are exactly the ones the engine would show. */
  function resultOf(st) {
    const E = root.CurioEngine;
    return E.rewrite(E.normalize ? E.normalize(clone(st)) : st).dest;
  }
  const cellOf = (dest, r, t, c) => dest[r + "|" + t + "|" + c];
  /* The same beats as CurioMomentumEngine.beats(): one per row, every curiosity on every track. */
  function beatsOf(st, dest) {
    return st.rows.map((r) => {
      const values = {};
      st.tracks.forEach((t) =>
        t.curiosities.forEach((c) => {
          const v = cellOf(dest, r.id, t.id, c);
          if (v != null && v !== "") values[c + "@" + t.id] = v;
        })
      );
      return { values, row: r.id, label: r.label };
    });
  }
  function column(st, dest, track, cur) {
    return st.rows.map((r) => cellOf(dest, r.id, track, cur));
  }
  /* Only the commands a change uses, carried out on a copy (the engine's own checks run again on apply). */
  function run(st, cmd) {
    const t = st.tracks.find((x) => x.id === cmd.track);
    if (!t) throw new Error("no track " + cmd.track);
    if (cmd.type === "addCuriosity") {
      if (!t.curiosities.includes(cmd.curiosity)) t.curiosities.push(cmd.curiosity);
    } else if (cmd.type === "setPoint") {
      st.lanes = st.lanes || {};
      const lane = st.lanes[lk(t.id, cmd.curiosity)] || (st.lanes[lk(t.id, cmd.curiosity)] = { on: true, mode: "ramp", points: {} });
      const v = S().fix ? S().fix(cmd.curiosity, cmd.value) : cmd.value;
      lane.points[cmd.row] = v == null ? cmd.value : v;
    } else if (cmd.type === "laneMode") {
      const lane = st.lanes && st.lanes[lk(t.id, cmd.curiosity)];
      if (!lane) throw new Error("no lane");
      lane.mode = cmd.mode;
    }
  }
  function applied(st, changes) {
    const next = clone(st);
    changes.forEach((c) => c.commands.forEach((cmd) => run(next, cmd)));
    return next;
  }
  function readState(st, opts) {
    const dest = resultOf(st);
    const beats = beatsOf(st, dest);
    return { dest, beats, reading: A().read(beats, { secondsPerBeat: opts.secondsPerBeat, limit: opts.limit }) };
  }

  /* ---------- the numbers ---------- */
  function numbers(reading) {
    const s = reading.stats;
    const runs = s.familyRuns || [];
    return {
      movesPerMinute: s.switchesPerMinute,
      usualStretch: s.medianFamilyRun,
      longestStretch: round(Math.max(0, ...runs.map((r) => r.dur)), 1),
      momentum: s.momentum,
      overLimit: (s.warnings || []).length,
      moves: (s.moves || []).length,
      seconds: reading.seconds,
    };
  }

  /* Seconds spent past the limit, all stretches together: a rest may never add to it. */
  const pastLimit = (stats, limit) => (stats.familyRuns || []).reduce((a, g) => a + Math.max(0, g.dur - limit), 0);

  /* ---------- one change on one column ---------- */
  /* The automation points that make a column read `want` exactly, given the column as it is now. */
  function pointsFor(st, track, cur, now, want, r, k) {
    const lane = st.lanes && st.lanes[lk(track, cur)];
    const rows = st.rows;
    const cmds = [];
    const set = (i, v) => cmds.push({ type: "setPoint", row: rows[i].id, track, curiosity: cur, value: v });
    if (!lane) {
      /* A new lane: a point wherever the value changes, held until the next. */
      want.forEach((v, i) => (i === 0 || !same(v, want[i - 1])) && set(i, v));
      cmds.push({ type: "laneMode", track, curiosity: cur, mode: "hold" });
      return cmds;
    }
    const has = (i) => Object.prototype.hasOwnProperty.call(lane.points, rows[i].id);
    if (r > 0 && !has(r - 1)) set(r - 1, now[r - 1]);
    set(r, want[r]);
    if (k - 1 > r && !has(k - 1)) set(k - 1, want[k - 1]);
    if (k < rows.length && !has(k)) set(k, now[k]);
    return cmds;
  }
  /* The column with rows r.. set to v until the column next changes on its own. */
  function wanted(now, r, v) {
    const want = now.slice();
    let k = r + 1;
    while (k < now.length && same(now[k], now[k - 1])) k++;
    for (let i = r; i < k; i++) want[i] = v;
    return { want, k };
  }
  /* Try a change in memory: it must give exactly the wanted column and pass check(reading). */
  function attempt(st, base, change, opts, check) {
    let next;
    try {
      next = applied(st, [change]);
    } catch (e) {
      return null;
    }
    const got = readState(next, opts);
    const col = column(next, got.dest, change.track, change.curiosity);
    if (!change.want.every((v, i) => same(v, col[i]))) return null;
    return check(got.reading) ? { st: next, read: got } : null;
  }
  /* CurioMomentumEngine.moveAt on the film in memory: it reads its engine through window.CurioEngine, so for
     this one synchronous call that name points at a read-only view of the copy. */
  function moveOn(st, dest, option, rowId) {
    const real = root.CurioEngine;
    const view = { state: () => clone(st), value: (r, t, c) => cellOf(dest, r, t, c) };
    root.CurioEngine = view;
    try {
      return ME().moveAt(option, rowId);
    } catch (e) {
      return null;
    } finally {
      root.CurioEngine = real;
    }
  }

  /* ---------- the plan ---------- */
  function plan(input, profiles, options) {
    const o = Object.assign({ secondsPerBeat: 3 }, options || {});
    const list = (profiles || []).filter(Boolean);
    const target = o.target || R().average(list);
    const st0 = stateOf(input);
    const empty = { before: null, after: null, target, changes: [], title: target ? target.title : "" };
    if (!st0 || !st0.rows.length || !target || !root.CurioEngine || !root.CurioEngine.rewrite) return empty;
    o.limit = Number(o.limit) > 0 ? Number(o.limit) : R().limitFor(target);
    const max = o.max != null ? o.max : STRENGTH[o.strength] || STRENGTH.medium;
    const step = Number(o.secondsPerBeat) > 0 ? Number(o.secondsPerBeat) : 3;
    const usual = target.medianFamilyRun || 8;
    const first = readState(st0, o);
    const before = numbers(first.reading);
    const changes = [];
    const touched = new Set();
    const tried = new Set();
    let st = st0;
    let cur = first;
    const rowAt = (sec) => Math.max(0, Math.min(st.rows.length - 1, Math.round(sec / step)));
    const trackLabel = (id) => (st.tracks.find((t) => t.id === id) || { label: id }).label;
    const clock = A().clock;

    while (changes.length < max) {
      const stats = cur.reading.stats;
      const spm = stats.switchesPerMinute;
      const slow = spm < target.switchesPerMinute * SLOW;
      const rushed = spm > target.switchesPerMinute * RUSHED;
      let made = null;

      /* 1. Too long: the longest stretch first. */
      const long = (stats.familyRuns || [])
        .filter((g) => g.dur > o.limit || (slow && g.dur > usual * 1.5))
        .filter((g) => !tried.has("m" + g.family + "@" + g.from))
        .sort((a, b) => b.dur - a.dur);
      for (const run of long) {
        if (made) break;
        tried.add("m" + run.family + "@" + run.from);
        const r0 = rowAt(run.from);
        const r1 = Math.min(st.rows.length - 1, rowAt(run.to) - 1);
        /* The right moment: about where your films usually move on, else as near it as works. */
        const ideal = Math.min(r1, r0 + Math.max(1, Math.floor(Math.min(usual, o.limit) / step)));
        const rows = [];
        for (let i = r0 + 1; i <= r1; i++) rows.push(i);
        rows.sort((a, b) => Math.abs(a - ideal) - Math.abs(b - ideal) || a - b);
        for (const i of rows) {
          if (made) break;
          const upTo = A().read(cur.beats.slice(0, i), { secondsPerBeat: step, limit: o.limit });
          const pointed = C().point(upTo, list.length ? list : [target]);
          for (const opt of pointed.options.slice(0, 6)) {
            const mv = moveOn(st, cur.dest, opt, st.rows[i].id);
            if (!mv || touched.has(lk(mv.track, mv.curiosity))) continue;
            const added = mv.commands.some((c) => c.type === "addCuriosity");
            const now = added ? st.rows.map(() => S().start(mv.curiosity)) : column(st, cur.dest, mv.track, mv.curiosity);
            const { want, k } = wanted(now, i, mv.value);
            const stView = added ? applied(st, [{ commands: mv.commands.filter((c) => c.type === "addCuriosity") }]) : st;
            const commands = mv.commands.filter((c) => c.type === "addCuriosity").concat(pointsFor(stView, mv.track, mv.curiosity, now, want, i, k));
            const n = M().note(mv.curiosity);
            const change = {
              kind: "move",
              row: st.rows[i].id,
              rowLabel: st.rows[i].label || "Moment " + (i + 1),
              at: round(i * step, 1),
              track: mv.track,
              trackLabel: trackLabel(mv.track),
              curiosity: mv.curiosity,
              label: mv.label || n.label,
              value: mv.value,
              from: added ? null : now[i],
              family: opt.family,
              want,
              commands,
            };
            const ok = attempt(st, cur, change, o, (rd) => rd.segments.some((g) => g.beat === i && g.family === opt.family));
            if (!ok) continue;
            const held = round(i * step - run.from);
            change.reason = `${famLabel(run.family)} holds attention for ${round(run.dur)} seconds from ${clock(run.from)}${run.dur > o.limit ? `, past the ${o.limit} second limit` : ""}. ${target.title} usually moves on after about ${round(usual, 1)} seconds, so this change comes ${held} seconds in. The Compass points to ${famLabel(opt.family)} next${opt.reasons && opt.reasons[0] ? ": " + opt.reasons[0] : "."}`;
            change.text = `At ${change.rowLabel} (${clock(change.at)}), ${added ? `add ${change.label} to ${change.trackLabel} and set it to ${mv.value}` : `change ${change.label} on ${change.trackLabel} from ${change.from} to ${mv.value}`}. Attention moves to ${famLabel(opt.family)}.`;
            made = { change, ok };
            break;
          }
        }
      }

      /* 2. Rushed: let the quickest move rest, where that does not make anything too long. */
      if (!made && rushed) {
        const segs = cur.reading.segments;
        const cands = [];
        for (let j = 1; j < segs.length; j++) {
          const a = segs[j - 1];
          const b = segs[j];
          if (tried.has("r" + b.beat) || !b.beat) continue;
          cands.push({ seg: b, prev: a, gap: a.dur, cross: a.family !== b.family });
        }
        /* The quickest moves first; a move inside one family before a move to another family (it costs less). */
        cands.sort((x, y) => x.gap - y.gap || x.cross - y.cross || x.seg.beat - y.seg.beat);
        for (const c of cands) {
          if (made) break;
          const i = c.seg.beat;
          tried.add("r" + i);
          const prevBeat = cur.beats[i - 1].values;
          const keys = Object.keys(cur.beats[i].values).filter((key) => {
            const [cid, tid] = key.split("@");
            return M().baseId(cid) === c.seg.curiosity && !same(cur.beats[i].values[key], prevBeat[key]) && prevBeat[key] != null && !touched.has(lk(tid, cid));
          });
          for (const key of keys) {
            const [cid, tid] = key.split("@");
            const now = column(st, cur.dest, tid, cid);
            const { want, k } = wanted(now, i, now[i - 1]);
            const change = {
              kind: "rest",
              row: st.rows[i].id,
              rowLabel: st.rows[i].label || "Moment " + (i + 1),
              at: round(i * step, 1),
              track: tid,
              trackLabel: trackLabel(tid),
              curiosity: cid,
              label: S().label ? S().label(cid) : M().note(cid).label,
              value: now[i - 1],
              from: now[i],
              family: c.prev.family,
              want,
              commands: pointsFor(st, tid, cid, now, want, i, k),
            };
            const moves = cur.reading.stats.switches;
            const ok = attempt(st, cur, change, o, (rd) => rd.stats.switches < moves && rd.stats.switchesPerMinute >= target.switchesPerMinute * SLOW && pastLimit(rd.stats, o.limit) <= pastLimit(stats, o.limit) + 1e-9);
            if (!ok) continue;
            change.reason = `Attention moves ${spm} times a minute in your film against about ${target.switchesPerMinute} in ${target.title}, so it may feel rushed. Here ${c.prev.label} (${famLabel(c.prev.family)}) had held it for only ${round(c.gap, 1)} seconds before ${c.seg.label} took it.`;
            change.text = `Let this moment rest: at ${change.rowLabel} (${clock(change.at)}), keep ${change.label} on ${change.trackLabel} at ${change.value} instead of changing it to ${change.from}. Attention stays on ${c.prev.label} a little longer.`;
            made = { change, ok };
            break;
          }
        }
      }

      if (!made) break;
      changes.push(made.change);
      touched.add(lk(made.change.track, made.change.curiosity));
      st = made.ok.st;
      cur = made.ok.read;
    }
    changes.forEach((c) => delete c.want);
    /* Changes in film order, so the list reads top to bottom. */
    const order = Object.fromEntries(st0.rows.map((r, i) => [r.id, i]));
    changes.sort((a, b) => order[a.row] - order[b.row]);
    return { before, after: numbers(cur.reading), target, limit: o.limit, title: target.title, changes };
  }

  /* The numbers with only some changes applied, in memory. */
  function preview(input, changes, options) {
    const o = Object.assign({ secondsPerBeat: 3 }, options || {});
    const st = stateOf(input);
    if (!st || !root.CurioEngine) return null;
    return numbers(readState(applied(st, changes || []), o).reading);
  }

  function labelFor(title) {
    return "Momentum: pace like " + (title || "your films");
  }
  /* The ticked changes as one engine batch: one undo step. */
  function apply(changes, title) {
    const E = root.CurioEngine;
    const list = (changes || []).filter(Boolean);
    if (!E) return { ok: false, error: "No engine here." };
    if (!list.length) return { ok: false, error: "Tick at least one change first." };
    return E.send({ type: "batch", label: labelFor(title), commands: list.reduce((all, c) => all.concat(c.commands), []) });
  }

  const api = { plan, preview, apply, numbers, labelFor, STRENGTH };
  root.CurioPacer = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;

  /* ---------- the tab "Pace it" in the Momentum window ---------- */
  if (typeof document === "undefined") return;
  const COLORS = { feeling: "#2a78d6", plot: "#eb6834", voice: "#1baf7a", comedy: "#eda100", movement: "#e87ba4", music: "#008300", camera: "#4a3aa7", place: "#e34948" };
  const OTHER = "#a8a39a";
  const colorOf = (f) => COLORS[f] || OTHER;
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const ui = { like: null, strength: "medium", off: new Set(), flash: "" };
  const keyOf = (c) => [c.kind, c.row, c.track, c.curiosity].join("|");
  function statusOf(sec, lim) {
    const r = sec / (lim || 20);
    if (r < 0.75) return { cls: "good", icon: "●", text: "Fresh" };
    if (r <= 1) return { cls: "warn", icon: "▲", text: "Getting long" };
    return { cls: "crit", icon: "■", text: "Too long" };
  }
  function choices(ctx) {
    const picked = ctx.profiles();
    const out = [];
    if (picked.length > 1) out.push({ id: "avg", label: `The films you compare with (the average of ${picked.length})`, list: picked });
    (picked.length ? picked : ctx.allProfiles()).forEach((p) => out.push({ id: p.id, label: p.title + (p.estimate ? " (estimate)" : ""), list: [p] }));
    return out;
  }
  function numbersTable(now, after, target, lim) {
    const fmt = (v, unit) => (v == null ? "–" : v + (unit || ""));
    const stretch = (v) => {
      if (v == null) return "–";
      const st = statusOf(v, lim);
      return `${v} s <span class="mo-status mo-${st.cls}">${st.icon} ${st.text}</span>`;
    };
    const row = (label, a, b, c) => `<tr><th scope="row">${label}</th><td>${a}</td><td>${b}</td><td>${c}</td></tr>`;
    return `<div class="mo-scroll"><table class="pc-nums"><thead><tr><th></th><th>Your film now</th><th>With the ticked changes</th><th>${esc(target.title)}</th></tr></thead><tbody>
      ${row("Moves a minute", fmt(now.movesPerMinute), fmt(after.movesPerMinute), fmt(target.switchesPerMinute))}
      ${row("Usual stretch on one family", fmt(now.usualStretch, " s"), fmt(after.usualStretch, " s"), fmt(target.medianFamilyRun, " s"))}
      ${row("Longest stretch on one family", stretch(now.longestStretch), stretch(after.longestStretch), "–")}
      ${row("Momentum reading (0 to 5)", fmt(now.momentum), fmt(after.momentum), "–")}
      ${row("Stretches past the limit", fmt(now.overLimit), fmt(after.overLimit), "–")}
      </tbody></table></div>`;
  }
  function mount(el, ctx) {
    const E = root.CurioEngine;
    if (!ME() || !ME().available()) {
      el.innerHTML = `<p>Pace it plans small changes to My film (the engine's film, the one the Screen plays) so that attention moves about as often as in the films you love. Start a film in the engine first (Library, Engine), then come back here.</p>${root.CurioEngineUI ? `<button type="button" data-pc="engine">Open the engine</button>` : ""}`;
      wireOnce(el, ctx);
      return;
    }
    const opts = choices(ctx);
    if (!opts.some((c) => c.id === ui.like)) ui.like = opts[0] ? opts[0].id : null;
    const like = opts.find((c) => c.id === ui.like);
    if (!like) {
      el.innerHTML = `<p>Pick a film to compare with first (Attention, Compare with).</p>`;
      return;
    }
    const target = R().average(like.list);
    const own = ctx.prefs().limit;
    const lim = own || R().limitFor(target);
    const step = ctx.secondsPerBeat();
    const p = plan(E, like.list, { strength: ui.strength, secondsPerBeat: step, limit: lim });
    ui.last = p;
    const ticked = p.changes.filter((c) => !ui.off.has(keyOf(c)));
    const after = ticked.length === p.changes.length ? p.after : preview(E, ticked, { secondsPerBeat: step, limit: lim });
    const said = ui.flash;
    ui.flash = "";
    const strengths = [
      ["gentle", "Gentle", "up to 2 changes"],
      ["medium", "Medium", "up to 4 changes"],
      ["strong", "Strong", "up to 8 changes"],
    ];
    const items = p.changes
      .map((c, i) => {
        const tag = c.kind === "rest" ? `<span class="pc-tag pc-rest">Let it rest</span>` : `<span class="pc-tag pc-move">Move attention</span>`;
        return `<li class="pc-change"><label><input type="checkbox" data-pc-tick="${i}"${ui.off.has(keyOf(c)) ? "" : " checked"} />
          <span class="pc-what"><span class="pc-head">${tag}<span class="mo-fam"><i style="background:${colorOf(c.family)}"></i>${esc(famLabel(c.family))}</span></span>
          <span class="pc-text">${esc(c.text)}</span>
          <small class="pc-why"><b>Why:</b> ${esc(c.reason)}</small></span></label></li>`;
      })
      .join("");
    el.innerHTML = `<div class="pc-root">
      ${said ? `<div class="mo-flash" role="status">${esc(said)}</div>` : ""}
      <p>Pace My film like the films you love. This reads My film (the engine's film, the one the Screen plays) for attention, compares how often attention moves with the film you pick, and plans a few small changes: a new change where one family holds attention too long, or a moment left to rest where attention moves far more often than in your film. Nothing changes until you apply them.</p>
      <div class="mo-controls">
        <label>Pace it like <select data-pc="like">${opts.map((c) => `<option value="${esc(c.id)}"${c.id === ui.like ? " selected" : ""}>${esc(c.label)}</option>`).join("")}</select></label>
        <fieldset class="pc-strength"><legend>How many changes</legend>${strengths.map(([id, l, n]) => `<label><input type="radio" name="pc-strength" value="${id}" data-pc="strength"${ui.strength === id ? " checked" : ""} /> ${l} <small>(${n})</small></label>`).join("")}</fieldset>
      </div>
      <section><h3>Before and after</h3>${numbersTable(p.before, after, target, p.limit)}
      <p class="mo-small">The after numbers come from reading My film again with the ticked changes applied in memory. One family may hold attention for ${p.limit} seconds before it counts as too long${own ? " (your own limit)" : ` (2.5 times the usual stretch in ${esc(target.title)})`}. Each moment lasts ${step} seconds.</p></section>
      <section><h3>Planned changes</h3>${
        p.changes.length
          ? `<ul class="pc-list">${items}</ul>
            <div class="mo-controls"><button type="button" data-pc="apply"${ticked.length ? "" : " disabled"}>Apply the ticked changes (${ticked.length})</button></div>
            <p class="mo-small">All the ticked changes go into the engine as one step, named "${esc(labelFor(p.title))}", so one Undo in the engine takes them all back.</p>`
          : `<p class="mo-small"><span class="mo-status mo-good">●</span> Nothing to change at this strength: My film already moves attention about as often as ${esc(target.title)}, and no family holds it past the limit.</p>`
      }</section>
      ${root.CurioEngineUI ? `<button type="button" class="pc-open" data-pc="engine">Open the engine</button>` : ""}
    </div>`;
    wireOnce(el, ctx);
  }
  function wireOnce(el, ctx) {
    if (el.__pcWired) return;
    el.__pcWired = true;
    const redraw = () => mount(el, ctx);
    el.addEventListener("change", (e) => {
      const t = e.target;
      if (t.dataset.pc === "like") {
        ui.like = t.value;
        ui.off.clear();
        redraw();
      } else if (t.dataset.pc === "strength") {
        ui.strength = t.value;
        ui.off.clear();
        redraw();
      } else if (t.dataset.pcTick != null) {
        const c = ui.last && ui.last.changes[Number(t.dataset.pcTick)];
        if (!c) return;
        if (t.checked) ui.off.delete(keyOf(c));
        else ui.off.add(keyOf(c));
        redraw();
      }
    });
    el.addEventListener("click", (e) => {
      const t = e.target.closest("button");
      if (!t || !el.contains(t)) return;
      if (t.dataset.pc === "apply") {
        const p = ui.last;
        const ticked = p ? p.changes.filter((c) => !ui.off.has(keyOf(c))) : [];
        const res = apply(ticked, p && p.title);
        ui.flash = res && res.ok ? `Applied ${ticked.length} change${ticked.length === 1 ? "" : "s"} to My film as one step. Undo in the engine takes ${ticked.length === 1 ? "it" : "them all"} back.` : "The engine said: " + ((res && res.error) || "no");
        ui.off.clear();
        redraw();
      } else if (t.dataset.pc === "engine" && root.CurioEngineUI && root.CurioEngineUI.open) {
        const U = root.CurioMomentumUI;
        if (U && U.close) U.close();
        root.CurioEngineUI.open();
      }
    });
  }
  function register() {
    return !!(root.CurioMomentumUI && root.CurioMomentumUI.addTab({ id: "pace", label: "Pace it", mount }));
  }
  if (!register()) {
    let tries = 0;
    const t = setInterval(() => (register() || ++tries > 100) && clearInterval(t), 100);
  }
})();
