/* relations/relations.js: the relationship map. Every curiosity, feeling, movement, character trait and the people
   traits react to, shown two ways:

   - Flat matrix: six columns (Character, Feeling, Body & movement, Camera & look, Sound & words, Story & cut),
     each split by workspace. Click a curiosity and lines run to everything it is directly tied to.
   - Layers: flat grids stacked like the slices of a cube (six, or one per workspace). Swipe right and the front
     layer goes to the back; swipe left and the back one comes to the front.
   - 3D cube: the same six columns as six slabs of a cube. Drag to spin it all the way round; once inside, dragging
     looks around you. Double-click flies closer to what you clicked, and again goes further in, like a map.
     "Show every proximity" draws the whole web of cause and effect; "Move curiosities" lets you drag them.
   - Your own: Add a curiosity, and Tie to… draws a line from one thing to another. Kept on this device with the
     moves, in localStorage "curio-relations-v1".
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
      view: ["flat", "layers", "cube"].includes(saved.view) ? saved.view : "flat",
      sel: [],
      picked: saved.picked || [],
      mine: { nodes: (saved.mine && saved.mine.nodes) || [], ties: (saved.mine && saved.mine.ties) || [] },
      moved: saved.moved || {},
      layerBy: saved.layerBy === "workspace" ? "workspace" : "family",
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
    let g = G.build(G.fromDB(db), A, st.mine);
    st.picked = st.picked.filter((id) => g.byId.has(id));
    const persist = () => save({ view: st.view, picked: st.picked, mine: st.mine, place: st.mine.place, moved: st.moved, layerBy: st.layerBy, showAll: st.showAll });
    /* After the user adds or removes something: build the graph again and redraw, keeping the camera. */
    function rebuild() {
      g = G.build(G.fromDB(db), A, st.mine);
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
          <button data-view="flat">Flat matrix</button><button data-view="layers">Layers</button><button data-view="cube">3D cube</button>
        </div>
        <div class="rl-find"><input type="search" placeholder="Find a curiosity, feeling or movement" aria-label="Find"><div class="rl-hits"></div></div>
        <button data-act="archive">Movement archive</button>
        <button data-act="add">Add a curiosity</button>
        <button data-act="clear">Clear selection</button>
      </div>
      <div class="rl-grid">
        <div class="rl-stage"></div>
        <aside class="rl-side"></aside>
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
          ${st.moved[n.id] ? `<button data-act="unmove" data-id="${esc(n.id)}">Put back in its place</button>` : ""}
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
        g = G.build(G.fromDB(db), A, st.mine); // so the new curiosity counts as a database one for its first tie
        if (near && !addProximity(near, id)) st.mine.ties.push({ a: near, b: id });
      } else {
        id = "mine-" + name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
        while (g.byId.has(id)) id += "-2";
        st.mine.nodes.push({ id, label: name, plain, family });
        if (near) st.mine.ties.push({ a: near, b: id });
      }
      // Put it beside what it is tied to, so it is easy to find in the cube.
      if (near && view && view.posOf) {
        const p = view.posOf(near);
        if (p) st.moved[id] = [p[0] + 3, p[1] + 3, p[2] + 3];
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
        delete st.moved[id];
        st.sel = [];
        return rebuild();
      }
      if (b.dataset.act === "unmove") {
        delete st.moved[b.dataset.id];
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
    function setView(v) {
      st.view = v;
      persist();
      el.querySelectorAll("[data-view]").forEach((b) => b.classList.toggle("on", b.dataset.view === v));
      view && view.destroy();
      stage.innerHTML = "";
      const keep = (st.camera = view && view.camera ? view.camera() || st.camera : st.camera);
      view = v === "cube" ? cubeView(stage, g, st, select, persist, keep) : v === "layers" ? layersView(stage, g, st, select, persist) : flatView(stage, g, st, select, nearSet);
      view.update();
    }

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

  /* ---------- layers: flat matrices stacked like the slices of a cube ----------
     Each layer is one flat grid of curiosities (one per group, or one per workspace). Swipe right (or press the
     right arrow) and the front layer goes to the back; swipe left and the back layer comes to the front. Picking a
     curiosity lights its ties on every layer: lines on the front layer, a count on each layer's tab. */
  function layersView(stage, g, st, select, persist) {
    const wrap = document.createElement("div");
    wrap.className = "rl-layers";
    wrap.tabIndex = 0;
    wrap.setAttribute("aria-label", "Layers: swipe or use the arrow keys to move through them");
    stage.appendChild(wrap);
    let layers = [];
    let order = [];
    let cellOf = new Map();
    let layerOf = new Map();

    function build() {
      if (st.layerBy === "workspace") {
        const groups = [];
        g.families.forEach((f) =>
          g.nodes
            .filter((n) => n.family === f.id)
            .forEach((n) => {
              let gr = groups.find((x) => x.key === n.group);
              if (!gr) groups.push((gr = { key: n.group, label: n.groupLabel, family: f.id, nodes: [] }));
              gr.nodes.push(n);
            })
        );
        layers = groups;
      } else layers = g.families.map((f) => ({ key: f.id, label: f.label, family: f.id, nodes: g.nodes.filter((n) => n.family === f.id) }));
      order = layers.map((_, i) => i);
      wrap.innerHTML = `<div class="rl-ltop">
          <div class="rl-seg" role="group" aria-label="Layers by"><button data-by="family">6 layers</button><button data-by="workspace">${layers.length > 6 ? layers.length : "One per workspace"} layers</button></div>
          <button data-move="back" aria-label="Bring the back layer to the front">◀ Back to front</button>
          <button data-move="front" aria-label="Send the front layer to the back">Front to back ▶</button>
        </div>
        <div class="rl-tabs"></div>
        <div class="rl-stack">${layers
          .map(
            (L, i) => `<section class="rl-layer" data-i="${i}" style="--c:${FAMILY_COLOR[L.family]}">
              <h3>${esc(L.label)} <span class="rl-tag">${L.nodes.length}</span></h3>
              <div class="rl-lscroll"><div class="rl-cells">${L.nodes
                .map((n) => `<button class="rl-cell${n.kind === "mine" ? " mine" : ""}" data-id="${esc(n.id)}" title="${esc(n.plain)}">${esc(n.label)}</button>`)
                .join("")}<svg class="rl-svg" xmlns="http://www.w3.org/2000/svg"></svg></div></div>
            </section>`
          )
          .join("")}</div>
        <p class="rl-hint-l">Swipe right to send the front layer to the back, left to bring the back one forward. Arrow keys work too.</p>`;
      wrap.querySelectorAll("[data-by]").forEach((b) => b.classList.toggle("on", b.dataset.by === st.layerBy));
      if (st.layerBy === "workspace") wrap.querySelector('[data-by="workspace"]').textContent = layers.length + " layers";
      cellOf = new Map([...wrap.querySelectorAll(".rl-cell")].map((b) => [b.dataset.id, b]));
      layerOf = new Map();
      layers.forEach((L, i) => L.nodes.forEach((n) => layerOf.set(n.id, i)));
    }

    function place() {
      const els = wrap.querySelectorAll(".rl-layer");
      order.forEach((li, d) => {
        const el = els[li];
        el.style.transform = `translate3d(${d * 14}px, ${-d * 14}px, ${-d * 40}px)`;
        el.style.zIndex = String(500 - d);
        el.style.opacity = d > 7 ? "0" : String(1 - d * 0.1);
        el.classList.toggle("front", d === 0);
        el.setAttribute("aria-hidden", d === 0 ? "false" : "true");
      });
      tabs();
      lines();
    }
    function counts() {
      const c = new Map();
      st.sel.forEach((id) =>
        g.links(id).forEach((l) => {
          const li = layerOf.get(l.id);
          if (li != null) c.set(li, (c.get(li) || 0) + 1);
        })
      );
      return c;
    }
    function tabs() {
      const c = counts();
      wrap.querySelector(".rl-tabs").innerHTML = order
        .map((li, d) => `<button data-layer="${li}" class="${d === 0 ? "on" : ""}" style="--c:${FAMILY_COLOR[layers[li].family]}">${esc(layers[li].label)}${c.get(li) ? ` <b>${c.get(li)}</b>` : ""}</button>`)
        .join("");
    }
    function lines() {
      const front = wrap.querySelector(".rl-layer.front");
      wrap.querySelectorAll(".rl-svg").forEach((s) => (s.innerHTML = ""));
      if (!front || !st.sel.length) return;
      const cells = front.querySelector(".rl-cells");
      const svg = cells.querySelector(".rl-svg");
      svg.setAttribute("width", cells.scrollWidth);
      svg.setAttribute("height", cells.scrollHeight);
      const o = cells.getBoundingClientRect();
      const mid = (b) => {
        const r = b.getBoundingClientRect();
        return [r.left - o.left + r.width / 2, r.top - o.top + r.height / 2];
      };
      let out = "";
      st.sel.forEach((id) => {
        const a = cellOf.get(id);
        if (!a || !front.contains(a)) return;
        const [x1, y1] = mid(a);
        g.links(id).forEach((l) => {
          const b = cellOf.get(l.id);
          if (!b || !front.contains(b)) return;
          const [x2, y2] = mid(b);
          out += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${TYPE_COLOR[l.edge.type]}" stroke-width="2" opacity="0.75"/>`;
        });
      });
      svg.innerHTML = out;
    }
    function update() {
      const near = new Map();
      st.sel.forEach((id) => g.links(id).forEach((l) => near.set(l.id, l)));
      cellOf.forEach((b, id) => {
        b.classList.toggle("sel", st.sel.includes(id));
        const l = !st.sel.includes(id) && near.get(id);
        b.classList.toggle("near", !!l);
        if (l) b.style.setProperty("--t", TYPE_COLOR[l.edge.type]);
      });
      wrap.classList.toggle("has-sel", st.sel.length > 0);
      tabs();
      lines();
    }
    function spin(dir) {
      if (dir === "front") order.push(order.shift());
      else order.unshift(order.pop());
      place();
    }
    function bring(li) {
      while (order[0] !== li) order.push(order.shift());
      place();
    }

    let down = null;
    let swiped = false;
    wrap.addEventListener("pointerdown", (e) => {
      if (e.target.closest(".rl-ltop, .rl-tabs")) return;
      down = { x: e.clientX, y: e.clientY };
      swiped = false;
    });
    wrap.addEventListener("pointerup", (e) => {
      if (!down) return;
      const dx = e.clientX - down.x;
      const dy = e.clientY - down.y;
      down = null;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.3) {
        swiped = true;
        spin(dx > 0 ? "front" : "back");
      }
    });
    wrap.addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      if (b.dataset.move) return spin(b.dataset.move);
      if (b.dataset.layer) return bring(+b.dataset.layer);
      if (b.dataset.by) {
        st.layerBy = b.dataset.by;
        persist();
        build();
        place();
        return update();
      }
      if (b.dataset.id && !swiped) select(st.sel.length === 1 && st.sel[0] === b.dataset.id && !st.tieFrom ? [] : b.dataset.id);
    });
    wrap.addEventListener("keydown", (e) => {
      if (e.target.closest("input")) return;
      if (e.key === "ArrowRight") spin("front");
      else if (e.key === "ArrowLeft") spin("back");
      else return;
      e.preventDefault();
    });
    // a sideways trackpad swipe counts too
    let wheelX = 0;
    let wheelT = 0;
    wrap.addEventListener("wheel", (e) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault();
      const now = performance.now();
      if (now - wheelT > 400) wheelX = 0;
      wheelT = now;
      wheelX += e.deltaX;
      if (Math.abs(wheelX) > 120) {
        spin(wheelX < 0 ? "front" : "back");
        wheelX = 0;
        wheelT = now + 500;
      }
    }, { passive: false });
    const onResize = () => lines();
    window.addEventListener("resize", onResize);

    build();
    place();
    return {
      update,
      focus: (id) => {
        const li = layerOf.get(g.real(id));
        if (li != null) bring(li);
      },
      spin,
      order: () => order.map((li) => layers[li].label),
      destroy: () => window.removeEventListener("resize", onResize),
    };
  }

  /* ---------- 3D cube ---------- */
  function cubeView(stage, g, st, select, persist, keep) {
    const host = document.createElement("div");
    host.className = "rl-cube";
    host.innerHTML = `<div class="rl-labels"></div><div class="rl-tip"></div>
      <div class="rl-cube-ui"><button data-c="out">Fly out</button><button data-c="in">Fly to the middle</button><button data-c="spin">Spin</button><button data-c="all">Show every proximity</button><button data-c="move">Move curiosities</button></div>
      <div class="rl-hint">Drag to turn · double-click to fly closer, again to go further in · scroll or pinch to zoom</div>`;
    stage.appendChild(host);
    let alive = true;
    let ctx = null;
    const pending = { focus: null };
    loadThree().then((ok) => {
      if (!alive) return;
      if (!ok) {
        host.innerHTML = '<p class="rl-note">The 3D cube needs three.js, which loads from cdnjs. Check the connection and reload. The flat matrix and the layers still work.</p>';
        return;
      }
      ctx = initCube(host, g, st, select, persist, keep);
      ctx.update();
      if (pending.focus) ctx.focus(pending.focus);
    });
    return {
      update: () => ctx && ctx.update(),
      focus: (id) => (ctx ? ctx.focus(id) : (pending.focus = id)),
      posOf: (id) => (ctx ? ctx.pos.get(id) : null),
      camera: () => (ctx ? ctx.cameraState() : keep),
      inner: () => ctx,
      destroy: () => {
        alive = false;
        ctx && ctx.destroy();
      },
    };
  }

  /* Positions: the six families are six slabs along x; inside a slab, nodes fill a square grid on y and z,
     ordered by workspace so each workspace sits together. The whole cube spans -50..50 on every axis.
     Curiosities the user made sit in the middle of their slab; anything the user dragged keeps where they put it. */
  function layout(g, moved) {
    const pos = new Map();
    const F = g.families.length;
    g.families.forEach((f, fi) => {
      const ns = g.nodes.filter((n) => n.family === f.id && n.kind !== "mine").sort((a, b) => (a.kind === "curiosity") - (b.kind === "curiosity") || (a.group < b.group ? -1 : a.group > b.group ? 1 : 0));
      const side = Math.ceil(Math.sqrt(ns.length));
      const x = -50 + (100 * (fi + 0.5)) / F;
      ns.forEach((n, i) => {
        const r = Math.floor(i / side);
        const c = i % side;
        const y = 46 - (92 * r) / Math.max(1, side - 1);
        const z = -46 + (92 * c) / Math.max(1, side - 1);
        // a small x jitter keeps rows from lining up into one flat sheet
        pos.set(n.id, [x + ((r + c) % 3) * 2 - 2, y, z]);
      });
      g.nodes.filter((n) => n.family === f.id && n.kind === "mine").forEach((n, i) => pos.set(n.id, [x + 4, ((i % 5) - 2) * 6, Math.floor(i / 5) * 6]));
    });
    Object.keys(moved || {}).forEach((id) => pos.has(id) && Array.isArray(moved[id]) && pos.set(id, moved[id].slice(0, 3)));
    return pos;
  }

  function initCube(host, g, st, select, persist, keep) {
    const T = root.THREE;
    const labels = host.querySelector(".rl-labels");
    const tip = host.querySelector(".rl-tip");
    const renderer = new T.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(2, root.devicePixelRatio || 1));
    host.insertBefore(renderer.domElement, host.firstChild);
    const scene = new T.Scene();
    const camera = new T.PerspectiveCamera(60, 1, 0.1, 2000);
    scene.add(new T.AmbientLight(0xffffff, 0.75));
    const sun = new T.DirectionalLight(0xffffff, 0.6);
    sun.position.set(80, 120, 60);
    scene.add(sun);

    scene.add(new T.LineSegments(new T.EdgesGeometry(new T.BoxGeometry(108, 108, 108)), new T.LineBasicMaterial({ color: 0x8a7f72, transparent: true, opacity: 0.5 })));
    const F = g.families.length;
    for (let i = 1; i < F; i++) {
      const wall = new T.LineSegments(new T.EdgesGeometry(new T.PlaneGeometry(108, 108)), new T.LineBasicMaterial({ color: 0x8a7f72, transparent: true, opacity: 0.18 }));
      wall.rotation.y = Math.PI / 2;
      wall.position.x = -50 + (100 * i) / F;
      scene.add(wall);
    }

    const pos = layout(g, st.moved);
    const nodes = g.nodes;
    const mesh = new T.InstancedMesh(new T.SphereGeometry(1, 12, 8), new T.MeshLambertMaterial({ color: 0xffffff }), nodes.length);
    const base = nodes.map((n) => new T.Color(n.kind === "mine" ? "#1c1712" : FAMILY_COLOR[n.family] || "#888"));
    const grey = new T.Color(0xd9d0c3);
    const m4 = new T.Matrix4();
    const col = new T.Color();
    let near = new Map();
    function paintOne(i) {
      const n = nodes[i];
      const p = pos.get(n.id);
      const isSel = st.sel.includes(n.id);
      const isNear = near.has(n.id);
      const s = isSel ? 2 : isNear ? 1.6 : n.kind === "curiosity" ? 0.9 : 1.15;
      m4.makeScale(s, s, s).setPosition(p[0], p[1], p[2]);
      mesh.setMatrixAt(i, m4);
      col.copy(base[i]);
      if (st.sel.length && !isSel && !isNear) col.lerp(grey, 0.8);
      if (isSel) col.set(0x1c1712);
      mesh.setColorAt(i, col);
    }
    function paint() {
      nodes.forEach((n, i) => paintOne(i));
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }
    paint(); // colours must exist before the first render, or three.js builds the material without them
    scene.add(mesh);

    /* Lines: the selection's ties, bright; with "Show every proximity", every proximity and every tie the
       user drew, faint, so the whole web of cause and effect shows. */
    let lines = null;
    let web = null;
    function segs(list, alpha) {
      const v = [];
      const c = [];
      list.forEach((e) => {
        const a = pos.get(e.a);
        const b = pos.get(e.b);
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
      if (!o) return null;
      scene.remove(o);
      o.geometry.dispose();
      return null;
    }
    function drawLines() {
      lines = drop(lines);
      web = drop(web);
      if (st.showAll) scene.add((web = segs(g.edges.filter((e) => e.type === "leads" || e.type === "mine"), st.sel.length ? 0.12 : 0.3)));
      if (!st.sel.length) return;
      const list = [];
      st.sel.forEach((id) => g.links(id).forEach((l) => list.push(l.edge)));
      scene.add((lines = segs(list, 0.85)));
    }

    /* The camera: it sits at `eye` and looks along (theta, phi), `r` units ahead to `target`. Dragging turns the
       camera where it stands, so inside the cube you look all the way round you. Double-click flies toward what was
       clicked and halves the distance each time, like zooming into a map. */
    const orb = { target: new T.Vector3(0, 0, 0), r: 210, theta: 0.7, phi: 1.15, spin: false };
    if (keep) {
      orb.target.set(keep.target[0], keep.target[1], keep.target[2]);
      orb.r = keep.r;
      orb.theta = keep.theta;
      orb.phi = keep.phi;
    }
    const dir = () => new T.Vector3(Math.sin(orb.phi) * Math.sin(orb.theta), Math.cos(orb.phi), Math.sin(orb.phi) * Math.cos(orb.theta));
    let fly = null;
    function flyTo(target, r) {
      fly = { from: orb.target.clone(), to: new T.Vector3(target[0], target[1], target[2]), r0: orb.r, r1: r, start: performance.now() };
    }
    function placeCamera() {
      camera.position.copy(orb.target).addScaledVector(dir(), orb.r);
      camera.lookAt(orb.target);
    }
    const inside = () => Math.abs(camera.position.x) < 54 && Math.abs(camera.position.y) < 54 && Math.abs(camera.position.z) < 54;

    // Labels: the selected nodes, their direct ties (up to 60), and the six slab names.
    let labelIds = [];
    const slabs = g.families.map((f, i) => ({ f, p: [-50 + (100 * (i + 0.5)) / F, 58, 0] }));
    function setLabels() {
      labelIds = st.sel.concat([...near.keys()].slice(0, 60));
      labels.innerHTML =
        labelIds.map((id) => `<div class="${st.sel.includes(id) ? "sel" : ""}">${esc(g.byId.get(id).label)}</div>`).join("") +
        slabs.map((s) => `<div class="slab" style="--c:${FAMILY_COLOR[s.f.id]}">${esc(s.f.label)}</div>`).join("");
    }
    const v3 = new T.Vector3();
    function placeLabels() {
      const w = host.clientWidth;
      const h = host.clientHeight;
      const els = labels.children;
      const put = (el, p) => {
        if (!el) return;
        v3.set(p[0], p[1], p[2]).project(camera);
        const vis = v3.z < 1 && v3.z > -1 && Math.abs(v3.x) < 1.1 && Math.abs(v3.y) < 1.1;
        el.style.display = vis ? "" : "none";
        if (vis) {
          el.style.left = ((v3.x + 1) / 2) * w + "px";
          el.style.top = ((1 - v3.y) / 2) * h + "px";
        }
      };
      labelIds.forEach((id, i) => put(els[i], pos.get(id)));
      slabs.forEach((s, i) => put(els[labelIds.length + i], s.p));
    }

    function update() {
      near = new Map();
      st.sel.forEach((id) => g.links(id).forEach((l) => near.set(l.id, l)));
      st.sel.forEach((id) => near.delete(id));
      paint();
      drawLines();
      setLabels();
    }
    function focus(id) {
      const p = pos.get(g.real(id));
      if (p) flyTo(p, 30);
    }

    /* Pointer: drag turns, click selects, double-click flies in, wheel and pinch zoom; in Move mode, dragging a
       curiosity carries it across the screen at its own depth and it stays there (saved on this device). */
    const ray = new T.Raycaster();
    const mouse = new T.Vector2();
    const cv = renderer.domElement;
    function aim(e) {
      const r = cv.getBoundingClientRect();
      mouse.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(mouse, camera);
    }
    function pick(e) {
      aim(e);
      const hit = ray.intersectObject(mesh)[0];
      return hit ? nodes[hit.instanceId] : null;
    }
    let moveMode = false;
    let carry = null;
    const ptrs = new Map();
    let drag = null;
    let pinch = 0;
    cv.addEventListener("pointerdown", (e) => {
      cv.setPointerCapture(e.pointerId);
      ptrs.set(e.pointerId, [e.clientX, e.clientY]);
      drag = { x: e.clientX, y: e.clientY, moved: 0 };
      orb.spin = false;
      fly = null;
      if (moveMode && ptrs.size === 1) {
        const n = pick(e);
        if (n) {
          const p = pos.get(n.id);
          const normal = new T.Vector3();
          camera.getWorldDirection(normal);
          carry = { id: n.id, plane: new T.Plane().setFromNormalAndCoplanarPoint(normal, new T.Vector3(p[0], p[1], p[2])) };
          cv.style.cursor = "grabbing";
        }
      }
      if (ptrs.size === 2) {
        const [a, b] = [...ptrs.values()];
        pinch = Math.hypot(a[0] - b[0], a[1] - b[1]);
        carry = null;
      }
    });
    const hitPoint = new T.Vector3();
    cv.addEventListener("pointermove", (e) => {
      if (ptrs.has(e.pointerId)) ptrs.set(e.pointerId, [e.clientX, e.clientY]);
      if (ptrs.size === 2) {
        const [a, b] = [...ptrs.values()];
        const d = Math.hypot(a[0] - b[0], a[1] - b[1]);
        if (pinch) orb.r = Math.max(1.5, Math.min(500, orb.r * (pinch / d)));
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
        tip.style.display = "none";
        if (carry) {
          aim(e);
          if (ray.ray.intersectPlane(carry.plane, hitPoint)) {
            const p = [hitPoint.x, hitPoint.y, hitPoint.z].map((v) => Math.round(v * 10) / 10);
            pos.set(carry.id, p);
            st.moved[carry.id] = p;
            paintOne(nodes.indexOf(g.byId.get(carry.id)));
            mesh.instanceMatrix.needsUpdate = true;
            drawLines();
          }
          return;
        }
        if (inside() || orb.r < 60) {
          // Look around from where you stand: the eye stays put, the target swings round it.
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
      const n = pick(e);
      if (n) {
        const r = host.getBoundingClientRect();
        tip.textContent = n.label + " · " + n.groupLabel;
        tip.style.display = "block";
        tip.style.left = e.clientX - r.left + 12 + "px";
        tip.style.top = e.clientY - r.top + 12 + "px";
      } else tip.style.display = "none";
    });
    const up = (e) => {
      ptrs.delete(e.pointerId);
      if (ptrs.size < 2) pinch = 0;
      if (carry) {
        if (drag && drag.moved >= 4) persist();
        else delete st.moved[carry.id];
        carry = null;
        cv.style.cursor = "";
      }
      if (drag && drag.moved < 6 && ptrs.size === 0) {
        const n = pick(e);
        if (n) select(st.sel.length === 1 && st.sel[0] === n.id && !st.tieFrom ? [] : n.id);
      }
      if (ptrs.size === 0) drag = null;
    };
    cv.addEventListener("pointerup", up);
    cv.addEventListener("pointercancel", up);
    cv.addEventListener("dblclick", (e) => {
      const n = pick(e);
      const r1 = Math.max(4, orb.r * 0.45);
      if (n) {
        if (!st.sel.includes(n.id)) select(n.id);
        return flyTo(pos.get(n.id), Math.min(r1, 60));
      }
      // Empty space: fly toward the curiosity nearest to where you clicked (within a few degrees), so you
      // always land somewhere; with none near, fly toward the spot at the depth you are looking at now.
      aim(e);
      const o = ray.ray.origin;
      const d = ray.ray.direction;
      let best = null;
      let bestA = 0.12;
      const q = new T.Vector3();
      pos.forEach((p) => {
        q.set(p[0], p[1], p[2]).sub(o);
        const along = q.dot(d);
        if (along <= 1) return;
        const ang = Math.acos(Math.min(1, along / q.length()));
        if (ang < bestA) {
          bestA = ang;
          best = p;
        }
      });
      const p = best || ray.ray.at(orb.r, new T.Vector3()).toArray();
      flyTo(p, r1);
    });
    cv.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
        orb.r = Math.max(1.5, Math.min(500, orb.r * Math.exp(e.deltaY * 0.001)));
      },
      { passive: false }
    );
    host.querySelector(".rl-cube-ui").addEventListener("click", (e) => {
      const b = e.target.closest("button");
      const c = b && b.dataset.c;
      if (c === "out") flyTo([0, 0, 0], 210);
      if (c === "in") flyTo([0, 0, 0], 30);
      if (c === "spin") b.classList.toggle("on", (orb.spin = !orb.spin));
      if (c === "all") {
        st.showAll = !st.showAll;
        persist();
        drawLines();
      }
      if (c === "move") moveMode = !moveMode;
      sync();
    });
    function sync() {
      const ui = host.querySelector(".rl-cube-ui");
      ui.querySelector('[data-c="all"]').classList.toggle("on", st.showAll);
      ui.querySelector('[data-c="move"]').classList.toggle("on", moveMode);
      host.querySelector(".rl-hint").textContent = moveMode
        ? "Move: drag a curiosity to put it somewhere else · it stays there on this device"
        : "Drag to turn · double-click to fly closer, again to go further in · scroll or pinch to zoom";
    }
    sync();

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
        if (t >= 1) fly = null;
      }
      if (orb.spin) orb.theta += 0.004;
      placeCamera();
      renderer.render(scene, camera);
      placeLabels();
    }
    setLabels();
    frame();
    return {
      update,
      focus,
      flyTo,
      orbit: orb,
      camera,
      pos,
      host,
      cameraState: () => ({ target: [orb.target.x, orb.target.y, orb.target.z], r: orb.r, theta: orb.theta, phi: orb.phi }),
      destroy: () => {
        cancelAnimationFrame(raf);
        renderer.dispose();
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

  root.CurioRelations = { mount, open, layout, KEY };
})(typeof window !== "undefined" ? window : globalThis);
