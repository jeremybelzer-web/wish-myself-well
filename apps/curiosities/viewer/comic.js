/* The comic strip, round 6 (Jeremy's notes, 2026-10-04 20:16Z).

   - A playhead on the storyboard strip: a line with a ▼ on a thin ruler above the panels, moving with the
     film. Drag along the ruler (or the ▼) to scrub; click anywhere in a panel to jump to that moment in it.
   - Sound while scrubbing and playing: every syllable of a speech balloon gives a little voice blip (each
     character has their own pitch) at the rate of speech it is set to, and falling rain hisses. Crossing from
     one panel to the next makes no sound (Jeremy 2026-10-06: the playhead already shows it). 🔊 Sound in the
     strip turns it off.
   - "Read as a comic" gets a Layout choice: Simple grid, Modern comic, or Zine.
     Modern comic follows how comic artists pace a page: wide establishing panels take a whole tier, the big
     moments become large splash panels, inserts of small things are small, close-ups are narrow, views from
     high above or far below are tall, short panels are small (smaller panels read faster), and tilted or
     fisheye shots get slanted frames. Panels still read in order, left to right, tier by tier.
     Zine is photocopied cut-outs: full-bleed pictures without borders, each a little turned, on paper.
   Uses CurioViewer.onDraw, onPlay, time, starts, select, render (viewer/viewer.js) and CurioSpeech (speech.js). */
(function () {
  "use strict";
  if (window.CurioComic) return;
  const V = () => window.CurioViewer;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const LAYOUT_KEY = "curiosities-viewer-comiclayout-v1";
  const SOUND_KEY = "curiosities-viewer-sound-v1";
  let layout = "simple";
  let sound = true;
  try {
    layout = localStorage.getItem(LAYOUT_KEY) || "simple";
    sound = localStorage.getItem(SOUND_KEY) !== "off";
  } catch (e) {}

  const rootEl = () => document.querySelector(".cv-root.cv-viewer");
  const film = () => V().live().film;

  /* ---------- the playhead and the ruler ---------- */
  let line = null;
  let ruler = null;
  let ctl = null;
  function ensure() {
    const root = rootEl();
    if (!root) return false;
    const strip = root.querySelector(".cv-strip");
    const cards = root.querySelector(".cv-cards");
    if (!strip || !cards) return false;
    if (!ruler || !ruler.isConnected) {
      ruler = document.createElement("canvas");
      ruler.className = "cvc-ruler";
      ruler.setAttribute("aria-label", "Where in the film: drag to scrub, click to jump");
      strip.insertBefore(ruler, cards);
    }
    if (!line || !line.isConnected) {
      line = document.createElement("div");
      line.className = "cvc-line";
      line.innerHTML = "<b>▼</b>";
      strip.appendChild(line);
      cards.addEventListener("scroll", () => place(), { passive: true });
    }
    const head = root.querySelector(".cv-strip-head");
    if (head && (!ctl || !ctl.isConnected)) {
      ctl = document.createElement("span");
      ctl.className = "cvc-ctl";
      head.insertBefore(ctl, head.querySelector('[data-act="addpanel"]'));
    }
    if (ctl) {
      const want = `<label class="cvc-lay" title="How Read as a comic lays out the panels">Layout <select data-cmx="layout"><option value="simple"${layout === "simple" ? " selected" : ""}>Simple grid</option><option value="modern"${layout === "modern" ? " selected" : ""}>Modern comic</option><option value="zine"${layout === "zine" ? " selected" : ""}>Zine</option></select></label><button type="button" data-cmx="sound" class="${sound ? "on" : ""}" title="Hear the voices, the rain and the page turns while scrubbing and playing">${sound ? "🔊 Sound" : "🔇 Sound off"}</button>`;
      if (ctl.dataset.html !== want) {
        ctl.innerHTML = want;
        ctl.dataset.html = want;
      }
    }
    return true;
  }
  /* where moment t sits in the strip: the card's box and how far into it */
  function cardSpot(t) {
    const root = rootEl();
    const s = V().starts();
    const P = film().panels;
    let i = 0;
    while (i < P.length - 1 && t >= s[i + 1]) i++;
    const u = clamp((t - s[i]) / P[i].sec, 0, 1);
    const el = root.querySelector(`.cv-card[data-i="${i}"]`);
    return { i, u, el };
  }
  function place() {
    if (!ensure()) return;
    const root = rootEl();
    const strip = root.querySelector(".cv-strip");
    const cards = root.querySelector(".cv-cards");
    const comic = root.classList.contains("cv-comic");
    ruler.hidden = comic;
    const sr = strip.getBoundingClientRect();
    const cr = cards.getBoundingClientRect();
    const { u, el } = cardSpot(V().time());
    if (!el) return (line.hidden = true);
    const r = el.getBoundingClientRect();
    const x = r.left + u * r.width;
    /* hidden when its panel is scrolled out of sight */
    const seen = x >= cr.left - 1 && x <= cr.right + 1 && r.bottom > cr.top && r.top < cr.bottom;
    line.hidden = !seen;
    if (seen) {
      const top = comic ? r.top : ruler.getBoundingClientRect().top;
      const bot = comic ? r.bottom : Math.min(cr.bottom, r.bottom);
      Object.assign(line.style, { left: x - sr.left + strip.scrollLeft + "px", top: top - sr.top + strip.scrollTop + "px", height: Math.max(10, bot - top) + "px" });
    }
    if (!comic) drawRuler();
  }
  function drawRuler() {
    const root = rootEl();
    const cards = root.querySelector(".cv-cards");
    const cr = cards.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = Math.max(50, Math.round(cr.width));
    const H = 16;
    if (ruler.width !== W * dpr) {
      ruler.width = W * dpr;
      ruler.height = H * dpr;
      ruler.style.width = W + "px";
      ruler.style.height = H + "px";
    }
    const g = ruler.getContext("2d");
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, W, H);
    const P = film().panels;
    const cur = V().panel();
    root.querySelectorAll(".cv-card").forEach((el) => {
      const i = +el.dataset.i;
      const r = el.getBoundingClientRect();
      const x0 = r.left - cr.left;
      const w = r.width;
      if (x0 > W || x0 + w < 0) return;
      g.fillStyle = i === cur ? "#22d3ee33" : "#ffffff10";
      g.fillRect(x0, 3, w, H - 6);
      /* a tick every half second, a longer one at each whole second */
      const sec = P[i] ? P[i].sec : 1;
      for (let k = 0; k <= sec * 2 + 1e-6; k++) {
        const x = x0 + (k / (sec * 2)) * w;
        g.fillStyle = k % 2 ? "#6b6b74" : "#9b9ba3";
        g.fillRect(Math.round(x), k % 2 ? 9 : 5, 1, k % 2 ? 4 : 8);
      }
      g.fillStyle = "#c9c9d1";
      g.font = "10px system-ui, sans-serif";
      g.fillText(String(i + 1), x0 + 4, 12);
    });
  }
  /* the moment under a screen x on the strip (ruler or a card) */
  function timeAtX(clientX, clientY, onCard) {
    const root = rootEl();
    let best = null;
    root.querySelectorAll(".cv-card").forEach((el) => {
      const r = el.getBoundingClientRect();
      const inX = clientX >= r.left && clientX <= r.right;
      const inY = onCard ? clientY >= r.top && clientY <= r.bottom : true;
      if (inX && inY) best = { el, r };
    });
    if (!best) return null;
    const i = +best.el.dataset.i;
    const u = clamp((clientX - best.r.left) / best.r.width, 0, 0.999);
    return { i, t: V().starts()[i] + u * film().panels[i].sec };
  }
  function jumpTo(hit) {
    if (!hit) return;
    const v = V();
    if (v.panel() !== hit.i) v.select(hit.i);
    v.time(hit.t);
    place();
  }
  let scrub = null;
  function onDown(e) {
    const t = e.target;
    if (!t.closest) return;
    wake();
    if (t.closest(".cv-root .cv-scrub")) held = true;
    if (t.closest(".cvc-ruler") || t.closest(".cvc-line")) {
      e.preventDefault();
      if (V().playing()) V().play(false);
      scrub = { id: e.pointerId };
      try {
        (t.closest(".cvc-ruler") || t.closest(".cvc-line")).setPointerCapture(e.pointerId);
      } catch (err) {}
      jumpTo(timeAtX(e.clientX, e.clientY, false));
    }
  }
  function onMove(e) {
    if (!scrub) return;
    const root = rootEl();
    const cards = root.querySelector(".cv-cards");
    const cr = cards.getBoundingClientRect();
    /* past the edge: scroll the strip along */
    if (e.clientX < cr.left + 20) cards.scrollLeft -= 18;
    if (e.clientX > cr.right - 20) cards.scrollLeft += 18;
    jumpTo(timeAtX(clamp(e.clientX, cr.left + 1, cr.right - 1), e.clientY, false));
  }
  function onUp() {
    scrub = null;
    held = false;
    if (ac && rain) rain.gain.setTargetAtTime(0, ac.currentTime, 0.03);
  }
  /* a click inside a panel jumps to that moment in it (the Viewer has already picked the panel) */
  function onClick(e) {
    const c = e.target.closest && e.target.closest(".cv-card");
    if (c && e.detail === 1) jumpTo(timeAtX(e.clientX, e.clientY, true));
    const b = e.target.closest && e.target.closest('[data-cmx="sound"]');
    if (b) {
      sound = !sound;
      try {
        localStorage.setItem(SOUND_KEY, sound ? "on" : "off");
      } catch (err) {}
      ensure();
    }
  }
  function onChange(e) {
    const el = e.target;
    if (!el.dataset || el.dataset.cmx !== "layout") return;
    layout = ["modern", "zine"].includes(el.value) ? el.value : "simple";
    try {
      localStorage.setItem(LAYOUT_KEY, layout);
    } catch (err) {}
    ensure();
    lay();
  }

  /* ---------- sound ---------- */
  let ac = null;
  let rain = null;
  let lastT = null;
  let heard = 0;
  function wake() {
    if (ac || !sound) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try {
      ac = new AC();
      const n = ac.sampleRate;
      const buf = ac.createBuffer(1, n, n);
      const d = buf.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
      const src = ac.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      const f = ac.createBiquadFilter();
      f.type = "bandpass";
      f.frequency.value = 2500;
      f.Q.value = 0.6;
      const g = ac.createGain();
      g.gain.value = 0;
      src.connect(f).connect(g).connect(ac.destination);
      src.start();
      rain = g;
    } catch (e) {
      ac = null;
    }
  }
  const pitchOf = (who) => {
    let h = 0;
    for (const c of String(who || "x")) h = (h * 31 + c.charCodeAt(0)) % 997;
    return 170 + (h % 160);
  };
  /* every sound still to come, so stopping can silence them at once */
  const live = new Set();
  function blip(freq, when, vol, type, back) {
    if (!ac) return;
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = type || "triangle";
    const f = freq * (0.92 + Math.random() * 0.16);
    g.gain.setValueAtTime(0, when);
    if (back) {
      /* played backwards: the blip swells and cuts off, and its pitch slides up instead of down */
      o.frequency.setValueAtTime(f * 0.94, when);
      o.frequency.linearRampToValueAtTime(f, when + 0.07);
      g.gain.linearRampToValueAtTime(vol * 0.15, when + 0.03);
      g.gain.exponentialRampToValueAtTime(vol, when + 0.07);
      g.gain.linearRampToValueAtTime(0, when + 0.078);
    } else {
      o.frequency.setValueAtTime(f, when);
      o.frequency.linearRampToValueAtTime(f * 0.94, when + 0.07);
      g.gain.linearRampToValueAtTime(vol, when + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0008, when + 0.07);
    }
    o.connect(g).connect(ac.destination);
    o.start(when);
    o.stop(when + 0.09);
    live.add(o);
    o.onended = () => live.delete(o);
  }
  /* Stop (the space bar or ❚❚): every sound stops now, nothing scheduled is left to play */
  function hush() {
    if (!ac) return;
    live.forEach((o) => {
      try {
        o.stop();
      } catch (e) {}
    });
    live.clear();
    if (rain) rain.gain.cancelScheduledValues(ac.currentTime), rain.gain.setValueAtTime(0, ac.currentTime);
  }
  /* the syllables of a panel's balloons, as times into the panel */
  function syllableTimes(p) {
    const S = window.CurioSpeech;
    if (!S) return [];
    const out = [];
    let start = 0;
    p.words.forEach((w) => {
      const n = S.syllables(w.text);
      const rate = +w.rate > 0 ? +w.rate : S.NORMAL;
      for (let j = 0; j < n; j++) out.push({ t: start + j / rate, who: w.who });
      start += n / rate;
    });
    return out;
  }

  /* Scrubbing (Jeremy 2026-10-06): holding the playhead (the ▼ on the strip's ruler, or the slider under the
     picture) and moving it plays the sound at the speed of the hand: dragged right it plays forwards, as fast
     as the drag; dragged left it plays backwards. The picture already follows the playhead, so movement runs
     backwards too. Sound only comes from playing or from a drag, never from a jump (a click, or Stop going
     back to where Play was pressed). */
  let held = false;
  let lastWall = 0;
  let still = 0;
  const scrubbed = { dir: 0, rate: 0, blips: [] };
  function holding() {
    return held || !!scrub;
  }
  function listen(T) {
    const prev = lastT;
    lastT = T;
    const wall = performance.now();
    const dWall = clamp((wall - lastWall) / 1000, 0.008, 0.25);
    lastWall = wall;
    const dT = prev == null ? 0 : T - prev;
    const moving = Math.abs(dT) > 1e-4;
    const playing = V().playing();
    const drag = !playing && holding();
    const P = film().panels;
    const s = V().starts();
    const { i } = cardSpot(T);
    const loud = sound && ac && moving && (playing || drag);
    if (rain) rain.gain.setTargetAtTime(loud && P[i] && P[i].rain === "fall" ? 0.035 * (drag ? clamp(Math.sqrt(Math.abs(dT) / dWall), 0.4, 1.6) : 1) : 0, ac.currentTime, 0.03);
    if (drag && rain) {
      /* the hand stopped but still holds the playhead: the hiss stops too */
      clearTimeout(still);
      still = setTimeout(() => ac && rain.gain.setTargetAtTime(0, ac.currentTime, 0.03), 140);
    }
    if (!loud || (playing && Math.abs(dT) > 1.5)) return;
    const back = dT < 0;
    const rate = Math.abs(dT) / dWall;
    if (drag) Object.assign(scrubbed, { dir: back ? -1 : 1, rate, blips: [] });
    /* the pitch rises with the speed, like a tape pulled faster */
    const tape = drag ? clamp(Math.pow(rate, 0.35), 0.6, 1.8) : 1;
    const a = Math.min(prev, T);
    const b = Math.max(prev, T);
    const now = ac.currentTime;
    const hits = [];
    for (let k = 0; k < P.length; k++) {
      if (s[k] > b || s[k] + P[k].sec < a) continue;
      syllableTimes(P[k]).forEach((q) => {
        const at = s[k] + q.t;
        if (at > a && at <= b) hits.push({ at, who: q.who });
      });
    }
    /* in the order the playhead crosses them, each when the hand gets there */
    hits.sort((x, y) => (back ? y.at - x.at : x.at - y.at));
    hits.slice(0, 12).forEach((q) => {
      const when = now + 0.005 + (Math.abs(q.at - prev) / Math.abs(dT)) * dWall;
      blip(pitchOf(q.who) * tape, when, 0.09, "triangle", back);
      if (drag) scrubbed.blips.push(q.at);
      heard++;
    });
    if (drag) grains(prev, T, dWall);
  }

  /* Your own videos in a Viewer window: their real sound, scrubbed. The sound track is read once per video
     (kept forwards and backwards), and each move of the hand plays the stretch it crossed, backwards when
     dragged left, sped up or slowed down to the hand's speed. */
  const tracks = new Map();
  function track(src) {
    if (!tracks.has(src)) {
      tracks.set(src, null);
      fetch(src)
        .then((r) => r.arrayBuffer())
        .then((data) => new Promise((ok, no) => ac.decodeAudioData(data, ok, no)))
        .then((fwd) => {
          if (fwd.duration > 20 * 60) return;
          const rev = ac.createBuffer(fwd.numberOfChannels, fwd.length, fwd.sampleRate);
          for (let c = 0; c < fwd.numberOfChannels; c++) rev.getChannelData(c).set(fwd.getChannelData(c).slice().reverse());
          tracks.set(src, { fwd, rev });
        })
        .catch(() => {});
    }
    return tracks.get(src);
  }
  function grains(prev, T, dWall) {
    const root = rootEl();
    if (!root) return;
    root.querySelectorAll("video").forEach((v) => {
      if (v.hidden || !v.dataset.src) return;
      const t = track(v.dataset.src);
      if (!t) return;
      const d = t.fwd.duration;
      const p0 = prev % d;
      const p1 = T % d;
      const back = T < prev;
      if (back ? p1 > p0 : p1 < p0) return; /* wrapped round the end of the video */
      const len = Math.abs(p1 - p0);
      if (len < 0.002) return;
      const src = ac.createBufferSource();
      src.buffer = back ? t.rev : t.fwd;
      src.playbackRate.value = clamp(len / dWall, 0.0625, 8);
      const g = ac.createGain();
      const now = ac.currentTime;
      const out = len / src.playbackRate.value;
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(0.9, now + Math.min(0.006, out / 3));
      g.gain.setValueAtTime(0.9, now + Math.max(0, out - 0.006));
      g.gain.linearRampToValueAtTime(0, now + out);
      src.connect(g).connect(ac.destination);
      src.start(now, back ? d - p0 : p0, len);
      live.add(src);
      src.onended = () => live.delete(src);
    });
  }

  /* ---------- Read as a comic: modern and zine layouts ---------- */
  /* what kind of frame a panel wants, from its camera and its story values */
  function frameFor(p, i) {
    const c = p.cam || {};
    const v = p.v || {};
    const shot = +c.shot || 2;
    const big =
      /payoff|lands/.test(v.comicBeat || "") ||
      /big/.test(v.plotProgress || "") ||
      (+v.emotionIntensity || 0) >= 5 ||
      (+v.tensionCurve || 0) >= 5;
    const slant = Math.abs(+c.tilt || 0) >= 10 || (+c.fish || 0) >= 0.3;
    const tall = Math.abs(+c.height || 0) >= 30 || (+c.height || 0) <= -8;
    let f;
    if (big) f = { kind: "splash", w: 8, h: 5 };
    else if (shot >= 6) f = { kind: "establishing", w: 12, h: 3 };
    else if (shot <= 0.35) f = { kind: "inset", w: 3, h: 2 };
    else if (tall) f = { kind: "tall", w: 3, h: 5 };
    else if (shot <= 0.7) f = { kind: "close", w: 4, h: 3 };
    else f = { kind: "medium", w: p.sec <= 1.5 ? 4 : 6, h: 3 };
    if (i === 0 && shot >= 4) f = { kind: "establishing", w: 12, h: 4 };
    f.slant = slant;
    return f;
  }
  /* tiers, read left to right: a panel that doesn't fit starts a new tier and the last one stretches */
  function tiers(P) {
    const rows = [];
    let row = [];
    let used = 0;
    P.forEach((p, i) => {
      const f = frameFor(p, i);
      if (used + f.w > 12 && row.length) {
        rows.push(row);
        row = [];
        used = 0;
      }
      row.push({ i, f });
      used += f.w;
    });
    if (row.length) rows.push(row);
    rows.forEach((r) => {
      const w = r.reduce((a, x) => a + x.f.w, 0);
      /* stretch to fill the tier: the biggest frame takes what is left */
      if (w < 12) r.slice().sort((a, b) => b.f.w - a.f.w)[0].f.w += 12 - w;
      const h = Math.max(...r.map((x) => x.f.h));
      r.forEach((x) => (x.h = h));
    });
    return rows;
  }
  let laidOut = "";
  function lay() {
    const root = rootEl();
    if (!root) return;
    const comic = root.classList.contains("cv-comic");
    const mode = comic ? layout : "simple";
    root.classList.toggle("cvc-modern", mode === "modern");
    root.classList.toggle("cvc-zine", mode === "zine");
    const cards = root.querySelector(".cv-cards");
    const P = film().panels;
    const s = V().starts();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const key = mode + "|" + cards.clientWidth + "|" + P.map((p) => JSON.stringify([p.cam, p.v, p.sec])).join(",");
    if (key === laidOut) return;
    laidOut = key;
    const els = [...root.querySelectorAll(".cv-card")];
    if (mode === "simple") {
      els.forEach((el) => {
        el.style.gridColumn = el.style.height = el.style.transform = el.style.clipPath = "";
        el.removeAttribute("data-frame");
        const cv = el.querySelector("canvas");
        if (cv.width !== 480 || cv.height !== 270) {
          cv.width = 480;
          cv.height = 270;
          V().render(cv, s[+el.dataset.i] + 1e-6);
        }
      });
      return;
    }
    const unit = Math.max(30, (cards.clientWidth - 11 * 12) / 12);
    const rows = tiers(P);
    rows.forEach((r) =>
      r.forEach(({ i, f, h }) => {
        const el = els[i];
        if (!el) return;
        el.dataset.frame = f.kind;
        el.style.gridColumn = `span ${f.w}`;
        el.style.height = Math.round(h * unit * 0.62) + "px";
        el.style.clipPath = mode === "modern" && f.slant ? (i % 2 ? "polygon(0 4%, 100% 0, 100% 96%, 0 100%)" : "polygon(0 0, 100% 4%, 100% 100%, 0 96%)") : "";
        el.style.transform = mode === "zine" ? `rotate(${(((i * 37) % 7) - 3) * 0.5}deg)` : "";
        const cv = el.querySelector("canvas");
        const box = el.getBoundingClientRect();
        const W = Math.max(120, Math.round(box.width * dpr));
        const H = Math.max(80, Math.round(box.height * dpr));
        if (cv.width !== W || cv.height !== H) {
          cv.width = W;
          cv.height = H;
          V().render(cv, s[i] + 1e-6);
        }
      }),
    );
  }

  const CSS = `
.cv-strip { position: relative; }
.cvc-ruler { display: block; cursor: ew-resize; touch-action: none; }
.cvc-line { position: absolute; width: 2px; background: #ff9f43; pointer-events: none; z-index: 3; }
.cvc-line b { position: absolute; top: -3px; left: -6px; color: #ff9f43; font-size: 12px; line-height: 1; pointer-events: auto; cursor: ew-resize; }
.cvc-ctl { display: inline-flex; gap: 6px; align-items: center; }
.cvc-lay { display: none; font-size: 12px; gap: 4px; align-items: center; }
.cv-root.cv-comic .cvc-lay { display: inline-flex; }
.cv-root .cvc-ctl button.on { color: var(--c-accent); }
.cv-root.cv-comic .cvc-lay select { background: #d8ceb8; color: #111; border: 0; border-radius: 6px; padding: 4px 6px; }
.cv-root.cv-comic .cvc-ctl button.on { color: #0e5f6e; }
.cv-root.cv-comic.cvc-modern .cv-cards, .cv-root.cv-comic.cvc-zine .cv-cards { grid-template-columns: repeat(12, minmax(0, 1fr)); gap: 12px; }
.cv-root.cvc-modern .cv-card, .cv-root.cvc-zine .cv-card { grid-template-rows: minmax(0, 1fr); overflow: hidden; }
.cv-root.cvc-modern .cv-card canvas, .cv-root.cvc-zine .cv-card canvas { aspect-ratio: auto; width: 100%; height: 100%; border-bottom: 0; }
.cv-root.cvc-modern .cv-card .cv-cap, .cv-root.cvc-zine .cv-card .cv-cap { display: none; }
.cv-root.cvc-modern .cv-addcard, .cv-root.cvc-zine .cv-addcard { grid-column: span 12; min-height: 60px; }
.cv-root.cvc-modern .cv-card[data-frame="splash"] { border-width: 4px; }
.cv-root.cvc-modern .cv-card[data-frame="inset"] { border-radius: 50% / 18%; }
.cv-root.cv-comic.cvc-zine .cv-strip { background: #f2efe6; background-image: radial-gradient(#0000000d 1px, transparent 1px); background-size: 4px 4px; }
.cv-root.cvc-zine .cv-card { border: 0; box-shadow: 2px 3px 0 #0003; filter: grayscale(0.85) contrast(1.35); border-radius: 0; }
.cv-root.cvc-zine .cv-card .cv-num { background: #fff; color: #111; font-family: "Courier New", monospace; }
`;
  function wire() {
    const v = V();
    if (!v || !v.onDraw || !v.onPlay) return setTimeout(wire, 300);
    const st = document.createElement("style");
    st.textContent = CSS;
    document.head.appendChild(st);
    v.onDraw((T) => {
      place();
      listen(T);
      if (rootEl() && rootEl().classList.contains("cv-comic")) lay();
      else if (laidOut && !laidOut.startsWith("simple")) lay();
    });
    v.onPlay((on) => (on ? wake() : hush()));
    document.addEventListener("pointerdown", onDown, true);
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
    document.addEventListener("pointercancel", onUp);
    document.addEventListener("click", onClick);
    document.addEventListener("change", onChange);
    window.addEventListener("resize", () => {
      laidOut = "";
      place();
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", wire);
  else setTimeout(wire, 0);

  window.CurioComic = { frameFor, tiers, timeAtX, heard: () => heard, scrubbed: () => scrubbed, sounding: () => live.size, hush, layout: () => layout, place };
})();
