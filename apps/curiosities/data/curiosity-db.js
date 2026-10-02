/* The curiosity database: one list of everything the app knows how to look at.

   Four levels, every item automatable:
   - curiosity        a lens on one aspect of a scene (music, wardrobe, shot size). Has sliders.
   - suite            a few curiosities looked through together, each member with a setting and a weight.
   - proximity        when X happens, Y tends to follow within some beats. Has cause, delay, how often, effect size.
   - proximitySuite   a few proximities that act together, each member with its own delay and how often.

   Every item has an on/off trigger (a key, a button, a MIDI note) and a list of sliders. A slider is graded:
   it is either a scale of words in order ("floor, low, eye, high, overhead") or a number range (0 to 100 percent).
   Each slider carries a default automation: from, to and a curve (linear, ease, in, out, steps, matching
   automation.js), so any slider can be swept or driven by a knob, an LFO or a MIDI control.

   The data files in this folder call CuriosityDB.curiosity(...), .suite(...), .proximity(...),
   .proximitySuite(...) and .workspace(...). Load this file first, then the data files, then call
   CuriosityDB.check() (or run `node data/check-db.js`). See data/README.md for how the app loads it.

   Works in a browser (window.CuriosityDB) and in Node (module.exports). No build step. */

(function (root) {
  const CURVES = ["linear", "ease", "in", "out", "steps"];
  const CHANGES = ["rises", "drops", "changes"];
  const LEVELS = ["curiosity", "suite", "proximity", "proximitySuite"];

  const db = { workspaces: [], curiosities: [], suites: [], proximities: [], proximitySuites: [] };
  const clashes = [];
  const index = { workspace: {}, curiosity: {}, suite: {}, proximity: {}, proximitySuite: {} };

  /* ---------- sliders ---------- */

  /* A slider written in short form:
       ["era", "Era", ["ancient", "1800s", "1950s", "today", "future"], "What decade the clothes come from."]
       ["cost", "Cost", [0, 100, "%"], "How expensive the clothes look."]
     or long form { id, label, scale | range, plain, from, to, curve, ref }.
     ref names another curiosity whose setting this slider moves (a lens built from catalog rows). */
  function slider(s) {
    if (Array.isArray(s)) {
      const [id, label, values, plain, extra] = s;
      s = Object.assign({ id, label, plain }, extra || {});
      if (Array.isArray(values) && typeof values[0] === "number") s.range = { min: values[0], max: values[1], unit: values[2] || "", step: values[3] };
      else s.scale = values;
    }
    const out = { id: s.id, label: s.label, plain: s.plain || "" };
    if (s.ref && !s.scale && !s.range) {
      if (s.from != null) out.from = s.from;
      if (s.to != null) out.to = s.to;
    }
    if (s.ref) out.ref = s.ref;
    if (s.scale) {
      out.scale = s.scale.slice();
      out.from = s.from != null ? s.from : out.scale[0];
      out.to = s.to != null ? s.to : out.scale[out.scale.length - 1];
    } else if (s.range) {
      const r = s.range;
      const span = r.max - r.min;
      out.range = { min: r.min, max: r.max, unit: r.unit || "", step: r.step || (span <= 1 || !Number.isInteger(r.min) || !Number.isInteger(r.max) ? 0.05 : span > 1000 ? 100 : span > 100 ? 5 : 1) };
      out.from = s.from != null ? s.from : r.min;
      out.to = s.to != null ? s.to : r.max;
    }
    /* A list with no order (which track, which type) steps from item to item instead of gliding. */
    out.curve = s.curve || (s.unordered ? "steps" : "linear");
    if (s.unordered) out.unordered = true;
    return out;
  }

  /* Sliders every item gets, so the trigger and the amount can always be automated. */
  const AMOUNT = () => slider({ id: "amount", label: "Amount", range: { min: 0, max: 100, unit: "%" }, from: 100, to: 100, plain: "Share of panels in the moment where it plays." });

  /* ---------- adders ---------- */

  function put(level, item) {
    const list = level === "workspace" ? db.workspaces : db[level === "curiosity" ? "curiosities" : level === "suite" ? "suites" : level === "proximity" ? "proximities" : "proximitySuites"];
    if (index[level][item.id]) {
      /* A later file can enrich an earlier row: new sliders are added (before "amount"), other fields only
         fill gaps, and fields named in item.override (workspace, plain...) replace the earlier value. */
      const old = index[level][item.id];
      (item.sliders || []).forEach((s) => {
        if (!old.sliders) return;
        const same = old.sliders.find((o) => o.id === s.id);
        if (same) return same.label !== s.label && s.id !== "amount" && clashes.push(`${level} ${item.id}: slider ${s.id} ("${s.label}") was dropped, "${same.label}" already uses that id`);
        const at = old.sliders.findIndex((o) => o.id === "amount");
        at < 0 ? old.sliders.push(s) : old.sliders.splice(at, 0, s);
      });
      Object.keys(item).forEach((k) => k !== "sliders" && k !== "override" && (old[k] == null || old[k] === "" || (item.override || []).includes(k)) && (old[k] = item[k]));
      return old;
    }
    index[level][item.id] = item;
    list.push(item);
    return item;
  }

  const api = {
    CURVES,
    LEVELS,
    data: db,
    slider,

    /* workspace({ id, label, scope: "scene" | "story", plain, proposed }) */
    workspace(w) {
      return put("workspace", { id: w.id, label: w.label, scope: w.scope || "scene", plain: w.plain || "", proposed: !!w.proposed });
    },

    /* curiosity({ id, label, plain, workspace, also, group, kind: "lens" | "measure", main, sliders, source, tags })
       main = the id of the slider that is the curiosity's own setting (its main automation lane). */
    curiosity(c) {
      const sliders = (c.sliders || []).map(slider);
      if (!sliders.some((s) => s.id === "amount")) sliders.push(AMOUNT());
      return put("curiosity", {
        id: c.id,
        level: "curiosity",
        label: c.label,
        plain: c.plain || "",
        workspace: c.workspace,
        also: c.also || [],
        group: c.group || "",
        kind: c.kind || "lens",
        per: c.per || "panel",
        main: c.main || (sliders[0] && sliders[0].id),
        sliders,
        source: c.source || "database",
        tags: c.tags || [],
        override: c.override,
      });
    },

    /* suite({ id, label, plain, workspace, members: [{ curiosity, slider, value | from, to, weight }] })
       Each member becomes a lane: its weight (how strongly the suite pushes it) and its setting. */
    suite(s) {
      const members = (s.members || []).map((m) => Object.assign({ weight: 100 }, m));
      const sliders = [slider({ id: "blend", label: "Blend", range: { min: 0, max: 100, unit: "%" }, from: 0, to: 100, plain: "How much of the suite is laid over the moment, from none to all of it." })];
      members.forEach((m) => sliders.push(slider({ id: "weight:" + m.curiosity + (m.slider ? "." + m.slider : ""), label: "Weight of " + m.curiosity + (m.slider ? " " + m.slider : ""), range: { min: 0, max: 100, unit: "%" }, from: 0, to: m.weight, plain: "How strongly the suite pushes this member toward its setting." })));
      (s.sliders || []).forEach((x) => sliders.push(slider(x)));
      sliders.push(AMOUNT());
      return put("suite", { id: s.id, level: "suite", label: s.label, plain: s.plain || "", workspace: s.workspace, also: s.also || [], kind: s.kind || "", members, sliders, source: s.source || "database", tags: s.tags || [] });
    },

    /* proximity({ id, label, plain, workspace, when: { curiosity|suite, slider, is | change }, then: {...}, within, often, effect })
       within = beats, often = percent of times the effect followed in the films measured, effect = 0 to 5. */
    proximity(p) {
      const within = p.within == null ? 2 : p.within;
      const sliders = [
        slider({ id: "cause", label: "Cause", range: { min: 0, max: 100, unit: "%" }, from: 0, to: 100, plain: "Share of panels where the cause is set." }),
        slider({ id: "delay", label: "Delay", range: { min: 0, max: Math.max(16, within + 8), unit: "beats", step: 1 }, from: within, to: within + 2, plain: "Beats between the cause and the effect." }),
        slider({ id: "often", label: "How often", range: { min: 0, max: 100, unit: "%" }, from: p.often == null ? 70 : p.often, to: 100, plain: "How often the effect follows the cause." }),
        slider({ id: "effect", label: "Effect size", range: { min: 0, max: 5 }, from: p.effect == null ? 2 : p.effect, to: 5, plain: "How big the effect is when it follows." }),
      ];
      (p.sliders || []).forEach((x) => sliders.push(slider(x)));
      sliders.push(AMOUNT());
      return put("proximity", { id: p.id, level: "proximity", label: p.label, plain: p.plain || "", workspace: p.workspace, also: p.also || [], when: p.when, then: p.then, within, often: p.often == null ? null : p.often, sliders, source: p.source || "database", tags: p.tags || [] });
    },

    /* proximitySuite({ id, label, plain, workspace, members: [proximity ids] }) */
    proximitySuite(ps) {
      const sliders = [slider({ id: "blend", label: "Blend", range: { min: 0, max: 100, unit: "%" }, from: 0, to: 100, plain: "How many of the pairs are switched on together." })];
      (ps.members || []).forEach((m) => {
        sliders.push(slider({ id: "delay:" + m, label: "Delay of " + m, range: { min: 0, max: 16, unit: "beats", step: 1 }, from: 0, to: 4, plain: "Beats before this pair's effect follows." }));
        sliders.push(slider({ id: "often:" + m, label: "How often " + m, range: { min: 0, max: 100, unit: "%" }, from: 50, to: 100, plain: "How often this pair's effect follows." }));
      });
      sliders.push(AMOUNT());
      return put("proximitySuite", { id: ps.id, level: "proximitySuite", label: ps.label, plain: ps.plain || "", workspace: ps.workspace, also: ps.also || [], members: ps.members || [], sliders, source: ps.source || "database", tags: ps.tags || [] });
    },

    /* ---------- reading ---------- */

    get: (level, id) => (index[level] || {})[id] || null,
    find(id) {
      for (const l of ["curiosity", "suite", "proximity", "proximitySuite"]) if (index[l][id]) return index[l][id];
      return null;
    },
    /* Everything that belongs to a workspace (its own items first, then items that list it in `also`). */
    forWorkspace(id) {
      const pick = (list) => list.filter((x) => x.workspace === id).concat(list.filter((x) => x.workspace !== id && x.also.includes(id)));
      return { curiosities: pick(db.curiosities), suites: pick(db.suites), proximities: pick(db.proximities), proximitySuites: pick(db.proximitySuites) };
    },
    /* Automation key used by automation.js: c:, s:, p:, ps:. Slider keys add ".<slider id>". */
    key(item, sliderId) {
      const pre = { curiosity: "c:", suite: "s:", proximity: "p:", proximitySuite: "ps:" }[item.level];
      return pre + item.id + (sliderId ? "." + sliderId : "");
    },
    counts: () => ({
      workspaces: db.workspaces.length,
      curiosities: db.curiosities.length,
      suites: db.suites.length,
      proximities: db.proximities.length,
      proximitySuites: db.proximitySuites.length,
      sliders: LEVELS.reduce((n, l) => n + db[l === "curiosity" ? "curiosities" : l === "suite" ? "suites" : l === "proximity" ? "proximities" : "proximitySuites"].reduce((a, x) => a + x.sliders.length, 0), 0),
    }),

    /* ---------- checking ---------- */

    /* A slider written as { id, label, ref: "softness" } with no scale takes the scale or range of that
       catalog curiosity's own setting, so a lens can gather catalog rows as its sliders. Runs in check()
       and install(); safe to call again after more files load. */
    resolve() {
      db.curiosities.forEach((c) =>
        c.sliders.forEach((s) => {
          if (!s.ref || s.scale || s.range) return;
          const r = index.curiosity[s.ref];
          const m = r && r.sliders.find((x) => x.id === r.main);
          if (!m) return;
          if (m.scale) s.scale = m.scale.slice();
          if (m.range) s.range = Object.assign({}, m.range);
          if (s.from == null) s.from = m.from;
          if (s.to == null) s.to = m.to;
          if (!s.plain) s.plain = r.plain;
        })
      );
    },

    /* Returns a list of problems; empty means the database is whole. */
    check() {
      api.resolve();
      const out = clashes.slice();
      const ws = new Set(db.workspaces.map((w) => w.id));
      const graded = (s) => (s.scale && s.scale.length >= 2) || (s.range && s.range.max > s.range.min);
      const all = [].concat(db.curiosities, db.suites, db.proximities, db.proximitySuites);
      const seen = {};
      all.forEach((x) => {
        const where = x.level + " " + x.id;
        if (seen[x.id]) out.push(`${where}: id also used by a ${seen[x.id]}`);
        seen[x.id] = x.level;
        if (!x.label) out.push(`${where}: no label`);
        if (!x.plain) out.push(`${where}: no plain description`);
        if (!ws.has(x.workspace)) out.push(`${where}: unknown workspace "${x.workspace}"`);
        x.also.forEach((w) => ws.has(w) || out.push(`${where}: unknown also-workspace "${w}"`));
        if (!x.sliders.length) out.push(`${where}: no sliders`);
        const ids = new Set();
        x.sliders.forEach((s) => {
          if (ids.has(s.id)) out.push(`${where}: slider ${s.id} twice`);
          ids.add(s.id);
          if (!graded(s)) out.push(`${where}: slider ${s.id} is not graded (needs a scale of 2+ or a range)`);
          if (!s.plain) out.push(`${where}: slider ${s.id} has no plain description`);
          if (!CURVES.includes(s.curve)) out.push(`${where}: slider ${s.id} has unknown curve ${s.curve}`);
          if (s.scale && (!s.scale.includes(s.from) || !s.scale.includes(s.to))) out.push(`${where}: slider ${s.id} from/to not on its scale`);
          if (s.range && (s.from < s.range.min || s.from > s.range.max || s.to < s.range.min || s.to > s.range.max)) out.push(`${where}: slider ${s.id} from/to outside its range`);
          if (s.ref && !index.curiosity[s.ref]) out.push(`${where}: slider ${s.id} refers to unknown curiosity ${s.ref}`);
        });
        if (x.level === "curiosity" && !ids.has(x.main)) out.push(`${where}: main slider ${x.main} missing`);
      });
      const ref = (where, r) => {
        if (!r) return out.push(`${where}: missing cause or effect`);
        if (r.curiosity) {
          const c = index.curiosity[r.curiosity];
          if (!c) return out.push(`${where}: unknown curiosity ${r.curiosity}`);
          const sl = r.slider ? c.sliders.find((s) => s.id === r.slider) : c.sliders.find((s) => s.id === c.main);
          if (!sl) return out.push(`${where}: ${r.curiosity} has no slider ${r.slider}`);
          if (r.is != null && sl.scale && !sl.scale.includes(r.is)) out.push(`${where}: "${r.is}" is not on ${r.curiosity}'s ${sl.id} scale`);
          if (r.is != null && sl.range && (r.is < sl.range.min || r.is > sl.range.max)) out.push(`${where}: ${r.is} is outside ${r.curiosity}'s ${sl.id} range`);
          if (r.is == null && !CHANGES.includes(r.change)) out.push(`${where}: needs "is" or a change (${CHANGES.join(", ")})`);
        } else if (r.suite) {
          if (!index.suite[r.suite]) out.push(`${where}: unknown suite ${r.suite}`);
        } else out.push(`${where}: cause or effect names no curiosity or suite`);
      };
      db.suites.forEach((s) =>
        s.members.forEach((m) => {
          const c = index.curiosity[m.curiosity];
          if (!c) return out.push(`suite ${s.id}: unknown member ${m.curiosity}`);
          const sl = m.slider ? c.sliders.find((x) => x.id === m.slider) : c.sliders.find((x) => x.id === c.main);
          if (!sl) return out.push(`suite ${s.id}: ${m.curiosity} has no slider ${m.slider}`);
          const v = m.value != null ? [m.value] : [m.from, m.to].filter((x) => x != null);
          v.forEach((val) => {
            if (sl.scale && !sl.scale.includes(val)) out.push(`suite ${s.id}: "${val}" is not on ${m.curiosity}'s ${sl.id} scale`);
            if (sl.range && (typeof val !== "number" || val < sl.range.min || val > sl.range.max)) out.push(`suite ${s.id}: ${val} is outside ${m.curiosity}'s ${sl.id} range`);
          });
        })
      );
      db.proximities.forEach((p) => {
        ref("proximity " + p.id + " cause", p.when);
        ref("proximity " + p.id + " effect", p.then);
      });
      db.proximitySuites.forEach((ps) => ps.members.forEach((m) => index.proximity[m] || out.push(`proximity suite ${ps.id}: unknown member ${m}`)));
      return out;
    },

    /* ---------- for the app ---------- */

    /* Rows in the shape catalog.js uses ({ id, group, label, kind, options | min, max, note }) for every
       curiosity the app does not have yet, plus one row per lens slider ("music.tempo"), so the existing
       automation, Prism and workspace code can use them without changes. */
    legacyRows(have) {
      const known = new Set((have || []).map((c) => c.id));
      const rows = [];
      const row = (id, group, label, s, note, parent) => {
        if (known.has(id)) return;
        known.add(id);
        const r = { id, group, label, note: note || "", view: note || "", source: "curiosity database" };
        /* Slider rows carry their lens's id, so lists can hide them under it. */
        if (parent) r.sliderOf = parent;
        if (s.scale) Object.assign(r, { kind: "select", options: s.scale.slice(), value: s.from });
        else Object.assign(r, { kind: "range", min: s.range.min, max: s.range.max, step: s.range.step, value: s.from });
        rows.push(r);
      };
      db.curiosities.forEach((c) => {
        const main = c.sliders.find((s) => s.id === c.main);
        row(c.id, c.group || c.workspace, c.label, main, c.plain);
        c.sliders.forEach((s) => s.id !== "amount" && s.id !== c.main && !s.ref && row(c.id + "." + s.id, c.group || c.workspace, c.label + ": " + s.label, s, s.plain, c.id));
      });
      return rows;
    },
    /* For automation.js FACETS: a lens's other sliders as lanes (ids of the rows legacyRows made, or refs). */
    facets() {
      const out = {};
      db.curiosities.forEach((c) => {
        const f = c.sliders.filter((s) => s.id !== "amount" && s.id !== c.main).map((s) => s.ref || c.id + "." + s.id);
        if (f.length) out[c.id] = f;
      });
      return out;
    },
    /* Suites in model.js's shape ({ id, label, note, kind, set }) for suites the app does not have yet. */
    legacySuites(have) {
      const known = new Set((have || []).map((s) => s.id));
      return db.suites.filter((s) => !known.has(s.id)).map((s) => {
        const set = {};
        s.members.forEach((m) => {
          const id = m.slider ? m.curiosity + "." + m.slider : m.curiosity;
          set[id] = m.value != null ? m.value : m.to != null ? m.to : m.from;
        });
        return { id: s.id, label: s.label, note: s.plain, kind: s.kind || "database", set };
      });
    },
    /* Proximities in model.js's shape ({ id, when, then, within, x, y }). */
    legacyProximities(have) {
      const known = new Set((have || []).map((p) => p.id));
      const side = (r) => {
        const o = r.suite ? { suite: r.suite } : { curiosity: r.slider ? r.curiosity + "." + r.slider : r.curiosity };
        if (r.is != null) o.is = r.is;
        if (r.change) o.change = r.change;
        return o;
      };
      return db.proximities.filter((p) => !known.has(p.id)).map((p) => ({ id: p.id, when: p.whenText || p.label, then: p.thenText || "", within: p.within, x: side(p.when), y: side(p.then), note: p.plain }));
    },
    /* One call for the app: adds the database's rows to CURIOSITIES, SUITES and PROXIMITIES in place, and its
       sliders to window.CURIOSITY_FACETS (which automation.js turns into lanes).
       Call it after model.js and before automation.js builds its parameter list. Those three are top-level
       consts in the app (not window properties), so pass them in: install({ CURIOSITIES, SUITES, PROXIMITIES }). */
    install(t) {
      api.resolve();
      t = t || {};
      if (t.CURIOSITIES) api.legacyRows(t.CURIOSITIES).forEach((r) => t.CURIOSITIES.push(r));
      if (t.SUITES) api.legacySuites(t.SUITES).forEach((r) => t.SUITES.push(r));
      if (t.PROXIMITIES) api.legacyProximities(t.PROXIMITIES).forEach((r) => t.PROXIMITIES.push(r));
      /* automation.js merges window.CURIOSITY_FACETS into its lanes when it loads, so the sliders become lanes. */
      const F = (root.CURIOSITY_FACETS = root.CURIOSITY_FACETS || {});
      const f = api.facets();
      Object.keys(f).forEach((id) => (F[id] = (F[id] || []).concat(f[id].filter((x) => !(F[id] || []).includes(x)))));
      return api.counts();
    },
    /* Only needed if install() ran after automation.js: gives every lens its sliders as lanes
       (CurioAuto.FACETS), keeping any lanes the app already lists first. */
    installAutomation(auto) {
      const A = auto || root.CurioAuto;
      if (!A || !A.FACETS) return 0;
      const f = api.facets();
      Object.keys(f).forEach((id) => (A.FACETS[id] = (A.FACETS[id] || []).concat(f[id].filter((x) => !(A.FACETS[id] || []).includes(x)))));
      return Object.keys(f).length;
    },
    toJSON: () => JSON.parse(JSON.stringify(db)),
  };

  root.CuriosityDB = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
