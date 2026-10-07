/* perform/transport.js: Performance and recording (window.CurioTransport).

   Jeremy 2026-10-07: "we should have a transport window, which has advance and play. And it should also have
   record, because this is also a performance app where we can automate anything": jumping around between
   storyboards, every curiosity one at a time or in suites, Catalysts (a Spark, or an Elixir once every
   ingredient lines up), and the curiosities near the current one (Proximity), set off by MIDI, by a camera
   watching a performer, or by spoken words. "This should all be under performance and recording."

   What is here:
     The Transport window   a small window that floats over every page and never hides when windows are added:
                            ⏮ first, ◀ back, ▶ Play / ❚❚ Pause, ▶| advance, ● Record, and the takes. It drives
                            the Viewer when the Viewer is open, else the Screen's own play buttons.
                            Its buttons can be learned to MIDI (🎹 Learn, then click a button, then press a key
                            or move a knob). Voice reaches them by their words, like every visible button.
     Recording (a take)     while ● is on, everything you perform is kept with its time: panel jumps in the
                            Viewer, page turns in the Storyboard, Play and Pause, every curiosity or suite change
                            (each engine command), and every Catalyst that fires (the engine's performance
                            layers: Sparks, Elixirs, master nodes, MIDI, words heard, the camera).
     Playing a take back    puts the same things back at the same times: panel jumps and page turns, the
                            Catalysts as a performance of their own (put back when the take ends), and the
                            curiosity changes (each one an undo step, like doing them by hand).
     Performance ▾          the Viewer's menu for this section: the Transport window, Live inputs (MIDI, the
                            camera and words: screen/triggers.js), and the Catalysts window (screen/catalyst.js).

   Saved under localStorage "curiosities-performances-v1" (takes) and "curiosities-transport-v1" (where the
   window sits, whether it is open, the MIDI map).

   window.CurioTransport
     open(), close(), toggle(), isOpen()       the Transport window
     menu(anchor)                              the Performance ▾ menu, under a button
     record(on?), recording()                  start or stop a take
     takes(), play(id), stopTake(), playingTake(), rename(id, name), remove(id)
     note(kind, data)                          add an event to the take being recorded (for other parts)
     core                                      the pure part (no page), for tests */
(function () {
  const root = typeof window !== "undefined" ? window : globalThis;
  const hasDoc = typeof document !== "undefined";
  const KEY = "curiosities-performances-v1";
  const PREFS = "curiosities-transport-v1";
  const MAX_TAKES = 40;
  const MAX_EVENTS = 5000;
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const clone = (x) => (x == null ? x : JSON.parse(JSON.stringify(x)));
  const now = () => (root.performance && performance.now ? performance.now() : Date.now()) / 1000;
  const KINDS = ["panel", "board", "play", "layer", "edit"];

  /* ---------- the pure part ---------- */
  function clean(take) {
    if (!take || typeof take !== "object" || !Array.isArray(take.events)) return null;
    const events = take.events
      .filter((e) => e && KINDS.includes(e.k) && isFinite(e.t) && e.t >= 0)
      .slice(0, MAX_EVENTS)
      .map((e) => Object.assign({}, e, { t: Math.round(e.t * 1000) / 1000 }))
      .sort((a, b) => a.t - b.t);
    const length = Math.max(Number(take.length) || 0, events.length ? events[events.length - 1].t : 0);
    return { id: String(take.id || "take-" + Math.random().toString(36).slice(2, 8)), name: String(take.name || "Take").slice(0, 80), made: String(take.made || ""), length, events };
  }
  /* What a take holds, in plain words: "3 panel jumps, 2 Catalysts, 5 curiosity changes". */
  function summary(take) {
    const n = { panel: 0, board: 0, play: 0, layer: 0, edit: 0 };
    (take.events || []).forEach((e) => n[e.k]++);
    const bits = [];
    if (n.panel) bits.push(n.panel + (n.panel === 1 ? " panel jump" : " panel jumps"));
    if (n.board) bits.push(n.board + (n.board === 1 ? " storyboard page" : " storyboard pages"));
    if (n.layer) bits.push(n.layer + (n.layer === 1 ? " Catalyst move" : " Catalyst moves"));
    if (n.edit) bits.push(n.edit + (n.edit === 1 ? " curiosity change" : " curiosity changes"));
    if (n.play) bits.push(n.play + (n.play === 1 ? " play or pause" : " plays and pauses"));
    return bits.length ? bits.join(", ") : "nothing yet";
  }
  /* The events due between two moments of a take (from exclusive, to inclusive). */
  function due(take, from, to) {
    return take.events.filter((e) => e.t > from && e.t <= to);
  }
  function fmt(s) {
    s = Math.max(0, s || 0);
    const m = Math.floor(s / 60);
    return m + ":" + (s - m * 60).toFixed(1).padStart(4, "0");
  }
  /* A recorder on its own clock: start(t), add(kind, data, t), stop(t) -> take. Tests drive it with their own t. */
  function recorder() {
    let take = null;
    let t0 = 0;
    let last = {};
    return {
      on: () => !!take,
      start(t, name) {
        t0 = t;
        last = {};
        take = { id: "take-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), name: name || "Take", made: new Date().toISOString(), length: 0, events: [] };
        return take;
      },
      add(k, data, t) {
        if (!take || !KINDS.includes(k) || take.events.length >= MAX_EVENTS) return false;
        const e = Object.assign({ t: Math.max(0, t - t0), k }, clone(data));
        /* the same layer sent twice in a row with nothing new in it is one event */
        if (k === "layer") {
          const sig = JSON.stringify(e.layer);
          if (last[e.name] === sig) return false;
          last[e.name] = sig;
        }
        take.events.push(e);
        return true;
      },
      stop(t) {
        if (!take) return null;
        take.length = Math.max(0, t - t0);
        const out = clean(take);
        take = null;
        return out;
      },
      count: () => (take ? take.events.length : 0),
      elapsed: (t) => (take ? Math.max(0, t - t0) : 0),
    };
  }
  const core = { clean, summary, due, fmt, recorder, KINDS };

  if (!hasDoc) {
    root.CurioTransport = { core };
    if (typeof module !== "undefined") module.exports = root.CurioTransport;
    return;
  }

  /* ---------- saving ---------- */
  function read(key, d) {
    try {
      const x = JSON.parse(localStorage.getItem(key));
      return x == null ? d : x;
    } catch (e) {
      return d;
    }
  }
  function write(key, v) {
    try {
      localStorage.setItem(key, JSON.stringify(v));
      return true;
    } catch (e) {
      return false;
    }
  }
  let takes = (read(KEY, []) || []).map(clean).filter(Boolean);
  const prefs = Object.assign({ open: false, x: null, y: null, midi: {}, take: null }, read(PREFS, {}));
  const saveTakes = () => write(KEY, takes);
  const savePrefs = () => write(PREFS, prefs);

  /* ---------- what the transport drives ---------- */
  const V = () => (root.CurioViewer && root.CurioViewer.isOpen && root.CurioViewer.isOpen() ? root.CurioViewer : null);
  const screenPage = () => document.querySelector(".sc-page:not([hidden])");
  function screenClick(act) {
    const p = screenPage();
    const b = p && p.querySelector(`.sc-play [data-act="${act}"]`);
    if (b) b.click();
    return !!b;
  }
  function isPlaying() {
    const v = V();
    if (v) return !!v.playing();
    const S = root.CurioScreen;
    return !!(S && S.isOpen && S.isOpen() && S.playing && S.playing());
  }
  const act = {
    first() {
      const v = V();
      if (v) return v.select(0);
      if (root.CurioScreen && screenPage()) root.CurioScreen.setRow(0);
    },
    back() {
      const v = V();
      if (v) return v.select(Math.max(0, v.panel() - 1));
      screenClick("prev");
    },
    play() {
      const v = V();
      if (v) v.togglePlay();
      else if (!screenClick("play") && root.CurioViewer) {
        root.CurioViewer.open();
        root.CurioViewer.play(true);
      }
      setTimeout(draw, 30);
    },
    next() {
      const v = V();
      if (v) {
        const n = v.film().panels.length;
        return v.select((v.panel() + 1) % n);
      }
      screenClick("next");
    },
    record: () => record(!rec.on()),
  };

  /* ---------- recording ---------- */
  const rec = recorder();
  let tick = null;
  let replaying = 0;
  function note(k, data) {
    if (!rec.on() || replaying) return false;
    const ok = rec.add(k, data, now());
    if (ok) drawCount();
    return ok;
  }
  function record(on) {
    if (on == null) on = !rec.on();
    if (on === rec.on()) return rec.on();
    if (on) {
      stopTake();
      rec.start(now(), "Take " + (takes.length + 1));
      lastPanel = V() ? V().panel() : null;
      clearInterval(tick);
      tick = setInterval(drawCount, 200);
      toast("Recording. Play, jump, change curiosities, set off Catalysts: everything is kept with its time.");
    } else {
      clearInterval(tick);
      const take = rec.stop(now());
      if (take && take.events.length) {
        takes.unshift(take);
        takes = takes.slice(0, MAX_TAKES);
        prefs.take = take.id;
        saveTakes();
        savePrefs();
        toast(`${take.name} kept: ${summary(take)}.`);
      } else toast("Nothing was recorded, so no take was kept.");
    }
    draw();
    return rec.on();
  }

  /* Listening: the Viewer, the Storyboard and the engine. Hooked once each, as soon as they exist. */
  let lastPanel = null;
  let lastPlay = false;
  let hooked = { viewer: false, board: false, engine: false, midi: false };
  function hookAll() {
    const CV = root.CurioViewer;
    if (!hooked.viewer && CV && CV.onDraw) {
      hooked.viewer = true;
      CV.onDraw((t, panel) => {
        const i = panel && panel.i != null ? panel.i : CV.panel();
        if (i !== lastPanel) {
          /* a jump, not the film simply playing on into the next panel */
          const n = CV.film().panels.length;
          const flowed = CV.playing() && lastPanel != null && (i === lastPanel + 1 || (i === 0 && lastPanel === n - 1));
          if (!flowed) note("panel", { i });
          lastPanel = i;
        }
        drawSoon();
      });
      if (CV.onPlay)
        CV.onPlay((on) => {
          if (on !== lastPlay) note("play", { on: !!on });
          lastPlay = !!on;
          drawSoon();
        });
    }
    const SB = root.CuriosityStoryboard;
    if (!hooked.board && SB && SB.on) {
      hooked.board = true;
      SB.on((ev) => ev && ev.type === "page" && note("board", { si: ev.si, pi: ev.pi }));
    }
    const E = root.CurioEngine;
    if (!hooked.engine && E && E.send && E.perform) {
      hooked.engine = true;
      const send = E.send;
      E.send = function (msg) {
        const out = send.apply(this, arguments);
        if (out && out.ok) note("edit", { msg });
        return out;
      };
      const perform = E.perform;
      E.perform = function (name, layer) {
        if (name != null && !String(name).startsWith("take:")) note("layer", { name: String(name), layer: layer == null ? null : layer });
        else if (name == null) note("layer", { name: null, layer: null });
        return perform.apply(this, arguments);
      };
    }
    const A = root.CurioAuto;
    if (!hooked.midi && A && A.on) {
      hooked.midi = true;
      A.on((type, ev) => type === "midi" && onMidi(ev));
    }
  }

  /* ---------- playing a take back ---------- */
  let player = null;
  function stopTake() {
    if (!player) return;
    cancelAnimationFrame(player.raf);
    const E = root.CurioEngine;
    if (E && E.performing && E.perform) E.performing().filter((n) => n.startsWith("take:")).forEach((n) => E.perform(n, null));
    player = null;
    draw();
  }
  function run(e) {
    replaying++;
    try {
      const E = root.CurioEngine;
      if (e.k === "panel" && root.CurioViewer) {
        if (!V()) root.CurioViewer.open();
        root.CurioViewer.select(e.i);
      } else if (e.k === "board" && root.CuriosityStoryboard && root.CuriosityStoryboard.showAt) root.CuriosityStoryboard.showAt(e.si, e.pi);
      else if (e.k === "play") {
        if (V()) root.CurioViewer.play(e.on);
        else if (isPlaying() !== e.on) screenClick("play");
      } else if (e.k === "layer" && E && E.perform) {
        if (e.name == null) E.performing().filter((n) => n.startsWith("take:")).forEach((n) => E.perform(n, null));
        else E.perform("take:" + e.name, e.layer);
      } else if (e.k === "edit" && E && E.send) E.send(e.msg);
    } catch (err) {
      console.warn("Take: " + err.message);
    } finally {
      replaying--;
    }
  }
  function play(id) {
    const take = takes.find((t) => t.id === id);
    if (!take) return false;
    if (rec.on()) record(false);
    stopTake();
    hookAll();
    prefs.take = id;
    savePrefs();
    const t0 = now();
    let at = 0;
    player = { id, t0, raf: 0 };
    const step = () => {
      if (!player || player.id !== id) return;
      const t = now() - t0;
      due(take, at, t).forEach(run);
      at = t;
      drawCount();
      if (t >= take.length) return stopTake();
      player.raf = requestAnimationFrame(step);
    };
    /* the events at the very start run now */
    take.events.filter((e) => e.t <= 0).forEach(run);
    player.raf = requestAnimationFrame(step);
    draw();
    return true;
  }

  /* ---------- MIDI for the transport's buttons ---------- */
  let learning = false;
  let learnFor = null;
  function onMidi(ev) {
    if (!ev || (ev.kind !== "note" && ev.kind !== "cc")) return;
    const key = ev.kind + ":" + ev.num;
    const pressed = ev.kind === "note" ? !!ev.on : ev.val > 63;
    if (learning && learnFor && (ev.kind === "cc" || ev.on)) {
      Object.keys(prefs.midi).forEach((k) => prefs.midi[k] === learnFor && delete prefs.midi[k]);
      prefs.midi[key] = learnFor;
      savePrefs();
      toast(`${LABEL[learnFor]} now answers ${ev.kind === "note" ? "MIDI note " + ev.num : "MIDI knob " + ev.num}.`);
      learnFor = null;
      learning = false;
      return draw();
    }
    const a = prefs.midi[key];
    if (a && pressed && act[a]) act[a]();
  }
  const LABEL = { first: "First panel", back: "Back", play: "Play", next: "Advance", record: "Record" };

  /* ---------- the window ---------- */
  const CSS = `
.pf-win { position: fixed; z-index: 2147483000; width: 360px; max-width: calc(100vw - 16px); background: #17171b; color: #ececf1; border: 1px solid #34343c; border-radius: 10px; box-shadow: 0 12px 32px rgba(0,0,0,0.55); font: 13px/1.35 system-ui, -apple-system, "Segoe UI", sans-serif; }
.pf-win[hidden] { display: none; }
.pf-head { display: flex; align-items: center; gap: 8px; padding: 6px 8px 6px 12px; cursor: move; border-bottom: 1px solid #2a2a31; touch-action: none; user-select: none; }
.pf-head b { flex: 1; font-size: 13px; }
.pf-win button { font: inherit; color: inherit; background: #26262d; border: 1px solid #34343c; border-radius: 6px; padding: 5px 9px; cursor: pointer; }
.pf-win button:hover { background: #303038; }
.pf-win button:focus-visible { outline: 2px solid #22d3ee; outline-offset: 1px; }
.pf-x { padding: 2px 8px !important; }
.pf-body { padding: 8px 10px 10px; display: grid; gap: 8px; }
.pf-row { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
.pf-big button { font-size: 15px; min-width: 40px; }
.pf-win .pf-play { background: #22d3ee; color: #062a31; border-color: #22d3ee; font-weight: 700; min-width: 86px; }
.pf-win .pf-rec { color: #ff5c5c; font-weight: 700; }
.pf-win .pf-rec.on { background: #ff3b3b; border-color: #ff3b3b; color: #fff; animation: pf-blink 1s steps(2, start) infinite; }
@keyframes pf-blink { to { opacity: 0.65; } }
@media (prefers-reduced-motion: reduce) { .pf-win .pf-rec.on { animation: none; } }
.pf-time { font-variant-numeric: tabular-nums; color: #a1a1aa; margin-left: auto; }
.pf-k { color: #a1a1aa; font-size: 12px; margin: 0; }
.pf-win select { font: inherit; color: inherit; background: #26262d; border: 1px solid #34343c; border-radius: 6px; padding: 4px 6px; flex: 1; min-width: 0; }
.pf-win .on-learn { box-shadow: 0 0 0 2px #fbbf24; }
.pf-menu { position: fixed; z-index: 2147483001; display: grid; background: #17171b; color: #ececf1; border: 1px solid #34343c; border-radius: 8px; padding: 4px; box-shadow: 0 10px 28px rgba(0,0,0,0.55); font: 13px/1.35 system-ui, -apple-system, "Segoe UI", sans-serif; }
.pf-menu b { font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: #a1a1aa; padding: 4px 8px 2px; }
.pf-menu button { font: inherit; color: inherit; background: transparent; border: 0; border-radius: 6px; padding: 7px 10px; text-align: left; cursor: pointer; }
.pf-menu button:hover, .pf-menu button:focus-visible { background: #26262d; outline: none; }
.pf-toast { position: fixed; z-index: 2147483002; left: 50%; bottom: 84px; transform: translateX(-50%); background: #26262d; color: #ececf1; border: 1px solid #34343c; border-radius: 8px; padding: 8px 14px; font: 13px system-ui, sans-serif; max-width: min(520px, calc(100vw - 32px)); box-shadow: 0 8px 24px rgba(0,0,0,0.5); }
`;
  let win = null;
  function build() {
    if (win) return win;
    if (!document.getElementById("pf-style")) {
      const st = document.createElement("style");
      st.id = "pf-style";
      st.textContent = CSS;
      document.head.appendChild(st);
    }
    win = document.createElement("section");
    win.className = "pf-win";
    win.setAttribute("role", "dialog");
    win.setAttribute("aria-label", "Transport");
    win.hidden = true;
    document.body.appendChild(win);
    win.addEventListener("click", onClick);
    win.addEventListener("change", (e) => {
      if (e.target.matches("[data-pf-take]")) {
        prefs.take = e.target.value;
        savePrefs();
        draw();
      }
    });
    dragBy(win);
    return win;
  }
  function place() {
    const w = win.offsetWidth || 360;
    const h = win.offsetHeight || 150;
    let x = prefs.x == null ? innerWidth - w - 16 : prefs.x;
    let y = prefs.y == null ? innerHeight - h - 96 : prefs.y;
    x = Math.max(8, Math.min(innerWidth - w - 8, x));
    y = Math.max(8, Math.min(innerHeight - h - 8, y));
    win.style.left = x + "px";
    win.style.top = y + "px";
  }
  function dragBy(w) {
    let d = null;
    w.addEventListener("pointerdown", (e) => {
      if (!e.target.closest(".pf-head") || e.target.closest("button")) return;
      const r = w.getBoundingClientRect();
      d = { dx: e.clientX - r.left, dy: e.clientY - r.top, id: e.pointerId };
      w.setPointerCapture && w.setPointerCapture(e.pointerId);
    });
    w.addEventListener("pointermove", (e) => {
      if (!d || e.pointerId !== d.id) return;
      prefs.x = e.clientX - d.dx;
      prefs.y = e.clientY - d.dy;
      place();
    });
    const end = (e) => {
      if (!d || e.pointerId !== d.id) return;
      d = null;
      savePrefs();
    };
    w.addEventListener("pointerup", end);
    w.addEventListener("pointercancel", end);
    window.addEventListener("resize", () => win && !win.hidden && place());
  }
  function btn(a, text, title, cls) {
    const learnOn = learning && learnFor === a;
    const midiKey = Object.keys(prefs.midi).find((k) => prefs.midi[k] === a);
    const t = title + (midiKey ? ` (MIDI ${midiKey.replace(":", " ")})` : "");
    return `<button type="button" data-pf="${a}" class="${cls || ""}${learnOn ? " on-learn" : ""}" title="${esc(t)}" aria-label="${esc(LABEL[a] || text)}">${text}</button>`;
  }
  function draw() {
    if (!win || win.hidden) return;
    const playingNow = isPlaying();
    const take = takes.find((t) => t.id === prefs.take) || takes[0];
    const r = rec.on();
    win.innerHTML = `
      <header class="pf-head" title="Drag here to move the Transport"><b>Transport</b><span class="pf-k">Performance and recording</span><button type="button" class="pf-x" data-pf="close" title="Close the Transport (Performance ▾ opens it again)" aria-label="Close the Transport">×</button></header>
      <div class="pf-body">
        <div class="pf-row pf-big">
          ${btn("first", "⏮", "First panel")}
          ${btn("back", "◀", "Back one panel")}
          ${btn("play", playingNow ? "❚❚ Pause" : "▶ Play", playingNow ? "Pause" : "Play", "pf-play")}
          ${btn("next", "▶|", "Advance to the next panel")}
          ${btn("record", r ? "● Recording" : "● Record", r ? "Stop recording and keep this take" : "Record a take: every jump, curiosity change and Catalyst you perform, with its time", "pf-rec" + (r ? " on" : ""))}
          <span class="pf-time" data-pf-time></span>
        </div>
        <p class="pf-k" data-pf-count></p>
        <div class="pf-row">
          ${
            takes.length
              ? `<select data-pf-take aria-label="Takes">${takes.map((t) => `<option value="${esc(t.id)}"${take && t.id === take.id ? " selected" : ""}>${esc(t.name)} · ${fmt(t.length)}</option>`).join("")}</select>
          <button type="button" data-pf="take" title="${player ? "Stop playing this take" : "Play this take back: the same jumps, changes and Catalysts at the same times"}">${player ? "■ Stop take" : "▶ Play take"}</button>
          <button type="button" data-pf="rename" title="Give this take a name">Rename</button>
          <button type="button" data-pf="remove" title="Throw this take away">Delete</button>`
              : `<p class="pf-k">No takes yet. Press ● Record, perform, and press it again to keep a take.</p>`
          }
        </div>
        ${take && takes.length ? `<p class="pf-k">${esc(summary(take))}</p>` : ""}
        <div class="pf-row">
          <button type="button" data-pf="inputs" title="Set curiosities off with MIDI, the camera watching a performer, or spoken words">Live inputs: MIDI, camera, voice</button>
          <button type="button" data-pf="learn" class="${learning ? "on-learn" : ""}" title="Learn MIDI: click this, then a Transport button, then press a key or move a knob on your MIDI controller">${learning ? (learnFor ? "Now press a MIDI key…" : "Now click a button…") : "🎹 Learn"}</button>
        </div>
      </div>`;
    drawCount();
    place();
  }
  let soon = 0;
  function drawSoon() {
    if (soon || !win || win.hidden) return;
    soon = requestAnimationFrame(() => {
      soon = 0;
      const p = win.querySelector('[data-pf="play"]');
      if (p && (p.textContent.includes("Pause") !== isPlaying())) draw();
      else drawCount();
    });
  }
  function drawCount() {
    if (!win || win.hidden) return;
    const time = win.querySelector("[data-pf-time]");
    const count = win.querySelector("[data-pf-count]");
    const v = V();
    if (rec.on()) {
      if (time) time.textContent = "● " + fmt(rec.elapsed(now()));
      if (count) count.textContent = `Recording: ${rec.count()} ${rec.count() === 1 ? "move" : "moves"} kept so far.`;
    } else if (player) {
      const take = takes.find((t) => t.id === player.id);
      if (time) time.textContent = "▶ " + fmt(now() - player.t0) + " / " + fmt(take ? take.length : 0);
      if (count) count.textContent = "Playing the take back.";
    } else {
      if (time) time.textContent = v ? `Panel ${v.panel() + 1} of ${v.film().panels.length}` : "";
      if (count) count.textContent = "";
    }
  }
  function onClick(e) {
    const b = e.target.closest("[data-pf]");
    if (!b) return;
    const a = b.dataset.pf;
    if (learning && LABEL[a]) {
      learnFor = a;
      const A = root.CurioAuto;
      if (A && A.connectMidi) A.connectMidi();
      return draw();
    }
    if (act[a]) return act[a](), draw();
    if (a === "close") return close();
    if (a === "learn") {
      learning = !learning;
      learnFor = null;
      return draw();
    }
    if (a === "inputs") return openInputs();
    const take = takes.find((t) => t.id === prefs.take) || takes[0];
    if (!take) return;
    if (a === "take") return player ? stopTake() : play(take.id);
    if (a === "rename") {
      const name = prompt("A name for this take", take.name);
      if (name && name.trim()) rename(take.id, name.trim());
      return;
    }
    if (a === "remove" && confirm(`Delete ${take.name}?`)) remove(take.id);
  }
  function rename(id, name) {
    const t = takes.find((x) => x.id === id);
    if (!t) return false;
    t.name = String(name).slice(0, 80);
    saveTakes();
    draw();
    return true;
  }
  function remove(id) {
    if (player && player.id === id) stopTake();
    const n = takes.length;
    takes = takes.filter((t) => t.id !== id);
    saveTakes();
    draw();
    return takes.length < n;
  }
  function openInputs() {
    const T = root.CurioTriggers;
    if (T && T.openProximity) return T.openProximity();
    toast("Live inputs are not loaded on this page.");
  }
  function open() {
    hookAll();
    build();
    win.hidden = false;
    prefs.open = true;
    savePrefs();
    draw();
  }
  function close() {
    if (win) win.hidden = true;
    learning = false;
    prefs.open = false;
    savePrefs();
  }
  const isOpen = () => !!(win && !win.hidden);

  /* ---------- the Performance ▾ menu ---------- */
  let menuEl = null;
  function menu(anchor) {
    if (menuEl) {
      menuEl.remove();
      menuEl = null;
      return;
    }
    build();
    menuEl = document.createElement("div");
    menuEl.className = "pf-menu";
    menuEl.setAttribute("role", "menu");
    const C = root.CurioCatalyst;
    menuEl.innerHTML = `<b>Performance and recording</b>
      <button type="button" role="menuitem" data-m="transport">${isOpen() ? "Hide the Transport" : "Transport: play, advance, record"}</button>
      <button type="button" role="menuitem" data-m="record">${rec.on() ? "Stop recording" : "● Record a take"}</button>
      <button type="button" role="menuitem" data-m="inputs">Live inputs: MIDI, camera, voice</button>
      ${C && C.open ? `<button type="button" role="menuitem" data-m="catalysts">⚗ Catalysts: Sparks and Elixirs</button>` : ""}`;
    document.body.appendChild(menuEl);
    const r = anchor ? anchor.getBoundingClientRect() : { left: innerWidth - 280, bottom: 48 };
    menuEl.style.left = Math.max(8, Math.min(innerWidth - menuEl.offsetWidth - 8, r.left)) + "px";
    menuEl.style.top = r.bottom + 4 + "px";
    menuEl.addEventListener("click", (e) => {
      const b = e.target.closest("[data-m]");
      if (!b) return;
      const m = b.dataset.m;
      menuEl.remove();
      menuEl = null;
      if (m === "transport") isOpen() ? close() : open();
      else if (m === "record") {
        if (!isOpen()) open();
        record();
      } else if (m === "inputs") openInputs();
      else if (m === "catalysts") root.CurioCatalyst.open();
    });
    setTimeout(() => {
      const off = (e) => {
        if (menuEl && !menuEl.contains(e.target) && e.target !== anchor) {
          menuEl.remove();
          menuEl = null;
        }
        if (!menuEl) document.removeEventListener("pointerdown", off, true);
      };
      document.addEventListener("pointerdown", off, true);
    });
  }

  let toastT = 0;
  function toast(text) {
    let t = document.querySelector(".pf-toast");
    if (!t) {
      t = document.createElement("div");
      t.className = "pf-toast";
      t.setAttribute("role", "status");
      document.body.appendChild(t);
    }
    t.textContent = text;
    t.hidden = false;
    clearTimeout(toastT);
    toastT = setTimeout(() => (t.hidden = true), 3200);
  }

  root.CurioTransport = {
    open,
    close,
    toggle: () => (isOpen() ? close() : open()),
    isOpen,
    menu,
    record,
    recording: () => rec.on(),
    takes: () => clone(takes),
    play,
    stopTake,
    playingTake: () => (player ? player.id : null),
    rename,
    remove,
    note,
    core,
  };

  /* Hook in once every part has loaded, and put the Transport back if it was open. */
  const start = () => {
    hookAll();
    if (prefs.open) open();
  };
  if (document.readyState === "complete") setTimeout(start);
  else window.addEventListener("load", () => setTimeout(start));
})();
