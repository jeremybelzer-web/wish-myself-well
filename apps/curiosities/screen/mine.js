/* screen/mine.js: your own curiosities, suites and proximities. Part of the Screen core (no page; works in Node
   for the tests).

   Jeremy: "The user should be able to define and create their own curiosities as well as curiosity suites and
   proximities. Either here [the Screen's curiosity library] or in a similar space."

   What you make is kept in localStorage "curiosities-user-curiosities-v1" (a part of the app-wide store when the
   page has one, so making, changing or deleting one is one step on the same undo list as ⌘Z, and project files
   carry it like every other curiosities-* key). At load, and after every change, each item is registered with the
   curiosity database (CuriosityDB) the way a data file's rows are, so the library, Details, the timeline, Quick
   find, the levels (CurioLevels) and the engine's proximity pack (window.CURIOSITY_LINKS) all see it.

   Ids always start with "my-" ("my-tension"), and the database has none that do (the tests check), so yours can
   never clash with its rows. A name already taken gets "-2", "-3"...

   The engine knows a curiosity's scale through window.CurioScale (engine/catalog.js), which reads the curiosity
   list once when it loads and remembers each answer. Ours are made later, so this file answers CurioScale for
   "my-" ids itself (domain, known, label, fix, pos, at, step, steps, start), leaving every other id to the
   engine. A scale you change is remembered for the rest of the session, so a node set on the old steps lands on
   the new ones by its place on the scale (undo and redo keep working across the change).

   window.CurioMine
   - KEY, PREFIX, FORMAT ("curiomatic-my-curiosities"), isMine(id)
   - clean(raw) -> { v: 1, curiosities: [], suites: [], proximities: [] }: what is kept, with anything broken left out
     curiosity  { id, label, plain, story, tryThis, cat, cue, push, scale, extras: [{ id, label, scale }] }
                scale: { kind: "steps", steps: ["calm", "tense", "frantic"] } or { kind: "range", min, max, unit, step }
     suite      { id, label, plain, cat, members: [{ curiosity, value? }] }
     proximity  { id, label, plain, cat, when: { curiosity, change, is? }, then: { curiosity, change, is? }, within }
                change: "rises", "drops", "changes" or "is" (then `is` is the value); within: 0 to 16 moments
   - parseSteps(text), scaleWords(scale), newId(name, data), sliderIds(names)
   - sentence(proximity, labelOf?) -> "When Tension goes up, Shot size changes too within 2 moments."
   - rows(data) -> the database rows it registers; install(data) registers them (and takes away deleted ones)
   - domain(key) / known(key): a "my-" lane's scale, from what is registered now
   - exportJson(data, ids?) -> text of a .json file (a suite or proximity brings the curiosities of yours it uses)
   - importJson(text, data) -> { items: { curiosities, suites, proximities }, added, skipped, renamed, dropped, error }
   - store() -> the saved part: view(), send({ type: "put", level, item, label } | { type: "remove", level, id }
                | { type: "add", items, label }), on(fn); undo: false when the page has no app-wide store
   - start() runs once in the page: reads what you saved, registers it, and puts back any nodes of yours the
     engine could not read before this file loaded (it loads its film first). */
(function () {
  const root = typeof window !== "undefined" ? window : globalThis;
  const KEY = "curiosities-user-curiosities-v1";
  const PREFIX = "my-";
  const FORMAT = "curiomatic-my-curiosities";
  const CUES = ["visual", "audio", "thought", "movement", "plot"];
  const CHANGES = ["rises", "drops", "changes", "is"];
  const LEVELS = { curiosity: "curiosities", suite: "suites", proximity: "proximities" };
  const MAX = { curiosities: 200, suites: 100, proximities: 200, steps: 24, extras: 8, members: 24 };
  const DB = () => root.CuriosityDB || null;
  const LV = () => root.CurioLevels || null;
  const isObj = (x) => x != null && typeof x === "object" && !Array.isArray(x);
  const clone = (x) => JSON.parse(JSON.stringify(x));
  const isMine = (id) => typeof id === "string" && id.startsWith(PREFIX) && id.length > PREFIX.length;
  const baseOf = (k) => String(k == null ? "" : k).split(".")[0];
  const txt = (s, n) =>
    String(s == null ? "" : s)
      .replace(/[\u0000-\u001f\u007f]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, n || 200);
  const idOk = (s) => typeof s === "string" && /^[A-Za-z0-9_.:@-]{1,80}$/.test(s) && !/^(__proto__|constructor|prototype)$/.test(s);
  const uniq = (a) => a.filter((x, i) => a.indexOf(x) === i);
  function slug(s, fallback) {
    const out = String(s == null ? "" : s)
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40)
      .replace(/-+$/, "");
    return out || fallback || "curiosity";
  }

  /* ---------- scales ---------- */
  /* "calm, tense, frantic", "calm → tense → frantic", "calm > tense > frantic" or one per line. */
  function parseSteps(text) {
    if (Array.isArray(text)) return text.map((x) => txt(x, 40)).filter(Boolean);
    return String(text == null ? "" : text)
      .split(/\s*(?:,|;|\n|→|->|=>|>|\|)\s*/)
      .map((x) => txt(x, 40))
      .filter(Boolean);
  }
  function autoStep(min, max) {
    const span = max - min;
    if (span <= 1 || !Number.isInteger(min) || !Number.isInteger(max)) return Math.round((span / 20) * 1000) / 1000 || 0.05;
    return span > 1000 ? 100 : span > 200 ? 5 : 1;
  }
  function cleanScale(s) {
    if (!isObj(s)) return null;
    if (s.kind === "steps" || (s.kind == null && s.steps != null)) {
      const seen = new Set();
      const steps = parseSteps(s.steps).filter((x) => {
        const k = x.toLowerCase();
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });
      return steps.length >= 2 ? { kind: "steps", steps: steps.slice(0, MAX.steps) } : null;
    }
    if (s.kind !== "range" && s.min == null) return null;
    const min = Number(s.min);
    const max = Number(s.max);
    if (s.min === "" || s.max === "" || s.min == null || s.max == null || !isFinite(min) || !isFinite(max) || max <= min || Math.abs(min) > 1e9 || Math.abs(max) > 1e9) return null;
    let step = Number(s.step);
    if (!(step > 0) || step > max - min) step = autoStep(min, max);
    return { kind: "range", min, max, unit: txt(s.unit, 16), step };
  }
  /* The scale in a few plain words: "calm to frantic", "0 to 100 bpm". */
  function scaleWords(sc) {
    if (!sc) return "";
    if (sc.kind === "steps") return sc.steps[0] + " to " + sc.steps[sc.steps.length - 1];
    return sc.min + " to " + sc.max + (sc.unit ? " " + sc.unit : "");
  }
  const domainOf = (sc) => (!sc ? null : sc.kind === "steps" ? { kind: "choice", options: sc.steps.slice() } : { kind: "range", min: sc.min, max: sc.max, step: sc.step, unit: sc.unit || "" });

  /* ---------- what is kept ---------- */
  const catIds = () => (LV() ? LV().CATEGORIES.map((c) => c.id) : null);
  function cleanCat(c) {
    const ids = catIds();
    const s = txt(c, 40);
    return ids ? (ids.includes(s) ? s : "story") : s || "story";
  }
  /* Slider ids for a curiosity's extra sliders: from their names, never "setting" or "amount", never twice. */
  function sliderIds(names) {
    const used = new Set(["setting", "amount"]);
    return names.map((n) => {
      const b = slug(n, "slider").slice(0, 24).replace(/-+$/, "") || "slider";
      let id = b;
      let k = 2;
      while (used.has(id)) id = b + "-" + k++;
      used.add(id);
      return id;
    });
  }
  function cleanCuriosity(c) {
    if (!isObj(c) || !isMine(c.id) || !idOk(c.id) || c.id.includes(".")) return null;
    const label = txt(c.label, 60);
    const scale = cleanScale(c.scale);
    if (!label || !scale) return null;
    const out = { id: c.id, label, plain: txt(c.plain, 400), story: txt(c.story, 400), tryThis: txt(c.tryThis, 240), cat: cleanCat(c.cat), cue: CUES.includes(c.cue) ? c.cue : "visual", push: Math.max(0, Math.min(5, Math.round(Number(c.push)))), scale };
    if (!isFinite(out.push)) out.push = 2;
    const raw = (Array.isArray(c.extras) ? c.extras : []).filter((x) => isObj(x) && txt(x.label, 40) && cleanScale(x.scale)).slice(0, MAX.extras);
    const wanted = raw.map((x) => (typeof x.id === "string" && /^[a-z0-9-]{1,24}$/.test(x.id) && x.id !== "setting" && x.id !== "amount" ? x.id : null));
    const fresh = sliderIds(raw.map((x) => x.label));
    const used = new Set();
    out.extras = raw.map((x, i) => {
      let id = wanted[i] && !used.has(wanted[i]) ? wanted[i] : fresh[i];
      while (used.has(id)) id += "-x";
      used.add(id);
      return { id, label: txt(x.label, 40), scale: cleanScale(x.scale) };
    });
    return out;
  }
  function cleanSuite(s) {
    if (!isObj(s) || !isMine(s.id) || !idOk(s.id) || s.id.includes(".")) return null;
    const label = txt(s.label, 60);
    const seen = new Set();
    const members = (Array.isArray(s.members) ? s.members : [])
      .filter((m) => isObj(m) && idOk(m.curiosity) && !seen.has(m.curiosity) && seen.add(m.curiosity))
      .slice(0, MAX.members)
      .map((m) => {
        const o = { curiosity: m.curiosity };
        if (m.value != null && m.value !== "" && (typeof m.value === "string" || (typeof m.value === "number" && isFinite(m.value)))) o.value = typeof m.value === "string" ? txt(m.value, 40) : m.value;
        return o;
      });
    if (!label || !members.length) return null;
    return { id: s.id, label, plain: txt(s.plain, 400), cat: cleanCat(s.cat), members };
  }
  function cleanEnd(e) {
    if (!isObj(e) || !idOk(e.curiosity)) return null;
    const change = CHANGES.includes(e.change) ? e.change : e.is != null && e.is !== "" ? "is" : "changes";
    const o = { curiosity: e.curiosity, change };
    if (change === "is") {
      if (e.is == null || e.is === "" || !(typeof e.is === "string" || (typeof e.is === "number" && isFinite(e.is)))) return null;
      o.is = typeof e.is === "string" ? txt(e.is, 40) : e.is;
    }
    return o;
  }
  function cleanProximity(p) {
    if (!isObj(p) || !isMine(p.id) || !idOk(p.id) || p.id.includes(".")) return null;
    const when = cleanEnd(p.when);
    const then = cleanEnd(p.then);
    if (!when || !then) return null;
    const within = Math.max(0, Math.min(16, Math.round(Number(p.within))));
    return { id: p.id, label: txt(p.label, 120), plain: txt(p.plain, 400), cat: cleanCat(p.cat), when, then, within: isFinite(within) ? within : 2 };
  }
  const CLEAN = { curiosities: cleanCuriosity, suites: cleanSuite, proximities: cleanProximity };
  function clean(raw) {
    const out = { v: 1, curiosities: [], suites: [], proximities: [] };
    const ids = new Set();
    Object.keys(CLEAN).forEach((k) => {
      (isObj(raw) && Array.isArray(raw[k]) ? raw[k] : []).forEach((x) => {
        const it = CLEAN[k](x);
        if (!it || ids.has(it.id) || out[k].length >= MAX[k]) return;
        ids.add(it.id);
        out[k].push(it);
      });
    });
    return out;
  }
  const allIds = (data) => [].concat(data.curiosities, data.suites, data.proximities).map((x) => x.id);
  /* A new id from a name: "my-" + the name in small letters and dashes, with -2, -3... when it is taken by one of
     yours or (never today) by the database. */
  function newId(name, data, also) {
    const taken = new Set(allIds(clean(data)).concat(also || []));
    const db = DB();
    /* A database row with that id that this file did not register (deleted ones of yours may be used again). */
    const used = (id) => taken.has(id) || !!(db && db.find && db.find(id) && !registered.has(id));
    const b = PREFIX + slug(name, "curiosity");
    let id = b;
    let k = 2;
    while (used(id)) id = b + "-" + k++;
    return id;
  }

  /* ---------- plain words ---------- */
  const labelFrom = (labelOf) => (k) => {
    if (typeof labelOf === "function") return labelOf(k);
    const S = root.CurioScale;
    return S ? S.label(k) : k;
  };
  function endWords(e, name, then) {
    if (e.change === "is") return name + " becomes " + e.is;
    if (e.change === "rises") return name + " goes up";
    if (e.change === "drops") return name + " goes down";
    return name + (then ? " changes too" : " changes");
  }
  const withinWords = (n) => (n === 0 ? "at the same moment" : "within " + n + " moment" + (n === 1 ? "" : "s"));
  /* "When Tension goes up, Shot size changes too within 2 moments." */
  function sentence(p, labelOf) {
    if (!p || !p.when || !p.then) return "";
    const L = labelFrom(labelOf);
    return "When " + endWords(p.when, L(p.when.curiosity)) + ", " + endWords(p.then, L(p.then.curiosity), true) + " " + withinWords(p.within) + ".";
  }

  /* ---------- the database rows ---------- */
  const catOf = (id) => (LV() ? LV().CATEGORIES.find((c) => c.id === id) : null);
  const workspaceOf = (cat) => {
    const c = catOf(cat);
    return c ? c.workspaces[0] : "plot";
  };
  const slider = (o) => (DB() && DB().slider ? DB().slider(o) : o);
  function sliderSpec(id, label, sc, plain, extra) {
    const o = Object.assign({ id, label, plain: plain || label }, extra || {});
    if (sc.kind === "steps") o.scale = sc.steps.slice();
    else o.range = { min: sc.min, max: sc.max, unit: sc.unit || "", step: sc.step };
    return slider(o);
  }
  const amount = () => slider({ id: "amount", label: "Amount", range: { min: 0, max: 100, unit: "%" }, from: 100, to: 100, plain: "Share of panels in the moment where it plays." });
  function curiosityRow(c) {
    const words = scaleWords(c.scale);
    const plain = c.plain || "A curiosity you made: " + c.label + ", from " + words + ".";
    const sliders = [sliderSpec("setting", words, c.scale, plain)];
    c.extras.forEach((x) => sliders.push(sliderSpec(x.id, x.label, x.scale, x.label + " of " + c.label + ", from " + scaleWords(x.scale) + ".", { lane: true })));
    sliders.push(amount());
    return {
      id: c.id,
      level: "curiosity",
      label: c.label,
      plain,
      workspace: workspaceOf(c.cat),
      also: [],
      group: "Made by me",
      kind: "lens",
      per: "panel",
      main: "setting",
      sliders,
      source: "mine",
      tags: ["mine"],
      momentum: {
        push: c.push,
        cue: c.cue,
        plot: c.story || "You made this one; say how it moves the story when you know.",
        theme: c.plain || plain,
        pull: c.story || "Watch where the audience looks when it changes.",
        tryThis: c.tryThis || "Change it at a turn of the scene and see what follows.",
      },
    };
  }
  /* A lane key ("my-tension", "eyeline.speaking") as a database end: { curiosity, slider? }. */
  function endRef(key) {
    const k = String(key);
    const dot = k.indexOf(".");
    return dot > 0 ? { curiosity: k.slice(0, dot), slider: k.slice(dot + 1) } : { curiosity: k };
  }
  function suiteRow(s) {
    const members = s.members.map((m) => Object.assign(endRef(m.curiosity), m.value != null ? { value: m.value } : {}, { weight: 100 }));
    const sliders = [slider({ id: "blend", label: "Blend", range: { min: 0, max: 100, unit: "%" }, from: 0, to: 100, plain: "How much of the suite is laid over the moment, from none to all of it." })];
    s.members.forEach((m) => sliders.push(slider({ id: "weight:" + m.curiosity, label: "Weight of " + m.curiosity, range: { min: 0, max: 100, unit: "%" }, from: 0, to: 100, plain: "How strongly the suite pushes this member toward its setting." })));
    sliders.push(amount());
    return { id: s.id, level: "suite", label: s.label, plain: s.plain || "A suite you made: " + s.members.length + " curiosities looked at together.", workspace: workspaceOf(s.cat), also: [], kind: "", members, sliders, source: "mine", tags: ["mine"] };
  }
  function proximityRow(p, labelOf) {
    const L = labelFrom(labelOf);
    const end = (e) => {
      const o = endRef(e.curiosity);
      if (e.change === "is") o.is = e.is;
      else o.change = e.change;
      return o;
    };
    const whenText = endWords(p.when, L(p.when.curiosity));
    const thenText = endWords(p.then, L(p.then.curiosity), true) + " " + withinWords(p.within);
    const sliders = [
      slider({ id: "cause", label: "Cause", range: { min: 0, max: 100, unit: "%" }, from: 0, to: 100, plain: "Share of panels where the cause is set." }),
      slider({ id: "delay", label: "Delay", range: { min: 0, max: Math.max(16, p.within + 8), unit: "beats", step: 1 }, from: p.within, to: p.within + 2, plain: "Beats between the cause and the effect." }),
      slider({ id: "chance", label: "How often", range: { min: 0, max: 100, unit: "%" }, from: 70, to: 100, plain: "How often the effect follows the cause." }),
    ];
    if (p.then.change !== "is") sliders.push(slider({ id: "effect", label: "Effect size", range: { min: 0, max: 5 }, from: 2, to: 5, plain: "How big the effect is when it follows." }));
    sliders.push(amount());
    return { id: p.id, level: "proximity", label: p.label || "When " + whenText + ", " + thenText, plain: p.plain || sentence(p, labelOf), workspace: workspaceOf(p.cat), also: [], when: end(p.when), then: end(p.then), whenText, thenText, within: p.within, often: null, sliders, source: "mine", tags: ["mine"] };
  }
  function rows(data, labelOf) {
    data = clean(data);
    return { curiosities: data.curiosities.map(curiosityRow), suites: data.suites.map(suiteRow), proximities: data.proximities.map((p) => proximityRow(p, labelOf)) };
  }

  /* ---------- CurioScale for "my-" ids ---------- */
  let data = clean(null);
  const registered = new Set();
  const hist = Object.create(null); /* key -> older scales this session, newest first */
  const EMPTY = Object.freeze({ kind: "choice", options: Object.freeze([]) });
  const curOf = (id) => data.curiosities.find((c) => c.id === id) || null;
  function scaleOf(key) {
    const k = String(key == null ? "" : key);
    const c = curOf(baseOf(k));
    if (!c) return null;
    if (k === c.id) return c.scale;
    const x = c.extras.find((e) => c.id + "." + e.id === k);
    return x ? x.scale : null;
  }
  const domain = (key) => domainOf(scaleOf(key));
  const known = (key) => !!scaleOf(key);
  function snap(d, n) {
    if (!isFinite(n)) return null;
    const s = d.step > 0 ? d.step : 1;
    const v = Math.min(d.max, Math.max(d.min, Math.round((n - d.min) / s) * s + d.min));
    return Math.round(v * 1e6) / 1e6;
  }
  function fixIn(d, value) {
    if (!d || value == null || value === "" || (typeof value !== "number" && typeof value !== "string")) return null;
    if (d.kind === "range") {
      const n = typeof value === "number" ? value : Number(value);
      return isFinite(n) ? snap(d, n) : null;
    }
    const s = String(value);
    if (d.options.includes(s)) return s;
    return d.options.find((o) => o.toLowerCase() === s.toLowerCase()) || null;
  }
  const posIn = (d, v) => (v == null ? null : d.kind === "range" ? (d.max > d.min ? (v - d.min) / (d.max - d.min) : 0) : d.options.length > 1 ? d.options.indexOf(v) / (d.options.length - 1) : 0);
  function atIn(d, p) {
    p = Math.min(1, Math.max(0, Number(p) || 0));
    if (d.kind === "range") return snap(d, d.min + p * (d.max - d.min));
    return d.options.length ? d.options[Math.round(p * (d.options.length - 1))] : null;
  }
  /* A value on this scale; a value from a scale this curiosity had earlier in the session lands at the same place
     on the new one. */
  function fix(key, value) {
    const d = domain(key);
    if (!d) return null;
    const v = fixIn(d, value);
    if (v != null) return v;
    for (const old of hist[key] || []) {
      const w = fixIn(old, value);
      if (w != null) return atIn(d, posIn(old, w));
    }
    return null;
  }
  function makeScale(orig) {
    const mine = (id) => isMine(baseOf(id));
    const stepsOf = (d) => (d.kind === "range" ? Math.max(1, Math.round((d.max - d.min) / (d.step || 1))) : Math.max(1, d.options.length - 1));
    return {
      domain: (id) => (mine(id) ? Object.freeze(domain(id) || EMPTY) : orig.domain(id)),
      known: (id) => (mine(id) ? known(id) : orig.known(id)),
      label(id) {
        if (!mine(id)) return orig.label(id);
        const c = curOf(baseOf(id));
        if (!c) return String(id);
        if (id === c.id) return c.label;
        const x = c.extras.find((e) => c.id + "." + e.id === id);
        return x ? c.label + ": " + x.label.toLowerCase() : String(id);
      },
      group: (id) => (mine(id) ? (curOf(baseOf(id)) ? "Made by me" : "") : orig.group(id)),
      fix: (id, v) => (mine(id) ? fix(id, v) : orig.fix(id, v)),
      pos(id, v) {
        if (!mine(id)) return orig.pos(id, v);
        const d = domain(id);
        const x = fix(id, v);
        return d && x != null ? posIn(d, x) : null;
      },
      at(id, p) {
        if (!mine(id)) return orig.at(id, p);
        const d = domain(id);
        return d ? atIn(d, p) : null;
      },
      steps(id) {
        if (!mine(id)) return orig.steps(id);
        const d = domain(id);
        return d ? stepsOf(d) : 1;
      },
      step(id, v, n) {
        if (!mine(id)) return orig.step(id, v, n);
        const d = domain(id);
        const x = fix(id, v);
        if (!d || x == null) return x;
        const total = stepsOf(d);
        return atIn(d, Math.round(posIn(d, x) * total + (Number(n) || 0)) / total);
      },
      start(id) {
        if (!mine(id)) return orig.start(id);
        const d = domain(id);
        return d ? atIn(d, d.kind === "range" ? 0.5 : 0) : null;
      },
    };
  }
  /* Answer CurioScale for "my-" ids (once). The engine and every view call it through window.CurioScale, so
     replacing its methods reaches them all; other ids go to the engine's own answers. */
  function patchScale() {
    const S = root.CurioScale;
    if (!S || S.__mine) return !!S;
    const orig = {};
    ["domain", "known", "label", "group", "fix", "pos", "at", "steps", "step", "start"].forEach((k) => (orig[k] = typeof S[k] === "function" ? S[k].bind(S) : () => null));
    Object.assign(S, makeScale(orig));
    try {
      Object.defineProperty(S, "__mine", { value: true });
    } catch (e) {
      S.__mine = true;
    }
    return true;
  }

  /* ---------- registering with the database ---------- */
  const LIST = { curiosity: "curiosities", suite: "suites", proximity: "proximities" };
  function place(level, row) {
    const db = DB();
    const list = db.data[LIST[level]];
    let have = db.get(level, row.id);
    if (!have) {
      /* The database's own adder indexes the id (its index is private); the row is then made exactly ours. */
      const seed = level === "curiosity" ? { id: row.id, label: row.label, workspace: row.workspace, sliders: [] } : level === "suite" ? { id: row.id, label: row.label, workspace: row.workspace, members: [] } : { id: row.id, label: row.label, workspace: row.workspace, when: row.when, then: row.then, within: row.within };
      have = db[level](seed);
    }
    Object.keys(have).forEach((k) => !(k in row) && delete have[k]);
    Object.assign(have, row);
    if (!list.includes(have)) list.push(have);
    registered.add(row.id);
  }
  function unplace(level, id) {
    const db = DB();
    /* The database's own remove (PR #131) also clears its index; before it lands, take the row out of its list. */
    if (typeof db.remove === "function") return void db.remove(level, id);
    const row = db.get(level, id);
    const list = db.data[LIST[level]];
    const i = row ? list.indexOf(row) : -1;
    if (i >= 0) list.splice(i, 1);
  }
  /* Register everything in `next` (and take away what is gone), then refresh the engine's proximity pack. */
  function install(next) {
    const before = data;
    data = clean(next);
    /* A scale that changed is remembered, so nodes on the old one still find their place. */
    before.curiosities.forEach((c) => {
      const keys = [c.id].concat(c.extras.map((x) => c.id + "." + x.id));
      keys.forEach((k) => {
        const was = domainOf(k === c.id ? c.scale : c.extras.find((x) => c.id + "." + x.id === k).scale);
        const now = domain(k);
        if (was && JSON.stringify(was) !== JSON.stringify(now)) hist[k] = [was].concat(hist[k] || []).slice(0, 6);
      });
    });
    patchScale();
    const db = DB();
    if (!db || !db.data || typeof db.get !== "function") return false;
    const want = rows(data);
    const ids = { curiosity: new Set(), suite: new Set(), proximity: new Set() };
    want.curiosities.forEach((r) => (place("curiosity", r), ids.curiosity.add(r.id)));
    want.suites.forEach((r) => (place("suite", r), ids.suite.add(r.id)));
    want.proximities.forEach((r) => (place("proximity", r), ids.proximity.add(r.id)));
    Object.keys(LIST).forEach((lv) => db.data[LIST[lv]].filter((x) => isMine(x.id) && !ids[lv].has(x.id)).forEach((x) => unplace(lv, x.id)));
    /* Only when you have (or had) proximities of your own; otherwise the database's pack is already right. */
    if (typeof db.links === "function" && (before.proximities.length || data.proximities.length))
      try {
        root.CURIOSITY_LINKS = db.links();
      } catch (e) {}
    return true;
  }

  /* ---------- sharing as a file ---------- */
  /* ids: the items to share (all of yours when left out). A suite or proximity brings the curiosities of yours
     it uses, so the file works on its own. */
  function exportJson(d, ids) {
    d = clean(d || data);
    let want = ids ? new Set(ids) : null;
    if (want) {
      d.suites.forEach((s) => want.has(s.id) && s.members.forEach((m) => isMine(baseOf(m.curiosity)) && want.add(baseOf(m.curiosity))));
      d.proximities.forEach((p) => want.has(p.id) && [p.when, p.then].forEach((e) => isMine(baseOf(e.curiosity)) && want.add(baseOf(e.curiosity))));
    }
    const pick = (list) => (want ? list.filter((x) => want.has(x.id)) : list);
    return JSON.stringify({ format: FORMAT, v: 1, note: "Curiosities, suites and proximities made in Curiomatic. Bring them in with Import… in the Screen's library.", curiosities: pick(d.curiosities), suites: pick(d.suites), proximities: pick(d.proximities) }, null, 2);
  }
  /* What a file adds to `d`: the same item again is skipped; an id already used for something else gets a new
     one (and the file's suites and proximities follow it); a member or an end naming a curiosity this app
     doesn't know is left out (a proximity missing an end is left out). */
  function importJson(text, d, opts) {
    d = clean(d || data);
    const knownHere = (opts && opts.known) || ((k) => !!(root.CurioScale && root.CurioScale.known(k)));
    let raw;
    try {
      raw = typeof text === "string" ? JSON.parse(text) : text;
    } catch (e) {
      return { error: "That file isn't a curiosities file (it couldn't be read as JSON)." };
    }
    if (!isObj(raw) || (raw.format != null && raw.format !== FORMAT)) return { error: "That file isn't a file of curiosities made in Curiomatic." };
    /* Ids not starting with "my-" get one that does, so a file can never land on a database row. */
    const fix = (list) => (Array.isArray(list) ? list.filter(isObj).map((x) => Object.assign({}, x, { id: isMine(x.id) ? x.id : PREFIX + slug(x.id || x.label, "item") })) : []);
    const inc = clean({ curiosities: fix(raw.curiosities), suites: fix(raw.suites), proximities: fix(raw.proximities) });
    if (!inc.curiosities.length && !inc.suites.length && !inc.proximities.length) return { error: "That file has no curiosities, suites or proximities in it." };
    const out = { items: { curiosities: [], suites: [], proximities: [] }, added: 0, skipped: 0, renamed: 0, dropped: 0 };
    const have = {};
    ["curiosities", "suites", "proximities"].forEach((k) => d[k].forEach((x) => (have[x.id] = JSON.stringify(x))));
    const map = {};
    const taken = [];
    const same = (x) => have[x.id] === JSON.stringify(x);
    const handle = (k, x) => {
      if (same(x)) {
        out.skipped++;
        return false;
      }
      if (have[x.id] || taken.includes(x.id) || (DB() && DB().find && DB().find(x.id) && !registered.has(x.id))) {
        const id = newId(x.label, d, taken.concat(Object.keys(have)));
        map[x.id] = id;
        x = Object.assign({}, x, { id });
        out.renamed++;
      }
      taken.push(x.id);
      out.items[k].push(x);
      out.added++;
      return true;
    };
    inc.curiosities.forEach((c) => handle("curiosities", c));
    const newCurs = new Set(out.items.curiosities.map((c) => c.id).concat(d.curiosities.map((c) => c.id)));
    const remap = (key) => {
      const b = baseOf(key);
      return map[b] ? map[b] + String(key).slice(b.length) : key;
    };
    const ok = (key) => (isMine(baseOf(key)) ? newCurs.has(baseOf(key)) : knownHere(key));
    inc.suites.forEach((s) => {
      const members = s.members.map((m) => Object.assign({}, m, { curiosity: remap(m.curiosity) })).filter((m) => ok(m.curiosity) || (out.dropped++, false));
      if (!members.length) return;
      handle("suites", Object.assign({}, s, { members }));
    });
    inc.proximities.forEach((p) => {
      const when = Object.assign({}, p.when, { curiosity: remap(p.when.curiosity) });
      const then = Object.assign({}, p.then, { curiosity: remap(p.then.curiosity) });
      if (!ok(when.curiosity) || !ok(then.curiosity)) return out.dropped++;
      handle("proximities", Object.assign({}, p, { when, then }));
    });
    return out;
  }

  /* ---------- the saved part ---------- */
  let part = null;
  const listeners = [];
  function tellAll(d, label) {
    listeners.slice().forEach((fn) => {
      try {
        fn(d, label);
      } catch (e) {}
    });
    try {
      if (root.dispatchEvent && typeof CustomEvent === "function") root.dispatchEvent(new CustomEvent("curio-mine", { detail: { label } }));
    } catch (e) {}
  }
  const COMMANDS = {
    put(d, m) {
      const k = LEVELS[m.level];
      if (!k || !isObj(m.item)) throw new Error("Nothing to keep.");
      const i = d[k].findIndex((x) => x.id === m.item.id);
      if (i >= 0) d[k][i] = m.item;
      else d[k].push(m.item);
    },
    remove(d, m) {
      const k = LEVELS[m.level];
      if (!k) throw new Error("Nothing to delete.");
      d[k] = d[k].filter((x) => x.id !== m.id);
    },
    add(d, m) {
      const it = isObj(m.items) ? m.items : {};
      ["curiosities", "suites", "proximities"].forEach((k) => (Array.isArray(it[k]) ? it[k] : []).forEach((x) => d[k].push(x)));
    },
  };
  function store() {
    if (part) return part;
    const St = root.CurioStore;
    if (St && typeof St.part === "function") {
      try {
        const p = St.part("screenMyCuriosities", { key: KEY, initial: () => clean(null), normalize: clean, commands: COMMANDS });
        p.on((d, label) => {
          install(d);
          tellAll(d, label);
        });
        part = p;
        return part;
      } catch (e) {
        part = null;
      }
    }
    /* No app-wide store: plain storage, with no undo. */
    let d = clean(null);
    try {
      d = clean(JSON.parse(root.localStorage.getItem(KEY)));
    } catch (e) {}
    part = {
      undo: false,
      view: () => d,
      on(fn) {
        listeners.push(fn);
        return () => listeners.splice(listeners.indexOf(fn) >>> 0, 1);
      },
      send(msg) {
        if (!isObj(msg) || !COMMANDS[msg.type]) return { ok: false, error: "Unknown command." };
        const draft = clone(d);
        try {
          COMMANDS[msg.type](draft, msg);
        } catch (e) {
          return { ok: false, error: String(e.message || e) };
        }
        const next = clean(draft);
        if (JSON.stringify(next) === JSON.stringify(d)) return { ok: true, unchanged: true };
        d = next;
        try {
          root.localStorage.setItem(KEY, JSON.stringify(d));
        } catch (e) {}
        install(d);
        tellAll(d, msg.label || msg.type);
        return { ok: true };
      },
    };
    return part;
  }
  const on = (fn) => {
    listeners.push(fn);
    return () => listeners.splice(listeners.indexOf(fn) >>> 0, 1);
  };

  /* The engine reads its saved film before this file loads, when it can't yet read lanes of yours, so it leaves
     their nodes out. If the saved film has nodes of yours the engine is missing, read it again now. */
  function rescue() {
    const E = root.CurioEngine;
    if (!E || typeof E.load !== "function" || !E.KEY) return false;
    let saved = null;
    try {
      saved = JSON.parse(root.localStorage.getItem(E.KEY));
    } catch (e) {
      saved = null;
    }
    const count = (st) => {
      let n = 0;
      if (st && isObj(st.lanes)) Object.keys(st.lanes).forEach((lk) => isMine(baseOf(lk.split("|")[1])) && known(lk.split("|")[1]) && (n += Object.keys((st.lanes[lk] && st.lanes[lk].points) || {}).length));
      if (st && Array.isArray(st.links)) st.links.forEach((l) => l && l.from && l.to && (isMine(baseOf(l.from.curiosity)) || isMine(baseOf(l.to.curiosity))) && n++);
      return n;
    };
    if (!saved || !saved.state || count(saved.state) <= count(E.state())) return false;
    E.load({ keepHistory: true });
    return true;
  }
  let started = false;
  function start() {
    if (started) return;
    started = true;
    const p = store();
    install(p.view());
    rescue();
  }

  root.CurioMine = {
    KEY,
    PREFIX,
    FORMAT,
    CUES,
    CHANGES,
    isMine,
    slug,
    clean,
    parseSteps,
    cleanScale,
    scaleWords,
    sliderIds,
    newId,
    sentence,
    rows,
    install,
    domain,
    known,
    exportJson,
    importJson,
    store,
    on,
    start,
    rescue,
    data: () => clone(data),
    get: (level, id) => {
      const k = LEVELS[level];
      const it = k ? data[k].find((x) => x.id === id) : null;
      return it ? clone(it) : null;
    },
  };
  if (typeof module !== "undefined" && module.exports) module.exports = root.CurioMine;
  /* In the page: read what you saved and register it before the Screen draws. */
  if (typeof document !== "undefined" && root.CuriosityDB && root.CurioScale && root.document === document) start();
})();
