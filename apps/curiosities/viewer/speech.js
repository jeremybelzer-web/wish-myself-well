/* Rate of speech for every speech balloon (Jeremy's notes, 2026-10-04 20:16Z).

   In the Words tab each balloon gets a Speed: syllables a second, from a slow drawl to an auctioneer. Set it
   with the slider, or:
   - Tap it: tap the button (or the space bar) once for every syllable while you say the line in your head.
     The time between your first and last tap sets the speed.
   - Say it: say the line out loud into the microphone. The app listens for when your voice starts and stops
     and divides the line's syllables by that time.
   When the film plays, each balloon's words appear at that speed, one balloon after another, the way the
   line would be spoken. Paused, the whole line shows.

   Data: panel.words[k].rate = syllables a second (empty = normal talking, 4.5).
   API: window.CurioSpeech { syllables(text), seconds(word, rate), reveal(panel, k, secondsIntoPanel),
   row(word, k), NORMAL }. */
(function () {
  "use strict";
  if (window.CurioSpeech) return;
  const V = () => window.CurioViewer;
  const NORMAL = 4.5;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const esc = (v) =>
    String(v == null ? "" : v)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  /* syllables in one English word, the usual rule of thumb: groups of vowels, less a silent e */
  function wordSyl(w) {
    w = String(w).toLowerCase().replace(/[^a-z']/g, "");
    if (!w) return /\d/.test(w) ? 1 : 0;
    if (w.length <= 3) return 1;
    w = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "").replace(/^y/, "");
    const m = w.match(/[aeiouy]{1,2}/g);
    return Math.max(1, m ? m.length : 1);
  }
  function syllables(text) {
    return String(text || "")
      .split(/\s+/)
      .filter(Boolean)
      .reduce((n, w) => n + (/\d/.test(w) && !/[a-z]/i.test(w) ? w.replace(/\D/g, "").length : wordSyl(w)), 0);
  }
  const rateOf = (w) => (w && +w.rate > 0 ? +w.rate : NORMAL);
  function seconds(w, rate) {
    return syllables(w.text) / (rate || rateOf(w));
  }
  /* the words of balloon k showing at t seconds into the panel: balloons are spoken one after another */
  function reveal(p, k, t) {
    let start = 0;
    for (let j = 0; j < k; j++) start += seconds(p.words[j]);
    const w = p.words[k];
    const said = (t - start) * rateOf(w);
    if (said <= 0) return "";
    const words = String(w.text).split(/\s+/).filter(Boolean);
    let n = 0;
    let out = 0;
    for (const x of words) {
      n += wordSyl(x);
      if (n - wordSyl(x) * 0.5 > said) break;
      out++;
    }
    return words.slice(0, out).join(" ");
  }
  function speedWords(r) {
    if (r < 2.5) return "a slow drawl";
    if (r < 3.8) return "slow and careful";
    if (r < 5.3) return "normal talking";
    if (r < 6.8) return "quick";
    if (r < 8.3) return "fast talker";
    return "auctioneer";
  }
  function row(w, k) {
    const r = rateOf(w);
    const syl = syllables(w.text);
    const t = syl / r;
    const p = V().live().panel;
    let start = 0;
    for (let j = 0; j < k; j++) start += seconds(p.words[j]);
    const over = start + t > p.sec + 0.05;
    const busy = tap && tap.k === k ? "tap" : say && say.k === k ? "say" : "";
    return `<div class="cvs-row" data-spw="${k}">
      <label class="cv-field"><span><b>Speed</b><em>${w.rate ? (Math.round(r * 10) / 10) + " syllables a second · " + speedWords(r) : "normal talking (not set)"}</em></span><input type="range" data-sp="rate" data-w="${k}" min="1" max="10" step="0.1" value="${r}" /><span class="cv-ends"><span>slow drawl</span><span>auctioneer</span></span></label>
      <div class="cvs-btns">
        ${busy === "tap" ? `<button type="button" class="cvs-tap cv-primary" data-sp="tapbeat" data-w="${k}">Tap ${tap.n ? "(" + tap.n + ")" : "here"} once per syllable</button><button type="button" data-sp="tapdone" data-w="${k}">Done</button>` : `<button type="button" data-sp="tap" data-w="${k}" title="Tap once for every syllable while you say the line in your head">Tap it</button>`}
        ${busy === "say" ? `<button type="button" class="cv-primary" data-sp="saydone" data-w="${k}">● Listening… say the line</button>` : `<button type="button" data-sp="say" data-w="${k}" title="Say the line out loud; the app times your voice">Say it</button>`}
        ${w.rate ? `<button type="button" data-sp="clear" data-w="${k}" title="Back to normal talking">Normal</button>` : ""}
      </div>
      <p class="cvs-note">${syl} syllable${syl === 1 ? "" : "s"}, ${t.toFixed(1)} s at this speed${over ? ` · <b>longer than the panel (${p.sec} s)</b>` : ""}.${msg && msg.k === k ? " " + esc(msg.text) : ""}</p>
    </div>`;
  }

  /* ---------- setting it ---------- */
  let tap = null;
  let say = null;
  let msg = null;
  function setRate(k, r) {
    const p = V().live().panel;
    if (!p.words[k]) return;
    V().edit("speech-rate");
    if (r == null) delete p.words[k].rate;
    else p.words[k].rate = Math.round(clamp(r, 1, 10) * 10) / 10;
    V().changed(false);
  }
  function redraw() {
    const v = V();
    if (v.live().tab === "words") v.showTab("words");
  }
  function tapBeat() {
    if (!tap) return;
    const now = performance.now();
    tap.times.push(now);
    tap.n = tap.times.length;
    clearTimeout(tap.timer);
    tap.timer = setTimeout(tapDone, 1500);
    const b = document.querySelector('[data-sp="tapbeat"]');
    if (b) b.textContent = `Tap (${tap.n}) once per syllable`;
  }
  function tapDone() {
    if (!tap) return;
    const t = tap;
    tap = null;
    clearTimeout(t.timer);
    if (t.times.length >= 3) {
      const span = (t.times[t.times.length - 1] - t.times[0]) / 1000;
      /* n taps cover n-1 gaps; the last syllable takes one more gap */
      const r = t.times.length / (span + span / (t.times.length - 1));
      setRate(t.k, r);
      msg = { k: t.k, text: `${t.times.length} taps → ${(Math.round(r * 10) / 10).toFixed(1)} syllables a second.` };
    } else msg = { k: t.k, text: "Tap at least three times to set the speed." };
    redraw();
  }
  async function sayStart(k) {
    msg = null;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      msg = { k, text: "The microphone isn't available here. Use Tap it instead." };
      return redraw();
    }
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (e) {
      msg = { k, text: "The microphone isn't available here (or wasn't allowed). Use Tap it instead." };
      return redraw();
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    const ac = new AC();
    const src = ac.createMediaStreamSource(stream);
    const an = ac.createAnalyser();
    an.fftSize = 1024;
    src.connect(an);
    say = { k, stream, ac, an, t0: performance.now(), floor: 0, nFloor: 0, first: null, last: null };
    redraw();
    const buf = new Float32Array(an.fftSize);
    const tick = () => {
      if (!say) return;
      an.getFloatTimeDomainData(buf);
      let s = 0;
      for (let i = 0; i < buf.length; i++) s += buf[i] * buf[i];
      const rms = Math.sqrt(s / buf.length);
      const el = performance.now() - say.t0;
      /* the first third of a second is the room's own noise; a voice is well above it */
      if (el < 330) {
        say.floor += rms;
        say.nFloor++;
      } else {
        const thr = Math.max(0.015, (say.floor / Math.max(1, say.nFloor)) * 3);
        if (rms > thr) {
          if (say.first == null) say.first = el;
          say.last = el;
        }
        if ((say.last != null && el - say.last > 1100) || el > 12000) return sayDone();
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
  /* also used by tests: finish with a voice heard from `first` to `last` milliseconds */
  function sayDone(first, last) {
    if (!say) return;
    const s = say;
    say = null;
    try {
      s.stream.getTracks().forEach((t) => t.stop());
      s.ac.close();
    } catch (e) {}
    const a = first != null ? first : s.first;
    const b = last != null ? last : s.last;
    const p = V().live().panel;
    const w = p.words[s.k];
    if (a == null || b == null || b - a < 150 || !w) {
      msg = { k: s.k, text: "I didn't hear the line. Try again a little louder, or use Tap it." };
      return redraw();
    }
    const secs = (b - a) / 1000 + 0.15;
    const r = syllables(w.text) / secs;
    setRate(s.k, r);
    msg = { k: s.k, text: `Heard ${secs.toFixed(1)} s of talking → ${(Math.round(clamp(r, 1, 10) * 10) / 10).toFixed(1)} syllables a second.` };
    redraw();
  }

  function onClick(e) {
    const b = e.target.closest && e.target.closest("[data-sp]");
    if (!b || b.tagName === "INPUT") return;
    const k = +b.dataset.w;
    const what = b.dataset.sp;
    if (what === "tap") {
      msg = null;
      tap = { k, times: [], n: 0, timer: 0 };
      redraw();
      const t = document.querySelector('[data-sp="tapbeat"]');
      if (t) t.focus();
      return;
    }
    if (what === "tapbeat") return tapBeat();
    if (what === "tapdone") return tapDone();
    if (what === "say") return sayStart(k);
    if (what === "saydone") return sayDone();
    if (what === "clear") {
      msg = null;
      setRate(k, null);
      return redraw();
    }
  }
  function onInput(e) {
    const el = e.target;
    if (!el.dataset || el.dataset.sp !== "rate") return;
    const k = +el.dataset.w;
    if (e.type === "input") {
      const em = el.closest(".cv-field").querySelector("em");
      if (em) em.textContent = (+el.value).toFixed(1) + " syllables a second · " + speedWords(+el.value);
      return;
    }
    msg = null;
    setRate(k, +el.value);
    redraw();
  }
  function onKey(e) {
    if (!tap || e.key !== " ") return;
    e.preventDefault();
    e.stopPropagation();
    if (!e.repeat) tapBeat();
  }
  const CSS = `
.cvs-row { margin: 4px 0 2px; }
.cvs-btns { display: flex; flex-wrap: wrap; gap: 6px; }
.cv-root .cvs-tap { min-width: 180px; padding: 10px 14px; }
.cvs-note { font-size: 11.5px; color: var(--c-dim); margin: 4px 0 0; }
.cvs-note b { color: var(--c-warm); }
`;
  function wire() {
    const st = document.createElement("style");
    st.textContent = CSS;
    document.head.appendChild(st);
    document.addEventListener("click", onClick);
    document.addEventListener("input", onInput);
    document.addEventListener("change", onInput);
    window.addEventListener("keydown", onKey, true);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", wire);
  else setTimeout(wire, 0);

  window.CurioSpeech = { syllables, seconds, reveal, row, NORMAL, speedWords, _sayDone: sayDone, _sayStartFake: (k) => ((say = { k, stream: { getTracks: () => [] }, ac: { close() {} }, first: null, last: null }), redraw()) };
})();
