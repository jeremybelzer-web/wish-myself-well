/* engine/state.js: the engine's one shared state, its commands, the rewrite, undo and saving. Part of the
   engine core (no page). Built from the Curiosity Lane letter (docs/engine.md says which part is which).

   window.CurioEngine

   THE STATE (what you decided; the only thing saved, the only thing undo restores)
     { v, name, rows, tracks, source, lanes, links, edits, refs, print, next }
     rows    [{ id, label }]                   the moments of your film, top to bottom (a panel or a scene)
     tracks  [{ id, kind, label, curiosities }] the columns: Master, Camera, one per character
     source  { "row|track|curiosity": value }   your own material, cell by cell
     lanes   { "track|curiosity": { on, mode, points: { rowId: value } } }  automation over the rows
     links   [{ id, label, on, from, to, does, value, amount, within, every, scope }]  proximities, as data
     edits   { "row|track|curiosity": { v } or { off: true } }  your hand edits on the result, replayed last
     refs    [{ id, name, kind, rows, lanes }]  curiosities pulled out of reference works (values only)
     print   { auto }                           whether every change is sent to My film right away
     next    the next id number (so undo brings ids back too)

   THE RESULT (derived; recomputed on every change, never saved): result() ->
     { dest: { cell: value or null }, why: { cell: "source" | "lane" | "link:<id>" | "edit" | "off" },
       events: [{ link, fromRow, toRow, leader, to, before, after, hop, cause }] }

   THE REWRITE, in a fixed order (rewrite(state)):
     1. source: each cell starts as your value (or the curiosity's starting value);
     2. lanes: automation lanes replace the cells they cover (ramping, smoothing or holding between points);
     3. links: every change down a column fires the links it leads; a follower that changes fires the links
        it leads in turn (a chain reaction), up to HOPS links deep, never the same link twice into one row;
     4. edits: your hand edits are laid on last, so a rule can never undo them.
   A link reads its leader from the cells as they stand at that moment, so chains run in row order.

   COMMANDS: send({ type, ... }) -> { ok, error? }. Every accepted command is one undo step (a batch is one
   step): Jeremy's words #12 (docs/jeremys-words.md). A bad command changes nothing and returns { ok: false, error } instead of throwing. Types are in
   COMMANDS below. undo(), redo(), history(), on(fn) (told { state, result, label } after every change),
   fingerprint(state?), save(), load(), check() (save, read back, compare fingerprints). */
(function () {
  const root = typeof window !== "undefined" ? window : globalThis;
  const S = root.CurioScale;
  const KEY = "curiosities-engine-v1";
  const VERSION = 2; /* 2: link suites, a link's chance, the print window */
  const LIMIT = { suites: 60, rows: 64, tracks: 16, perTrack: 24, links: 200, refs: 12, refRows: 200, text: 80, undo: 300, hops: 8 };
  const DOES = ["follow", "oppose", "rise", "fall", "moveWith", "set"];
  const CHANGE = ["any", "rises", "drops"];
  const KINDS = ["master", "camera", "character", "look", "sound", "other"];

  /* How a lane moves between its points: ramp (a straight line), smooth (eases out of one point and into the
     next, like a spline curve in Maya's Graph Editor), or hold (stays on a point until the next). */
  const MODES = ["ramp", "smooth", "hold"];
  const ease = (t) => t * t * (3 - 2 * t);
  /* ---------- small helpers ---------- */
  const isObj = (x) => x != null && typeof x === "object" && !Array.isArray(x);
  const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
  function text(s, max) {
    if (typeof s !== "string" && typeof s !== "number") return "";
    return String(s).replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, max || LIMIT.text);
  }
  function int(n, lo, hi, dflt) {
    const x = typeof n === "number" ? n : typeof n === "string" && n.trim() !== "" ? Number(n) : NaN;
    if (!isFinite(x)) return dflt;
    return Math.min(hi, Math.max(lo, Math.round(x)));
  }
  function num(n, lo, hi, dflt) {
    const x = typeof n === "number" ? n : typeof n === "string" && n.trim() !== "" ? Number(n) : NaN;
    if (!isFinite(x)) return dflt;
    return Math.min(hi, Math.max(lo, x));
  }
  const cellKey = (r, t, c) => r + "|" + t + "|" + c;
  const laneKey = (t, c) => t + "|" + c;
  /* ---------- the performance (Jeremy's triggers, "curiosity proximity") ----------
     A trigger firing during playback is not an undo step: it is a performance, and it is put back when playback
     stops (the music app's notes, section 6). So it is kept here, beside the state, never in it: not saved, not
     fingerprinted, not on the undo list, and listeners are not told (whoever performs redraws). Named layers, so
     the triggers (screen/triggers.js) and the master nodes each keep their own; they are laid over the saved lanes
     in the order they were first set, before the rewrite's step 2, so links and hand edits still run after.
     layer: { lanes: { "track|cur": { on?, mode?, points?: { rowId: value }, scale?: -100..100, set?: 0..1,
     nodes?: { rowId: { off?, scale?, set? } } } } }. scale moves values toward (-) or away from (+) the
     curiosity's start value (its neutral), -100 being the start value itself; set holds the whole lane at that
     place on its scale. */
  const performLayers = new Map();
  function performedLanes(st) {
    const lanes = Object.assign({}, st.lanes);
    const firstRow = st.rows.length ? st.rows[0].id : null;
    const carries = (t, c) => st.tracks.some((tr) => tr.id === t && tr.curiosities.includes(c));
    const scaled = (c, v, s) => {
      const p = S.pos(c, v);
      const n = S.pos(c, S.start(c));
      if (p == null || n == null) return v;
      return S.at(c, Math.min(1, Math.max(0, n + (p - n) * (1 + Math.max(-100, Math.min(100, Number(s) || 0)) / 100))));
    };
    performLayers.forEach((layer) => {
      const ls = layer && isObj(layer.lanes) ? layer.lanes : {};
      Object.keys(ls).forEach((lk) => {
        const o = ls[lk];
        const [t, c] = lk.split("|");
        if (!isObj(o) || !c || !carries(t, c)) return;
        const was = lanes[lk];
        const lane = was ? { on: was.on, mode: was.mode, points: Object.assign({}, was.points) } : { on: true, mode: "ramp", points: {} };
        if (isObj(o.points)) {
          lane.points = {};
          Object.keys(o.points).forEach((r) => {
            const v = S.fix(c, o.points[r]);
            if (v != null) lane.points[r] = v;
          });
        }
        if (typeof o.on === "boolean") lane.on = o.on;
        if (MODES.includes(o.mode)) lane.mode = o.mode;
        if (isObj(o.nodes))
          Object.keys(o.nodes).forEach((r) => {
            const nd = o.nodes[r];
            if (!isObj(nd) || lane.points[r] == null) return;
            if (nd.off) delete lane.points[r];
            else if (typeof nd.set === "number") lane.points[r] = S.at(c, nd.set);
            else if (typeof nd.scale === "number") lane.points[r] = scaled(c, lane.points[r], nd.scale);
          });
        if (typeof o.scale === "number") Object.keys(lane.points).forEach((r) => (lane.points[r] = scaled(c, lane.points[r], o.scale)));
        if (typeof o.set === "number" && firstRow) {
          lane.points = { [firstRow]: S.at(c, o.set) };
          lane.mode = "hold";
          lane.on = true;
        }
        if (!was && !Object.keys(lane.points).length) return;
        lanes[lk] = lane;
      });
    });
    return lanes;
  }
  const performed = (st) => (performLayers.size ? Object.assign({}, st, { lanes: performedLanes(st) }) : st);
  function idOk(s) {
    return typeof s === "string" && /^[A-Za-z0-9_.:@-]{1,80}$/.test(s) && !/^(__proto__|constructor|prototype|hasOwnProperty|toString|valueOf)$/.test(s);
  }
  /* Keys in a fixed order, so the same state always writes the same text (and fingerprint). */
  function canon(x) {
    if (Array.isArray(x)) return "[" + x.map(canon).join(",") + "]";
    if (isObj(x))
      return (
        "{" +
        Object.keys(x)
          .filter((k) => x[k] !== undefined)
          .sort()
          .map((k) => JSON.stringify(k) + ":" + canon(x[k]))
          .join(",") +
        "}"
      );
    if (typeof x === "number" && !isFinite(x)) return "null";
    return JSON.stringify(x === undefined ? null : x);
  }
  function hash(s) {
    let h = 0x811c9dc5;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    return (h >>> 0).toString(36) + "." + s.length.toString(36);
  }
  function fingerprint(st) {
    return hash(canon(st === undefined ? state : st));
  }
  const clone = (x) => JSON.parse(JSON.stringify(x));

  /* ---------- a valid state from anything ---------- */
  function blank() {
    return { v: VERSION, name: "My film", rows: [], tracks: [], source: {}, lanes: {}, links: [], suites: [], edits: {}, refs: [], print: { auto: false, from: 0 }, next: 1 };
  }
  function fixValue(cur, v) {
    if (v === null) return null;
    return S.fix(cur, v);
  }
  /* Turn whatever was saved (or sent) into a state the engine can trust. Unknown parts are dropped, values
     are snapped to their curiosity's scale, and anything pointing at a missing row or track goes. */
  function normalize(raw) {
    const st = blank();
    if (!isObj(raw)) return st;
    st.name = text(raw.name) || "My film";
    st.next = int(raw.next, 1, 1e9, 1);
    const rowIds = new Set();
    (Array.isArray(raw.rows) ? raw.rows : []).slice(0, LIMIT.rows).forEach((r) => {
      if (!isObj(r) || !idOk(r.id) || rowIds.has(r.id)) return;
      rowIds.add(r.id);
      st.rows.push({ id: r.id, label: text(r.label) || r.id });
    });
    const trackOf = Object.create(null);
    (Array.isArray(raw.tracks) ? raw.tracks : []).slice(0, LIMIT.tracks).forEach((t) => {
      if (!isObj(t) || !idOk(t.id) || trackOf[t.id]) return;
      const curs = [];
      (Array.isArray(t.curiosities) ? t.curiosities : []).forEach((c) => {
        if (idOk(c) && !curs.includes(c) && curs.length < LIMIT.perTrack) curs.push(c);
      });
      const tr = { id: t.id, kind: KINDS.includes(t.kind) ? t.kind : "other", label: text(t.label) || t.id, curiosities: curs };
      trackOf[t.id] = tr;
      st.tracks.push(tr);
    });
    const cellOk = (k) => {
      const [r, t, c] = String(k).split("|");
      return rowIds.has(r) && trackOf[t] && trackOf[t].curiosities.includes(c) ? c : null;
    };
    if (isObj(raw.source))
      Object.keys(raw.source).forEach((k) => {
        const c = cellOk(k);
        const v = c ? fixValue(c, raw.source[k]) : null;
        if (c && v != null) st.source[k] = v;
      });
    if (isObj(raw.edits))
      Object.keys(raw.edits).forEach((k) => {
        const c = cellOk(k);
        const e = raw.edits[k];
        if (!c || !isObj(e)) return;
        if (e.off === true) st.edits[k] = { off: true };
        else {
          const v = fixValue(c, e.v);
          if (v != null) st.edits[k] = { v };
        }
      });
    if (isObj(raw.lanes))
      Object.keys(raw.lanes).forEach((k) => {
        const [t, c] = String(k).split("|");
        const l = raw.lanes[k];
        if (!trackOf[t] || !trackOf[t].curiosities.includes(c) || !isObj(l)) return;
        const points = {};
        if (isObj(l.points))
          Object.keys(l.points).forEach((r) => {
            const v = rowIds.has(r) ? fixValue(c, l.points[r]) : null;
            if (v != null) points[r] = v;
          });
        if (!Object.keys(points).length) return;
        st.lanes[k] = { on: l.on !== false, mode: MODES.includes(l.mode) ? l.mode : "ramp", points };
      });
    (Array.isArray(raw.suites) ? raw.suites : []).slice(0, LIMIT.suites).forEach((x) => {
      if (!isObj(x) || !idOk(x.id) || st.suites.some((y) => y.id === x.id)) return;
      const out = { id: x.id, label: text(x.label, 160) || x.id, on: x.on !== false };
      if (x.seed && typeof x.seed === "string") out.seed = text(x.seed);
      st.suites.push(out);
    });
    const linkIds = new Set();
    (Array.isArray(raw.links) ? raw.links : []).forEach((l) => {
      if (st.links.length >= LIMIT.links) return;
      const fixed = fixLink(l, st, trackOf);
      if (fixed && !linkIds.has(fixed.id)) {
        linkIds.add(fixed.id);
        st.links.push(fixed);
      }
    });
    (Array.isArray(raw.refs) ? raw.refs : []).slice(0, LIMIT.refs).forEach((r) => {
      const fixed = fixRef(r);
      if (fixed && !st.refs.some((x) => x.id === fixed.id)) st.refs.push(fixed);
    });
    st.print = { auto: !!(isObj(raw.print) && raw.print.auto === true), from: int(isObj(raw.print) ? raw.print.from : 0, 0, Math.max(0, st.rows.length - 1), 0) };
    return st;
  }
  function fixEnd(e, trackOf) {
    if (!isObj(e) || !trackOf[e.track] || !trackOf[e.track].curiosities.includes(e.curiosity)) return null;
    const out = { track: e.track, curiosity: e.curiosity };
    if (e.is != null) {
      const v = fixValue(e.curiosity, e.is);
      if (v == null) return null;
      out.is = v;
    }
    out.change = CHANGE.includes(e.change) ? e.change : "any";
    return out;
  }
  function fixLink(l, st, trackOf) {
    if (!isObj(l) || !idOk(l.id)) return null;
    const from = fixEnd(l.from, trackOf);
    const to = fixEnd(l.to, trackOf);
    if (!from || !to) return null;
    delete to.is;
    delete to.change;
    /* A link inside one lane ("x is A, then x becomes B": a setup and its payoff) must look ahead. */
    if (from.track === to.track && from.curiosity === to.curiosity && !(int(l.within, 0, 16, 0) >= 1 && from.is != null)) return null;
    const does = DOES.includes(l.does) ? l.does : "follow";
    const out = {
      id: l.id,
      label: text(l.label, 160),
      on: l.on !== false,
      from,
      to,
      does,
      amount: Math.round(num(l.amount, 0, 1, 1) * 1000) / 1000,
      within: int(l.within, 0, 16, 0),
      every: int(l.every, 0, 64, 0),
    };
    if (does === "set") {
      const v = fixValue(to.curiosity, l.value);
      if (v == null) return null;
      out.value = v;
    }
    const rowIds = st.rows.map((r) => r.id);
    if (isObj(l.scope) && rowIds.includes(l.scope.from) && rowIds.includes(l.scope.to)) out.scope = { from: l.scope.from, to: l.scope.to };
    if (l.seed && typeof l.seed === "string") out.seed = text(l.seed);
    /* How often it fires when its leader moves (the database's "How often"), 0 to 1; left out when always. */
    const chance = Math.round(num(l.chance, 0, 1, 1) * 1000) / 1000;
    if (chance < 1) out.chance = chance;
    if (typeof l.suite === "string" && (st.suites || []).some((x) => x.id === l.suite)) out.suite = l.suite;
    return out;
  }
  function fixRef(r) {
    if (!isObj(r) || !idOk(r.id)) return null;
    const rows = (Array.isArray(r.rows) ? r.rows : []).slice(0, LIMIT.refRows).map((x) => text(x) || "");
    if (!rows.length) return null;
    const lanes = {};
    if (isObj(r.lanes))
      Object.keys(r.lanes).forEach((c) => {
        if (!idOk(c) || !Array.isArray(r.lanes[c])) return;
        lanes[c] = rows.map((_, i) => {
          const v = fixValue(c, r.lanes[c][i]);
          return v == null ? null : v;
        });
      });
    return { id: r.id, name: text(r.name) || "A reference", kind: text(r.kind, 24) || "script", rows, lanes };
  }

  /* ---------- the rewrite ---------- */
  function rowIndex(st) {
    const ix = Object.create(null);
    st.rows.forEach((r, i) => (ix[r.id] = i));
    return ix;
  }
  function laneValues(st, lane, cur) {
    const ix = rowIndex(st);
    const pts = Object.keys(lane.points)
      .filter((r) => ix[r] != null)
      .map((r) => ({ i: ix[r], v: lane.points[r] }))
      .sort((a, b) => a.i - b.i);
    const out = new Array(st.rows.length).fill(undefined);
    if (!pts.length) return out;
    for (let i = 0; i < st.rows.length; i++) {
      let a = null;
      let b = null;
      for (const p of pts) {
        if (p.i <= i) a = p;
        if (p.i >= i && !b) b = p;
      }
      if (!a) out[i] = b.v;
      else if (!b || a === b || lane.mode === "hold") out[i] = a.v;
      else {
        const pa = S.pos(cur, a.v);
        const pb = S.pos(cur, b.v);
        const t = (i - a.i) / (b.i - a.i);
        out[i] = pa == null || pb == null ? a.v : S.at(cur, pa + (pb - pa) * (lane.mode === "smooth" ? ease(t) : t));
      }
    }
    return out;
  }
  function stepsFor(cur, amount) {
    return amount > 0 ? Math.max(1, Math.round(amount * S.steps(cur))) : 0;
  }
  /* What a link does to its follower, given the leader's value and which way the leader just moved. */
  function apply(link, leaderValue, dir, follower) {
    const to = link.to.curiosity;
    const fromC = link.from.curiosity;
    const cur = follower == null ? S.start(to) : follower;
    switch (link.does) {
      case "set":
        return link.value;
      case "rise":
        return S.step(to, cur, stepsFor(to, link.amount));
      case "fall":
        return S.step(to, cur, -stepsFor(to, link.amount));
      case "moveWith":
        return dir ? S.step(to, cur, dir * stepsFor(to, link.amount)) : cur;
      case "follow":
      case "oppose": {
        let p = S.pos(fromC, leaderValue);
        if (p == null) return cur;
        if (link.does === "oppose") p = 1 - p;
        const now = S.pos(to, cur);
        return S.at(to, now == null ? p : now + (p - now) * link.amount);
      }
    }
    return cur;
  }
  function roll(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
    return ((h >>> 0) % 100000) / 100000;
  }
  function rewrite(st) {
    if (st === state) st = performed(st); /* the live film plays its performance; other states are rewritten as they are */
    const n = st.rows.length;
    const dest = Object.create(null);
    const why = Object.create(null);
    const events = [];
    /* 1. source */
    st.rows.forEach((r) =>
      st.tracks.forEach((t) =>
        t.curiosities.forEach((c) => {
          const k = cellKey(r.id, t.id, c);
          dest[k] = own(st.source, k) ? st.source[k] : S.start(c);
          why[k] = "source";
        })
      )
    );
    /* 2. lanes */
    Object.keys(st.lanes)
      .sort()
      .forEach((lk) => {
        const lane = st.lanes[lk];
        if (!lane.on) return;
        const [t, c] = lk.split("|");
        laneValues(st, lane, c).forEach((v, i) => {
          if (v === undefined) return;
          const k = cellKey(st.rows[i].id, t, c);
          dest[k] = v;
          why[k] = "lane";
        });
      });
    /* 3. links: changes down each column fire the links they lead; followers that change fire theirs. */
    const ix = rowIndex(st);
    const suiteOff = new Set((st.suites || []).filter((x) => !x.on).map((x) => x.id));
    const live = st.links.filter((l) => l.on && !(l.suite && suiteOff.has(l.suite)));
    if (live.length && n) {
      const leads = Object.create(null);
      live.forEach((l) => {
        const k = laneKey(l.from.track, l.from.curiosity);
        (leads[k] = leads[k] || []).push(l);
      });
      const buckets = Array.from({ length: n }, () => []);
      const inScope = (l, i) => !l.scope || (i >= Math.min(ix[l.scope.from], ix[l.scope.to]) && i <= Math.max(ix[l.scope.from], ix[l.scope.to]));
      const scopeStart = (l) => (l.scope ? Math.min(ix[l.scope.from], ix[l.scope.to]) : 0);
      /* Changes already in your material and lanes. The first row counts as a change for the rules that
         describe a state (follow, oppose, set), so a follower follows from the start. */
      const base = Object.assign(Object.create(null), dest);
      Object.keys(leads).forEach((lk) => buckets[0].push({ key: lk, dir: 0, hop: 0, cause: -1, start: true }));
      for (let i = 1; i < n; i++)
        Object.keys(leads).forEach((lk) => {
          const [t, c] = lk.split("|");
          const a = dest[cellKey(st.rows[i - 1].id, t, c)];
          const b = dest[cellKey(st.rows[i].id, t, c)];
          if (a === b) return;
          const pa = S.pos(c, a);
          const pb = S.pos(c, b);
          buckets[i].push({ key: lk, dir: pa == null || pb == null ? 0 : Math.sign(pb - pa), hop: 0, cause: -1 });
        });
      /* Pulses: a link with "every" fires every so many rows, changed or not. */
      live.forEach((l) => {
        if (!l.every) return;
        for (let i = 0; i < n; i++) if (inScope(l, i) && (i - scopeStart(l)) % l.every === 0) buckets[i].push({ pulse: l, hop: 0, cause: -1, dir: 0 });
      });
      const fired = new Set();
      const setHere = Object.create(null); /* cells a link set directly (not by holding) */
      for (let i = 0; i < n; i++) {
        const q = buckets[i];
        for (let j = 0; j < q.length; j++) {
          const e = q[j];
          const list = e.pulse ? [e.pulse] : (leads[e.key] || []).filter((l) => !l.every && (!e.start || l.does === "follow" || l.does === "oppose" || l.does === "set"));
          list.forEach((l) => {
            if (!inScope(l, i)) return;
            const leader = dest[cellKey(st.rows[i].id, l.from.track, l.from.curiosity)];
            if (l.from.is != null && leader !== l.from.is) return;
            if (!e.pulse && l.from.change === "rises" && e.dir <= 0) return;
            if (!e.pulse && l.from.change === "drops" && e.dir >= 0) return;
            const t = i + l.within;
            if (t >= n) return;
            const once = l.id + "@" + t;
            if (fired.has(once)) return;
            fired.add(once);
            /* A link that fires only some of the time decides by a fixed roll per link and moment, so the same
               film always rewrites the same way (and undo, reload and the tests agree). */
            if (l.chance != null && roll(once) >= l.chance) return;
            const fk = cellKey(st.rows[t].id, l.to.track, l.to.curiosity);
            const before = dest[fk];
            const after = apply(l, leader, e.dir, before);
            if (after == null || after === before) return;
            dest[fk] = after;
            why[fk] = "link:" + l.id;
            setHere[fk] = true;
            /* The follower keeps its new value in the rows after, until its own material changes or another
               link sets it there. */
            for (let k = t + 1; k < n; k++) {
              const ck = cellKey(st.rows[k].id, l.to.track, l.to.curiosity);
              const pk = cellKey(st.rows[k - 1].id, l.to.track, l.to.curiosity);
              if (base[ck] !== base[pk] || setHere[ck]) break;
              dest[ck] = after;
              why[ck] = "link:" + l.id;
            }
            const pb = S.pos(l.to.curiosity, before);
            const pa = S.pos(l.to.curiosity, after);
            events.push({ link: l.id, fromRow: st.rows[i].id, toRow: st.rows[t].id, leader, to: laneKey(l.to.track, l.to.curiosity), before, after, hop: e.hop, cause: e.cause });
            if (e.hop + 1 < LIMIT.hops) buckets[t].push({ key: laneKey(l.to.track, l.to.curiosity), dir: pa == null || pb == null ? 0 : Math.sign(pa - pb), hop: e.hop + 1, cause: events.length - 1 });
          });
        }
      }
    }
    /* 4. your hand edits, last */
    Object.keys(st.edits).forEach((k) => {
      if (!own(dest, k)) return;
      const e = st.edits[k];
      if (e.off) {
        dest[k] = null;
        why[k] = "off";
      } else {
        dest[k] = e.v;
        why[k] = "edit";
      }
    });
    return { dest, why, events };
  }
  /* The chains in a result, each as its list of events from the first cause on. */
  function chains(result) {
    const out = [];
    result.events.forEach((e, i) => {
      if (e.cause !== -1) return;
      const chain = [];
      const walk = (k) => {
        chain.push(result.events[k]);
        result.events.forEach((x, j) => x.cause === k && walk(j));
      };
      walk(i);
      out.push(chain);
    });
    return out;
  }

  /* ---------- commands ---------- */
  function need(cond, msg) {
    if (!cond) throw new Bad(msg);
  }
  function Bad(msg) {
    this.message = msg;
  }
  function newId(st, prefix) {
    let id;
    do id = prefix + st.next++;
    while (st.rows.some((r) => r.id === id) || st.tracks.some((t) => t.id === id) || st.links.some((l) => l.id === id) || st.refs.some((r) => r.id === id));
    return id;
  }
  function track(st, id) {
    const t = st.tracks.find((x) => x.id === id);
    need(t, "There is no track " + text(id) + ".");
    return t;
  }
  function row(st, id) {
    const r = st.rows.find((x) => x.id === id);
    need(r, "There is no row " + text(id) + ".");
    return r;
  }
  function cell(st, m) {
    need(isObj(m), "The message is empty.");
    const r = row(st, m.row);
    const t = track(st, m.track);
    need(t.curiosities.includes(m.curiosity), "The " + t.label + " track has no " + text(m.curiosity) + ".");
    return cellKey(r.id, t.id, m.curiosity);
  }
  function value(cur, v) {
    const x = S.fix(cur, v);
    need(x != null, "That value does not fit " + S.label(cur) + ".");
    return x;
  }
  function dropRow(st, id) {
    st.rows = st.rows.filter((r) => r.id !== id);
    ["source", "edits"].forEach((part) => Object.keys(st[part]).forEach((k) => k.startsWith(id + "|") && delete st[part][k]));
    Object.keys(st.lanes).forEach((k) => {
      delete st.lanes[k].points[id];
      if (!Object.keys(st.lanes[k].points).length) delete st.lanes[k];
    });
    st.links.forEach((l) => l.scope && (l.scope.from === id || l.scope.to === id) && delete l.scope);
    st.print.from = Math.min(st.print.from, Math.max(0, st.rows.length - 1));
  }
  function dropCuriosity(st, t, c) {
    t.curiosities = t.curiosities.filter((x) => x !== c);
    ["source", "edits"].forEach((part) => Object.keys(st[part]).forEach((k) => k.split("|")[1] === t.id && k.split("|")[2] === c && delete st[part][k]));
    delete st.lanes[laneKey(t.id, c)];
    st.links = st.links.filter((l) => !((l.from.track === t.id && l.from.curiosity === c) || (l.to.track === t.id && l.to.curiosity === c)));
  }
  function trackFrom(st, m) {
    const t = {
      id: idOk(m.id) && !st.tracks.some((x) => x.id === m.id) ? m.id : newId(st, "t"),
      kind: KINDS.includes(m.kind) ? m.kind : "other",
      label: text(m.label) || "Track",
      curiosities: [],
    };
    (Array.isArray(m.curiosities) ? m.curiosities : []).forEach((c) => idOk(c) && !t.curiosities.includes(c) && t.curiosities.length < LIMIT.perTrack && t.curiosities.push(c));
    return t;
  }
  function linkFrom(st, m, id) {
    const trackOf = Object.create(null);
    st.tracks.forEach((t) => (trackOf[t.id] = t));
    const l = fixLink(Object.assign({}, m, { id }), st, trackOf);
    need(l, "A link needs a leader and a follower that are on tracks (and a value when it sets one).");
    return l;
  }

  /* Place a pack's links on this film's tracks (engine/LINKS.md). Two shapes are read: the curiosity
     database's export ({ format: "curiosities-links", links, groups }) and the engine's own
     ({ format: "curio-links", links, suites }). Each end names a curiosity ("curiosity.slider" for a
     lens's slider) and may hint its kind of track: "master", "camera" or "character". An end goes on the
     track that already has its curiosity (the first character's, for a character curiosity); failing that,
     with addLanes, the curiosity is added to the first track of the hinted kind; otherwise the link waits.
     only: a list of link ids or group ids to take (a group brings its links). */
  function packSide(e) {
    if (!isObj(e)) return null;
    const c = typeof e.curiosity === "string" ? e.curiosity + (typeof e.slider === "string" && e.slider ? "." + e.slider : "") : null;
    return c && idOk(c) ? c : null;
  }
  const packId = (x) => typeof x === "string" && x.length > 0 && x.length <= 120 && !/[\u0000-\u001f]/.test(x);
  function placeLinks(st, pack, opts) {
    opts = opts || {};
    const links = Array.isArray(pack.links) ? pack.links.slice(0, 2000) : [];
    const groups = (Array.isArray(pack.groups) ? pack.groups.map((g) => isObj(g) && { id: g.id, label: g.label, members: g.links }) : Array.isArray(pack.suites) ? pack.suites : []).slice(0, 500);
    const src = text(pack.source, 24) || (pack.format === "curiosities-links" ? "db" : "pack");
    const only = Array.isArray(opts.only) ? new Set(opts.only.filter(packId)) : null;
    const suiteOf = Object.create(null);
    groups.forEach((x) => isObj(x) && packId(x.id) && Array.isArray(x.members) && x.members.forEach((id) => packId(id) && !suiteOf[id] && (suiteOf[id] = x.id)));
    if (only) groups.forEach((x) => isObj(x) && only.has(x.id) && Array.isArray(x.members) && x.members.forEach((id) => only.add(id)));
    const usedSuites = new Set();
    const lanesAdded = [];
    const trackOf = Object.create(null);
    st.tracks.forEach((t) => (trackOf[t.id] = t));
    const where = (hint) => (KINDS.includes(hint) ? hint : null);
    function trackFor(c, hint) {
      const has = st.tracks.filter((t) => t.curiosities.includes(c));
      if (has.length) return has.find((t) => t.kind === where(hint)) || has[0];
      if (!opts.addLanes || !S.known(c)) return null;
      const room = st.tracks.filter((x) => x.curiosities.length < LIMIT.perTrack);
      const t = room.find((x) => x.kind === (where(hint) || "master")) || room.find((x) => x.kind === "master") || room[0];
      if (!t) return null;
      t.curiosities.push(c);
      lanesAdded.push(t.id + "|" + c);
      return t;
    }
    const out = [];
    let waiting = 0;
    links.forEach((l) => {
      if (!isObj(l) || !packId(l.id) || (only && !only.has(l.id))) return;
      const fc = packSide(l.from);
      const tc = packSide(l.to);
      if (!fc || !tc) return;
      const lt = trackFor(fc, l.from.track || l.from.where);
      const tt = lt && trackFor(tc, l.to.track || l.to.where);
      if (!lt || !tt) {
        waiting++;
        return;
      }
      const from = { track: lt.id, curiosity: fc };
      if (l.from.is != null) from.is = l.from.is;
      if (l.from.change === "rises" || l.from.change === "drops") from.change = l.from.change;
      const body = { label: text(l.label, 160) || S.label(fc) + " leads " + S.label(tc), from, to: { track: tt.id, curiosity: tc }, does: l.does, value: l.value, amount: l.amount, within: l.within, every: l.every, chance: l.chance, seed: src + ":" + l.id };
      if (!fixLink(Object.assign({ id: "check" }, body), st, trackOf)) {
        waiting++;
        return;
      }
      if (suiteOf[l.id]) {
        body.suiteSeed = src + ":" + suiteOf[l.id];
        usedSuites.add(suiteOf[l.id]);
      }
      out.push(body);
    });
    const outSuites = groups.filter((x) => isObj(x) && usedSuites.has(x.id)).map((x) => ({ seed: src + ":" + x.id, label: text(x.label, 160) || String(x.id) }));
    return { links: out, suites: outSuites, waiting, lanesAdded };
  }

  const COMMANDS = {
    /* Your own material: a cell's value (it ripples through the links). */
    setSource(st, m) {
      const k = cell(st, m);
      st.source[k] = value(m.curiosity, m.value);
    },
    clearSource(st, m) {
      delete st.source[cell(st, m)];
    },
    /* A hand edit on the result: pinned, laid on last, no rule can change it. off: true switches the cell off. */
    edit(st, m) {
      const k = cell(st, m);
      st.edits[k] = m.off === true ? { off: true } : { v: value(m.curiosity, m.value) };
    },
    clearEdit(st, m) {
      delete st.edits[cell(st, m)];
    },
    addRow(st, m) {
      need(st.rows.length < LIMIT.rows, "A film holds " + LIMIT.rows + " rows here.");
      const r = { id: newId(st, "r"), label: text(m.label) || "Moment " + (st.rows.length + 1) };
      const at = int(m.at, 0, st.rows.length, st.rows.length);
      st.rows.splice(at, 0, r);
      /* A new row copies the row above it, so the film does not jump. */
      const prev = st.rows[at - 1];
      if (prev && m.copy !== false)
        Object.keys(st.source).forEach((k) => {
          if (k.startsWith(prev.id + "|")) st.source[r.id + k.slice(prev.id.length)] = st.source[k];
        });
      return { row: r.id };
    },
    removeRow(st, m) {
      dropRow(st, row(st, m.row).id);
    },
    renameRow(st, m) {
      const r = row(st, m.row);
      r.label = text(m.label) || r.label;
    },
    moveRow(st, m) {
      const r = row(st, m.row);
      const to = int(m.to, 0, st.rows.length - 1, NaN);
      need(!isNaN(to), "Say where the row goes (a number).");
      st.rows.splice(st.rows.indexOf(r), 1);
      st.rows.splice(to, 0, r);
    },
    addTrack(st, m) {
      need(isObj(m), "The message is empty.");
      need(st.tracks.length < LIMIT.tracks, "A film holds " + LIMIT.tracks + " tracks here.");
      const t = trackFrom(st, m);
      st.tracks.push(t);
      return { track: t.id };
    },
    removeTrack(st, m) {
      const t = track(st, m.track);
      t.curiosities.slice().forEach((c) => dropCuriosity(st, t, c));
      st.tracks = st.tracks.filter((x) => x !== t);
    },
    renameTrack(st, m) {
      const t = track(st, m.track);
      t.label = text(m.label) || t.label;
    },
    addCuriosity(st, m) {
      const t = track(st, m.track);
      need(idOk(m.curiosity), "Name a curiosity.");
      need(!t.curiosities.includes(m.curiosity), "That track already has it.");
      need(t.curiosities.length < LIMIT.perTrack, "A track holds " + LIMIT.perTrack + " curiosities here.");
      t.curiosities.push(m.curiosity);
    },
    removeCuriosity(st, m) {
      const t = track(st, m.track);
      need(t.curiosities.includes(m.curiosity), "That track does not have it.");
      dropCuriosity(st, t, m.curiosity);
    },
    /* Automation lanes: a point is the value at one row; between points the lane ramps, smooths or holds. */
    setPoint(st, m) {
      const k = cell(st, m);
      const [r, t, c] = k.split("|");
      const lk = laneKey(t, c);
      const lane = st.lanes[lk] || (st.lanes[lk] = { on: true, mode: "ramp", points: {} });
      lane.points[r] = value(c, m.value);
    },
    removePoint(st, m) {
      const k = cell(st, m);
      const [r, t, c] = k.split("|");
      const lane = st.lanes[laneKey(t, c)];
      need(lane && own(lane.points, r), "There is no point there.");
      delete lane.points[r];
      if (!Object.keys(lane.points).length) delete st.lanes[laneKey(t, c)];
    },
    laneMode(st, m) {
      const t = track(st, m.track);
      const lane = st.lanes[laneKey(t.id, m.curiosity)];
      need(lane, "That lane has no points yet.");
      if (m.mode != null) {
        need(MODES.includes(m.mode), "A lane ramps, smooths or holds.");
        lane.mode = m.mode;
      }
      if (m.on != null) lane.on = m.on === true;
    },
    clearLane(st, m) {
      const t = track(st, m.track);
      need(st.lanes[laneKey(t.id, m.curiosity)], "That lane has no points yet.");
      delete st.lanes[laneKey(t.id, m.curiosity)];
    },
    /* Links: proximities as plain data. */
    addLink(st, m) {
      need(isObj(m), "The message is empty.");
      need(st.links.length < LIMIT.links, "A film holds " + LIMIT.links + " links here.");
      const l = linkFrom(st, m, newId(st, "l"));
      st.links.push(l);
      return { link: l.id };
    },
    updateLink(st, m) {
      need(isObj(m), "The message is empty.");
      const i = st.links.findIndex((l) => l.id === m.link);
      need(i >= 0, "There is no link " + text(m.link) + ".");
      const old = st.links[i];
      need(isObj(m.changes), "Say what changes.");
      const merged = Object.assign(clone(old), m.changes, { id: old.id });
      if (isObj(m.changes.from)) merged.from = Object.assign(clone(old.from), m.changes.from);
      if (isObj(m.changes.to)) merged.to = Object.assign(clone(old.to), m.changes.to);
      if (m.changes.scope === null) delete merged.scope;
      st.links[i] = linkFrom(st, merged, old.id);
    },
    removeLink(st, m) {
      const n = st.links.length;
      st.links = st.links.filter((l) => l.id !== m.link);
      need(st.links.length < n, "There is no link " + text(m && m.link) + ".");
    },
    /* A link suite (a proximity suite): links that switch on and off together. */
    toggleSuite(st, m) {
      const x = st.suites.find((y) => y.id === (m && m.suite));
      need(x, "There is no suite " + text(m && m.suite) + ".");
      x.on = m.on == null ? !x.on : m.on === true;
    },
    removeSuite(st, m) {
      const x = st.suites.find((y) => y.id === (m && m.suite));
      need(x, "There is no suite " + text(m && m.suite) + ".");
      st.suites = st.suites.filter((y) => y !== x);
      if (m.links === true) st.links = st.links.filter((l) => l.suite !== x.id);
      else st.links.forEach((l) => l.suite === x.id && delete l.suite);
    },
    /* A pack of links (the curiosity database's proximities and proximity suites, or any export in the same
       shape: engine/LINKS.md). Each link is placed on your tracks; links whose curiosities are on no track
       wait (counted in the reply). Importing the same pack again updates its links, keeping your on/off. */
    importLinks(st, m) {
      need(isObj(m) && isObj(m.pack), "Nothing to import.");
      const placed = placeLinks(st, m.pack, { only: m.only, addLanes: m.addLanes === true });
      need(placed.links.length || placed.suites.length, placed.waiting ? "None of these links fit your tracks yet (" + placed.waiting + " wait for curiosities your tracks do not have)." : "That pack has no links.");
      placed.suites.forEach((x) => {
        const old = st.suites.find((y) => y.seed && y.seed === x.seed);
        if (old) old.label = x.label;
        else {
          need(st.suites.length < LIMIT.suites, "A film holds " + LIMIT.suites + " suites here.");
          st.suites.push({ id: newId(st, "s"), label: x.label, on: true, seed: x.seed });
        }
      });
      const suiteBySeed = Object.create(null);
      st.suites.forEach((x) => x.seed && (suiteBySeed[x.seed] = x.id));
      let added = 0;
      let updated = 0;
      placed.links.forEach((l) => {
        const at = (x) => x.seed === l.seed && x.from.track === l.from.track && x.to.track === l.to.track;
        const i = st.links.findIndex(at);
        const body = Object.assign({}, l, { suite: l.suiteSeed ? suiteBySeed[l.suiteSeed] : undefined });
        if (i >= 0) {
          st.links[i] = linkFrom(st, Object.assign(body, { on: st.links[i].on }), st.links[i].id);
          updated++;
        } else {
          need(st.links.length < LIMIT.links, "A film holds " + LIMIT.links + " links here; " + added + " were added before it filled.");
          st.links.push(linkFrom(st, body, newId(st, "l")));
          added++;
        }
      });
      return { added, updated, waiting: placed.waiting, suites: placed.suites.length, lanesAdded: placed.lanesAdded.length };
    },
    printFrom(st, m) {
      st.print.from = int(m && m.from, 0, Math.max(0, st.rows.length - 1), 0);
    },
    toggleLink(st, m) {
      const l = st.links.find((x) => x.id === m.link);
      need(l, "There is no link " + text(m && m.link) + ".");
      l.on = m.on == null ? !l.on : m.on === true;
    },
    /* A reference work's extracted curiosities (values only, never its text). */
    addRef(st, m) {
      need(isObj(m), "The message is empty.");
      need(st.refs.length < LIMIT.refs, "A film keeps " + LIMIT.refs + " references here. Remove one first.");
      const r = fixRef(Object.assign({}, m.ref, { id: newId(st, "ref") }));
      need(r && Object.keys(r.lanes).length, "That reference has nothing to carry.");
      st.refs.push(r);
      return { ref: r.id };
    },
    removeRef(st, m) {
      const n = st.refs.length;
      st.refs = st.refs.filter((r) => r.id !== m.ref);
      need(st.refs.length < n, "There is no reference " + text(m && m.ref) + ".");
    },
    /* Carry one curiosity from a reference onto a track of your film, as an automation lane stretched over
       your rows (cross-pollinate). The track gains the curiosity if it did not have it. */
    carry(st, m) {
      need(isObj(m), "The message is empty.");
      const ref = st.refs.find((r) => r.id === m.ref);
      need(ref, "There is no reference " + text(m.ref) + ".");
      const from = m.curiosity;
      need(ref.lanes[from], "That reference has no " + text(from) + ".");
      const onto = idOk(m.onto) ? m.onto : from;
      const t = track(st, m.track);
      need(st.rows.length, "Add rows to your film first.");
      if (!t.curiosities.includes(onto)) {
        need(t.curiosities.length < LIMIT.perTrack, "That track is full.");
        t.curiosities.push(onto);
      }
      const src = ref.lanes[from];
      const n = st.rows.length;
      const points = {};
      st.rows.forEach((r, i) => {
        const j = n === 1 ? 0 : Math.round((i * (src.length - 1)) / (n - 1));
        const v = src[j];
        if (v == null) return;
        const p = S.pos(from, v);
        const out = from === onto ? S.fix(onto, v) : p == null ? null : S.at(onto, p);
        if (out != null) points[r.id] = out;
      });
      need(Object.keys(points).length, "Nothing in that reference fits your rows.");
      st.lanes[laneKey(t.id, onto)] = { on: true, mode: "hold", points };
    },
    rename(st, m) {
      st.name = text(m && m.name) || st.name;
    },
    printAuto(st, m) {
      st.print.auto = !!(m && m.on === true);
    },
    /* Replace the film's rows, tracks and material at once (from a host or an analysis). Links that still
       fit are kept. */
    importFilm(st, m) {
      need(isObj(m) && isObj(m.film), "Nothing to import.");
      const f = m.film;
      const next = normalize(Object.assign({}, st, { rows: f.rows, tracks: f.tracks, source: f.source || {}, edits: m.keepEdits ? st.edits : {}, lanes: m.keepLanes ? st.lanes : {} }));
      need(next.rows.length && next.tracks.length, "The import has no rows or no tracks.");
      Object.assign(st, next);
      if (f.name) st.name = text(f.name) || st.name;
      st.next = Math.max(st.next, int(f.next, 1, 1e9, 1));
    },
    batch(st, m) {
      need(isObj(m) && Array.isArray(m.commands) && m.commands.length && m.commands.length <= 500, "A batch is a list of up to 500 commands.");
      m.commands.forEach((c) => run(st, c));
    },
  };
  function run(st, m) {
    need(isObj(m), "A command is an object with a type.");
    need(typeof m.type === "string" && own(COMMANDS, m.type), "Unknown command " + text(m.type) + ".");
    return COMMANDS[m.type](st, m) || {};
  }

  /* ---------- the engine ---------- */
  let state = blank();
  let result = rewrite(state);
  let undoList = [];
  let redoList = [];
  const listeners = [];
  let storage = root.localStorage || null;
  let lastCheck = { ok: true, at: 0 };
  const drift = [];
  const LABELS = {
    importLinks: "Add links",
    toggleSuite: "Switch a suite",
    removeSuite: "Remove a suite",
    printFrom: "Show other moments on My film",
    setSource: "Change a value",
    clearSource: "Reset a value",
    edit: "Hand edit",
    clearEdit: "Remove a hand edit",
    addRow: "Add a row",
    removeRow: "Remove a row",
    renameRow: "Rename a row",
    moveRow: "Move a row",
    addTrack: "Add a track",
    removeTrack: "Remove a track",
    renameTrack: "Rename a track",
    addCuriosity: "Add a curiosity to a track",
    removeCuriosity: "Remove a curiosity from a track",
    setPoint: "Set an automation point",
    removePoint: "Remove an automation point",
    laneMode: "Change a lane",
    clearLane: "Clear a lane",
    addLink: "Add a link",
    updateLink: "Change a link",
    removeLink: "Remove a link",
    toggleLink: "Switch a link",
    addRef: "Add a reference",
    removeRef: "Remove a reference",
    carry: "Carry a curiosity",
    rename: "Rename the film",
    printAuto: "Change sending",
    importFilm: "Import a film",
    batch: "Several changes",
  };

  let hush = 0;
  function emit(label) {
    if (hush) return;
    listeners.slice().forEach((fn) => {
      try {
        fn({ state, result, label });
      } catch (e) {
        if (root.console) console.warn("Curiosity engine listener:", e);
      }
    });
  }
  /* Every undo step has an id. When the shared store is on the page, each step is also put on the app-wide
     undo list (Ctrl+Z on the page, History), which undoes it here only while it is still this film's newest
     step: one undo for everything (Jeremy's words #12), and the engine's own Undo stays in step with it. */
  let stepId = 0;
  const peek = (list) => (list.length ? list[list.length - 1].id : null);
  function share(id, label) {
    const St = root.CurioStore;
    if (!St || typeof St.external !== "function") return;
    St.external("engine", {
      label: "Engine: " + label,
      undo: () => peek(undoList) === id && undo(),
      redo: () => peek(redoList) === id && redo(),
    });
  }
  function commit(next, label) {
    const id = ++stepId;
    undoList.push({ id, label, text: canon(state) });
    if (undoList.length > LIMIT.undo) undoList.shift();
    redoList = [];
    state = next;
    result = rewrite(state);
    save();
    emit(label);
    share(id, label);
  }
  function send(m) {
    let next;
    let out;
    try {
      next = clone(state);
      out = run(next, m);
      /* A command may only leave behind a state that would survive a save and a reload unchanged. If the
         check has to change anything, that is a bug in the command (a setting that would be lost on reload):
         it is kept in drift() for the tests, and the checked state is used. */
      const fixed = normalize(next);
      if (canon(fixed) !== canon(next)) {
        drift.push({ type: isObj(m) ? String(m.type).slice(0, 40) : typeof m, before: canon(next).slice(0, 2000), after: canon(fixed).slice(0, 2000) });
        if (drift.length > 50) drift.shift();
      }
      next = fixed;
    } catch (e) {
      if (e instanceof Bad) return { ok: false, error: e.message };
      return { ok: false, error: "That command could not be carried out (" + text(e && e.message, 120) + ")." };
    }
    if (canon(next) === canon(state)) return Object.assign({ ok: true, unchanged: true }, out);
    const label = (isObj(m) && typeof m.label === "string" && text(m.label)) || LABELS[m.type] || "Change";
    commit(next, label);
    return Object.assign({ ok: true }, out);
  }
  function undo() {
    const step = undoList.pop();
    if (!step) return false;
    redoList.push({ id: step.id, label: step.label, text: canon(state) });
    state = normalize(JSON.parse(step.text));
    result = rewrite(state);
    save();
    emit("Undo: " + step.label);
    return true;
  }
  function redo() {
    const step = redoList.pop();
    if (!step) return false;
    undoList.push({ id: step.id, label: step.label, text: canon(state) });
    state = normalize(JSON.parse(step.text));
    result = rewrite(state);
    save();
    emit("Redo: " + step.label);
    return true;
  }

  /* ---------- saving ---------- */
  function save() {
    if (!storage) return false;
    try {
      /* Written in a fixed key order, so the same film is always the same text (the self-check compares it). */
      storage.setItem(KEY, canon({ format: "curiosities-engine", v: 1, fp: fingerprint(state), state }));
      return true;
    } catch (e) {
      return false;
    }
  }
  /* Read the saved state. Compares the fingerprint written with it to the fingerprint of what came back, so a
     part of the state that silently failed to save shows up as a failed check instead of a quiet change. */
  function load(opts) {
    let saved = null;
    try {
      saved = storage ? JSON.parse(storage.getItem(KEY)) : null;
    } catch (e) {
      saved = null;
    }
    if (!isObj(saved) || !isObj(saved.state)) {
      lastCheck = { ok: true, at: Date.now(), note: "Nothing saved yet." };
      return false;
    }
    const next = normalize(saved.state);
    const fp = fingerprint(next);
    lastCheck = { ok: fp === saved.fp, at: Date.now(), saved: saved.fp, loaded: fp };
    /* An older version's film gains the new parts (empty), so its fingerprint changes by design. */
    if (!lastCheck.ok && saved.state.v !== VERSION && fingerprint(normalize(Object.assign({}, saved.state, { v: VERSION, suites: [], print: Object.assign({ from: 0 }, saved.state.print) }))) === fp) {
      lastCheck.ok = true;
      lastCheck.note = "Brought up to date from an older version of the engine.";
    }
    if (!lastCheck.ok) lastCheck.note = "The saved film came back different from how it was saved. Parts that did not fit were dropped.";
    state = next;
    result = rewrite(state);
    if (!(opts && opts.keepHistory)) {
      undoList = [];
      redoList = [];
    }
    emit("Load");
    return true;
  }
  /* Save, read back, and compare: true when the film would come back exactly as it is. */
  function check() {
    const before = fingerprint(state);
    const text2 = JSON.stringify(state);
    const back = fingerprint(normalize(JSON.parse(text2)));
    lastCheck = { ok: before === back, at: Date.now(), saved: before, loaded: back };
    return lastCheck;
  }

  root.CurioEngine = {
    KEY,
    LIMIT,
    DOES,
    CHANGE,
    COMMANDS: Object.keys(COMMANDS),
    send,
    undo,
    redo,
    canUndo: () => undoList.length > 0,
    canRedo: () => redoList.length > 0,
    history: () => ({ undo: undoList.map((s) => s.label), redo: redoList.map((s) => s.label).reverse() }),
    state: () => clone(state),
    result: () => result,
    chains: () => chains(result),
    value: (row, track, cur) => result.dest[cellKey(row, track, cur)],
    why: (row, track, cur) => result.why[cellKey(row, track, cur)],
    on(fn) {
      listeners.push(fn);
      return () => {
        const i = listeners.indexOf(fn);
        if (i >= 0) listeners.splice(i, 1);
      };
    },
    fingerprint,
    canon,
    normalize,
    rewrite,
    save,
    load,
    check,
    lastCheck: () => lastCheck,
    drift: () => drift.slice(),
    /* Use another storage (a file on the desktop, a test's memory). Does not load from it. */
    useStorage(s) {
      storage = s && typeof s.getItem === "function" && typeof s.setItem === "function" ? s : null;
    },
    /* Start over from a state (tests and New). Clears undo. */
    reset(st) {
      state = normalize(st || blank());
      result = rewrite(state);
      undoList = [];
      redoList = [];
      save();
      emit("Reset");
    },
    cellKey,
    laneKey,
    /* Run fn without telling any window (the self-check uses it, so nothing redraws or prints meanwhile). */
    silently(fn) {
      hush++;
      try {
        return fn();
      } finally {
        hush--;
      }
    },
    /* The performance (see performLayers): perform(name, layer) sets one layer, perform(name, null) clears it,
       perform(null) clears them all (playback stopped). Not saved and not an undo step; listeners are not told. */
    perform(name, layer) {
      if (name == null) performLayers.clear();
      else if (layer == null) performLayers.delete(String(name));
      else performLayers.set(String(name), clone(layer));
      result = rewrite(state);
      return [...performLayers.keys()];
    },
    performing: () => [...performLayers.keys()],
    /* Forget the redo steps (after the self-check undid its own test steps). */
    dropRedo(n) {
      redoList.splice(Math.max(0, redoList.length - (n == null ? redoList.length : n)));
    },
  };
})();
