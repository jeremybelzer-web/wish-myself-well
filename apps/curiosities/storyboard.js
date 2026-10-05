/* Storyboard: the beta's main job. Keep many scenes, each a list of panels with all their values, and flip
   through them like a flip book. Panels are drawn with CuriosityBoard.panel, so they look like My film.
   "Make many" samples running automation at evenly spaced moments: the cheap way to get lots of boards.
   Shape: { scenes: [ { id, name, note, made, board: {id, title, slug, people}, panels: [ { v: {curiosityId: value}, line: {who, text} } ] } ] }.
   A scene can be tied to a scene of the story (story.js): scene.story = its index, -1 for none, unset = same
   place (storyboard scene 3 is story scene 3). The flip book then shows, under the panel, the story values of
   the characters in that panel (arc stage, emotional road, role, herd mentality).
   A take can hold up to 24 panels (My film's strip shows 1 to 8), and a scene dozens: thumbnails and grid
   panels draw only when they come near the screen. Under each panel a comic caption lists, in plain words,
   the curiosities that are on (labels, and the curiosity database's plain sentences when it is loaded).
   Under the strip, bands line up with the panels: a feeling line per character (the panel's emotion where
   they speak, else the story's value), comedy beats (setup, payoff, callback, escalation) and, when music
   curiosities exist, music on or off and how loud. Print (studio-print.js) prints the storyboard.
   localStorage key curiosities-storyboard-v1. Exposes window.CuriosityStoryboard = { mount(el), focusStory(i), data(), caption(panel, prev, max), putScenes(tag, scenes), on(fn), setTiming(list), timing(), selected(), addPictures(list, opts) }.
   Pictures in panels (added for the 3D view's "Send to storyboard", rig/snapshot.js): a panel may carry
   pic, a small JPEG or WebP data URL (about 640 x 288, the stage's 200:90 shape). Such a panel shows the
   picture where the drawn stage would be; its values (v) and line still give its header and caption.
   addPictures([{ pic, seconds? }], { si?, pi?, onto?, scene?, name?, label? }) puts them after the selected panel
   (or onto it when onto is true and there is one picture), in one save and one undo step. */

(function () {
  const KEY = "curiosities-storyboard-v1";
  const PREFS = "curiosities-storyboard-view-v1";

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
  function readJson(key) {
    try {
      return JSON.parse(localStorage.getItem(key));
    } catch (e) {
      return null;
    }
  }

  /* ---------- the store ---------- */
  function fix(saved) {
    const st = saved && typeof saved === "object" && !Array.isArray(saved) ? saved : {};
    if (!Array.isArray(st.scenes)) st.scenes = [];
    st.scenes = st.scenes.filter((s) => s && Array.isArray(s.panels));
    return st;
  }
  function load() {
    return fix(readJson(KEY));
  }
  /* With the engine's shared state on the page (engine/store.js), the storyboard is one of its parts: same
     saved key, and every change one step on the app's undo list (Ctrl+Z, History), undone in place without
     a reload. Without it, the storyboard keeps its own copy as before. */
  const part = (() => {
    const St = window.CurioStore;
    if (!St || typeof St.part !== "function") return null;
    try {
      return St.part("storyboard", { key: KEY, initial: () => ({ scenes: [] }), normalize: fix, commands: { put: (d, m) => (d.scenes = m.scenes) } });
    } catch (e) {
      return null;
    }
  })();
  const store = part ? part.view() : load();
  let saveError = "";
  function save(label) {
    if (part) {
      part.send({ type: "put", scenes: JSON.parse(JSON.stringify(store.scenes)), label: "Storyboard" + (label ? ": " + String(label).replace(/\.$/, "") : "") });
      saveError = part.saveError() ? "The browser is out of room, so the last change was not kept. Download the storyboard, then delete some scenes." : "";
      return;
    }
    try {
      localStorage.setItem(KEY, JSON.stringify(store));
      saveError = "";
    } catch (e) {
      saveError = "The browser is out of room, so the last change was not kept. Download the storyboard, then delete some scenes.";
    }
  }
  function prefs() {
    const p = readJson(PREFS) || {};
    return Object.assign({ speed: 4, many: 16, len: 8, as: "scenes", view: "flip", per: 0, caps: true, bands: true }, p);
  }
  function savePrefs(p) {
    try {
      localStorage.setItem(PREFS, JSON.stringify(p));
    } catch (e) {}
  }
  let idSeed = 0;
  function newId() {
    return "sb" + Date.now().toString(36) + (idSeed++).toString(36);
  }
  /* Scene names come from the story (Scene 1, Scene 2...) when there is one. */
  function defaultName(i) {
    try {
      const names = window.CuriosityStory && window.CuriosityStory.scenes();
      if (names && names[i]) return names[i];
    } catch (e) {}
    return "Scene " + (i + 1);
  }

  /* ---------- the tie to the story ---------- */
  const ST = () => window.CuriosityStory;
  function storyCount() {
    try {
      return ST() ? ST().scenes().length : 0;
    } catch (e) {
      return 0;
    }
  }
  /* The story scene a storyboard scene belongs to, or -1. */
  function storyOf(scene, si) {
    const n = storyCount();
    if (!n) return -1;
    const k = scene && scene.story != null && scene.story !== "" ? Number(scene.story) : si;
    return k >= 0 && k < n ? k : -1;
  }
  const STORY_BITS = [
    ["arcStage", "arc"],
    ["emoRoadCharacter", "road"],
    ["emotion", "feeling"],
    ["dramaticRole", "role"],
    ["herdMentality", "herd"],
  ];
  /* One plain line: the story values for the characters in this panel, in this story scene. */
  function storyLine(scene, si, p) {
    const st = ST();
    if (!st) return "";
    const k = storyOf(scene, si);
    if (k < 0) return `<span class="sb-small">Not tied to a story scene. Pick one under All scenes.</span>`;
    const chars = st.characters();
    const here = [];
    const add = (w) => {
      if (w && chars.includes(w) && !here.includes(w)) here.push(w);
    };
    add(p && p.line && p.line.who);
    ((scene.board && scene.board.people) || []).forEach((w) => add(typeof w === "string" ? w : w && w.name));
    const who = here.slice(0, 3);
    const head = `<b>Story scene ${k + 1}</b>`;
    if (!who.length) return `${head} · <span class="sb-small">no story character is in this panel.</span>`;
    const parts = who.map((w) => {
      const v = st.values(w)[k] || {};
      const bits = STORY_BITS.filter(([id]) => v[id] != null && v[id] !== "").map(([id, word]) => `${word} ${esc(v[id])}${id === "herdMentality" ? " of 5" : ""}`);
      return `<span class="sb-who">${esc(w)}</span>: ${bits.length ? bits.join(", ") : `<span class="sb-small">nothing set yet</span>`}`;
    });
    return `${head} · ${parts.join(" · ")}`;
  }
  let active = null; /* the mounted page, so the story workspaces can jump into it */
  let pendingStory = null;

  /* ---------- capturing My film ---------- */
  function boardInfo() {
    const B = window.CuriosityBoard;
    const s = (B && B.scene()) || { id: "", title: "", slug: "", people: [], lines: [] };
    return { id: s.id, title: s.title, slug: s.slug, people: (s.people || []).slice(), lines: (s.lines || []).slice() };
  }
  /* The storyboard can take up to 24 panels per take, more than My film's strip shows (1 to 8 angles). */
  const MAX_PER = 24;
  function boardCount() {
    const B = window.CuriosityBoard;
    return Math.max(1, Number(B && B.values().angleCount) || 4);
  }
  function panelCount(per) {
    const n = Number(per);
    return n > 0 ? Math.max(1, Math.min(MAX_PER, Math.round(n))) : boardCount();
  }
  /* The panels as they play at one moment: the controls, the applied strand, then running automation on top. */
  function capture(count, now) {
    const B = window.CuriosityBoard;
    const A = window.CurioAuto;
    const base = B ? B.values() : {};
    const applied = B && B.applied ? B.applied() : null;
    const running = A && A.running && A.running().length;
    const auto = running ? A.resolve(count, now).panels : null;
    const info = boardInfo();
    const lines = info.lines.length ? info.lines : [{ who: "", text: "—" }];
    return Array.from({ length: count }, (_, i) => {
      const v = Object.assign({}, base);
      if (applied)
        Object.entries(applied.values || {}).forEach(([id, vals]) => {
          const x = Array.isArray(vals) && vals.length ? vals[i % vals.length] : null;
          if (x != null && x !== "") v[id] = x;
        });
      if (auto && auto[i])
        Object.entries(auto[i]).forEach(([id, x]) => {
          if (x != null && x !== "" && String(x) !== String(base[id])) v[id] = x;
        });
      const l = lines[i % lines.length];
      return { v, line: { who: l.who, text: l.text } };
    });
  }
  function sceneRecord(panels, name, note) {
    const info = boardInfo();
    return { id: newId(), name, note: note || "", made: new Date().toISOString(), board: { id: info.id, title: info.title, slug: info.slug, people: info.people }, panels };
  }

  /* ---------- drawing a panel ---------- */
  function panelHtml(scene, p, i) {
    const B = window.CuriosityBoard;
    if (picOk(p)) return picPanelHtml(scene, p, i);
    if (!B || !B.panel) return `<figure class="panel"><p class="cap">The board is not loaded.</p></figure>`;
    try {
      return B.panel(p.line || { who: "", text: "—" }, i, scene.panels.length, p.v || {});
    } catch (e) {
      return `<figure class="panel"><p class="cap">This panel could not be drawn.</p></figure>`;
    }
  }
  function stageOnly(html) {
    const m = /<svg class="stage[\s\S]*?<\/svg>|<img class="stage[^>]*>/.exec(html);
    return m ? m[0] : "";
  }
  /* Every panel of every scene in order: the flip book's pages. */
  /* Listeners for other parts (Momentum's strip): { type: "draw" } after each redraw, { type: "page", at, si, pi }. */
  const listeners = [];
  function tell(ev) {
    listeners.forEach((fn) => {
      try {
        fn(ev);
      } catch (e) {
        console.warn("Storyboard listener: " + e.message);
      }
    });
  }
  function pages() {
    const out = [];
    store.scenes.forEach((s, si) => s.panels.forEach((p, pi) => out.push({ si, pi })));
    return out;
  }

  /* ---------- plain-word captions: which curiosities are on in a panel ---------- */
  let curIndex = null;
  function curRow(id) {
    if (!curIndex) {
      curIndex = {};
      try {
        /* CURIOSITIES is a top-level const of catalog.js; the database may add rows to it later, so read it lazily. */
        (typeof CURIOSITIES !== "undefined" ? CURIOSITIES : []).forEach((c) => c && c.id && (curIndex[c.id] = c));
      } catch (e) {}
    }
    return curIndex[id] || null;
  }
  const DB = () => (window.CuriosityDB && typeof window.CuriosityDB.get === "function" ? window.CuriosityDB : null);
  /* The database's plain sentence for a curiosity or one of its sliders ("music.level"), else the catalog note. */
  function plainOf(id) {
    const db = DB();
    if (db) {
      try {
        const d = db.get("curiosity", id);
        if (d && d.plain) return d.plain;
        const dot = id.indexOf(".");
        if (dot > 0) {
          const parent = db.get("curiosity", id.slice(0, dot));
          const sl = parent && (parent.sliders || []).find((x) => x && x.id === id.slice(dot + 1));
          if (sl && sl.plain) return sl.plain;
        }
      } catch (e) {}
    }
    const c = curRow(id);
    return (c && (c.note || c.view)) || "";
  }
  function labelOf(id) {
    const c = curRow(id);
    if (c && c.label) return c.label;
    const dot = id.indexOf(".");
    return dot > 0 ? (curRow(id.slice(0, dot)) || { label: id.slice(0, dot) }).label + ": " + id.slice(dot + 1) : id;
  }
  function domainOf(id) {
    try {
      if (window.CurioAuto && window.CurioAuto.domain) return window.CurioAuto.domain(id);
    } catch (e) {}
    const c = curRow(id);
    if (c && c.options) return { kind: "choice", options: c.options };
    if (c && c.kind === "range") return { kind: "range", min: c.min, max: c.max };
    return null;
  }
  /* 0 to 1 along a curiosity's own scale (low to high, none to a lot), or null when it cannot be placed. */
  function level(id, x) {
    if (x == null || x === "") return null;
    const d = domainOf(id);
    if (d && d.kind === "range" && Number.isFinite(Number(x)) && d.max > d.min) return Math.max(0, Math.min(1, (Number(x) - d.min) / (d.max - d.min)));
    if (d && d.kind === "choice" && d.options && d.options.length > 1) {
      const k = d.options.map(String).indexOf(String(x));
      return k < 0 ? null : k / (d.options.length - 1);
    }
    return null;
  }
  function valueWords(id, x) {
    const d = domainOf(id);
    if (d && d.kind === "range" && Number.isFinite(Number(x))) return Number(d.min) === 0 ? `${x} of ${d.max}` : `${x} (on a scale of ${d.min} to ${d.max})`;
    return String(x);
  }
  /* Board bookkeeping that is not a look at the scene. */
  const SKIP = new Set(["angleCount", "mains", "groups"]);
  /* The curiosities that are on in a panel: set, and either not one of the board's controls (so a strand or
     automation put it there) or moved off the control's starting value. Ones that changed since the panel
     before come first. Each item: {id, label, value, plain, changed}. */
  function capItems(p, prev) {
    const v = (p && p.v) || {};
    const pv = (prev && prev.v) || null;
    const out = [];
    Object.keys(v).forEach((id) => {
      const x = v[id];
      if (x == null || x === "" || SKIP.has(id) || typeof x === "object") return;
      const c = curRow(id);
      if (c && c.live && String(c.value) === String(x)) return;
      out.push({ id, label: labelOf(id), value: valueWords(id, x), plain: plainOf(id), changed: !!pv && String(pv[id]) !== String(x) });
    });
    out.sort((a, b) => Number(b.changed) - Number(a.changed));
    return out;
  }
  /* A short comic caption: up to max items in plain words, then how many more. */
  function captionHtml(p, prev, max, big) {
    const items = capItems(p, prev);
    if (!items.length) return `<p class="sb-caption${big ? " big" : ""}"><span class="sb-small">Nothing is changed from My film's starting settings here.</span></p>`;
    const shown = items.slice(0, max);
    const more = items.length - shown.length;
    if (big)
      return `<div class="sb-caption big"><ul>${shown
        .map((it) => `<li><b>${esc(it.label)}:</b> ${esc(it.value)}${it.changed ? ` <span class="sb-new">changed</span>` : ""}${it.plain ? `<br><span class="sb-plain">${esc(it.plain)}</span>` : ""}</li>`)
        .join("")}</ul>${more > 0 ? `<p class="sb-small">and ${more} more</p>` : ""}</div>`;
    return `<p class="sb-caption">${shown.map((it) => `<span title="${esc(it.plain)}">${esc(it.label)}: <b>${esc(it.value)}</b></span>`).join(" · ")}${more > 0 ? ` <span class="sb-small">+${more} more</span>` : ""}</p>`;
  }
  function captionText(p, prev, max) {
    const items = capItems(p, prev);
    const shown = items.slice(0, max || 3);
    const more = items.length - shown.length;
    return shown.map((it) => `${it.label}: ${it.value}`).join(" · ") + (more > 0 ? ` (+${more} more)` : "");
  }

  /* ---------- bands under the strip: feeling per character, comedy beats, music ---------- */
  /* How good or bad each feeling of the catalog is, -5 to 5, when the database's "Unhappy to happy" slider is not set. */
  const FEEL = { loving: 3, joyful: 4, curious: 1, melancholy: -3, anxious: -2, fearful: -4, angry: -3, triumphant: 5, absurd: 1, dreamlike: 0 };
  const ROAD = { "lowest point": -4, falling: -2, steady: 0, rising: 2, "highest point": 4 };
  const LINE_COLORS = ["#c45c26", "#2a6fb0", "#4b8a3c", "#8a4fa8"];
  function feelOf(v) {
    if (!v) return null;
    let x = Number(v["emotion.valence"]);
    if (!Number.isFinite(x) || v["emotion.valence"] === "" || v["emotion.valence"] == null) x = FEEL[v.emotion];
    if (x == null || !Number.isFinite(x)) return null;
    const k = Number(v.emotionIntensity);
    if (Number.isFinite(k) && v.emotionIntensity !== "") x = x * (0.5 + k / 10);
    return Math.max(-5, Math.min(5, x));
  }
  /* The story's value for a character in a storyboard scene: their feeling there, else their emotional road. */
  function storyFeel(name, scene, si) {
    const st = ST();
    const k = storyOf(scene, si);
    if (!st || k < 0 || !name) return null;
    try {
      if (!st.characters().includes(name)) return null;
      const v = st.values(name)[k] || {};
      const f = feelOf(v);
      if (f != null) return f;
      return ROAD[v.emoRoadCharacter] != null ? ROAD[v.emoRoadCharacter] : null;
    } catch (e) {
      return null;
    }
  }
  function hasMusic() {
    const db = DB();
    try {
      if (db && (db.get("curiosity", "music") || db.get("curiosity", "musicCue"))) return true;
    } catch (e) {}
    return !!(curRow("music") || curRow("musicCue") || curRow("music.presence"));
  }
  /* Music in a panel: {on, loud 0..1, words} or null when nothing about music is set. */
  function musicOf(v) {
    if (!v) return null;
    const pres = v["music.presence"] != null && v["music.presence"] !== "" ? v["music.presence"] : v.music;
    const cue = v.musicCue;
    const db = v["music.level"];
    if ((pres == null || pres === "") && (cue == null || cue === "") && (db == null || db === "") && (v.noMusic == null || v.noMusic === "")) return null;
    const presId = v["music.presence"] != null && v["music.presence"] !== "" ? "music.presence" : "music";
    let on = true;
    if (pres != null && pres !== "") on = !/^(none|off|no)$/i.test(String(pres)) && level(presId, pres) !== 0;
    else if (cue != null && cue !== "") on = String(cue) !== "off";
    if (v.noMusic != null && v.noMusic !== "" && Number(v.noMusic) > 0 && (pres == null || pres === "")) on = false;
    let loud = level("music.level", db);
    if (loud == null && pres != null && pres !== "") loud = level(presId, pres);
    if (loud == null && cue != null && cue !== "") loud = { off: 0, under: 0.45, featured: 1 }[cue];
    if (loud == null) loud = on ? 0.5 : 0;
    const words = on ? [pres || cue, db != null && db !== "" ? `${db} dB against the voices` : ""].filter(Boolean).join(", ") : "no music";
    return { on, loud: on ? Math.max(0.12, loud) : 0, words };
  }
  /* Comedy beats in a panel against the one before: setup, building, payoff, callback, escalation. */
  function comedyOf(v, pv) {
    const out = [];
    if (!v) return out;
    const beat = String(v.comicBeat || "");
    const dev = String(v.comedyDevice || "");
    if (beat === "setup planted") out.push("setup");
    if (beat === "payoff lands") out.push("payoff");
    if (dev === "callback" || dev === "running gag" || v.callback === "yes") out.push("callback");
    const e = Number(v.comicEscalation), pe = pv ? Number(pv.comicEscalation) : NaN;
    if (dev === "escalation" || (Number.isFinite(e) && Number.isFinite(pe) && e > pe)) out.push("escalation");
    if (beat === "building" && !out.length) out.push("building");
    return out;
  }
  const BEAT = { setup: ["S", "a setup is planted"], payoff: ["P", "the payoff lands"], callback: ["C", "a callback to an earlier joke"], escalation: ["E", "things escalate"], building: ["·", "the joke is building"] };

  /* items: [{p, prev, scene, si, pi, k}] in strip order. pitch: px per column. Returns the bands' HTML. */
  function bandsHtml(items, pitch, cur) {
    if (!items.length) return "";
    const n = items.length;
    const W = n * pitch;
    const cx = (k) => k * pitch + pitch / 2;
    const hit = (k, text, extra) => `<rect x="${k * pitch}" y="0" width="${pitch}" height="100%" fill="transparent" ${extra || ""}><title>${esc(text)}</title></rect>`;
    const hl = cur != null && cur >= 0 ? `<rect class="sb-hl" data-sb-hl x="${cur * pitch}" y="0" width="${pitch}" height="100%"></rect>` : "";
    /* Scene boundaries, as thin rules. */
    const rules = items.map((it, k) => (k > 0 && it.pi === 0 ? `<line x1="${k * pitch}" x2="${k * pitch}" y1="0" y2="100%" class="sb-rule"></line>` : "")).join("");
    const go = (it) => (it.k != null ? `data-go="${it.k}"` : `data-open="${it.si}:${it.pi}"`);

    /* 1. Feeling, one line per character. */
    const count = {};
    items.forEach((it) => {
      const w = it.p.line && it.p.line.who;
      if (w) count[w] = (count[w] || 0) + 2;
      ((it.scene.board && it.scene.board.people) || []).forEach((x) => {
        const nm = typeof x === "string" ? x : x && x.name;
        if (nm) count[nm] = (count[nm] || 0) + 1;
      });
    });
    const chars = Object.keys(count)
      .sort((a, b) => count[b] - count[a])
      .slice(0, 4);
    const H1 = 70, top = 6, bot = 64;
    const y = (f) => (top + ((5 - f) / 10) * (bot - top)).toFixed(1);
    let feelAny = false;
    const lines = chars
      .map((name, ci) => {
        const pts = items.map((it) => {
          const speaks = it.p.line && it.p.line.who === name;
          const f = speaks ? feelOf(it.p.v) : null;
          const s = f == null ? storyFeel(name, it.scene, it.si) : null;
          return f != null ? { f, speaks: true } : s != null ? { f: s, speaks: false } : null;
        });
        if (pts.some(Boolean)) feelAny = true;
        /* One line per character through the panels that have a value, joined across gaps, broken between scenes. */
        let d = "";
        let lastSi = null;
        pts.forEach((pt, k) => {
          if (!pt) return;
          d += `${lastSi === items[k].si ? "L" : "M"}${cx(k)} ${y(pt.f)} `;
          lastSi = items[k].si;
        });
        const col = LINE_COLORS[ci];
        const dots = pts
          .map((pt, k) => (pt && pt.speaks ? `<circle cx="${cx(k)}" cy="${y(pt.f)}" r="4" fill="${col}" stroke="var(--panel)" stroke-width="2"></circle>` : ""))
          .join("");
        return d ? `<path d="${d}" fill="none" stroke="${col}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"></path>${dots}` : "";
      })
      .join("");
    const feelHits = items
      .map((it, k) => {
        const parts = chars.map((name) => {
          const speaks = it.p.line && it.p.line.who === name;
          const f = speaks ? feelOf(it.p.v) : null;
          const s = f == null ? storyFeel(name, it.scene, it.si) : null;
          if (f != null) return `${name}: ${it.p.v.emotion || "feeling"} (${f > 0 ? "+" : ""}${Math.round(f * 10) / 10})`;
          if (s != null) return `${name}: from the story (${s > 0 ? "+" : ""}${Math.round(s * 10) / 10})`;
          return "";
        });
        return hit(k, `Panel ${it.pi + 1}. ${parts.filter(Boolean).join("; ") || "no feeling set"}`, go(it));
      })
      .join("");
    const legend = chars.map((nm, ci) => `<span class="sb-key"><i style="background:${LINE_COLORS[ci]}"></i>${esc(nm)}</span>`).join("");
    const feel = `<div class="sb-band">
        <div class="sb-band-label"><b>Feeling, per character</b> <span class="sb-small">higher is happier; a dot is a panel where they speak, a plain line comes from the story</span><span class="sb-keys">${legend}</span></div>
        ${
          feelAny
            ? `<svg class="sb-band-svg" width="${W}" height="${H1}" viewBox="0 0 ${W} ${H1}" role="img" aria-label="Feeling line for ${esc(chars.join(", "))} across ${n} panels">
          ${hl}${rules}<line x1="0" x2="${W}" y1="${y(0)}" y2="${y(0)}" class="sb-mid"></line>${lines}${feelHits}</svg>`
            : `<p class="sb-small sb-band-empty">No feeling is set in these panels yet. Automate Emotion, or set the story's emotional road.</p>`
        }
      </div>`;

    /* 2. Comedy beats. */
    let comAny = false;
    let lastSetup = -1;
    const arcs = [];
    const marks = items
      .map((it, k) => {
        const prevV = k > 0 && items[k - 1].si === it.si ? items[k - 1].p.v : null;
        const beats = comedyOf(it.p.v, prevV);
        if (!beats.length) return hit(k, `Panel ${it.pi + 1}: no comedy beat`, go(it));
        comAny = true;
        if (beats.includes("setup")) lastSetup = k;
        if (beats.includes("payoff") && lastSetup >= 0) {
          const x1 = cx(lastSetup), x2 = cx(k);
          arcs.push(`<path d="M${x1} 22 Q${(x1 + x2) / 2} ${x2 - x1 > pitch ? 2 : 10} ${x2} 22" fill="none" stroke="var(--ink)" stroke-width="1.5" stroke-dasharray="3 3"></path>`);
          lastSetup = -1;
        }
        const g = beats
          .slice(0, 2)
          .map((b, j) => {
            const yy = 26 + j * 15;
            return `<rect x="${cx(k) - 7}" y="${yy - 10}" width="14" height="14" rx="2" class="sb-beat ${b}"></rect><text x="${cx(k)}" y="${yy + 1}" text-anchor="middle" class="sb-beat-t">${BEAT[b][0]}</text>`;
          })
          .join("");
        return g + hit(k, `Panel ${it.pi + 1}: ${beats.map((b) => BEAT[b][1]).join(", ")}`, go(it));
      })
      .join("");
    const H2 = 50;
    const comedy = `<div class="sb-band">
        <div class="sb-band-label"><b>Comedy beats</b> <span class="sb-keys">${["setup", "payoff", "callback", "escalation"].map((b) => `<span class="sb-key"><i class="sb-beat-k ${b}">${BEAT[b][0]}</i>${BEAT[b][1]}</span>`).join("")}</span></div>
        ${
          comAny
            ? `<svg class="sb-band-svg" width="${W}" height="${H2}" viewBox="0 0 ${W} ${H2}" role="img" aria-label="Comedy beats across ${n} panels">${hl}${rules}${arcs.join("")}${marks}</svg>`
            : `<p class="sb-small sb-band-empty">No comedy beat is marked in these panels. Automate Comedy's "Setup and payoff" or "Kind of joke" to see them.</p>`
        }
      </div>`;

    /* 3. Music, only when the curiosity database (or the catalog) has music curiosities. */
    let music = "";
    if (hasMusic()) {
      let musAny = false;
      const H3 = 40;
      const bars = items
        .map((it, k) => {
          const m = musicOf(it.p.v);
          if (!m) return hit(k, `Panel ${it.pi + 1}: music not set`, go(it));
          musAny = true;
          const bw = Math.max(4, pitch - 10);
          const h = Math.round(m.loud * 30);
          const shape = m.on
            ? `<rect x="${cx(k) - bw / 2}" y="${36 - h}" width="${bw}" height="${h}" rx="2" class="sb-music"></rect>`
            : `<line x1="${cx(k) - 5}" x2="${cx(k) + 5}" y1="31" y2="37" class="sb-nomusic"></line><line x1="${cx(k) - 5}" x2="${cx(k) + 5}" y1="37" y2="31" class="sb-nomusic"></line>`;
          return shape + hit(k, `Panel ${it.pi + 1}: ${m.words}`, go(it));
        })
        .join("");
      music = `<div class="sb-band">
          <div class="sb-band-label"><b>Music</b> <span class="sb-small">bar height is how loud; × is no music</span></div>
          ${
            musAny
              ? `<svg class="sb-band-svg" width="${W}" height="${H3}" viewBox="0 0 ${W} ${H3}" role="img" aria-label="Music on or off and how loud across ${n} panels">${hl}${rules}<line x1="0" x2="${W}" y1="36.5" y2="36.5" class="sb-mid"></line>${bars}</svg>`
              : `<p class="sb-small sb-band-empty">No music is set in these panels. Automate Music (in Music &amp; sound) to see it here.</p>`
          }
        </div>`;
    }
    return `<div class="sb-bands">${feel}${comedy}${music}</div>`;
  }

  /* ---------- the PNG contact sheet: each panel's stage drawing plus its words, drawn on a canvas ---------- */
  const LIGHT_BG = { dusk: "#d7c7ae", flat: "#f4f1ea", practical: "#fff6e4", hard: "#f3f3f3", moon: "#d5dde6" };
  function svgImage(svg) {
    return new Promise((res) => {
      if (!svg) return res(null);
      const src = svg.replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="180" ');
      const img = new Image();
      img.onload = () => res(img);
      img.onerror = () => res(null);
      img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(src);
    });
  }
  function clip(ctx, text, w) {
    text = String(text || "");
    if (ctx.measureText(text).width <= w) return text;
    while (text.length > 1 && ctx.measureText(text + "…").width > w) text = text.slice(0, -1);
    return text + "…";
  }
  async function contactSheet() {
    const all = pages().slice(0, 600);
    if (!all.length) return null;
    const cols = Math.min(8, Math.max(...store.scenes.map((s) => s.panels.length)));
    const W = 220, H = 150, PAD = 12, LABEL = 22;
    const rows = [];
    store.scenes.forEach((s, si) => {
      for (let k = 0; k < s.panels.length; k += cols) rows.push({ si, from: k, first: k === 0 });
    });
    const height = PAD + rows.reduce((h, r) => h + (r.first ? LABEL : 0) + H + PAD, 0);
    const canvas = document.createElement("canvas");
    canvas.width = PAD + cols * (W + PAD);
    canvas.height = Math.min(30000, height);
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#f7efe2";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    let y = PAD;
    for (const r of rows) {
      if (y > canvas.height) break;
      const s = store.scenes[r.si];
      if (r.first) {
        ctx.fillStyle = "#c45c26";
        ctx.font = "500 13px 'IBM Plex Mono', monospace";
        ctx.fillText(clip(ctx, `${r.si + 1}. ${s.name}${s.note ? " · " + s.note : ""}`, canvas.width - 2 * PAD), PAD, y + 14);
        y += LABEL;
      }
      for (let k = 0; k < cols && r.from + k < s.panels.length; k++) {
        const pi = r.from + k;
        const p = s.panels[pi];
        const v = p.v || {};
        const x = PAD + k * (W + PAD);
        ctx.fillStyle = LIGHT_BG[v.lighting] || "#fffaf2";
        ctx.fillRect(x, y, W, H);
        ctx.strokeStyle = "#1c1712";
        ctx.lineWidth = 3;
        ctx.strokeRect(x + 1.5, y + 1.5, W - 3, H - 3);
        ctx.fillStyle = "#c45c26";
        ctx.font = "10px 'IBM Plex Mono', monospace";
        ctx.fillText(clip(ctx, `PANEL ${pi + 1}${v.emotion ? " · " + v.emotion : ""}`, W / 2), x + 8, y + 16);
        const right = [v.angleHeight, v.shotSize].filter(Boolean).join(" ");
        ctx.textAlign = "right";
        ctx.fillText(clip(ctx, right, W / 2 - 12), x + W - 8, y + 16);
        ctx.textAlign = "left";
        const img = picOk(p) ? await picImage(p.pic) : await svgImage(stageOnly(panelHtml(s, p, pi)));
        ctx.fillStyle = "rgba(255,255,255,0.45)";
        ctx.fillRect(x + 8, y + 24, W - 16, 86);
        if (img) ctx.drawImage(img, x + 8, y + 24, W - 16, 86);
        ctx.fillStyle = "#1c1712";
        ctx.font = "12px Fraunces, Palatino, serif";
        const line = p.line || {};
        ctx.fillText(clip(ctx, `${line.who || ""} ${line.text || ""}`.trim(), W - 16), x + 8, y + 132);
      }
      y += H + PAD;
    }
    return canvas;
  }

  function download(name, blob) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 500);
  }

  /* ---------- styles ---------- */
  function injectStyle() {
    if (document.getElementById("storyboard-style")) return;
    const st = document.createElement("style");
    st.id = "storyboard-style";
    st.textContent = `
      .sb { min-width: 0; max-width: 100%; }
      .sb h3 { font-family: var(--serif); font-weight: 500; font-size: 20px; margin: 0 0 4px; }
      .sb h4 { font-family: var(--mono); font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; margin: 0 0 6px; }
      .sb-note { font-size: 13px; color: #3a3229; margin: 2px 0 8px; }
      .sb-note.later { font-style: italic; }
      .sb-warn { border: 1px dashed var(--saffron); background: #fff8ef; padding: 6px 8px; font-size: 13px; }
      .sb-box { border-top: 2px solid var(--ink); padding-top: 10px; margin-top: 14px; min-width: 0; }
      .sb-row { display: flex; flex-wrap: wrap; gap: 8px 14px; align-items: end; margin: 6px 0; }
      .sb-row label.field { margin: 0; min-width: 0; }
      .sb-row select, .sb-row input[type=number] { max-width: 160px; }
      .sb-views { display: flex; gap: 6px; flex-wrap: wrap; }
      .sb-views button.on { background: var(--ink); color: var(--paper); }
      .sb-viewer { outline: none; }
      .sb-viewer:focus-visible { outline: 3px solid var(--saffron); outline-offset: 4px; }
      .sb-stagewrap { display: flex; justify-content: center; min-height: 200px; }
      .sb-big { width: 100%; max-width: 620px; }
      .sb-big .panel { flex: none; width: 100%; min-height: 0; }
      .sb-big .stage { height: auto; aspect-ratio: 200 / 90; }
      .sb-big .cap { font-size: 14px; }
      .sb-big .balloon { font-size: max(16px, 1em) !important; }
      .sb-count { font-family: var(--mono); font-size: 13px; text-align: center; margin: 8px 0; }
      .sb-count b { font-family: var(--serif); font-weight: 500; font-size: 18px; }
      .sb-transport { display: flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: 8px 12px; }
      .sb-transport button { min-width: 44px; min-height: 36px; }
      .sb-transport label { display: flex; align-items: center; gap: 6px; font-family: var(--mono); font-size: 12px; }
      .sb-transport input[type=range] { width: 140px; max-width: 40vw; }
      .sb-thumbs { display: flex; gap: 4px; overflow-x: auto; padding: 6px 0 8px; margin-top: 8px; max-width: 100%; }
      .sb-thumb { flex: none; width: 64px; padding: 0; border: 2px solid var(--line); background: var(--panel); cursor: pointer; display: grid; font-family: var(--mono); font-size: 9px; line-height: 1.3; }
      .sb-thumb.first { border-left: 4px solid var(--saffron); }
      .sb-thumb.on { border-color: var(--ink); background: #ffe2c4; }
      .sb-thumb svg, .sb-thumb img.stage { width: 100%; height: 29px; display: block; object-fit: cover; border: 0; }
      img.stage.sb-pic { display: block; object-fit: cover; background: #f4f1ea; }
      .sb-grid { display: grid; gap: 14px; }
      .sb-scene { border: 2px solid var(--ink); padding: 8px; min-width: 0; background: var(--panel); }
      .sb-scene-head { display: flex; flex-wrap: wrap; gap: 6px 10px; align-items: center; }
      .sb-scene-head input { flex: 1 1 140px; min-width: 0; font-family: var(--serif); font-size: 16px; }
      .sb-scene-head .sb-acts { display: flex; gap: 4px; flex-wrap: wrap; }
      .sb-scene-head .sb-acts button { font-family: var(--mono); font-size: 11px; }
      .sb-scene .strip { margin-top: 6px; }
      .sb-scene .panel { flex: 0 0 170px; min-height: 0; cursor: pointer; }
      .sb-scene .panel .cap { font-size: 11px; }
      .sb-scene .balloon { font-size: 12px !important; }
      .sb-scene .stage { height: 64px; }
      .sb-small { font-family: var(--mono); font-size: 11px; color: #7a6f63; }
      .sb-story { font-size: 13px; text-align: center; margin: 6px auto 0; max-width: 620px; color: #3a3229; }
      .sb-story .sb-who { font-weight: 600; }
      .sb-tie { display: flex; align-items: center; gap: 6px; font-family: var(--mono); font-size: 11px; }
      .sb-tie select { font-size: 12px; max-width: 150px; }
      .sb-status { font-family: var(--mono); font-size: 12px; color: var(--saffron); min-height: 1.3em; margin: 4px 0; }
      .sb-toggles { display: flex; flex-wrap: wrap; gap: 4px 12px; font-family: var(--mono); font-size: 12px; }
      .sb-toggles label { display: flex; align-items: center; gap: 4px; }
      /* comic captions: a narration box under each panel */
      .sb-caption { margin: 0; border: 2px solid var(--ink); background: #fff1c9; padding: 4px 6px; font-size: 11px; line-height: 1.35; color: var(--ink); }
      .sb-caption b { font-weight: 600; }
      .sb-caption.big { font-size: 13px; max-width: 620px; margin: 8px auto 0; }
      .sb-caption.big ul { margin: 0; padding-left: 18px; }
      .sb-caption.big li { margin: 2px 0; }
      .sb-plain { font-size: 12px; color: #5a4f43; }
      .sb-new { font-family: var(--mono); font-size: 10px; color: var(--saffron); text-transform: uppercase; letter-spacing: 0.06em; }
      .sb.no-caps .sb-caption { display: none; }
      .sb.no-bands .sb-bands { display: none; }
      /* the reel: thumbnails and the bands under them scroll together, one column per panel */
      .sb-reel { overflow-x: auto; max-width: 100%; padding: 6px 0 8px; margin-top: 8px; }
      .sb-thumbrow { display: flex; gap: 4px; width: max-content; }
      .sb-thumbrow .sb-thumb { min-height: 46px; }
      .sb-thumb .sb-cap-mini { display: block; font-size: 8px; padding: 0 2px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; background: #fff1c9; border-top: 1px solid var(--ink); }
      .sb.no-caps .sb-cap-mini { display: none; }
      .sb-bands { width: max-content; min-width: 100%; }
      .sb-band { margin-top: 6px; }
      .sb-band-label { position: sticky; left: 0; width: fit-content; max-width: min(560px, calc(100vw - 56px)); font-size: 12px; display: flex; flex-wrap: wrap; gap: 2px 8px; align-items: baseline; }
      .sb-band-empty { position: sticky; left: 0; width: fit-content; max-width: min(560px, calc(100vw - 56px)); margin: 2px 0; }
      .sb-band-svg { display: block; max-width: none; background: var(--panel); box-shadow: inset 0 1px 0 var(--line), inset 0 -1px 0 var(--line); }
      .sb-band-svg rect[data-go], .sb-band-svg rect[data-open] { cursor: pointer; }
      .sb-band-svg rect[data-go]:hover, .sb-band-svg rect[data-open]:hover { fill: rgba(196, 92, 38, 0.08); }
      .sb-hl { fill: #ffe2c4; }
      .sb-mid { stroke: var(--line); stroke-dasharray: 3 3; }
      .sb-rule { stroke: var(--saffron); stroke-width: 2; }
      .sb-keys { display: inline-flex; flex-wrap: wrap; gap: 2px 10px; }
      .sb-key { display: inline-flex; align-items: center; gap: 4px; font-family: var(--mono); font-size: 10px; }
      .sb-key i { display: inline-block; width: 12px; height: 3px; border-radius: 2px; }
      .sb-key i.sb-beat-k { width: 13px; height: 13px; font-style: normal; text-align: center; line-height: 13px; font-size: 9px; border-radius: 2px; color: var(--ink); border: 1px solid var(--ink); }
      .sb-beat { stroke: var(--ink); stroke-width: 1; fill: var(--panel); }
      .sb-beat.setup, .sb-beat-k.setup { fill: #fff1c9; background: #fff1c9; }
      .sb-beat.payoff, .sb-beat-k.payoff { fill: #f2b48a; background: #f2b48a; }
      .sb-beat.callback, .sb-beat-k.callback { fill: #cfe0f2; background: #cfe0f2; }
      .sb-beat.escalation, .sb-beat-k.escalation { fill: #e7d3f0; background: #e7d3f0; }
      .sb-beat-t { font-family: var(--mono); font-size: 9px; fill: var(--ink); pointer-events: none; }
      .sb-music { fill: #2a6fb0; }
      .sb-nomusic { stroke: #7a6f63; stroke-width: 1.5; }
      .sb-lazy { background: var(--panel); }
      .sb-scene .sb-reel { margin-top: 6px; }
      .sb-scene .sb-strip { overflow: visible; width: max-content; padding-bottom: 0; }
      .sb-scene .panel.sb-lazy { min-height: 170px; }
      .sb-more { margin-top: 6px; }
    `;
    document.head.appendChild(st);
  }

  /* Column widths of the two reels, so each band lines up under its panel: a 64px thumbnail plus a 4px gap,
     and a 170px grid panel plus the strip's 10px gap. */
  const THUMB_PITCH = 68;
  const GRID_PITCH = 180;

  /* ---------- the page ---------- */
  function mount(el) {
    if (!el) return null;
    injectStyle();
    const view = prefs();
    let at = 0; /* the page the flip book shows */
    let playing = false;
    let raf = 0;
    let last = 0;
    let status = "";

    function setStatus(s) {
      status = s;
      const n = el.querySelector("[data-sb=status]");
      if (n) n.textContent = s;
    }
    function persist(msg) {
      save(msg);
      setStatus(saveError || msg || "");
    }

    function sceneOptions() {
      const opts = store.scenes.map((s, i) => `<option value="${i}">${i + 1}. ${esc(s.name)}</option>`);
      opts.push(`<option value="new" selected>${store.scenes.length + 1}. ${esc(defaultName(store.scenes.length))} (new)</option>`);
      return opts.join("");
    }

    function perOptions() {
      const per = Number(view.per) || 0;
      const opts = [`<option value="0" ${per ? "" : "selected"}>Same as My film (${boardCount()})</option>`];
      for (let k = 1; k <= MAX_PER; k++) opts.push(`<option value="${k}" ${k === per ? "selected" : ""}>${k}</option>`);
      return opts.join("");
    }
    function perNote() {
      const n = panelCount(view.per);
      return `Takes ${n} panel${n === 1 ? "" : "s"} of My film as they play right now, running automation included${n > boardCount() ? ` (My film shows ${boardCount()}; the storyboard keeps going, up to ${MAX_PER})` : ""}. Make many uses this too. Saving into a scene you already have replaces its panels.`;
    }

    function draw() {
      queueMicrotask(() => tell({ type: "draw" })); /* after this redraw has finished */
      const running = window.CurioAuto && window.CurioAuto.running ? window.CurioAuto.running().length : 0;
      el.innerHTML = `<div class="sb ${view.caps ? "" : "no-caps"} ${view.bands ? "" : "no-bands"}">
        <h3>Storyboard</h3>
        <p class="sb-note">Save My film as scenes, make lots of them, and flip through them like a flip book.</p>
        <p class="sb-note later">Later this storyboard can be turned into a finished film or handed to an AI video tool.</p>

        <div class="sb-box">
          <h4>Save my film</h4>
          <div class="sb-row">
            <label class="field">Into scene
              <select data-sb="into">${sceneOptions()}</select>
            </label>
            <label class="field">Panels per take
              <select data-sb="per">${perOptions()}</select>
            </label>
            <button type="button" data-sb="save">Save my film into this scene</button>
          </div>
          <p class="sb-small" data-sb="pernote">${perNote()}</p>
        </div>

        <div class="sb-box">
          <h4>Make many</h4>
          <p class="sb-note">Running automation keeps changing the film; this takes snapshots of it at evenly spaced moments, so one automation gives you many storyboards at once.</p>
          <div class="sb-row">
            <label class="field">How many takes
              <select data-sb="many">${[2, 4, 8, 16, 32, 64].map((n) => `<option ${n === Number(view.many) ? "selected" : ""}>${n}</option>`).join("")}</select>
            </label>
            <label class="field">Across (seconds)
              <input type="number" data-sb="len" min="0.5" max="600" step="0.5" value="${esc(view.len)}" />
            </label>
            <label class="field">Keep each as
              <select data-sb="as">
                <option value="scenes" ${view.as === "scenes" ? "selected" : ""}>its own scene</option>
                <option value="panels" ${view.as === "panels" ? "selected" : ""}>panels of one new scene (takes × panels per take)</option>
              </select>
            </label>
            <button type="button" data-sb="make">Make them</button>
          </div>
          <p class="sb-small">${running ? `${running} automation${running === 1 ? " is" : "s are"} running now.` : "No automation is running, so every snapshot will look the same. Turn one on in a workspace first (an LFO moves on its own)."}</p>
        </div>

        <p class="sb-status" data-sb="status" role="status">${esc(saveError || status)}</p>

        <div class="sb-box">
          <div class="sb-row" style="justify-content: space-between; align-items: center">
            <div class="sb-views" role="group" aria-label="View">
              <button type="button" data-sb="view-flip" class="${view.view === "flip" ? "on" : ""}">Flip through</button>
              <button type="button" data-sb="view-grid" class="${view.view === "grid" ? "on" : ""}">All scenes</button>
            </div>
            <div class="sb-toggles">
              <label><input type="checkbox" data-sb="caps" ${view.caps ? "checked" : ""} /> Captions</label>
              <label><input type="checkbox" data-sb="bands" ${view.bands ? "checked" : ""} /> Feeling, comedy and music bands</label>
            </div>
            <span class="sb-small">${store.scenes.length} scene${store.scenes.length === 1 ? "" : "s"} · ${pages().length} panel${pages().length === 1 ? "" : "s"}</span>
          </div>
          <div data-sb="body"></div>
        </div>

        <div class="sb-box">
          <h4>Take it with you</h4>
          <div class="sb-row">
            <button type="button" data-sb="json">Download storyboard (JSON)</button>
            <button type="button" data-sb="png">Download contact sheet (PNG)</button>
            <button type="button" data-sb="print">Print or save as PDF…</button>
            <label class="field">Open a storyboard file
              <input type="file" accept="application/json,.json" data-sb="import" />
            </label>
          </div>
          <p class="sb-small">The contact sheet draws each panel's stage and its line; long captions are left out to keep it quick. Print opens the Print tool on this storyboard: comic pages, a folded zine or storyboard sheets, as PNG pages or a page you can print or save as a PDF.</p>
        </div>
      </div>`;
      drawBody();
    }

    function drawBody() {
      const body = el.querySelector("[data-sb=body]");
      if (!body) return;
      if (!store.scenes.length) {
        body.innerHTML = `<p class="sb-note">No scenes yet. Save My film above, or make many from a running automation.</p>`;
        return;
      }
      if (view.view === "grid") body.innerHTML = gridHtml();
      else body.innerHTML = flipHtml();
      if (view.view !== "grid") showPage();
      watchLazy(body);
    }

    /* Draw a thumbnail or a grid panel only when it comes near the screen. */
    let observer = null;
    function fillOne(node) {
      const [kind, si, pi] = node.dataset.lazy.split(":");
      delete node.dataset.lazy;
      node.classList.remove("sb-lazy");
      const s = store.scenes[Number(si)];
      const p = s && s.panels[Number(pi)];
      if (!p) return;
      const prev = Number(pi) > 0 ? s.panels[Number(pi) - 1] : null;
      if (kind === "t") {
        const svg = stageOnly(panelHtml(s, p, Number(pi)));
        const old = node.querySelector("svg");
        if (old && svg) old.outerHTML = svg;
        node.insertAdjacentHTML("beforeend", `<span class="sb-cap-mini">${esc(captionText(p, prev, 1))}</span>`);
        node.title = captionText(p, prev, 4);
      } else {
        const html = panelHtml(s, p, Number(pi)).replace(/<\/figure>\s*$/, captionHtml(p, prev, 3, false) + "</figure>");
        const tmp = document.createElement("div");
        tmp.innerHTML = html;
        const fig = tmp.firstElementChild;
        if (!fig) return;
        node.className = fig.className;
        node.innerHTML = fig.innerHTML;
      }
    }
    function watchLazy(root) {
      if (observer) observer.disconnect();
      const nodes = root.querySelectorAll("[data-lazy]");
      if (!nodes.length) return;
      if (typeof IntersectionObserver !== "function") return nodes.forEach(fillOne);
      observer = new IntersectionObserver(
        (entries) =>
          entries.forEach((en) => {
            if (!en.isIntersecting || !en.target.dataset.lazy) return;
            observer.unobserve(en.target);
            fillOne(en.target);
          }),
        { rootMargin: "300px" }
      );
      nodes.forEach((n) => observer.observe(n));
    }

    /* The reel's items: every page with its panel and the one before it in the same scene. */
    function reelItems(all) {
      return all.map((pg, k) => {
        const s = store.scenes[pg.si];
        return { p: s.panels[pg.pi], prev: pg.pi > 0 ? s.panels[pg.pi - 1] : null, scene: s, si: pg.si, pi: pg.pi, k };
      });
    }
    function flipHtml() {
      const all = pages();
      /* Thumbnails are empty boxes until they scroll into view (see fillLazy), so hundreds of panels stay quick. */
      const thumbs = all
        .map((pg, k) => `<button type="button" class="sb-thumb sb-lazy ${pg.pi === 0 ? "first" : ""}" data-go="${k}" data-lazy="t:${pg.si}:${pg.pi}" aria-label="Scene ${pg.si + 1}, panel ${pg.pi + 1}"><svg viewBox="0 0 200 90"></svg><span>${pg.si + 1}·${pg.pi + 1}</span></button>`)
        .join("");
      const at0 = all.length ? ((at % all.length) + all.length) % all.length : 0;
      return `<div class="sb-viewer" tabindex="0" data-sb="viewer" aria-label="Flip book. Left and right arrows move, space plays.">
          <p class="sb-count" data-sb="count"></p>
          <div class="sb-stagewrap"><div class="sb-big" data-sb="big"></div></div>
          <div data-sb="caption"></div>
          <p class="sb-story" data-sb="story"></p>
          <div class="sb-transport">
            <button type="button" data-sb="prev" aria-label="Previous panel">◀</button>
            <button type="button" data-sb="play">${playing ? "Pause" : "Play"}</button>
            <button type="button" data-sb="next" aria-label="Next panel">▶</button>
            <label>Speed <input type="range" data-sb="speed" min="0.5" max="24" step="0.5" value="${esc(view.speed)}" /> <span data-sb="speedread">${esc(view.speed)}</span> panels a second</label>
          </div>
          <div class="sb-reel" data-sb="thumbs"><div class="sb-thumbrow">${thumbs}</div>${view.bands ? bandsHtml(reelItems(all), THUMB_PITCH, at0) : ""}</div>
          <p class="sb-small">Arrow keys move one panel; space plays and pauses. Tap a small picture, or a spot on a band, to jump.</p>
        </div>`;
    }

    function showPage() {
      const all = pages();
      if (!all.length) return;
      at = ((at % all.length) + all.length) % all.length;
      const pg = all[at];
      const s = store.scenes[pg.si];
      shown = { si: pg.si, pi: pg.pi };
      queueMicrotask(() => tell({ type: "page", at, si: pg.si, pi: pg.pi }));
      const big = el.querySelector("[data-sb=big]");
      const count = el.querySelector("[data-sb=count]");
      if (big) big.innerHTML = panelHtml(s, s.panels[pg.pi], pg.pi);
      const cap = el.querySelector("[data-sb=caption]");
      if (cap) cap.innerHTML = captionHtml(s.panels[pg.pi], pg.pi > 0 ? s.panels[pg.pi - 1] : null, 8, true);
      const tie = el.querySelector("[data-sb=story]");
      if (tie) tie.innerHTML = storyLine(s, pg.si, s.panels[pg.pi]);
      if (count)
        count.innerHTML = `Scene <b>${pg.si + 1}</b> of ${store.scenes.length} · ${esc(s.name)}${s.note ? ` <span class="sb-small">(${esc(s.note)})</span>` : ""} · panel <b>${pg.pi + 1}</b> of ${s.panels.length} · ${at + 1} / ${all.length}`;
      const strip = el.querySelector("[data-sb=thumbs]");
      if (strip) {
        const prev = strip.querySelector(".sb-thumb.on");
        if (prev) prev.classList.remove("on");
        const cur = strip.querySelector(`[data-go="${at}"]`);
        if (cur) {
          cur.classList.add("on");
          const l = at * THUMB_PITCH;
          if (l < strip.scrollLeft || l + cur.offsetWidth > strip.scrollLeft + strip.clientWidth) strip.scrollLeft = l - strip.clientWidth / 2 + cur.offsetWidth / 2;
        }
        strip.querySelectorAll("[data-sb-hl]").forEach((r) => r.setAttribute("x", at * THUMB_PITCH));
      }
    }

    function gridHtml() {
      return `<div class="sb-grid">${store.scenes
        .map(
          (s, si) => `<section class="sb-scene" data-scene="${si}">
          <div class="sb-scene-head">
            <span class="sb-small">${si + 1}.</span>
            <input type="text" value="${esc(s.name)}" data-rename="${si}" aria-label="Scene ${si + 1} name" />
            <div class="sb-acts">
              <button type="button" data-act="up" data-i="${si}" ${si === 0 ? "disabled" : ""} aria-label="Move scene ${si + 1} earlier">↑ Earlier</button>
              <button type="button" data-act="down" data-i="${si}" ${si === store.scenes.length - 1 ? "disabled" : ""} aria-label="Move scene ${si + 1} later">↓ Later</button>
              <button type="button" data-act="dup" data-i="${si}">Duplicate</button>
              <button type="button" data-act="del" data-i="${si}">Delete</button>
            </div>
          </div>
          ${tieHtml(s, si)}
          <p class="sb-small">${s.panels.length} panel${s.panels.length === 1 ? "" : "s"}${s.note ? " · " + esc(s.note) : ""}${s.board && s.board.title ? " · from " + esc(s.board.title) : ""}</p>
          <div class="sb-reel"><div class="strip sb-strip">${s.panels
            .map((p, pi) => `<figure class="panel sb-lazy" data-lazy="g:${si}:${pi}" data-open="${si}:${pi}" role="button" tabindex="0" aria-label="Open scene ${si + 1}, panel ${pi + 1} in the flip book"></figure>`)
            .join("")}</div>${view.bands ? bandsHtml(s.panels.map((p, pi) => ({ p, prev: pi > 0 ? s.panels[pi - 1] : null, scene: s, si, pi })), GRID_PITCH, null) : ""}</div>
        </section>`
        )
        .join("")}</div>`;
    }

    function tieHtml(s, si) {
      const n = storyCount();
      if (!n) return "";
      const k = storyOf(s, si);
      const opts = Array.from({ length: n }, (_, i) => `<option value="${i}" ${i === k ? "selected" : ""}>Story scene ${i + 1}</option>`).join("");
      return `<label class="sb-tie">Tied to <select data-tie="${si}" aria-label="Story scene for storyboard scene ${si + 1}"><option value="-1" ${k < 0 ? "selected" : ""}>no story scene</option>${opts}</select></label>`;
    }
    /* Jump to the first storyboard scene tied to story scene k. */
    function jumpStory(k) {
      const si = store.scenes.findIndex((s, i) => storyOf(s, i) === k);
      if (si < 0) {
        draw();
        setStatus(`No storyboard scene is tied to story scene ${k + 1} yet. Save My film into a scene, then tie it under All scenes.`);
        return false;
      }
      at = pages().findIndex((pg) => pg.si === si);
      if (view.view !== "flip") {
        view.view = "flip";
        savePrefs(view);
      }
      setPlaying(false);
      draw();
      setStatus(`Showing storyboard scene ${si + 1}, tied to story scene ${k + 1}.`);
      const v = el.querySelector("[data-sb=viewer]");
      if (v && v.scrollIntoView) v.scrollIntoView({ block: "start" });
      return true;
    }

    /* ---------- actions ---------- */
    function saveInto(where) {
      const panels = capture(panelCount(view.per), performance.now());
      if (where === "new" || store.scenes[Number(where)] == null) {
        store.scenes.push(sceneRecord(panels, defaultName(store.scenes.length)));
        persist(`Saved as scene ${store.scenes.length}.`);
        at = pages().length - panels.length;
      } else {
        const i = Number(where);
        const old = store.scenes[i];
        store.scenes[i] = Object.assign(sceneRecord(panels, old.name), { id: old.id });
        persist(`Scene ${i + 1} replaced with My film.`);
        at = pages().findIndex((pg) => pg.si === i);
      }
      draw();
    }

    function makeMany() {
      const n = Math.max(1, Math.min(200, Number(view.many) || 16));
      const len = Math.max(0.5, Math.min(600, Number(view.len) || 8));
      const count = panelCount(view.per);
      const start = performance.now();
      const firstPage = pages().length;
      const firstScene = store.scenes.length;
      if (view.as === "panels") {
        const panels = [];
        for (let k = 0; k < n; k++) panels.push(...capture(count, start + (len * 1000 * k) / n));
        store.scenes.push(sceneRecord(panels, defaultName(firstScene), `${n} moments across ${len} s`));
      } else {
        for (let k = 0; k < n; k++) {
          const secs = Math.round(((len * k) / n) * 100) / 100;
          store.scenes.push(sceneRecord(capture(count, start + secs * 1000), defaultName(firstScene + k), `moment ${k + 1} of ${n}, at ${secs} s`));
        }
      }
      at = firstPage;
      persist(view.as === "panels" ? `Made one scene with ${n * count} panels.` : `Made ${n} scenes.`);
      draw();
    }

    function move(d) {
      at += d;
      showPage();
    }
    function setPlaying(on) {
      playing = on && pages().length > 1;
      const b = el.querySelector("[data-sb=play]");
      if (b) b.textContent = playing ? "Pause" : "Play";
      cancelAnimationFrame(raf);
      if (playing) {
        last = performance.now();
        raf = requestAnimationFrame(loop);
      }
    }
    function loop(now) {
      if (!el.isConnected || !playing) return (playing = false);
      /* A panel with its own timing (panels[i].seconds, e.g. from Momentum's Panel timing) holds that long;
         the rest follow the Speed slider. */
      const pg = pages()[at];
      const own = pg && store.scenes[pg.si] && store.scenes[pg.si].panels[pg.pi] && Number(store.scenes[pg.si].panels[pg.pi].seconds);
      const gap = own > 0 ? Math.min(60, Math.max(0.04, own)) * 1000 : 1000 / Math.max(0.5, Number(view.speed) || 4);
      if (now - last >= gap) {
        last = now - ((now - last) % gap);
        if (el.offsetParent !== null) move(1);
      }
      raf = requestAnimationFrame(loop);
    }

    el.addEventListener("click", (e) => {
      const b = e.target.closest("[data-sb],[data-go],[data-act],[data-open]");
      if (!b || !el.contains(b)) return;
      if (b.dataset.go != null) {
        at = Number(b.dataset.go);
        return showPage();
      }
      if (b.dataset.open) {
        const [si, pi] = b.dataset.open.split(":").map(Number);
        at = pages().findIndex((pg) => pg.si === si && pg.pi === pi);
        view.view = "flip";
        savePrefs(view);
        return draw();
      }
      if (b.dataset.act) {
        const i = Number(b.dataset.i);
        const s = store.scenes[i];
        if (!s) return;
        if (b.dataset.act === "up" && i > 0) store.scenes.splice(i - 1, 0, store.scenes.splice(i, 1)[0]);
        if (b.dataset.act === "down" && i < store.scenes.length - 1) store.scenes.splice(i + 1, 0, store.scenes.splice(i, 1)[0]);
        if (b.dataset.act === "dup") store.scenes.splice(i + 1, 0, Object.assign(JSON.parse(JSON.stringify(s)), { id: newId(), name: s.name + " (copy)" }));
        if (b.dataset.act === "del") {
          if (!confirm(`Delete scene ${i + 1}, "${s.name}"?`)) return;
          store.scenes.splice(i, 1);
        }
        persist({ up: "Moved earlier.", down: "Moved later.", dup: "Duplicated.", del: "Deleted." }[b.dataset.act]);
        return draw();
      }
      const k = b.dataset.sb;
      if (k === "save") saveInto(el.querySelector("[data-sb=into]").value);
      else if (k === "make") makeMany();
      else if (k === "prev") move(-1);
      else if (k === "next") move(1);
      else if (k === "play") setPlaying(!playing);
      else if (k === "view-flip" || k === "view-grid") {
        view.view = k === "view-grid" ? "grid" : "flip";
        if (view.view === "grid") setPlaying(false);
        savePrefs(view);
        draw();
      } else if (k === "json") {
        download("storyboard.json", new Blob([JSON.stringify({ kind: "curiosities-storyboard", version: 1, scenes: store.scenes }, null, 2)], { type: "application/json" }));
        setStatus("Downloaded storyboard.json.");
      } else if (k === "print") {
        if (!store.scenes.length) return setStatus("Nothing to print yet.");
        try {
          const PK = "curiosities-studio-print-v1";
          const ps = readJson(PK) || {};
          ps.source = "storyboard";
          ps.page = 0;
          if (!ps.layout || ps.layout === "strip") ps.layout = "board";
          localStorage.setItem(PK, JSON.stringify(ps));
        } catch (e) {}
        const lib = document.querySelector('#lib-menu button[data-tool="print"]');
        if (lib) lib.click();
        else setStatus("The Print tool is not loaded.");
      } else if (k === "png") {
        if (!store.scenes.length) return setStatus("Nothing to draw yet.");
        setStatus("Drawing the contact sheet…");
        contactSheet().then((c) => {
          if (!c) return setStatus("Nothing to draw yet.");
          c.toBlob((blob) => {
            if (!blob) return setStatus("The browser could not make the picture.");
            download("storyboard-contact-sheet.png", blob);
            setStatus("Downloaded the contact sheet.");
          }, "image/png");
        });
      }
    });
    el.addEventListener("keydown", (e) => {
      const fig = e.target.closest && e.target.closest("[data-open]");
      if (fig && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        fig.click();
      }
    });
    el.addEventListener("input", (e) => {
      const t = e.target;
      if (t.dataset.sb === "speed") {
        view.speed = Number(t.value);
        const r = el.querySelector("[data-sb=speedread]");
        if (r) r.textContent = t.value;
        savePrefs(view);
      } else if (t.dataset.sb === "len") {
        view.len = t.value;
        savePrefs(view);
      }
    });
    el.addEventListener("change", (e) => {
      const t = e.target;
      if (t.dataset.sb === "many" || t.dataset.sb === "as") {
        view[t.dataset.sb] = t.value;
        savePrefs(view);
      } else if (t.dataset.sb === "per") {
        view.per = Number(t.value) || 0;
        savePrefs(view);
        const note = el.querySelector("[data-sb=pernote]");
        if (note) note.textContent = perNote();
      } else if (t.dataset.sb === "caps" || t.dataset.sb === "bands") {
        view[t.dataset.sb] = t.checked;
        savePrefs(view);
        const root = el.querySelector(".sb");
        if (root) root.classList.toggle(t.dataset.sb === "caps" ? "no-caps" : "no-bands", !t.checked);
        if (t.dataset.sb === "bands" && t.checked && !el.querySelector(".sb-bands")) drawBody();
      } else if (t.dataset.tie != null) {
        const i = Number(t.dataset.tie);
        const s = store.scenes[i];
        if (s) {
          const k = Number(t.value);
          if (k === i) delete s.story;
          else s.story = k;
          persist(k < 0 ? `Scene ${i + 1} is not tied to the story.` : `Scene ${i + 1} is tied to story scene ${k + 1}.`);
        }
      } else if (t.dataset.rename != null) {
        const s = store.scenes[Number(t.dataset.rename)];
        if (s) {
          s.name = t.value.trim() || s.name;
          persist("Renamed.");
        }
      } else if (t.dataset.sb === "import" && t.files && t.files[0]) {
        const r = new FileReader();
        r.onload = () => {
          let data = null;
          try {
            data = JSON.parse(r.result);
          } catch (err) {}
          const scenes = data && Array.isArray(data.scenes) ? data.scenes.filter((s) => s && Array.isArray(s.panels)) : null;
          if (!scenes || !scenes.length) return setStatus("That file is not a storyboard.");
          scenes.forEach((s) => store.scenes.push(Object.assign({}, s, { id: newId(), name: String(s.name || defaultName(store.scenes.length)) })));
          persist(`Added ${scenes.length} scene${scenes.length === 1 ? "" : "s"} from the file.`);
          draw();
        };
        r.readAsText(t.files[0]);
      }
    });
    /* Arrow keys flip; space plays. Only while this page is on screen and you are not typing. */
    function onKey(e) {
      if (!el.isConnected) return document.removeEventListener("keydown", onKey);
      if (el.offsetParent === null || view.view !== "flip" || !store.scenes.length) return;
      const tag = (e.target.tagName || "").toLowerCase();
      if (["input", "select", "textarea"].includes(tag) || e.target.isContentEditable) return;
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.key === "ArrowRight") move(1);
      else if (e.key === "ArrowLeft") move(-1);
      else if (e.key === " " && e.target.closest && e.target.closest("[data-sb=viewer]") && !e.target.closest("button")) setPlaying(!playing);
      else return;
      e.preventDefault();
    }
    document.addEventListener("keydown", onKey);
    /* Keep the "is automation running" line honest. */
    if (window.CurioAuto && window.CurioAuto.on)
      window.CurioAuto.on((type) => {
        if (type !== "change" || !el.isConnected) return;
        const live = el.querySelector("[data-sb=make]");
        if (live && live.parentNode && live.parentNode.nextElementSibling) {
          const n = window.CurioAuto.running().length;
          live.parentNode.nextElementSibling.textContent = n
            ? `${n} automation${n === 1 ? " is" : "s are"} running now.`
            : "No automation is running, so every snapshot will look the same. Turn one on in a workspace first (an LFO moves on its own).";
        }
      });

    draw();
    const api = {
      redraw: draw,
      /* After pictures arrive: show the first new one in the flip book. */
      showAt(si, pi) {
        const k = pages().findIndex((pg) => pg.si === si && pg.pi === pi);
        if (k >= 0) at = k;
        draw();
      },
      jumpStory,
      isLive: () => el.isConnected,
      destroy() {
        setPlaying(false);
        document.removeEventListener("keydown", onKey);
        el.innerHTML = "";
        if (active === api) active = null;
      },
    };
    active = api;
    if (pendingStory != null) {
      const k = pendingStory;
      pendingStory = null;
      jumpStory(k);
    }
    return api;
  }

  /* ---------- pictures in panels (rig/snapshot.js sends frames of the 3D view here) ---------- */
  let shown = null; /* the panel the flip book last showed: the "selected" one */
  const PIC_RE = /^data:image\/(jpeg|webp|png);base64,[A-Za-z0-9+/=]+$/;
  const PIC_MAX = 400000; /* characters; about 300 KB, so a few dozen pictures fit in the browser's storage */
  function picOk(p) {
    return !!(p && typeof p.pic === "string" && p.pic.length <= PIC_MAX && PIC_RE.test(p.pic));
  }
  function picPanelHtml(scene, p, i) {
    const B = window.CuriosityBoard;
    const img = `<img class="stage sb-pic" src="${p.pic}" alt="A drawing from the 3D view">`;
    let html = "";
    try {
      html = B && B.panel ? B.panel(p.line || { who: "", text: "—" }, i, scene.panels.length, p.v || {}) : "";
    } catch (e) {}
    /* the drawn shot name (wide, close...) belongs to the drawn stage; this picture is what the 3D view showed */
    html = html.replace(/(<header>\s*<span>[\s\S]*?<\/span>\s*<span>)[\s\S]*?(<\/span>\s*<\/header>)/, "$13D view$2");
    if (/<svg class="stage[\s\S]*?<\/svg>/.test(html)) return html.replace(/<svg class="stage[\s\S]*?<\/svg>/, () => img);
    return `<figure class="panel">${img}</figure>`;
  }
  function picImage(src) {
    return new Promise((res) => {
      const img = new Image();
      img.onload = () => res(img);
      img.onerror = () => res(null);
      img.src = src;
    });
  }
  /* The selected panel: the one on the flip book now (or last), else the last panel of the last scene. */
  function selected() {
    if (shown && store.scenes[shown.si] && store.scenes[shown.si].panels[shown.pi]) return Object.assign({}, shown);
    const si = store.scenes.length - 1;
    return si >= 0 && store.scenes[si].panels.length ? { si, pi: store.scenes[si].panels.length - 1 } : null;
  }
  /* list: [{ pic, seconds? }]. opts: { si, pi } where to put them (default: the selected panel), onto: true puts a
     single picture on that panel instead of a new one after it, scene: true puts them in a new scene right after
     the selected one, name: that scene's name.
     New panels copy the values of the panel they follow (so header and caption match), or My film's. A scene
     that would pass MAX_PER panels gets a new scene right after it instead. One save, so one undo step.
     Returns { si, pi, count } of the first new (or changed) panel, or null. */
  function addPictures(list, opts) {
    opts = opts || {};
    const pics = (Array.isArray(list) ? list : []).filter(picOk).slice(0, MAX_PER);
    if (!pics.length) return null;
    const pick = opts.si != null && store.scenes[Number(opts.si)] ? { si: Number(opts.si), pi: Math.max(0, Math.min(store.scenes[Number(opts.si)].panels.length - 1, Number(opts.pi) || 0)) } : selected();
    const timed = (x, base) => {
      const p = Object.assign({}, base, { pic: x.pic });
      const sec = Number(x.seconds);
      if (sec > 0 && isFinite(sec)) p.seconds = Math.round(Math.min(60, Math.max(0.04, sec)) * 1000) / 1000; /* 1/8 s stays 0.125 */
      else delete p.seconds;
      return p;
    };
    const baseOf = (p) => ({ v: Object.assign({}, (p && p.v) || capture(1, performance.now())[0].v), line: { who: "", text: "—" } });
    let out = null;
    if (pick && opts.onto && pics.length === 1) {
      const s = store.scenes[pick.si];
      s.panels[pick.pi] = timed(pics[0], s.panels[pick.pi]);
      out = { si: pick.si, pi: pick.pi, count: 1 };
    } else if (pick && !opts.scene && store.scenes[pick.si].panels.length + pics.length <= MAX_PER) {
      const s = store.scenes[pick.si];
      const base = baseOf(s.panels[pick.pi]);
      s.panels.splice(pick.pi + 1, 0, ...pics.map((x) => timed(x, base)));
      out = { si: pick.si, pi: pick.pi + 1, count: pics.length };
    } else {
      const at = pick ? pick.si + 1 : store.scenes.length;
      const base = baseOf(pick ? store.scenes[pick.si].panels[pick.pi] : null);
      store.scenes.splice(at, 0, sceneRecord(pics.map((x) => timed(x, base)), String(opts.name || "From the 3D view"), "drawn from the 3D view"));
      out = { si: at, pi: 0, count: pics.length };
    }
    shown = { si: out.si, pi: out.pi };
    save(opts.label || (pics.length === 1 ? "a picture from the 3D view" : pics.length + " pictures from the 3D view"));
    if (active && active.isLive()) active.showAt(out.si, out.pi);
    return saveError ? Object.assign(out, { error: saveError }) : out;
  }

  window.CuriosityStoryboard = {
    KEY,
    mount,
    /* Show the storyboard scenes tied to story scene k (0-based). Waits for the next mount if none is on screen. */
    focusStory(k) {
      k = Number(k) || 0;
      if (active && active.isLive()) return active.jumpStory(k);
      pendingStory = k;
      return false;
    },
    /* The story scene a storyboard scene is tied to (-1 for none). */
    storyOf: (si) => storyOf(store.scenes[si], si),
    /* A copy of everything kept, for other pages (and a future film or AI video export). */
    data: () => JSON.parse(JSON.stringify(store)),
    /* A panel's plain-word caption (the curiosities that are on), for Print and other pages. */
    caption: (p, prev, max) => captionText(p, prev, max),
    /* Scenes another part keeps here, marked with its tag (the engine prints its film as scenes with
       engine: true): replaces every scene that carries the tag, keeps yours, saves, and redraws. */
    putScenes(tag, scenes) {
      if (!/^[a-z]{1,20}$/.test(String(tag)) || !Array.isArray(scenes)) return false;
      const made = scenes
        .filter((s) => s && Array.isArray(s.panels))
        .slice(0, 40)
        .map((s) => Object.assign({}, s, { id: newId(), name: String(s.name || "Scene"), [tag]: true, panels: s.panels.slice(0, MAX_PER) }));
      store.scenes = store.scenes.filter((s) => s[tag] !== true).concat(made);
      save("scenes from the " + tag);
      if (active && active.isLive()) active.redraw();
      return !saveError;
    },
    MAX_PER,
    on(fn) {
      if (typeof fn === "function") listeners.push(fn);
      return () => listeners.splice(listeners.indexOf(fn) >>> 0, 1);
    },
    /* How long panels stay up in the flip book: setTiming([{ si, pi, seconds }]) in one save and one undo step.
       seconds null (or 0) gives the panel back to the Speed slider. Returns how many panels changed. */
    setTiming(list, label) {
      if (!Array.isArray(list)) return 0;
      let n = 0;
      list.forEach((t) => {
        const p = t && store.scenes[Number(t.si)] && store.scenes[Number(t.si)].panels[Number(t.pi)];
        if (!p) return;
        const sec = Number(t.seconds);
        if (sec > 0 && isFinite(sec)) p.seconds = Math.round(Math.min(60, Math.max(0.04, sec)) * 100) / 100;
        else delete p.seconds;
        n++;
      });
      if (n) {
        save(label || "panel timing");
        if (active && active.isLive()) active.redraw();
      }
      return n;
    },
    timing: () => store.scenes.map((s) => s.panels.map((p) => (Number(p.seconds) > 0 ? Number(p.seconds) : null))),
    selected,
    addPictures,
  };
  /* An undo, redo or reload of the shared state redraws the open storyboard. */
  if (part) part.on((d, label) => /^(Undo|Redo|Load)/.test(String(label)) && active && active.isLive() && active.redraw());
})();
