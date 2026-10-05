/* momentum/home.js: the "Home" tab, the first tab of the Momentum window and the one it opens on until the
   person picks another. A beginner sees, for the chosen film, in plain words:
     1. one sentence on the film's momentum right now (moving well, resting too long in N places, or too fast),
        with the attention strip under it (who holds attention, across the whole film);
     2. "Do this next": up to three cards, each one action with a button that opens the tab that does it
        (Autopilot, Pace it, Versions, Watch and tap, Learn it, On the engine, Compass);
     3. a map of every group: one line saying what the group is for, and every tab name as a button.
   The yellow "Start here" line of ui.js stays as it was; Home adds a Learn it card only while that line has
   not been followed, so the two say the same thing.

   Home only reads what other tabs keep (versions, autopilot, tap, the Start here mark), and only when the key
   exists; it never writes them and keeps nothing of its own.

   window.CurioHome (the pure parts work in Node)
   - verdict(reading, { target }) -> { key: "none"|"over"|"long"|"fast"|"good", text, status, longest }
       status: CurioMomentum.status of the longest stretch one family held attention, against the limit
   - cards(reading, state) -> up to three [{ id, tab, text, button }], most useful first
       state: { tabs: [tab ids that exist], mine: the film is My film or one of its scenes, target,
                versions: versions kept of this film, autopilot: changes Autopilot made, measured: measured
                films, tapping: a Watch and tap session started and not saved, lessonSeen }
   - features(storage, { film, measured, studies }) -> the state's counts, read from storage.getItem only
   - KEYS: the localStorage keys features() reads */
(function () {
  const root = typeof window !== "undefined" ? window : globalThis;
  const M = () => root.CurioMomentum;
  const A = () => root.CurioAttention;
  const round = (n) => Math.round(n);
  const famLabel = (f) => (M().family(f) || { label: f }).label;
  const clock = (s) => (A() && A().clock ? A().clock(s) : String(round(s)) + " s");
  const KEYS = {
    versions: "curiosities-momentum-versions-v1",
    autopilot: "curiosities-momentum-autopilot-v1",
    tap: "curiosities-momentum-tap-v1",
    start: "curiosities-momentum-start-v1",
  };
  /* Faster than this many times the films you compare with is "too fast" (or 20 moves a minute with none). */
  const FAST = 2;

  function longestRun(reading) {
    const runs = (reading && reading.stats && reading.stats.familyRuns) || [];
    return runs.reduce((a, r) => (!a || r.dur > a.dur ? r : a), null);
  }
  function isFast(reading, target) {
    const s = reading.stats || {};
    const spm = Number(s.switchesPerMinute) || 0;
    const usual = target && Number(target.switchesPerMinute) > 0 ? Number(target.switchesPerMinute) : 10;
    return (reading.segments || []).length >= 4 && spm > usual * FAST;
  }

  function verdict(reading, opts) {
    const o = opts || {};
    const limit = (reading && reading.limit) || 20;
    const segs = (reading && reading.segments) || [];
    const run = longestRun(reading);
    const status = M().status(run ? run.dur : null, limit);
    if (!reading || !segs.length) return { key: "none", text: "This film has no moments to read yet, so there is no momentum to show.", status, longest: null };
    const warn = reading.warnings || [];
    const longest = { family: run.family, label: famLabel(run.family), dur: round(run.dur), from: run.from };
    if (warn.length) {
      const n = warn.length;
      return { key: "over", text: `Attention rests too long in ${n === 1 ? "one place" : n + " places"}: the longest is ${longest.dur} seconds on ${longest.label}, past the ${limit} second limit.`, status, longest };
    }
    const median = (reading.stats && reading.stats.medianDwell) || 0;
    if (isFast(reading, o.target)) return { key: "fast", text: `Attention moves too fast: it rests only about ${median} seconds at a time, so little has time to land.`, status, longest };
    if (status.key === "long") return { key: "long", text: `Momentum is moving well, but one stretch of ${longest.dur} seconds on ${longest.label} is getting close to the ${limit} second limit.`, status, longest };
    return { key: "good", text: `Momentum is moving well: attention moves on about every ${median} seconds and nothing holds it past the ${limit} second limit.`, status, longest };
  }

  function cards(reading, state) {
    const st = Object.assign({ tabs: null, mine: false, versions: 0, autopilot: 0, measured: 0, tapping: false, lessonSeen: true }, state || {});
    const has = (t) => !st.tabs || st.tabs.includes(t);
    const v = verdict(reading, { target: st.target });
    const out = [];
    const add = (id, tab, text, button) => has(tab) && !out.some((c) => c.tab === tab) && out.push({ id, tab, text, button });
    if (v.key === "none") {
      if (st.mine) add("empty", "engine", "This film has no moments yet. Start the example film on the On the engine tab, or pick a curated film above.", "Open On the engine");
      else add("empty", "attention", "This film has no moments yet. Pick another film above, or open Attention to choose one.", "Open Attention");
    }
    if (v.key === "over") {
      const w = (reading.warnings || []).reduce((a, x) => (!a || x.dur > a.dur ? x : a), null);
      const more = reading.warnings.length - 1;
      const where = `Attention rests on ${famLabel(w.family)} for ${round(w.dur)} seconds at ${clock(w.from)}${more > 0 ? ` (and in ${more} more place${more === 1 ? "" : "s"})` : ""}.`;
      if (has("autopilot")) add("fix", "autopilot", `${where} ${st.autopilot ? "Autopilot made changes before; look at what it would do now." : "Autopilot can fix it."}`, "Open Autopilot");
      else add("fix", "compass", `${where} The Compass shows what to move attention to next.`, "Open Compass");
    }
    if (v.key === "fast") add("fast", "pace", `Attention moves about every ${(reading.stats && reading.stats.medianDwell) || 0} seconds, faster than the films you compare with. Pace it shows where to let it rest longer.`, "Open Pace it");
    if (v.key === "long") add("long", "compass", `${v.longest.label} holds attention for ${v.longest.dur} seconds from ${clock(v.longest.from)}, close to the limit. The Compass shows what could take attention next.`, "Open Compass");
    if (!st.lessonSeen) add("lesson", "lesson", "New to film words? Learn it walks through a film one moment at a time, in plain words.", "Open Learn it");
    if (v.key !== "none") {
      if (!st.versions) add("versions", "versions", "You haven't compared versions yet. Keep this version now, so you can tell later whether a change made the film feel more alive.", "Open Versions");
      else if (st.versions === 1) add("versions", "versions", "You kept one version of this film. Change something, then compare the two side by side.", "Open Versions");
    }
    if (!st.measured) add("tap", "tap", st.tapping ? "You started tapping a film in Watch and tap. Finish and save it, so the comparisons use real numbers instead of guesses." : "No measured film yet: tap one in Watch and tap, so the comparisons use real numbers instead of guesses.", "Open Watch and tap");
    if (v.key === "good") add("next", "compass", "To keep it moving, the Compass shows which kind of curiosity to move attention to next.", "Open Compass");
    if (out.length < 3 && v.key !== "none") add("look", "attention", "See every moment of this film, the cue that moved attention and how long it stayed, in Attention.", "Open Attention");
    return out.slice(0, 3);
  }

  /* What the other tabs keep, read only when the key is there. storage needs only getItem. */
  function features(storage, opts) {
    const o = opts || {};
    const read = (k) => {
      try {
        const raw = storage && storage.getItem(k);
        return raw == null ? null : JSON.parse(raw);
      } catch (e) {
        return null;
      }
    };
    let raw = null;
    try {
      raw = storage ? storage.getItem(KEYS.start) : null;
    } catch (e) {}
    const vs = read(KEYS.versions);
    const ap = read(KEYS.autopilot);
    const tap = read(KEYS.tap);
    const versions = vs && Array.isArray(vs.versions) ? vs.versions.filter((x) => x && (o.film == null || x.film === o.film)).length : 0;
    const tapped = (o.studies || []).filter((s) => s && s.camera === "measured").length;
    return {
      versions,
      autopilot: ap && Array.isArray(ap.steps) ? ap.steps.length : 0,
      tapping: !!(tap && Array.isArray(tap.taps) && tap.taps.length),
      measured: (Number(o.measured) || 0) + tapped,
      lessonSeen: raw === "1",
    };
  }

  const api = { verdict, cards, features, KEYS, FAST };
  root.CurioHome = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;

  /* ---------- the tab "Home" in the Momentum window ---------- */
  if (typeof document === "undefined") return;
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const MINE = /^(live|board|engine|sb:)/;

  function stripHtml(reading) {
    const segs = reading.segments || [];
    const total = reading.seconds || segs.reduce((a, s) => a + s.dur, 0) || 1;
    const runs = A().familyRuns(segs);
    const cells = runs
      .map((r) => {
        const mk = M().mark(r.family);
        const st = M().status(r.dur, reading.limit);
        const flag = st.key === "fresh" ? "" : `<b>${st.icon}</b>`;
        const tip = `${mk.label}, ${round(r.dur)} seconds from ${clock(r.from)}: ${st.words}`;
        return `<li style="flex:${Math.max(0.001, r.dur / total)} 1 0;background:${mk.color};color:${mk.ink}" title="${esc(tip)}"><span>${esc(mk.letter)}</span>${flag}</li>`;
      })
      .join("");
    const fams = [...new Set(runs.map((r) => r.family))];
    const key = fams.map((f) => {
      const mk = M().mark(f);
      return `<span class="mh-key"><i style="background:${mk.color};color:${mk.ink}">${esc(mk.letter)}</i>${esc(mk.label)}</span>`;
    });
    return `<ol class="mh-strip" aria-label="Who holds attention across the film, start to end">${cells}</ol><div class="mh-legend">${key.join("")}</div>`;
  }

  function mount(el, ctx) {
    const src = ctx.source();
    const list = ctx.sources();
    const reading = ctx.readSource(src);
    const tabs = ctx.tabs ? ctx.tabs() : [];
    const ids = tabs.reduce((a, g) => a.concat(g.tabs.map((t) => t.id)), []);
    let studies = [];
    try {
      studies = root.CuriosityStudy && typeof root.CuriosityStudy.studies === "function" ? root.CuriosityStudy.studies() : [];
    } catch (e) {}
    const target = ctx.target();
    let store = null;
    try {
      store = root.localStorage;
    } catch (e) {}
    const state = Object.assign(features(store, { film: src, measured: (ctx.prefs().measured || []).length, studies }), { tabs: ids, mine: MINE.test(src), target });
    const v = verdict(reading, { target });
    const todo = cards(reading, state);
    const label = (list.find((s) => s.id === src) || {}).label || "this film";
    el.innerHTML = `<div class="mh-root">
      <section class="mh-now">
        <div class="mh-pick"><label>Film ${ctx.sourcePicker('data-mh="source"')}</label></div>
        <p class="mh-verdict mh-${v.key}">${esc(v.text)}</p>
        ${v.longest ? `<p class="mo-small">Longest stretch on one kind of curiosity: ${v.longest.dur} seconds on ${esc(v.longest.label)} <span class="mo-status mo-${v.status.cls}">${v.status.icon} ${esc(v.status.words)}</span></p>` : ""}
        ${reading.segments && reading.segments.length ? stripHtml(reading) : ""}
      </section>
      <section class="mh-next">
        <h3>Do this next</h3>
        <ol class="mh-cards">${todo.map((c) => `<li class="mh-card" data-card="${esc(c.id)}"><p>${esc(c.text)}</p><button type="button" data-mh-open="${esc(c.tab)}">${esc(c.button)}</button></li>`).join("")}</ol>
        <p class="mo-small">For ${esc(label)}. These change as you change the film or try other tabs.</p>
      </section>
      <section class="mh-map">
        <h3>Every tab, by what it is for</h3>
        <dl>${tabs
          .map((g) => `<dt>${esc(g.label)}</dt><dd><p>${esc(String(g.hint || "").replace(/^[^:]*:\s*/, "").replace(/^./, (c) => c.toUpperCase()))}</p><div class="mh-tabs">${g.tabs.filter((t) => t.id !== "home").map((t) => `<button type="button" data-mh-open="${esc(t.id)}">${esc(t.label)}</button>`).join("")}</div></dd>`)
          .join("")}</dl>
      </section>
    </div>`;
    el.onclick = (e) => {
      const b = e.target.closest("button[data-mh-open]");
      if (b && ctx.open) ctx.open(b.dataset.mhOpen);
    };
    el.onchange = (e) => {
      if (e.target.dataset.mh === "source") {
        ctx.setSource(e.target.value);
        ctx.refresh();
      }
    };
  }

  function register() {
    return !!(root.CurioMomentumUI && root.CurioMomentumUI.addTab({ id: "home", label: "Home", group: "see", after: "start", mount }));
  }
  if (!register()) {
    let tries = 0;
    const t = setInterval(() => (register() || ++tries > 100) && clearInterval(t), 100);
  }
})();
