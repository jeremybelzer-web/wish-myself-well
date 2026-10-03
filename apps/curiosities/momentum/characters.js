/* momentum/characters.js: attention by character ("Who we watch"). The engine's film has a track for each
   character (CurioEngine.state().tracks with kind "character"). Momentum reads the film one beat per row with
   every value keyed "curiosity@track" (engine-lanes.js beats()), and the attention model keeps only the
   curiosity that took attention. This file works out whose change it was: at the beat a stretch starts, the
   track whose value of that curiosity changed (the biggest change when two did). When the same curiosity
   changes again on another track (one character's voice, then another's), the stretch goes on but the person
   we watch moves to the one who changed. Master and Camera count as "the film itself", not a character.

   Part of the momentum core (no page) plus a tab in the Momentum window, "Who we watch" (when ui.js is here).

   window.CurioWatch
   - watch(film, opts) -> { characters, film, strip, warnings, seconds, gapLimit, reading }
       film: { rows: [{ id, label }], tracks: [{ id, kind, label, curiosities }], value(row, track, cur) }
         (CurioEngine.state() with CurioEngine.value works as is)
       opts: { secondsPerBeat: 3, limit (the family limit, for the reading), gapLimit (seconds a character may
               go unwatched; default twice the limit, at least 30) }
       characters: [{ id, label, seconds, share 0..1, longestGap, gapFrom, gapTo, never, status,
                      families: [{ family, label, seconds }] }]  sorted, most watched first
       film: { seconds, share } the time the film itself (Master, Camera) holds attention
       strip: [{ row, label, who (track id, "film", or null), curiosity, family }] one per row
       warnings: [{ character, text }]
   - fromEngine(opts) -> watch() of the engine's film, or null when there is no engine film. */
(function () {
  const root = typeof window !== "undefined" ? window : globalThis;
  const A = () => root.CurioAttention;
  const M = () => root.CurioMomentum;
  const FILM = "film";

  const round = (n, d) => Math.round(n * Math.pow(10, d || 0)) / Math.pow(10, d || 0);
  const clock = (s) => {
    s = Math.max(0, Math.round(s));
    return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
  };
  const famLabel = (f) => ((M() && M().family(f)) || { label: f }).label;

  /* How big a change is, roughly: steps along a list, or the numeric difference. Only used to choose between
     two tracks whose same curiosity changed at the same beat. */
  function size(id, before, after) {
    if (before === undefined) return 0.6;
    if (String(before) === String(after)) return 0;
    const c = M() && M().find ? M().find(M().baseId(id)) : null;
    const list = c && (c.options || (c.sliders && c.sliders[0] && c.sliders[0].scale));
    if (Array.isArray(list)) {
      const a = list.indexOf(before);
      const b = list.indexOf(after);
      if (a >= 0 && b >= 0) return 0.35 + Math.abs(a - b) / Math.max(1, list.length - 1);
    }
    const x = Number(before);
    const y = Number(after);
    if (isFinite(x) && isFinite(y)) return 0.25 + Math.abs(x - y) / Math.max(5, Math.abs(x), Math.abs(y));
    return 0.6;
  }

  function watch(film, options) {
    const opts = Object.assign({ secondsPerBeat: 3 }, options || {});
    const step = Number(opts.secondsPerBeat) > 0 ? Number(opts.secondsPerBeat) : 3;
    const rows = (film && film.rows) || [];
    const tracks = (film && film.tracks) || [];
    const value = (film && film.value) || (() => null);
    const chars = tracks.filter((t) => t.kind === "character");
    const kindOf = {};
    tracks.forEach((t) => (kindOf[t.id] = t.kind));
    const whoOf = (track) => (kindOf[track] === "character" ? track : FILM);

    /* The film as beats, every value keyed "curiosity@track" (the same as engine-lanes.js). */
    const beats = rows.map((r) => {
      const values = {};
      tracks.forEach((t) =>
        (t.curiosities || []).forEach((c) => {
          const v = value(r.id, t.id, c);
          if (v != null && v !== "") values[c + "@" + t.id] = v;
        })
      );
      return { values, row: r.id, label: r.label };
    });
    const readOpts = { secondsPerBeat: step };
    if (Number(opts.limit) > 0) readOpts.limit = Number(opts.limit);
    const reading = A().read(beats, readOpts);
    const limit = reading.limit;
    const gapLimit = Number(opts.gapLimit) > 0 ? Number(opts.gapLimit) : Math.max(30, limit * 2);

    /* Whose change took attention, beat by beat. */
    const segAt = new Array(beats.length).fill(null);
    reading.segments.forEach((s) => {
      for (let i = s.beat; i < beats.length; i++) segAt[i] = s;
    });
    const strip = [];
    let who = null;
    let seg = null;
    beats.forEach((b, i) => {
      const s = segAt[i];
      if (s !== seg) who = null;
      seg = s;
      if (s) {
        let best = null;
        Object.keys(b.values).forEach((k) => {
          if (M().baseId(k) !== s.curiosity) return;
          const before = i > 0 ? beats[i - 1].values[k] : undefined;
          const sz = size(k, before, b.values[k]);
          if (sz > 0 && (!best || sz > best.sz)) best = { k, sz };
        });
        if (best) who = whoOf(best.k.split("@")[1]);
      }
      strip.push({ row: b.row, label: b.label, who: s ? who : null, curiosity: s ? s.curiosity : null, family: s ? s.family : null });
    });

    /* Time per character, the longest stretch unwatched, and the families they pull attention with. */
    const total = beats.length * step;
    const characters = chars.map((t) => {
      let seconds = 0;
      const fams = {};
      let gap = 0;
      let gapStart = 0;
      let longest = { dur: 0, from: 0, to: 0 };
      strip.forEach((x, i) => {
        if (x.who === t.id) {
          seconds += step;
          fams[x.family] = (fams[x.family] || 0) + step;
          gap = 0;
        } else {
          if (!gap) gapStart = i;
          gap += step;
          if (gap > longest.dur) longest = { dur: gap, from: gapStart * step, to: (i + 1) * step };
        }
      });
      const families = Object.entries(fams)
        .sort((a, b) => b[1] - a[1])
        .map(([family, s]) => ({ family, label: famLabel(family), seconds: round(s, 1) }));
      const r = longest.dur / gapLimit;
      const status = seconds === 0 ? "crit" : M().status(longest.dur, gapLimit).cls;
      return { id: t.id, label: t.label || t.id, seconds: round(seconds, 1), share: total ? round(seconds / total, 3) : 0, longestGap: round(longest.dur, 1), gapFrom: longest.from, gapTo: longest.to, never: seconds === 0, status, families };
    });
    characters.sort((a, b) => b.seconds - a.seconds || a.label.localeCompare(b.label));
    const filmSeconds = strip.filter((x) => x.who === FILM).length * step;

    const warnings = [];
    characters
      .slice()
      .reverse()
      .forEach((c) => {
        if (!rows.length) return;
        if (c.never) warnings.push({ character: c.id, text: `${c.label} never holds attention in this film. Give ${c.label} a line, a look or a move.` });
        else if (c.longestGap > gapLimit)
          warnings.push({ character: c.id, text: `${c.label} has not held attention for ${Math.round(c.longestGap)} seconds (from ${clock(c.gapFrom)} to ${clock(c.gapTo)}). Give ${c.label} a line, a look or a move.` });
      });

    return { characters, film: { seconds: round(filmSeconds, 1), share: total ? round(filmSeconds / total, 3) : 0 }, strip, warnings, seconds: total, gapLimit, limit, reading };
  }

  function fromEngine(opts) {
    const E = root.CurioEngine;
    if (!E || !E.state) return null;
    const st = E.state();
    if (!st.rows || !st.rows.length) return null;
    return watch({ rows: st.rows, tracks: st.tracks, value: (r, t, c) => E.value(r, t, c) }, opts);
  }

  const api = { watch, fromEngine, FILM };
  root.CurioWatch = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;

  /* ---------- the tab ---------- */
  if (typeof document === "undefined") return;
  /* Family colors and the status marks come from notes.js (CurioMomentum.mark, CurioMomentum.status). */
  const OTHER = M().OTHER;
  /* Characters take the same validated colors in order; the film itself is gray. */
  const PALETTE = Object.values(M().COLORS);
  const STATUS_KEY = { good: "fresh", warn: "long", crit: "over" };
  const esc = (s) =>
    String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  const pct = (x) => Math.round((x || 0) * 100) + "%";

  let unhook = null;
  let mounted = null;

  function mount(el, ctx) {
    mounted = { el, ctx };
    const E = root.CurioEngine;
    if (E && E.on && !unhook)
      unhook = E.on(() => {
        if (!mounted || !mounted.el.isConnected) {
          if (unhook) unhook();
          unhook = null;
          mounted = null;
          return;
        }
        draw(mounted.el, mounted.ctx);
      });
    draw(el, ctx);
    el.addEventListener("change", (e) => {
      if (e.target.matches("select[data-watch-source]")) {
        ctx.setSource(e.target.value);
        ctx.refresh();
      }
    });
    el.addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (!b || !el.contains(b)) return;
      if (b.dataset.watch === "engine") {
        ctx.setSource("engine");
        ctx.refresh();
      } else if (b.dataset.watch === "open-engine") {
        if (root.CurioEngineUI && root.CurioEngineUI.open) {
          if (root.CurioMomentumUI) root.CurioMomentumUI.close();
          root.CurioEngineUI.open();
        }
      } else if (b.dataset.row != null) {
        const i = Number(b.dataset.row);
        el.querySelectorAll(".mo-w-strip button").forEach((x) => x.classList.toggle("on", x === b));
        const S = root.CurioScreen;
        const said = el.querySelector(".mo-w-said");
        if (S && typeof S.setRow === "function") {
          S.setRow(i);
          if (said) said.textContent = `The Screen's playhead is now at ${b.dataset.label}.`;
        } else if (said) said.textContent = `${b.dataset.label}: ${b.title}. Open the Screen to move its playhead here.`;
      }
    });
  }

  function draw(el, ctx) {
    const picker = `<div class="mo-controls"><label>Film ${ctx.sourcePicker("data-watch-source")}</label></div>`;
    const engineHere = root.CurioMomentumEngine && root.CurioMomentumEngine.available();
    if (ctx.source() !== "engine") {
      el.innerHTML = `<div class="mo-w">${picker}<div class="mo-w-none"><p>This film has no characters to follow. Only the engine's film keeps a track for each character, so only it can show who the audience watches.</p>
        ${engineHere ? `<button type="button" data-watch="engine">Read the engine's film</button>` : `<p class="mo-small">My film has no moments yet. Press Start the example film to get one with characters, or open the engine to start your own.</p><div class="mo-controls">${root.CurioMomentumUI && root.CurioMomentumUI.startFilmButton ? root.CurioMomentumUI.startFilmButton() : ""}${root.CurioEngineUI ? `<button type="button" data-watch="open-engine">Open the engine</button>` : ""}</div>`}</div></div>`;
      return;
    }
    const res = fromEngine({ secondsPerBeat: ctx.secondsPerBeat(), limit: ctx.limit() });
    if (!res) {
      el.innerHTML = `${picker}<p class="mo-empty">My film has no moments yet. Press Start the example film to get one with characters, or open the engine to start your own.</p><div class="mo-controls">${root.CurioMomentumUI && root.CurioMomentumUI.startFilmButton ? root.CurioMomentumUI.startFilmButton() : ""}${root.CurioEngineUI ? `<button type="button" data-watch="open-engine">Open the engine</button>` : ""}</div>`;
      return;
    }
    if (!res.characters.length) {
      el.innerHTML = `${picker}<p class="mo-empty">The engine's film has no character tracks yet, so only the film itself (Master and Camera) holds attention. Add a character in the engine to see who we watch.</p>`;
      return;
    }
    const color = {};
    const byTrack = res.characters.slice().sort((a, b) => a.id.localeCompare(b.id));
    byTrack.forEach((c, i) => (color[c.id] = PALETTE[i % PALETTE.length]));
    color[FILM] = OTHER;
    /* A letter on each strip cell, so the strip never relies on color alone; two letters when names share one. */
    const mark = { [FILM]: "F" };
    const taken = new Set(["F"]);
    byTrack.forEach((c) => {
      const name = String(c.label).trim() || c.id;
      let m = name.charAt(0).toUpperCase();
      for (let k = 2; taken.has(m) && k <= name.length; k++) m = name.slice(0, k);
      if (taken.has(m)) m = name.charAt(0).toUpperCase() + (byTrack.indexOf(c) + 1);
      taken.add(m);
      mark[c.id] = m;
    });
    const nameOf = (id) => (id === FILM ? "The film itself" : (res.characters.find((c) => c.id === id) || { label: id }).label);
    const max = Math.max(res.film.seconds, ...res.characters.map((c) => c.seconds), 1);

    const bar = (c, isFilm) => {
      const st = M().STATUS[STATUS_KEY[c.status] || "fresh"];
      return `<li class="mo-w-row">
        <span class="mo-w-name"><i style="background:${isFilm ? OTHER : color[c.id]}"></i>${esc(isFilm ? "The film itself" : c.label)}</span>
        <span class="mo-w-bar"><span style="width:${((c.seconds / max) * 100).toFixed(1)}%;background:${isFilm ? OTHER : color[c.id]}"></span></span>
        <span class="mo-w-n">${Math.round(c.seconds)} s <small>(${pct(c.share)})</small></span>
        ${isFilm ? `<span class="mo-w-gap mo-small">Master and Camera</span>` : `<span class="mo-w-gap">${c.never ? `<span class="mo-status mo-crit">■ Never watched</span>` : `Longest unwatched: ${Math.round(c.longestGap)} s <span class="mo-status mo-${c.status}">${st.icon} ${st.words}</span>`}</span>`}
      </li>`;
    };
    const bars = res.characters.map((c) => bar(c, false)).join("") + (res.film.seconds ? bar(res.film, true) : "");

    const strip = res.strip
      .map((x, i) => {
        const who = x.who ? nameOf(x.who) : "Nobody yet";
        const title = x.who ? `${who}, through ${famLabel(x.family).toLowerCase()} (${M().note(x.curiosity).label})` : "Nothing holds attention yet";
        return `<button type="button" data-row="${i}" data-label="${esc(x.label || "moment " + (i + 1))}" title="${esc((x.label || "Moment " + (i + 1)) + ": " + title)}" aria-label="${esc((x.label || "Moment " + (i + 1)) + ": " + title)}" style="background:${x.who ? color[x.who] : "transparent"}">${esc(x.who ? mark[x.who] : "")}</button>`;
      })
      .join("");
    const legend = byTrack
      .map((c) => `<li><i style="background:${color[c.id]}"></i>${esc(mark[c.id])} = ${esc(c.label)}</li>`)
      .concat(res.film.seconds ? [`<li><i style="background:${OTHER}"></i>F = The film itself</li>`] : [])
      .join("");

    const fams = res.characters
      .map(
        (c) => `<li><b>${esc(c.label)}:</b> ${
          c.families.length
            ? c.families.map((f) => `<span class="mo-fam"><i style="background:${M().mark(f.family).color}"></i>${esc(f.label)} <small>${Math.round(f.seconds)} s</small></span>`).join(" ")
            : `<small>nothing yet</small>`
        }</li>`
      )
      .join("");
    const never = res.characters.filter((c) => c.never);

    el.innerHTML = `<div class="mo-w">${picker}
      <p>Who the audience watches in the engine's film: whose change took attention at each moment. Master and Camera count as the film itself. Each moment lasts ${ctx.secondsPerBeat()} seconds (set it in Attention), and a character may go ${res.gapLimit} seconds unwatched before a warning.</p>
      ${res.warnings.length ? `<ul class="mo-w-warn">${res.warnings.map((w) => `<li><span class="mo-status mo-crit">■</span> ${esc(w.text)}</li>`).join("")}</ul>` : `<p class="mo-small"><span class="mo-status mo-good">● Fresh</span> Every character holds attention often enough.</p>`}
      <section><h3>Share of the time each one holds attention</h3><ul class="mo-w-bars">${bars}</ul>
        ${never.length ? `<p class="mo-small">Never take attention: ${never.map((c) => esc(c.label)).join(", ")}.</p>` : ""}</section>
      <section><h3>Who holds attention, moment by moment</h3>
        <div class="mo-w-strip" role="group" aria-label="Who holds attention at each moment">${strip}</div>
        <ul class="mo-legend mo-w-legend">${legend}</ul>
        <p class="mo-small mo-w-said" role="status">Click a moment to move the Screen's playhead there.</p></section>
      <section><h3>How each one pulls attention</h3><ul class="mo-w-fams">${fams}</ul></section></div>`;
  }

  /* Left for another tab or the window closed: stop listening to the engine until the tab is back. */
  function unmount() {
    if (unhook) unhook();
    unhook = null;
    mounted = null;
  }

  function addTab() {
    const UI = root.CurioMomentumUI;
    if (!UI || !UI.addTab) return false;
    return UI.addTab({ id: "watch", label: "Who we watch", mount, unmount });
  }
  if (!addTab()) {
    /* ui.js loads before this file in load.js; wait for it otherwise. */
    let tries = 0;
    const t = setInterval(() => {
      if (addTab() || ++tries > 50) clearInterval(t);
    }, 100);
  }
})();
