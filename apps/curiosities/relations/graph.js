/* relations/graph.js: the relationship map's database. Builds one graph from the curiosity database
   (window.CuriosityDB, or its JSON in Node) plus the archive (relations/archive.js): every curiosity, feeling,
   movement, character trait and figure is a node, and every direct tie between two of them is an edge.

   Edge types (what the line between two nodes means):
     leads    a proximity: when A happens, B follows (A -> B)
     suite    A and B are looked through together in a suite
     shows    a movement shows a feeling
     feels    a trait carries a feeling
     reacts   a trait reacts to a figure (suspicious of authority -> authority figure)
     moves    a trait shows in a movement
     film     an archive item is made on screen with this curiosity
     word     a feeling is one of the words on the database's Emotion curiosity
     mine     a tie the user drew on the map (A leads to B)

   CurioRelations.build(data, archive, mine) returns { nodes, byId, edges, links(id), families }.
   Node families are the six slabs of the cube and the six columns of the flat matrix. */
(function (root) {
  const FAMILIES = [
    { id: "character", label: "Character", kinds: ["trait", "figure"], workspaces: ["archetype", "mindset", "herd", "arc", "plot"] },
    { id: "feeling", label: "Feeling", kinds: ["emotion"], workspaces: ["emotion", "emo-road", "comedy", "comedy-mix"] },
    { id: "body", label: "Body & movement", kinds: ["movement"], workspaces: ["character-motion", "movement-lines", "placement", "background", "wardrobe"] },
    { id: "look", label: "Camera & look", kinds: [], workspaces: ["camera-angle", "camera-motion", "focus", "light", "color", "grade", "set", "effects", "layers", "canvas"] },
    { id: "sound", label: "Sound & words", kinds: [], workspaces: ["lines", "music", "audio-mix", "titles"] },
    { id: "story", label: "Story & cut", kinds: [], workspaces: ["structure", "transitions", "speed", "page"] },
  ];
  const KIND_LABEL = { mine: "Made by you", trait: "Character traits", figure: "People they react to", emotion: "Feelings", movement: "Movements & stillness" };
  const TYPES = {
    leads: { label: "Leads to", back: "Follows from" },
    suite: { label: "Together in a suite", back: "Together in a suite" },
    shows: { label: "Shows the feeling", back: "Shown by the movement" },
    feels: { label: "Feels", back: "Felt by the trait" },
    reacts: { label: "Reacts to", back: "Sets off the trait" },
    moves: { label: "Moves like this", back: "Shown by the trait" },
    film: { label: "Made on screen with", back: "Used for" },
    word: { label: "A word on", back: "Has the word" },
    mine: { label: "Your tie: leads to", back: "Your tie: follows from" },
  };
  const SUITE_CAP = 12; // a suite bigger than this is a whole look, not a direct tie between its members

  /* A workspace the map has not met yet goes where its name points; the rest go to Story & cut. */
  function familyOf(ws, label) {
    const f = FAMILIES.find((f) => f.workspaces.includes(ws));
    if (f) return f.id;
    const t = (ws + " " + (label || "")).toLowerCase();
    if (/charact|relation|person|people|belong|archetyp|enneagram|herd|mind|arc\b/.test(t)) return "character";
    if (/emo|feel|comed|mood/.test(t)) return "feeling";
    if (/body|move|motion|gesture|pose|wardrobe|act/.test(t)) return "body";
    if (/camera|light|color|colour|look|set|lens|focus|frame/.test(t)) return "look";
    if (/sound|music|line|word|voice|audio|dialog|title/.test(t)) return "sound";
    return "story";
  }

  /* mine: { nodes: [{ id: "mine-...", label, family }], ties: [{ a, b }] }, what the user added on the map. */
  function build(data, archive, mine) {
    const nodes = [];
    const byId = new Map();
    const wsLabel = new Map((data.workspaces || []).map((w) => [w.id, w.label]));
    const add = (n) => {
      if (byId.has(n.id)) return byId.get(n.id);
      nodes.push(n);
      byId.set(n.id, n);
      return n;
    };
    (data.curiosities || []).forEach((c) =>
      add({ id: c.id, label: c.label, plain: c.plain || "", kind: "curiosity", group: c.workspace, groupLabel: wsLabel.get(c.workspace) || c.workspace, family: (mine && mine.place && mine.place[c.id]) || familyOf(c.workspace, wsLabel.get(c.workspace)), mine: /^my-/.test(c.id) })
    );
    // Feelings the database already has stay as those curiosities; the rest are new nodes.
    const alias = new Map();
    const A = archive || { emotions: [], movements: [], traits: [], figures: [] };
    A.emotions.forEach((e) => {
      if (e.db && byId.has(e.db)) {
        alias.set(e.id, e.db);
        byId.get(e.db).feeling = true;
      } else add({ id: e.id, label: e.label, plain: e.plain, kind: "emotion", group: "kind:emotion", groupLabel: KIND_LABEL.emotion, family: "feeling" });
    });
    const real = (id) => alias.get(id) || id;
    A.movements.forEach((m) => add({ id: m.id, label: m.label, plain: m.plain, kind: "movement", group: "kind:movement", groupLabel: KIND_LABEL.movement, family: "body", part: m.group, still: !!m.still }));
    A.traits.forEach((t) => add({ id: t.id, label: t.label, plain: t.plain, kind: "trait", group: "kind:trait", groupLabel: KIND_LABEL.trait, family: "character" }));
    A.figures.forEach((f) => add({ id: f.id, label: f.label, plain: f.plain, kind: "figure", group: "kind:figure", groupLabel: KIND_LABEL.figure, family: "character" }));

    const M = mine || { nodes: [], ties: [] };
    (M.nodes || []).forEach((n) => add({ id: n.id, label: n.label, plain: n.plain || "Made by you on the map.", kind: "mine", group: "kind:mine", groupLabel: KIND_LABEL.mine, family: FAMILIES.some((f) => f.id === n.family) ? n.family : "story" }));

    const edges = [];
    const seen = new Map();
    const missing = [];
    function edge(a, b, type, why, pid) {
      a = real(a);
      b = real(b);
      if (a === b) return;
      if (!byId.has(a) || !byId.has(b)) return missing.push(`${type}: ${a} -> ${b}`);
      const key = type === "suite" ? [a, b].sort().join("|") + "|suite" : `${a}|${b}|${type}`;
      const old = seen.get(key);
      if (old) {
        if (why && old.why.length < 3 && !old.why.includes(why)) old.why.push(why);
        else if (why && !old.why.includes(why)) old.more = (old.more || 0) + 1;
        return;
      }
      const e = { a, b, type, why: why ? [why] : [] };
      if (pid) e.pid = pid; // a proximity the user made in the app (CurioMine), so the map can take it away again
      seen.set(key, e);
      edges.push(e);
    }

    (data.proximities || []).forEach((p) => {
      if (p.when && p.then && p.when.curiosity && p.then.curiosity) edge(p.when.curiosity, p.then.curiosity, "leads", p.label, /^my-/.test(p.id) ? p.id : "");
    });
    (data.suites || []).forEach((s) => {
      const ids = [...new Set((s.members || []).map((m) => m.curiosity).filter(Boolean))];
      if (ids.length < 2 || ids.length > SUITE_CAP) return;
      for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) edge(ids[i], ids[j], "suite", s.label);
    });
    A.emotions.forEach((e) => e.scale && edge(e.id, "emotion", "word", `"${e.scale}"`));
    A.movements.forEach((m) => {
      m.emotions.forEach((e) => edge(m.id, e, "shows"));
      m.curiosities.forEach((c) => edge(m.id, c, "film"));
    });
    A.figures.forEach((f) => f.curiosities.forEach((c) => edge(f.id, c, "film")));
    A.traits.forEach((t) => {
      t.emotions.forEach((e) => edge(t.id, e, "feels"));
      t.figures.forEach((f) => edge(t.id, f, "reacts"));
      t.movements.forEach((m) => edge(t.id, m, "moves"));
      t.curiosities.forEach((c) => edge(t.id, c, "film"));
    });

    (M.ties || []).forEach((t) => edge(t.a, t.b, "mine"));

    const adj = new Map(nodes.map((n) => [n.id, []]));
    edges.forEach((e) => {
      adj.get(e.a).push({ id: e.b, edge: e, out: true });
      adj.get(e.b).push({ id: e.a, edge: e, out: false });
    });
    nodes.forEach((n) => (n.degree = adj.get(n.id).length));
    return { nodes, byId, edges, missing, links: (id) => adj.get(real(id)) || [], real, families: FAMILIES, types: TYPES };
  }

  /* Read the database the app has loaded: CuriosityDB keeps the four levels in arrays on .data. */
  function fromDB(DB) {
    const d = DB && DB.data ? DB.data : DB;
    return { workspaces: d.workspaces || [], curiosities: d.curiosities || [], suites: d.suites || [], proximities: d.proximities || [] };
  }

  const api = { build, fromDB, FAMILIES, TYPES, KIND_LABEL, familyOf };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.CurioGraph = api;
})(typeof window !== "undefined" ? window : globalThis);
