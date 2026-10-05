/* relations/relations.js: the relationship map. Every curiosity, feeling, movement, character trait and the people
   traits react to, shown two ways:

   - Cube matrix: every item is one small 3D cube; the cubes stand in slabs (one per column: the six groups, or a
     slab per workspace) stacked into one block. Drag turns it 360 degrees, click selects (lines run to every tie),
     double-click zooms in and again goes further, like a map; inside, dragging looks around you.
   - Cube slices: the same block face on; swipe right sends the front slab to the back, swipe left brings the back
     one to the front, and a slab's name brings that face forward.
   - Lanes in depth: the film's automation lanes as 3D ribbons, the one that moves most at the back.
   - Lanes, swipe: the same, and swiping sends lanes front to back.
   - Flat list: six columns split by workspace.
   - Your own: Add a curiosity, and Tie to… draws a line from one thing to another. Kept on this device in localStorage "curio-relations-v1".
   - Movement archive: a pop-up of what bodies do, or stop doing, for each feeling. Pick a feeling to see its
     movements, or pick movements to see which feelings they describe, then show them on the map.

   CurioRelations.mount(el, { db, archive }) draws it into el. db defaults to window.CuriosityDB (so user-made
   curiosities appear too), then to window.CURIO_RELATIONS_SNAPSHOT (relations/snapshot.js, for the standalone
   page). CurioRelations.open() shows it full-page over the app. Needs three.js (global THREE) for the cube only;
   loads it from cdnjs on first use when it is missing. Picked movements are kept in localStorage
   "curio-relations-v1". */
(function (root) {
  const KEY = "curio-relations-v1";
  const THREE_URL = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
  const FAMILY_COLOR = { character: "#b04a7a", feeling: "#c45c26", body: "#2f8a57", look: "#2d6fb8", sound: "#8a5bd0", story: "#8a7a2d" };
  const TYPE_COLOR = { mine: "#1c1712", leads: "#c45c26", suite: "#2d6fb8", shows: "#d13b3b", feels: "#b04a7a", reacts: "#7a3fb0", moves: "#2f8a57", film: "#8a7a2d", word: "#6b5f52" };
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

  function load() {
    try {
      return JSON.parse(localStorage.getItem(KEY)) || {};
    } catch (e) {
      return {};
    }
  }
  function save(s) {
    try {
      localStorage.setItem(KEY, JSON.stringify(s));
    } catch (e) {}
  }

  function loadThree() {
    if (root.THREE) return Promise.resolve(true);
    return new Promise((res) => {
      const s = document.createElement("script");
      s.src = THREE_URL;
      s.onload = () => res(!!root.THREE);
      s.onerror = () => res(false);
      document.head.appendChild(s);
    });
  }

  const VIEWS = ["cube", "slices", "graph", "lanes", "story", "tracks", "flat"];
  // what to do, in words, under each view
  const UNDER = {
    cube: "Click and drag to look around · double-click a cube to fly closer, and again to go inside · Slide the corridor to move down the gap between two faces",
    slices: "Click and drag to turn it · swipe right or left to move the slabs · double-click to zoom in",
    graph: "Click a node to light its lines · click a slice of the pie to light that group",
    lanes: "Click and drag to turn · swipe right or left to shuffle the lanes like cards · click a lane (or its name) to bring it to the front",
    story: "Each card is one moment; the big box is what holds front and center then · click a box to select it",
    tracks: "▸ opens a suite to show its parts · ⚙ adjusts and records the parts without opening it",
    flat: "Click any name to see what it is tied to",
  };
  function mount(el, opts) {
    opts = opts || {};
    const G = root.CurioGraph;
    const A = opts.archive || root.CurioArchive;
    const db = opts.db || (root.CuriosityDB && root.CuriosityDB.data ? root.CuriosityDB : root.CURIO_RELATIONS_SNAPSHOT);
    if (!G || !A || !db) {
      el.innerHTML = '<p class="rl-note">The relationship map needs the curiosity database and relations/archive.js loaded first.</p>';
      return null;
    }
    const saved = load();
    const st = {
      view: "cube", // the Cube matrix is always the first thing you see
      sel: [],
      picked: saved.picked || [],
      mine: { nodes: (saved.mine && saved.mine.nodes) || [], ties: (saved.mine && saved.mine.ties) || [] },
      slabBy: saved.slabBy === "workspace" ? "workspace" : "family",
      cat: saved.cat || "all", // which curiosity category every view shows ("all", "fam:<family>" or "ws:<group>")
      rec: saved.rec || {}, // recorded or adjusted lane values, id -> one value per moment
      open: saved.open || [], // suites opened on the Tracks view
      camera: null, // each visit starts at the corridor; the camera is kept only while switching views
      tieFrom: "",
      adding: false,
      showAll: !!saved.showAll,
    };
    /* Inside the app, what the user adds goes into the curiosity database as their own ("my-") curiosities and
       proximities through CurioMine (screen/mine.js), so it can be automated, saved in project files and undone
       like everything else. Ties to archive items (movements, feelings, traits), and everything on the standalone
       page, stay in this map's own storage. */
    const Mine = db === root.CuriosityDB && root.CurioMine && typeof root.CurioMine.store === "function" ? root.CurioMine : null;
    const mineStore = () => {
      try {
        return Mine.store();
      } catch (e) {
        return null;
      }
    };
    st.mine.place = st.mine.place || saved.place || {};
    function buildGraph() {
      const data = G.fromDB(db);
      const out = G.build(data, A, st.mine);
      out.suites = data.suites || [];
      out.proximities = data.proximities || [];
      return out;
    }
    let g = buildGraph();
    st.picked = st.picked.filter((id) => g.byId.has(id));
    const persist = () => save({ view: st.view, picked: st.picked, mine: st.mine, place: st.mine.place, slabBy: st.slabBy, showAll: st.showAll, cat: st.cat, rec: st.rec, open: st.open });
    /* After the user adds or removes something: build the graph again and redraw, keeping the camera. */
    function rebuild() {
      g = buildGraph();
      api.graph = g;
      persist();
      st.sel = st.sel.filter((id) => g.byId.has(id));
      setView(st.view);
      drawSide();
    }

    el.classList.add("rl");
    el.innerHTML = `
      <div class="rl-bar">
        <div class="rl-seg" role="group" aria-label="View">
          <button data-view="cube">Cube matrix</button><button data-view="slices">Cube slices</button><button data-view="graph">Graph &amp; pie</button><button data-view="lanes">3D graph</button><button data-view="story">Storyboard</button><button data-view="tracks">Tracks</button><button data-view="flat">Flat list</button>
        </div>
        <select class="rl-cat" aria-label="Category"></select>
        <div class="rl-find"><input type="search" placeholder="Find a curiosity, feeling or movement" aria-label="Find"><div class="rl-hits"></div></div>
        <button data-act="archive">Movement archive</button>
        <button data-act="add">Add a curiosity</button>
        <button data-act="clear">Clear selection</button>
      </div>
      <div class="rl-grid">
        <div class="rl-stage"></div>
        <aside class="rl-side"></aside>
        <p class="rl-under"></p>
      </div>`;
    const stage = el.querySelector(".rl-stage");
    const side = el.querySelector(".rl-side");
    const findIn = el.querySelector(".rl-find input");
    const hits = el.querySelector(".rl-hits");

    /* ---------- selection ---------- */
    function nearSet() {
      const near = new Map();
      st.sel.forEach((id) => g.links(id).forEach((l) => near.has(l.id) || near.set(l.id, l)));
      st.sel.forEach((id) => near.delete(id));
      return near;
    }
    /* A tie between two database curiosities becomes one of the user's own proximities in the app. */
    const isDbNode = (id) => {
      const n = g.byId.get(id);
      return !!n && n.kind === "curiosity";
    };
    function addProximity(a, b) {
      const store = Mine && isDbNode(a) && isDbNode(b) && mineStore();
      if (!store) return false;
      const A1 = g.byId.get(a).label;
      const B1 = g.byId.get(b).label;
      const id = Mine.newId("when " + A1 + " then " + B1, store.view());
      const r = store.send({ type: "put", level: "proximity", label: "Tie on the relationship map", item: { id, label: `When ${A1} changes, ${B1} follows`, plain: "Drawn on the relationship map.", when: { curiosity: a, change: "changes" }, then: { curiosity: b, change: "changes" }, within: 2 } });
      return !!(r && r.ok);
    }
    function addCuriosity(name, plain, family) {
      const store = Mine && mineStore();
      if (!store) return "";
      const id = Mine.newId(name, store.view());
      const cats = (root.CurioLevels && root.CurioLevels.CATEGORIES) || [];
      const cat = (cats.find((c) => (c.workspaces || []).some((w) => G.familyOf(w) === family)) || {}).id;
      const r = store.send({ type: "put", level: "curiosity", label: "Add " + name, item: { id, label: name, plain, cat, push: 2, scale: { kind: "steps", steps: ["off", "a little", "a lot"] }, extras: [] } });
      return r && r.ok ? id : "";
    }
    function select(ids) {
      // Drawing a tie: the next thing clicked is what the first one leads to.
      if (st.tieFrom && ids && !Array.isArray(ids) && g.real(ids) !== st.tieFrom && g.byId.has(g.real(ids))) {
        const a = st.tieFrom;
        const b = g.real(ids);
        st.tieFrom = "";
        if (!addProximity(a, b) && !st.mine.ties.some((t) => t.a === a && t.b === b)) st.mine.ties.push({ a, b });
        st.sel = [a];
        return rebuild();
      }
      st.tieFrom = "";
      st.sel = (Array.isArray(ids) ? ids : ids ? [ids] : []).map(g.real).filter((id) => g.byId.has(id));
      drawSide();
      view && view.update();
    }

    /* ---------- side panel ---------- */
    function linkGroups(id) {
      const groups = new Map();
      g.links(id).forEach((l) => {
        const t = g.types[l.edge.type];
        const name = l.out ? t.label : t.back;
        const k = l.edge.type + (l.out ? ">" : "<");
        if (!groups.has(k)) groups.set(k, { name, type: l.edge.type, items: [] });
        groups.get(k).items.push(l);
      });
      return [...groups.values()];
    }
    function readsAs(ids) {
      const score = new Map();
      ids.forEach((id) =>
        g.links(id).forEach((l) => {
          if (l.edge.type !== "shows" && l.edge.type !== "feels") return;
          const m = g.byId.get(l.id);
          if (!m || !(m.kind === "emotion" || m.feeling)) return;
          score.set(l.id, (score.get(l.id) || 0) + 1);
        })
      );
      return [...score.entries()].sort((a, b) => b[1] - a[1]);
    }
    function drawSide() {
      if (st.adding) {
        const near = st.sel.length === 1 ? g.byId.get(st.sel[0]) : null;
        side.innerHTML = `<h2>Add a curiosity</h2>
          <p>Name it, pick where it lives, and it joins the map${near ? ` tied to <b>${esc(near.label)}</b>` : ""}. Then use Tie to draw more lines from it.</p>
          <form class="rl-form">
            <label for="rl-new-name">Name</label><input id="rl-new-name" required maxlength="60" placeholder="Distrust of doctors">
            <label for="rl-new-plain">What it means (optional)</label><input id="rl-new-plain" maxlength="200">
            <label for="rl-new-family">Lives in</label><select id="rl-new-family">${g.families.map((f) => `<option value="${f.id}"${near && near.family === f.id ? " selected" : ""}>${esc(f.label)}</option>`).join("")}</select>
            <div class="rl-actions"><button type="submit">Add it</button><button type="button" data-act="cancel">Cancel</button></div>
          </form>`;
        side.querySelector("input").focus();
        return;
      }
      if (st.tieFrom) {
        side.innerHTML = `<h2>Draw a tie</h2><p>Click what <b>${esc(g.byId.get(st.tieFrom).label)}</b> leads to, in any view or in Find.</p><div class="rl-actions"><button data-act="cancel">Cancel</button></div>`;
        return;
      }
      if (!st.sel.length) {
        side.innerHTML = `<h2>Relationship map</h2>
          <p>${g.nodes.length} curiosities, feelings, movements, traits and people, with ${g.edges.length.toLocaleString()} direct ties between them.</p>
          <p>Click any one to see lines to everything it is directly tied to. Try <button class="rl-try" data-id="tr-suspicious-authority">Suspicious of authority</button>.</p>
          <p>In the 3D cube, drag to spin, double-click to fly closer (again to go further in), and once inside, drag to look around. Layers stack flat grids: swipe to move through them.</p>
          <p>Add your own with Add a curiosity, and draw new lines with Tie to….</p>
          <div class="rl-sub">Colors</div>
          <div class="rl-legend">${g.families.map((f) => `<span style="--c:${FAMILY_COLOR[f.id]}">${esc(f.label)}</span>`).join("")}</div>
          <div class="rl-sub">Lines</div>
          <div class="rl-legend">${Object.keys(g.types).map((t) => `<span style="--c:${TYPE_COLOR[t]}">${esc(g.types[t].label)}</span>`).join("")}</div>`;
        return;
      }
      if (st.sel.length > 1) {
        const reads = readsAs(st.sel);
        side.innerHTML = `<h2>${st.sel.length} picked</h2>
          <div class="rl-links">${st.sel.map((id) => linkBtn(id, "", "#1c1712")).join("")}</div>
          <div class="rl-sub">Reads as</div>
          <div class="rl-links">${reads.slice(0, 8).map(([id, n]) => linkBtn(id, n + " of " + st.sel.length, TYPE_COLOR.shows)).join("") || "<p>No feelings tied to these yet.</p>"}</div>
          <div class="rl-actions"><button data-act="archive">Change in the archive</button></div>`;
        return;
      }
      const n = g.byId.get(st.sel[0]);
      const fam = g.families.find((f) => f.id === n.family);
      const kind = n.kind === "curiosity" ? n.groupLabel : n.kind === "movement" ? (n.still ? "Stillness · " : "Movement · ") + n.part : n.groupLabel.replace(/s$/, "");
      const isFeeling = n.kind === "emotion" || n.feeling;
      side.innerHTML = `<div class="rl-tag" style="color:${FAMILY_COLOR[n.family]}">${esc(fam ? fam.label : "")}${kind && fam && kind !== fam.label ? " · " + esc(kind) : ""}</div>
        <h2>${esc(n.label)}</h2><p>${esc(n.plain)}</p>
        <div class="rl-actions">
          <button data-act="tie" data-id="${esc(n.id)}" title="Draw a line from this to anything else">Tie to…</button>
          ${n.kind === "mine" || (n.mine && Mine) ? `<button data-act="delnode" data-id="${esc(n.id)}">Remove this curiosity</button>` : ""}
          ${isFeeling ? `<button data-act="archive" data-feeling="${esc(n.id)}">Movements for this feeling</button>` : ""}
          ${n.kind === "movement" ? `<button data-act="pick" data-id="${esc(n.id)}">${st.picked.includes(n.id) ? "Unpick" : "Pick"} this movement</button>` : ""}
        </div>
        ${linkGroups(n.id)
          .map((gr) => `<div class="rl-sub"><i style="--c:${TYPE_COLOR[gr.type]}"></i>${esc(gr.name)} (${gr.items.length})</div>
            <div class="rl-links">${gr.items.map((l) => (l.edge.type === "mine" || (l.edge.pid && Mine) ? `<span class="rl-mine">${linkBtn(l.id, l.edge.pid ? "yours" : "", TYPE_COLOR[l.edge.type])}<button data-act="untie" data-a="${esc(l.edge.a)}" data-b="${esc(l.edge.b)}" data-pid="${esc(l.edge.pid || "")}" aria-label="Remove this tie" title="Remove this tie">×</button></span>` : "") || linkBtn(l.id, l.edge.type === "suite" || l.edge.type === "leads" ? l.edge.why[0] + (l.edge.why.length > 1 || l.edge.more ? " +" + (l.edge.why.length - 1 + (l.edge.more || 0)) : "") : "", TYPE_COLOR[gr.type])).join("")}</div>`)
          .join("") || "<p>Nothing is tied to this yet.</p>"}`;
    }
    function linkBtn(id, why, color) {
      const m = g.byId.get(id);
      return `<button data-id="${esc(id)}" style="--c:${color}" title="${esc(m.plain)}">${esc(m.label)}${why ? `<small>${esc(why)}</small>` : ""}</button>`;
    }
    side.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = side.querySelector("#rl-new-name").value.trim();
      if (!name) return;
      const near = st.sel.length === 1 ? st.sel[0] : "";
      const plain = side.querySelector("#rl-new-plain").value.trim();
      const family = side.querySelector("#rl-new-family").value;
      let id = addCuriosity(name, plain, family);
      if (id) {
        st.mine.place[id] = family;
        g = buildGraph(); // so the new curiosity counts as a database one for its first tie
        if (near && !addProximity(near, id)) st.mine.ties.push({ a: near, b: id });
      } else {
        id = "mine-" + name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
        while (g.byId.has(id)) id += "-2";
        st.mine.nodes.push({ id, label: name, plain, family });
        if (near) st.mine.ties.push({ a: near, b: id });
      }
      st.adding = false;
      st.sel = [id];
      rebuild();
    });
    side.addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      if (b.dataset.act === "archive") return openArchive(b.dataset.feeling);
      if (b.dataset.act === "cancel") {
        st.adding = false;
        st.tieFrom = "";
        return drawSide();
      }
      if (b.dataset.act === "tie") {
        st.tieFrom = b.dataset.id;
        return drawSide();
      }
      if (b.dataset.act === "untie") {
        const store = b.dataset.pid && mineStore();
        if (store) store.send({ type: "remove", level: "proximity", id: b.dataset.pid, label: "Remove a tie" });
        st.mine.ties = st.mine.ties.filter((t) => !(t.a === b.dataset.a && t.b === b.dataset.b));
        return rebuild();
      }
      if (b.dataset.act === "delnode") {
        const id = b.dataset.id;
        const store = /^my-/.test(id) && mineStore();
        if (store) {
          // its proximities go with it, so nothing is left pointing at a curiosity that is gone
          (store.view().proximities || []).filter((p) => p.when.curiosity === id || p.then.curiosity === id).forEach((p) => store.send({ type: "remove", level: "proximity", id: p.id }));
          store.send({ type: "remove", level: "curiosity", id, label: "Remove " + id });
          delete st.mine.place[id];
        }
        st.mine.nodes = st.mine.nodes.filter((n) => n.id !== id);
        st.mine.ties = st.mine.ties.filter((t) => t.a !== id && t.b !== id);
        st.sel = [];
        return rebuild();
      }
      if (b.dataset.act === "pick") {
        togglePick(b.dataset.id);
        return drawSide();
      }
      if (b.dataset.id) select(b.dataset.id);
    });

    /* ---------- search ---------- */
    findIn.addEventListener("input", () => {
      const q = findIn.value.trim().toLowerCase();
      if (!q) return hits.classList.remove("open");
      const found = g.nodes.filter((n) => n.label.toLowerCase().includes(q)).slice(0, 30);
      hits.innerHTML = found.map((n) => `<button data-id="${esc(n.id)}">${esc(n.label)}<small>${esc(n.groupLabel)}</small></button>`).join("") || "<p class='rl-note'>Nothing by that name.</p>";
      hits.classList.add("open");
    });
    findIn.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        const b = hits.querySelector("button[data-id]");
        b && b.click();
      }
      if (e.key === "Escape") hits.classList.remove("open");
    });
    hits.addEventListener("click", (e) => {
      const b = e.target.closest("button[data-id]");
      if (!b) return;
      hits.classList.remove("open");
      findIn.value = "";
      select(b.dataset.id);
      view && view.focus && view.focus(b.dataset.id);
    });
    el.querySelector(".rl-bar").addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      if (b.dataset.view) setView(b.dataset.view);
      if (b.dataset.act === "archive") openArchive();
      if (b.dataset.act === "clear") select([]);
      if (b.dataset.act === "add") {
        st.adding = true;
        drawSide();
      }
    });

    /* ---------- views ---------- */
    let view = null;
    // A view asks to be built again (the cube switched between six slabs and a slab per workspace).
    el.addEventListener("rl-rebuild", () => {
      view && view.destroy();
      view = null;
      st.camera = null; // the block changed size, so start from the whole-cube view
      setView(st.view);
    });
    function setView(v) {
      st.view = v;
      persist();
      el.querySelectorAll("[data-view]").forEach((b) => b.classList.toggle("on", b.dataset.view === v));
      el.querySelector(".rl-under").textContent = UNDER[v] || "";
      fillCats();
      view && view.destroy();
      stage.innerHTML = "";
      const keep = (st.camera = view && view.camera ? view.camera() || st.camera : st.camera);
      // every view shows the chosen category; the side panel and Find keep the whole map
      const gv = subGraph(g, st.cat);
      view =
        v === "cube" || v === "slices"
          ? cubeView(stage, gv, st, select, persist, keep, v === "slices")
          : v === "lanes"
          ? lanesView(stage, gv, st, select, persist, keep, true)
          : v === "graph"
          ? graphView(stage, gv, st, select)
          : v === "story"
          ? storyView(stage, gv, st, select)
          : v === "tracks"
          ? tracksView(stage, gv, st, select, persist)
          : flatView(stage, gv, st, select, nearSet);
      view.update();
    }

    /* The category picker: the whole map, one of the six groups, or one workspace. */
    const catSel = el.querySelector(".rl-cat");
    function fillCats() {
      const groups = new Map();
      g.nodes.forEach((n) => groups.has(n.group) || groups.set(n.group, { label: n.groupLabel, family: n.family }));
      catSel.innerHTML =
        '<option value="all">All curiosities</option>' +
        g.families
          .map((f) => `<optgroup label="${esc(f.label)}"><option value="fam:${esc(f.id)}">All of ${esc(f.label)}</option>${[...groups].filter(([, x]) => x.family === f.id).map(([id, x]) => `<option value="ws:${esc(id)}">${esc(x.label)}</option>`).join("")}</optgroup>`)
          .join("");
      catSel.value = st.cat;
      if (catSel.value !== st.cat) catSel.value = st.cat = "all";
    }
    catSel.addEventListener("change", () => {
      st.cat = catSel.value;
      st.camera = null;
      view && view.destroy();
      view = null;
      setView(st.view);
    });

    /* ---------- movement archive ---------- */
    function togglePick(id) {
      st.picked = st.picked.includes(id) ? st.picked.filter((x) => x !== id) : st.picked.concat(id);
      persist();
    }
    function openArchive(feeling) {
      const modal = document.createElement("div");
      modal.className = "rl rl-modal";
      const feelings = A.emotions.map((e) => ({ id: g.real(e.id), label: e.label }));
      let want = feeling ? g.real(feeling) : "";
      let q = "";
      let stillOnly = false;
      modal.innerHTML = `<div class="rl-box" role="dialog" aria-modal="true" aria-label="Movement archive">
        <header><div><h2>Movement archive</h2><p>What a body does, or stops doing, when it feels something. Pick a feeling to see its movements, or pick movements to see what they say.</p></div>
          <button data-act="close" aria-label="Close">Close</button></header>
        <div class="rl-box-tools">
          <div class="rl-bar" style="margin:0"><input type="search" placeholder="Search movements (eyes, breath, hands...)" aria-label="Search movements"><button data-act="still">Stillness only</button></div>
          <div class="rl-feelings">${feelings.map((f) => `<button data-feel="${esc(f.id)}">${esc(f.label)}</button>`).join("")}</div>
        </div>
        <div class="rl-box-body"></div>
        <footer><div class="rl-reads"></div>
          <div class="rl-actions" style="margin:0"><button data-act="show">Show on the map</button><button data-act="copy">Copy as a note</button><button data-act="clearpick">Clear picks</button></div></footer>
      </div>`;
      document.body.appendChild(modal);
      const body = modal.querySelector(".rl-box-body");
      const reads = modal.querySelector(".rl-reads");
      const label = (id) => (g.byId.get(g.real(id)) || {}).label || id;
      function draw() {
        modal.querySelectorAll("[data-feel]").forEach((b) => b.classList.toggle("on", b.dataset.feel === want));
        modal.querySelector('[data-act="still"]').classList.toggle("on", stillOnly);
        const ql = q.toLowerCase();
        body.innerHTML = A.groups
          .map((grp) => {
            let ms = A.movements.filter((m) => m.group === grp && (!stillOnly || m.still) && (!ql || (m.label + " " + m.plain + " " + grp).toLowerCase().includes(ql)));
            if (want) ms = ms.filter((m) => m.emotions.some((e) => g.real(e) === want));
            if (!ms.length) return "";
            return `<div class="rl-mgroup"><h3>${esc(grp)}</h3><div class="rl-moves">${ms
              .map((m) => `<button class="rl-move${st.picked.includes(m.id) ? " on" : ""}" data-move="${esc(m.id)}" aria-pressed="${st.picked.includes(m.id)}"><b>${esc(m.label)}${m.still && m.group !== "Stillness" ? " (stillness)" : ""}</b><span>${esc(m.plain)}</span><em>${m.emotions.map(label).map(esc).join(" · ")}</em></button>`)
              .join("")}</div></div>`;
          })
          .join("") || "<p class='rl-note'>No movements match.</p>";
        const r = readsAs(st.picked);
        reads.innerHTML = st.picked.length
          ? `<b>${st.picked.length} picked.</b> Reads as ${r.slice(0, 4).map(([id, n]) => `<b>${esc(label(id))}</b> (${n})`).join(", ") || "no single feeling yet"}.`
          : want
            ? `Showing the movements that show <b>${esc(label(want))}</b>. Click to pick them.`
            : "Click movements to pick them.";
      }
      function close() {
        modal.remove();
        document.removeEventListener("keydown", onKey);
        drawSide();
      }
      function onKey(e) {
        if (e.key === "Escape") close();
      }
      document.addEventListener("keydown", onKey);
      modal.addEventListener("click", (e) => {
        if (e.target === modal) return close();
        const b = e.target.closest("button");
        if (!b) return;
        if (b.dataset.feel) want = want === b.dataset.feel ? "" : b.dataset.feel;
        if (b.dataset.move) togglePick(b.dataset.move);
        const act = b.dataset.act;
        if (act === "close") return close();
        if (act === "still") stillOnly = !stillOnly;
        if (act === "clearpick") {
          st.picked = [];
          persist();
        }
        if (act === "show") {
          close();
          return select(st.picked.length ? st.picked : want ? [want] : []);
        }
        if (act === "copy") {
          const r = readsAs(st.picked);
          const text = `Feeling: ${r.slice(0, 3).map(([id]) => label(id)).join(", ") || "(not set)"}\nMovements: ${st.picked.map(label).join("; ")}`;
          (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject()).then(
            () => (b.textContent = "Copied"),
            () => window.prompt("Copy this note", text)
          );
          return;
        }
        draw();
      });
      modal.querySelector('input[type="search"]').addEventListener("input", (e) => {
        q = e.target.value;
        draw();
      });
      draw();
      modal.querySelector('input[type="search"]').focus();
      return modal;
    }

    drawSide();
    setView(st.view);
    var api = { graph: g, view: () => view, select, setView, openArchive, selected: () => st.sel.slice(), picked: () => st.picked.slice(), destroy: () => view && view.destroy() };
    el._curioRelations = api;
    return api;
  }

  /* ---------- flat matrix ---------- */
  function flatView(stage, g, st, select, nearSet) {
    const wrap = document.createElement("div");
    wrap.className = "rl-flat";
    const order = (n) => (n.kind === "curiosity" ? 1 : 0);
    wrap.innerHTML = `<div class="rl-flat-in">${g.families
      .map((f) => {
        const ns = g.nodes.filter((n) => n.family === f.id);
        const groups = [];
        ns.slice()
          .sort((a, b) => order(a) - order(b))
          .forEach((n) => {
            let gr = groups.find((x) => x.id === n.group);
            if (!gr) groups.push((gr = { id: n.group, label: n.groupLabel, items: [] }));
            gr.items.push(n);
          });
        return `<section class="rl-col" style="--c:${FAMILY_COLOR[f.id]}"><h3>${esc(f.label)} <span class="rl-tag">${ns.length}</span></h3>${groups
          .map((gr) => `<div class="rl-group">${esc(gr.label)}</div><div class="rl-chips">${gr.items.map((n) => `<button class="rl-chip" data-id="${esc(n.id)}" title="${esc(n.plain)}">${esc(n.label)}</button>`).join("")}</div>`)
          .join("")}</section>`;
      })
      .join("")}<svg class="rl-svg" xmlns="http://www.w3.org/2000/svg"></svg></div>`;
    stage.appendChild(wrap);
    const inner = wrap.firstChild;
    const svg = inner.querySelector("svg");
    const chip = new Map([...inner.querySelectorAll(".rl-chip")].map((b) => [b.dataset.id, b]));
    wrap.addEventListener("click", (e) => {
      const b = e.target.closest(".rl-chip");
      if (b) select(st.sel.length === 1 && st.sel[0] === b.dataset.id ? [] : b.dataset.id);
    });
    function center(b) {
      const r = b.getBoundingClientRect();
      const o = inner.getBoundingClientRect();
      return [r.left - o.left + r.width / 2, r.top - o.top + r.height / 2];
    }
    function update() {
      chip.forEach((b) => b.classList.remove("sel", "near"));
      svg.innerHTML = "";
      wrap.classList.toggle("has-sel", st.sel.length > 0);
      if (!st.sel.length) return;
      const near = nearSet();
      svg.setAttribute("width", inner.scrollWidth);
      svg.setAttribute("height", inner.scrollHeight);
      let paths = "";
      st.sel.forEach((id) => {
        const from = chip.get(id);
        if (!from) return;
        from.classList.add("sel");
        const [x1, y1] = center(from);
        g.links(id).forEach((l) => {
          const to = chip.get(l.id);
          if (!to || st.sel.includes(l.id)) return;
          to.classList.add("near");
          to.style.setProperty("--c", TYPE_COLOR[l.edge.type]);
          const [x2, y2] = center(to);
          const mx = (x1 + x2) / 2;
          const bend = Math.abs(x2 - x1) < 20 ? 60 : 0;
          paths += `<path d="M${x1},${y1} Q${mx + bend},${(y1 + y2) / 2 - Math.min(80, Math.abs(x2 - x1) / 4)} ${x2},${y2}" stroke="${TYPE_COLOR[l.edge.type]}" stroke-width="1.5" fill="none" opacity="0.7"/>`;
        });
      });
      svg.innerHTML = paths;
      near.size; // the near set colours the chips above
      const first = chip.get(st.sel[0]);
      if (first) {
        const r = first.getBoundingClientRect();
        const w = wrap.getBoundingClientRect();
        if (r.top < w.top || r.bottom > w.bottom || r.left < w.left || r.right > w.right) first.scrollIntoView({ block: "center", inline: "center" });
      }
    }
    const onResize = () => update();
    window.addEventListener("resize", onResize);
    return { update, focus: () => {}, chip, svg, destroy: () => window.removeEventListener("resize", onResize) };
  }

  /* ---------- the 3D views: a shared stage (renderer, camera you can turn, fly, labels) ----------
     Drag turns the view all the way round; once you are close in, dragging looks around where you stand.
     Double-click flies toward what you clicked and halves the distance each time, like zooming into a map.
     Scroll or pinch zooms. Each view adds its own objects to stage.scene and its own pick(). */
  function threeStage(host, keep, opts) {
    const T = root.THREE;
    const renderer = new T.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(2, root.devicePixelRatio || 1));
    host.insertBefore(renderer.domElement, host.firstChild);
    const scene = new T.Scene();
    const camera = new T.PerspectiveCamera(50, 1, 0.05, 2000);
    scene.add(new T.AmbientLight(0xffffff, 0.62));
    const sun = new T.DirectionalLight(0xffffff, 0.75);
    sun.position.set(30, 50, 40);
    scene.add(sun);
    const back = new T.DirectionalLight(0xffffff, 0.25);
    back.position.set(-30, -20, -40);
    scene.add(back);
    const orb = { target: new T.Vector3(0, 0, 0), r: opts.r || 60, theta: opts.theta == null ? 0.55 : opts.theta, phi: opts.phi || 1.2, spin: false };
    if (keep && keep.view === opts.kind) {
      orb.target.set(keep.target[0], keep.target[1], keep.target[2]);
      orb.r = keep.r;
      orb.theta = keep.theta;
      orb.phi = keep.phi;
    }
    // home is always the whole view this stage was made for, wherever a kept camera put you
    const home = { target: new T.Vector3(0, 0, 0), r: opts.r || 60, theta: opts.theta == null ? 0.55 : opts.theta, phi: opts.phi || 1.2 };
    const dir = () => new T.Vector3(Math.sin(orb.phi) * Math.sin(orb.theta), Math.cos(orb.phi), Math.sin(orb.phi) * Math.cos(orb.theta));
    let fly = null;
    const S = {
      T,
      scene,
      camera,
      renderer,
      orb,
      host,
      flyTo(target, r, angles) {
        fly = { from: orb.target.clone(), to: new T.Vector3(target[0], target[1], target[2]), r0: orb.r, r1: r, th0: orb.theta, th1: angles ? angles.theta : orb.theta, ph0: orb.phi, ph1: angles ? angles.phi : orb.phi, start: performance.now() };
      },
      home() {
        S.flyTo([home.target.x, home.target.y, home.target.z], home.r, { theta: home.theta, phi: home.phi });
      },
      flying: () => !!fly,
      flyStop() {
        fly = null;
      },
      state: () => ({ view: opts.kind, target: [orb.target.x, orb.target.y, orb.target.z], r: orb.r, theta: orb.theta, phi: orb.phi }),
      onFrame: null,
      onClick: null,
      onDouble: null,
      onSwipe: null,
      onHover: null,
      dragOverride: null,
      ray: new T.Raycaster(),
    };
    S.ray.params.Line = { threshold: 0.3 };
    const mouse = new T.Vector2();
    S.aim = (e) => {
      const r = renderer.domElement.getBoundingClientRect();
      mouse.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      S.ray.setFromCamera(mouse, camera);
      return S.ray;
    };
    S.project = (p) => {
      const v = new T.Vector3(p[0], p[1], p[2]).project(camera);
      const w = host.clientWidth;
      const h = host.clientHeight;
      return { x: ((v.x + 1) / 2) * w, y: ((1 - v.y) / 2) * h, vis: v.z < 1 && v.z > -1 && Math.abs(v.x) < 1.1 && Math.abs(v.y) < 1.1 };
    };
    const cv = renderer.domElement;
    const ptrs = new Map();
    let drag = null;
    let pinch = 0;
    cv.addEventListener("pointerdown", (e) => {
      cv.setPointerCapture(e.pointerId);
      ptrs.set(e.pointerId, [e.clientX, e.clientY]);
      drag = { x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY, t0: performance.now(), moved: 0, own: S.dragOverride ? S.dragOverride.down(e) : false };
      orb.spin = false;
      fly = null;
      if (ptrs.size === 2) {
        const [a, b] = [...ptrs.values()];
        pinch = Math.hypot(a[0] - b[0], a[1] - b[1]);
      }
    });
    cv.addEventListener("pointermove", (e) => {
      if (ptrs.has(e.pointerId)) ptrs.set(e.pointerId, [e.clientX, e.clientY]);
      if (ptrs.size === 2) {
        const [a, b] = [...ptrs.values()];
        const d = Math.hypot(a[0] - b[0], a[1] - b[1]);
        if (pinch) orb.r = Math.max(0.8, Math.min(600, orb.r * (pinch / d)));
        pinch = d;
        if (drag) drag.moved = 99;
        return;
      }
      if (drag && ptrs.size === 1) {
        const dx = e.clientX - drag.x;
        const dy = e.clientY - drag.y;
        drag.moved += Math.abs(dx) + Math.abs(dy);
        drag.x = e.clientX;
        drag.y = e.clientY;
        if (drag.own) return S.dragOverride.move(e);
        if (S.close()) {
          // Close in: turn where you stand, so dragging looks all the way round you.
          const eye = camera.position.clone();
          orb.theta += dx * 0.005;
          orb.phi = Math.max(0.05, Math.min(Math.PI - 0.05, orb.phi + dy * 0.005));
          orb.target.copy(eye).addScaledVector(dir(), -orb.r);
        } else {
          orb.theta -= dx * 0.008;
          orb.phi = Math.max(0.05, Math.min(Math.PI - 0.05, orb.phi - dy * 0.008));
        }
        return;
      }
      S.onHover && S.onHover(e);
    });
    const up = (e) => {
      ptrs.delete(e.pointerId);
      if (ptrs.size < 2) pinch = 0;
      if (drag && ptrs.size === 0) {
        const dx = e.clientX - drag.x0;
        const dy = e.clientY - drag.y0;
        if (drag.own) S.dragOverride.up(e, drag.moved);
        else if (drag.moved < 6) S.onClick && S.onClick(e);
        else if (S.onSwipe && Math.abs(dx) > 60 && Math.abs(dy) < Math.abs(dx) * 0.5 && performance.now() - drag.t0 < 600) S.onSwipe(dx > 0 ? "right" : "left");
        drag = null;
      }
    };
    cv.addEventListener("pointerup", up);
    cv.addEventListener("pointercancel", up);
    cv.addEventListener("dblclick", (e) => S.onDouble && S.onDouble(e));
    cv.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
        orb.r = Math.max(0.8, Math.min(600, orb.r * Math.exp(e.deltaY * 0.001)));
      },
      { passive: false }
    );
    S.close = () => orb.r < (opts.closeAt || 12);
    let raf = 0;
    let w0 = 0;
    let h0 = 0;
    function frame() {
      raf = requestAnimationFrame(frame);
      const w = host.clientWidth;
      const h = host.clientHeight;
      if (w !== w0 || h !== h0) {
        w0 = w;
        h0 = h;
        renderer.setSize(w, h, false);
        camera.aspect = w / Math.max(1, h);
        camera.updateProjectionMatrix();
      }
      if (fly) {
        const t = Math.min(1, (performance.now() - fly.start) / 900);
        const k = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        orb.target.lerpVectors(fly.from, fly.to, k);
        orb.r = fly.r0 + (fly.r1 - fly.r0) * k;
        orb.theta = fly.th0 + (fly.th1 - fly.th0) * k;
        orb.phi = fly.ph0 + (fly.ph1 - fly.ph0) * k;
        if (t >= 1) fly = null;
      }
      if (orb.spin) orb.theta += 0.004;
      camera.position.copy(orb.target).addScaledVector(dir(), orb.r);
      camera.lookAt(orb.target);
      S.onFrame && S.onFrame();
      renderer.render(scene, camera);
      S.afterRender && S.afterRender();
    }
    S.start = () => frame();
    S.destroy = () => {
      cancelAnimationFrame(raf);
      renderer.dispose();
    };
    /* Double-click: fly toward a point and halve the distance (never closer than `min`). */
    S.zoomTo = (p, min) => S.flyTo(p, Math.max(min || 1.5, orb.r * 0.45));
    return S;
  }

  /* A 3D view that waits for three.js, then builds. */
  function threeView(stage, cls, html, build) {
    const host = document.createElement("div");
    host.className = "rl-cube " + cls;
    host.tabIndex = 0;
    host.innerHTML = html;
    stage.appendChild(host);
    let alive = true;
    let ctx = null;
    const pending = { focus: null };
    loadThree().then((ok) => {
      if (!alive) return;
      if (!ok) {
        host.innerHTML = '<p class="rl-note">The 3D views need three.js, which loads from cdnjs. Check the connection and reload. The flat list still works.</p>';
        return;
      }
      ctx = build(host);
      ctx.update();
      if (pending.focus) ctx.focus(pending.focus);
    });
    return {
      update: () => ctx && ctx.update(),
      focus: (id) => (ctx ? ctx.focus(id) : (pending.focus = id)),
      posOf: (id) => (ctx && ctx.pos ? ctx.pos.get(id) : null),
      camera: () => (ctx ? ctx.stage.state() : null),
      inner: () => ctx,
      destroy: () => {
        alive = false;
        ctx && ctx.destroy();
      },
    };
  }

  /* ---------- Cube matrix and Cube slices ----------
     Every curiosity, feeling, movement, trait and figure is one small 3D cube. The cubes stand in slabs, one slab
     per column (the six groups, or one per workspace); the slabs stack front to back into one block, like a Rubik's
     cube with many more cubes, longer than it is wide when it needs to be. Pick a cube and lines run to every cube
     it is directly tied to. In Cube slices, swipe right (or the right arrow) and the front slab goes to the back;
     swipe left and the back slab comes to the front; click a slab's name to bring it to the front. */
  const CELL = 1.3;
  const SLAB = 2.6;
  function slabsOf(g, by) {
    if (by === "workspace") {
      const out = [];
      g.families.forEach((f) =>
        g.nodes
          .filter((n) => n.family === f.id)
          .sort((a, b) => (a.kind === "curiosity") - (b.kind === "curiosity"))
          .forEach((n) => {
            let s = out.find((x) => x.key === n.group);
            if (!s) out.push((s = { key: n.group, label: n.groupLabel, family: f.id, ids: [] }));
            s.ids.push(n.id);
          })
      );
      return out;
    }
    return g.families.map((f) => ({
      key: f.id,
      label: f.label,
      family: f.id,
      ids: g.nodes
        .filter((n) => n.family === f.id)
        .sort((a, b) => (a.kind === "curiosity") - (b.kind === "curiosity") || (a.group < b.group ? -1 : a.group > b.group ? 1 : 0))
        .map((n) => n.id),
    }));
  }
  /* Where each cube sits: slab d (0 = front) at z, its cubes in a grid of `cols` by `rows`, the same for every slab. */
  function blockLayout(g, by) {
    let slabs = slabsOf(g, by);
    // one group picked: its workspaces become the faces, so there is still a block to walk through
    if (by === "family" && slabs.length < 3) slabs = slabsOf(g, "workspace");
    const most = Math.max(1, ...slabs.map((s) => s.ids.length));
    const cols = Math.ceil(Math.sqrt(most * 1.3));
    const rows = Math.ceil(most / cols);
    const cell = new Map();
    slabs.forEach((s, si) => s.ids.forEach((id, i) => cell.set(id, { slab: si, x: ((i % cols) - (cols - 1) / 2) * CELL, y: ((rows - 1) / 2 - Math.floor(i / cols)) * CELL })));
    return { slabs, cols, rows, cell, depth: (slabs.length - 1) * SLAB };
  }
  const zOf = (d, n) => ((n - 1) / 2 - d) * SLAB;

  function cubeView(stage, g, st, select, persist, keep, slices) {
    const kind = slices ? "slices" : "cube";
    const html = `<div class="rl-labels"></div><div class="rl-tip"></div>
      ${slices ? '<div class="rl-slabtabs"></div>' : ""}
      <div class="rl-cube-ui">
        <div class="rl-seg" role="group" aria-label="Slabs"><button data-c="by-family">6 slabs</button><button data-c="by-workspace">A slab per workspace</button></div>
        ${slices ? '<button data-c="back" aria-label="Bring the back slab to the front">◀ Back to front</button><button data-c="front" aria-label="Send the front slab to the back">Front to back ▶</button>' : '<button data-c="spin">Spin</button>'}
        <button data-c="home">Whole cube</button><button data-c="all">Show every proximity</button>
        <button data-c="corridor" title="Fly into the corridor between two faces">Walk a corridor</button><button data-c="inside" title="Go inside the selected cube">Go inside</button>
      </div>
      <div class="rl-corridor"><label>Slide the corridor <input type="range" min="0" max="1000" value="0" aria-label="Slide the corridor"></label><small></small></div>
      <div class="rl-hint">${slices ? "Swipe right: front slab to the back · swipe left: back slab to the front · drag slowly to turn · double-click to zoom in" : "Drag to turn it 360° · click a cube · double-click to zoom in, again to go further · scroll or pinch to zoom"}</div>`;
    return threeView(stage, kind, html, (host) => initBlock(host, g, st, select, persist, keep, slices));
  }

  function initBlock(host, g, st, select, persist, keep, slices) {
    const by = st.slabBy === "workspace" ? "workspace" : "family";
    const L = blockLayout(g, by);
    const n = L.slabs.length;
    const span = Math.max(L.cols * CELL, L.rows * CELL, L.depth);
    const S = threeStage(host, keep, { kind: slices ? "slices" : "cube", r: span * 1.9, theta: slices ? 0.0001 : 0.62, phi: slices ? 1.42 : 1.12, closeAt: 6 });
    const T = S.T;
    const labels = host.querySelector(".rl-labels");
    const tip = host.querySelector(".rl-tip");
    if (!slices && !keep && n >= 2) {
      // Opens zoomed in at the mouth of the first corridor, looking down it; drag to look round at the whole block.
      const z = (zOf(0, n) + zOf(1, n)) / 2;
      S.orb.target.set(-(L.cols * CELL) / 2 - 3 + 1.5, 0.6, z);
      S.orb.r = 1.5;
      S.orb.theta = -Math.PI / 2 + 0.12;
      S.orb.phi = Math.PI / 2 - 0.1;
    }
    // the order of slabs front to back (Cube slices moves it); depth index of each slab
    const order = L.slabs.map((_, i) => i);
    const depthOf = () => {
      const d = [];
      order.forEach((si, k) => (d[si] = k));
      return d;
    };
    const nodes = g.nodes.filter((nd) => L.cell.has(nd.id));
    const index = new Map(nodes.map((nd, i) => [nd.id, i]));
    const cur = new Map(); // where each cube is drawn now (eases toward its place when slabs move)
    const goal = new Map();
    function place(instant) {
      const d = depthOf();
      nodes.forEach((nd) => {
        const c = L.cell.get(nd.id);
        const p = [c.x, c.y, zOf(d[c.slab], n)];
        goal.set(nd.id, p);
        if (instant || !cur.has(nd.id)) cur.set(nd.id, p.slice());
      });
    }
    place(true);

    // the block's frame: a wire box round it, and a thin outline round each slab
    const box = new T.LineSegments(new T.EdgesGeometry(new T.BoxGeometry(L.cols * CELL + 0.8, L.rows * CELL + 0.8, L.depth + 1.6)), new T.LineBasicMaterial({ color: 0x8a7f72, transparent: true, opacity: 0.45 }));
    S.scene.add(box);

    const mesh = new T.InstancedMesh(new T.BoxGeometry(0.92, 0.92, 0.92), new T.MeshLambertMaterial({ color: 0xffffff }), nodes.length);
    // each workspace a shade of its group's colour, so the regions read on every face
    const shade = new Map();
    g.families.forEach((f) => {
      const groups = [...new Set(g.nodes.filter((x) => x.family === f.id).map((x) => x.group))];
      groups.forEach((gr, i) => shade.set(gr, 0.85 + ((i % 4) * 0.12)));
    });
    const base = nodes.map((nd) => {
      const c = new T.Color(nd.kind === "mine" ? "#1c1712" : FAMILY_COLOR[nd.family] || "#888");
      return c.multiplyScalar(shade.get(nd.group) || 1);
    });
    const ground = new T.Color(0xe6ddcf);
    const m4 = new T.Matrix4();
    const col = new T.Color();
    let near = new Map();
    function paint() {
      const d = depthOf();
      nodes.forEach((nd, i) => {
        const p = cur.get(nd.id);
        const isSel = st.sel.includes(nd.id);
        const isNear = near.has(nd.id);
        const s = isSel ? 1.35 : isNear ? 1.12 : 1;
        m4.makeScale(s, s, s).setPosition(p[0], p[1], p[2]);
        mesh.setMatrixAt(i, m4);
        col.copy(base[i]);
        const behind = slices ? d[L.cell.get(nd.id).slab] : 0;
        if (st.sel.length && !isSel && !isNear) col.lerp(ground, 0.75);
        else if (behind > 0) col.lerp(ground, Math.min(0.7, 0.35 + behind * 0.05));
        if (isSel) col.set(0x1c1712);
        mesh.setColorAt(i, col);
      });
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }
    paint(); // colours must exist before the first render
    S.scene.add(mesh);

    let lines = null;
    let web = null;
    function segs(list, alpha) {
      const v = [];
      const c = [];
      list.forEach((e) => {
        const a = cur.get(e.a);
        const b = cur.get(e.b);
        if (!a || !b) return;
        const k = new T.Color(TYPE_COLOR[e.type]);
        v.push(a[0], a[1], a[2], b[0], b[1], b[2]);
        c.push(k.r, k.g, k.b, k.r, k.g, k.b);
      });
      const geo = new T.BufferGeometry();
      geo.setAttribute("position", new T.Float32BufferAttribute(v, 3));
      geo.setAttribute("color", new T.Float32BufferAttribute(c, 3));
      return new T.LineSegments(geo, new T.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: alpha }));
    }
    function drop(o) {
      if (o) {
        S.scene.remove(o);
        o.geometry.dispose();
      }
      return null;
    }
    function drawLines() {
      lines = drop(lines);
      web = drop(web);
      if (st.showAll) S.scene.add((web = segs(g.edges.filter((e) => e.type === "leads" || e.type === "mine"), st.sel.length ? 0.1 : 0.22)));
      if (!st.sel.length) return;
      const list = [];
      st.sel.forEach((id) => g.links(id).forEach((l) => list.push(l.edge)));
      S.scene.add((lines = segs(list, 0.9)));
    }

    // Labels: the selection and its ties (up to 60), and each slab's name on its top edge.
    let labelIds = [];
    function setLabels() {
      labelIds = st.sel.filter((id) => cur.has(id)).concat([...near.keys()].filter((id) => cur.has(id)).slice(0, 60));
      const slabLabels = L.slabs.map((s) => `<div class="slab" style="--c:${FAMILY_COLOR[s.family]}">${esc(s.label)}</div>`).join("");
      labels.innerHTML = labelIds.map((id) => `<div class="${st.sel.includes(id) ? "sel" : ""}">${esc(g.byId.get(id).label)}</div>`).join("") + slabLabels;
    }
    function placeLabels() {
      const els = labels.children;
      const put = (el, p) => {
        if (!el) return;
        const q = S.project(p);
        el.style.display = q.vis ? "" : "none";
        if (q.vis) {
          el.style.left = q.x + "px";
          el.style.top = q.y + "px";
        }
      };
      labelIds.forEach((id, i) => put(els[i], cur.get(id)));
      const d = depthOf();
      const top = (L.rows * CELL) / 2 + 0.9;
      // slab names run along the top edge on the side you are looking from, so they spread out front to back
      const side = Math.sin(S.orb.theta) >= 0 ? 1 : -1;
      const edge = slices ? (-L.cols * CELL) / 2 : side * ((L.cols * CELL) / 2 + 0.6);
      L.slabs.forEach((s, i) => {
        const el = els[labelIds.length + i];
        if (!el) return;
        // in slices the tabs name every slab, so only the front one is named on the block
        if (slices && d[i] > 0) return void (el.style.display = "none");
        put(el, [edge, top, zOf(d[i], n)]);
      });
    }
    S.afterRender = placeLabels;

    function tabs() {
      const box = host.querySelector(".rl-slabtabs");
      if (!box) return;
      const counts = new Map();
      st.sel.forEach((id) => g.links(id).forEach((l) => {
        const c = L.cell.get(l.id);
        if (c) counts.set(c.slab, (counts.get(c.slab) || 0) + 1);
      }));
      box.innerHTML = order.map((si, k) => `<button data-slab="${si}" class="${k === 0 ? "on" : ""}" style="--c:${FAMILY_COLOR[L.slabs[si].family]}">${esc(L.slabs[si].label)}${counts.get(si) ? ` <b>${counts.get(si)}</b>` : ""}</button>`).join("");
    }

    let moving = 0;
    S.onFrame = () => {
      watchCorridor();
      if (!moving) return;
      let still = true;
      cur.forEach((p, id) => {
        const q = goal.get(id);
        for (let k = 0; k < 3; k++) {
          const dd = q[k] - p[k];
          if (Math.abs(dd) > 0.01) {
            p[k] += dd * 0.18;
            still = false;
          } else p[k] = q[k];
        }
      });
      paint();
      drawLines();
      if (still) moving = 0;
    };
    function shift(dir) {
      if (dir === "front") order.push(order.shift());
      else order.unshift(order.pop());
      place(false);
      moving = 1;
      tabs();
    }
    function bring(si) {
      while (order[0] !== si) order.push(order.shift());
      place(false);
      moving = 1;
      tabs();
    }

    function pickCube(e) {
      S.aim(e);
      const hit = S.ray.intersectObject(mesh)[0];
      return hit ? nodes[hit.instanceId] : null;
    }
    S.onClick = (e) => {
      const nd = pickCube(e);
      if (nd) select(st.sel.length === 1 && st.sel[0] === nd.id && !st.tieFrom ? [] : nd.id);
    };
    S.onDouble = (e) => {
      const nd = pickCube(e);
      if (nd) {
        const p = cur.get(nd.id);
        // already right up against this cube: the next double-click goes inside it
        if (st.sel[0] === nd.id && S.orb.r <= 2.7 && S.orb.target.distanceTo(new T.Vector3(p[0], p[1], p[2])) < 0.6) return enter(nd.id);
        if (!st.sel.includes(nd.id)) select(nd.id);
        return S.zoomTo(p, 2.5);
      }
      // empty space: toward the cube nearest that spot, so you always land somewhere
      S.aim(e);
      const o = S.ray.ray.origin;
      const dv = S.ray.ray.direction;
      let best = null;
      let bestA = 0.15;
      const q = new T.Vector3();
      cur.forEach((p) => {
        q.set(p[0], p[1], p[2]).sub(o);
        const along = q.dot(dv);
        if (along <= 0.5) return;
        const ang = Math.acos(Math.min(1, along / q.length()));
        if (ang < bestA) {
          bestA = ang;
          best = p;
        }
      });
      S.zoomTo(best || S.ray.ray.at(S.orb.r, new T.Vector3()).toArray(), 2.5);
    };
    S.onHover = (e) => {
      const nd = pickCube(e);
      if (!nd) return void (tip.style.display = "none");
      const r = host.getBoundingClientRect();
      tip.textContent = nd.label + " · " + nd.groupLabel;
      tip.style.display = "block";
      tip.style.left = e.clientX - r.left + 12 + "px";
      tip.style.top = e.clientY - r.top + 12 + "px";
    };
    if (slices) S.onSwipe = (d) => shift(d === "right" ? "front" : "back");
    host.addEventListener("keydown", (e) => {
      if (!slices) return;
      if (e.key === "ArrowRight") shift("front");
      else if (e.key === "ArrowLeft") shift("back");
      else return;
      e.preventDefault();
    });
    host.addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      const c = b.dataset.c;
      if (b.dataset.slab) bring(+b.dataset.slab);
      if (c === "front" || c === "back") shift(c);
      if (c === "home") {
        inside && inside.destroy();
        inside = null;
        S.home();
      }
      if (c === "corridor") walkCorridor();
      if (c === "inside") st.sel[0] && cur.has(st.sel[0]) ? enter(st.sel[0]) : (b.title = "Pick a cube first");
      if (c === "spin") b.classList.toggle("on", (S.orb.spin = !S.orb.spin));
      if (c === "all") {
        st.showAll = !st.showAll;
        persist();
        drawLines();
      }
      if (c === "by-family" || c === "by-workspace") {
        st.slabBy = c === "by-family" ? "family" : "workspace";
        persist();
        st.camera = null;
        return host.dispatchEvent(new CustomEvent("rl-rebuild", { bubbles: true }));
      }
      sync();
    });
    function sync() {
      const all = host.querySelector('[data-c="all"]');
      all && all.classList.toggle("on", st.showAll);
      host.querySelectorAll("[data-c^=by-]").forEach((b) => b.classList.toggle("on", b.dataset.c === "by-" + by));
    }
    sync();

    /* Corridors: the gaps between two faces (slabs). When you stand in one, the "Slide the corridor" slider shows
       in the lower right; it moves you along the way you are looking, flattened into the corridor, so you never
       go into a cube on either side. Where you look when you grab the slider sets the way it slides. */
    const HX = (L.cols * CELL) / 2 + 0.3;
    const HY = (L.rows * CELL) / 2 + 0.3;
    const corr = host.querySelector(".rl-corridor");
    const corrIn = corr.querySelector("input");
    let lane = null; // { p0, h, t0, t1 } while the slider is showing
    function corridorAt(p) {
      if (n < 2 || Math.abs(p.x) > HX || Math.abs(p.y) > HY) return -1;
      for (let k = 0; k < n - 1; k++) if (p.z < zOf(k, n) - 0.5 && p.z > zOf(k + 1, n) + 0.5) return k;
      return -1;
    }
    const nearestK = (z) => {
      let best = 0;
      for (let k = 0; k < n - 1; k++) if (Math.abs(z - (zOf(k, n) + zOf(k + 1, n)) / 2) < Math.abs(z - (zOf(best, n) + zOf(best + 1, n)) / 2)) best = k;
      return best;
    };
    // Not in a corridor yet: step sideways into the nearest one first (and face along it if you were looking away).
    function snapIn() {
      const p = S.camera.position.clone();
      const k = nearestK(p.z);
      p.z = (zOf(k, n) + zOf(k + 1, n)) / 2;
      p.y = Math.max(-HY + 0.3, Math.min(HY - 0.3, p.y));
      const h = new T.Vector3();
      S.camera.getWorldDirection(h);
      h.z = 0;
      const inX = Math.abs(p.x) <= HX;
      if (h.length() < 0.15 || (!inX && Math.sign(h.x) === Math.sign(p.x))) h.set(p.x > 0 ? -1 : 1, 0, 0);
      h.normalize();
      S.flyStop && S.flyStop();
      S.orb.theta = Math.atan2(-h.x, -h.z);
      S.orb.phi = Math.PI / 2 - 0.05;
      S.orb.target.copy(p).addScaledVector(h, S.orb.r);
      S.camera.position.copy(p);
      S.camera.lookAt(S.orb.target);
    }
    function aimCorridor() {
      if (corridorAt(S.camera.position) < 0) snapIn();
      const p0 = S.camera.position.clone();
      const h = new T.Vector3();
      S.camera.getWorldDirection(h);
      h.z = 0;
      if (h.length() < 0.15) h.set(1, 0, 0);
      h.normalize();
      // how far you can go each way before leaving the block's side
      let t0 = -Infinity;
      let t1 = Infinity;
      [["x", HX], ["y", HY]].forEach(([a, lim]) => {
        if (Math.abs(h[a]) < 1e-6) return;
        const ta = (-lim - p0[a]) / h[a];
        const tb = (lim - p0[a]) / h[a];
        t0 = Math.max(t0, Math.min(ta, tb));
        t1 = Math.min(t1, Math.max(ta, tb));
      });
      if (!(t1 > t0)) {
        t0 = 0;
        t1 = 0.01;
      }
      // from outside the block, the slide starts where you stand
      if (t0 > 0) t0 = 0;
      if (t1 < 0) t1 = 0;
      lane = { p0, h, t0, t1 };
      corrIn.value = String(Math.round((-t0 / Math.max(0.01, t1 - t0)) * 1000));
    }
    function slideTo(v) {
      if (!lane) aimCorridor();
      const t = lane.t0 + (v / 1000) * (lane.t1 - lane.t0);
      const want = lane.p0.clone().addScaledVector(lane.h, t);
      S.orb.target.add(want.sub(S.camera.position));
      S.camera.position.copy(lane.p0).addScaledVector(lane.h, t);
    }
    corrIn.addEventListener("pointerdown", aimCorridor);
    corrIn.addEventListener("keydown", () => lane || aimCorridor());
    corrIn.addEventListener("input", () => slideTo(+corrIn.value));
    let corrK = null; // so the first frame fills in the slider's words
    function watchCorridor() {
      const k = inside ? -2 : corridorAt(S.camera.position);
      if (k === corrK) return;
      corrK = k;
      // The slider is always there (you can always slide down a corridor); only inside a cube it steps aside.
      corr.hidden = !!inside || n < 2;
      lane = null;
      const d = depthOf();
      const name = (dd) => L.slabs[d.indexOf(dd)].label;
      const kk = k >= 0 ? k : nearestK(S.camera.position.z);
      if (n >= 2) corr.querySelector("small").textContent = (k >= 0 ? "Between " : "Nearest corridor: between ") + name(kk) + " and " + name(kk + 1);
      if (k >= 0) aimCorridor();
      else if (k === -1) corrIn.value = "0";
    }
    function walkCorridor() {
      // the corridor behind the selected cube's face, or behind the front face; stand at its left end, looking along it
      const c = st.sel[0] && L.cell.get(st.sel[0]);
      const d = depthOf();
      const k = Math.min(n - 2, c ? d[c.slab] : 0);
      const z = (zOf(k, n) + zOf(k + 1, n)) / 2;
      const r = 1.2;
      S.flyTo([-HX + 0.6 + r, 0, z], r, { theta: -Math.PI / 2, phi: Math.PI / 2 - 0.08 });
    }

    /* Inside a cube: its curiosity and everything tied to it as automation lanes (stacked tracks like Ableton Live
       by default, or the 3D lanes), and the Curiosity proximity tab: the things tied to the things it is tied to. */
    let inside = null;
    function enter(id) {
      const p = cur.get(id);
      if (!p) return;
      if (!st.sel.includes(id)) select(id);
      S.flyTo(p, 0.3);
      inside && inside.destroy();
      inside = insideView(host, g, st, id, {
        select,
        leave: () => {
          inside && inside.destroy();
          inside = null;
          S.flyTo(cur.get(id), 6);
        },
        go: (other) => {
          if (cur.has(other)) enter(other);
          else select(other);
        },
      });
    }

    function update() {
      near = new Map();
      st.sel.forEach((id) => g.links(id).forEach((l) => near.set(l.id, l)));
      st.sel.forEach((id) => near.delete(id));
      paint();
      drawLines();
      setLabels();
      tabs();
    }
    function focus(id) {
      const c = L.cell.get(g.real(id));
      if (!c) return;
      if (slices) bring(c.slab);
      const p = slices ? goal.get(g.real(id)) : cur.get(g.real(id));
      S.flyTo(p, Math.min(S.orb.r, 14));
    }
    setLabels();
    S.start();
    return {
      update,
      focus,
      stage: S,
      pos: cur,
      order: () => order.map((si) => L.slabs[si].label),
      shift,
      bring,
      slabs: L.slabs,
      enter,
      walkCorridor,
      corridor: () => corrK,
      inside: () => inside,
      destroy: () => {
        inside && inside.destroy();
        S.destroy();
      },
    };
  }

  /* ---------- Lanes in depth ----------
     The automation lanes of a film over time, as ribbons standing one behind another: time runs left to right,
     each lane's height is where it sits on its scale, and the lane that moves the most stands at the back, so
     every lane in front of it can be seen. Drag to see it from any angle. In "Lanes, swipe", swipe right and the
     front lane goes to the back; swipe left and the back one comes forward. Click a lane to see its curiosity's ties.
     The lanes come from the film open in the app (CurioEngine); with none, an example film is shown and says so. */
  function filmLanes(g) {
    const E = root.CurioEngine;
    const Sc = root.CurioScale;
    if (E && Sc && typeof E.state === "function") {
      try {
        const s = E.state();
        const rows = s.rows || [];
        const out = [];
        Object.keys(s.lanes || {}).forEach((key) => {
          const [track, cur] = key.split("|");
          const base = String(cur).split(".")[0];
          const vals = rows.map((r) => {
            const v = E.value(r.id, track, cur);
            const p = v == null ? null : Sc.pos(cur, v);
            return typeof p === "number" && isFinite(p) ? p : null;
          });
          if (vals.filter((v) => v != null).length < 2) return;
          const tr = (s.tracks || []).find((t) => t.id === track);
          const nd = g.byId.get(base);
          if (g.cat && !nd) return; // a category shows only its own lanes
          out.push({ id: nd ? base : "", label: (nd ? nd.label : cur) + (tr && tr.label ? " · " + tr.label : ""), family: nd ? nd.family : "story", vals });
        });
        if (out.length >= 2 && rows.length >= 2) return { lanes: out, rows: rows.map((r) => r.label || r.id), example: false };
      } catch (e) {}
    }
    // An example film: twelve moments, a few lanes that move by different amounts.
    let pick = ["emotionIntensity", "shotSize", "cameraMove", "volume", "gesture", "lightingMood", "cutRate", "personalSpace", "pace", "faceIntensity", "musicIntensity", "tension"].filter((id) => g.byId.has(id)).slice(0, 9);
    // a category without those: its own most-tied curiosities
    if (pick.length < 6)
      pick = pick.concat(
        g.nodes
          .filter((n) => !pick.includes(n.id))
          .sort((a, b) => (b.kind === "curiosity") - (a.kind === "curiosity") || b.degree - a.degree)
          .slice(0, 9 - pick.length)
          .map((n) => n.id)
      );
    const N = 12;
    const lanes = pick.map((id, k) => {
      const amp = 0.08 + (k % 5) * 0.09;
      const f = 0.35 + (k % 3) * 0.3;
      return { id, label: g.byId.get(id).label, family: g.byId.get(id).family, vals: Array.from({ length: N }, (_, i) => Math.max(0, Math.min(1, 0.45 + amp * Math.sin(i * f + k) + (k === 0 ? (i / N) * 0.4 - 0.2 : 0)))) };
    });
    return { lanes, rows: Array.from({ length: N }, (_, i) => "Moment " + (i + 1)), example: true };
  }
  const movementOf = (vals) => {
    let m = 0;
    let prev = null;
    vals.forEach((v) => {
      if (v != null && prev != null) m += Math.abs(v - prev);
      if (v != null) prev = v;
    });
    return m;
  };

  function lanesView(stage, g, st, select, persist, keep, swipe) {
    const kind = "lanes";
    const html = `<div class="rl-labels"></div><div class="rl-filmnote"></div>
      <div class="rl-cube-ui">
        ${swipe ? '<button data-c="back" aria-label="Bring the back lane to the front">◀ Back to front</button><button data-c="front" aria-label="Send the front lane to the back">Front to back ▶</button>' : ""}
        <button data-c="home">Straight on</button><button data-c="side">From the side</button><button data-c="spin">Spin</button>
      </div>
      <div class="rl-hint">Swipe right: front lane to the back · swipe left: back lane to the front · click a lane to bring it forward · drag slowly to turn</div>`;
    return threeView(stage, kind, html, (host) => initLanes(host, g, st, select, keep, swipe));
  }

  function initLanes(host, g, st, select, keep, swipe, given) {
    const film = given || filmLanes(g);
    // the lane that moves the most stands at the back
    const lanes = film.lanes.map((l) => Object.assign({ move: movementOf(l.vals) }, l)).sort((a, b) => a.move - b.move);
    const N = film.rows.length;
    const STEP = 1.6;
    const H = 6;
    const GAP = 2.4;
    const width = (N - 1) * STEP;
    const S = threeStage(host, keep, { kind: "lanes", r: Math.max(width, lanes.length * GAP) * 1.5, theta: 0.42, phi: 1.25, closeAt: 3 });
    const T = S.T;
    const labels = host.querySelector(".rl-labels");
    host.querySelector(".rl-filmnote").textContent = film.note || (film.example ? "Example film: open a film on the Screen and its own lanes show here." : "Your film's automation lanes, busiest at the back.");
    const order = lanes.map((_, i) => i);
    const zFor = (k) => (lanes.length - 1) / 2 * GAP - k * GAP;
    const depth = () => {
      const d = [];
      order.forEach((li, k) => (d[li] = k));
      return d;
    };
    const objs = lanes.map((l, li) => {
      const grp = new T.Group();
      const color = new T.Color(FAMILY_COLOR[l.family] || "#888");
      // a filled ribbon from the floor up to the lane's value, then the lane's line and a dot per moment
      const v = [];
      const idx = [];
      l.vals.forEach((p, i) => {
        const x = -width / 2 + i * STEP;
        const y = (p == null ? 0 : p) * H;
        v.push(x, 0, 0, x, y, 0);
        if (i > 0) {
          const a = (i - 1) * 2;
          idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
        }
      });
      const geo = new T.BufferGeometry();
      geo.setAttribute("position", new T.Float32BufferAttribute(v, 3));
      geo.setIndex(idx);
      geo.computeVertexNormals();
      const fill = new T.Mesh(geo, new T.MeshLambertMaterial({ color, transparent: true, opacity: 0.38, side: T.DoubleSide, depthWrite: false }));
      fill.userData.lane = li;
      grp.add(fill);
      const pts = l.vals.map((p, i) => new T.Vector3(-width / 2 + i * STEP, (p == null ? 0 : p) * H, 0));
      const line = new T.Line(new T.BufferGeometry().setFromPoints(pts), new T.LineBasicMaterial({ color }));
      grp.add(line);
      const dot = new T.SphereGeometry(0.13, 8, 6);
      pts.forEach((p) => {
        const m = new T.Mesh(dot, new T.MeshLambertMaterial({ color }));
        m.position.copy(p);
        m.userData.lane = li;
        grp.add(m);
      });
      const floor = new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(-width / 2, 0, 0), new T.Vector3(width / 2, 0, 0)]), new T.LineBasicMaterial({ color: 0x8a7f72, transparent: true, opacity: 0.5 }));
      grp.add(floor);
      grp.position.z = zFor(li);
      S.scene.add(grp);
      return { grp, fill, z: zFor(li), goal: zFor(li) };
    });
    function place() {
      const d = depth();
      objs.forEach((o, li) => (o.goal = zFor(d[li])));
    }
    place();
    objs.forEach((o) => (o.grp.position.z = o.goal));
    // a time axis along the front
    const axis = new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(-width / 2, -0.3, zFor(0) + 1), new T.Vector3(width / 2, -0.3, zFor(0) + 1)]), new T.LineBasicMaterial({ color: 0x1c1712 }));
    S.scene.add(axis);

    function paint() {
      const sel = st.sel[0] || "";
      const d = depth();
      objs.forEach((o, li) => {
        const on = lanes[li].id && lanes[li].id === sel;
        o.fill.material.opacity = on ? 0.75 : sel ? 0.16 : swipe ? (d[li] === 0 ? 0.6 : 0.3) : 0.38;
      });
    }
    function setLabels() {
      labels.innerHTML =
        lanes.map((l, li) => `<div data-lane="${li}" class="lane${st.sel[0] && l.id === st.sel[0] ? " sel" : ""}" style="--c:${FAMILY_COLOR[l.family]}">${esc(l.label)}<small>${l.move < 0.05 ? "holds" : "moves " + l.move.toFixed(1)}</small></div>`).join("") +
        film.rows.map((r) => `<div class="tick">${esc(r)}</div>`).join("");
    }
    S.afterRender = () => {
      const els = labels.children;
      lanes.forEach((l, li) => {
        const el = els[li];
        const q = S.project([-width / 2 - 0.4, (l.vals.find((x) => x != null) || 0) * H, objs[li].grp.position.z]);
        el.style.display = q.vis ? "" : "none";
        el.style.left = q.x + "px";
        el.style.top = q.y + "px";
      });
      film.rows.forEach((r, i) => {
        const el = els[lanes.length + i];
        const q = S.project([-width / 2 + i * STEP, -0.7, zFor(0) + 1]);
        el.style.display = q.vis && (N <= 16 || i % Math.ceil(N / 16) === 0) ? "" : "none";
        el.style.left = q.x + "px";
        el.style.top = q.y + "px";
      });
    };
    let moving = false;
    S.onFrame = () => {
      if (!moving) return;
      let still = true;
      objs.forEach((o) => {
        const dz = o.goal - o.grp.position.z;
        if (Math.abs(dz) > 0.01) {
          o.grp.position.z += dz * 0.18;
          still = false;
        } else o.grp.position.z = o.goal;
      });
      if (still) moving = false;
    };
    function shift(dir) {
      if (dir === "front") order.push(order.shift());
      else order.unshift(order.pop());
      place();
      moving = true;
      paint();
    }
    function pickLane(e) {
      S.aim(e);
      const hit = S.ray.intersectObjects(objs.map((o) => o.grp), true).find((h) => h.object.userData.lane != null);
      return hit ? hit.object.userData.lane : -1;
    }
    // Like a deck of cards: the lane you click (or whose name you click) comes to the front.
    function toFront(li) {
      if (order[0] !== li) {
        while (order[0] !== li) order.push(order.shift());
        place();
        moving = true;
      }
      paint();
    }
    S.onClick = (e) => {
      const li = pickLane(e);
      if (li < 0) return;
      toFront(li);
      if (lanes[li].id) select(lanes[li].id);
    };
    labels.addEventListener("click", (e) => {
      const d = e.target.closest("[data-lane]");
      if (!d) return;
      const li = +d.dataset.lane;
      toFront(li);
      if (lanes[li].id) select(lanes[li].id);
    });
    S.onDouble = (e) => {
      const li = pickLane(e);
      S.aim(e);
      const hit = S.ray.intersectObjects(objs.map((o) => o.grp), true)[0];
      if (hit) S.zoomTo(hit.point.toArray(), 1.5);
      if (li >= 0 && lanes[li].id && !st.sel.includes(lanes[li].id)) select(lanes[li].id);
    };
    if (swipe) S.onSwipe = (d) => shift(d === "right" ? "front" : "back");
    host.addEventListener("keydown", (e) => {
      if (!swipe) return;
      if (e.key === "ArrowRight") shift("front");
      else if (e.key === "ArrowLeft") shift("back");
      else return;
      e.preventDefault();
    });
    host.addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      const c = b.dataset.c;
      if (c === "front" || c === "back") shift(c);
      if (c === "home") S.home();
      if (c === "side") S.flyTo([0, H / 2, 0], S.orb.r, { theta: Math.PI / 2 - 0.05, phi: 1.2 });
      if (c === "spin") b.classList.toggle("on", (S.orb.spin = !S.orb.spin));
    });
    function update() {
      paint();
      setLabels();
    }
    setLabels();
    S.start();
    return {
      update,
      focus: (id) => {
        const li = lanes.findIndex((l) => l.id === g.real(id));
        if (li >= 0) toFront(li);
      },
      stage: S,
      order: () => order.map((li) => lanes[li].label),
      lanes: () => lanes.map((l) => ({ id: l.id, label: l.label, move: l.move })),
      toFront,
      example: film.example,
      shift,
      destroy: S.destroy,
    };
  }


  /* ---------- one category, any view ----------
     Every view can show the whole map or one category: one of the six groups ("fam:feeling") or one workspace
     ("ws:emotion"). The category's graph keeps only its own items and the ties between them; g.full is the whole
     map, used inside a cube so every tie still shows there. */
  function subGraph(g, cat) {
    if (!cat || cat === "all") return Object.assign({}, g, { full: g, cat: "" });
    const [kind, key] = cat.split(":");
    const nodes = g.nodes.filter((n) => (kind === "fam" ? n.family === key : n.group === key));
    if (!nodes.length) return Object.assign({}, g, { full: g, cat: "" });
    const keep = new Set(nodes.map((n) => n.id));
    const edges = g.edges.filter((e) => keep.has(e.a) && keep.has(e.b));
    const adj = new Map(nodes.map((n) => [n.id, []]));
    edges.forEach((e) => {
      adj.get(e.a).push({ id: e.b, edge: e, out: true });
      adj.get(e.b).push({ id: e.a, edge: e, out: false });
    });
    return Object.assign({}, g, {
      nodes,
      byId: new Map(nodes.map((n) => [n.id, n])),
      edges,
      links: (id) => adj.get(g.real(id)) || [],
      families: g.families.filter((f) => nodes.some((n) => n.family === f.id)),
      full: g,
      cat,
    });
  }

  /* Values for any list of ids over the film's moments: what the user recorded or adjusted (st.rec) first, then
     the open film's own automation, then a gentle example line from the id (marked example). */
  function lanesFor(g, ids, st) {
    const film = filmLanes(g.full || g);
    const real = film.example ? new Map() : new Map(film.lanes.filter((l) => l.id).map((l) => [l.id, l]));
    const N = film.rows.length;
    const full = g.full || g;
    const lanes = ids
      .filter((id) => full.byId.has(id))
      .map((id) => {
        const nd = full.byId.get(id);
        const rec = st && st.rec && Array.isArray(st.rec[id]) && st.rec[id].length === N ? st.rec[id] : null;
        const own = real.get(id);
        const h = hashOf(id);
        const amp = 0.1 + (h % 7) * 0.05;
        const f = 0.3 + (h % 5) * 0.12;
        const vals = rec ? rec.slice() : own ? own.vals.slice() : Array.from({ length: N }, (_, i) => Math.max(0, Math.min(1, 0.5 + amp * Math.sin(i * f + h))));
        return { id, label: nd.label, family: nd.family, vals, example: !rec && !own, recorded: !!rec };
      });
    return { lanes, rows: film.rows, N };
  }
  const svgLane = (vals, W, H, cls) => {
    const N = vals.length;
    const x = (i) => 4 + (i * (W - 8)) / Math.max(1, N - 1);
    const y = (v) => H - 4 - (v == null ? 0 : v) * (H - 8);
    const pts = vals.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
    return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" class="${cls || ""}"><polygon points="4,${H} ${pts} ${W - 4},${H}" /><polyline points="${pts}" />${vals.map((v, i) => `<circle cx="${x(i).toFixed(1)}" cy="${y(v).toFixed(1)}" r="2.6" />`).join("")}</svg>`;
  };
  function htmlView(stage, cls, render) {
    const box = document.createElement("div");
    box.className = "rl-html " + cls;
    stage.appendChild(box);
    const api = render(box) || {};
    const v = Object.assign({ update: () => {}, focus: () => {}, destroy: () => box.remove(), box }, api);
    v.inner = () => v;
    return v;
  }

  /* ---------- Graph & pie ----------
     Left, a pie of the category by group (how much of it each workspace is); click a slice to light that group.
     Right, the flat graph: every item a node round a circle, sorted by group, and every tie a line bent toward
     the middle. Click a node and its lines and names light up. */
  function graphView(stage, g, st, select) {
    return htmlView(stage, "rl-gp", (box) => {
      let lit = "";
      const byGroup = new Map();
      g.nodes.forEach((n) => {
        const k = g.cat ? n.group : n.family;
        if (!byGroup.has(k)) byGroup.set(k, { key: k, label: g.cat ? n.groupLabel : (g.families.find((f) => f.id === n.family) || {}).label || n.family, family: n.family, ids: [] });
        byGroup.get(k).ids.push(n.id);
      });
      const groups = [...byGroup.values()];
      const order = groups.flatMap((gr) => gr.ids);
      const W = 640;
      const c = W / 2;
      const R = 250;
      const pos = new Map(order.map((id, i) => { const a = -Math.PI / 2 + (i / order.length) * Math.PI * 2; return [id, [c + R * Math.cos(a), c + R * Math.sin(a), a]]; }));
      const groupOf = new Map();
      groups.forEach((gr) => gr.ids.forEach((id) => groupOf.set(id, gr.key)));
      function pie() {
        const total = order.length;
        let a0 = -Math.PI / 2;
        const pc = 150;
        const pr = 130;
        return `<svg viewBox="0 0 300 300" class="rl-gp-pie">${groups
          .map((gr, k) => {
            const a1 = a0 + (gr.ids.length / total) * Math.PI * 2;
            const mid = (a0 + a1) / 2;
            const off = lit === gr.key ? 10 : 0;
            const ox = Math.cos(mid) * off;
            const oy = Math.sin(mid) * off;
            const big = a1 - a0 > Math.PI ? 1 : 0;
            const d = groups.length === 1 ? `M${pc},${pc - pr} A${pr},${pr} 0 1 1 ${pc - 0.01},${pc - pr} Z` : `M${pc + ox},${pc + oy} L${pc + ox + pr * Math.cos(a0)},${pc + oy + pr * Math.sin(a0)} A${pr},${pr} 0 ${big} 1 ${pc + ox + pr * Math.cos(a1)},${pc + oy + pr * Math.sin(a1)} Z`;
            a0 = a1;
            return `<path d="${d}" fill="${FAMILY_COLOR[gr.family]}" fill-opacity="${0.45 + (k % 5) * 0.12}" data-group="${esc(gr.key)}"><title>${esc(gr.label)}: ${gr.ids.length}</title></path>`;
          })
          .join("")}</svg><div class="rl-key">${groups.map((gr) => `<button data-group="${esc(gr.key)}" class="${lit === gr.key ? "on" : ""}" style="--c:${FAMILY_COLOR[gr.family]}">${esc(gr.label)} <b>${gr.ids.length}</b></button>`).join("")}</div>`;
      }
      function graph() {
        const sel = new Set(st.sel.filter((id) => pos.has(id)));
        const near = new Set();
        sel.forEach((id) => g.links(id).forEach((l) => near.add(l.id)));
        const bend = (a, b) => `M${a[0].toFixed(1)},${a[1].toFixed(1)} Q${(c + (a[0] + b[0] - 2 * c) * 0.25).toFixed(1)},${(c + (a[1] + b[1] - 2 * c) * 0.25).toFixed(1)} ${b[0].toFixed(1)},${b[1].toFixed(1)}`;
        const quiet = g.edges.filter((e) => pos.has(e.a) && pos.has(e.b) && !sel.has(e.a) && !sel.has(e.b)).slice(0, 2500);
        const loud = g.edges.filter((e) => sel.has(e.a) || sel.has(e.b)).filter((e) => pos.has(e.a) && pos.has(e.b));
        const small = order.length > 300;
        const named = order.length <= 60 ? order : [...sel, ...near].filter((id) => pos.has(id));
        const label = (id) => {
          const p = pos.get(id);
          let deg = (p[2] * 180) / Math.PI;
          const flip = Math.cos(p[2]) < 0;
          if (flip) deg += 180;
          const t = g.byId.get(id).label;
          return `<text transform="translate(${p[0].toFixed(1)} ${p[1].toFixed(1)}) rotate(${deg.toFixed(1)})" x="${flip ? -8 : 8}" y="3" text-anchor="${flip ? "end" : "start"}" class="${sel.has(id) ? "me" : ""}">${esc(t.length > 28 ? t.slice(0, 27) + "…" : t)}</text>`;
        };
        return `<svg viewBox="-110 -110 ${W + 220} ${W + 220}" class="rl-gp-graph${sel.size ? " has-sel" : ""}">
          ${quiet.map((e) => `<path d="${bend(pos.get(e.a), pos.get(e.b))}" class="q" stroke="${TYPE_COLOR[e.type]}" />`).join("")}
          ${loud.map((e) => `<path d="${bend(pos.get(e.a), pos.get(e.b))}" class="l" stroke="${TYPE_COLOR[e.type]}" />`).join("")}
          ${order.map((id) => { const p = pos.get(id); const n = g.byId.get(id); const on = sel.has(id); const nr = near.has(id); const dim = (sel.size && !on && !nr) || (lit && groupOf.get(id) !== lit); return `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="${on ? 7 : nr ? 5 : small ? 2.6 : 4}" fill="${on ? "#1c1712" : FAMILY_COLOR[n.family]}" opacity="${dim ? 0.25 : 1}" data-id="${esc(id)}"><title>${esc(n.label)} · ${esc(n.groupLabel)}</title></circle>`; }).join("")}
          ${named.map(label).join("")}
        </svg>`;
      }
      function draw() {
        box.innerHTML = `<div class="rl-gp-left">${pie()}</div><div class="rl-gp-right">${graph()}</div>`;
      }
      box.addEventListener("click", (e) => {
        const t = e.target.closest("[data-group],[data-id]");
        if (!t) return;
        if (t.dataset.group) {
          lit = lit === t.dataset.group ? "" : t.dataset.group;
          return draw();
        }
        select(st.sel[0] === t.dataset.id ? [] : t.dataset.id);
      });
      draw();
      return { update: draw, lit: () => lit, groups: () => groups.map((gr) => ({ key: gr.key, n: gr.ids.length })) };
    });
  }

  /* ---------- Storyboard ----------
     The film zoomed out: one card per moment, and in each card a coloured box for the curiosity holding front and
     center then (the one changing most), with a smaller box for the runner-up when it is close. */
  function frontOf(lanes, i) {
    return lanes
      .map((l) => ({ l, s: i ? Math.abs((l.vals[i] || 0) - (l.vals[i - 1] || 0)) : Math.abs((l.vals[0] || 0) - 0.5) * 0.5, up: i ? (l.vals[i] || 0) >= (l.vals[i - 1] || 0) : true }))
      .sort((a, b) => b.s - a.s);
  }
  function storyView(stage, g, st, select) {
    return htmlView(stage, "rl-story", (box) => {
      const film = filmLanes(g);
      const lanes = lanesFor(g, film.lanes.map((l) => l.id).filter(Boolean), st).lanes;
      function draw() {
        const sel = st.sel[0];
        box.innerHTML = `<p class="rl-innote">${film.example ? "Example film. " : ""}What holds front and center at each moment: the curiosity that changes the most, then the runner-up.</p><div class="rl-cards">${film.rows
          .map((r, i) => {
            const f = frontOf(lanes, i);
            const a = f[0];
            const b = f[1] && f[1].s > 0.02 && f[1].s >= a.s * 0.5 ? f[1] : null;
            const box1 = (x, big) => `<button class="rl-fc${big ? " big" : ""}${x.l.id === sel ? " sel" : ""}" data-id="${esc(x.l.id)}" style="--c:${FAMILY_COLOR[x.l.family]}">${esc(x.l.label)}<small>${x.up ? "rises" : "falls"}${x.s > 0.001 ? " " + Math.round(x.s * 100) : ""}</small></button>`;
            const rest = f.slice(b ? 2 : 1).map((x) => `<i style="--c:${FAMILY_COLOR[x.l.family]}" title="${esc(x.l.label)}"></i>`).join("");
            const hold = lanes.some((l) => l.id === sel) && (a.l.id === sel || (b && b.l.id === sel));
            return `<div class="rl-card${hold ? " hold" : ""}"><h4>${esc(r)}</h4>${box1(a, true)}${b ? box1(b, false) : ""}<div class="rl-rest">${rest}</div></div>`;
          })
          .join("")}</div>`;
      }
      box.addEventListener("click", (e) => {
        const t = e.target.closest("[data-id]");
        if (t && t.dataset.id) select(t.dataset.id);
      });
      draw();
      return { update: draw, fronts: () => film.rows.map((_, i) => frontOf(lanes, i)[0].l.id) };
    });
  }

  /* ---------- Tracks (Ableton Live style) ----------
     One track per suite, top to bottom. A track is a group: its lane is the mix of its parts, and ▸ opens it to
     show each part's own lane and the proximities (Sparks) that run between its parts. ⚙ opens a pop-up with a
     slider per part: move them at the playhead, or press Record and Play and your moves are written into the
     lanes as the playhead passes, without opening the group. */
  function tracksView(stage, g, st, select, persist) {
    return htmlView(stage, "rl-tracks", (box) => {
      const inCat = new Set(g.nodes.map((n) => n.id));
      const all = (g.suites || [])
        .map((s, i) => ({ key: "s" + i + ":" + s.label, label: s.label, ids: [...new Set((s.members || []).map((m) => m.curiosity).filter((id) => (g.full || g).byId.has(id)))] }))
        .filter((s) => s.ids.length && s.ids.some((id) => inCat.has(id)))
        .sort((a, b) => b.ids.filter((id) => inCat.has(id)).length - a.ids.filter((id) => inCat.has(id)).length || a.label.localeCompare(b.label));
      const CAP = 40;
      const suites = all.slice(0, CAP);
      const film = filmLanes(g.full || g);
      const N = film.rows.length;
      let pop = null;
      const list = document.createElement("div");
      list.className = "rl-tlist";
      box.appendChild(list);
      const valsOf = (ids) => {
        const ls = lanesFor(g, ids, st).lanes;
        return { ls, mix: Array.from({ length: N }, (_, i) => ls.reduce((a, l) => a + (l.vals[i] || 0), 0) / Math.max(1, ls.length)) };
      };
      const sparksIn = (s) => (g.proximities || []).filter((p) => p.when && p.then && s.ids.includes(p.when.curiosity) && s.ids.includes(p.then.curiosity));
      function draw() {
        const ruler = `<div class="rl-track rl-ruler"><div></div><svg viewBox="0 0 600 16" preserveAspectRatio="none">${film.rows.map((r, i) => `<text x="${4 + (i * 592) / Math.max(1, N - 1)}" y="12" text-anchor="${i === 0 ? "start" : i === N - 1 ? "end" : "middle"}">${i + 1}</text>`).join("")}</svg></div>`;
        list.innerHTML = `<p class="rl-innote">${suites.length} suites${all.length > CAP ? ` (the ${CAP} with the most parts here; ${all.length - CAP} more)` : ""}. Each track is a suite: its lane is the mix of its parts.${film.example ? " Example values until a film is open." : ""}</p>${ruler}${suites
          .map((s) => {
            const open = st.open.includes(s.key);
            const v = valsOf(s.ids);
            const fam = ((g.full || g).byId.get(s.ids[0]) || {}).family;
            const sp = sparksIn(s);
            const head = `<div class="rl-track rl-suite${open ? " open" : ""}" style="--c:${FAMILY_COLOR[fam] || "#888"}"><div class="rl-thead"><button class="rl-tog" data-tog="${esc(s.key)}" aria-label="${open ? "Close" : "Open"} the group">${open ? "▾" : "▸"}</button><span class="rl-tlabel">${esc(s.label)}<small>Suite · ${s.ids.length} parts${sp.length ? " · " + sp.length + " sparks" : ""}${v.ls.some((l) => l.recorded) ? " · recorded" : ""}</small></span><button class="rl-adj" data-adj="${esc(s.key)}" title="Adjust and record the parts">⚙</button></div>${svgLane(v.mix, 600, 44)}</div>`;
            if (!open) return head;
            return (
              head +
              v.ls.map((l) => `<div class="rl-track rl-part" style="--c:${FAMILY_COLOR[l.family]}"><button class="rl-tname" data-id="${esc(l.id)}">${esc(l.label)}<small>${l.recorded ? "recorded" : l.example ? "example" : "from the film"}</small></button>${svgLane(l.vals, 600, 36)}</div>`).join("") +
              (sp.length ? `<div class="rl-sparks">Sparks inside: ${sp.slice(0, 8).map((p) => esc(p.label)).join(" · ")}${sp.length > 8 ? " …" : ""}</div>` : "")
            );
          })
          .join("")}`;
      }
      function openPop(key) {
        closePop();
        const s = suites.find((x) => x.key === key);
        if (!s) return;
        const el = document.createElement("div");
        el.className = "rl-pop";
        let at = 0;
        let rec = false;
        let timer = 0;
        const held = new Map();
        el.innerHTML = `<header><b>${esc(s.label)}</b><button data-p="close" aria-label="Close">×</button></header>
          <div class="rl-pop-play"><button data-p="play">▶ Play</button><button data-p="rec">● Record</button><label>Moment <input type="range" min="1" max="${N}" value="1" data-p="at"><span>1</span></label><button data-p="clear">Clear recording</button></div>
          <div class="rl-pop-parts">${s.ids.map((id) => `<label><span>${esc((g.full || g).byId.get(id).label)}</span><input type="range" min="0" max="100" data-id="${esc(id)}"><b></b></label>`).join("")}</div>
          <p class="rl-innote">Move a slider to set that part at this moment. With Record on, press Play and hold a slider: your moves are written in as the playhead passes.</p>`;
        const now = () => valsOf(s.ids).ls;
        function show() {
          el.querySelector('[data-p="at"]').value = String(at + 1);
          el.querySelector('[data-p="at"] + span').textContent = String(at + 1);
          const ls = now();
          el.querySelectorAll(".rl-pop-parts input").forEach((inp) => {
            const l = ls.find((x) => x.id === inp.dataset.id);
            if (!l || held.has(inp.dataset.id)) return;
            inp.value = String(Math.round((l.vals[at] || 0) * 100));
            inp.nextElementSibling.textContent = inp.value;
          });
        }
        function write(id, v) {
          const l = now().find((x) => x.id === id);
          if (!l) return;
          const vals = l.vals.slice();
          vals[at] = v;
          st.rec[id] = vals;
        }
        function tick() {
          at = (at + 1) % N;
          if (rec) held.forEach((v, id) => write(id, v));
          if (rec && held.size) persist();
          show();
          draw();
        }
        el.addEventListener("input", (e) => {
          const t = e.target;
          if (t.dataset.p === "at") {
            at = +t.value - 1;
            return show();
          }
          if (!t.dataset.id) return;
          const v = +t.value / 100;
          t.nextElementSibling.textContent = t.value;
          if (held.has(t.dataset.id)) held.set(t.dataset.id, v);
          write(t.dataset.id, v);
          persist();
          draw();
        });
        el.addEventListener("pointerdown", (e) => e.target.dataset && e.target.dataset.id && held.set(e.target.dataset.id, +e.target.value / 100));
        const let_go = () => held.clear();
        el.addEventListener("pointerup", let_go);
        el.addEventListener("pointercancel", let_go);
        el.addEventListener("click", (e) => {
          const b = e.target.closest("[data-p]");
          if (!b || b.tagName === "INPUT") return;
          const c = b.dataset.p;
          if (c === "close") return closePop();
          if (c === "rec") b.classList.toggle("on", (rec = !rec));
          if (c === "play") {
            if (timer) {
              clearInterval(timer);
              timer = 0;
              b.textContent = "▶ Play";
            } else {
              timer = setInterval(tick, 450);
              b.textContent = "■ Stop";
            }
          }
          if (c === "clear") {
            s.ids.forEach((id) => delete st.rec[id]);
            persist();
            show();
            draw();
          }
        });
        pop = { el, key, stop: () => clearInterval(timer), state: () => ({ at, rec, playing: !!timer }), write: (id, v) => { write(id, v); persist(); draw(); }, tick };
        box.appendChild(el);
        show();
      }
      function closePop() {
        if (!pop) return;
        pop.stop();
        pop.el.remove();
        pop = null;
      }
      box.addEventListener("click", (e) => {
        const t = e.target.closest("[data-tog],[data-adj],.rl-tname[data-id]");
        if (!t) return;
        if (t.dataset.tog) {
          const k = t.dataset.tog;
          st.open = st.open.includes(k) ? st.open.filter((x) => x !== k) : st.open.concat(k);
          persist();
          return draw();
        }
        if (t.dataset.adj) return openPop(t.dataset.adj);
        if (t.dataset.id) select(t.dataset.id);
      });
      draw();
      return {
        update: () => {},
        suites: () => suites.map((s) => ({ key: s.key, label: s.label, ids: s.ids })),
        pop: () => pop,
        destroy: () => {
          closePop();
          box.remove();
        },
      };
    });
  }

  /* ---------- Inside a cube ----------
     The lanes of one cube: its own curiosity first, then everything it is directly tied to, each with the film's
     own values where the open film has that lane, else a gentle example line (marked "example"). */
  function hashOf(id) {
    let h = 7;
    for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 100003;
    return h;
  }
  function cubeLanes(g, id, cap) {
    const film = filmLanes(g);
    const real = film.example ? new Map() : new Map(film.lanes.filter((l) => l.id).map((l) => [l.id, l]));
    const rows = film.rows;
    const N = rows.length;
    const tieOf = (l) => g.types[l.edge.type][l.out ? "label" : "back"];
    const seen = new Set([id]);
    const list = [{ id, why: "This cube" }];
    g.links(id).forEach((l) => {
      if (seen.has(l.id)) return;
      seen.add(l.id);
      list.push({ id: l.id, why: tieOf(l) });
    });
    const lanes = list.slice(0, cap || 16).map((x) => {
      const nd = g.byId.get(x.id);
      const own = real.get(x.id);
      const h = hashOf(x.id);
      const amp = 0.1 + (h % 7) * 0.05;
      const f = 0.3 + (h % 5) * 0.12;
      const vals = own ? own.vals : Array.from({ length: N }, (_, i) => Math.max(0, Math.min(1, 0.5 + amp * Math.sin(i * f + h))));
      return { id: x.id, label: nd.label, family: nd.family, why: x.why, vals, example: !own };
    });
    return { lanes, rows, example: lanes.every((l) => l.example), more: Math.max(0, list.length - (cap || 16)) };
  }
  /* Two steps out: what this cube is tied to (ring 1), and what those are tied to (ring 2). Changing anything in
     ring 2 changes something in ring 1, which changes this cube. */
  function webOf(g, id) {
    const one = new Map();
    g.links(id).forEach((l) => one.has(l.id) || one.set(l.id, l));
    const two = new Map(); // id -> the ring-1 ids it comes through
    one.forEach((_, a) =>
      g.links(a).forEach((l) => {
        if (l.id === id || one.has(l.id)) return;
        if (!two.has(l.id)) two.set(l.id, []);
        if (!two.get(l.id).includes(a)) two.get(l.id).push(a);
      })
    );
    return { one, two };
  }

  function insideView(host, g, st, id, act) {
    g = g.full || g;
    const nd = g.byId.get(id);
    const box = document.createElement("div");
    box.className = "rl-inside";
    box.innerHTML = `<header><div><span class="rl-tag" style="color:${FAMILY_COLOR[nd.family]}">Inside the cube</span><h3>${esc(nd.label)}</h3></div>
        <div class="rl-seg" role="tablist"><button data-tab="tracks" class="on">Lanes</button><button data-tab="flatgraph">Graph</button><button data-tab="graph">3D graph</button><button data-tab="pie">Pie</button><button data-tab="web">Curiosity proximity</button></div>
        <button data-tab="leave">Leave the cube</button></header><div class="rl-inbody"></div>`;
    host.appendChild(box);
    const body = box.querySelector(".rl-inbody");
    const film = cubeLanes(g, id);
    let sub = null;
    function show(tab) {
      sub && sub.destroy && sub.destroy();
      sub = null;
      box.querySelectorAll("[data-tab]").forEach((b) => b.classList.toggle("on", b.dataset.tab === tab));
      box.dataset.tab = tab;
      if (tab === "tracks") body.innerHTML = tracksHtml();
      if (tab === "web") body.innerHTML = webHtml();
      if (tab === "flatgraph") body.innerHTML = graphHtml();
      if (tab === "pie") body.innerHTML = pieHtml();
      if (tab === "graph") {
        body.innerHTML = '<div class="rl-cube rl-ingraph"><div class="rl-labels"></div><div class="rl-filmnote"></div><div class="rl-cube-ui"><button data-c="home">Straight on</button><button data-c="side">From the side</button><button data-c="spin">Spin</button></div></div>';
        const h = body.firstChild;
        const f = Object.assign({}, film, { note: (film.example ? "Example values. " : "") + "The curiosities tied to " + nd.label + ", busiest at the back." });
        sub = initLanes(h, g, st, act.select, null, false, f);
      }
    }
    // Stacked tracks, like Ableton Live's automation lanes: a name strip on the left, the lane over time on the right.
    function tracksHtml() {
      const N = film.rows.length;
      const W = 600;
      const H = 44;
      const x = (i) => 6 + (i * (W - 12)) / Math.max(1, N - 1);
      const y = (v) => H - 5 - (v == null ? 0 : v) * (H - 10);
      const ruler = `<div class="rl-track rl-ruler"><div></div><svg viewBox="0 0 ${W} 16" preserveAspectRatio="none">${film.rows.map((r, i) => `<text x="${x(i)}" y="12" text-anchor="${i === 0 ? "start" : i === N - 1 ? "end" : "middle"}">${i + 1}</text>`).join("")}</svg></div>`;
      const rows = film.lanes
        .map((l, li) => {
          const pts = l.vals.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
          return `<div class="rl-track${li === 0 ? " own" : ""}" style="--c:${FAMILY_COLOR[l.family]}">
            <button class="rl-tname" data-go="${esc(l.id)}" title="Go to this cube">${esc(l.label)}<small>${esc(l.why)}${l.example ? " · example" : ""}</small></button>
            <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"><polygon points="6,${H} ${pts} ${W - 6},${H}" /><polyline points="${pts}" />${l.vals.map((v, i) => `<circle cx="${x(i).toFixed(1)}" cy="${y(v).toFixed(1)}" r="3" />`).join("")}</svg></div>`;
        })
        .join("");
      return `<p class="rl-innote">${film.example ? "Example values: open a film on the Screen and these lanes show its own automation." : "The open film's automation for this cube and its ties."}${film.more ? ` ${film.more} more ties not shown.` : ""}</p>${ruler}${rows}`;
    }
    // Graph: every lane on one flat chart, time across, value up; the cube's own lane drawn thick.
    function graphHtml() {
      const N = film.rows.length;
      const W = 720;
      const H = 300;
      const x = (i) => 40 + (i * (W - 60)) / Math.max(1, N - 1);
      const y = (v) => H - 24 - (v == null ? 0 : v) * (H - 44);
      const grid = [0, 0.25, 0.5, 0.75, 1].map((v) => `<line x1="40" x2="${W - 20}" y1="${y(v)}" y2="${y(v)}" class="g" /><text x="34" y="${y(v) + 3}" text-anchor="end">${Math.round(v * 100)}</text>`).join("") + film.rows.map((r, i) => `<text x="${x(i)}" y="${H - 6}" text-anchor="middle">${i + 1}</text>`).join("");
      const lines = film.lanes
        .slice()
        .reverse()
        .map((l, k) => `<polyline points="${l.vals.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ")}" stroke="${FAMILY_COLOR[l.family]}" class="${l.id === id ? "own" : ""}" data-go="${esc(l.id)}"><title>${esc(l.label)}</title></polyline>`)
        .join("");
      const key = film.lanes.map((l) => `<button data-go="${esc(l.id)}" style="--c:${FAMILY_COLOR[l.family]}">${esc(l.label)}</button>`).join("");
      return `<p class="rl-innote">Every lane tied to this cube on one chart: across is time, up is where the lane sits on its scale (0 to 100). The thick line is ${esc(nd.label)}.</p><svg viewBox="0 0 ${W} ${H}" class="rl-graph">${grid}${lines}</svg><div class="rl-key">${key}</div>`;
    }
    // Pie: how much of all the movement in these lanes each one makes; the cube's own slice pulled out.
    function pieHtml() {
      const parts = film.lanes.map((l) => ({ l, m: movementOf(l.vals) + 0.02 }));
      const total = parts.reduce((a, p) => a + p.m, 0);
      const R = 130;
      const c = 160;
      let a0 = -Math.PI / 2;
      const slices = parts
        .map((p) => {
          const a1 = a0 + (p.m / total) * Math.PI * 2;
          const mid = (a0 + a1) / 2;
          const off = p.l.id === id ? 10 : 0;
          const ox = Math.cos(mid) * off;
          const oy = Math.sin(mid) * off;
          const big = a1 - a0 > Math.PI ? 1 : 0;
          const d = `M${c + ox},${c + oy} L${c + ox + R * Math.cos(a0)},${c + oy + R * Math.sin(a0)} A${R},${R} 0 ${big} 1 ${c + ox + R * Math.cos(a1)},${c + oy + R * Math.sin(a1)} Z`;
          a0 = a1;
          return `<path d="${d}" fill="${FAMILY_COLOR[p.l.family]}" fill-opacity="${0.45 + (hashOf(p.l.id) % 5) * 0.12}" data-go="${esc(p.l.id)}"><title>${esc(p.l.label)}: ${Math.round((p.m / total) * 100)}%</title></path>`;
        })
        .join("");
      const key = parts
        .slice()
        .sort((a, b) => b.m - a.m)
        .map((p) => `<button data-go="${esc(p.l.id)}" style="--c:${FAMILY_COLOR[p.l.family]}">${esc(p.l.label)} <b>${Math.round((p.m / total) * 100)}%</b></button>`)
        .join("");
      return `<p class="rl-innote">Who moves the most: each slice is one lane's share of all the change in these lanes over the film. ${esc(nd.label)}'s slice is pulled out.</p><div class="rl-pie"><svg viewBox="0 0 320 320">${slices}</svg><div class="rl-key">${key}</div></div>`;
    }
    function webHtml() {
      const w = webOf(g, id);
      const one = [...w.one.keys()];
      const two = [...w.two.keys()].sort((a, b) => w.two.get(b).length - w.two.get(a).length);
      const S = 520;
      const c = S / 2;
      const at = (k, cnt, r, off) => {
        const a = off + (k / Math.max(1, cnt)) * Math.PI * 2;
        return [c + r * Math.cos(a), c + r * Math.sin(a)];
      };
      const p1 = new Map(one.map((o, k) => [o, at(k, one.length, 95, -Math.PI / 2)]));
      const shown2 = two.slice(0, 120);
      const p2 = new Map(shown2.map((o, k) => [o, at(k, shown2.length, 240, -Math.PI / 2 + 0.02)]));
      const col = (x) => FAMILY_COLOR[g.byId.get(x).family] || "#888";
      // ring-1 names run outward like spokes, so many of them never sit on top of each other
      const spoke = (o, p) => {
        let deg = (Math.atan2(p[1] - c, p[0] - c) * 180) / Math.PI;
        const flip = deg > 90 || deg < -90;
        if (flip) deg += 180;
        const t = esc(g.byId.get(o).label);
        return `<text transform="translate(${p[0].toFixed(1)} ${p[1].toFixed(1)}) rotate(${deg.toFixed(1)})" x="${flip ? -12 : 12}" y="3" text-anchor="${flip ? "end" : "start"}" class="r1">${t.length > 26 ? t.slice(0, 25) + "…" : t}</text>`;
      };
      const lines = one.map((o) => `<line x1="${c}" y1="${c}" x2="${p1.get(o)[0]}" y2="${p1.get(o)[1]}" class="l1" />`).join("") + shown2.map((o) => w.two.get(o).map((a) => `<line x1="${p1.get(a)[0]}" y1="${p1.get(a)[1]}" x2="${p2.get(o)[0]}" y2="${p2.get(o)[1]}" class="l2" />`).join("")).join("");
      const dots = shown2.map((o) => `<circle cx="${p2.get(o)[0]}" cy="${p2.get(o)[1]}" r="5" fill="${col(o)}" data-go="${esc(o)}"><title>${esc(g.byId.get(o).label)} (through ${esc(w.two.get(o).map((a) => g.byId.get(a).label).join(", "))})</title></circle>`).join("") + one.map((o) => `<g data-go="${esc(o)}"><circle cx="${p1.get(o)[0]}" cy="${p1.get(o)[1]}" r="8" fill="${col(o)}" />${spoke(o, p1.get(o))}<title>${esc(g.byId.get(o).label)}</title></g>`).join("") + `<circle cx="${c}" cy="${c}" r="15" fill="#1c1712" /><text x="${c}" y="${c + 32}" text-anchor="middle" class="me">${esc(nd.label)}</text>`;
      const groups = one
        .map((a) => {
          const via = two.filter((o) => w.two.get(o).includes(a));
          if (!via.length) return "";
          return `<div class="rl-via"><button data-go="${esc(a)}" style="--c:${col(a)}">${esc(g.byId.get(a).label)}</button> is touched by ${via.slice(0, 14).map((o) => `<button data-go="${esc(o)}" style="--c:${col(o)}">${esc(g.byId.get(o).label)}</button>`).join("")}${via.length > 14 ? ` <span>+${via.length - 14}</span>` : ""}</div>`;
        })
        .join("");
      return `<p class="rl-innote">${one.length} things are tied to this cube, and ${two.length} more are tied to those. Change any outer one and it changes something that affects ${esc(nd.label)}.${two.length > shown2.length ? ` The ${shown2.length} with the most paths in are drawn.` : ""}</p>
        <div class="rl-web"><svg viewBox="0 0 ${S} ${S}" class="rl-websvg">${lines}${dots}</svg><div class="rl-vias">${groups || "<p>Nothing further out yet.</p>"}</div></div>`;
    }
    box.addEventListener("click", (e) => {
      const t = e.target.closest("[data-tab],[data-go]");
      if (!t) return;
      if (t.dataset.tab === "leave") return act.leave();
      if (t.dataset.tab) return show(t.dataset.tab);
      if (t.dataset.go) act.go(t.dataset.go);
    });
    show("tracks");
    return {
      id,
      tab: () => box.dataset.tab,
      show,
      web: () => webOf(g, id),
      lanes: () => film.lanes.map((l) => l.id),
      destroy: () => {
        sub && sub.destroy && sub.destroy();
        box.remove();
      },
    };
  }

  /* Full-page over the app, with its own close button. */
  function open() {
    let wrap = document.querySelector(".rl-overlay");
    if (wrap) return wrap.querySelector(".rl")._curioRelations;
    wrap = document.createElement("div");
    wrap.className = "rl-overlay";
    wrap.style.cssText = "position:fixed;inset:0;z-index:900;overflow:auto;padding:12px;background:var(--paper,#f7efe2)";
    wrap.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><h1 style="font-family:var(--serif,serif);font-weight:500;margin:0;font-size:24px">Relationship map</h1><button class="rl-close" style="font-family:var(--mono,monospace);border:2px solid #1c1712;background:#fffaf2;padding:5px 9px;cursor:pointer">Close</button></div><div></div>';
    document.body.appendChild(wrap);
    const api = mount(wrap.lastChild);
    wrap.querySelector(".rl-close").onclick = () => {
      api && api.destroy();
      wrap.remove();
    };
    return api;
  }

  root.CurioRelations = { mount, open, KEY, VIEWS, blockLayout, movementOf };
})(typeof window !== "undefined" ? window : globalThis);
