/* momentum/screen-details.js: a "Momentum" section in the Screen's Details inspector (screen/ui.js, the right
   panel). Jeremy (2026-10-03): every curiosity must say how it drives the plot and the themes forward and how it
   moves the audience's attention. This section follows the curiosity picked on the Screen (a library card, a
   lane, a row in Details) and says, in plain sentences:
     - its attention family (the family's color and letter) and the cue it usually gives
     - its push: how hard it drives the story, 0 to 5, and what that number means
     - whether it drives the plot, a character or a theme, or only decorates (CurioDrive.kindOf when drive.js is
       loaded, else the same rule read from its momentum note)
     - its "Try this" line
     - how often it takes attention in My film (the engine's film, read with CurioAttention) and in the curated
       films that have a trace (films with only Claude's estimates are left out and named)
   and one button, "Use it to move attention here", which steps this curiosity one notch at the playhead
   (CurioMomentumEngine.moveAt and applyMove: one undo step), offered only when attention is on another family
   there.

   How it follows the Screen (public API only, nothing in screen/ is changed):
     - CurioScreen.addPanel({ id: "momentum-details", label, place: "details", mount(el) }) docks it
     - CurioScreen.state().sel ({ level, id }) is the selection; CurioScreen.row() the playhead
     - CurioScreen.on(fn) is told after every Screen redraw and playhead move
     - Details redraws itself (and drops docked panels) on some changes that do not call on(fn): picking a lane
       or a curiosity row. A MutationObserver on the Details element only (its direct children, not deeper) puts
       the section back just under the Details header and checks the selection again.
   Cost: My film is read once per engine change (and only while the section is on show); the curated films are
   read once each and kept. Changing the selection or the playhead reads nothing.

   window.CurioMomentumDetails
   - detailsFor(curiosityId, reading, profiles, opts) -> plain data and sentences (pure, works in Node):
       { id, label, family, mark, cue, push, pushText, drives: { kind, label, sentence }, plot, theme, pull,
         tryThis, mine: { takes, moves, seconds, share, sentence }, films: { counted, skipped, takes, moves,
         sentence }, here: { row, family, label, same } | null, canMove, sentences: [..] }
       reading: CurioAttention.read of My film (or null). profiles: [{ title, estimate, reading }] where a film
       with estimate: true or no reading is skipped. opts: { row (the playhead), drive (CurioDrive) }
   - attach() / detach() / attached(), mount(el, hooks) -> { draw, destroy }, read() */
(function () {
  const root = typeof window !== "undefined" ? window : globalThis;
  const M = () => root.CurioMomentum;
  const A = () => root.CurioAttention;
  const R = () => root.CurioRates;
  const ME = () => root.CurioMomentumEngine;
  const SC = () => root.CurioScreen;
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const round = (n) => Math.round(n);
  const times = (n) => (n === 1 ? "once" : n === 2 ? "twice" : n + " times");
  const lower = (s) => String(s || "").replace(/^[A-Z](?![A-Z])/, (m) => m.toLowerCase());
  const stop = (s) => {
    const t = String(s || "").trim();
    return !t ? "" : /[.!?]$/.test(t) ? t : t + ".";
  };

  /* What a push of 0 to 5 means, in words. */
  const PUSH = [
    "it only colors the moment and does not move the story on its own",
    "it barely nudges the story",
    "it nudges the story a little",
    "it moves the story along",
    "it pushes the story hard",
    "the plot cannot go on without it",
  ];
  const DRIVES = {
    plot: { label: "Drives the plot", plain: "it moves the plot: a want, a secret, the stakes, a reveal or a turn" },
    character: { label: "Drives a character", plain: "it moves a character: a feeling, a step on their arc or a choice" },
    theme: { label: "Drives a theme", plain: "it brings a theme back, changed" },
    none: { label: "Decoration", plain: "it changes the look or the sound, so pair it with a story change in the same moment or the next two" },
  };
  /* The same rule as drive.js (rule 1 and 3), for when drive.js is not loaded. */
  const STORY_OWN = ["plot", "feeling", "mind"];
  const LOOK = ["camera", "light", "wardrobe", "place", "effects", "cut", "music"];
  function driveKind(n, D) {
    if (D && typeof D.kindOf === "function") {
      try {
        const k = D.kindOf(n.id, {}, D.DEFAULTS || { storyPush: 4 });
        return (k && k.kind) || "none";
      } catch (e) {}
    }
    const story = n.cue === "plot" || STORY_OWN.includes(n.family) || (!LOOK.includes(n.family) && n.push >= 4);
    if (!story) return "none";
    const c = M().find(n.id);
    const ws = [(c && c.workspace) || n.workspace || ""].concat((c && Array.isArray(c.also) && c.also) || []);
    if (ws.some((w) => ["arc", "archetype", "mindset", "focus"].includes(w))) return "character";
    if (n.cue === "plot") return "plot";
    return n.family === "feeling" || n.family === "mind" || ws.some((w) => w === "emotion" || w === "emo-road") ? "character" : "plot";
  }

  /* How often one curiosity holds attention in a reading: every stretch it holds (takes), the moves from another
     family that landed on it (moves), and the seconds it held. */
  function countIn(reading, id) {
    const out = { takes: 0, moves: 0, seconds: 0, share: 0 };
    if (!reading || !Array.isArray(reading.segments)) return out;
    const base = (c) => (M() && M().baseId ? M().baseId(String(c || "").split("@")[0]) : String(c || "").split("@")[0].split(".")[0]);
    reading.segments.forEach((s) => {
      if (base(s.curiosity) !== id) return;
      out.takes++;
      out.seconds += Number(s.dur) || 0;
    });
    ((reading.stats && reading.stats.moves) || []).forEach((m) => base(m.curiosity) === id && out.moves++);
    out.seconds = Math.round(out.seconds * 10) / 10;
    out.share = reading.seconds > 0 ? out.seconds / reading.seconds : 0;
    return out;
  }
  /* The stretch holding attention at a beat (row). */
  function holdingAt(reading, row) {
    if (!reading || !reading.segments || !reading.segments.length || row == null) return null;
    let s = null;
    reading.segments.forEach((x) => x.beat <= row && (s = x));
    return s;
  }

  function detailsFor(curiosityId, reading, profiles, opts) {
    const o = opts || {};
    if (!M() || !curiosityId) return null;
    const id = M().baseId ? M().baseId(String(curiosityId).split("@")[0]) : String(curiosityId);
    const n = M().note(id);
    const fam = M().family(n.family);
    const mark = M().mark(n.family);
    const cue = (M().CUES || []).find((c) => c.id === n.cue) || { id: n.cue, label: n.cue, plain: "" };
    const push = Math.max(0, Math.min(5, Math.round(Number(n.push) || 0)));
    const kind = driveKind(n, o.drive === undefined ? root.CurioDrive : o.drive);
    const famLabel = fam ? fam.label : n.family;
    const sentences = [];
    sentences.push(`${n.label} belongs to the ${famLabel} family (a family is a kind of curiosity). When it takes the audience's attention, it is usually with a ${lower(cue.label)}${cue.plain ? ": " + lower(cue.plain).replace(/\.$/, "") : ""}.`);
    const pushText = `Its push is ${push} out of 5: ${PUSH[push]}.`;
    sentences.push(pushText);
    const drives = { kind, label: DRIVES[kind].label, sentence: kind === "none" ? `It is decoration: ${DRIVES.none.plain}.` : `It drives the story: ${DRIVES[kind].plain}.` };
    sentences.push(drives.sentence);

    /* My film. */
    let mine = null;
    if (reading && reading.segments) {
      const c = countIn(reading, id);
      const sentence = !c.takes
        ? `In My film it never takes attention yet.`
        : `In My film it takes attention ${times(c.takes)}${c.moves ? ` (${c.moves === c.takes ? (c.takes === 1 ? "and that is" : "every time") : c.moves} a move from another kind of curiosity)` : ""}, holding it ${round(c.seconds)} seconds in all, ${Math.round(c.share * 100)}% of the film.`;
      mine = Object.assign(c, { sentence });
      sentences.push(sentence);
    }

    /* The curated films that have a trace; estimate-only films are named and left out. */
    const counted = [];
    const skipped = [];
    (profiles || []).forEach((p) => {
      if (!p) return;
      if (p.estimate || !p.reading || !p.reading.segments) return skipped.push(p.title || p.id || "a film");
      counted.push(Object.assign({ title: p.title || p.id || "A film" }, countIn(p.reading, id)));
    });
    const tot = counted.reduce((a, c) => ({ takes: a.takes + c.takes, moves: a.moves + c.moves, seconds: a.seconds + c.seconds, used: a.used + (c.takes ? 1 : 0) }), { takes: 0, moves: 0, seconds: 0, used: 0 });
    let fs;
    if (!counted.length) fs = "No curated film has a trace yet, so there is nothing measured to compare with.";
    else if (!tot.takes) fs = `In the ${counted.length} curated film${counted.length === 1 ? "" : "s"} with a trace, it never takes attention.`;
    else fs = `In the ${counted.length} curated film${counted.length === 1 ? "" : "s"} with a trace, it takes attention ${times(tot.takes)} (${tot.moves} of them ${tot.moves === 1 ? "a move" : "moves"} from another kind of curiosity), in ${tot.used} of the ${counted.length} films.`;
    if (skipped.length) fs += ` ${skipped.length} film${skipped.length === 1 ? " has" : "s have"} only Claude's estimates, so ${skipped.length === 1 ? "it is" : "they are"} left out.`;
    const films = { counted, skipped, takes: tot.takes, moves: tot.moves, sentence: fs };
    sentences.push(fs);

    /* The playhead: who holds attention there, and whether this curiosity would move it. */
    let here = null;
    if (reading && o.row != null) {
      const s = holdingAt(reading, o.row);
      here = { row: o.row, family: s ? s.family : null, label: s ? s.label : "", same: !!(s && s.family === n.family) };
    }
    const canMove = !!(here && !here.same);
    return { id, label: n.label, family: n.family, familyLabel: famLabel, mark, cue: { id: cue.id, label: cue.label, plain: cue.plain }, push, pushText, drives, plot: stop(n.plot), theme: stop(n.theme), pull: stop(n.pull), tryThis: stop(n.tryThis), mine, films, here, canMove, sentences };
  }

  /* Would this move take attention at its moment? beats: the engine's film (CurioMomentumEngine.beats(), keyed
     "curiosity@track"); move: { curiosity, track, value } at beat row. Only the film up to that moment is read, with
     the new value in it, so it is cheap. Pure (works in Node). */
  function wouldMove(beats, row, move, opts) {
    if (!A() || !move || !Array.isArray(beats) || !beats[row]) return false;
    const list = beats.slice(0, row + 1).map((b, i) => (i === row ? Object.assign({}, b, { values: Object.assign({}, b.values, { [move.curiosity + "@" + move.track]: move.value }) }) : b));
    const r = A().read(list, opts || {});
    const s = holdingAt(r, row);
    return !!(s && s.beat === row && s.family === M().familyOf(M().baseId(String(move.curiosity))));
  }

  /* ---------- in the browser ---------- */
  const KEY = "curiosities-momentum-details-v1";
  let own = { folded: false, more: false };
  try {
    const p = typeof localStorage !== "undefined" && JSON.parse(localStorage.getItem(KEY));
    if (p && typeof p === "object") own = { folded: !!p.folded, more: !!p.more };
  } catch (e) {}
  const saveOwn = () => {
    try {
      localStorage.setItem(KEY, JSON.stringify(own));
    } catch (e) {}
  };
  function momentumPrefs() {
    let p = null;
    try {
      p = JSON.parse(localStorage.getItem("curiosities-momentum-v1"));
    } catch (e) {}
    p = p && typeof p === "object" ? p : {};
    return { spb: Number(p.secondsPerPanel) > 0 ? Number(p.secondsPerPanel) : 3, limit: Number(p.limit) > 0 ? Number(p.limit) : 20 };
  }
  /* My film, read once per engine change and settings. */
  let mineMemo = null;
  let mineDirty = true;
  let engineStamp = 0;
  function mineReading() {
    if (!A() || !ME()) return null;
    const mp = momentumPrefs();
    const k = mp.spb + "|" + mp.limit;
    if (!mineDirty && mineMemo && mineMemo.k === k) return mineMemo.r;
    const beats = ME().beats();
    mineMemo = { k, r: beats.length ? A().read(beats, { secondsPerBeat: mp.spb, limit: mp.limit }) : null };
    mineDirty = false;
    return mineMemo.r;
  }
  /* The curated films: every study with a trace (read once each and kept), and the estimated films
     (CurioRates.DEFAULT_FILMS) that have no trace, to name as left out. */
  const filmMemo = new WeakMap();
  function curated() {
    let list = [];
    try {
      if (root.CuriosityStudy && root.CuriosityStudy.studies) list = root.CuriosityStudy.studies();
    } catch (e) {
      list = [];
    }
    if (!list.length && root.CuriosityDB && root.CuriosityDB.data) list = root.CuriosityDB.data.scenes || [];
    const spb = momentumPrefs().spb;
    const out = list
      .filter((s) => s && Array.isArray(s.beats) && s.beats.length)
      .map((s) => {
        let m = filmMemo.get(s);
        if (!m || m.beats !== s.beats || m.len !== s.beats.length || m.spb !== spb) filmMemo.set(s, (m = { beats: s.beats, len: s.beats.length, spb, reading: A().fromStudy(s, { secondsPerBeat: spb }) }));
        return { id: s.id, title: String(s.title || s.name || s.id).replace(/^Model scene: /, ""), estimate: false, reading: m.reading };
      });
    const norm = (t) => String(t || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
    const titles = out.map((f) => norm(f.title));
    ((R() && R().DEFAULT_FILMS) || []).forEach((p) => !titles.some((t) => t.includes(norm(p.title))) && out.push({ id: p.id, title: p.title, estimate: true }));
    return out;
  }
  function selected() {
    const st = SC() && SC().state ? SC().state() : null;
    const sel = st && st.sel;
    return sel && sel.level === "curiosity" && sel.id ? sel.id : null;
  }
  function rowNow() {
    return SC() && typeof SC().row === "function" ? SC().row() | 0 : 0;
  }
  function read(idArg, rowArg) {
    const id = idArg || selected();
    if (!id || !M() || !A()) return null;
    return detailsFor(id, mineReading(), curated(), { row: rowArg == null ? rowNow() : rowArg });
  }

  function chip(family) {
    const k = M().mark(family);
    return `<span class="mo-sd-chip" style="background:${k.color};color:${k.ink}" aria-hidden="true">${esc(k.letter)}</span>`;
  }
  function html(d, flash, p) {
    const head = `<header class="mo-sd-h"><strong>Momentum</strong>${d ? `<span class="mo-sd-name">${esc(d.label)}</span>` : ""}<button type="button" data-mo-sd="fold" aria-expanded="${!own.folded}" title="${own.folded ? "Show the Momentum section" : "Fold the Momentum section"}">${own.folded ? "Show" : "Hide"}</button></header>`;
    if (own.folded) return head;
    if (!d) return head + `<p class="mo-sd-empty">Pick one curiosity (a card in the library, a lane on the timeline, or a row here) to see how it moves the audience's attention and the story.</p>`;
    const k = M().mark(d.family);
    const st = flash ? `<p class="mo-sd-flash" role="status">${esc(flash)}</p>` : "";
    let btn = "";
    if (d.here) {
      const at = `At moment ${d.here.row + 1}`;
      const on = d.here.family ? M().mark(d.here.family).label : "nothing yet";
      const mv = p && p.mv;
      const other = mv && M().baseId(mv.curiosity) !== d.id;
      let why;
      if (!d.canMove) why = `${at}, attention is already on ${d.familyLabel}, so changing ${d.label} there would not move it.`;
      else if (!mv) why = `${at}, attention is on ${on}, but ${d.label} cannot change on your film there.`;
      else if (!p.moves) why = `${at}, attention is on ${on}. One step of ${mv.label} there would be too small a change to take it, so try a bigger change by hand or another moment.`;
      else why = `${at}, attention is on ${on}. Changing ${mv.label} to ${mv.value} there moves it to ${d.familyLabel}${other ? ` (${d.label} cannot be set on your film yet, so ${mv.label}, of the same family, is used)` : ""}.`;
      const can = !!(d.canMove && mv && p.moves);
      btn = `<div class="mo-sd-act"><button type="button" data-mo-sd="move"${can ? "" : " disabled"} title="${esc(mv ? `Change ${mv.label} one step at the playhead (one undo step)` : "Nothing to change here")}">Use it to move attention here</button><p>${esc(why)}</p></div>`;
    }
    return `${head}${st}<div class="mo-sd-body">
      <p class="mo-sd-fam">${chip(d.family)}<b>${esc(k.label)}</b><small>${esc(d.cue.label)}</small><span class="mo-sd-kind" data-kind="${esc(d.drives.kind)}">${esc(d.drives.label)}</span></p>
      <p>${esc(d.sentences[0])}</p>
      <p class="mo-sd-push"><span class="mo-sd-dots" role="img" aria-label="Push ${d.push} out of 5">${[1, 2, 3, 4, 5].map((i) => `<i class="${i <= d.push ? "on" : ""}"></i>`).join("")}</span> ${esc(d.pushText)}</p>
      <p>${esc(d.drives.sentence)}</p>
      <details class="mo-sd-more" data-mo-sd="more"${own.more ? " open" : ""}><summary>How it moves the plot, the themes and attention</summary>
        ${d.plot ? `<p><b>The plot:</b> ${esc(d.plot)}</p>` : ""}
        ${d.theme ? `<p><b>The themes:</b> ${esc(d.theme)}</p>` : ""}
        ${d.pull ? `<p><b>Attention:</b> ${esc(d.pull)}</p>` : ""}
      </details>
      ${d.tryThis ? `<p class="mo-sd-try"><b>Try this:</b> ${esc(d.tryThis)}</p>` : ""}
      ${d.mine ? `<p class="mo-sd-count" data-count="mine">${esc(d.mine.sentence)}</p>` : `<p class="mo-sd-count">My film has no moments yet.</p>`}
      <p class="mo-sd-count" data-count="films">${esc(d.films.sentence)}</p>
      ${btn}
    </div>`;
  }

  function mount(el, hooks) {
    const h = hooks || {};
    let last = "";
    let flash = "";
    let lastSel = null;
    let data = null;
    el.classList.add("mo-sd");
    function draw(force) {
      if (!el.isConnected) return;
      /* Not on show (the Screen closed): skip the work; the Screen tells us when it opens again. */
      if (!force && !el.getClientRects().length) return;
      const id = typeof h.selected === "function" ? h.selected() : selected();
      if (id !== lastSel) flash = "";
      lastSel = id;
      try {
        data = id ? read(id, typeof h.row === "function" ? h.row() : rowNow()) : null;
      } catch (e) {
        data = null;
      }
      el.classList.toggle("folded", own.folded);
      const out = html(data, flash, data && data.canMove ? preview(data) : null);
      if (!force && out === last) return;
      last = out;
      el.innerHTML = out;
    }
    function onClick(e) {
      const t = e.target.closest("[data-mo-sd]");
      if (!t || !el.contains(t)) return;
      if (t.dataset.moSd === "fold") {
        own.folded = !own.folded;
        saveOwn();
        return draw(true);
      }
      if (t.dataset.moSd !== "move") return;
      flash = useHere(data);
      draw(true);
    }
    function onToggle(e) {
      if (!e.target.matches || !e.target.matches('details[data-mo-sd="more"]') || own.more === e.target.open) return;
      own.more = e.target.open;
      saveOwn();
    }
    el.addEventListener("click", onClick);
    el.addEventListener("toggle", onToggle, true);
    draw(true);
    return {
      draw,
      dirty() {
        mineDirty = true;
        engineStamp++;
      },
      destroy() {
        el.removeEventListener("click", onClick);
        el.removeEventListener("toggle", onToggle, true);
        el.classList.remove("mo-sd", "folded");
        el.innerHTML = "";
      },
    };
  }
  /* "Use it to move attention here": this curiosity one notch at the playhead, as the Compass would make the
     move, preferring this exact curiosity (CurioMomentumEngine.moveAt); one undo step. */
  function pickMove(d) {
    const E = root.CurioEngine;
    const S = root.CurioScale;
    if (!d || !d.here || !ME() || !E || !S) return null;
    const st = E.state();
    const r = st.rows[d.here.row];
    if (!r) return null;
    const mv = ME().moveAt({ family: d.family, curiosity: d.id }, r.id);
    /* The engine knows a curiosity by its id, or only through its main slider ("transitionKind.setting"). */
    const c = M().find(d.id);
    const main = d.id + "." + ((c && c.main) || "setting");
    const key = S.known(d.id) ? d.id : S.known(main) ? main : null;
    if (!key || (mv && M().baseId(mv.curiosity) === d.id)) return mv;
    /* moveAt chose another curiosity of this family (or none): step this exact one instead, on the track that
       already has it, else on the track moveAt chose (or the first track). */
    const has = st.tracks.find((t) => t.curiosities.includes(key));
    const track = has ? has.id : mv ? mv.track : st.tracks[0] && st.tracks[0].id;
    if (!track) return mv;
    const was = has ? E.value(r.id, track, key) : null;
    const base = was != null && was !== "" ? was : S.start(key);
    let value = S.step(key, base, 1);
    if (value == null || String(value) === String(base)) value = S.step(key, base, -1);
    if (value == null || String(value) === String(base)) return mv;
    const commands = (has ? [] : [{ type: "addCuriosity", track, curiosity: key }]).concat([{ type: "setPoint", row: r.id, track, curiosity: key, value }]);
    return { track, curiosity: key, label: S.label(key), value, from: was, row: r.id, family: d.family, commands };
  }
  /* The button's check, kept until the selection, the playhead or the film changes. */
  let previewMemo = null;
  function preview(d) {
    if (!d || !d.canMove) return null;
    const k = d.id + "|" + d.here.row + "|" + engineStamp;
    if (previewMemo && previewMemo.k === k) return previewMemo.v;
    let v;
    try {
      const mv = pickMove(d);
      const mp = momentumPrefs();
      v = { mv, moves: !!(mv && wouldMove(ME().beats(), d.here.row, mv, { secondsPerBeat: mp.spb, limit: mp.limit })) };
    } catch (e) {
      v = { mv: null, moves: false };
    }
    previewMemo = { k, v };
    return v;
  }
  function useHere(d) {
    if (!d || !d.canMove || !ME() || !root.CurioEngine) return "Nothing to move here.";
    const mv = pickMove(d);
    if (!mv) return `${d.label} cannot change at moment ${d.here.row + 1}.`;
    const res = ME().applyMove(mv);
    if (!res || !res.ok) return `Nothing changed${res && res.error ? ": " + res.error : "."}`;
    mineDirty = true;
    engineStamp++;
    const after = holdingAt(mineReading(), d.here.row);
    const moved = after && after.family === d.family;
    return `${mv.label} is now ${mv.value} at moment ${d.here.row + 1}. ${moved ? `Attention moves to ${d.familyLabel} there.` : `It was too small a change to take attention there.`} Undo takes it back.`;
  }

  /* ---------- docking in Details ---------- */
  let dock = null;
  let panel = null;
  let watcher = null;
  let unScreen = null;
  let unEngine = null;
  let queued = false;
  const redraw = () => {
    if (queued) return;
    queued = true;
    (root.requestAnimationFrame || setTimeout)(() => {
      queued = false;
      if (panel) panel.draw();
    });
  };
  /* Keep the section just under the Details header: Details rebuilds its own content on some changes. */
  function place() {
    if (!dock) return;
    const host = document.querySelector(".sc-page .sc-inspector");
    if (!host) return;
    if (watcher && watcher.host !== host) {
      watcher.disconnect();
      watcher.observe(host, { childList: true });
      watcher.host = host;
    }
    const head = host.querySelector(":scope > .sc-insp-h");
    const want = head ? head.nextSibling : host.firstChild;
    if (dock.parentNode === host && (dock === want || (head && dock.previousSibling === head))) return;
    host.insertBefore(dock, want);
  }
  function attach() {
    const S = SC();
    if (panel) return true;
    if (!S || typeof S.addPanel !== "function") return false;
    return (
      S.addPanel({
        id: "momentum-details",
        label: "Momentum",
        place: "details",
        mount(el) {
          dock = el;
          panel = mount(el, { row: () => S.row(), selected });
          watcher = new MutationObserver(() => {
            place();
            redraw();
          });
          place();
          if (typeof S.on === "function")
            unScreen = S.on(() => {
              place();
              redraw();
            });
          if (root.CurioEngine && root.CurioEngine.on)
            unEngine = root.CurioEngine.on(() => {
              mineDirty = true;
              engineStamp++;
              redraw();
            });
        },
      }) !== false || !!panel
    );
  }
  function detach() {
    if (watcher) watcher.disconnect();
    if (typeof unScreen === "function") unScreen();
    if (typeof unEngine === "function") unEngine();
    if (panel) panel.destroy();
    if (dock && dock.parentNode) dock.remove();
    dock = panel = watcher = unScreen = unEngine = null;
  }
  function boot() {
    if (attach() || !document.body) return;
    root.addEventListener("load", () => !panel && attach());
  }
  if (typeof document !== "undefined" && typeof window !== "undefined") {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
    else boot();
  }

  const api = { detailsFor, countIn, holdingAt, wouldMove, pickMove, preview, PUSH, DRIVES, attach, detach, attached: () => !!(dock && dock.isConnected), mount, read, useHere };
  root.CurioMomentumDetails = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})();
