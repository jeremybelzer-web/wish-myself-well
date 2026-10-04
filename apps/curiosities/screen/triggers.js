/* screen/triggers.js: triggers, "curiosity proximity" (window.CurioTriggers).

   Built from the music app's notes (/mnt/project-files/reference/music-app-automation-notes.md, sections 7 and 8,
   items 2 to 5), translated to film. The notes' rule (section 9): match the reference; don't invent a variant. The
   difference list is /mnt/project-files/reference/music-vs-film-triggers.md.

   Any node, master node or suite gets "Assign On Trigger…" (right-click, or control-click on a Mac). One trigger is
   when + does + limits:
     when    a MIDI note or CC (Learn); any slider, knob, fader, button or drop-down in the app (Map… then click it;
             every control is registered through one call, mappable(id, label)); a track reaching an event (a cut,
             a line of dialogue, a character entering frame, a panel turn), or one chosen event ("that line, at
             moment 5"); the film reaching a section (sections are the timeline's markers: each runs to the next);
             an oscillator in moments (switches every 1, 2 or 4 moments); speech (the browser's own free speech
             recognition where there is one, typed words where there isn't); the camera watching the performer
             (movement in part of the picture, worked out in the browser, never uploaded, off until switched on)
     does    on · off · on/off · scale by % · set a value · follow a value continuously · press; each can latch,
             act only while held, or toggle
     limits  between two values; every time, the first N times or every Nth time; several separate ranges of
             moments; only in, or never in, these sections; only while playing
   A firing is a performance, not an undo step (CurioEngine.perform("triggers", layer)); it is put back when
   playback stops, or with Put everything back. Assigning, changing or removing a trigger is one undo step (a part
   of the app-wide store, saved under "curiosities-screen-triggers-v1", so project files carry it).

   window.CurioTriggers
     mappable(id, label, el?)   register a control as a trigger source (el gets data-mappable)
     controls()                 every registered control [{ id, label }]
     list(), get(id), add(t), set(id, patch), remove(id)   the saved triggers (each change one undo step)
     assign(target, at?)        open the editor for a new trigger on a target
                                target: { kind: "node", lk, row } | { kind: "suite", from: "curiosity", cur, track }
                                | { kind: "suite", from: "library", id } | { kind: "suite", from: "clip", id }
                                | { kind: "master", id }
     edit(id), openList(), openProximity(), close()
     input(sourceKey, down, value)  feed any source by key ("midi:note:60", "control:<id>", "speech", "body:left"...)
     trigger(id, on, value?)    fire one trigger by id from outside (a hook, like the music app's MASTER.trigger)
     midi(ev)                   feed a MIDI event { kind: "note"|"cc", num, on?, vel?, val? }
     hear(text)                 feed heard (or typed) words
     putBack()                  end the performance now
     forTarget(targetId)        the triggers aimed at "master:<id>", "mnode:<id>" or a bare id, for the master
                                nodes' Suite / Proximity view: [{ id, label, source: { kind, id, lk?, row? } }]
     sections(), eventsAt(j), performing(), camera { on, start(), stop() }, speech { supported, on, start(), stop() }
     core                       the pure part (no page), for tests */
(function () {
  const root = typeof window !== "undefined" ? window : globalThis;
  const hasDoc = typeof document !== "undefined";
  const E = () => root.CurioEngine;
  const S = () => root.CurioScale;
  const L = () => root.CurioLevels;
  const Lanes = () => root.CurioLanes;
  const Scr = () => root.CurioScreen;
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const KEY = "curiosities-screen-triggers-v1";
  const MAX = 200;
  const isObj = (x) => x != null && typeof x === "object" && !Array.isArray(x);
  const clamp = (x, lo, hi, d) => {
    const n = Number(x);
    return isFinite(n) ? Math.max(lo, Math.min(hi, n)) : d;
  };
  const txt = (s, n) => String(s == null ? "" : s).trim().slice(0, n || 80);

  /* ---------- the pure part ---------- */
  const WHEN = [
    ["midi", "A MIDI note or CC"],
    ["control", "A control in the app"],
    ["event", "An event on a track"],
    ["section", "The film reaching a section"],
    ["lfo", "An oscillator"],
    ["speech", "Speech"],
    ["body", "The camera (your body)"],
  ];
  const EVENTS = [
    ["cut", "A cut", "The film cuts into this moment (its join is a Cut)."],
    ["line", "A line of dialogue", "A character starts speaking (their Speaking now lane turns to speaking)."],
    ["enter", "A character entering frame", "A character's Body in frame is enters."],
    ["panel", "A panel turn", "Every new moment: the next panel of the storyboard turns."],
  ];
  const DOES = [
    ["on", "On"],
    ["off", "Off"],
    ["onoff", "On / off"],
    ["scale", "Scale by %"],
    ["set", "Set a value"],
    ["follow", "Follow a value"],
    ["press", "Press"],
  ];
  const MODES = [
    ["latch", "Latch", "Stays once it fires, until playback stops."],
    ["hold", "While held", "Acts only while the source is held (a pad down, a section playing, a hand moving)."],
    ["toggle", "Toggle", "Each firing switches it: on, then back, then on again."],
  ];
  const COUNTS = [
    ["every", "Every time"],
    ["first", "Only the first N times"],
    ["nth", "Every Nth time"],
  ];
  const ZONES = [
    ["any", "Any movement"],
    ["left", "Movement on the left"],
    ["right", "Movement on the right"],
    ["high", "Movement up high (a raised hand)"],
  ];
  const LFO_EVERY = [1, 2, 4];
  const pick = (list, v, d) => (list.some((x) => x[0] === v) ? v : d);

  function cleanTarget(t) {
    if (!isObj(t)) return null;
    if (t.kind === "node" && typeof t.lk === "string" && t.lk.includes("|") && t.row) return { kind: "node", lk: txt(t.lk, 120), row: txt(t.row, 80) };
    if (t.kind === "suite" && t.from === "curiosity" && t.cur) return { kind: "suite", from: "curiosity", cur: txt(t.cur, 120), track: t.track ? txt(t.track, 80) : "" };
    if (t.kind === "suite" && (t.from === "library" || t.from === "clip") && t.id) return { kind: "suite", from: t.from, id: txt(t.id, 120) };
    if (t.kind === "master" && t.id != null && t.id !== "") return { kind: "master", id: txt(t.id, 120), node: t.node ? txt(t.node, 120) : "" };
    return null;
  }
  function cleanWhen(w) {
    w = isObj(w) ? w : {};
    const kind = pick(WHEN, w.kind, "midi");
    if (kind === "midi") return { kind, type: w.type === "cc" ? "cc" : "note", num: w.num === "" || w.num == null ? null : clamp(w.num, 0, 127, null) };
    if (kind === "control") return { kind, id: txt(w.id, 160), label: txt(w.label, 80) };
    if (kind === "event") return { kind, event: pick(EVENTS, w.event, "cut"), track: txt(w.track, 80), row: txt(w.row, 80) };
    if (kind === "section") return { kind, section: txt(w.section, 80) };
    if (kind === "lfo") return { kind, every: LFO_EVERY.includes(Number(w.every)) ? Number(w.every) : 1 };
    if (kind === "speech") return { kind, words: txt(w.words, 80) };
    return { kind, zone: pick(ZONES, w.zone, "any") };
  }
  function cleanDoes(d) {
    d = isObj(d) ? d : {};
    return { act: pick(DOES, d.act, "on"), amount: Math.round(clamp(d.amount, -100, 100, 50)), value: Math.round(clamp(d.value, 0, 100, 100)), mode: pick(MODES, d.mode, "latch") };
  }
  function cleanLimits(l) {
    l = isObj(l) ? l : {};
    const lo = Math.round(clamp(l.lo, 0, 100, 0));
    const hi = Math.round(clamp(l.hi, 0, 100, 100));
    const ranges = (Array.isArray(l.ranges) ? l.ranges : [])
      .map((r) => (Array.isArray(r) ? [Math.round(clamp(r[0], 1, 9999, 1)), Math.round(clamp(r[1], 1, 9999, 1))] : null))
      .filter(Boolean)
      .map((r) => [Math.min(r[0], r[1]), Math.max(r[0], r[1])])
      .slice(0, 16);
    const sec = isObj(l.sections) ? l.sections : {};
    return {
      lo: Math.min(lo, hi),
      hi: Math.max(lo, hi),
      count: pick(COUNTS, l.count, "every"),
      n: Math.round(clamp(l.n, 1, 999, 1)),
      ranges,
      sections: { mode: ["any", "only", "never"].includes(sec.mode) ? sec.mode : "any", list: (Array.isArray(sec.list) ? sec.list : []).map((x) => txt(x, 80)).filter(Boolean).slice(0, 32) },
      playing: !!l.playing,
    };
  }
  function cleanOne(t, i) {
    if (!isObj(t)) return null;
    const target = cleanTarget(t.target);
    if (!target) return null;
    return { id: /^[\w-]{1,40}$/.test(String(t.id || "")) ? String(t.id) : "t" + (i + 1), name: txt(t.name, 80), on: t.on !== false, target, when: cleanWhen(t.when), does: cleanDoes(t.does), limits: cleanLimits(t.limits) };
  }
  function clean(raw) {
    const list = [];
    const seen = new Set();
    (isObj(raw) && Array.isArray(raw.list) ? raw.list : []).slice(0, MAX).forEach((t, i) => {
      const c = cleanOne(t, i);
      if (!c) return;
      while (seen.has(c.id)) c.id += "x";
      seen.add(c.id);
      list.push(c);
    });
    return { list };
  }

  /* Sections of the film: each marker on the timeline starts one, running to the next marker (the music app's
     song sections are its Song Form row; the film's nearest thing is the markers, each with its own note). The
     stretch before the first marker, if any, is the Opening. -> [{ id, label, from, to }] (0-based moments) */
  function sectionsOf(markers, rows) {
    const ix = {};
    (rows || []).forEach((r, j) => (ix[r.id] = j));
    const n = (rows || []).length;
    const ms = (markers || [])
      .filter((m) => m && ix[m.row] != null)
      .map((m) => ({ id: String(m.row), j: ix[m.row], note: String(m.note || "").trim() }))
      .sort((a, b) => a.j - b.j);
    const out = [];
    if (!n) return out;
    if (!ms.length || ms[0].j > 0) out.push({ id: "opening", label: "Opening", from: 0, to: ms.length ? ms[0].j - 1 : n - 1 });
    ms.forEach((m, k) => out.push({ id: m.id, label: m.note || `Section at moment ${m.j + 1}`, from: m.j, to: k + 1 < ms.length ? ms[k + 1].j - 1 : n - 1 }));
    return out;
  }
  const sectionIdsAt = (secs, j) => secs.filter((s) => j >= s.from && j <= s.to).map((s) => s.id);

  /* Which events happen at moment j. look: { rows, tracks, value(rowId, trackId, cur), join(j) -> kind of the join
     into moment j (0-based; null for the first) }. -> [{ event, track }] (track "" for the whole film). */
  function eventsAt(look, j) {
    const out = [];
    const rows = look.rows || [];
    if (j < 0 || j >= rows.length) return out;
    if (j > 0 && (look.join ? look.join(j) : "cut") === "cut") out.push({ event: "cut", track: "" });
    if (j > 0) out.push({ event: "panel", track: "" });
    (look.tracks || []).forEach((t) => {
      const has = (c) => (t.curiosities || []).includes(c);
      const v = (jj, c) => look.value(rows[jj].id, t.id, c);
      if (has("eyeline.speaking") && v(j, "eyeline.speaking") === "speaking" && (j === 0 || v(j - 1, "eyeline.speaking") !== "speaking")) out.push({ event: "line", track: t.id });
      if (has("bodyEnter") && v(j, "bodyEnter") === "enters") out.push({ event: "enter", track: t.id });
    });
    return out;
  }
  function eventHits(when, list, rowId) {
    if (!when || when.kind !== "event") return false;
    if (when.row && when.row !== rowId) return false;
    return list.some((e) => e.event === when.event && (!when.track || !e.track || e.track === when.track));
  }
  /* The oscillator: on for `every` moments, off for `every` moments. */
  const lfoAt = (every, j) => Math.floor(j / Math.max(1, every)) % 2 === 0;

  /* Limits other than the count. ctx: { j, playing, value (0..1), sections: [ids] } */
  function limitsPass(lim, ctx) {
    if (lim.playing && !ctx.playing) return false;
    const v = Math.round((ctx.value == null ? 1 : ctx.value) * 100);
    if (v < lim.lo || v > lim.hi) return false;
    if (lim.ranges.length && !lim.ranges.some((r) => ctx.j + 1 >= r[0] && ctx.j + 1 <= r[1])) return false;
    const inList = (ctx.sections || []).some((id) => lim.sections.list.includes(id));
    if (lim.sections.mode === "only" && !inList) return false;
    if (lim.sections.mode === "never" && inList) return false;
    return true;
  }
  /* The count, after this firing was counted (1 for the first). */
  function countPass(lim, count) {
    if (lim.count === "first") return count <= lim.n;
    if (lim.count === "nth") return count % lim.n === 0;
    return true;
  }

  /* The camera: movement between two small grey frames (one byte per pixel), per part of the picture. Worked
     out in the browser; no picture leaves it. -> { any, left, right, high } each 0..1 (share of pixels moving) */
  function motion(prev, cur, w, h, thresh) {
    const out = { any: 0, left: 0, right: 0, high: 0 };
    if (!prev || !cur || prev.length !== cur.length || !w || !h) return out;
    const th = thresh == null ? 24 : thresh;
    let any = 0;
    let left = 0;
    let right = 0;
    let high = 0;
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        if (Math.abs(cur[i] - prev[i]) < th) continue;
        any++;
        if (x < w / 2) left++;
        else right++;
        if (y < h / 3) high++;
      }
    const n = w * h;
    return { any: any / n, left: left / (n / 2), right: right / (n / 2), high: high / (n / 3) };
  }
  const MOVE_AT = 0.06; /* a part of the picture counts as moving once this share of it changes */

  /* What a trigger does to its target's lanes while it acts: the engine's perform layer for one lane. */
  function effectFor(does, live, drawnOn) {
    switch (does.act) {
      case "on":
      case "press":
        return { on: true };
      case "off":
        return { on: false };
      case "onoff":
        return { on: !drawnOn };
      case "scale":
        return { scale: does.amount };
      case "set":
        return { set: does.value / 100 };
      case "follow":
        return { set: live == null ? does.value / 100 : live };
    }
    return {};
  }
  function nodeEffect(does, live) {
    switch (does.act) {
      case "on":
      case "press":
        return {};
      case "off":
      case "onoff":
        return { off: true };
      case "scale":
        return { scale: does.amount };
      case "set":
        return { set: does.value / 100 };
      case "follow":
        return { set: live == null ? does.value / 100 : live };
    }
    return {};
  }

  const core = { WHEN, EVENTS, DOES, MODES, COUNTS, ZONES, LFO_EVERY, MOVE_AT, clean, cleanOne, sectionsOf, sectionIdsAt, eventsAt, eventHits, lfoAt, limitsPass, countPass, motion, effectFor, nodeEffect };

  /* ---------- the saved triggers: a part of the app-wide store (one undo step per change) ---------- */
  let part = null;
  const changed = [];
  function store() {
    if (part) return part;
    const commands = {
      add: (d, m) => {
        const c = cleanOne(m.trigger, d.list.length);
        if (!c) return;
        let k = d.list.length + 1;
        c.id = m.trigger && m.trigger.id && !d.list.some((x) => x.id === m.trigger.id) ? c.id : "t" + k;
        while (d.list.some((x) => x.id === c.id)) c.id = "t" + ++k;
        d.list.push(c);
      },
      set: (d, m) => {
        const i = d.list.findIndex((x) => x.id === m.id);
        if (i < 0) return;
        const c = cleanOne(Object.assign({}, d.list[i], m.patch, { id: m.id }), i);
        if (c) d.list[i] = c;
      },
      remove: (d, m) => (d.list = d.list.filter((x) => x.id !== m.id)),
    };
    const St = root.CurioStore;
    if (St && typeof St.part === "function") {
      try {
        part = St.part("screenTriggers", { key: KEY, initial: () => ({ list: [] }), normalize: clean, commands });
        part.on(() => changed.forEach((fn) => fn()));
        return part;
      } catch (e) {
        part = null;
      }
    }
    let data = { list: [] };
    try {
      data = clean(JSON.parse(localStorage.getItem(KEY)));
    } catch (e) {}
    part = {
      undo: false,
      view: () => data,
      send(msg) {
        if (!msg || !commands[msg.type]) return { ok: false };
        const d = JSON.parse(JSON.stringify(data));
        commands[msg.type](d, msg);
        const next = clean(d);
        if (JSON.stringify(next) === JSON.stringify(data)) return { ok: true, unchanged: true };
        data = next;
        try {
          localStorage.setItem(KEY, JSON.stringify(data));
        } catch (e) {}
        changed.forEach((fn) => fn());
        return { ok: true };
      },
      on: () => () => {},
    };
    return part;
  }
  const list = () => (store().view().list || []).map((t) => JSON.parse(JSON.stringify(t)));
  const get = (id) => list().find((t) => t.id === id) || null;
  function add(t) {
    const before = new Set(list().map((x) => x.id));
    const r = store().send({ type: "add", trigger: t, label: `Assign On Trigger: ${t && t.name ? t.name : "a trigger"}` });
    const made = list().find((x) => !before.has(x.id));
    return Object.assign({}, r, { id: made ? made.id : null });
  }
  const set = (id, patch) => store().send({ type: "set", id, patch, label: `Change a trigger: ${(get(id) || {}).name || id}` });
  function remove(id) {
    const name = (get(id) || {}).name || id;
    release(id);
    return store().send({ type: "remove", id, label: `Remove a trigger: ${name}` });
  }

  /* ---------- names in plain words ---------- */
  const label = (cur) => (S() ? S().label(cur) : cur);
  const trackName = (id) => {
    const t = E() && E().state().tracks.find((x) => x.id === id);
    return t ? t.label : id;
  };
  const rowNum = (rowId) => (E() ? E().state().rows.findIndex((r) => r.id === rowId) + 1 : 0);
  function targetName(t) {
    if (!t) return "nothing";
    if (t.kind === "node") {
      const cur = t.lk.slice(t.lk.indexOf("|") + 1);
      return `${label(cur)} node at moment ${rowNum(t.row) || "?"}`;
    }
    if (t.kind === "master") return `master node ${t.node || t.id}`;
    if (t.from === "curiosity") return `${label(t.cur)} (its suite${t.track ? ", " + trackName(t.track) : ""})`;
    if (t.from === "library") {
      const it = L() && L().get("suite", t.id);
      return `the ${it ? it.label : t.id} suite`;
    }
    const c = Lanes() && Lanes().suiteClips ? Lanes().suiteClips().find((x) => x.id === t.id) : null;
    return `the ${c ? c.name : t.id} suite clip`;
  }
  function whenName(w) {
    if (w.kind === "midi") return w.num == null ? `any MIDI ${w.type === "cc" ? "knob (CC)" : "note"}` : w.type === "cc" ? `MIDI CC ${w.num}` : `MIDI note ${w.num}`;
    if (w.kind === "control") return w.id ? `the control "${w.label || w.id}"` : "a control (not mapped yet)";
    if (w.kind === "event") {
      const e = EVENTS.find((x) => x[0] === w.event);
      return `${e ? e[1].toLowerCase() : w.event}${w.track ? " on " + trackName(w.track) : ""}${w.row ? ` (only the one at moment ${rowNum(w.row) || "?"})` : ""}`;
    }
    if (w.kind === "section") {
      const s = sections().find((x) => x.id === w.section);
      return `the film reaching ${s ? s.label : "a section"}`;
    }
    if (w.kind === "lfo") return `an oscillator, every ${w.every} moment${w.every === 1 ? "" : "s"}`;
    if (w.kind === "speech") return w.words ? `the words "${w.words}"` : "speech (no words yet)";
    return (ZONES.find((z) => z[0] === w.zone) || ZONES[0])[1].toLowerCase() + " (camera)";
  }
  function doesName(d) {
    const a = (DOES.find((x) => x[0] === d.act) || DOES[0])[1].toLowerCase();
    const how = d.act === "scale" ? ` ${d.amount > 0 ? "+" : ""}${d.amount}%` : d.act === "set" ? ` to ${d.value}%` : "";
    return `${a}${how}${d.act === "press" ? "" : ", " + (MODES.find((m) => m[0] === d.mode) || MODES[0])[1].toLowerCase()}`;
  }
  const autoName = (t) => `${whenName(t.when)} → ${(DOES.find((x) => x[0] === t.does.act) || DOES[0])[1].toLowerCase()}`;
  const nameOf = (t) => t.name || autoName(t);

  /* ---------- controls: every slider, knob, fader, button or drop-down, registered through one call ---------- */
  const registry = new Map();
  function mappable(id, lbl, el) {
    id = txt(id, 160);
    if (!id) return null;
    const had = registry.get(id);
    registry.set(id, { id, label: txt(lbl, 80) || (had && had.label) || id });
    if (el && el.dataset) el.dataset.mappable = id;
    return id;
  }
  const CONTROL_SEL = 'input:not([type="hidden"]):not([type="file"]), select, textarea, button, [role="slider"], .sc-knob, [data-mappable]';
  const ID_ATTRS = ["mappable", "knob", "set", "stepSet", "act", "view", "level", "wins", "arr", "speed", "pickLayout", "pickItem", "lk", "mode", "drop", "v", "cwPreset", "cwShape", "cwMidi", "winLane", "icat", "libtab", "pickCard", "addCard"];
  function controlOf(t) {
    const el = t && t.closest ? t.closest(CONTROL_SEL) : null;
    if (!el || el.closest(".ctr-win, .ctr-menu, .ctr-toast")) return null;
    return el;
  }
  function controlId(el) {
    if (!el) return "";
    if (el.dataset && el.dataset.mappable) return el.dataset.mappable;
    const parts = [];
    ID_ATTRS.forEach((a) => el.dataset && el.dataset[a] != null && el.dataset[a] !== "" && parts.push(a + "=" + el.dataset[a]));
    if (!parts.length && el.id) parts.push("id=" + el.id);
    if (!parts.length && el.name) parts.push("name=" + el.name);
    if (!parts.length && el.getAttribute && el.getAttribute("aria-label")) parts.push("label=" + el.getAttribute("aria-label"));
    if (!parts.length && el.tagName === "BUTTON" && el.textContent.trim()) parts.push("button=" + el.textContent.trim().slice(0, 40));
    return parts.length ? el.tagName.toLowerCase() + ":" + parts.join(";") : "";
  }
  function controlLabel(el) {
    const a = el.getAttribute && (el.getAttribute("aria-label") || "");
    const lab = el.id && hasDoc ? document.querySelector(`label[for="${CSS.escape(el.id)}"]`) : null;
    const t = (el.getAttribute && el.getAttribute("title")) || "";
    const words = a || (lab && lab.textContent) || (el.closest && el.closest("label") && el.closest("label").textContent) || (el.tagName === "BUTTON" ? el.textContent : "") || t.split(/[.:]/)[0] || el.placeholder || controlId(el);
    return txt(String(words).replace(/\s+/g, " "), 80);
  }
  function controlValue(el) {
    if (!el) return null;
    if (el.tagName === "INPUT" && (el.type === "range" || el.type === "number")) {
      const lo = Number(el.min || 0);
      const hi = Number(el.max || 100);
      return hi > lo ? clamp((Number(el.value) - lo) / (hi - lo), 0, 1, 0) : 0;
    }
    if (el.tagName === "INPUT" && (el.type === "checkbox" || el.type === "radio")) return el.checked ? 1 : 0;
    if (el.tagName === "SELECT") return el.options.length > 1 ? el.selectedIndex / (el.options.length - 1) : 1;
    const now = el.getAttribute && el.getAttribute("aria-valuenow");
    if (now != null && now !== "") {
      const lo = Number(el.getAttribute("aria-valuemin") || el.dataset.min || 0);
      const hi = Number(el.getAttribute("aria-valuemax") || el.dataset.max || 100);
      return hi > lo ? clamp((Number(now) - lo) / (hi - lo), 0, 1, 0) : 0;
    }
    return null;
  }
  /* Register every control on the page (or under el) that a person can use. */
  function scan(el) {
    if (!hasDoc) return 0;
    let n = 0;
    (el || document).querySelectorAll(CONTROL_SEL).forEach((c) => {
      if (c.closest(".ctr-win, .ctr-menu, .ctr-toast")) return;
      const id = controlId(c);
      if (id && mappable(id, controlLabel(c))) n++;
    });
    return n;
  }

  /* ---------- the performance ---------- */
  const live = {}; /* trigger id -> { active, held, value, count, flip, timer } */
  const st = (id) => live[id] || (live[id] = { active: false, held: false, value: null, count: 0, fired: 0 });
  let playingNow = false;
  let lastRow = -1;
  const rowNow = () => (Scr() && Scr().row ? Scr().row() : 0);
  function look() {
    const Eng = E();
    const s = Eng.state();
    return {
      rows: s.rows,
      tracks: s.tracks,
      value: (r, t, c) => Eng.value(r, t, c),
      join: (j) => {
        const T = Scr() && Scr().transitions;
        const x = T && T.at ? T.at(j + 1) : null;
        return x && x.kind ? x.kind : "cut";
      },
    };
  }
  function sections() {
    if (!E()) return [];
    const tl = Lanes() && Lanes().tools ? Lanes().tools() : {};
    return sectionsOf(tl.markers || [], E().state().rows);
  }
  function eventsNow(j) {
    return E() ? eventsAt(look(), j) : [];
  }
  /* The lanes a target stands for, now. */
  function lanesOf(target, s) {
    s = s || E().state();
    const out = [];
    const each = (fn) => s.tracks.forEach((t) => t.curiosities.forEach((c) => fn(t, c)));
    const base = (c) => String(c).split(".")[0];
    if (target.kind === "node") return [target.lk];
    if (target.kind === "suite" && target.from === "curiosity") {
      const under = (c) => c === target.cur || (!target.cur.includes(".") && base(c) === target.cur);
      each((t, c) => (!target.track || t.id === target.track) && under(c) && out.push(t.id + "|" + c));
      return out;
    }
    if (target.kind === "suite") {
      let curs = [];
      if (target.from === "library" && L()) curs = L().resolve("suite", target.id).curiosities;
      if (target.from === "clip" && Lanes() && Lanes().suiteClips) curs = (Lanes().suiteClips().find((x) => x.id === target.id) || {}).curiosities || [];
      const set2 = new Set(curs.map(base));
      each((t, c) => set2.has(base(c)) && out.push(t.id + "|" + c));
    }
    return out;
  }
  const locked = (lk) => !!(Lanes() && Lanes().isLocked && Lanes().isLocked(lk));
  /* Lay every acting trigger over the film, in the order they were assigned (a later one wins). */
  function apply() {
    const Eng = E();
    if (!Eng || !Eng.perform) return;
    const s = Eng.state();
    const layer = { lanes: {} };
    let any = false;
    list().forEach((t) => {
      const x = live[t.id];
      if (!x || !x.active || t.target.kind === "master") return;
      lanesOf(t.target, s).forEach((lk) => {
        if (locked(lk)) return; /* a locked lane (🔒) keeps what it plays */
        const o = layer.lanes[lk] || (layer.lanes[lk] = {});
        if (t.target.kind === "node") {
          o.nodes = o.nodes || {};
          o.nodes[t.target.row] = nodeEffect(t.does, x.value);
        } else {
          const drawn = s.lanes[lk];
          Object.assign(o, effectFor(t.does, x.value, drawn ? drawn.on : true));
        }
        any = true;
      });
    });
    Eng.perform("triggers", any ? layer : null);
    redraw();
  }
  let drawQueued = false;
  function redraw() {
    if (drawQueued || !hasDoc) return;
    drawQueued = true;
    const go = () => {
      drawQueued = false;
      inRedraw = true;
      try {
        if (Scr() && Scr().isOpen && Scr().isOpen()) Scr().setRow(rowNow());
      } catch (e) {}
      inRedraw = false;
      drawProx();
    };
    if (typeof requestAnimationFrame === "function") requestAnimationFrame(go);
    else setTimeout(go, 0);
  }
  let inRedraw = false;
  function masterCall(t, on, opts) {
    const M = root.CurioMasters || (Lanes() && Lanes().trigger ? Lanes() : null);
    if (!M || typeof M.trigger !== "function") return;
    try {
      M.trigger(t.target.node || t.target.id, on, opts || {});
    } catch (e) {}
  }
  function setActive(t, on) {
    const x = st(t.id);
    if (x.active === on && t.does.act !== "follow") return;
    x.active = on;
    if (t.target.kind === "master") {
      if (!on) masterCall(t, null);
      else if (t.does.act === "off") masterCall(t, false);
      else if (t.does.act === "onoff") masterCall(t, !(x.flip = !x.flip));
      else if (t.does.act === "scale") masterCall(t, true, { scale: t.does.amount });
      else if (t.does.act === "set" || t.does.act === "follow") masterCall(t, true, { scale: Math.round(((t.does.act === "set" ? t.does.value / 100 : x.value == null ? 1 : x.value) * 200) - 100) });
      else masterCall(t, true);
      drawProx();
      return;
    }
    apply();
  }
  function ctxNow(value) {
    const j = rowNow();
    return { j, playing: playingNow, value, sections: sectionIdsAt(sections(), j) };
  }
  /* A source went down (pressed, entered, heard...) for trigger t. */
  function press(t, value) {
    if (!t.on) return false;
    const x = st(t.id);
    x.held = true;
    if (value != null) x.value = value;
    if (!limitsPass(t.limits, ctxNow(value))) return false;
    x.count++;
    if (!countPass(t.limits, x.count)) return false;
    x.fired++;
    x.lastAt = Date.now();
    if (t.does.act === "press") {
      setActive(t, true);
      clearTimeout(x.timer);
      x.pressRow = rowNow();
      x.timer = setTimeout(() => setActive(t, false), momentMs());
      return true;
    }
    if (t.does.mode === "toggle") setActive(t, !x.active);
    else setActive(t, true);
    return true;
  }
  /* The source let go. */
  function letGo(t) {
    const x = st(t.id);
    x.held = false;
    if (t.does.act !== "press" && t.does.mode === "hold" && x.active) setActive(t, false);
  }
  /* A continuous value moved while held (a CC, a slider, a hand): follow it. */
  function moved(t, value) {
    const x = st(t.id);
    x.value = value;
    if (t.does.act === "follow" && x.active) {
      if (!limitsPass(t.limits, ctxNow(value))) return;
      if (t.target.kind === "master") setActive(t, true);
      else apply();
    }
  }
  const momentMs = () => Math.round(1100 / ((Scr() && Scr().state ? Scr().state().speed : 1) || 1));
  function release(id) {
    const x = live[id];
    if (!x) return;
    clearTimeout(x.timer);
    if (x.active) {
      const t = get(id);
      x.active = false;
      if (t && t.target.kind === "master") masterCall(t, null);
    }
  }
  /* End the performance: everything plays as drawn again (the music app: put back when playback stops). */
  function putBack(why) {
    list().forEach((t) => {
      release(t.id);
      const x = live[t.id];
      if (x) {
        x.count = 0;
        x.held = false;
        x.flip = false;
      }
    });
    if (E() && E().perform) E().perform(null);
    redraw();
    if (why) toast(why);
  }

  /* Sources. key: "midi:note:60", "midi:cc:7", "control:<id>", "speech", "body:<zone>"; down true/false; value 0..1 */
  function matches(t, key) {
    const w = t.when;
    if (w.kind === "midi") {
      const m = key.match(/^midi:(note|cc):(\d+)$/);
      return !!m && m[1] === w.type && (w.num == null || Number(m[2]) === w.num);
    }
    if (w.kind === "control") return key === "control:" + w.id;
    if (w.kind === "body") return key === "body:" + w.zone;
    return false;
  }
  function input(key, down, value) {
    let n = 0;
    list().forEach((t) => {
      if (!matches(t, key)) return;
      const x = st(t.id);
      if (down && !x.held) n += press(t, value) ? 1 : 0;
      else if (down) moved(t, value);
      else if (!down && x.held) letGo(t);
    });
    drawProx();
    return n;
  }
  /* A hook for any other input (the music app's MASTER.trigger(id, on)): fire one trigger by its id. */
  function trigger(id, on, value) {
    const t = get(id);
    if (!t) return false;
    if (on) return st(id).held ? (moved(t, value == null ? 1 : value), true) : press(t, value == null ? 1 : value);
    letGo(t);
    return true;
  }
  /* MIDI, through the app's one MIDI connection (automation.js). */
  const learn = { midi: null, map: null };
  function midi(ev) {
    if (!ev || (ev.kind !== "note" && ev.kind !== "cc")) return;
    if (learn.midi && (ev.kind === "cc" || ev.on)) {
      const fn = learn.midi;
      learn.midi = null;
      fn({ type: ev.kind, num: ev.num });
      return;
    }
    const key = `midi:${ev.kind}:${ev.num}`;
    if (ev.kind === "note") input(key, !!ev.on, ev.on ? (ev.vel == null ? 127 : ev.vel) / 127 : 0);
    else input(key, ev.val > 0, ev.val / 127);
  }
  let midiHooked = false;
  function hookMidi() {
    const A = root.CurioAuto;
    if (midiHooked || !A || !A.on) return midiHooked;
    A.on((type, ev) => type === "midi" && midi(ev));
    midiHooked = true;
    return true;
  }
  function connectMidi() {
    hookMidi();
    const A = root.CurioAuto;
    if (!A || !A.connectMidi) return Promise.resolve(false);
    return A.connectMidi().then((ok) => (drawProx(), ok));
  }
  const midiStatus = () => {
    const A = root.CurioAuto;
    return A && A.midi && A.midi.status && A.midi.status !== "off" ? A.midi.status : "MIDI is not connected yet.";
  };

  /* The playhead: events, sections and the oscillator are checked on every new moment. */
  function onRow(ev) {
    if (inRedraw) return;
    const playing = Scr() && Scr().playing ? !!Scr().playing() : !!(ev && ev.playing);
    if (playingNow && !playing) {
      playingNow = false;
      lastRow = -1;
      return putBack("Playback stopped: everything the triggers did is put back.");
    }
    if (!playingNow && playing) {
      playingNow = true;
      list().forEach((t) => live[t.id] && (live[t.id].count = 0));
    }
    const j = ev && ev.row != null ? ev.row : rowNow();
    if (j === lastRow) return;
    lastRow = j;
    if (!E()) return;
    const evs = eventsNow(j);
    const rowId = (E().state().rows[j] || {}).id;
    const secs = sectionIdsAt(sections(), j);
    list().forEach((t) => {
      const x = st(t.id);
      if (t.does.act === "press" && x.active && x.pressRow !== j) {
        clearTimeout(x.timer);
        setActive(t, false);
      }
      const w = t.when;
      let down = null;
      if (w.kind === "event") down = eventHits(w, evs, rowId);
      else if (w.kind === "section") down = secs.includes(w.section);
      else if (w.kind === "lfo") down = lfoAt(w.every, j);
      if (down === null) {
        /* A trigger held by a range or a section lets go when the playhead leaves it. */
        if (x.active && t.does.mode === "hold" && !limitsPass(t.limits, ctxNow(x.value))) setActive(t, false);
        return;
      }
      /* An event lasts its one moment: a new one is a fresh press. */
      if (down && x.held && w.kind === "event") letGo(t);
      if (down && !st(t.id).held) press(t, 1);
      else if (!down && x.held) letGo(t);
    });
    drawProx();
  }

  /* ---------- speech: the browser's own free speech recognition, or typed words ---------- */
  const norm = (s) =>
    String(s || "")
      .toLowerCase()
      .replace(/[^a-z0-9' ]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  const speech = {
    get supported() {
      return !!(root.SpeechRecognition || root.webkitSpeechRecognition);
    },
    on: false,
    rec: null,
    heard: "",
    start() {
      const R = root.SpeechRecognition || root.webkitSpeechRecognition;
      if (!R) return toast("This browser has no free speech recognition (Chrome, Edge and Safari do). Type the words in the Curiosity Proximity window instead."), false;
      if (speech.on) return true;
      const rec = new R();
      rec.lang = (root.navigator && navigator.language) || "en-US";
      rec.continuous = true;
      rec.interimResults = false;
      rec.onresult = (e) => {
        for (let i = e.resultIndex; i < e.results.length; i++) if (e.results[i].isFinal) hear(e.results[i][0].transcript);
      };
      rec.onerror = (e) => {
        if (e && (e.error === "not-allowed" || e.error === "service-not-allowed")) {
          speech.on = false;
          toast("The microphone was refused, so speech can't fire triggers. Type the words instead.");
          drawProx();
        }
      };
      rec.onend = () => {
        if (speech.on)
          try {
            rec.start();
          } catch (e) {}
      };
      speech.rec = rec;
      speech.on = true;
      try {
        rec.start();
      } catch (e) {}
      drawProx();
      return true;
    },
    stop() {
      speech.on = false;
      if (speech.rec)
        try {
          speech.rec.stop();
        } catch (e) {}
      speech.rec = null;
      drawProx();
    },
  };
  /* Heard (or typed) words fire every speech trigger whose words are in them, for one moment. */
  function hear(text) {
    const said = " " + norm(text) + " ";
    speech.heard = String(text || "").slice(0, 120);
    let n = 0;
    list().forEach((t) => {
      if (t.when.kind !== "speech" || !t.when.words) return;
      if (!said.includes(" " + norm(t.when.words) + " ")) return;
      if (press(t, 1)) n++;
      setTimeout(() => letGo(t), momentMs());
    });
    drawProx();
    return n;
  }

  /* ---------- the camera: movement in parts of the picture, in the browser only, off by default ---------- */
  const camera = {
    on: false,
    stream: null,
    video: null,
    canvas: null,
    prev: null,
    timer: null,
    now: { any: 0, left: 0, right: 0, high: 0 },
    start() {
      const md = root.navigator && navigator.mediaDevices;
      if (!md || !md.getUserMedia) return toast("This browser can't use a camera here. The camera trigger stays off."), Promise.resolve(false);
      if (camera.on) return Promise.resolve(true);
      return md
        .getUserMedia({ video: { width: 160, height: 120 }, audio: false })
        .then((s) => {
          camera.stream = s;
          const v = (camera.video = document.createElement("video"));
          v.muted = true;
          v.playsInline = true;
          v.srcObject = s;
          v.play().catch(() => {});
          camera.canvas = document.createElement("canvas");
          camera.canvas.width = 32;
          camera.canvas.height = 24;
          camera.on = true;
          camera.timer = setInterval(cameraTick, 100);
          drawProx();
          return true;
        })
        .catch(() => (toast("The camera was refused or isn't there. The camera trigger stays off."), false));
    },
    stop() {
      clearInterval(camera.timer);
      camera.timer = null;
      if (camera.stream) camera.stream.getTracks().forEach((t) => t.stop());
      camera.stream = null;
      camera.video = null;
      camera.prev = null;
      camera.on = false;
      ZONES.forEach(([z]) => input("body:" + z, false, 0));
      drawProx();
    },
  };
  function cameraTick() {
    const v = camera.video;
    if (!v || v.readyState < 2) return;
    const c = camera.canvas;
    const g = c.getContext("2d", { willReadFrequently: true });
    g.drawImage(v, 0, 0, c.width, c.height);
    const px = g.getImageData(0, 0, c.width, c.height).data;
    const grey = new Uint8Array(c.width * c.height);
    for (let i = 0; i < grey.length; i++) grey[i] = (px[i * 4] * 3 + px[i * 4 + 1] * 4 + px[i * 4 + 2]) >> 3;
    if (camera.prev) body(motion(camera.prev, grey, c.width, c.height));
    camera.prev = grey;
  }
  /* Movement amounts (0..1 per part of the picture) fire the body triggers; tests feed this directly. */
  function body(m) {
    camera.now = m;
    ZONES.forEach(([z]) => {
      const a = m[z] || 0;
      input("body:" + z, a >= MOVE_AT, Math.min(1, a * 4));
    });
  }

  /* ---------- the page ---------- */
  let toastTimer = null;
  function toast(msg) {
    if (!hasDoc || !msg) return;
    let t = document.querySelector(".ctr-toast");
    if (!t) {
      t = document.createElement("div");
      t.className = "ctr-toast";
      t.setAttribute("role", "status");
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (t.hidden = true), 4000);
  }
  const host = () => (hasDoc ? document.querySelector(".sc-page:not([hidden])") || document.body : null);
  function win(id, title, sub) {
    let w = document.querySelector(`.ctr-win[data-ctr="${id}"]`);
    if (!w) {
      w = document.createElement("section");
      w.className = "ctr-win";
      w.dataset.ctr = id;
      w.setAttribute("role", "dialog");
      w.setAttribute("aria-label", title);
      const n = document.querySelectorAll(".ctr-win").length;
      w.style.left = Math.max(8, Math.min(innerWidth - 400, 120 + n * 30)) + "px";
      w.style.top = Math.max(8, 80 + n * 30) + "px";
      host().appendChild(w);
    }
    w.innerHTML = `<header class="ctr-h"><b>${esc(title)}</b><small>${esc(sub || "")}</small><button type="button" data-ctr-close aria-label="Close">×</button></header><div class="ctr-b"></div>`;
    return w;
  }
  function closeWin(id) {
    if (!hasDoc) return;
    document.querySelectorAll(id ? `.ctr-win[data-ctr="${id}"]` : ".ctr-win").forEach((w) => w.remove());
  }
  const opt = (v, l, cur) => `<option value="${esc(v)}"${String(cur) === String(v) ? " selected" : ""}>${esc(l)}</option>`;

  /* The editor: one trigger, when + does + limits. */
  let draft = null;
  function assign(target, at) {
    const tg = cleanTarget(target);
    if (!tg) return toast("That can't take a trigger."), null;
    if (tg.kind === "node" && locked(tg.lk)) return toast(`${label(tg.lk.slice(tg.lk.indexOf("|") + 1))} is locked (🔒 by its name), so its nodes stay as they are. Click the 🔒 to unlock it.`), null;
    draft = cleanOne({ id: "new", target: tg, when: { kind: "midi" }, does: {}, limits: {} }, 0);
    draft.id = "";
    drawEditor();
    return draft;
  }
  function edit(id) {
    const t = get(id);
    if (!t) return null;
    draft = t;
    drawEditor();
    return draft;
  }
  function editorHtml() {
    const t = draft;
    const w = t.when;
    const s = E() ? E().state() : { tracks: [], rows: [] };
    const secs = sections();
    let whenBody = "";
    if (w.kind === "midi")
      whenBody = `<label>Kind <select data-f="when.type">${opt("note", "Note (a pad or key)", w.type)}${opt("cc", "CC (a knob or fader)", w.type)}</select></label><label>Number <input type="number" min="0" max="127" data-f="when.num" value="${w.num == null ? "" : w.num}" placeholder="any"></label><button type="button" data-ctr-learn class="${learn.midi ? "on" : ""}">${learn.midi ? "Listening… move a knob or hit a pad" : "Learn"}</button>`;
    else if (w.kind === "control") whenBody = `<span class="ctr-k">${w.id ? esc(w.label || w.id) : "Nothing mapped yet."}</span><button type="button" data-ctr-map class="${learn.map ? "on" : ""}">${learn.map ? "Click any control… (Esc stops)" : "Map…"}</button>`;
    else if (w.kind === "event") {
      const evRows = [];
      if (E())
        s.rows.forEach((r, j) => {
          if (eventHits(Object.assign({}, w, { row: "" }), eventsNow(j), r.id)) evRows.push([r.id, `moment ${j + 1}`]);
        });
      whenBody = `<label>Event <select data-f="when.event">${EVENTS.map((e) => opt(e[0], e[1], w.event)).join("")}</select></label><label>On <select data-f="when.track">${opt("", "Any track", w.track)}${s.tracks.map((tr) => opt(tr.id, tr.label, w.track)).join("")}</select></label><label title="Pick one: only that one event, not every one like it (the music app's 'that note, at bar 23')">Which <select data-f="when.row">${opt("", "Every one", w.row)}${evRows.map(([id, l]) => opt(id, "Only the one at " + l, w.row)).join("")}${w.row && !evRows.some((x) => x[0] === w.row) ? opt(w.row, `Only the one at moment ${rowNum(w.row)} (not there now)`, w.row) : ""}</select></label><p class="ctr-k">${esc((EVENTS.find((e) => e[0] === w.event) || EVENTS[0])[2])}</p>`;
    } else if (w.kind === "section") whenBody = secs.length ? `<label>Section <select data-f="when.section">${opt("", "Pick one", w.section)}${secs.map((x) => opt(x.id, `${x.label} (moments ${x.from + 1}–${x.to + 1})`, w.section)).join("")}</select></label><p class="ctr-k">Sections are your markers on the timeline: each one runs to the next. Write "Act 2" in a marker's note to name it.</p>` : `<p class="ctr-k">Your film has no sections yet. Add a marker (M) on the timeline: each marker starts a section that runs to the next.</p>`;
    else if (w.kind === "lfo") whenBody = `<label>Switches every <select data-f="when.every">${LFO_EVERY.map((n) => opt(n, `${n} moment${n === 1 ? "" : "s"}`, w.every)).join("")}</select></label>`;
    else if (w.kind === "speech") whenBody = `<label>Words <input type="text" data-f="when.words" value="${esc(w.words)}" placeholder='e.g. "action"'></label><p class="ctr-k">${speech.supported ? "Uses your browser's own free speech recognition. Switch Listen on in the Curiosity Proximity window." : "This browser has no free speech recognition (Chrome, Edge and Safari do). You can type the words in the Curiosity Proximity window instead, and they fire the same way."}</p>`;
    else whenBody = `<label>Movement <select data-f="when.zone">${ZONES.map((z) => opt(z[0], z[1], w.zone)).join("")}</select></label><p class="ctr-k">The camera stays off until you switch it on in the Curiosity Proximity window. The picture is read in this browser only, as movement in parts of the frame; nothing is recorded or uploaded.</p>`;
    const d = t.does;
    const l = t.limits;
    const doesBody = `<label>Does <select data-f="does.act">${DOES.map((x) => opt(x[0], x[1], d.act)).join("")}</select></label>${d.act === "scale" ? `<label>By <input type="number" min="-100" max="100" step="5" data-f="does.amount" value="${d.amount}">%</label>` : ""}${d.act === "set" ? `<label>To <input type="number" min="0" max="100" step="5" data-f="does.value" value="${d.value}">% of its scale</label>` : ""}${d.act === "press" ? `<p class="ctr-k">A press acts for one moment, then lets go.</p>` : `<span class="ctr-seg" role="group" aria-label="How it acts">${MODES.map((m) => `<button type="button" data-ctr-mode="${m[0]}" class="${d.mode === m[0] ? "on" : ""}" aria-pressed="${d.mode === m[0]}" title="${esc(m[2])}">${esc(m[1])}</button>`).join("")}</span>`}`;
    const ranges = l.ranges.map((r, i) => `<span class="ctr-range">moments <input type="number" min="1" data-range="${i}|0" value="${r[0]}"> to <input type="number" min="1" data-range="${i}|1" value="${r[1]}"> <button type="button" data-range-del="${i}" aria-label="Remove this range">×</button></span>`).join("");
    const limBody = `<label>Only between <input type="number" min="0" max="100" data-f="limits.lo" value="${l.lo}"> and <input type="number" min="0" max="100" data-f="limits.hi" value="${l.hi}"> % (velocity or value)</label>
      <label><select data-f="limits.count">${COUNTS.map((c) => opt(c[0], c[1], l.count)).join("")}</select>${l.count === "every" ? "" : ` N = <input type="number" min="1" max="999" data-f="limits.n" value="${l.n}">`}</label>
      <div class="ctr-ranges"><span>Only in these moments:</span> ${ranges || '<span class="ctr-k">anywhere</span>'} <button type="button" data-range-add>+ Add a range</button></div>
      <div class="ctr-secs"><label>Sections <select data-f="limits.sections.mode">${opt("any", "Any section", l.sections.mode)}${opt("only", "Only in these sections", l.sections.mode)}${opt("never", "Never in these sections", l.sections.mode)}</select></label>${l.sections.mode === "any" ? "" : secs.map((x) => `<label class="ctr-chk"><input type="checkbox" data-sec="${esc(x.id)}"${l.sections.list.includes(x.id) ? " checked" : ""}> ${esc(x.label)}</label>`).join("") || '<span class="ctr-k">No sections yet (add markers).</span>'}</div>
      <label class="ctr-chk"><input type="checkbox" data-f="limits.playing"${l.playing ? " checked" : ""}> Only while playing</label>`;
    return `<p class="ctr-target">On <b>${esc(targetName(t.target))}</b></p>
      <label>Name <input type="text" data-f="name" value="${esc(t.name)}" placeholder="${esc(autoName(t))}"></label>
      <fieldset><legend>When</legend><label>Source <select data-f="when.kind">${WHEN.map((x) => opt(x[0], x[1], w.kind)).join("")}</select></label>${whenBody}</fieldset>
      <fieldset><legend>Does</legend>${doesBody}</fieldset>
      <fieldset><legend>Limits</legend>${limBody}</fieldset>
      <p class="ctr-acts"><button type="button" class="on" data-ctr-save>${t.id ? "Save" : "Assign"}</button>${t.id ? '<button type="button" data-ctr-del>Remove this trigger</button>' : ""}<button type="button" data-ctr-close>Cancel</button></p>`;
  }
  function drawEditor() {
    if (!hasDoc || !draft) return;
    const w = win("edit", draft.id ? "Trigger" : "Assign On Trigger", "when + does + limits");
    w.querySelector(".ctr-b").innerHTML = editorHtml();
  }
  function setPath(o, path, v) {
    const ks = path.split(".");
    let x = o;
    ks.slice(0, -1).forEach((k) => (x = x[k]));
    x[ks[ks.length - 1]] = v;
  }
  function editorInput(el) {
    if (!draft) return;
    const f = el.dataset.f;
    if (f) {
      let v = el.type === "checkbox" ? el.checked : el.value;
      if (el.type === "number") v = el.value === "" ? (f === "when.num" ? null : 0) : Number(el.value);
      if (f === "when.kind") draft.when = cleanWhen({ kind: v });
      else setPath(draft, f, v);
      if (f === "when.event" || f === "when.track") draft.when.row = "";
    } else if (el.dataset.range) {
      const [i, k] = el.dataset.range.split("|").map(Number);
      draft.limits.ranges[i][k] = Number(el.value) || 1;
    } else if (el.dataset.sec) {
      const L2 = draft.limits.sections.list;
      const id = el.dataset.sec;
      draft.limits.sections.list = el.checked ? [...new Set(L2.concat(id))] : L2.filter((x) => x !== id);
    } else return;
    const keepId = draft.id;
    draft = cleanOne(Object.assign({}, draft, { id: keepId || "new" }), 0);
    draft.id = keepId;
    if (el.type !== "text" && el.type !== "number") drawEditor();
  }
  function saveDraft() {
    if (!draft) return;
    const t = cleanOne(Object.assign({}, draft, { id: draft.id || "new" }), 0);
    if (t.when.kind === "control" && !t.when.id) return toast("Map a control first: click Map…, then click any slider, knob, button or drop-down."), null;
    if (t.when.kind === "speech" && !t.when.words) return toast("Write the words that fire it first."), null;
    if (t.when.kind === "section" && !t.when.section) return toast("Pick a section first (sections are your markers)."), null;
    let r;
    if (draft.id) {
      release(draft.id);
      r = set(draft.id, { name: t.name, on: t.on, target: t.target, when: t.when, does: t.does, limits: t.limits });
      toast(`Trigger saved: ${nameOf(t)}. Undo takes it back.`);
    } else {
      delete t.id;
      r = add(t);
      toast(`Assigned: when ${whenName(t.when)}, ${doesName(t.does)} on ${targetName(t.target)}. Undo takes it back.`);
    }
    draft = null;
    learn.map = null;
    learn.midi = null;
    closeWin("edit");
    drawList();
    drawProx();
    if (t.when.kind === "midi") connectMidi();
    if (["event", "section", "lfo"].includes(t.when.kind)) (lastRow = -1), onRow({ row: rowNow() });
    return r;
  }

  /* The Triggers window: every trigger, switched on or off, edited or removed. */
  function listHtml() {
    const ts = list();
    if (!ts.length) return `<p class="ctr-k">No triggers yet. Right-click (or control-click) a node, a lane's name (its curiosity suite), a suite card or a master node, then Assign On Trigger….</p>`;
    return `<ul class="ctr-list">${ts
      .map((t) => {
        const x = live[t.id] || {};
        return `<li class="${x.active ? "acting" : ""}${t.on ? "" : " off"}" data-trig="${esc(t.id)}"><button type="button" class="ctr-sw${t.on ? " on" : ""}" data-ctr-onoff="${esc(t.id)}" aria-pressed="${t.on}" title="${t.on ? "On: click to switch this trigger off" : "Off: click to switch it on"}">${t.on ? "ON" : "OFF"}</button><span><b>${esc(nameOf(t))}</b><br><small>When ${esc(whenName(t.when))} · ${esc(doesName(t.does))} · on ${esc(targetName(t.target))}${x.fired ? ` · fired ${x.fired}×` : ""}</small></span><button type="button" data-ctr-edit="${esc(t.id)}">Edit</button><button type="button" data-ctr-rm="${esc(t.id)}" aria-label="Remove">×</button></li>`;
      })
      .join("")}</ul>`;
  }
  function openList() {
    if (!hasDoc) return;
    const w = win("list", "Triggers", "curiosity proximity: when + does + limits");
    w.querySelector(".ctr-b").innerHTML = listHtml();
    return w;
  }
  function drawList() {
    const w = hasDoc && document.querySelector('.ctr-win[data-ctr="list"] .ctr-b');
    if (w) w.innerHTML = listHtml();
  }

  /* The Curiosity Proximity window: the inputs, and how close each trigger is to firing, live. */
  function nearness(t) {
    const x = live[t.id] || {};
    const w = t.when;
    if (x.active) return ["acting now", 1];
    if (!E()) return ["", 0];
    const j = rowNow();
    const n = E().state().rows.length;
    if (w.kind === "event" || w.kind === "section" || w.kind === "lfo") {
      const secs = w.kind === "section" ? sections() : null;
      for (let k = 1; k < n; k++) {
        const jj = j + k;
        if (jj >= n) break;
        const hit = w.kind === "event" ? eventHits(w, eventsNow(jj), E().state().rows[jj].id) : w.kind === "section" ? sectionIdsAt(secs, jj).includes(w.section) : lfoAt(w.every, jj);
        if (hit) return [`in ${k} moment${k === 1 ? "" : "s"}`, Math.max(0.05, 1 - k / 8)];
      }
      return ["not ahead", 0];
    }
    if (w.kind === "body") {
      const a = camera.now[w.zone] || 0;
      return [camera.on ? `${Math.round(Math.min(1, a / MOVE_AT) * 100)}% of the way` : "camera off", camera.on ? Math.min(1, a / MOVE_AT) : 0];
    }
    if (w.kind === "speech") return [speech.on ? "listening" : "not listening", 0];
    return [x.held ? "held" : x.value != null ? `last ${Math.round(x.value * 100)}%` : "waiting", x.value || 0];
  }
  function proxHtml() {
    const ts = list();
    const perf = E() && E().performing ? E().performing() : [];
    const zones = ZONES.map(([z, l]) => `<span class="ctr-meter" title="${esc(l)}"><i style="width:${Math.round(Math.min(1, (camera.now[z] || 0) / MOVE_AT) * 100)}%"></i>${esc(z)}</span>`).join("");
    return `<div class="ctr-inputs">
      <p><b>MIDI</b> <span class="ctr-k">${esc(midiStatus())}</span> <button type="button" data-ctr-midi>Connect</button></p>
      <p><b>Speech</b> ${speech.supported ? `<button type="button" data-ctr-listen class="${speech.on ? "on" : ""}" aria-pressed="${speech.on}">${speech.on ? "Listening (click to stop)" : "Listen"}</button>` : `<span class="ctr-k">This browser has no free speech recognition. Type instead:</span>`} <input type="text" data-ctr-type placeholder="Type words and press Enter" aria-label="Type words for the speech triggers">${speech.heard ? ` <span class="ctr-k">Heard: "${esc(speech.heard)}"</span>` : ""}</p>
      <p><b>Camera</b> <button type="button" data-ctr-cam class="${camera.on ? "on" : ""}" aria-pressed="${camera.on}">${camera.on ? "On (click to switch off)" : "Off: switch on"}</button> <span class="ctr-k">In this browser only; nothing is recorded or uploaded.</span> ${camera.on ? zones : ""}</p>
    </div>
    <p class="ctr-perf">${perf.length ? `<b>Performing</b> (not saved, not an undo step) <button type="button" data-ctr-putback>Put everything back</button>` : `<span class="ctr-k">Nothing is performing. Triggers that fire during playback are put back when it stops.</span>`}</p>
    ${ts.length ? `<ul class="ctr-list ctr-near">${ts
      .map((t) => {
        const [words, p] = nearness(t);
        const x = live[t.id] || {};
        return `<li class="${x.active ? "acting" : ""}${t.on ? "" : " off"}" data-near="${esc(t.id)}"><span class="ctr-meter"><i style="width:${Math.round(p * 100)}%"></i></span><span><b>${esc(nameOf(t))}</b> <small>${esc(words)}${x.fired ? ` · fired ${x.fired}×` : ""}</small></span></li>`;
      })
      .join("")}</ul>` : `<p class="ctr-k">No triggers yet.</p>`}`;
  }
  function openProximity() {
    if (!hasDoc) return;
    hookMidi();
    const w = win("prox", "Curiosity Proximity", "what is close to firing, live");
    w.querySelector(".ctr-b").innerHTML = proxHtml();
    return w;
  }
  function drawProx() {
    if (!hasDoc) return;
    const w = document.querySelector('.ctr-win[data-ctr="prox"] .ctr-b');
    if (w && !w.contains(document.activeElement)) w.innerHTML = proxHtml();
    drawList();
  }

  /* ---------- right-click: Assign On Trigger… ---------- */
  function existingFor(tg) {
    const c = cleanTarget(tg);
    const k = JSON.stringify(c);
    /* A curiosity's suite named with or without its track is the same suite. */
    const same = (t) => JSON.stringify(t) === k || (c.from === "curiosity" && t.from === "curiosity" && t.cur === c.cur && (!t.track || !c.track || t.track === c.track));
    return list().filter((t) => same(t.target));
  }
  const ASSIGN_LABEL = "Assign On Trigger…";
  function menuButtons(tg) {
    return `<button type="button" data-ctr-assign>${ASSIGN_LABEL}</button>${existingFor(tg)
      .map((t) => `<button type="button" data-ctr-edit="${esc(t.id)}">Trigger: ${esc(nameOf(t))}</button>`)
      .join("")}`;
  }
  function wireButtons(box, tg, after) {
    box.querySelectorAll("[data-ctr-assign], [data-ctr-edit]").forEach((b) =>
      b.addEventListener("click", (ev) => {
        ev.stopPropagation();
        if (after) after();
        if (b.dataset.ctrEdit) edit(b.dataset.ctrEdit);
        else assign(tg);
      })
    );
  }
  function ownMenu(tg, title, x, y) {
    document.querySelectorAll(".ctr-menu").forEach((m) => m.remove());
    const m = document.createElement("div");
    m.className = "ctr-menu";
    m.setAttribute("role", "menu");
    m.style.left = Math.min(x, innerWidth - 240) + "px";
    m.style.top = Math.min(y, innerHeight - 120) + "px";
    m.innerHTML = `<p><strong>${esc(title)}</strong></p>${menuButtons(tg)}<button type="button" data-ctr-menu-close>Close</button>`;
    host().appendChild(m);
    wireButtons(m, tg, () => m.remove());
    m.querySelector("[data-ctr-menu-close]").addEventListener("click", () => m.remove());
    const first = m.querySelector("button");
    if (first) first.focus();
    return m;
  }
  /* Add the item to a menu another part of the page just opened (the timeline's node menu, a master node's). */
  function addToPop(pop, tg) {
    if (!pop || pop.querySelector("[data-ctr-assign]")) return false;
    const btns = pop.querySelector(".sl-pop-btns") || pop;
    const span = document.createElement("span");
    span.className = "ctr-in-pop";
    span.innerHTML = menuButtons(tg);
    const close = btns.querySelector('[data-m="close"]');
    while (span.firstChild) btns.insertBefore(span.firstChild, close || null);
    wireButtons(btns, tg, () => pop.remove());
    return true;
  }
  function headTarget(head) {
    const name = head.querySelector(".sl-name[data-pick]");
    if (!name) return null;
    const cur = name.dataset.pick;
    let track = name.dataset.pickTrack || "";
    if (!track) {
      const lkEl = head.querySelector("[data-lk]");
      if (lkEl) track = lkEl.dataset.lk.split("|")[0];
    }
    if (!track && E()) {
      const t = E().state().tracks.find((x) => x.curiosities.includes(cur));
      track = t ? t.id : "";
    }
    return { kind: "suite", from: "curiosity", cur, track };
  }
  function onContext(e) {
    const t = e.target;
    if (!t || !t.closest || t.closest(".ctr-win, .ctr-menu")) return;
    const node = t.closest(".sl-svg [data-node]");
    if (node) {
      const key = node.dataset.node;
      const at = key.indexOf("@");
      const tg = { kind: "node", row: key.slice(0, at), lk: key.slice(at + 1) };
      const sl = node.closest(".sl");
      const pop = sl && sl.querySelector(".sl-linemenu");
      if (!addToPop(pop, tg)) (e.preventDefault(), ownMenu(tg, "Node · " + targetName(tg), e.clientX, e.clientY));
      return;
    }
    const mm = t.closest("[data-mnode], [data-master]");
    if (mm) {
      const tg = { kind: "master", id: mm.dataset.master || mm.dataset.mnode, node: mm.dataset.mnode || "" };
      const pop = document.querySelector(".sl-pop.sl-mastermenu, .sl-pop[data-master-menu], .mn-menu");
      e.preventDefault();
      if (!addToPop(pop, tg)) ownMenu(tg, "Master node", e.clientX, e.clientY);
      return;
    }
    const head = t.closest(".sl-head");
    if (head) {
      const tg = headTarget(head);
      if (!tg) return;
      e.preventDefault();
      ownMenu(tg, `${label(tg.cur)} · its suite`, e.clientX, e.clientY);
      return;
    }
    const card = t.closest('[data-pick-card^="suite|"], .sc-card[data-card="suite"]');
    if (card) {
      const pc = card.dataset.pickCard ? card : card.querySelector('[data-pick-card^="suite|"]');
      const id = pc ? pc.dataset.pickCard.split("|")[1] : card.dataset.id || card.dataset.suite;
      if (!id) return;
      e.preventDefault();
      ownMenu({ kind: "suite", from: "library", id }, "Suite", e.clientX, e.clientY);
      return;
    }
    const clip = t.closest("[data-suite-drop]");
    if (clip) {
      e.preventDefault();
      ownMenu({ kind: "suite", from: "clip", id: clip.dataset.suiteDrop }, "Suite clip", e.clientX, e.clientY);
    }
  }

  /* ---------- page events ---------- */
  function onClick(e) {
    const t = e.target;
    if (!t || !t.closest) return;
    const open = t.closest("[data-ctr-open]");
    if (open) return open.dataset.ctrOpen === "prox" ? openProximity() : openList();
    if (!t.closest(".ctr-win")) {
      if (!t.closest(".ctr-menu")) document.querySelectorAll(".ctr-menu").forEach((m) => m.remove());
      return;
    }
    const b = t.closest("button");
    if (!b) return;
    const d = b.dataset;
    if (d.ctrClose != null) {
      const w = b.closest(".ctr-win");
      if (w && w.dataset.ctr === "edit") (draft = null), (learn.map = null), (learn.midi = null);
      return w && w.remove();
    }
    if (d.ctrSave != null) return saveDraft();
    if (d.ctrDel != null) {
      const id = draft && draft.id;
      draft = null;
      closeWin("edit");
      if (id) remove(id), toast("Trigger removed. Undo brings it back.");
      return drawList();
    }
    if (d.ctrMode) return draft && ((draft.does.mode = d.ctrMode), drawEditor());
    if (d.ctrLearn != null) {
      if (learn.midi) return (learn.midi = null), drawEditor();
      learn.midi = (got) => {
        if (!draft) return;
        draft.when = cleanWhen({ kind: "midi", type: got.type, num: got.num });
        drawEditor();
        toast(`Learned: MIDI ${got.type === "cc" ? "CC" : "note"} ${got.num}.`);
      };
      drawEditor();
      connectMidi().then((ok) => {
        if (!ok && learn.midi) {
          learn.midi = null;
          drawEditor();
          toast("This browser can't reach MIDI. Chrome and Edge can, with your controller plugged in. You can still type the number.");
        }
      });
      return;
    }
    if (d.ctrMap != null) {
      learn.map = learn.map ? null : true;
      if (learn.map) scan(), toast("Map: click any slider, knob, fader, button or drop-down in the app. Esc stops.");
      document.documentElement.classList.toggle("ctr-mapping", !!learn.map);
      return drawEditor();
    }
    if (d.rangeAdd != null) {
      const n = E() ? E().state().rows.length : 1;
      const j = rowNow() + 1;
      draft.limits.ranges.push([j, Math.min(n, j + 1)]);
      return drawEditor();
    }
    if (d.rangeDel != null) return draft.limits.ranges.splice(Number(d.rangeDel), 1), drawEditor();
    if (d.ctrEdit) return edit(d.ctrEdit);
    if (d.ctrRm) return remove(d.ctrRm), toast("Trigger removed. Undo brings it back."), drawList();
    if (d.ctrOnoff) {
      const tr = get(d.ctrOnoff);
      if (tr) {
        if (tr.on) release(tr.id), apply();
        set(tr.id, { on: !tr.on });
      }
      return drawList();
    }
    if (d.ctrMidi != null) return connectMidi();
    if (d.ctrListen != null) return speech.on ? speech.stop() : speech.start();
    if (d.ctrCam != null) return camera.on ? camera.stop() : camera.start();
    if (d.ctrPutback != null) return putBack("Put back: everything plays as drawn again.");
  }
  /* Map…: the next control clicked becomes the source (not pressed). Capture phase, so it never acts. */
  function onMapDown(e) {
    if (e.type === "mousedown" && Date.now() < swallowUntil && controlOf(e.target)) return e.preventDefault(), e.stopImmediatePropagation();
    if (!learn.map || !draft) return;
    const el = controlOf(e.target);
    if (!el) return;
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    const id = mappable(controlId(el), controlLabel(el), null);
    if (!id) return toast("That control has no name I can keep. Try another one.");
    learn.map = null;
    swallowUntil = Date.now() + 1500;
    document.documentElement.classList.remove("ctr-mapping");
    draft.when = { kind: "control", id, label: registry.get(id).label };
    drawEditor();
    toast(`Mapped: ${registry.get(id).label}.`);
  }
  /* The click that follows the pointer going down on a control being mapped must not press it either. */
  let swallowUntil = 0;
  function swallowClick(e) {
    if (Date.now() > swallowUntil) return;
    swallowUntil = 0;
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
  }
  /* A control in use: a button press is a press and let go; a slider, knob or drop-down is held while it is up. */
  function onControlUse(e) {
    if (learn.map) return;
    const el = controlOf(e.target);
    if (!el) return;
    const id = controlId(el);
    if (!id) return;
    mappable(id, controlLabel(el));
    if (!list().some((t) => t.when.kind === "control" && t.when.id === id)) return;
    if (e.type === "pointerup") {
      /* A knob or a fader drawn by the app (role="slider") has no input event: read it once it has moved. */
      if (el.getAttribute("role") !== "slider" && !el.classList.contains("sc-knob")) return;
      return setTimeout(() => {
        const v = controlValue(el.isConnected ? el : document.querySelector(`[data-mappable="${CSS.escape(id)}"]`) || el);
        if (v != null) input("control:" + id, v > 0, v);
      }, 0);
    }
    if (e.type === "click") {
      if (el.getAttribute("role") === "slider" || el.classList.contains("sc-knob")) return;
      const v = controlValue(el);
      if (v != null && el.tagName !== "BUTTON") return; /* sliders and drop-downs fire on input and change */
      input("control:" + id, true, 1);
      setTimeout(() => input("control:" + id, false, 0), 0);
      return;
    }
    const v = controlValue(el);
    if (v == null) return;
    input("control:" + id, v > 0, v);
  }
  function onKey(e) {
    if (e.key !== "Escape") return;
    if (learn.map) {
      learn.map = null;
      document.documentElement.classList.remove("ctr-mapping");
      return drawEditor();
    }
    const m = document.querySelector(".ctr-menu");
    if (m) return m.remove();
  }
  /* Dragging a window by its title. */
  let drag = null;
  function onDown(e) {
    const h = e.target.closest && e.target.closest(".ctr-h");
    if (!h || e.target.closest("button")) return;
    const w = h.closest(".ctr-win");
    drag = { w, dx: e.clientX - w.offsetLeft, dy: e.clientY - w.offsetTop };
  }
  function onMove(e) {
    if (!drag) return;
    drag.w.style.left = Math.max(0, Math.min(innerWidth - 80, e.clientX - drag.dx)) + "px";
    drag.w.style.top = Math.max(0, Math.min(innerHeight - 40, e.clientY - drag.dy)) + "px";
  }

  /* The bar's two buttons (screen/ui.js asks for them). */
  const barHtml = () => `<span class="ctr-bar"><button type="button" data-ctr-open="list" title="Triggers: every trigger (when + does + limits). Right-click a node, a lane's name, a suite or a master node to assign one.">Triggers${list().length ? " · " + list().length : ""}</button><button type="button" data-ctr-open="prox" title="Curiosity Proximity: MIDI, speech and the camera, and how close each trigger is to firing, live">Proximity</button></span>`;

  function forTarget(targetId) {
    const id = String(targetId || "");
    const bare = id.replace(/^(master|mnode):/, "");
    return list()
      .filter((t) => t.target.kind === "master" && (id.startsWith("mnode:") ? t.target.node === bare : id.startsWith("master:") ? t.target.id === bare : t.target.id === bare || t.target.node === bare))
      .map((t) => {
        const w = t.when;
        let lk = null;
        let row = null;
        if (w.kind === "event" && w.row && w.track && E()) {
          const tr = E().state().tracks.find((x) => x.id === w.track);
          const cur = w.event === "line" ? "eyeline.speaking" : w.event === "enter" ? "bodyEnter" : null;
          if (tr && cur && tr.curiosities.includes(cur)) (lk = tr.id + "|" + cur), (row = w.row);
        }
        return { id: t.id, label: nameOf(t), source: Object.assign({ kind: w.kind, id: w.kind === "control" ? w.id : w.kind === "midi" ? `${w.type}:${w.num == null ? "any" : w.num}` : w.kind === "event" ? w.event : w.kind === "section" ? w.section : w.kind === "lfo" ? String(w.every) : w.kind === "speech" ? w.words : w.zone }, lk ? { lk, row } : {}) };
      });
  }

  let started = false;
  function start() {
    if (started || !hasDoc) return;
    started = true;
    document.addEventListener("contextmenu", onContext);
    document.addEventListener("click", onClick);
    /* On window, capture: before any of the page's own handlers, so Map… never presses what it maps. */
    window.addEventListener("pointerdown", onMapDown, true);
    window.addEventListener("mousedown", onMapDown, true);
    window.addEventListener("click", swallowClick, true);
    document.addEventListener("click", onControlUse, true);
    document.addEventListener("input", onControlUse, true);
    document.addEventListener("change", onControlUse, true);
    document.addEventListener("pointerup", onControlUse, true);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", () => (drag = null));
    document.addEventListener("keydown", onKey);
    document.addEventListener("input", (e) => e.target.closest && e.target.closest('.ctr-win[data-ctr="edit"]') && e.target.type !== "checkbox" && e.target.tagName !== "SELECT" && editorInput(e.target));
    document.addEventListener("change", (e) => e.target.closest && e.target.closest('.ctr-win[data-ctr="edit"]') && editorInput(e.target));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && e.target.matches && e.target.matches("[data-ctr-type]")) {
        hear(e.target.value);
        e.target.value = "";
      }
    });
    const hook = () => {
      if (!Scr() || !Scr().on) return setTimeout(hook, 200);
      Scr().on(onRow);
    };
    hook();
    hookMidi();
    /* Saved MIDI triggers want MIDI on, as the curiosity windows' MIDI bindings do. */
    setTimeout(() => list().some((t) => t.when.kind === "midi") && connectMidi(), 0);
    /* Undo or redo of a trigger: let go of any that changed, and redraw the windows. */
    changed.push(() => {
      const ids = new Set(list().map((t) => t.id));
      Object.keys(live).forEach((id) => !ids.has(id) && (release(id), delete live[id]));
      apply();
      drawList();
      const bar = document.querySelector(".ctr-bar [data-ctr-open='list']");
      if (bar) bar.textContent = "Triggers" + (list().length ? " · " + list().length : "");
    });
    store();
    const st2 = document.createElement("style");
    st2.id = "ctr-css";
    st2.textContent = styles();
    document.head.appendChild(st2);
  }
  function styles() {
    return `
.ctr-win { position: fixed; z-index: 90; width: min(420px, calc(100vw - 32px)); max-height: min(80vh, 760px); display: flex; flex-direction: column; background: var(--cc-panel, #1c1c1e); border: 1px solid var(--cc-line, #2e2e33); border-radius: 10px; box-shadow: 0 14px 40px rgba(0,0,0,0.6); color: var(--cc-text, #ececee); font: 12px -apple-system, "Segoe UI", system-ui, sans-serif; color-scheme: dark; }
.ctr-h { display: flex; align-items: center; gap: 6px; padding: 8px 10px; border-bottom: 1px solid var(--cc-line, #2e2e33); cursor: move; user-select: none; touch-action: none; }
.ctr-h b { font-size: 13px; }
.ctr-h small { color: var(--cc-dim, #9b9ba3); flex: 1 1 auto; }
.ctr-b { overflow: auto; padding: 8px 10px 12px; display: grid; gap: 8px; }
.ctr-win fieldset { border: 1px solid var(--cc-line, #2e2e33); border-radius: 8px; display: flex; flex-wrap: wrap; gap: 6px 10px; align-items: center; padding: 6px 8px 8px; margin: 0; }
.ctr-win legend { color: var(--cc-accent, #22d3ee); padding: 0 4px; }
.ctr-win label { display: inline-flex; gap: 4px; align-items: center; }
.ctr-win input[type=number] { width: 4.5em; }
.ctr-win input, .ctr-win select, .ctr-win button, .ctr-menu button { background: var(--cc-raised, #2a2a2d); color: inherit; border: 1px solid var(--cc-line, #2e2e33); border-radius: 6px; padding: 3px 7px; font: inherit; }
.ctr-win button.on, .ctr-menu button.on { border-color: var(--cc-accent, #22d3ee); color: var(--cc-accent, #22d3ee); }
.ctr-k { color: var(--cc-dim, #9b9ba3); margin: 0; }
.ctr-win p { margin: 0; }
.ctr-seg { display: inline-flex; gap: 2px; }
.ctr-acts { display: flex; gap: 6px; justify-content: flex-end; }
.ctr-ranges, .ctr-secs { display: flex; flex-wrap: wrap; gap: 4px 8px; align-items: center; }
.ctr-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 4px; }
.ctr-list li { display: flex; gap: 6px; align-items: center; padding: 4px 6px; border-radius: 6px; background: var(--cc-raised, #2a2a2d); }
.ctr-list li > span { flex: 1 1 auto; min-width: 0; }
.ctr-list li.off { opacity: 0.55; }
.ctr-list li.acting { outline: 1px solid var(--cc-warm, #ff9f43); }
.ctr-list small { color: var(--cc-dim, #9b9ba3); }
.ctr-sw { min-width: 3.4em; }
.ctr-meter { display: inline-block; position: relative; width: 56px; height: 8px; border-radius: 4px; background: var(--cc-line, #2e2e33); overflow: hidden; font-size: 0; vertical-align: middle; }
.ctr-inputs .ctr-meter { font-size: 9px; height: 12px; width: 60px; text-align: center; line-height: 12px; }
.ctr-meter i { position: absolute; left: 0; top: 0; bottom: 0; background: var(--cc-warm, #ff9f43); opacity: 0.8; }
.ctr-menu { position: fixed; z-index: 95; display: grid; gap: 4px; padding: 8px; min-width: 200px; background: var(--cc-raised, #2a2a2d); border: 1px solid var(--cc-line, #2e2e33); border-radius: 8px; color: var(--cc-text, #ececee); font: 12px -apple-system, "Segoe UI", system-ui, sans-serif; box-shadow: 0 6px 20px rgba(0,0,0,0.5); }
.ctr-menu p { margin: 0 0 2px; }
.ctr-menu button { text-align: left; }
.ctr-bar { display: inline-flex; gap: 4px; }
.ctr-toast { position: fixed; z-index: 99; left: 50%; bottom: 24px; transform: translateX(-50%); max-width: min(560px, calc(100vw - 32px)); padding: 8px 12px; border-radius: 8px; background: #2a2a2d; color: #ececee; border: 1px solid #22d3ee; font: 12px -apple-system, "Segoe UI", system-ui, sans-serif; }
html.ctr-mapping .sc-page input, html.ctr-mapping .sc-page select, html.ctr-mapping .sc-page button, html.ctr-mapping .sc-page [role=slider] { outline: 1px dashed var(--cc-accent, #22d3ee); outline-offset: 1px; cursor: crosshair; }
`;
  }

  root.CurioTriggers = {
    KEY,
    core,
    mappable,
    controls: () => [...registry.values()],
    controlId,
    scan,
    list,
    get,
    add,
    set,
    remove,
    assign,
    edit,
    draft: () => (draft ? JSON.parse(JSON.stringify(draft)) : null),
    save: saveDraft,
    openList,
    openProximity,
    close: closeWin,
    input,
    trigger,
    midi,
    hear,
    body,
    putBack,
    forTarget,
    sections,
    eventsAt: eventsNow,
    lanesOf: (t) => lanesOf(cleanTarget(t)),
    live: (id) => (live[id] ? { active: live[id].active, held: live[id].held, count: live[id].count, fired: live[id].fired, value: live[id].value } : null),
    performing: () => (E() && E().performing ? E().performing() : []),
    barHtml,
    speech,
    camera,
    names: { target: targetName, when: whenName, does: doesName, of: nameOf },
  };
  root.CurioMappable = mappable;
  if (hasDoc) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
    else start();
  }
})();
