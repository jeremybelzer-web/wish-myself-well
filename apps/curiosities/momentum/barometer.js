/* momentum/barometer.js: the attention barometer, a small pill in the bottom right corner of every page of the
   app. At a glance it says what holds the audience's attention right now and whether it has held it too long:
   the family's letter and color, the seconds it has held attention against the limit with its mark
   (● Fresh, ▲ Getting long, ■ Too long, icon plus words), and a tiny bar. Clicking it opens the Momentum window.

   Which film it reads is the film the Momentum window follows (its saved source, curiosities-momentum-v1):
   - My film (the engine's timeline, or no choice yet): attention at the Screen's playhead, or at the end when
     there is no Screen. My film, live: the Perform tab's reading while it runs, otherwise My film's panels.
   - My film's panels, a storyboard scene or a curated film: attention at the end of that film.
   It redraws when the engine, the board, the automation, Perform or the Screen's playhead change (their own on()
   hooks), at most about three times a second, and reads nothing while it is hidden.

   It hides where it would repeat itself: while the Screen is open (the Player's meter shows the same thing) and
   while the Momentum window is open. Its × hides it for good (localStorage key curiosities-momentum-barometer-v1);
   the Momentum window then shows a short line with a button that brings it back.

   window.CurioMomentumBarometer
   - say(input, M?) -> what the pill says (pure, works in Node): { empty, family, letter, color, ink, famLabel,
       held, limit, pct, status, short, text, title }. input: { family, seconds, limit, label, film, moment, n,
       where: "now" | "end" | "live" }. M is CurioMomentum (notes.js), found on the page or through require.
   - pick(source) -> "engine" | "live" | "board" | "film": how a Momentum source is read (pure).
   - visible({ hidden, screenOpen, windowOpen }) -> true when the pill shows (pure).
   - read() -> the input for say(), from the page; draw(); hide(); show(); hidden(); stats() { reads, draws } */
(function () {
  const root = typeof window !== "undefined" ? window : globalThis;
  const KEY = "curiosities-momentum-barometer-v1";
  const MS = 300;

  function marks(M) {
    if (M && typeof M.mark === "function") return M;
    if (root.CurioMomentum && typeof root.CurioMomentum.mark === "function") return root.CurioMomentum;
    if (typeof require === "function") {
      try {
        return require("./notes.js");
      } catch (e) {}
    }
    return null;
  }

  /* ---------- pure ---------- */
  function pick(source) {
    const s = String(source || "");
    if (!s || s === "engine") return "engine";
    if (s === "live") return "live";
    if (s === "board") return "board";
    if (s.startsWith("sb:") || s.startsWith("study:")) return "film";
    return "engine";
  }
  function visible(f) {
    const x = f || {};
    return !x.hidden && !x.screenOpen && !x.windowOpen;
  }
  function say(input, Mopt) {
    const M = marks(Mopt);
    const x = input || {};
    const limit = Number(x.limit) > 0 ? Math.round(Number(x.limit)) : 20;
    const film = x.film || "My film";
    const has = !!x.family && Number.isFinite(Number(x.seconds));
    if (!has) {
      const st = M.status(null, limit);
      return {
        empty: true,
        family: null,
        letter: "",
        color: null,
        ink: null,
        famLabel: "",
        held: 0,
        limit,
        pct: 0,
        status: { key: st.key, cls: st.cls, icon: st.icon, words: st.words },
        short: "Nothing yet",
        text: "Attention: nothing yet",
        title: `${film}: nothing holds the audience's attention yet. Click to open Momentum.`,
      };
    }
    const sec = Math.max(0, Number(x.seconds));
    const held = Math.round(sec);
    const m = M.mark(x.family);
    const st = M.status(sec, limit);
    const where = x.where === "end" ? "At the end of " + film : x.where === "live" ? film + ", playing now" : x.moment ? `${film}, moment ${x.moment}${x.n ? " of " + x.n : ""}` : film;
    const label = x.label ? ` (${x.label})` : "";
    const advice = st.key === "over" ? " Time to move attention to something else." : st.key === "long" ? " Attention will soon want something new." : "";
    return {
      empty: false,
      family: x.family,
      letter: m.letter,
      color: m.color,
      ink: m.ink,
      famLabel: m.label,
      held,
      limit,
      pct: Math.round(Math.min(1, sec / limit) * 100),
      status: { key: st.key, cls: st.cls, icon: st.icon, words: st.words },
      short: `Held ${held} s of ${limit} s`,
      text: `${m.letter} ${m.label}, ${held} s of ${limit} s, ${st.icon} ${st.words}`,
      title: `${where}: ${m.label}${label} has held attention for ${held} ${held === 1 ? "second" : "seconds"} of the ${limit} second limit. ${st.words}.${advice} Click to open Momentum.`,
    };
  }

  const api = { say, pick, visible, KEY };
  root.CurioMomentumBarometer = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (typeof document === "undefined" || !root.document) return;

  /* ---------- the page ---------- */
  const M = () => root.CurioMomentum;
  const A = () => root.CurioAttention;
  const R = () => root.CurioRates;
  const ME = () => root.CurioMomentumEngine;
  const UI = () => root.CurioMomentumUI;
  const SC = () => root.CurioScreen;
  const PF = () => root.CurioPerform;
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

  let own = { hidden: false };
  try {
    const p = JSON.parse(localStorage.getItem(KEY));
    if (p && typeof p === "object") own.hidden = !!p.hidden;
  } catch (e) {}
  const saveOwn = () => {
    try {
      localStorage.setItem(KEY, JSON.stringify(own));
    } catch (e) {}
  };
  const counts = { reads: 0, draws: 0 };

  function momentumPrefs() {
    let p = null;
    try {
      p = JSON.parse(localStorage.getItem("curiosities-momentum-v1"));
    } catch (e) {}
    p = p && typeof p === "object" ? p : {};
    return {
      source: typeof p.source === "string" ? p.source : "",
      spb: Number(p.secondsPerPanel) > 0 ? Number(p.secondsPerPanel) : 3,
      limit: Number(p.limit) > 0 ? Number(p.limit) : null,
      compare: Array.isArray(p.compare) && p.compare.length ? p.compare : ["pulp-fiction"],
      measured: Array.isArray(p.measured) ? p.measured : [],
    };
  }
  function limitOf(mp) {
    if (mp.limit) return mp.limit;
    const list = R().DEFAULT_FILMS.concat(mp.measured).filter((x) => x && mp.compare.includes(x.id));
    return R().limitFor(R().average(list));
  }
  const fromRun = (r, extra) => {
    const run = r && r.stats && r.stats.currentRun;
    const seg = r && r.segments && r.segments[r.segments.length - 1];
    return Object.assign({ family: run ? run.family : null, seconds: run ? run.dur : null, limit: r ? r.limit : null, label: seg && seg.family === (run && run.family) ? (M().plain ? M().plain(seg.label) : seg.label) : "" }, extra);
  };
  function readEngine(opts) {
    const beats = ME() && ME().available() ? ME().flatBeats() : [];
    if (!beats.length) return null;
    const hasRow = SC() && typeof SC().row === "function";
    const row = hasRow ? Math.max(0, Math.min(beats.length - 1, SC().row() | 0)) : beats.length - 1;
    const r = A().read(beats.slice(0, row + 1), opts);
    return fromRun(r, { film: "My film", moment: hasRow ? row + 1 : 0, n: beats.length, where: hasRow ? "now" : "end" });
  }
  function readBoard(opts) {
    const B = root.CuriosityBoard;
    const panels = B && typeof B.panels === "function" ? B.panels() || [] : [];
    if (!panels.length) return null;
    return fromRun(A().read(panels.map((v) => ({ values: v })), opts), { film: "My film's panels", where: "end" });
  }
  function filmName(id) {
    const ctx = UI() && UI().context ? UI().context() : null;
    const s = ctx ? ctx.sources().find((x) => x.id === id) : null;
    return s ? String(s.label).replace(/\s*\(.*\)$/, "") : "This film";
  }
  /* What the pill reads: the input for say(). */
  function read() {
    if (!A() || !M() || !R()) return null;
    counts.reads++;
    const mp = momentumPrefs();
    const limit = limitOf(mp);
    const opts = { secondsPerBeat: mp.spb, limit };
    const kind = pick(mp.source);
    if (kind === "live") {
      const P = PF();
      if (P && P.running && P.running()) {
        const s = P.state();
        return { family: s.family, seconds: s.family ? s.seconds : null, limit: s.limit || limit, label: s.label ? (M().plain ? M().plain(s.label) : s.label) : "", film: "My film", where: "live" };
      }
      return readBoard(opts) || readEngine(opts) || { limit, film: "My film" };
    }
    if (kind === "board") return readBoard(opts) || { limit, film: "My film's panels" };
    if (kind === "film") {
      const ctx = UI() && UI().context ? UI().context() : null;
      if (ctx) {
        try {
          return fromRun(ctx.readSource(mp.source), { limit, film: filmName(mp.source), where: "end" });
        } catch (e) {}
      }
    }
    return readEngine(opts) || { limit, film: "My film" };
  }

  /* ---------- where it would repeat itself ---------- */
  const screenOpen = () => document.documentElement.classList.contains("sc-open") || !!(SC() && SC().isOpen && SC().isOpen());
  const momentumDlg = () => document.querySelector("dialog.mo-dlg");
  const windowOpen = () => {
    const d = momentumDlg();
    return !!(d && (d.open || d.hasAttribute("open")));
  };

  let el = null;
  function build() {
    if (el || !document.body) return el;
    el = document.createElement("div");
    el.className = "mo-baro";
    el.hidden = true;
    el.innerHTML = `<button type="button" class="mo-baro-open" data-baro="open"></button><button type="button" class="mo-baro-x" data-baro="hide" aria-label="Hide the attention pill" title="Hide the attention pill. The Momentum window can show it again.">×</button>`;
    el.addEventListener("click", (e) => {
      const b = e.target.closest("[data-baro]");
      if (!b) return;
      if (b.dataset.baro === "hide") hide();
      else if (UI()) UI().open("attention");
    });
    document.body.appendChild(el);
    return el;
  }

  let lastHtml = "";
  let lastDraw = 0;
  let timer = null;
  function draw() {
    timer = null;
    lastDraw = Date.now();
    hookAll();
    if (!build()) return;
    const show = visible({ hidden: own.hidden, screenOpen: screenOpen(), windowOpen: windowOpen() });
    el.hidden = !show;
    syncWindowLine();
    if (!show) return;
    let p;
    try {
      p = say(read() || {}, M());
    } catch (e) {
      p = null;
    }
    if (!p) return void (el.hidden = true);
    const sw = p.empty ? `<i class="mo-baro-sw mo-baro-none" aria-hidden="true">?</i>` : `<i class="mo-baro-sw" style="background:${p.color};color:${p.ink}" aria-hidden="true">${esc(p.letter)}</i>`;
    const html = `${sw}<span class="mo-baro-txt"><span class="mo-baro-fam">${esc(p.empty ? "Attention" : p.famLabel)}</span><span class="mo-baro-held">${esc(p.short)}</span></span>${
      p.empty ? "" : `<span class="mo-baro-bar ${p.status.cls}" aria-hidden="true"><span style="width:${p.pct}%"></span></span><span class="mo-baro-st ${p.status.cls}">${p.status.icon} ${esc(p.status.words)}</span>`
    }`;
    const btn = el.querySelector(".mo-baro-open");
    if (html !== lastHtml) {
      btn.innerHTML = html;
      lastHtml = html;
      counts.draws++;
    }
    btn.title = p.title;
    btn.setAttribute("aria-label", p.title);
    el.dataset.status = p.status.key;
  }
  /* At most one redraw every MS milliseconds, however often the hooks fire. */
  function schedule() {
    if (timer) return;
    timer = setTimeout(draw, Math.max(0, MS - (Date.now() - lastDraw)));
  }

  /* ---------- the line in the Momentum window while the pill is hidden ---------- */
  function syncWindowLine() {
    const d = momentumDlg();
    if (!d) return;
    const inner = d.querySelector(".mo-in");
    const line = d.querySelector(".mo-baro-line");
    if (!own.hidden || !inner) {
      if (line) line.remove();
      return;
    }
    if (line) return;
    const p = document.createElement("p");
    p.className = "mo-baro-line";
    p.innerHTML = `The attention pill is hidden. It shows on every page what holds attention now. <button type="button" data-baro-show>Show it again</button>`;
    p.querySelector("button").addEventListener("click", () => show());
    const lede = inner.querySelector(".mo-lede");
    if (lede && lede.nextSibling) inner.insertBefore(p, lede.nextSibling);
    else inner.appendChild(p);
  }

  function hide() {
    own.hidden = true;
    saveOwn();
    draw();
  }
  function show() {
    own.hidden = false;
    saveOwn();
    lastHtml = "";
    draw();
  }

  /* ---------- hooks ---------- */
  const hooked = {};
  function hookOne(name, get, wire) {
    if (hooked[name]) return;
    const x = get();
    if (!x || typeof x.on !== "function") return;
    hooked[name] = true;
    try {
      wire(x);
    } catch (e) {}
  }
  function hookAll() {
    hookOne("engine", () => root.CurioEngine, (x) => x.on(schedule));
    hookOne("board", () => root.CuriosityBoard, (x) => x.on(schedule));
    hookOne("auto", () => root.CurioAuto, (x) => x.on(schedule));
    hookOne("perform", () => root.CurioPerform, (x) => x.on(schedule));
    hookOne("screen", () => root.CurioScreen, (x) => x.on(schedule));
    if (!hooked.dlg) {
      const d = momentumDlg();
      if (d) {
        hooked.dlg = true;
        /* The window opening or closing, and each redraw of it (it rewrites its children). */
        new MutationObserver(schedule).observe(d, { attributes: true, attributeFilter: ["open"], childList: true });
        d.addEventListener("close", schedule);
      }
    }
  }
  function start() {
    build();
    hookAll();
    /* The Screen opening or closing sets a class on <html>; the Momentum window is added to <body> the first time. */
    new MutationObserver(schedule).observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    new MutationObserver(() => !hooked.dlg && momentumDlg() && schedule()).observe(document.body, { childList: true });
    root.addEventListener("load", schedule);
    root.addEventListener("storage", (e) => (e.key === KEY || e.key === "curiosities-momentum-v1") && schedule());
    schedule();
  }

  Object.assign(api, { read, draw, hide, show, hidden: () => own.hidden, stats: () => Object.assign({}, counts) });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
