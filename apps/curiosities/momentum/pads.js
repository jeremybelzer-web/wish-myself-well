/* momentum/pads.js: Momentum pads. A grid of big pads, one per attention family, for a performer directing
   My film (the engine's film, the one the Screen plays) live. Press a pad (click it, a key 1 to 9, 0, - or =,
   or a note on a MIDI keyboard, pad controller or wearable) and attention moves to that family at the moment
   playing now: the family's strongest curiosity that the engine can step gets one notch, as a node at that
   moment (CurioMomentumEngine.moveAt and applyMove), one undo step per press.

   Record a take: while Record is on, each press lands at the moment playing then (the Screen's playhead, or a
   built-in clock that steps one moment every few seconds when there is no Screen). Stopping the take puts every
   press of it into ONE undo step: the presses go into the engine one by one while you play (so the barometer and
   the lit pad read the film as it now is), and at the end those steps are undone and sent again as one batch.
   When anything else changed the film during the take, the presses stay as separate steps and the tab says so.

   window.CurioPads
   - padPlan(reading, family, row) -> pure (works in Node, never changes anything): what pressing a family's pad
       means at one moment. reading: CurioAttention.read() of the film (rows as beats; reading.rows may list the
       row ids); row: a moment index or a row id. Returns { family, label, letter, color, ink, index, seconds,
       now: { family, label, letter, held, limit, status { cls, icon, text } } | null, same, text }.
   - pads(set) -> the pads in order (set "all": 13, "main": the 8 families with their own color), each with its
       key and its MIDI note.
   - pick(family, rowId) -> the engine move a press would make (moveAt), or null.
   - press(family, rowId) -> { ok, move, plan, after, text }: one press, one undo step (or one step of a take).
   - barometer(rowId) -> { now, suggest } read from the engine film at that moment.
   - take: { start(), stop() -> { ok, presses, collapsed, text }, active(), presses() }
   - settings() / set(patch), midi: { enable(), status(), learn(family), learning() }
   Settings: localStorage curiosities-momentum-pads-v1 ({ set, notes: { family: note }, midi }). */
(function () {
  const root = typeof window !== "undefined" ? window : globalThis;
  const KEY = "curiosities-momentum-pads-v1";
  const M = () => root.CurioMomentum;
  const A = () => root.CurioAttention;
  const R = () => root.CurioRates;
  const C = () => root.CurioCompass;
  const E = () => root.CurioEngine;
  const ME = () => root.CurioMomentumEngine;
  const SC = () => root.CurioScreen;

  /* Family colors and letters, and the Fresh / Getting long / Too long marks, come from notes.js
     (CurioMomentum.mark and CurioMomentum.status), the same on every tab. */
  const mark = (f) => M().mark(f);
  const famLabel = (f) => (M() && M().family(f) ? M().family(f).label : f || "");
  const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "="];
  /* Notes 36 and up: where most pad controllers and drum maps start (C1, the bass drum in General MIDI). */
  const FIRST_NOTE = 36;
  const MAIN = () => Object.keys(M().COLORS);

  const statusOf = (held, limit) => M().status(held, limit);
  const clock = (s) => {
    const t = Math.max(0, Math.round(s || 0));
    return Math.floor(t / 60) + ":" + String(t % 60).padStart(2, "0");
  };

  /* ---------- settings ---------- */
  function loadSettings() {
    let s = null;
    try {
      s = JSON.parse(root.localStorage.getItem(KEY));
    } catch (e) {}
    s = s && typeof s === "object" ? s : {};
    const notes = {};
    if (s.notes && typeof s.notes === "object")
      Object.keys(s.notes).forEach((f) => {
        const n = Number(s.notes[f]);
        if (Number.isInteger(n) && n >= 0 && n <= 127) notes[f] = n;
      });
    return { set: s.set === "main" ? "main" : "all", notes, midi: s.midi === true };
  }
  const settings = loadSettings();
  function saveSettings() {
    try {
      root.localStorage.setItem(KEY, JSON.stringify(settings));
    } catch (e) {}
  }

  /* The pads in order: the 8 families with their own color first, then the others. */
  function pads(set) {
    const all = M().FAMILIES.map((f) => f.id);
    const main = MAIN();
    const order = main.filter((f) => all.includes(f)).concat(all.filter((f) => !main.includes(f)));
    const list = (set || settings.set) === "main" ? order.filter((f) => main.includes(f)) : order;
    return list.map((f, i) => {
      const learned = settings.notes[f];
      return { family: f, label: famLabel(f), letter: mark(f).letter, color: mark(f).color, ink: mark(f).ink, key: KEYS[i] || null, note: learned != null ? learned : FIRST_NOTE + i, learned: learned != null };
    });
  }

  /* ---------- the pure part ---------- */
  function padPlan(reading, family, row) {
    const r = reading || { segments: [], stats: { familyRuns: [] }, beats: 0, seconds: 0, limit: 20 };
    const beats = r.beats || 0;
    const step = beats ? r.seconds / beats : 3;
    let index = typeof row === "number" ? row : Array.isArray(r.rows) ? r.rows.indexOf(row) : -1;
    if (!(index >= 0)) index = 0;
    if (beats) index = Math.min(index, beats - 1);
    const limit = r.limit || 20;
    /* Who holds attention at that moment, and since when (the same count as the engine lanes). */
    let seg = null;
    (r.segments || []).forEach((g) => g.beat <= index && (seg = g));
    let now = null;
    if (seg) {
      const runs = (r.stats && r.stats.familyRuns) || [];
      const run = runs.find((g) => seg.from >= g.from - 1e-9 && seg.from < g.to + 1e-9) || { from: seg.from };
      const held = Math.max(0, Math.round((index + 1) * step - run.from));
      now = { family: seg.family, label: famLabel(seg.family), letter: mark(seg.family).letter, curiosity: seg.label, held, limit, status: statusOf(held, limit) };
    }
    const same = !!(now && now.family === family);
    const name = famLabel(family);
    const at = `moment ${index + 1} (${clock(index * step)})`;
    const text = !now
      ? `Nothing holds attention yet at ${at}. Pressing ${name} gives attention its first place to rest.`
      : same
        ? `${name} already holds attention at ${at}, for ${now.held} seconds. Pressing it again keeps attention there, so the stretch grows longer.`
        : `At ${at}, attention is on ${now.label} for ${now.held} seconds. Pressing ${name} moves it to ${name}.`;
    return { family, label: name, letter: mark(family).letter, color: mark(family).color, ink: mark(family).ink, index, seconds: index * step, now, same, text };
  }

  /* ---------- the engine ---------- */
  const spb = () => {
    const U = root.CurioMomentumUI;
    const v = U && U.context ? Number(U.context().secondsPerBeat()) : 3;
    return v > 0 ? v : 3;
  };
  const limitNow = () => {
    const U = root.CurioMomentumUI;
    return U && U.context ? U.context().limit() : 20;
  };
  const profilesNow = () => {
    const U = root.CurioMomentumUI;
    if (U && U.context) return U.context().profiles();
    return R() ? R().DEFAULT_FILMS.filter((f) => f.id === "pulp-fiction") : [];
  };
  function readFilm(opts) {
    if (!ME() || !ME().available()) return null;
    const b = ME().beats();
    const o = Object.assign({ secondsPerBeat: spb(), limit: limitNow() }, opts || {});
    const r = A().read(b, o);
    r.rows = b.map((x) => x.row);
    return r;
  }
  const rowsNow = () => (E() && E().state ? E().state().rows : []);
  const rowIndex = (rowId) => Math.max(0, rowsNow().findIndex((r) => r.id === rowId));

  /* The family's strongest curiosity that moveAt can produce: when one of the family's curiosities is on a
     track already, moveAt only steps those, so only those are tried (strongest push first); else every
     curiosity of the family the engine knows. */
  function pick(family, rowId) {
    if (!ME() || !ME().available() || !root.CurioScale) return null;
    const S = root.CurioScale;
    const st = E().state();
    const on = new Set();
    st.tracks.forEach((t) => t.curiosities.forEach((c) => S.known(c) && M().familyOf(c) === family && on.add(M().baseId(c))));
    const rank = (n) => n.push + (n.source === "workspace" ? 0 : 0.5);
    const notes = (M().all ? M().all() : []).filter((n) => n.family === family && (on.size ? on.has(n.id) : S.known(n.id))).sort((a, b) => rank(b) - rank(a));
    let first = null;
    for (const n of notes.slice(0, 30)) {
      const mv = ME().moveAt({ family, curiosity: n.id }, rowId);
      if (!mv) continue;
      if (M().baseId(mv.curiosity) === n.id) return latch(mv, st);
      first = first || mv;
    }
    const mv = first || ME().moveAt({ family }, rowId);
    return mv ? latch(mv, st) : null;
  }
  /* moveAt sets one point at the moment. On a column with no automation yet, one point sets every moment
     alike, so nothing changes AT the moment and attention does not move. A press latches instead, like a key
     held down on a synth: the new value starts at this moment and lasts until the column next changes on its
     own; every other moment keeps its value (the same points pacer.js uses). */
  const same = (a, b) => String(a) === String(b);
  function latch(mv, st) {
    const S = root.CurioScale;
    const rows = st.rows;
    const r = Math.max(0, rows.findIndex((x) => x.id === mv.row));
    const added = mv.commands.some((c) => c.type === "addCuriosity");
    const now = rows.map((x) => {
      const v = added ? null : E().value(x.id, mv.track, mv.curiosity);
      return v == null || v === "" ? S.start(mv.curiosity) : v;
    });
    let k = r + 1;
    while (k < now.length && same(now[k], now[k - 1])) k++;
    const want = now.map((v, i) => (i >= r && i < k ? mv.value : v));
    const lane = st.lanes && st.lanes[mv.track + "|" + mv.curiosity];
    const cmds = mv.commands.filter((c) => c.type !== "setPoint");
    const set = (i, v) => cmds.push({ type: "setPoint", row: rows[i].id, track: mv.track, curiosity: mv.curiosity, value: v });
    if (!lane || added) {
      want.forEach((v, i) => (i === 0 || !same(v, want[i - 1])) && set(i, v));
      cmds.push({ type: "laneMode", track: mv.track, curiosity: mv.curiosity, mode: "hold" });
    } else {
      const has = (i) => Object.prototype.hasOwnProperty.call(lane.points, rows[i].id);
      if (r > 0 && !has(r - 1)) set(r - 1, now[r - 1]);
      set(r, mv.value);
      for (let i = r + 1; i < k - 1; i++) if (has(i)) set(i, mv.value);
      if (k - 1 > r) set(k - 1, mv.value);
      if (k < rows.length && !has(k)) set(k, now[k]);
    }
    return Object.assign({}, mv, { commands: cmds, until: k });
  }

  function barometer(rowId) {
    const r = readFilm();
    if (!r) return null;
    const i = rowId == null ? 0 : typeof rowId === "number" ? rowId : rowIndex(rowId);
    const plan = padPlan(r, null, i);
    /* The Compass reads the film up to this moment and points at the family to move to next. */
    let suggest = null;
    if (C()) {
      const upTo = A().read(ME().beats().slice(0, plan.index + 1), { secondsPerBeat: spb(), limit: r.limit });
      const p = C().point(upTo, profilesNow());
      suggest = p.options[0] ? p.options[0].family : null;
    }
    return { now: plan.now, index: plan.index, seconds: plan.seconds, limit: r.limit, suggest };
  }

  const take = { on: false, steps: [], fp: null, startedWith: 0 };
  const fingerprint = () => (E() && E().fingerprint ? E().fingerprint() : null);
  function press(family, rowId) {
    if (!ME() || !ME().available()) return { ok: false, text: "Start a film in the engine first (Library, Engine)." };
    const rows = rowsNow();
    const row = rows.find((r) => r.id === rowId) || rows[0];
    const before = readFilm();
    const plan = padPlan(before, family, row.id);
    const mv = pick(family, row.id);
    if (!mv) return { ok: false, plan, text: `No curiosity of ${famLabel(family)} can change at moment ${plan.index + 1}.` };
    const res = ME().applyMove(mv);
    if (!res || !res.ok) return { ok: false, plan, move: mv, text: "The engine said: " + ((res && res.error) || "no") };
    if (res.unchanged) return { ok: false, plan, move: mv, text: "That press changed nothing in the film." };
    const label = E().history().undo.slice(-1)[0];
    if (take.on) {
      take.steps.push({ label, commands: mv.commands, family, row: row.id });
      take.fp = fingerprint();
    }
    const after = padPlan(readFilm(), family, row.id);
    const valueText = mv.from == null ? `added to My film and set to "${mv.value}"` : `changed from "${mv.from}" to "${mv.value}"`;
    const landed = after.now && after.now.family === family;
    const text =
      `${plan.label} at moment ${plan.index + 1}: ${mv.label}, ${valueText}.` +
      (landed ? ` Attention now rests on ${plan.label}.` : after.now ? ` Something stronger at this moment still holds attention: ${after.now.label}.` : "") +
      (take.on ? ` Press ${take.steps.length} of this take.` : " Undo in the engine takes it back.");
    return { ok: true, move: mv, plan, after, text };
  }
  function takeStart() {
    take.on = true;
    take.steps = [];
    take.fp = fingerprint();
    take.startedWith = E() ? E().history().undo.length : 0;
    return true;
  }
  /* Put the take's presses into one undo step: undo each press (checking they are still the newest steps and
     nothing else changed the film since), then send them again as one batch. */
  function takeStop() {
    const steps = take.steps.slice();
    take.on = false;
    take.steps = [];
    const n = steps.length;
    if (!n) return { ok: true, presses: 0, collapsed: false, text: "The take had no presses." };
    if (n === 1) return { ok: true, presses: 1, collapsed: true, text: "Recorded a take of 1 press. One Undo in the engine takes it back." };
    const top = E().history().undo.slice(-n);
    const untouched = top.length === n && top.every((l, i) => l === steps[i].label) && (take.fp == null || fingerprint() === take.fp);
    take.fp = null;
    if (!untouched) return { ok: false, presses: n, collapsed: false, text: `Recorded ${n} presses, but something else changed the film during the take, so they stay as ${n} separate steps in Undo.` };
    let undone = 0;
    for (let i = 0; i < n; i++) if (E().undo()) undone++;
    const res = E().send({ type: "batch", label: `Momentum pads: a take of ${n} presses`, commands: steps.reduce((all, s) => all.concat(s.commands), []) });
    if (!res || !res.ok) {
      for (let i = 0; i < undone; i++) E().redo();
      return { ok: false, presses: n, collapsed: false, text: `The engine would not take the ${n} presses as one step (${(res && res.error) || "no reason given"}), so they stay as separate steps.` };
    }
    return { ok: true, presses: n, collapsed: true, text: `Recorded a take of ${n} presses as one step. One Undo in the engine takes the whole take back.` };
  }

  /* ---------- MIDI in ---------- */
  /* One MIDI connection for the whole page: the first request is kept and every later one (perform.js's
     MIDI out included) gets the same, so the browser asks for MIDI once. */
  function shareMIDI() {
    const nav = root.navigator;
    if (!nav || typeof nav.requestMIDIAccess !== "function" || nav.requestMIDIAccess.__curioShared) return;
    const own = nav.requestMIDIAccess.bind(nav);
    let once = null;
    const shared = function (opts) {
      if (opts && opts.sysex) return own(opts);
      if (!once)
        once = own().catch((e) => {
          once = null;
          throw e;
        });
      return once;
    };
    shared.__curioShared = true;
    try {
      Object.defineProperty(nav, "requestMIDIAccess", { value: shared, configurable: true, writable: true });
    } catch (e) {}
  }
  const midi = { access: null, status: "MIDI input is off.", learn: null, last: null, hooked: typeof WeakSet !== "undefined" ? new WeakSet() : null };
  const midiListeners = [];
  function hookInputs() {
    if (!midi.access) return;
    midi.access.inputs.forEach((input) => {
      if (midi.hooked && midi.hooked.has(input)) return;
      if (midi.hooked) midi.hooked.add(input);
      input.addEventListener("midimessage", (e) => onMessage(e.data, input.name));
    });
    midi.status = `MIDI input is on: ${midi.access.inputs.size} input${midi.access.inputs.size === 1 ? "" : "s"}.`;
  }
  function enable() {
    if (midi.access) return Promise.resolve(midi.status);
    shareMIDI();
    if (!root.navigator || typeof root.navigator.requestMIDIAccess !== "function") {
      midi.status = "This browser has no MIDI. Use the keys or click the pads.";
      return Promise.resolve(midi.status);
    }
    return root.navigator.requestMIDIAccess().then(
      (access) => {
        midi.access = access;
        settings.midi = true;
        saveSettings();
        hookInputs();
        access.addEventListener("statechange", () => {
          hookInputs();
          tell({ type: "status" });
        });
        tell({ type: "status" });
        return midi.status;
      },
      () => {
        midi.status = "MIDI was not allowed. Use the keys or click the pads.";
        tell({ type: "status" });
        return midi.status;
      }
    );
  }
  /* A note on (any channel, velocity above 0) presses the pad it belongs to; while a pad is learning, the note
     becomes that pad's note instead. */
  function onMessage(data, from) {
    if (!data || data.length < 3) return;
    const kind = data[0] & 0xf0;
    if (kind !== 0x90 || !data[2]) return;
    const note = data[1];
    midi.last = { note, from };
    if (midi.learn) {
      const f = midi.learn;
      Object.keys(settings.notes).forEach((k) => settings.notes[k] === note && delete settings.notes[k]);
      settings.notes[f] = note;
      saveSettings();
      midi.learn = null;
      tell({ type: "learned", family: f, note });
      return;
    }
    const pad = pads().find((p) => p.note === note);
    if (pad) tell({ type: "note", family: pad.family, note });
  }
  function tell(ev) {
    midiListeners.slice().forEach((fn) => {
      try {
        fn(ev);
      } catch (e) {}
    });
  }

  const api = {
    padPlan,
    pads,
    pick,
    press,
    barometer,
    readFilm,
    statusOf,
    take: { start: takeStart, stop: takeStop, active: () => take.on, presses: () => take.steps.length },
    settings: () => JSON.parse(JSON.stringify(settings)),
    set(patch) {
      const p = patch || {};
      if (p.set === "main" || p.set === "all") settings.set = p.set;
      if (p.notes && typeof p.notes === "object") settings.notes = Object.assign({}, p.notes);
      saveSettings();
    },
    midi: {
      enable,
      status: () => midi.status,
      on: () => !!midi.access,
      learn: (f) => (midi.learn = f || null),
      learning: () => midi.learn,
      message: onMessage,
      listen(fn) {
        midiListeners.push(fn);
        return () => {
          const i = midiListeners.indexOf(fn);
          if (i >= 0) midiListeners.splice(i, 1);
        };
      },
    },
    KEYS,
    FIRST_NOTE,
    KEY,
  };
  root.CurioPads = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;

  /* ---------- the tab "Pads" in the Momentum window ---------- */
  if (typeof document === "undefined") return;
  shareMIDI();
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const ui = { index: 0, flash: "", lit: null, clock: null, el: null, ctx: null };
  const hasScreen = () => !!(SC() && typeof SC().row === "function");
  function momentIndex() {
    const n = rowsNow().length;
    const i = hasScreen() ? Number(SC().row()) || 0 : ui.index;
    return Math.max(0, Math.min(Math.max(0, n - 1), i));
  }
  const mounted = () => !!(ui.el && ui.el.isConnected);

  function padsHtml(baro) {
    const learning = midi.learn;
    return pads()
      .map((p) => {
        const holding = baro && baro.now && baro.now.family === p.family;
        const next = baro && baro.suggest === p.family;
        const tags = [];
        if (holding) tags.push(`<span class="pd-tag pd-tag-now"><span class="mo-status mo-${baro.now.status.cls}">${baro.now.status.icon}</span> Holding now, ${baro.now.held} s</span>`);
        if (next) tags.push(`<span class="pd-tag pd-tag-next">★ Suggested next</span>`);
        const keys = [p.key ? `Key ${p.key}` : "No key", `Note ${p.note}${p.learned ? "" : " (default)"}`].join(" · ");
        return `<div class="pd-cell${next ? " pd-next" : ""}${holding ? " pd-now" : ""}${ui.lit === p.family ? " pd-hit" : ""}">
          <button type="button" class="pd-pad" data-pd-pad="${esc(p.family)}" aria-label="${esc(p.label)}${p.key ? ", key " + esc(p.key) : ""}${next ? ", suggested next" : ""}${holding ? ", holding attention now" : ""}" style="--pd-c:${p.color}">
            <span class="pd-letter" style="background:${p.color};color:${p.ink}" aria-hidden="true">${esc(p.letter)}</span>
            <span class="pd-name">${esc(p.label)}</span>
            <span class="pd-keys">${esc(keys)}</span>
            ${tags.join("")}
          </button>
          <button type="button" class="pd-learn" data-pd-learn="${esc(p.family)}"${learning === p.family ? ' aria-pressed="true"' : ""}>${learning === p.family ? "Hit a note now…" : "Learn note"}</button>
        </div>`;
      })
      .join("");
  }
  function baroHtml(baro, n) {
    if (!baro) return "";
    const i = baro.index;
    const st = baro.now ? baro.now.status : statusOf(null);
    const lim = baro.limit;
    const max = lim * 1.5;
    const fill = baro.now ? Math.min(100, (baro.now.held / max) * 100) : 0;
    const who = baro.now ? `<b>${esc(baro.now.label)}</b> <small>(now: ${esc(baro.now.curiosity)})</small>, for ${baro.now.held} seconds` : "<b>nothing yet</b>";
    return `<div class="mo-meter pd-baro" role="meter" aria-valuemin="0" aria-valuemax="${max}" aria-valuenow="${baro.now ? baro.now.held : 0}" aria-label="How long one family has held attention at this moment">
        <div class="mo-meter-top"><span>At moment ${i + 1} of ${n} (${clock(baro.seconds)}), attention is on ${who}</span><span class="mo-status mo-${st.cls}">${st.icon} ${st.text}</span></div>
        <div class="mo-gauge"><div class="mo-gauge-fill mo-${st.cls}" style="width:${fill}%"></div><div class="mo-gauge-limit" style="left:${(lim / max) * 100}%" title="Limit: ${lim} seconds"></div></div>
        <p class="mo-small">${baro.suggest ? `The Compass suggests ${esc(famLabel(baro.suggest))} next (the pad marked ★).` : "The Compass has no suggestion here."} Too long means past ${lim} seconds.</p>
      </div>`;
  }
  function mount(el, ctx) {
    ui.el = el;
    ui.ctx = ctx;
    if (!ME() || !ME().available()) {
      el.innerHTML = `<p>Momentum pads move attention around My film (the engine's film, the one the Screen plays) while you perform. Start a film in the engine first (Library, Engine), then come back here.</p>`;
      wireOnce(el);
      return;
    }
    const rows = rowsNow();
    const i = momentIndex();
    const baro = barometer(rows[i].id);
    const said = ui.flash;
    const screen = hasScreen();
    const rec = take.on;
    const keyCount = Math.min(KEYS.length, pads().length);
    const keyList = KEYS.slice(0, keyCount);
    const moment = screen
      ? `<label>Moment <select data-pd="moment">${rows.map((r, k) => `<option value="${k}"${k === i ? " selected" : ""}>${k + 1}. ${esc(r.label || "Moment " + (k + 1))}</option>`).join("")}</select></label><span class="mo-small pd-follow">This follows the Screen's playhead. Play the Screen and each press lands where it is.</span>`
      : `<label>Moment <select data-pd="moment">${rows.map((r, k) => `<option value="${k}"${k === i ? " selected" : ""}>${k + 1}. ${esc(r.label || "Moment " + (k + 1))}</option>`).join("")}</select></label>`;
    el.innerHTML = `<div class="pd-root">
      <p>Press a pad and attention moves to that family at the moment playing now: the family's strongest curiosity that can change there gets one notch, as a point in the engine. Each press is one step that Undo takes back. Click a pad, press its key (${keyList.length > 10 ? "1 to 9, then 0, - and =" : keyList.join(", ")}), or play its note on a MIDI keyboard, pad or wearable.</p>
      <div class="mo-controls">
        ${moment}
        <button type="button" class="pd-rec${rec ? " on" : ""}" data-pd="record" aria-pressed="${rec}">${rec ? `■ Stop recording (${take.steps.length} press${take.steps.length === 1 ? "" : "es"})` : "● Record a take"}</button>
        <button type="button" data-pd="undo">Undo the last step</button>
        <label>Pads <select data-pd="set"><option value="all"${settings.set === "all" ? " selected" : ""}>All 13 families</option><option value="main"${settings.set === "main" ? " selected" : ""}>The 8 families with their own color</option></select></label>
      </div>
      ${rec ? `<p class="pd-recnote" role="status"><b>● Recording.</b> ${screen ? "Each press lands at the Screen's playhead when you press it." : `The moment steps forward every ${spb()} seconds; each press lands at the moment playing then.`} Stop the take and all its presses become one step in Undo.</p>` : ""}
      ${said ? `<div class="mo-flash" role="status">${esc(said)}</div>` : ""}
      ${baroHtml(baro, rows.length)}
      <div class="pd-grid" role="group" aria-label="Attention pads">${padsHtml(baro)}</div>
      <section><h3>MIDI</h3>
        <div class="mo-controls"><button type="button" data-pd="midi"${midi.access ? " disabled" : ""}>${midi.access ? "MIDI input is on" : "Turn on MIDI input"}</button>
        <span class="mo-small pd-midi-status">${esc(midi.status)}${midi.last ? ` Last note: ${midi.last.note}${midi.last.from ? " from " + esc(midi.last.from) : ""}.` : ""}</span></div>
        <p class="mo-small">Out of the box the pads listen to notes ${FIRST_NOTE} and up, in order (where most pad controllers start), on any channel. To use another note, click Learn note under a pad and hit the note on your controller. MIDI works while it is on, even with this window closed, so you can perform while watching the Screen; the keys work only while this tab is open. The Perform tab sends the meter out to MIDI on the same connection.</p>
      </section>
    </div>`;
    wireOnce(el);
    if (midi.learn && !midi.access) enable().then(() => mounted() && redraw());
  }
  const redraw = () => mounted() && ui.ctx && mount(ui.el, ui.ctx);
  function doPress(family) {
    if (!ME() || !ME().available()) return;
    const rows = rowsNow();
    const res = press(family, rows[momentIndex()].id);
    ui.flash = res.text;
    ui.lit = family;
    setTimeout(() => {
      if (ui.lit === family) {
        ui.lit = null;
        const c = mounted() && ui.el.querySelector(".pd-hit");
        if (c) c.classList.remove("pd-hit");
      }
    }, 260);
    redraw();
  }
  function startClock() {
    stopClock();
    if (hasScreen()) return;
    ui.clock = setInterval(() => {
      if (!take.on) return stopClock();
      const n = rowsNow().length || 1;
      ui.index = (ui.index + 1) % n;
      redraw();
    }, spb() * 1000);
  }
  function stopClock() {
    if (ui.clock) clearInterval(ui.clock);
    ui.clock = null;
  }
  function wireOnce(el) {
    if (el.__pdWired) return;
    el.__pdWired = true;
    el.addEventListener("click", (e) => {
      const t = e.target.closest("button");
      if (!t || !el.contains(t)) return;
      if (t.dataset.pdPad) doPress(t.dataset.pdPad);
      else if (t.dataset.pdLearn) {
        midi.learn = midi.learn === t.dataset.pdLearn ? null : t.dataset.pdLearn;
        ui.flash = midi.learn ? `Hit a note on your controller for ${famLabel(midi.learn)}.` : "";
        redraw();
      } else if (t.dataset.pd === "record") {
        if (take.on) {
          stopClock();
          ui.flash = takeStop().text;
        } else {
          takeStart();
          startClock();
          ui.flash = "";
        }
        redraw();
      } else if (t.dataset.pd === "undo") {
        const h = E() ? E().history().undo : [];
        ui.flash = h.length && E().undo() ? `Took back: ${h[h.length - 1]}.` : "Nothing to undo.";
        redraw();
      } else if (t.dataset.pd === "midi") enable().then(redraw);
    });
    el.addEventListener("change", (e) => {
      const t = e.target;
      if (t.dataset.pd === "moment") {
        const i = Number(t.value) || 0;
        if (hasScreen() && typeof SC().setRow === "function") SC().setRow(i);
        ui.index = i;
        redraw();
      } else if (t.dataset.pd === "set") {
        api.set({ set: t.value });
        redraw();
      }
    });
  }
  /* Keys 1 to 9, 0, - and = press the pads in order while this tab is open (not while typing in a field). */
  root.addEventListener(
    "keydown",
    (e) => {
      if (!mounted() || e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
      const tg = e.target;
      if (tg && (tg.isContentEditable || /^(INPUT|SELECT|TEXTAREA)$/.test(tg.tagName))) return;
      const k = KEYS.indexOf(e.key);
      const p = k >= 0 ? pads()[k] : null;
      if (!p) return;
      e.preventDefault();
      e.stopPropagation();
      doPress(p.family);
    },
    true
  );
  api.midi.listen((ev) => {
    if (ev.type === "note") doPress(ev.family);
    else {
      if (ev.type === "learned") ui.flash = `${famLabel(ev.family)} now plays on note ${ev.note}.`;
      redraw();
    }
  });
  /* The Screen's playhead moved: the barometer reads the new moment. */
  let screenHooked = false;
  function hookScreen() {
    if (screenHooked || !SC() || typeof SC().on !== "function") return;
    screenHooked = true;
    SC().on(() => mounted() && redraw());
  }
  function register() {
    const U = root.CurioMomentumUI;
    if (!U) return false;
    hookScreen();
    U.addTab({ id: "pads", label: "Pads", mount });
    if (settings.midi) enable();
    return true;
  }
  if (!register()) {
    let tries = 0;
    const t = setInterval(() => (register() || ++tries > 100) && clearInterval(t), 100);
  }
})();
