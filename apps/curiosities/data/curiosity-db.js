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

  const db = { workspaces: [], curiosities: [], suites: [], proximities: [], proximitySuites: [], scenes: [] };
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
      /* Suites, proximities and proximity suites are not enriched: a second one with the same id but a different
         label is almost always a new idea that picked a taken id, and would otherwise vanish silently. */
      if (level !== "curiosity" && level !== "workspace" && item.label && old.label && item.label !== old.label)
        clashes.push(`${level} ${item.id}: "${item.label}" was dropped, "${old.label}" already uses that id`);
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
      /* Same key as the app's suite set: a member naming its curiosity's main slider is the curiosity itself. */
      const memberKey = (m) => {
        const c = (index.curiosity || {})[m.curiosity];
        return m.slider && !(c && c.main === m.slider) ? m.curiosity + "." + m.slider : m.curiosity;
      };
      members.forEach((m) => sliders.push(slider({ id: "weight:" + memberKey(m), label: "Weight of " + m.curiosity + (m.slider ? " " + m.slider : ""), range: { min: 0, max: 100, unit: "%" }, from: 0, to: m.weight, plain: "How strongly the suite pushes this member toward its setting." })));
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
        slider({ id: "chance", label: "How often", range: { min: 0, max: 100, unit: "%" }, from: p.often == null ? 70 : p.often, to: 100, plain: "How often the effect follows the cause." }),
      ];
      /* Effect size only means something when the effect is a change (rises, drops); an effect that sets a value or
         plays a suite has no size. Same rule as the app's automation lanes, and the same lane ids (chance, effect). */
      if (p.then && !p.then.suite && !("is" in p.then)) sliders.push(slider({ id: "effect", label: "Effect size", range: { min: 0, max: 5 }, from: p.effect == null ? 2 : p.effect, to: 5, plain: "How big the effect is when it follows." }));
      (p.sliders || []).forEach((x) => sliders.push(slider(x)));
      sliders.push(AMOUNT());
      /* whenText and thenText are the two halves in plain words ("the music is cut dead", "a big line lands"), which
         the app shows as "When ..., ...". A label already written that way is split; others set them (db-proximity-words.js). */
      const split = /^When (.+?), (.+)$/.exec(p.label || "");
      return put("proximity", { id: p.id, level: "proximity", label: p.label, plain: p.plain || "", workspace: p.workspace, also: p.also || [], when: p.when, then: p.then, whenText: p.whenText || (split ? split[1] : ""), thenText: p.thenText || (split ? split[2] : ""), within, often: p.often == null ? null : p.often, sliders, source: p.source || "database", tags: p.tags || [] });
    },

    /* proximitySuite({ id, label, plain, workspace, members: [proximity ids] }) */
    proximitySuite(ps) {
      const sliders = [slider({ id: "blend", label: "Blend", range: { min: 0, max: 100, unit: "%" }, from: 0, to: 100, plain: "How many of the pairs are switched on together." })];
      (ps.members || []).forEach((m) => {
        sliders.push(slider({ id: "delay:" + m, label: "Delay of " + m, range: { min: 0, max: 16, unit: "beats", step: 1 }, from: 0, to: 4, plain: "Beats before this pair's effect follows." }));
        sliders.push(slider({ id: "chance:" + m, label: "How often " + m, range: { min: 0, max: 100, unit: "%" }, from: 50, to: 100, plain: "How often this pair's effect follows." }));
      });
      sliders.push(AMOUNT());
      return put("proximitySuite", { id: ps.id, level: "proximitySuite", label: ps.label, plain: ps.plain || "", workspace: ps.workspace, also: ps.also || [], members: ps.members || [], sliders, source: ps.source || "database", tags: ps.tags || [] });
    },

    /* modelScene({ id, title, genre, plain, beats: [{ at, values: { curiosityId | "curiosity.slider": value } }] })
       A made-up scene written as a trace (not a real film), so the Prism and the Study views have something to
       split. Same shape as a study in study.js; values are checked against the database. */
    modelScene(sc) {
      const scene = { id: sc.id, title: sc.title, kind: "model scene", genre: sc.genre || "", plain: sc.plain || "", camera: "authored", workspace: sc.workspace || "structure", beats: sc.beats.map((b, i) => ({ id: sc.id + "-" + (i + 1), at: b.at || String(i + 1), note: b.note || "", values: b.values })) };
      db.scenes.push(scene);
      return scene;
    },
    /* The model scenes as a file the Study tab's Import button reads. */
    studiesExport: () => ({ format: "curiosities-studies-v1", studies: JSON.parse(JSON.stringify(db.scenes)), shelf: [], proximities: [] }),

    /* ---------- reading ---------- */

    get: (level, id) => (index[level] || {})[id] || null,
    /* Take a row out of its list and its index, so a curiosity someone made and then deleted is gone everywhere.
       Returns the removed row, or null when nothing has that id. Other rows that name it (a suite's members,
       a proximity's from/to) are left alone; check() reports them as missing. */
    remove(level, id) {
      const item = (index[level] || {})[id];
      if (!item) return null;
      const list = level === "workspace" ? db.workspaces : db[level === "curiosity" ? "curiosities" : level === "suite" ? "suites" : level === "proximity" ? "proximities" : "proximitySuites"];
      const at = list.indexOf(item);
      if (at >= 0) list.splice(at, 1);
      delete index[level][id];
      return item;
    },
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
      scenes: db.scenes.length,
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
        if (!p.whenText || !p.thenText) out.push(`proximity ${p.id}: needs whenText and thenText (plain words for "When ..., ...")`);
        ref("proximity " + p.id + " cause", p.when);
        ref("proximity " + p.id + " effect", p.then);
      });
      /* Every curiosity carries a momentum note (data/db-momentum.js) once that file has loaded. */
      if (api.MOMENTUM_CUES)
        db.curiosities.forEach((c) => {
          const m = c.momentum;
          if (!m) return out.push(`curiosity ${c.id}: no momentum note`);
          if (!Number.isInteger(m.push) || m.push < 0 || m.push > 5) out.push(`curiosity ${c.id}: momentum push must be a whole number from 0 to 5`);
          if (!api.MOMENTUM_CUES.includes(m.cue)) out.push(`curiosity ${c.id}: momentum cue "${m.cue}" is not one of ${api.MOMENTUM_CUES.join(", ")}`);
          ["plot", "theme", "pull", "tryThis"].forEach((k) => (typeof m[k] === "string" && m[k].trim()) || out.push(`curiosity ${c.id}: momentum ${k} is empty`));
        });
      db.proximitySuites.forEach((ps) => ps.members.forEach((m) => index.proximity[m] || out.push(`proximity suite ${ps.id}: unknown member ${m}`)));
      db.scenes.forEach((sc) =>
        sc.beats.forEach((b) =>
          Object.entries(b.values).forEach(([k, v]) => {
            const [cid, sid] = k.split(".");
            const c = index.curiosity[cid];
            if (!c) return out.push(`scene ${sc.id} beat ${b.at}: unknown curiosity ${cid}`);
            if (sid && sid === c.main) return out.push(`scene ${sc.id} beat ${b.at}: ${k} is ${cid}'s main slider, write it as ${cid}`);
            const sl = c.sliders.find((x) => x.id === (sid || c.main));
            if (!sl) return out.push(`scene ${sc.id} beat ${b.at}: ${cid} has no slider ${sid}`);
            if (sl.scale && !sl.scale.includes(v)) out.push(`scene ${sc.id} beat ${b.at}: "${v}" is not on ${k}'s scale`);
            if (sl.range && (typeof v !== "number" || v < sl.range.min || v > sl.range.max)) out.push(`scene ${sc.id} beat ${b.at}: ${v} is outside ${k}'s range`);
          })
        )
      );
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
        /* The momentum note (data/db-momentum.js) rides on the curiosity's own row, where momentum/notes.js looks. */
        const own = rows.find((r) => r.id === c.id);
        if (own && c.momentum) own.momentum = Object.assign({}, c.momentum);
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
        const weights = {};
        s.members.forEach((m) => {
          /* A member naming the curiosity's main slider is the curiosity itself (no "<id>.<main>" row exists). */
          const c = api.get("curiosity", m.curiosity);
          const id = m.slider && !(c && c.main === m.slider) ? m.curiosity + "." + m.slider : m.curiosity;
          set[id] = m.value != null ? m.value : m.to != null ? m.to : m.from;
          weights[id] = (m.weight == null ? 100 : m.weight) / 100;
        });
        return { id: s.id, label: s.label, note: s.plain, kind: s.kind || "database", set, weights };
      });
    },
    /* Proximities in model.js's shape ({ id, when, then, within, x, y }). */
    legacyProximities(have) {
      const known = new Set((have || []).map((p) => p.id));
      const side = (r) => {
        const c = r.suite ? null : api.get("curiosity", r.curiosity);
        const o = r.suite ? { suite: r.suite } : { curiosity: r.slider && !(c && c.main === r.slider) ? r.curiosity + "." + r.slider : r.curiosity };
        if (r.is != null) o.is = r.is;
        if (r.change) o.change = r.change;
        return o;
      };
      return db.proximities.filter((p) => !known.has(p.id)).map((p) => ({ id: p.id, label: p.label, when: p.whenText || p.label, then: p.thenText || "", within: p.within, x: side(p.when), y: side(p.then), note: p.plain }));
    },
    /* Every proximity and proximity suite as engine links (engine/state.js: { label, from, to, does, value,
       amount, within }), without tracks: the engine puts each end on the track that has its curiosity, and
       `track` on each end says which kind of track it belongs on when none has it yet.
       - from { curiosity, is?, change }: "x is v" is the leader's condition; rises / drops / changes is change.
       - does: "y rises" rise, "y drops" fall, "y changes" moveWith, "y is v" set with value v.
       - A suite as the effect becomes one link per member (a suite is a group of lenses), all sharing
         `proximity`, each setting its member to the suite's value (its six heaviest members at most); amount is the base amount (0.25) times the
         member's weight. A suite as the cause is led by its heaviest member (the first, on a tie) reaching its
         value, so a suite-to-suite proximity is as many links as the effect suite has members, not the product.
       - groups: each proximity suite, as the link ids of its members, so the engine can add them in one step.
       Curiosity ids are the app's (CURIOSITIES after install), slider rows included ("music.tempo"). */
    links() {
      const BASE = 0.25;
      const CHARACTER = ["character-motion", "placement", "lines", "movement-lines", "wardrobe", "arc", "plot", "mindset", "focus", "archetype"];
      const CAMERA = ["camera-angle", "camera-motion"];
      const trackOf = (cid) => {
        const c = api.get("curiosity", cid.split(".")[0]);
        if (!c) return "master";
        if (cid === "emoRoadCharacter") return "character";
        return CAMERA.includes(c.workspace) ? "camera" : CHARACTER.includes(c.workspace) ? "character" : "master";
      };
      const keyOf = (r) => {
        const c = api.get("curiosity", r.curiosity);
        return r.slider && !(c && c.main === r.slider) ? r.curiosity + "." + r.slider : r.curiosity;
      };
      const val = (m) => (m.value != null ? m.value : m.to != null ? m.to : m.from);
      /* One end as a list of { curiosity, value?, change?, weight }: a suite gives its members. */
      const ends = (r) => {
        if (!r.suite) return [{ curiosity: keyOf(r), value: r.is, change: r.change, weight: 1 }];
        const s = api.get("suite", r.suite);
        return (s ? s.members : []).filter((m) => m.curiosity).map((m) => ({ curiosity: keyOf(m), value: val(m), weight: (m.weight == null ? 100 : m.weight) / 100 }));
      };
      const CHANGE = { rises: "rises", drops: "drops", changes: "any" };
      const DOES = { rises: "rise", drops: "fall", changes: "moveWith" };
      const links = [];
      const byProx = {};
      db.proximities.forEach((p) => {
        const froms = ends(p.when)
          .slice()
          .sort((a, b) => b.weight - a.weight)
          .slice(0, 1)
          .map((f) => Object.assign({}, f, { weight: 1 }));
        /* An effect suite gives its six heaviest members (the Enneagram suites have 18), to keep the list usable. */
        const tos = ends(p.then)
          .map((t, i) => Object.assign({ i }, t))
          .sort((a, b) => b.weight - a.weight || a.i - b.i)
          .slice(0, 6)
          .sort((a, b) => a.i - b.i);
        const ids = (byProx[p.id] = []);
        froms.forEach((f) =>
          tos.forEach((t) => {
            const l = { id: "p:" + p.id + (froms.length * tos.length > 1 ? "#" + (ids.length + 1) : ""), proximity: p.id, label: p.label, from: { curiosity: f.curiosity, track: trackOf(f.curiosity) }, to: { curiosity: t.curiosity, track: trackOf(t.curiosity) }, within: Math.max(0, Math.min(16, p.within || 0)), amount: Math.round(BASE * f.weight * t.weight * 1000) / 1000 };
            if (f.value != null) l.from.is = f.value;
            l.from.change = f.value != null ? "any" : CHANGE[f.change] || "any";
            if (t.value != null) {
              l.does = "set";
              l.value = t.value;
            } else l.does = DOES[t.change] || "moveWith";
            /* "x is A, then x is B" (a setup then its payoff) stays in one lane; the engine needs a same-lane rule. */
            if (f.curiosity === t.curiosity) l.sameLane = true;
            if (p.whenText) l.when = p.whenText;
            if (p.thenText) l.then = p.thenText;
            ids.push(l.id);
            links.push(l);
          })
        );
      });
      const groups = db.proximitySuites.map((ps) => ({ id: "ps:" + ps.id, label: ps.label, plain: ps.plain, proximities: ps.members.slice(), links: [].concat(...ps.members.map((m) => byProx[m] || [])) }));
      return { format: "curiosities-links", version: 1, links, groups };
    },
    /* Saved work that names a curiosity merged into another one. Runs in install(), before story.js reads its store.
       enneagramHealth ("Health of the type": unhealthy, average, healthy) became cm-health (1 at their best, 9 at
       their worst) on 2026-10-02. */
    migrate() {
      const MERGED = { enneagramHealth: { to: "cm-health", map: { unhealthy: 8, average: 5, healthy: 2 } } };
      try {
        const ls = root.localStorage;
        const raw = ls && ls.getItem("curiosities-story-v1");
        const st = raw && JSON.parse(raw);
        if (!st || !st.values) return;
        let changed = false;
        Object.values(st.values).forEach((scenes) =>
          (Array.isArray(scenes) ? scenes : []).forEach((row) =>
            Object.keys(MERGED).forEach((old) => {
              if (!row || !(old in row)) return;
              const m = MERGED[old];
              if (row[m.to] == null && m.map[row[old]] != null) row[m.to] = m.map[row[old]];
              delete row[old];
              changed = true;
            })
          )
        );
        if (changed) ls.setItem("curiosities-story-v1", JSON.stringify(st));
      } catch (e) {}
    },
    /* Proximity suites in automation.js's shape ({ id, label, members }). */
    legacyProximitySuites(have) {
      const out = (have || []).slice();
      db.proximitySuites.forEach((p) => out.some((q) => q.id === p.id) || out.push({ id: p.id, label: p.label, note: p.plain, members: p.members.slice() }));
      return out;
    },
    /* One call for the app: adds the database's rows to CURIOSITIES, SUITES and PROXIMITIES in place, and its
       sliders to window.CURIOSITY_FACETS (which automation.js turns into lanes).
       Call it after model.js and before automation.js builds its parameter list. Those three are top-level
       consts in the app (not window properties), so pass them in: install({ CURIOSITIES, SUITES, PROXIMITIES }). */
    install(t) {
      api.resolve();
      t = t || {};
      if (t.CURIOSITIES) {
        /* Rows the app already has keep their own values, except a label or note that data/db-plain.js rewrote
           in plain words: those follow the database, so lanes, lists and the inspector all say the same thing. */
        t.CURIOSITIES.forEach((r) => {
          const c = index.curiosity[r.id];
          if (!c) return;
          if (c.relabeled) r.label = c.label;
          if (c.replained && "note" in r) r.note = c.plain;
        });
        api.legacyRows(t.CURIOSITIES).forEach((r) => t.CURIOSITIES.push(r));
      }
      if (t.SUITES) {
        /* Suites the app already has keep their own values; they only gain the database's member weights (0..1). */
        const have = Object.fromEntries(api.legacySuites([]).map((r) => [r.id, r]));
        t.SUITES.forEach((x) => have[x.id] && !x.weights && (x.weights = have[x.id].weights));
        api.legacySuites(t.SUITES).forEach((r) => t.SUITES.push(r));
      }
      if (t.PROXIMITIES) api.legacyProximities(t.PROXIMITIES).forEach((r) => t.PROXIMITIES.push(r));
      /* Proximity suites live in automation.js (PROXIMITY_SUITES), which loads after this, so they wait on
         window.CURIOSITY_PROXIMITY_SUITES for it to merge, the same way it merges CURIOSITY_FACETS. */
      root.CURIOSITY_PROXIMITY_SUITES = api.legacyProximitySuites(root.CURIOSITY_PROXIMITY_SUITES);
      api.migrate();
      /* The engine (engine/seeds.js) reads every proximity and proximity suite as links from here. */
      root.CURIOSITY_LINKS = api.links();
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
