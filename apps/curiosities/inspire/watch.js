/* Watch and tag (Scene inspiration): play a clip with YouTube's own player and tag curiosities as they happen.
   Paste a YouTube link (or search words, which open a YouTube search to find one), pick a curiosity and a value,
   press "Tag now" and the player's current time is kept with it. Keep the clip and it joins the scene database as a
   logged scene, beat by beat, so the hub can search it and Borrow its curiosities and how fast they change.
   Only our own tags, the video id and search words are kept; never the video, its title or thumbnail
   (YouTube's terms: no copies of the video, and its own data must be refreshed every 30 days, so we keep none).
   The player is talked to with YouTube's postMessage protocol, so no outside script is loaded. If the player can't
   load (offline, or a page that blocks it), type the time instead.
   A clip keeps a start and end (the player plays just that stretch) and backup links: the same scene from other
   uploads. If the player reports a video gone or not embeddable, the next backup plays. check() runs in the
   background (from the hub) and moves a live link to the front for any clip not checked in 30 days.
   window.CurioWatchTag = { open, parseId, toClip, fmt, parseTime, linkStart, probe, check }. */
(function (root) {
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

  /* A YouTube video id from a link (watch, youtu.be, shorts, embed, live) or a bare 11-character id. */
  function parseId(text) {
    const t = String(text || "").trim();
    if (/^[A-Za-z0-9_-]{11}$/.test(t)) return t;
    const m = t.match(/(?:youtube(?:-nocookie)?\.com\/(?:watch\?(?:[^#\s]*&)?v=|embed\/|shorts\/|live\/|v\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
    return m ? m[1] : null;
  }
  /* A start time from a link (?t=90, &t=1m30s, &start=90), in seconds. */
  function linkStart(text) {
    const m = String(text || "").match(/[?&#](?:t|start)=(\d+h)?(\d+m)?(\d+)s?\b/);
    if (!m) return 0;
    return (parseInt(m[1]) || 0) * 3600 + (parseInt(m[2]) || 0) * 60 + (parseInt(m[3]) || 0);
  }
  function fmt(sec) {
    const s = Math.max(0, Math.round(Number(sec) || 0));
    return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
  }
  /* "1:05", "65", "1m5s" -> 65. */
  function parseTime(text) {
    const t = String(text == null ? "" : text).trim();
    if (!t) return null;
    if (/^\d+(\.\d+)?$/.test(t)) return Number(t);
    let m = t.match(/^(\d+):(\d{1,2})(?::(\d{1,2}))?$/);
    if (m) return m[3] !== undefined ? +m[1] * 3600 + +m[2] * 60 + +m[3] : +m[1] * 60 + +m[2];
    m = t.match(/^(?:(\d+)m)?\s*(?:(\d+)s)?$/);
    if (m && (m[1] || m[2])) return (+m[1] || 0) * 60 + (+m[2] || 0);
    return null;
  }
  /* The stored video: the id playing first, every id (backups after it), and the stretch to play. */
  function videoOf(id, ids, start, end) {
    const all = [id].concat(ids || []).filter((x, i, a) => x && a.indexOf(x) === i);
    const v = { site: "youtube", id: all[0], ids: all };
    if (start != null && start !== "") v.start = Math.max(0, Math.round(Number(start)));
    if (end != null && end !== "" && Number(end) > (v.start || 0)) v.end = Math.round(Number(end));
    return v;
  }
  /* Tags [{at, key, value}] -> the clip the hub keeps: one beat per moment, in time order. */
  function toClip(info, tags) {
    const byAt = new Map();
    tags
      .slice()
      .sort((a, b) => a.at - b.at)
      .forEach((t) => {
        const at = Math.round(t.at * 10) / 10;
        if (!byAt.has(at)) byAt.set(at, {});
        byAt.get(at)[t.key] = isNaN(Number(t.value)) || t.value === "" ? t.value : Number(t.value);
      });
    return {
      work: info.work,
      year: info.year,
      kind: info.kind,
      moment: info.moment,
      feelings: String(info.feelings || "")
        .split(/,\s*/)
        .map((x) => x.trim().toLowerCase())
        .filter(Boolean),
      search: info.search || [info.work, info.moment].filter(Boolean).join(" "),
      video: info.video ? videoOf(info.video, info.ids, info.clipStart, info.clipEnd) : null,
      beats: Array.from(byAt, ([at, values]) => ({ at, values })),
    };
  }

  /* Is a YouTube video still there? Free and key-free: a missing video's thumbnail is YouTube's 120 x 90 grey
     placeholder or an error. true = there, false = gone, null = can't tell (offline). Only the answer is kept. */
  function probe(id) {
    return new Promise((resolve) => {
      if (typeof Image === "undefined") return resolve(null);
      const img = new Image();
      const done = (v) => {
        clearTimeout(t);
        img.onload = img.onerror = null;
        resolve(v);
      };
      const t = setTimeout(() => done(null), 8000);
      img.onload = () => done(!(img.naturalWidth === 120 && img.naturalHeight === 90));
      img.onerror = () => done(typeof navigator !== "undefined" && navigator.onLine === false ? null : false);
      img.src = "https://i.ytimg.com/vi/" + encodeURIComponent(id) + "/mqdefault.jpg";
    });
  }
  const MONTH = 30 * 24 * 3600 * 1000;
  const CANARY = "jNQXAC9IVRw";
  /* Check the links of clips not checked in 30 days (YouTube's rule for stored ids). A live link moves to the front;
     gone ones are listed in video.gone; a clip with none left gets video.lost and plays from its search words.
     If any answer is "can't tell" (offline), the clip waits for next time. Changes the clips in place; resolves to
     how many changed. opts: { probe, now, every } */
  async function check(clips, opts) {
    const o = opts || {};
    const test = o.probe || probe;
    const now = o.now || Date.now();
    let changed = 0;
    const due = (clips || []).filter((c) => c && c.video && c.video.site === "youtube" && c.video.id && !(c.video.checked && now - c.video.checked < (o.every || MONTH)));
    if (!due.length) return 0;
    /* First a video that is always there ("Me at the zoo", YouTube's first). If even it fails, the page can't reach
       YouTube's pictures (offline, or a page that blocks them), so nothing is marked gone. */
    if ((await test(CANARY)) !== true) return 0;
    for (const c of due) {
      const v = c && c.video;
      if (!v || v.site !== "youtube" || !v.id) continue;
      if (v.checked && now - v.checked < (o.every || MONTH)) continue;
      const ids = (v.ids || [v.id]).filter(Boolean);
      const answers = [];
      for (const id of ids) answers.push(await test(id));
      if (answers.some((r) => r !== true && r !== false)) continue;
      const live = ids.filter((x, i) => answers[i]);
      const gone = ids.filter((x, i) => !answers[i]);
      v.ids = live.concat(gone);
      v.id = live[0] || ids[0];
      if (gone.length) v.gone = gone;
      else delete v.gone;
      if (live.length) delete v.lost;
      else v.lost = true;
      v.checked = now;
      changed++;
    }
    return changed;
  }

  /* Curiosities most scenes lean on, offered first. */
  const FRONT = ["emotion", "shotSize", "cameraMove", "music", "lightingMood", "cutRate", "tensionCurve", "pace"];

  /* How the panel sits: "full" (the whole screen), "side" (right half, your film on the left) or "stack" (top half,
     your film below). Side by side is the default: wide screens fit two 16:9 pictures across at the same size as
     stacked, and leave the bottom free for lanes, like an editor's two monitors. Kept per device. */
  const LAYOUT_KEY = "curio-watch-layout-v1";
  const LAYOUTS = [
    ["full", "Full screen"],
    ["side", "Side by side"],
    ["stack", "Stacked"],
  ];
  let layout = "side";
  try {
    const l = localStorage.getItem(LAYOUT_KEY);
    if (LAYOUTS.some(([id]) => id === l)) layout = l;
  } catch (e) {}

  let dlg = null;
  let state = null;
  let player = { time: 0, duration: 0, ready: false, frame: null };

  function hub() {
    return window.CurioInspire && window.CurioInspire.hub ? window.CurioInspire.hub() : null;
  }
  function curiosityOptions(picked) {
    const DB = window.CuriosityDB;
    const j = DB && DB.toJSON ? DB.toJSON() : { curiosities: [] };
    const h = hub();
    const usable = j.curiosities.filter((c) => {
      const s = (c.sliders || []).find((x) => x.id === c.main);
      return s && (s.scale || s.range);
    });
    const opt = (c) => `<option value="${esc(c.id)}" ${c.id === picked ? "selected" : ""}>${esc(c.label)}</option>`;
    const front = FRONT.map((id) => usable.find((c) => c.id === id)).filter(Boolean);
    const groups = {};
    usable.forEach((c) => {
      const t = h ? h.topicOf(c.id) : "other";
      (groups[t] = groups[t] || []).push(c);
    });
    const topics = h ? h.TOPICS.filter((t) => groups[t.id]) : Object.keys(groups).map((id) => ({ id, label: id }));
    return `<optgroup label="Front and center">${front.map(opt).join("")}</optgroup>` + topics.map((t) => `<optgroup label="${esc(t.label)}">${groups[t.id].map(opt).join("")}</optgroup>`).join("");
  }
  function valueOptions(key, picked) {
    const h = hub();
    const s = h && h.sliderOf(key);
    if (!s) return `<option value="">(no values)</option>`;
    const step = (s.range && s.range.step) || 1;
    const vals = s.scale ? s.scale : Array.from({ length: Math.floor((s.range.max - s.range.min) / step) + 1 }, (_, i) => s.range.min + i * step);
    return vals.map((v) => `<option ${String(v) === String(picked) ? "selected" : ""}>${esc(v)}</option>`).join("");
  }
  function label(key) {
    const h = hub();
    return h ? h.label(key) : key;
  }

  /* ---------- the YouTube player, by postMessage ---------- */
  function send(func, args) {
    if (player.frame && player.frame.contentWindow) player.frame.contentWindow.postMessage(JSON.stringify({ event: "command", func, args: args || [] }), "*");
  }
  function listen() {
    if (player.frame && player.frame.contentWindow) player.frame.contentWindow.postMessage(JSON.stringify({ event: "listening", id: 1, channel: "widget" }), "*");
  }
  function onMessage(e) {
    if (!player.frame || e.source !== player.frame.contentWindow) return;
    let d = e.data;
    try {
      d = typeof d === "string" ? JSON.parse(d) : d;
    } catch (err) {
      return;
    }
    if (!d || typeof d !== "object") return;
    if (d.event === "onReady") player.ready = true;
    /* 2 bad id, 5 can't play, 100 gone, 101/150 the owner blocks embedding: try the next backup. */
    if (d.event === "onError") return failover(d.info);
    const info = d.info || {};
    if (typeof info.currentTime === "number") {
      player.ready = true;
      player.time = info.currentTime;
      const clock = dlg && dlg.querySelector(".wt-clock");
      if (clock) clock.textContent = fmt(player.time);
      const at = dlg && dlg.querySelector('[data-w="at"]');
      if (at && document.activeElement !== at) at.value = fmt(player.time);
    }
    if (typeof info.duration === "number" && info.duration > 0) player.duration = info.duration;
  }

  function failover(code) {
    const bad = state.video;
    state.gone = (state.gone || []).concat(bad ? [bad] : []);
    const next = state.ids.find((x) => x !== bad && state.gone.indexOf(x) < 0);
    if (!next) return msg("This video won't play here" + (code ? " (YouTube says " + code + ")" : "") + ". Add a backup link, or press \"Find it on YouTube\".");
    state.video = next;
    state.start = state.clipStart || 0;
    draw();
    msg("That link stopped working, so a backup is playing.");
  }

  /* ---------- drawing ---------- */
  function draw() {
    const body = dlg.querySelector(".wt-body");
    const id = state.video;
    const tags = state.tags.slice().sort((a, b) => a.at - b.at);
    body.innerHTML = `<div class="wt-grid">
      <div class="wt-left">
        <div class="ci-top">
          <input class="ci-search" data-w="link" placeholder="Paste a YouTube link here, or type search words" value="${esc(state.link)}">
          <button type="button" data-w="load">${id ? "Load another" : "Load"}</button>
          <button type="button" class="ci-link" data-w="find">Find it on YouTube</button>
        </div>
        <div class="wt-player">${
          id
            ? `<iframe title="YouTube player" src="https://www.youtube-nocookie.com/embed/${esc(id)}?enablejsapi=1&playsinline=1&rel=0${state.start ? "&start=" + Math.floor(state.start) : ""}${state.clipEnd ? "&end=" + Math.ceil(state.clipEnd) : ""}&origin=${esc(encodeURIComponent(location.origin))}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`
            : `<p class="ci-small">Paste a YouTube link to play the clip here. Type search words and press "Find it on YouTube" to look for it in a new tab, then copy the link back.</p>`
        }</div>
        ${
          id
            ? `<div class="wt-clipbar ci-small">
          <span>The scene runs from</span> <input data-w="cstart" size="6" value="${state.clipStart != null ? fmt(state.clipStart) : ""}" placeholder="0:00"> <button type="button" class="ci-link" data-w="setstart">now</button>
          <span>to</span> <input data-w="cend" size="6" value="${state.clipEnd != null ? fmt(state.clipEnd) : ""}" placeholder="end"> <button type="button" class="ci-link" data-w="setend">now</button>
          <span class="wt-sep">Backup links (the same scene, other uploads)</span> <input data-w="backup" size="22" placeholder="paste another link"> <button type="button" class="ci-link" data-w="addbackup">Add</button>
          ${state.ids.length > 1 ? `<span>${state.ids.map((x, i) => `<button type="button" class="ci-pill${x === id ? " on" : ""}" data-w="useid" data-v="${esc(x)}" title="Play this one">${i ? "backup " + i : "main"}${(state.gone || []).indexOf(x) >= 0 ? " ✕" : ""}</button>${i ? `<button type="button" class="ci-link" data-w="dropid" data-v="${esc(x)}" title="Remove this backup">×</button>` : ""}`).join(" ")}</span>` : ""}
        </div>`
            : ""
        }
        <div class="wt-tagbar">
          <span class="wt-clock" title="Where the player is">${fmt(player.time)}</span>
          <select data-w="key">${curiosityOptions(state.key)}</select>
          <select data-w="value">${valueOptions(state.key, state.value)}</select>
          <label class="ci-small">at <input data-w="at" size="6" value="${player.ready || state.lastAt == null ? fmt(player.time) : fmt(state.lastAt)}" title="Filled from the player; type a time if it can't load"></label>
          <button type="button" class="wt-tag" data-w="tag">Tag now</button>
          <label class="ci-small"><input type="checkbox" data-w="pause" ${state.pause ? "checked" : ""}> pause while I tag</label>
        </div>
        <p class="ci-small">Tag a curiosity when it changes: the first tag is where it starts, each later tag is a change. Enter also tags.</p>
      </div>
      <div class="wt-right">
        <h4>${tags.length} tag${tags.length === 1 ? "" : "s"}</h4>
        <table class="ci-table wt-tags"><tr><th>Time</th><th>Curiosity</th><th>Value</th><th></th></tr>
          ${tags.map((t) => `<tr><td><button type="button" class="ci-link" data-w="seek" data-v="${t.at}" title="Jump the player here">${fmt(t.at)}</button></td><td>${esc(label(t.key))}</td><td>${esc(t.value)}</td><td><button type="button" class="ci-link" data-w="untag" data-v="${t.n}">Remove</button></td></tr>`).join("") || `<tr><td colspan="4" class="ci-small">No tags yet.</td></tr>`}
        </table>
        <div class="ci-form">
          <label>Film, show or game <input data-f="work" value="${esc(state.info.work)}" placeholder="Title"></label>
          <label>Year <input data-f="year" inputmode="numeric" size="5" value="${esc(state.info.year)}"></label>
          <label>Kind <select data-f="kind">${["film", "tv", "anime", "game", "my clip"].map((k) => `<option ${state.info.kind === k ? "selected" : ""}>${k}</option>`).join("")}</select></label>
          <label>The moment, in your words <input data-f="moment" value="${esc(state.info.moment)}" placeholder="Two old friends meet at a station"></label>
          <label>What the audience feels <input data-f="feelings" value="${esc(state.info.feelings)}" placeholder="joy, nostalgia"></label>
        </div>
        <p class="ci-actions"><button type="button" data-w="keep">Keep this clip</button> <button type="button" class="ci-link" data-w="close">Back to the search</button></p>
        <p class="wt-msg ci-small"></p>
        <p class="ci-small">Kept: your tags, the video id and search words, in this browser and your project file. Never the video, its title or picture.</p>
      </div>
    </div>`;
    player.frame = body.querySelector(".wt-player iframe");
    player.ready = false;
    if (player.frame) {
      player.frame.addEventListener("load", () => {
        listen();
        setTimeout(listen, 800);
      });
    }
  }
  function readInfo() {
    dlg.querySelectorAll("[data-f]").forEach((x) => (state.info[x.dataset.f] = x.value));
    const link = dlg.querySelector('[data-w="link"]');
    if (link) state.link = link.value;
    const cs = dlg.querySelector('[data-w="cstart"]');
    if (cs) state.clipStart = parseTime(cs.value);
    const ce = dlg.querySelector('[data-w="cend"]');
    if (ce) state.clipEnd = parseTime(ce.value);
  }
  function msg(text) {
    const m = dlg.querySelector(".wt-msg");
    if (m) m.textContent = text;
  }
  function load() {
    readInfo();
    const id = parseId(state.link);
    if (!id) return msg(state.link.trim() ? "That isn't a YouTube link. Press \"Find it on YouTube\" to search, then paste the clip's link here." : "Paste a YouTube link first.");
    if (state.video && state.video !== id && state.ids.indexOf(state.video) < 0) state.ids.push(state.video);
    state.ids = [id].concat(state.ids.filter((x) => x !== id));
    state.video = id;
    state.start = linkStart(state.link);
    if (state.clipStart == null && state.start) state.clipStart = state.start;
    player.time = state.start;
    if (!state.info.search) state.info.search = "";
    draw();
  }
  function tag() {
    readInfo();
    const at = parseTime((dlg.querySelector('[data-w="at"]') || {}).value);
    const when = player.ready ? player.time : at;
    if (when == null) return msg("Type the time (like 1:05) first.");
    const value = (dlg.querySelector('[data-w="value"]') || {}).value || "";
    state.n += 1;
    state.tags.push({ n: state.n, at: Math.round(when * 10) / 10, key: state.key, value });
    state.value = value;
    state.lastAt = when;
    if (state.pause) send("pauseVideo");
    draw();
  }
  function keep() {
    readInfo();
    if (!state.info.work.trim()) return msg("Give it a title first.");
    if (!state.tags.length) return msg("Tag at least one curiosity.");
    const searchWords = parseId(state.link) ? "" : state.link.trim();
    const clip = toClip(Object.assign({}, state.info, { video: state.video, ids: state.ids, clipStart: state.clipStart, clipEnd: state.clipEnd, search: state.info.search || searchWords }), state.tags);
    const kept = window.CurioInspire && window.CurioInspire.keep ? window.CurioInspire.keep(clip) : null;
    state = null;
    shut();
    if (window.CurioInspire && window.CurioInspire.open) window.CurioInspire.open({ filters: [{ text: clip.work }] });
    return kept;
  }

  function onClick(e) {
    const b = e.target.closest("[data-w]");
    if (!b || b.tagName === "INPUT" || b.tagName === "SELECT") return;
    const w = b.dataset.w;
    if (w === "load") return load();
    if (w === "find") {
      readInfo();
      const q = parseId(state.link) ? [state.info.work, state.info.moment].filter(Boolean).join(" ") : state.link.trim() || [state.info.work, state.info.moment].filter(Boolean).join(" ");
      const h = hub();
      window.open(h ? h.WATCH.youtube.url(q) : "https://www.youtube.com/results?search_query=" + encodeURIComponent(q), "_blank", "noopener");
      return;
    }
    if (w === "tag") return tag();
    if (w === "untag") {
      readInfo();
      state.tags = state.tags.filter((t) => String(t.n) !== b.dataset.v);
      return draw();
    }
    if (w === "seek") {
      send("seekTo", [Number(b.dataset.v), true]);
      player.time = Number(b.dataset.v);
      const at = dlg.querySelector('[data-w="at"]');
      if (at) at.value = fmt(player.time);
      return;
    }
    if (w === "keep") return keep();
    if (w === "layout") return setLayout(b.dataset.v);
    if (w === "setstart" || w === "setend") {
      readInfo();
      const t = Math.round((player.ready ? player.time : parseTime((dlg.querySelector('[data-w="at"]') || {}).value) || 0) * 10) / 10;
      if (w === "setstart") state.clipStart = t;
      else state.clipEnd = t;
      return draw();
    }
    if (w === "addbackup") {
      readInfo();
      const box = dlg.querySelector('[data-w="backup"]');
      const id = parseId(box && box.value);
      if (!id) return msg("Paste a YouTube link for the backup.");
      if (state.ids.indexOf(id) < 0) state.ids.push(id);
      draw();
      return msg("Backup added. It plays if the main link stops working.");
    }
    if (w === "useid") {
      readInfo();
      state.video = b.dataset.v;
      state.ids = [state.video].concat(state.ids.filter((x) => x !== state.video));
      state.start = state.clipStart || 0;
      return draw();
    }
    if (w === "dropid") {
      readInfo();
      state.ids = state.ids.filter((x) => x !== b.dataset.v);
      return draw();
    }
    if (w === "shut") return shut();
    if (w === "close") {
      shut();
      if (window.CurioInspire && window.CurioInspire.open) window.CurioInspire.open();
    }
  }
  function shut() {
    dlg.close();
    document.body.classList.remove("wt-dock-side", "wt-dock-stack");
  }
  function setLayout(id) {
    if (!LAYOUTS.some(([x]) => x === id) || id === layout) return;
    readInfo();
    layout = id;
    try {
      localStorage.setItem(LAYOUT_KEY, id);
    } catch (e) {}
    /* The player is drawn again, so pick up where it was. */
    state.start = Math.floor(player.time || state.start || 0);
    show();
  }
  function onChange(e) {
    const t = e.target;
    if (t.dataset.w === "key") {
      readInfo();
      state.key = t.value;
      state.value = "";
      const v = dlg.querySelector('[data-w="value"]');
      if (v) v.innerHTML = valueOptions(state.key, "");
    }
    if (t.dataset.w === "value") state.value = t.value;
    if (t.dataset.w === "pause") state.pause = t.checked;
  }
  function onKey(e) {
    if (e.key !== "Enter") return;
    const w = e.target.dataset && e.target.dataset.w;
    if (w === "link") {
      e.preventDefault();
      return load();
    }
    if (w === "at" || w === "key" || w === "value") {
      e.preventDefault();
      return tag();
    }
  }

  /* opts: { search, work, year, kind, moment, feelings, link } — e.g. from a scene in the hub. */
  function open(opts) {
    const o = opts || {};
    if (!dlg) {
      dlg = document.createElement("dialog");
      dlg.className = "ci-hub wt-watch";
      dlg.innerHTML = `<header><strong>Watch and tag</strong> <span class="ci-small">play a clip, tag its curiosities as they change</span><span class="wt-layouts" role="group" aria-label="How the panel sits">${LAYOUTS.map(([id, l]) => `<button type="button" class="ci-pill" data-w="layout" data-v="${id}">${l}</button>`).join("")}</span><button type="button" data-w="shut">Close</button></header><div class="wt-body ci-body"></div>`;
      document.body.appendChild(dlg);
      dlg.addEventListener("click", onClick);
      dlg.addEventListener("change", onChange);
      dlg.addEventListener("keydown", onKey);
      window.addEventListener("message", onMessage);
      dlg.addEventListener("close", () => {
        /* Switching layouts closes and reopens at once; the close event arrives after, so check it's still shut. */
        if (dlg.open) return;
        send("pauseVideo");
        document.body.classList.remove("wt-dock-side", "wt-dock-stack");
      });
    }
    const v = o.video && o.video.id ? o.video : null;
    const ids = v ? (v.ids || [v.id]).filter(Boolean) : o.link && parseId(o.link) ? [parseId(o.link)] : [];
    state = {
      link: v ? "https://youtu.be/" + v.id : o.link || o.search || "",
      video: v ? v.id : o.link ? parseId(o.link) : null,
      ids,
      gone: v && v.gone ? v.gone.slice() : [],
      clipStart: v && v.start != null ? v.start : o.link && linkStart(o.link) ? linkStart(o.link) : null,
      clipEnd: v && v.end != null ? v.end : null,
      start: v ? v.start || 0 : o.link ? linkStart(o.link) : 0,
      key: "emotion",
      value: "",
      pause: false,
      tags: [],
      n: 0,
      info: { work: o.work || "", year: o.year || "", kind: o.kind || "film", moment: o.moment || "", feelings: Array.isArray(o.feelings) ? o.feelings.join(", ") : o.feelings || "", search: o.search || "" },
    };
    player = { time: state.start, duration: 0, ready: false, frame: null };
    if (o.layout && LAYOUTS.some(([id]) => id === o.layout)) layout = o.layout;
    show();
  }
  /* Full screen covers the app (modal); side by side and stacked leave your film usable in the other half. */
  function show() {
    if (dlg.open) dlg.close();
    document.body.classList.remove("wt-dock-side", "wt-dock-stack");
    dlg.classList.remove("wt-full", "wt-side", "wt-stack");
    dlg.classList.add("wt-" + layout);
    dlg.querySelectorAll('[data-w="layout"]').forEach((b) => b.classList.toggle("on", b.dataset.v === layout));
    draw();
    if (layout === "full" && typeof dlg.showModal === "function") dlg.showModal();
    else if (typeof dlg.show === "function") dlg.show();
    else dlg.setAttribute("open", "");
    if (layout !== "full") document.body.classList.add("wt-dock-" + layout);
    /* Opening a dialog focuses (and scrolls to) a field; start at the top with the link box ready. */
    dlg.scrollTop = 0;
    dlg.querySelector(".wt-body").scrollTop = 0;
    const link = dlg.querySelector('[data-w="link"]');
    if (link) link.focus({ preventScroll: true });
  }

  if (typeof document !== "undefined") {
    const css = document.createElement("style");
    css.textContent = `dialog.wt-watch{overflow:hidden;display:flex;flex-direction:column}
dialog.wt-watch:not([open]){display:none}
dialog.wt-watch>header{flex-wrap:wrap}
.wt-layouts{display:inline-flex;gap:.25rem;margin-left:auto}
dialog.wt-watch>header .wt-layouts+button{margin-left:.4rem}
dialog.ci-hub.wt-full{position:fixed;inset:0;width:100vw;max-width:100vw;height:100vh;max-height:100vh;margin:0;border-radius:0}
dialog.ci-hub.wt-side,dialog.ci-hub.wt-stack{position:fixed;margin:0;z-index:900;box-shadow:0 0 18px #0003}
dialog.ci-hub.wt-side{inset:0 0 0 auto;width:50vw;height:100vh;max-height:100vh;border-radius:0}
dialog.ci-hub.wt-stack{inset:0 0 auto 0;width:100vw;max-width:100vw;height:50vh;max-height:50vh;border-radius:0}
body.wt-dock-side{margin-right:50vw}
body.wt-dock-stack{margin-top:50vh}
dialog.ci-hub.wt-side .wt-grid{grid-template-columns:1fr}
dialog.ci-hub.wt-stack .wt-grid{grid-template-columns:auto minmax(280px,1fr)}
dialog.ci-hub.wt-stack .wt-player{height:calc(50vh - 9.5rem);width:auto;max-width:60vw}
dialog.ci-hub.wt-stack .wt-tags{max-height:14vh}
dialog.ci-hub.wt-full .wt-player{max-height:calc(100vh - 10rem)}
dialog.wt-watch>.wt-body{flex:1;height:auto;min-height:0}
.wt-grid{display:grid;grid-template-columns:minmax(0,1.6fr) minmax(280px,1fr);gap:.8rem;align-items:start}
.wt-player{aspect-ratio:16/9;background:#0002;border-radius:8px;overflow:hidden;display:flex;align-items:center;justify-content:center;padding:0}
.wt-player p{padding:1rem}
.wt-player iframe{width:100%;height:100%;border:0}
.wt-tagbar{display:flex;flex-wrap:wrap;gap:.4rem;align-items:center;margin:.5rem 0}
.wt-clipbar{display:flex;flex-wrap:wrap;gap:.3rem;align-items:center;margin:.4rem 0 0}
.wt-clipbar .wt-sep{margin-left:.6rem}
.wt-tagbar select{width:auto;max-width:16rem}
.wt-clock{font-variant-numeric:tabular-nums;font-weight:600;min-width:3.2rem}
.wt-tag{background:var(--saffron,#c45c26);color:#fff;border:0;border-radius:6px;padding:.3rem .8rem;font:inherit;cursor:pointer}
.wt-right h4{margin:.1rem 0 .3rem}
.wt-tags{max-height:34vh}
@media (max-width:900px){.wt-grid{grid-template-columns:1fr}}`;
    (document.head || document.documentElement).appendChild(css);
    /* Open it from the Library menu too, next to Scene inspiration. */
    const wire = () => {
      const menu = document.getElementById("lib-menu");
      if (!menu || menu.querySelector("[data-watch-tag]")) return;
      const b = document.createElement("button");
      b.type = "button";
      b.dataset.watchTag = "open";
      b.innerHTML = "Watch and tag<small>play a YouTube clip beside your film and tag its curiosities</small>";
      const after = menu.querySelector("[data-inspire]") || menu.querySelector('[data-tab="prism"]');
      menu.insertBefore(b, after ? after.nextSibling : null);
      b.addEventListener("click", () => {
        menu.hidden = true;
        open();
      });
    };
    /* After hub.js has added Scene inspiration, so this lands under it. */
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => setTimeout(wire, 0));
    else setTimeout(wire, 0);
  }

  const api = { open, parseId, toClip, fmt, parseTime, linkStart, probe, check };
  root.CurioWatchTag = api;
  if (typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
