/* relations/relations.js: the relationship map. Every curiosity, feeling, movement, character trait and the people
   traits react to, shown two ways:

   - Flat matrix: six columns (Character, Feeling, Body & movement, Camera & look, Sound & words, Story & cut),
     each split by workspace. Click a curiosity and lines run to everything it is directly tied to.
   - 3D cube: the same six columns as six slabs of a cube. Drag to spin it all the way round, scroll or pinch to
     zoom, click to select, double-click a curiosity to fly inside the cube to it (double-click empty space to fly
     to the middle, or back out).
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
  const TYPE_COLOR = { leads: "#c45c26", suite: "#2d6fb8", shows: "#d13b3b", feels: "#b04a7a", reacts: "#7a3fb0", moves: "#2f8a57", film: "#8a7a2d", word: "#6b5f52" };
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
    const g = G.build(G.fromDB(db), A);
    const saved = load();
    const st = { view: saved.view === "cube" ? "cube" : "flat", sel: [], picked: (saved.picked || []).filter((id) => g.byId.has(id)) };
    const persist = () => save({ view: st.view, picked: st.picked });

    el.classList.add("rl");
    el.innerHTML = `
      <div class="rl-bar">
        <div class="rl-seg" role="group" aria-label="View">
          <button data-view="flat">Flat matrix</button><button data-view="cube">3D cube</button>
        </div>
        <div class="rl-find"><input type="search" placeholder="Find a curiosity, feeling or movement" aria-label="Find"><div class="rl-hits"></div></div>
        <button data-act="archive">Movement archive</button>
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
    function select(ids) {
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
      if (!st.sel.length) {
        side.innerHTML = `<h2>Relationship map</h2>
          <p>${g.nodes.length} curiosities, feelings, movements, traits and people, with ${g.edges.length.toLocaleString()} direct ties between them.</p>
          <p>Click any one to see lines to everything it is directly tied to. Try <button class="rl-try" data-id="tr-suspicious-authority">Suspicious of authority</button>.</p>
          <p>In the 3D cube, drag to spin, scroll or pinch to zoom, and double-click to fly inside.</p>
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
          ${isFeeling ? `<button data-act="archive" data-feeling="${esc(n.id)}">Movements for this feeling</button>` : ""}
          ${n.kind === "movement" ? `<button data-act="pick" data-id="${esc(n.id)}">${st.picked.includes(n.id) ? "Unpick" : "Pick"} this movement</button>` : ""}
        </div>
        ${linkGroups(n.id)
          .map((gr) => `<div class="rl-sub"><i style="--c:${TYPE_COLOR[gr.type]}"></i>${esc(gr.name)} (${gr.items.length})</div>
            <div class="rl-links">${gr.items.map((l) => linkBtn(l.id, l.edge.type === "suite" || l.edge.type === "leads" ? l.edge.why[0] + (l.edge.why.length > 1 || l.edge.more ? " +" + (l.edge.why.length - 1 + (l.edge.more || 0)) : "") : "", TYPE_COLOR[gr.type])).join("")}</div>`)
          .join("") || "<p>Nothing is tied to this yet.</p>"}`;
    }
    function linkBtn(id, why, color) {
      const m = g.byId.get(id);
      return `<button data-id="${esc(id)}" style="--c:${color}" title="${esc(m.plain)}">${esc(m.label)}${why ? `<small>${esc(why)}</small>` : ""}</button>`;
    }
    side.addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      if (b.dataset.act === "archive") return openArchive(b.dataset.feeling);
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
    });

    /* ---------- views ---------- */
    let view = null;
    function setView(v) {
      st.view = v;
      persist();
      el.querySelectorAll("[data-view]").forEach((b) => b.classList.toggle("on", b.dataset.view === v));
      view && view.destroy();
      stage.innerHTML = "";
      view = v === "cube" ? cubeView(stage, g, st, select) : flatView(stage, g, st, select, nearSet);
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
    const api = { graph: g, view: () => view, select, setView, openArchive, selected: () => st.sel.slice(), picked: () => st.picked.slice(), destroy: () => view && view.destroy() };
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

  /* ---------- 3D cube ---------- */
  function cubeView(stage, g, st, select) {
    const host = document.createElement("div");
    host.className = "rl-cube";
    host.innerHTML = `<div class="rl-labels"></div><div class="rl-tip"></div>
      <div class="rl-cube-ui"><button data-c="out">Fly out</button><button data-c="in">Fly to the middle</button><button data-c="spin">Spin</button></div>
      <div class="rl-hint">Drag to spin · scroll or pinch to zoom · double-click to fly inside</div>`;
    stage.appendChild(host);
    let alive = true;
    let ctx = null;
    const pending = { update: false, focus: null };
    loadThree().then((ok) => {
      if (!alive) return;
      if (!ok) {
        host.innerHTML = '<p class="rl-note">The 3D cube needs three.js, which loads from cdnjs. Check the connection and reload. The flat matrix still works.</p>';
        return;
      }
      ctx = initCube(host, g, st, select);
      ctx.update();
      if (pending.focus) ctx.focus(pending.focus);
    });
    return {
      update: () => (ctx ? ctx.update() : (pending.update = true)),
      focus: (id) => (ctx ? ctx.focus(id) : (pending.focus = id)),
      inner: () => ctx,
      destroy: () => {
        alive = false;
        ctx && ctx.destroy();
      },
    };
  }

  /* Positions: the six families are six slabs along x; inside a slab, nodes fill a square grid on y and z,
     ordered by workspace so each workspace sits together. The whole cube spans -50..50 on every axis. */
  function layout(g) {
    const pos = new Map();
    const F = g.families.length;
    g.families.forEach((f, fi) => {
      const ns = g.nodes.filter((n) => n.family === f.id).sort((a, b) => (a.kind === "curiosity") - (b.kind === "curiosity") || (a.group < b.group ? -1 : a.group > b.group ? 1 : 0));
      const side = Math.ceil(Math.sqrt(ns.length));
      const x = -50 + (100 * (fi + 0.5)) / F;
      ns.forEach((n, i) => {
        const r = Math.floor(i / side);
        const c = i % side;
        const y = 46 - (92 * r) / Math.max(1, side - 1);
        const z = -46 + (92 * c) / Math.max(1, side - 1);
        // a small x jitter by group keeps rows from lining up into one flat sheet
        pos.set(n.id, [x + ((r + c) % 3) * 2 - 2, y, z]);
      });
    });
    return pos;
  }

  function initCube(host, g, st, select) {
    const T = root.THREE;
    const labels = host.querySelector(".rl-labels");
    const tip = host.querySelector(".rl-tip");
    const renderer = new T.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(2, root.devicePixelRatio || 1));
    host.insertBefore(renderer.domElement, host.firstChild);
    const scene = new T.Scene();
    const camera = new T.PerspectiveCamera(55, 1, 0.1, 2000);
    scene.add(new T.AmbientLight(0xffffff, 0.75));
    const sun = new T.DirectionalLight(0xffffff, 0.6);
    sun.position.set(80, 120, 60);
    scene.add(sun);

    const box = new T.LineSegments(new T.EdgesGeometry(new T.BoxGeometry(108, 108, 108)), new T.LineBasicMaterial({ color: 0x8a7f72, transparent: true, opacity: 0.5 }));
    scene.add(box);
    // faint walls between the slabs
    const F = g.families.length;
    for (let i = 1; i < F; i++) {
      const x = -50 + (100 * i) / F;
      const wall = new T.LineSegments(new T.EdgesGeometry(new T.PlaneGeometry(108, 108)), new T.LineBasicMaterial({ color: 0x8a7f72, transparent: true, opacity: 0.18 }));
      wall.rotation.y = Math.PI / 2;
      wall.position.x = x;
      scene.add(wall);
    }

    const pos = layout(g);
    const nodes = g.nodes;
    const index = new Map(nodes.map((n, i) => [n.id, i]));
    const mesh = new T.InstancedMesh(new T.SphereGeometry(1, 12, 8), new T.MeshLambertMaterial({ color: 0xffffff }), nodes.length);
    const base = nodes.map((n) => new T.Color(FAMILY_COLOR[n.family] || "#888"));
    const m4 = new T.Matrix4();
    const col = new T.Color();
    function paint(near) {
      const has = st.sel.length > 0;
      nodes.forEach((n, i) => {
        const p = pos.get(n.id);
        const isSel = st.sel.includes(n.id);
        const isNear = near && near.has(n.id);
        const s = isSel ? 2 : isNear ? 1.6 : n.kind === "curiosity" ? 0.9 : 1.15;
        m4.makeScale(s, s, s).setPosition(p[0], p[1], p[2]);
        mesh.setMatrixAt(i, m4);
        col.copy(base[i]);
        if (has && !isSel && !isNear) col.lerp(new T.Color(0xd9d0c3), 0.8);
        if (isSel) col.set(0x1c1712);
        mesh.setColorAt(i, col);
      });
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }
    paint(null); // colours must exist before the first render, or three.js builds the material without them
    scene.add(mesh);

    let lines = null;
    function drawLines(near) {
      if (lines) {
        scene.remove(lines);
        lines.geometry.dispose();
      }
      lines = null;
      if (!st.sel.length) return;
      const v = [];
      const c = [];
      st.sel.forEach((id) => {
        const a = pos.get(id);
        g.links(id).forEach((l) => {
          const b = pos.get(l.id);
          const k = new T.Color(TYPE_COLOR[l.edge.type]);
          v.push(a[0], a[1], a[2], b[0], b[1], b[2]);
          c.push(k.r, k.g, k.b, k.r, k.g, k.b);
        });
      });
      const geo = new T.BufferGeometry();
      geo.setAttribute("position", new T.Float32BufferAttribute(v, 3));
      geo.setAttribute("color", new T.Float32BufferAttribute(c, 3));
      lines = new T.LineSegments(geo, new T.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.85 }));
      scene.add(lines);
    }

    /* Orbit: theta/phi around a target, r away. Fly = ease target and r toward new values. */
    const orb = { target: new T.Vector3(0, 0, 0), r: 210, theta: 0.7, phi: 1.15, spin: false };
    let fly = null;
    function flyTo(target, r) {
      fly = { from: orb.target.clone(), to: new T.Vector3(...target), r0: orb.r, r1: r, t: 0, start: performance.now() };
    }
    function placeCamera() {
      const o = orb;
      camera.position.set(o.target.x + o.r * Math.sin(o.phi) * Math.sin(o.theta), o.target.y + o.r * Math.cos(o.phi), o.target.z + o.r * Math.sin(o.phi) * Math.cos(o.theta));
      camera.lookAt(o.target);
    }

    // Labels: the selected nodes, their direct ties (up to 60), and the six slab names.
    let labelIds = [];
    const slabs = g.families.map((f, i) => ({ f, p: new T.Vector3(-50 + (100 * (i + 0.5)) / F, 58, 0) }));
    function setLabels(near) {
      labelIds = st.sel.concat([...(near ? near.keys() : [])].slice(0, 60));
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
      slabs.forEach((s, i) => put(els[labelIds.length + i], [s.p.x, s.p.y, s.p.z]));
    }

    function update() {
      const near = new Map();
      st.sel.forEach((id) => g.links(id).forEach((l) => near.set(l.id, l)));
      st.sel.forEach((id) => near.delete(id));
      paint(near);
      drawLines(near);
      setLabels(near);
    }
    function focus(id) {
      const p = pos.get(g.real(id));
      if (p) flyTo(p, 40);
    }

    /* Pointer: drag spins, click selects, double-click flies, wheel and pinch zoom. */
    const ray = new T.Raycaster();
    const mouse = new T.Vector2();
    const cv = renderer.domElement;
    function pick(e) {
      const r = cv.getBoundingClientRect();
      mouse.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(mouse, camera);
      const hit = ray.intersectObject(mesh)[0];
      return hit ? nodes[hit.instanceId] : null;
    }
    const ptrs = new Map();
    let drag = null;
    let pinch = 0;
    cv.addEventListener("pointerdown", (e) => {
      cv.setPointerCapture(e.pointerId);
      ptrs.set(e.pointerId, [e.clientX, e.clientY]);
      drag = { x: e.clientX, y: e.clientY, moved: 0 };
      orb.spin = false;
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
        if (pinch) orb.r = Math.max(3, Math.min(500, orb.r * (pinch / d)));
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
        orb.theta -= dx * 0.008;
        orb.phi = Math.max(0.05, Math.min(Math.PI - 0.05, orb.phi - dy * 0.008));
        tip.style.display = "none";
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
      if (drag && drag.moved < 6 && ptrs.size === 0) {
        const n = pick(e);
        if (n) select(st.sel.length === 1 && st.sel[0] === n.id ? [] : n.id);
      }
      if (ptrs.size === 0) drag = null;
    };
    cv.addEventListener("pointerup", up);
    cv.addEventListener("pointercancel", up);
    cv.addEventListener("dblclick", (e) => {
      const n = pick(e);
      if (n) {
        select(n.id);
        flyTo(pos.get(n.id), 14);
      } else if (orb.r < 80) flyTo([0, 0, 0], 210);
      else flyTo([0, 0, 0], 30);
    });
    cv.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
        orb.r = Math.max(3, Math.min(500, orb.r * Math.exp(e.deltaY * 0.001)));
      },
      { passive: false }
    );
    host.querySelector(".rl-cube-ui").addEventListener("click", (e) => {
      const c = e.target.closest("button") && e.target.closest("button").dataset.c;
      if (c === "out") flyTo([0, 0, 0], 210);
      if (c === "in") flyTo([0, 0, 0], 30);
      if (c === "spin") {
        orb.spin = !orb.spin;
        e.target.classList.toggle("on", orb.spin);
      }
    });

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
        fly.t = Math.min(1, (performance.now() - fly.start) / 900);
        const k = fly.t < 0.5 ? 2 * fly.t * fly.t : 1 - Math.pow(-2 * fly.t + 2, 2) / 2;
        orb.target.lerpVectors(fly.from, fly.to, k);
        orb.r = fly.r0 + (fly.r1 - fly.r0) * k;
        if (fly.t >= 1) fly = null;
      }
      if (orb.spin) orb.theta += 0.004;
      placeCamera();
      renderer.render(scene, camera);
      placeLabels();
    }
    setLabels(null);
    frame();
    return {
      update,
      focus,
      flyTo,
      orbit: orb,
      camera,
      pos,
      host,
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
