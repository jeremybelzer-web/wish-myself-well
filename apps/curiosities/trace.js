/* trace.js: share a curated film as a small trace file, and load someone else's into your Prism.

   window.CuriosityTrace
   A trace file is one study (a curated film) cut down to counts and ids, so it can be passed around freely:
     {
       format: "curiosities-trace", version: 1,
       id: "<content fingerprint>",        made from the beats, so the same trace always has the same id
       title, kind, camera,                kind: episode, film, game...; camera: authored or player (games)
       year?, tracedBy?, createdAt,        optional, short
       curiosities: <number of known curiosities when it was made>,
       beats: [{ at, values: { <curiosity id>: <value> } }],
       moments: [{ name, from, to }]       favorite moments, by beat number (from 0)
     }
   What never goes in: beat notes (they can quote a line), anything that is not a known curiosity id with a value
   on its own scale, and long text. A tag value is at most 24 characters, a title 80, a moment name 40.

   The core part never touches the page, so the desktop bridge, the Maya panel and core/headless.js can use it:
   - fromStudy(study, {tracedBy}) -> trace, the counts-only copy of a study.
   - check(any) -> { ok, trace, dropped: { ids: {id: count}, values: n, notes: n }, error }: reads a trace file
     (or a studies export, or a single study) and keeps only what this app knows. Unknown ids are dropped and
     counted, never guessed.
   - toStudy(trace) -> a study for Curated films, with id "trace-<fingerprint>" and shared: {...} so it is marked.
   - fingerprint(trace) -> the content id. json(trace) -> the file text.
   The page part (only with a page): exportStudy(id), importFiles(files), openPanel(). The Library menu gets a
   "Share a film" entry. Loading a trace adds it to Curated films; it then shows in the Prism like any study.
   A study that is already there (same fingerprint) is not added twice. */
(function () {
  const FORMAT = "curiosities-trace";
  const VERSION = 1;
  const STUDIES_KEY = "curiosities-studies-v1";
  const TITLE_MAX = 80;
  const NAME_MAX = 40;
  const TAG_MAX = 24;
  const BEATS_MAX = 5000;
  const KINDS = ["film", "episode", "short", "game", "music video", "ad", "scene", "other"];
  const CAMERAS = ["authored", "player"];

  function known() {
    const list = typeof CURIOSITIES !== "undefined" ? CURIOSITIES : (typeof window !== "undefined" && window.CURIOSITIES) || [];
    return Object.fromEntries(list.map((c) => [c.id, c]));
  }
  const short = (s, n) => String(s == null ? "" : s).replace(/[\u0000-\u001f]+/g, " ").trim().slice(0, n);

  /* A value is kept only when it sits on the curiosity's own scale. Returns undefined to drop it. */
  function cleanValue(c, v) {
    if (v == null || v === "") return undefined;
    if (c.kind === "select") return Array.isArray(c.options) && c.options.includes(v) ? v : undefined;
    if (c.kind === "range") {
      const n = Number(v);
      if (!isFinite(n)) return undefined;
      const lo = c.min == null ? -Infinity : c.min;
      const hi = c.max == null ? Infinity : c.max;
      return Math.max(lo, Math.min(hi, n));
    }
    if (c.kind === "tag") return typeof v === "string" || typeof v === "number" ? short(v, TAG_MAX) || undefined : undefined;
    return undefined;
  }
  /* "0:06", "1:02:03", or a number of seconds. Anything else becomes the beat number. */
  function cleanAt(at, i) {
    if (typeof at === "number" && isFinite(at) && at >= 0) return Math.round(at * 100) / 100;
    if (typeof at === "string" && /^\d{1,3}(:\d{1,2}){0,2}(\.\d+)?$/.test(at.trim())) return at.trim();
    return String(i + 1);
  }

  /* cyrb53: a small, fast 53-bit string hash. Good enough to tell two traces apart; not a security check. */
  function hash(str) {
    let h1 = 0xdeadbeef,
      h2 = 0x41c6ce57;
    for (let i = 0; i < str.length; i++) {
      const ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
  }
  /* Same beats, title, kind and camera give the same id, whoever traced it and whenever. */
  function fingerprint(t) {
    const beats = (t.beats || []).map((b) => [b.at, Object.keys(b.values).sort().map((k) => [k, b.values[k]])]);
    return hash(JSON.stringify([t.title, t.kind, t.camera, beats]));
  }

  /* The heart of it: any study-like object in, a counts-only trace out, with a tally of what was left behind. */
  function cut(s, byId, extra) {
    const dropped = { ids: {}, values: 0, notes: 0 };
    const src = Array.isArray(s.beats) ? s.beats.slice(0, BEATS_MAX) : [];
    const beatIndex = {};
    const beats = src.map((b, i) => {
      b = b || {};
      if (b.id != null) beatIndex[b.id] = i;
      if (b.note) dropped.notes++;
      const values = {};
      Object.entries(b.values || {}).forEach(([id, v]) => {
        const c = byId[id];
        if (!c) {
          dropped.ids[id] = (dropped.ids[id] || 0) + 1;
          return;
        }
        const out = cleanValue(c, v);
        if (out === undefined) {
          if (v != null && v !== "") dropped.values++;
          return;
        }
        values[id] = out;
      });
      return { at: cleanAt(b.at, i), values };
    });
    /* Moments point at beats: by id in a study, by number in a trace. */
    const at = (ref) => (typeof ref === "number" ? ref : beatIndex[ref]);
    const moments = (Array.isArray(s.moments) ? s.moments : [])
      .map((m) => ({ name: short(m && m.name, NAME_MAX), from: at(m && m.from), to: at(m && m.to) }))
      .filter((m) => m.name && Number.isInteger(m.from) && Number.isInteger(m.to) && m.from >= 0 && m.to >= 0 && m.from < beats.length && m.to < beats.length);
    const t = {
      format: FORMAT,
      version: VERSION,
      id: "",
      title: short(s.title, TITLE_MAX) || "Untitled film",
      kind: KINDS.includes(s.kind) ? s.kind : "other",
      camera: CAMERAS.includes(s.camera) ? s.camera : "authored",
    };
    const year = Number(s.year);
    if (Number.isInteger(year) && year > 1800 && year < 3000) t.year = year;
    const by = short((extra && extra.tracedBy) || s.tracedBy, NAME_MAX);
    if (by) t.tracedBy = by;
    t.createdAt = typeof s.createdAt === "string" && !isNaN(Date.parse(s.createdAt)) ? s.createdAt : new Date().toISOString();
    t.curiosities = Object.keys(byId).length;
    t.beats = beats;
    t.moments = moments;
    t.id = fingerprint(t);
    return { trace: t, dropped };
  }

  function fromStudy(study, opts) {
    if (!study || !Array.isArray(study.beats)) throw new Error("not a study");
    return cut(study, known(), opts || {}).trace;
  }

  /* Read anything a person might hand over: a trace, a studies export (its first study), or a bare study. */
  function check(any) {
    let data = any;
    try {
      if (typeof data === "string") data = JSON.parse(data);
    } catch (e) {
      return { ok: false, error: "That file is not JSON." };
    }
    if (!data || typeof data !== "object") return { ok: false, error: "That file is empty." };
    if (data.format === FORMAT && data.version > VERSION) return { ok: false, error: "That trace was made by a newer version of the app." };
    let s = data;
    if (data.format !== FORMAT && Array.isArray(data.studies)) s = data.studies[0];
    if (!s || !Array.isArray(s.beats)) return { ok: false, error: "That file is not a trace or a curated film." };
    if (!s.beats.length) return { ok: false, error: "That trace has no beats." };
    const out = cut(s, known(), {});
    if (!out.trace.beats.some((b) => Object.keys(b.values).length)) return { ok: false, error: "None of that trace's curiosities are known here.", dropped: out.dropped };
    return { ok: true, trace: out.trace, dropped: out.dropped };
  }

  function toStudy(t) {
    const beats = t.beats.map((b, i) => ({ id: "b" + (i + 1), at: typeof b.at === "number" ? String(b.at) : b.at, note: "", values: Object.assign({}, b.values) }));
    return {
      id: "trace-" + t.id,
      title: t.title,
      kind: t.kind,
      camera: t.camera,
      beats,
      moments: (t.moments || []).map((m, i) => ({ id: "m" + (i + 1), name: m.name, from: beats[m.from].id, to: beats[m.to].id })),
      shared: { id: t.id, tracedBy: t.tracedBy || "", year: t.year || null, createdAt: t.createdAt },
    };
  }

  const json = (t) => JSON.stringify(t, null, 1);
  /* In words, for the panel and for errors: "Dropped 3 values from 2 curiosities this app doesn't have." */
  function droppedText(d) {
    if (!d) return "";
    const ids = Object.keys(d.ids || {});
    const n = ids.reduce((a, id) => a + d.ids[id], 0);
    const parts = [];
    if (n) parts.push(`${n} value${n === 1 ? "" : "s"} of ${ids.length} curiosit${ids.length === 1 ? "y" : "ies"} this app doesn't have`);
    if (d.values) parts.push(`${d.values} value${d.values === 1 ? "" : "s"} off its scale`);
    if (d.notes) parts.push(`${d.notes} beat note${d.notes === 1 ? "" : "s"}`);
    return parts.length ? "Left out: " + parts.join(", ") + "." : "";
  }

  const api = { FORMAT, VERSION, fromStudy, check, toStudy, fingerprint, json, droppedText };
  if (typeof window !== "undefined") window.CuriosityTrace = api;
  if (typeof document === "undefined" || typeof document.getElementById !== "function" || !document.body) return;

  /* ---------- the page part: Library > Share a film ---------- */

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
  const S = () => window.CuriosityStudy;
  function studies() {
    return S() ? S().studies() : [];
  }
  function slug(s) {
    return (
      String(s || "film")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 40) || "film"
    );
  }
  function download(name, text) {
    const blob = new Blob([text], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  const BY_KEY = "curio-trace-by-v1";
  function tracedBy() {
    try {
      return localStorage.getItem(BY_KEY) || "";
    } catch (e) {
      return "";
    }
  }

  function exportStudy(id) {
    const s = studies().find((x) => x.id === id);
    if (!s) return null;
    const t = fromStudy(s, { tracedBy: tracedBy() });
    download(slug(t.title) + ".curiotrace.json", json(t));
    return t;
  }

  /* Curated films keeps its studies in memory and saves them as a whole, so a new study goes in through its API
     when it has add(); otherwise straight into its saved key, then the page reloads (as opening a project does). */
  function add(study) {
    if (studies().some((x) => x.id === study.id)) return "have";
    if (S() && typeof S().add === "function") {
      S().add(study);
      return "added";
    }
    let store = null;
    try {
      store = JSON.parse(localStorage.getItem(STUDIES_KEY));
    } catch (e) {}
    /* Nothing saved yet means Curated films still holds only what it starts with (its example), so keep that. */
    if (!store || !Array.isArray(store.studies)) store = { studies: S() && S().saved ? S().saved().slice() : [], shelf: [], proximities: [] };
    store.studies.push(study);
    localStorage.setItem(STUDIES_KEY, JSON.stringify(store));
    return "reload";
  }

  function readFile(file) {
    return new Promise((ok) => {
      const r = new FileReader();
      r.onload = () => ok(String(r.result || ""));
      r.onerror = () => ok("");
      r.readAsText(file);
    });
  }
  async function importFiles(files) {
    const out = [];
    let reload = false;
    for (const f of Array.from(files || [])) {
      if (f.size > 5e6) {
        out.push({ name: f.name, ok: false, error: "That file is too big to be a trace." });
        continue;
      }
      const res = check(await readFile(f));
      if (!res.ok) {
        out.push({ name: f.name, ok: false, error: res.error });
        continue;
      }
      let how;
      try {
        how = add(toStudy(res.trace));
      } catch (e) {
        out.push({ name: f.name, ok: false, error: "This browser has no room left to keep it." });
        continue;
      }
      if (how === "reload") reload = true;
      out.push({ name: f.name, ok: true, title: res.trace.title, beats: res.trace.beats.length, have: how === "have", note: droppedText(res.dropped) });
    }
    return { results: out, reload };
  }

  let dlg = null;
  let flash = "";
  function css() {
    if (document.getElementById("trace-css")) return;
    const st = document.createElement("style");
    st.id = "trace-css";
    st.textContent = `
      .trace-dlg { border: 3px solid var(--ink); background: var(--panel, #fff); color: var(--ink); padding: 0; width: 560px; max-width: calc(100vw - 32px); box-shadow: 6px 6px 0 rgba(28, 23, 18, 0.25); }
      .trace-dlg::backdrop { background: rgba(28, 23, 18, 0.35); }
      .trace-in { padding: 14px 16px 16px; display: grid; gap: 10px; }
      .trace-head { display: flex; justify-content: space-between; align-items: center; }
      .trace-head h2 { margin: 0; }
      .trace-x { border: 0; background: none; font-size: 22px; cursor: pointer; }
      .trace-dlg p { margin: 0; font-family: var(--sans); font-size: 14px; }
      .trace-dlg h3 { margin: 6px 0 0; }
      .trace-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 4px; max-height: 40vh; overflow: auto; }
      .trace-list li { display: flex; flex-wrap: wrap; gap: 8px; align-items: baseline; justify-content: space-between; border-bottom: 1px solid var(--line); padding: 4px 0; font-family: var(--sans); font-size: 14px; }
      .trace-list small { opacity: 0.7; }
      .trace-row { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
      .trace-row input[type=text] { font-family: var(--sans); font-size: 14px; border: 1px solid var(--ink); padding: 4px 6px; min-width: 0; flex: 1 1 160px; max-width: 260px; }
      .trace-flash { background: var(--ink); color: var(--paper, #fff); padding: 6px 8px; }
      .trace-err { color: #a1271b; }
    `;
    document.head.appendChild(st);
  }
  function draw() {
    const mine = studies();
    dlg.innerHTML = `<div class="trace-in">
      <div class="trace-head"><h2>Share a film</h2><button type="button" class="trace-x" data-t="close" aria-label="Close">×</button></div>
      <p>A shared film is a small file with only counts: which curiosities are on in each beat and how much. No notes, lines, script or footage go in, so anyone can pass it on. Load one and it joins your Curated films and the Prism.</p>
      ${flash ? `<div class="trace-flash" role="status">${flash}</div>` : ""}
      <h3>Load a shared film</h3>
      <div class="trace-row"><input type="file" id="trace-file" accept=".json,application/json" multiple hidden /><button type="button" data-t="pick">Choose trace files…</button></div>
      <h3>Share one of mine</h3>
      <div class="trace-row"><label for="trace-by">Traced by (optional)</label><input type="text" id="trace-by" maxlength="${NAME_MAX}" value="${esc(tracedBy())}" placeholder="your name or handle" /></div>
      <ul class="trace-list">${
        mine.length
          ? mine
              .map(
                (s) => `<li><span>${esc(s.title)} <small>${(s.beats || []).length} beats${s.curated ? " · model scene" : s.shared ? " · shared" + (s.shared.tracedBy ? " by " + esc(s.shared.tracedBy) : "") : ""}</small></span>
                  <button type="button" data-t="export" data-id="${esc(s.id)}">Save as a trace file</button></li>`
              )
              .join("")
          : "<li>No curated films yet. Trace one in Library: Curated films.</li>"
      }</ul></div>`;
    flash = "";
  }
  function openPanel() {
    css();
    if (!dlg) {
      dlg = document.createElement("dialog");
      dlg.className = "trace-dlg";
      document.body.appendChild(dlg);
      dlg.addEventListener("click", async (e) => {
        if (e.target === dlg) return dlg.close();
        const b = e.target.closest("[data-t]");
        if (!b) return;
        const t = b.dataset.t;
        if (t === "close") dlg.close();
        else if (t === "pick") dlg.querySelector("#trace-file").click();
        else if (t === "export") {
          const tr = exportStudy(b.dataset.id);
          flash = tr ? `Saved “${esc(tr.title)}” as a trace file: ${tr.beats.length} beats, ${esc(Math.max(1, Math.round(json(tr).length / 1024)))} KB.` : "That film is not here any more.";
          draw();
        }
      });
      dlg.addEventListener("input", (e) => {
        if (e.target.id !== "trace-by") return;
        try {
          localStorage.setItem(BY_KEY, short(e.target.value, NAME_MAX));
        } catch (err) {}
      });
      dlg.addEventListener("change", async (e) => {
        if (e.target.id !== "trace-file") return;
        const { results, reload } = await importFiles(e.target.files);
        flash = results
          .map((r) =>
            r.ok
              ? `${r.have ? "Already in Curated films" : "Loaded"}: “${esc(r.title)}”, ${r.beats} beats. ${esc(r.note)}`
              : `<span class="trace-err">${esc(r.name)}: ${esc(r.error)}</span>`
          )
          .join("<br>");
        if (reload) {
          flash += "<br>Opening it now…";
          draw();
          setTimeout(() => location.reload(), 900);
          return;
        }
        if (S() && S().draw) S().draw();
        draw();
      });
    }
    draw();
    if (!dlg.open) {
      if (dlg.showModal) dlg.showModal();
      else dlg.setAttribute("open", "");
    }
  }

  Object.assign(api, { exportStudy, importFiles, openPanel });

  /* Library menu entry, next to Curated films. */
  function wire() {
    const menu = document.getElementById("lib-menu");
    if (!menu || menu.querySelector("[data-trace]")) return;
    const b = document.createElement("button");
    b.type = "button";
    b.dataset.trace = "share";
    b.innerHTML = "Share a film<small>save or load a counts-only trace</small>";
    const after = menu.querySelector('button[data-tab="study"]');
    menu.insertBefore(b, after ? after.nextSibling : null);
    b.addEventListener("click", () => {
      menu.hidden = true;
      const lb = document.getElementById("lib-btn");
      if (lb) lb.setAttribute("aria-expanded", "false");
      openPanel();
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", wire);
  else wire();
})();
