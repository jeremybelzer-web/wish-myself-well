/* Scene inspiration (Library menu): a research hub of scenes from films, TV and games, kept only as their shared
   curiosities. Big topics on the left, filter columns that narrow the list, the matching scenes on the right
   (a list that shrinks with every filter). Watch opens a search on YouTube (or another clip site), so links never
   break; Borrow turns the scene into a curated film and opens it in the Prism, where its curiosities (and how fast
   they change) drop onto your own film. Log a clip keeps the curiosities of a clip you watched.
   Two databases, switched at the top: films and games, and writing (novels, short stories, essays, poems).
   window.CurioInspire = { open, openSearch, mount, hub, store }; window.CurioSceneSearch = { mount } for the lanes'
   docked search window. Kept in localStorage `curiosities-inspire-v1`. */
(function () {
  const KEY = "curiosities-inspire-v1";
  let store = { clips: [], views: {}, watch: "youtube" };
  try {
    store = Object.assign(store, JSON.parse(localStorage.getItem(KEY) || "{}"));
  } catch (e) {}
  const save = () => {
    try {
      localStorage.setItem(KEY, JSON.stringify(store));
    } catch (e) {}
  };
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

  /* Two databases (Jeremy, 2026-10-05): films and games ("screen"), and writing (novels, short stories, essays,
     poems). The switch at the top of the search picks one; each keeps its own sources. */
  const hubs = {};
  const DBS = [
    { id: "screen", label: "Films and games" },
    { id: "writing", label: "Writing" },
  ];
  function db() {
    const DB = window.CuriosityDB;
    const j = DB && DB.toJSON ? DB.toJSON() : null;
    return j || { curiosities: [], suites: [], workspaces: [] };
  }
  function getHub(which) {
    const id = which || view.db;
    if (hubs[id]) return hubs[id];
    const d = db();
    const S = window.CurioInspireSearch;
    const sources = id === "writing" ? (window.CurioInspireWriting || { works: [] }).works : (window.CurioInspireScenes || { scenes: [] }).scenes;
    const h = S.create({ scenes: sources, curiosities: d.curiosities, suites: d.suites, workspaces: d.workspaces });
    (store.clips || []).filter((c) => S.isWritten(c) === (id === "writing")).forEach((c) => h.add(c));
    hubs[id] = h;
    return h;
  }

  /* The view: the filters in force, the topic and curiosity picked in the columns, the open scene. */
  const view = { db: "screen", filters: [], topic: "all", key: null, open: null, logging: false };
  let dlg = null;
  /* Where the search draws: the dialog, or the body of a docked window (CurioSceneSearch.mount). */
  let host = null;

  function chipText(f) {
    const h = getHub();
    if (f.text) return `“${f.text}”`;
    if (f.kind) return f.kind;
    if (f.feeling) return "feels " + f.feeling;
    if (f.movement) return "moves: " + archiveLabel(f.movement);
    if (f.suite) return "suite: " + ((h.suiteList([]).find((s) => s.id === f.suite) || {}).label || f.suite);
    if (f.curiosity && f.value !== undefined) return h.label(f.curiosity) + " = " + f.value;
    if (f.curiosity && f.rate) return h.label(f.curiosity) + " " + (h.RATES.find((r) => r.id === f.rate) || {}).label;
    if (f.curiosity) return "uses " + h.label(f.curiosity);
    return "?";
  }
  /* A movement from the emotion-movement archive (relations/archive.js), by id; plain words stay as they are. */
  function archiveLabel(id) {
    const A = window.CurioArchive;
    const m = A && /^mv-/.test(id) ? (A.movements || []).find((x) => x.id === id) : null;
    return m ? m.label : String(id).replace(/^mv-/, "").replace(/-/g, " ");
  }
  /* Show a movement on the relationship map (relations/, loaded on first use). */
  function showOnMap(id) {
    const L = window.CurioRelationsLoad;
    return Promise.resolve(L && L.load ? L.load() : null)
      .then(() => {
        const R = window.CurioRelations;
        if (!R || !R.open) return;
        const api = R.open() || R;
        if (api && api.select) api.select(id);
        if (dlg && dlg.open && dlg.classList.contains("ci-pop")) dlg.close();
      })
      .catch(() => {});
  }
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  function toggle(f) {
    const i = view.filters.findIndex((x) => same(x, f));
    if (i >= 0) view.filters.splice(i, 1);
    else view.filters.push(f);
    draw();
  }
  const has = (f) => view.filters.some((x) => same(x, f));

  function col(title, rows) {
    return `<div class="ci-col"><h4>${esc(title)}</h4>${rows.length ? rows.join("") : `<p class="ci-small">Nothing left with these filters.</p>`}</div>`;
  }
  function row(attrs, label, count, on) {
    return `<button type="button" class="ci-row${on ? " on" : ""}" ${attrs}><span>${esc(label)}</span><small>${count}</small></button>`;
  }

  function draw() {
    if (!host) return;
    const h = getHub();
    const F = view.filters;
    const list = h.results(F);
    const body = host.querySelector(".ci-body");
    if (view.logging) return drawLog(body);
    const topics = h.topics(F);
    const c1 = [row('data-i="topic" data-v="all"', "ALL", list.length, view.topic === "all")].concat(topics.map((t) => row(`data-i="topic" data-v="${t.id}"`, t.label, t.count, view.topic === t.id)));
    let c2;
    let c2title;
    if (view.topic === "all") {
      c2title = "Curiosity suites";
      c2 = h.suiteList(F).map((s) => row(`data-i="suite" data-v="${esc(s.id)}"`, s.label, s.count, has({ suite: s.id })));
    } else {
      c2title = "Curiosities";
      c2 = h.curiosities(view.topic, F).map((c) => row(`data-i="key" data-v="${esc(c.id)}"`, c.label, c.count, view.key === c.id));
    }
    let c3 = [];
    let c4 = [];
    if (view.key && view.topic !== "all") {
      c3 = h.values(view.key, F).map((v) => row(`data-i="value" data-v="${esc(v.value)}"`, v.value, v.count, has({ curiosity: view.key, value: v.value })));
      c4 = h.rates(view.key, F).map((r) => row(`data-i="rate" data-v="${r.id}"`, r.label, r.count, has({ curiosity: view.key, rate: r.id })));
    }
    const KIND_LABEL = { film: "Films", tv: "TV", anime: "Anime", game: "Games", novel: "Novels", "short story": "Short stories", essay: "Essays", poem: "Poems", "my clip": "My clips" };
    const c0 = h.kinds(F).map((k) => row(`data-i="kind" data-v="${esc(k.id)}"`, KIND_LABEL[k.id] || k.id, k.count, has({ kind: k.id })));
    const c5 = h.movements(F).map((m) => row(`data-i="movement" data-v="${esc(m.id)}"`, m.id, m.count, has({ movement: m.id })));
    const feels = h.feelings(F).map((k) => `<button type="button" class="ci-pill${has({ feeling: k.id }) ? " on" : ""}" data-i="feeling" data-v="${esc(k.id)}">${esc(k.id)} <small>${k.count}</small></button>`).join("");
    const chips = F.map((f, i) => `<button type="button" class="ci-chip" data-i="unfilter" data-v="${i}" title="Remove this filter">${esc(chipText(f))} ×</button>`).join("");
    const picked = view.key && view.topic !== "all";
    const dim = (t) => `<div class="ci-col ci-dim"><h4>${t}</h4><p class="ci-small">Pick a curiosity.</p></div>`;
    const tabs = DBS.map((d) => `<button type="button" class="ci-db${view.db === d.id ? " on" : ""}" data-i="db" data-v="${d.id}">${esc(d.label)} <small>${getHub(d.id).scenes.length}</small></button>`).join("");
    body.innerHTML = `<div class="ci-dbs" role="tablist" aria-label="Database">${tabs}</div><div class="ci-top">
        <input type="search" class="ci-search" placeholder="${view.db === "writing" ? "Type a title, an author, a feeling, a movement" : "Type a film, a game, a feeling, a moment"}" data-i="text" value="${esc((F.find((f) => f.text) || {}).text || "")}">
        <label class="ci-small">Watch on <select data-i="watch">${Object.entries(h.WATCH).map(([id, w]) => `<option value="${id}" ${store.watch === id ? "selected" : ""}>${esc(w.label)}</option>`).join("")}</select></label>
        ${view.db === "writing" ? "" : `<button type="button" data-i="tag">Watch and tag a clip</button>`}
        <button type="button" data-i="log">${view.db === "writing" ? "Log a passage you read" : "Log a clip you watched"}</button>
      </div>
      <div class="ci-pills"><span class="ci-small">What the audience feels</span> ${feels}</div>
      <div class="ci-pills ci-chips">${chips ? `<span class="ci-small">Filters</span> ${chips} <button type="button" class="ci-link" data-i="clear">Clear all</button>` : `<span class="ci-small">Every column is a filter: pick in any order. Every pick narrows the list below.</span>`}</div>
      <div class="ci-grid">
        ${col("Source", c0)}
        ${col("Topics", c1)}
        ${col(c2title, c2)}
        ${picked ? col(h.label(view.key), c3) : dim("Values")}
        ${picked ? col("How fast it changes", c4) : dim("How fast it changes")}
        ${col("Movements", c5)}
      </div>
      <div class="ci-results"><h4>${list.length} source${list.length === 1 ? "" : "s"} <small class="ci-small">of ${h.scenes.length} ${view.db === "writing" ? "novels, short stories, essays and poems" : "films, TV and games"}</small></h4>
        ${list.map(card).join("") || `<p class="ci-small">Nothing has all of these. Remove a filter.</p>`}</div>
      <p class="ci-small">Only shared curiosities are kept for each source (shot size, light, music, feeling, how characters move and how fast each changes), never footage or quoted text. Values are first guesses: log a clip to add or correct one.</p>`;
  }
  function card(s) {
    const h = getHub();
    const open = view.open === s.id;
    const focus = view.key && view.topic !== "all" ? h.details(s).find((d) => d.key === view.key) : null;
    const views = store.views[s.id] || 0;
    return `<article class="ci-card${open ? " open" : ""}">
      <header><strong>${esc(s.work)}</strong> <small>${s.author ? esc(s.author) + " · " : ""}${esc(s.year)} · ${esc(s.kind)}${s.logged ? " · logged by you" : ""}${s.video && s.video.lost ? " · link lost, Watch searches for it" : ""}${views ? ` · ${h.isWritten(s) ? "read" : "watched"} ${views}×` : ""}</small></header>
      <p>${esc(s.moment)} <small class="ci-small">(${esc(s.feelings.join(", "))})</small></p>
      ${(s.movements || []).length ? `<p class="ci-small">Movements: ${s.movements.map(esc).join(", ")}</p>` : ""}
      ${(s.archive || []).length && (window.CurioRelationsLoad || window.CurioRelations) ? `<p class="ci-small">On the relationship map: ${s.archive.map((id) => `<button type="button" class="ci-link" data-i="map" data-v="${esc(id)}">${esc(archiveLabel(id))}</button>`).join(" ")}</p>` : ""}
      ${focus ? `<p class="ci-small">${esc(focus.label)}: ${focus.path.map(esc).join(" → ")} <em>(${esc(focus.rate)})</em></p>` : ""}
      <p class="ci-actions"><button type="button" data-i="watch-go" data-v="${esc(s.id)}">${h.isWritten(s) ? "Read" : "Watch"}</button>
        <button type="button" data-i="borrow" data-v="${esc(s.id)}" title="Open it in the Prism, then drop any curiosity onto a moment of your film">Borrow its curiosities</button>
        ${h.isWritten(s) ? "" : `<button type="button" data-i="tag-scene" data-v="${esc(s.id)}" title="Play it here and tag its curiosities as they change">Watch and tag</button>`}
        <button type="button" class="ci-link" data-i="open" data-v="${esc(s.id)}">${open ? "Hide" : "Every curiosity"}</button>
        ${s.logged ? `<button type="button" class="ci-link" data-i="forget" data-v="${esc(s.id)}">Forget</button>` : ""}</p>
      ${open ? details(s) : ""}
    </article>`;
  }
  function details(s) {
    const h = getHub();
    const rows = h.details(s).sort((a, b) => a.topic.localeCompare(b.topic));
    const suites = h.suitesFor(s).slice(0, 8);
    return `<table class="ci-table"><tr><th>Curiosity</th><th>Through the scene</th><th>Changes</th></tr>
      ${rows.map((d) => `<tr><td>${esc(d.label)}</td><td>${d.path.map(esc).join(" → ")}</td><td>${esc(d.rate)}${d.perMinute ? ` · ${d.perMinute}/min` : ""}</td></tr>`).join("")}</table>
      ${suites.length ? `<p class="ci-small">Suites it shows: ${suites.map((x) => `${esc(x.label)} (${Math.round(x.share * 100)}%)`).join(", ")}</p>` : ""}`;
  }

  /* ---------- Log a clip ---------- */
  let logRows = [{ key: "shotSize", from: "", to: "" }];
  function choices() {
    const h = getHub();
    const groups = {};
    db().curiosities.forEach((c) => {
      const s = (c.sliders || []).find((x) => x.id === c.main);
      if (!s || !(s.scale || s.range)) return;
      const t = h.topicOf(c.id);
      (groups[t] = groups[t] || []).push(c);
    });
    return h.TOPICS.filter((t) => groups[t.id]).map((t) => `<optgroup label="${esc(t.label)}">${groups[t.id].map((c) => `<option value="${esc(c.id)}">${esc(c.label)}</option>`).join("")}</optgroup>`).join("");
  }
  function valueOptions(key, picked) {
    const s = getHub().sliderOf(key);
    if (!s) return "";
    const vals = s.scale ? s.scale : Array.from({ length: Math.floor((s.range.max - s.range.min) / (s.range.step || 1)) + 1 }, (_, i) => s.range.min + i * (s.range.step || 1));
    return `<option value="">(not set)</option>` + vals.map((v) => `<option ${String(v) === String(picked) ? "selected" : ""}>${esc(v)}</option>`).join("");
  }
  let opts = "";
  function drawLog(body) {
    opts = opts || choices();
    const h = getHub();
    body.innerHTML = `<h3>Log a clip you watched</h3>
      <p class="ci-small">Write down what you saw, as curiosities: where each one starts and where it ends. Only these values are kept, in this browser and in your project file; nothing about the video itself.</p>
      <div class="ci-form">
        <label>Film, show or game <input data-l="work" placeholder="Title"></label>
        <label>Year <input data-l="year" inputmode="numeric" size="5"></label>
        <label>Kind <select data-l="kind">${(view.db === "writing" ? ["novel", "short story", "essay", "poem"] : ["film", "tv", "anime", "game", "my clip"]).map((k) => `<option>${k}</option>`).join("")}</select></label>
        <label>The moment, in your words <input data-l="moment" placeholder="Two old friends meet at a station"></label>
        <label>What the audience feels <input data-l="feelings" placeholder="joy, nostalgia"></label>
        <label>Search words to find it again <input data-l="search" placeholder="title + scene name"></label>
        <label>How long (seconds) <input data-l="length" inputmode="numeric" size="5" value="60"></label>
      </div>
      <table class="ci-table"><tr><th>Curiosity</th><th>At the start</th><th>At the end</th><th></th></tr>
        ${logRows.map((r, i) => `<tr><td><select data-l="key" data-r="${i}">${opts.replace(`value="${esc(r.key)}"`, `value="${esc(r.key)}" selected`)}</select></td>
          <td><select data-l="from" data-r="${i}">${valueOptions(r.key, r.from)}</select></td>
          <td><select data-l="to" data-r="${i}">${valueOptions(r.key, r.to)}</select></td>
          <td><button type="button" class="ci-link" data-i="logdel" data-v="${i}">Remove</button></td></tr>`).join("")}
      </table>
      <p><button type="button" data-i="logadd">Add another curiosity</button></p>
      <p class="ci-actions"><button type="button" data-i="logsave">Keep this clip</button> <button type="button" class="ci-link" data-i="logcancel">Back to the search</button></p>
      <p class="ci-msg ci-small"></p>`;
    void h;
  }
  function saveLog() {
    const v = (n) => (host.querySelector(`[data-l="${n}"]`) || {}).value || "";
    const msg = host.querySelector(".ci-msg");
    if (!v("work").trim()) return (msg.textContent = "Give it a title first.");
    const len = Math.max(1, Number(v("length")) || 60);
    const start = {};
    const end = {};
    logRows.forEach((r) => {
      if (r.from !== "") start[r.key] = isNaN(Number(r.from)) ? r.from : Number(r.from);
      if (r.to !== "") end[r.key] = isNaN(Number(r.to)) ? r.to : Number(r.to);
    });
    if (!Object.keys(start).length && !Object.keys(end).length) return (msg.textContent = "Set at least one curiosity.");
    const clip = getHub().logClip({ work: v("work"), year: v("year"), kind: v("kind"), moment: v("moment"), feelings: v("feelings").split(/,\s*/).map((x) => x.trim().toLowerCase()), search: v("search"), beats: [{ at: 0, values: start }, { at: len, values: end }] });
    store.clips = (store.clips || []).filter((c) => c.id !== clip.id).concat([clip]);
    save();
    view.db = window.CurioInspireSearch.isWritten(clip) ? "writing" : "screen";
    getHub().add(clip);
    view.logging = false;
    view.filters = [{ text: clip.work }];
    logRows = [{ key: "shotSize", from: "", to: "" }];
    draw();
  }

  /* ---------- actions ---------- */
  function sceneOf(id) {
    return getHub().scenes.find((s) => s.id === id);
  }
  function borrow(s) {
    const study = getHub().toStudy(s);
    if (window.CuriosityStudy && CuriosityStudy.add) CuriosityStudy.add(study);
    if (window.CuriosityPrism && CuriosityPrism.pick) CuriosityPrism.pick(study.id);
    if (dlg && dlg.open) dlg.close();
    const b = document.querySelector('#lib-menu button[data-tab="prism"]');
    if (window.CuriosityTabs) CuriosityTabs.show("prism", b);
    if (window.CuriosityPrism && CuriosityPrism.draw) CuriosityPrism.draw();
    return study;
  }
  function onClick(e) {
    const b = e.target.closest("[data-i]");
    if (!b || b.tagName === "INPUT" || b.tagName === "SELECT") return;
    const i = b.dataset.i;
    const v = b.dataset.v;
    if (i === "db") {
      if (view.db !== v) Object.assign(view, { db: v, filters: [], open: null });
      return draw();
    }
    if (i === "topic") {
      view.topic = v;
      view.key = null;
      return draw();
    }
    if (i === "key") {
      view.key = view.key === v ? null : v;
      return draw();
    }
    if (i === "suite") return toggle({ suite: v });
    if (i === "value") return toggle({ curiosity: view.key, value: v });
    if (i === "rate") return toggle({ curiosity: view.key, rate: v });
    if (i === "kind") return toggle({ kind: v });
    if (i === "feeling") return toggle({ feeling: v });
    if (i === "movement") return toggle({ movement: v });
    if (i === "map") return void showOnMap(v);
    if (i === "unfilter") {
      view.filters.splice(Number(v), 1);
      return draw();
    }
    if (i === "clear") {
      view.filters = [];
      return draw();
    }
    if (i === "open") {
      view.open = view.open === v ? null : v;
      return draw();
    }
    if (i === "watch-go") {
      const s = sceneOf(v);
      if (!s) return;
      store.views[s.id] = (store.views[s.id] || 0) + 1;
      save();
      /* A kept YouTube link opens right at the scene (watchUrl); a lost one, or another site, opens a search. */
      window.open(getHub().watchUrl(s, store.watch), "_blank", "noopener");
      return draw();
    }
    if (i === "borrow") return sceneOf(v) && borrow(sceneOf(v));
    if (i === "forget") {
      store.clips = (store.clips || []).filter((c) => c.id !== v);
      save();
      getHub().remove(v);
      return draw();
    }
    if (i === "log") {
      view.logging = true;
      return draw();
    }
    if (i === "logcancel") {
      view.logging = false;
      return draw();
    }
    if (i === "logadd") {
      logRows.push({ key: "emotion", from: "", to: "" });
      return draw();
    }
    if (i === "logdel") {
      logRows.splice(Number(v), 1);
      if (!logRows.length) logRows.push({ key: "shotSize", from: "", to: "" });
      return draw();
    }
    if (i === "logsave") return saveLog();
    if ((i === "tag" || i === "tag-scene") && window.CurioWatchTag) {
      const sc = i === "tag-scene" ? sceneOf(v) : null;
      if (dlg && dlg.open) dlg.close();
      return window.CurioWatchTag.open(sc ? { search: sc.search, work: sc.work, year: sc.year, kind: sc.kind, moment: sc.moment, feelings: sc.feelings, video: sc.video } : {});
    }
  }
  function keepLogFields() {
    /* Redrawing the log form for a new row should not lose what was typed. */
    const keep = {};
    host.querySelectorAll(".ci-form [data-l]").forEach((x) => (keep[x.dataset.l] = x.value));
    return () => host.querySelectorAll(".ci-form [data-l]").forEach((x) => keep[x.dataset.l] !== undefined && (x.value = keep[x.dataset.l]));
  }
  function onChange(e) {
    const t = e.target;
    if (t.dataset.i === "watch") {
      store.watch = t.value;
      save();
      return;
    }
    if (t.dataset.r !== undefined) {
      const r = logRows[Number(t.dataset.r)];
      r[t.dataset.l] = t.value;
      if (t.dataset.l === "key") {
        r.from = "";
        r.to = "";
        const back = keepLogFields();
        draw();
        back();
      }
    }
  }
  let typing = null;
  function onInput(e) {
    if (e.target.dataset.i !== "text") return;
    clearTimeout(typing);
    const val = e.target.value.trim();
    typing = setTimeout(() => {
      view.filters = view.filters.filter((f) => !f.text);
      if (val) view.filters.unshift({ text: val });
      draw();
      const box = host.querySelector(".ci-search");
      if (box) {
        box.focus();
        box.setSelectionRange(box.value.length, box.value.length);
      }
    }, 250);
  }

  function make() {
    if (dlg) return;
    dlg = document.createElement("dialog");
    dlg.className = "ci-hub";
    dlg.innerHTML = `<header><strong>Scene inspiration</strong> <span class="ci-small ci-sub">search films, games, books, stories, essays and poems by their curiosities</span><button type="button" data-ci="close">Close</button></header><div class="ci-body"></div>`;
    document.body.appendChild(dlg);
    dlg.addEventListener("click", (e) => (e.target.closest('[data-ci="close"]') ? dlg.close() : onClick(e)));
    dlg.addEventListener("change", onChange);
    dlg.addEventListener("input", onInput);
    /* The pop-up can be dragged by its title bar. */
    const head = dlg.querySelector("header");
    head.addEventListener("pointerdown", (e) => {
      if (!dlg.classList.contains("ci-pop") || e.target.closest("button")) return;
      const r = dlg.getBoundingClientRect();
      const dx = e.clientX - r.left;
      const dy = e.clientY - r.top;
      const move = (m) => ((dlg.style.left = Math.max(0, m.clientX - dx) + "px"), (dlg.style.top = Math.max(0, m.clientY - dy) + "px"));
      const up = () => (removeEventListener("pointermove", move), removeEventListener("pointerup", up));
      addEventListener("pointermove", move);
      addEventListener("pointerup", up);
    });
  }
  function setSub(text) {
    dlg.querySelector(".ci-sub").innerHTML = text;
  }
  /* The whole hub, from the Library. */
  function open(opts) {
    make();
    host = dlg;
    if (dlg.open && dlg.classList.contains("ci-pop")) dlg.close();
    dlg.classList.remove("ci-pop");
    dlg.removeAttribute("style");
    setSub("search films, games and writing by their curiosities");
    if (opts && opts.filters) view.filters = opts.filters.slice();
    if (typeof dlg.showModal === "function" && !dlg.open) dlg.showModal();
    else dlg.setAttribute("open", "");
    draw();
    recheck();
  }
  /* In the background: links not checked in 30 days are checked, a live one moves to the front. */
  let checking = false;
  function recheck() {
    if (checking || !window.CurioWatchTag || !window.CurioWatchTag.check) return;
    checking = true;
    window.CurioWatchTag.check(store.clips || [])
      .then((n) => {
        if (!n) return;
        (store.clips || []).filter((c) => !window.CurioInspireSearch.isWritten(c)).forEach((c) => getHub("screen").add(c));
        save();
        if (dlg && dlg.open && !view.logging) draw();
      })
      .catch(() => {})
      .then(() => (checking = false));
  }
  /* The search pop-up a curiosity window opens with its search button: openSearch(curiosityId, { anchor, movement,
     filters }). It opens beside the window it came from (anchor: that window's element), already on that curiosity,
     and can be dragged anywhere. Every column is a filter over the whole database. Returns the pop-up's element. */
  function openSearch(curiosityId, opts) {
    opts = opts || {};
    make();
    host = dlg;
    const key = aim(curiosityId, opts);
    const h = getHub();
    if (dlg.open) dlg.close();
    dlg.classList.add("ci-pop");
    setSub(key ? `<span class="ci-from">from ${esc(h.label(key))}</span>` : "search everything");
    /* A curiosity window that is itself modal would cover a plain pop-up, so stack on top of it as modal too. */
    const overModal = typeof document.querySelector === "function" && document.querySelector("dialog:modal");
    if (overModal && dlg.showModal) dlg.showModal();
    else if (dlg.show) dlg.show();
    else dlg.setAttribute("open", "");
    place(opts.anchor);
    draw();
    return dlg;
  }
  /* Point the search at one curiosity (or one lane, "id.slider"), in the database asked for. */
  function aim(curiosityId, opts) {
    view.logging = false;
    view.open = null;
    const base = curiosityId ? String(curiosityId).replace(/^c:/, "") : null;
    const lane = opts.lane ? String(opts.lane).replace(/^c:/, "") : null;
    const usedIn = (id, k) => k && getHub(id).scenes.some((sc) => sc.beats.some((b) => b.values[k] !== undefined));
    if (opts.db === "writing" || opts.db === "screen") view.db = opts.db;
    else if (!usedIn(view.db, lane) && !usedIn(view.db, base)) {
      /* Only the other database has this curiosity (how characters move is mostly in writing): open that one. */
      const other = DBS.find((d) => d.id !== view.db).id;
      if (usedIn(other, lane) || usedIn(other, base)) view.db = other;
    }
    const h = getHub();
    const used = (k) => usedIn(view.db, k);
    const key = used(lane) ? lane : base || lane;
    view.filters = (opts.filters || []).slice();
    if (opts.movement) view.filters.push({ movement: opts.movement });
    view.topic = key ? h.topicOf(key) : "all";
    view.key = key;
    return key;
  }
  /* The search inside a docked window (the lanes' search window): CurioSceneSearch.mount(el, { curiosity, lane,
     label, from, db }). Draws the same six filter columns and list into el, already on that curiosity. */
  function mount(el, opts) {
    opts = opts || {};
    if (!el) return null;
    let wrap = el.querySelector(":scope > .ci-docked");
    if (!wrap) {
      wrap = document.createElement("div");
      wrap.className = "ci-hub ci-docked";
      wrap.innerHTML = `<div class="ci-body"></div>`;
      el.appendChild(wrap);
      wrap.addEventListener("click", onClick);
      wrap.addEventListener("change", onChange);
      wrap.addEventListener("input", onInput);
    }
    host = wrap;
    aim(opts.curiosity, opts);
    draw();
    return wrap;
  }
  /* Beside the anchor: to its right when there is room, else to its left, else centered; kept on the screen. */
  function place(anchor) {
    const W = innerWidth;
    const H = innerHeight;
    const w = Math.min(980, W * 0.94);
    const hgt = Math.min(H * 0.8, 760);
    let x = (W - w) / 2;
    let y = (H - hgt) / 2;
    if (anchor && anchor.getBoundingClientRect) {
      const r = anchor.getBoundingClientRect();
      if (W - r.right >= w + 8) x = r.right + 8;
      else if (r.left >= w + 8) x = r.left - w - 8;
      y = Math.min(Math.max(8, r.top), H - hgt - 8);
    }
    dlg.style.left = Math.max(0, x) + "px";
    dlg.style.top = Math.max(0, y) + "px";
  }

  function wire() {
    const css = document.createElement("style");
    css.textContent = `dialog.ci-hub{width:min(1400px,96vw);height:92vh;max-height:92vh;padding:0;border:1px solid var(--line,#8884);border-radius:10px;background:var(--panel,#fffaf2);color:var(--ink,#1c1712);font-family:var(--sans,sans-serif)}
dialog.ci-hub>header{display:flex;gap:.6rem;align-items:baseline;padding:.6rem .9rem;border-bottom:1px solid var(--line,#8884);position:sticky;top:0;background:inherit;z-index:1}
dialog.ci-hub>header button{margin-left:auto}
.ci-body{padding:.6rem .9rem;overflow:auto;height:calc(92vh - 3rem);box-sizing:border-box}
.ci-small{font-size:.8rem;opacity:.75}
.ci-top{display:flex;flex-wrap:wrap;gap:.6rem;align-items:center;margin-bottom:.4rem}
.ci-search{flex:1 1 260px;font-size:1rem;padding:.35rem .5rem}
.ci-pills{display:flex;flex-wrap:wrap;gap:.3rem;align-items:center;margin:.25rem 0}
.ci-pill,.ci-chip{border:1px solid var(--line,#8884);border-radius:99px;padding:.1rem .55rem;background:transparent;font:inherit;font-size:.82rem;cursor:pointer}
.ci-pill.on,.ci-row.on{background:var(--saffron,#c45c26);color:#fff}
.ci-chip{background:var(--gold,#b8892d);color:#fff}
.ci-link{background:none;border:0;text-decoration:underline;cursor:pointer;font:inherit;font-size:.85rem;padding:0 .2rem}
.ci-grid{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:.4rem;margin-top:.5rem;align-items:stretch}
.ci-col,.ci-results{border:1px solid var(--line,#8884);border-radius:8px;padding:.35rem;overflow:auto}
.ci-col{height:30vh}
.ci-results{margin-top:.5rem}
.ci-col h4,.ci-results h4{margin:.1rem .2rem .35rem;font-size:.9rem}
.ci-dim{opacity:.6}
.ci-row{display:flex;width:100%;justify-content:space-between;gap:.4rem;border:0;background:transparent;text-align:left;padding:.2rem .35rem;border-radius:5px;font:inherit;font-size:.85rem;cursor:pointer}
.ci-row:hover{background:#8882}
.ci-card{border-bottom:1px solid var(--line,#8884);padding:.35rem .2rem}
.ci-card p{margin:.2rem 0}
.ci-actions{display:flex;flex-wrap:wrap;gap:.35rem;align-items:center}
.ci-table{border-collapse:collapse;font-size:.8rem;margin:.3rem 0;display:block;overflow-x:auto}
.ci-table th,.ci-table td{border:1px solid #8885;padding:.15rem .35rem;text-align:left}
.ci-form{display:flex;flex-wrap:wrap;gap:.5rem .8rem;margin:.5rem 0}
.ci-form label{display:flex;flex-direction:column;font-size:.82rem}
@media (max-width:900px){.ci-grid{grid-template-columns:1fr 1fr}}
dialog.ci-hub.ci-pop{position:fixed;margin:0;z-index:2147483000;width:min(980px,94vw);height:min(80vh,760px);box-shadow:0 12px 40px #0005}
dialog.ci-hub.ci-pop .ci-body{height:calc(100% - 3rem)}
dialog.ci-hub.ci-pop>header{cursor:move}
.ci-dbs{display:flex;gap:.3rem;margin-bottom:.45rem}
.ci-db{border:1px solid var(--line,#8884);border-radius:8px 8px 0 0;padding:.25rem .8rem;background:transparent;font:inherit;cursor:pointer}
.ci-db.on{background:var(--ink,#1c1712);color:var(--panel,#fffaf2)}
.ci-docked .ci-body{height:auto;padding:.3rem}
.ci-docked .ci-grid{grid-template-columns:repeat(auto-fit,minmax(140px,1fr))}
.ci-docked .ci-col{height:22vh}
.ci-from{font-size:.8rem;background:var(--gold,#b8892d);color:#fff;border-radius:99px;padding:.05rem .5rem}`;
    document.head.appendChild(css);
    const menu = document.getElementById("lib-menu");
    if (menu && !menu.querySelector("[data-inspire]")) {
      const b = document.createElement("button");
      b.type = "button";
      b.dataset.inspire = "open";
      b.innerHTML = "Scene inspiration<small>search films and games by their curiosities, then borrow them</small>";
      const prism = menu.querySelector('[data-tab="prism"]');
      menu.insertBefore(b, prism ? prism.nextSibling : null);
      b.addEventListener("click", () => {
        menu.hidden = true;
        open();
      });
    }
  }
  if (typeof document !== "undefined") {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", wire);
    else setTimeout(wire, 0);
  }

  /* Keep a clip from Watch and tag in the screen database. */
  function keep(clip) {
    const scene = getHub("screen").logClip(clip);
    store.clips = (store.clips || []).filter((c) => c.id !== scene.id).concat([scene]);
    save();
    view.db = "screen";
    getHub("screen").add(scene);
    view.logging = false;
    return scene;
  }

  window.CurioSceneSearch = { mount };
  window.CurioInspire = { open, openSearch, mount, keep, hub: getHub, store: () => store, borrow: (id) => sceneOf(id) && borrow(sceneOf(id)), view };
})();
