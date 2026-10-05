/* Scene inspiration search: the logic with no page (the hub in hub.js draws it).
   Hub.create({ scenes, curiosities, suites, workspaces }) returns a searcher. A filter is one of
   { topic }, { curiosity }, { curiosity, value }, { curiosity, rate }, { suite }, { feeling }, { kind }, { text };
   a scene must pass every filter, so each one added makes the list smaller. */
(function (root) {
  /* The big curiosity topics on the left, as groups of database workspaces. */
  const TOPICS = [
    { id: "camera", label: "Camera", ws: ["camera-angle", "camera-motion", "placement"] },
    { id: "feeling", label: "Feeling", ws: ["emotion", "emo-road"] },
    { id: "comedy", label: "Comedy", ws: ["comedy", "comedy-mix"] },
    { id: "look", label: "Look and light", ws: ["light", "color", "set", "effects", "grade", "wardrobe"] },
    { id: "people", label: "People and lines", ws: ["character-motion", "lines", "movement-lines", "background"] },
    { id: "sound", label: "Sound and music", ws: ["music", "audio-mix"] },
    { id: "story", label: "Story", ws: ["arc", "plot", "mindset", "focus", "archetype", "herd", "structure"] },
    { id: "edit", label: "Edit and pace", ws: ["page", "transitions", "titles", "speed", "layers", "canvas"] },
  ];
  /* A few curiosities belong with a different topic than their workspace in this view. */
  const TOPIC_OF = { emotion: "feeling", tensionCurve: "feeling", "setting.place": "look", cutRate: "edit", shotDuration: "edit" };
  /* How fast a curiosity changes through a scene, slowest first. */
  const RATES = [
    { id: "holds", label: "holds still" },
    { id: "drifts", label: "drifts a little" },
    { id: "steps", label: "steps" },
    { id: "snaps", label: "snaps or jumps" },
  ];
  const KINDS = ["film", "tv", "anime", "game", "novel", "short story", "essay", "poem", "my clip"];
  /* Written sources open as reading, not watching. */
  const WRITTEN = ["novel", "short story", "essay", "poem"];
  const WATCH = {
    youtube: { label: "YouTube", url: (q) => "https://www.youtube.com/results?search_query=" + encodeURIComponent(q) },
    vimeo: { label: "Vimeo", url: (q) => "https://vimeo.com/search?q=" + encodeURIComponent(q) },
    dailymotion: { label: "Dailymotion", url: (q) => "https://www.dailymotion.com/search/" + encodeURIComponent(q) },
    google: { label: "Any site (Google videos)", url: (q) => "https://www.google.com/search?tbm=vid&q=" + encodeURIComponent(q) },
  };
  const READ = { label: "Project Gutenberg", url: (q) => "https://www.gutenberg.org/ebooks/search/?query=" + encodeURIComponent(q) };

  function create(src) {
    const scenes = (src.scenes || []).slice();
    const cur = {};
    (src.curiosities || []).forEach((c) => (cur[c.id] = c));
    const suites = src.suites || [];

    function sliderOf(key) {
      const [cid, sid] = key.split(".");
      const c = cur[cid];
      if (!c) return null;
      return (c.sliders || []).find((s) => s.id === (sid || c.main)) || null;
    }
    function label(key) {
      const [cid, sid] = key.split(".");
      const c = cur[cid];
      if (!c) return key;
      const s = sliderOf(key);
      return sid && s ? c.label + ": " + s.label : c.label;
    }
    function topicOf(key) {
      if (TOPIC_OF[key]) return TOPIC_OF[key];
      const c = cur[key.split(".")[0]];
      const t = c && TOPICS.find((t) => t.ws.includes(c.workspace));
      return t ? t.id : "story";
    }
    /* The keys a scene uses, and the values each one passes through, in order. */
    function track(scene, key) {
      const out = [];
      scene.beats.forEach((b) => {
        const v = b.values[key];
        if (v !== undefined && (!out.length || out[out.length - 1].v !== v)) out.push({ at: b.at, v });
      });
      return out;
    }
    function keys(scene) {
      if (!scene._keys) {
        const k = new Set();
        scene.beats.forEach((b) => Object.keys(b.values).forEach((x) => k.add(x)));
        Object.defineProperty(scene, "_keys", { value: Array.from(k), enumerable: false, configurable: true });
      }
      return scene._keys;
    }
    function pos(key, v) {
      const s = sliderOf(key);
      if (s && s.scale) return s.scale.length > 1 ? s.scale.indexOf(v) / (s.scale.length - 1) : 0;
      if (s && s.range && typeof v === "number") return (v - s.range.min) / (s.range.max - s.range.min || 1);
      return 0;
    }
    /* holds / drifts / steps / snaps: the biggest single jump, as a share of the curiosity's scale. */
    function rate(scene, key) {
      const t = track(scene, key);
      if (t.length < 2) return "holds";
      let big = 0;
      for (let i = 1; i < t.length; i++) big = Math.max(big, Math.abs(pos(key, t[i].v) - pos(key, t[i - 1].v)));
      return big <= 0.01 ? "drifts" : big <= 0.34 ? "drifts" : big < 0.6 ? "steps" : "snaps";
    }
    /* Changes per minute, for the details. */
    function perMinute(scene, key) {
      const t = track(scene, key);
      const last = scene.beats[scene.beats.length - 1].at || 0;
      const span = Math.max(30, last + 30);
      return Math.round(((t.length - 1) / span) * 60 * 10) / 10;
    }
    /* A suite shows in a scene when at least half its members (by weight) match in one beat. */
    function suiteShare(suite, values) {
      let total = 0;
      let hit = 0;
      (suite.members || []).forEach((m) => {
        const w = m.weight == null ? 100 : m.weight;
        total += w;
        const c = cur[m.curiosity];
        const key = m.slider && c && m.slider !== c.main ? m.curiosity + "." + m.slider : m.curiosity;
        const v = values[key];
        if (v === undefined) return;
        if (m.value !== undefined && m.value === v) hit += w;
        else if (m.value === undefined && m.from !== undefined) {
          const a = pos(key, m.from);
          const b = pos(key, m.to);
          const p = pos(key, v);
          if (p >= Math.min(a, b) - 1e-9 && p <= Math.max(a, b) + 1e-9) hit += w;
        }
      });
      return total ? hit / total : 0;
    }
    function suitesFor(scene) {
      if (!scene._suites) {
        const out = [];
        suites.forEach((s) => {
          if (!(s.members || []).length) return;
          let best = 0;
          scene.beats.forEach((b) => (best = Math.max(best, suiteShare(s, b.values))));
          if (best >= 0.5) out.push({ id: s.id, label: s.label, share: best });
        });
        out.sort((a, b) => b.share - a.share);
        Object.defineProperty(scene, "_suites", { value: out, enumerable: false, configurable: true });
      }
      return scene._suites;
    }
    function text(scene) {
      return (scene.work + " " + (scene.author || "") + " " + scene.year + " " + scene.moment + " " + scene.feelings.join(" ") + " " + (scene.movements || []).join(" ") + " " + scene.kind).toLowerCase();
    }
    function passes(scene, f) {
      if (f.text) return f.text.toLowerCase().split(/\s+/).filter(Boolean).every((w) => text(scene).includes(w));
      if (f.kind) return scene.kind === f.kind;
      if (f.feeling) return scene.feelings.includes(f.feeling);
      if (f.movement) return (scene.movements || []).includes(f.movement) || (scene.archive || []).includes(f.movement);
      if (f.suite) return suitesFor(scene).some((s) => s.id === f.suite);
      if (f.topic) return keys(scene).some((k) => topicOf(k) === f.topic);
      if (f.curiosity) {
        if (!keys(scene).includes(f.curiosity)) return false;
        if (f.value !== undefined && !track(scene, f.curiosity).some((x) => String(x.v) === String(f.value))) return false;
        if (f.rate && rate(scene, f.curiosity) !== f.rate) return false;
        return true;
      }
      return true;
    }
    function results(filters) {
      return scenes.filter((s) => (filters || []).every((f) => passes(s, f)));
    }
    function count(list, fn) {
      const m = new Map();
      list.forEach((s) => fn(s).forEach((k) => m.set(k, (m.get(k) || 0) + 1)));
      return m;
    }
    /* The left column: every topic with how many of the current results use it. */
    function topics(filters) {
      const list = results(filters);
      const m = count(list, (s) => Array.from(new Set(keys(s).map(topicOf))));
      return TOPICS.map((t) => ({ id: t.id, label: t.label, count: m.get(t.id) || 0 })).filter((t) => t.count);
    }
    /* The next column: the curiosities of one topic the current results use. */
    function curiosities(topic, filters) {
      const list = results(filters);
      const m = count(list, (s) => keys(s).filter((k) => topicOf(k) === topic));
      return Array.from(m, ([id, n]) => ({ id, label: label(id), count: n })).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
    }
    /* Every suite seen in the current results (for ALL). */
    function suiteList(filters) {
      const list = results(filters);
      const m = count(list, (s) => suitesFor(s).map((x) => x.id));
      const byId = {};
      suites.forEach((s) => (byId[s.id] = s));
      return Array.from(m, ([id, n]) => ({ id, label: byId[id].label, count: n })).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
    }
    /* The values one curiosity takes in the current results, in scale order. */
    function values(key, filters) {
      const list = results(filters);
      const m = count(list, (s) => Array.from(new Set(track(s, key).map((x) => String(x.v)))));
      const s = sliderOf(key);
      const order = s && s.scale ? s.scale.map(String) : Array.from(m.keys()).sort((a, b) => Number(a) - Number(b));
      return order.filter((v) => m.has(v)).map((v) => ({ value: v, count: m.get(v) }));
    }
    function rates(key, filters) {
      const list = results(filters).filter((s) => keys(s).includes(key));
      const m = count(list, (s) => [rate(s, key)]);
      return RATES.filter((r) => m.has(r.id)).map((r) => ({ id: r.id, label: r.label, count: m.get(r.id) }));
    }
    function feelings(filters) {
      const m = count(results(filters), (s) => s.feelings);
      return Array.from(m, ([id, n]) => ({ id, count: n })).sort((a, b) => b.count - a.count || a.id.localeCompare(b.id));
    }
    /* Movement words (from written sources and logged clips), for the Movements column. */
    function movements(filters) {
      const m = count(results(filters), (s) => s.movements || []);
      return Array.from(m, ([id, n]) => ({ id, count: n })).sort((a, b) => b.count - a.count || a.id.localeCompare(b.id));
    }
    /* Where Watch (or Read, for writing) goes for a scene. */
    function watchUrl(scene, pref) {
      return (isWritten(scene) ? READ : WATCH[pref] || WATCH.youtube).url(scene.search);
    }
    function kinds(filters) {
      const m = count(results(filters), (s) => [s.kind]);
      return KINDS.filter((k) => m.has(k)).map((k) => ({ id: k, count: m.get(k) }));
    }
    /* Each curiosity of a scene: where it starts, where it ends, how fast it moves. */
    function details(scene) {
      return keys(scene).map((k) => {
        const t = track(scene, k);
        return { key: k, label: label(k), topic: topicOf(k), path: t.map((x) => x.v), rate: rate(scene, k), perMinute: scene.unit === "percent" ? 0 : perMinute(scene, k) };
      });
    }
    /* A scene as a curated film, so the Prism can split it and the user can borrow its curiosities. */
    function toStudy(scene) {
      return {
        id: "inspire-" + scene.id,
        title: scene.work + " (" + scene.year + "): " + scene.moment,
        kind: scene.kind === "game" ? "game" : "film",
        author: scene.author || undefined,
        camera: scene.kind === "game" ? "player" : "authored",
        source: "scene inspiration",
        note: "Only the scene's shared curiosities, as first guesses. Watch it: " + scene.search,
        beats: scene.beats.map((b, i) => ({ id: scene.id + "-" + (i + 1), at: String(b.at), note: "", values: Object.assign({}, b.values) })),
      };
    }
    /* A clip someone logged after watching it: the same shape as a built-in scene. */
    function logClip(c) {
      const work = String(c.work || "My clip").trim();
      const moment = String(c.moment || "").trim();
      let carry = {};
      return {
        id: "clip-" + (work + "-" + moment).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50),
        work,
        year: c.year || "",
        kind: c.kind || "my clip",
        moment,
        feelings: (c.feelings || []).filter(Boolean),
        search: c.search || (work + " " + moment).trim(),
        logged: true,
        beats: (c.beats || []).map((b) => ((carry = Object.assign({}, carry, b.values)), { at: Number(b.at) || 0, values: carry })),
      };
    }
    function add(scene) {
      const i = scenes.findIndex((s) => s.id === scene.id);
      if (i >= 0) scenes[i] = scene;
      else scenes.push(scene);
      return scene;
    }
    function remove(id) {
      const i = scenes.findIndex((s) => s.id === id);
      if (i >= 0) scenes.splice(i, 1);
    }
    return { TOPICS, RATES, WATCH, READ, KINDS, isWritten, movements, watchUrl, scenes, results, topics, curiosities, suiteList, values, rates, feelings, kinds, details, rate, suitesFor, toStudy, logClip, add, remove, label, sliderOf, topicOf };
  }

  const isWritten = (scene) => WRITTEN.includes(scene.kind);
  const api = { create, TOPICS, RATES, WATCH, READ, KINDS, WRITTEN, isWritten };
  root.CurioInspireSearch = api;
  if (typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
