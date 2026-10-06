/* demo/player.js: "Show me" demonstrations that drive the app by themselves (Jeremy, 2026-10-06: "actually zoom
   in to the 3D map and slide along the corridor ... click a window and then demonstrate what moving the sliders
   around does and moving the nodes around and bending the lines between the nodes").

   A pointer you can see moves across the page and presses, drags, double-clicks, scrolls and types for real: each
   step sends the same pointer, mouse, wheel and key events a person's hand would, to whatever is under the
   pointer, so the app answers exactly as it does for a person (nothing is faked inside the app). A caption at the
   bottom says what is happening in plain words. Stop (or Esc) ends a demonstration at once.

   window.CurioDemo:
     add(id, { label, about, run(D, opts), ready?() })  register a demonstration (demo/tours.js has the app's own)
     run(id or fn, opts)        play one; resolves { ok, stopped, error }
     stop(), running()          stop the one playing
     speed                      1 is normal; tests play at 20
   Steps a demonstration uses (all awaitable, all stop when Stop is pressed):
     say(text, ms?)  move(target, ms?)  click(target, opts?)  dbl(target)  right(target)  drag(from, to, opts?)
     slide(input, value, ms?)  turn(knob, dy)  wheel(target, deltaY, times?, { alt }?)  type(input, text)  key(name, opts?)
     choose(select, value)  ring(el)  wait(ms)  waitFor(test, ms?)  point(target)
   A target is an element, an { x, y } point on the page, or a function returning either. */
(function (root) {
  "use strict";
  const doc = root.document;
  const CSS = `
.cd-cursor { position: fixed; left: 0; top: 0; width: 26px; height: 26px; z-index: 2147483000; pointer-events: none; transform: translate(-3px, -2px); filter: drop-shadow(0 2px 3px rgba(0,0,0,.45)); }
.cd-cursor svg { width: 26px; height: 26px; display: block; }
.cd-cursor.down svg { transform: scale(.86); transform-origin: 3px 2px; }
.cd-cursor.alt::after { content: "Alt"; position: absolute; left: 22px; top: 20px; font: 600 11px/1 system-ui, sans-serif; background: #ffd23f; color: #1b1b1f; padding: 2px 4px; border-radius: 4px; }
.cd-ripple { position: fixed; z-index: 2147482999; width: 34px; height: 34px; margin: -17px 0 0 -17px; border-radius: 50%; border: 3px solid #ffd23f; pointer-events: none; animation: cd-rip .5s ease-out forwards; }
@keyframes cd-rip { from { transform: scale(.3); opacity: 1; } to { transform: scale(1.4); opacity: 0; } }
.cd-ring { position: fixed; z-index: 2147482998; border: 3px solid #ffd23f; border-radius: 10px; pointer-events: none; box-shadow: 0 0 0 4000px rgba(10,10,14,.18); transition: all .35s ease; }
.cd-cap { position: fixed; left: 50%; bottom: 22px; transform: translateX(-50%); z-index: 2147483001; max-width: min(760px, calc(100vw - 32px)); box-sizing: border-box; padding: 12px 18px 12px 16px; background: #1b1b1f; color: #fffdf6; border: 2px solid #ffd23f; border-radius: 12px; font: 500 17px/1.4 system-ui, -apple-system, "Segoe UI", sans-serif; pointer-events: none; box-shadow: 0 8px 24px rgba(0,0,0,.35); }
.cd-cap.top { bottom: auto; top: 16px; }
.cd-cap small { display: block; font-size: 12px; letter-spacing: .04em; text-transform: uppercase; color: #ffd23f; margin-bottom: 3px; }
.cd-bar { position: fixed; right: 14px; bottom: 22px; z-index: 2147483002; display: flex; gap: 6px; }
.cd-bar button { font: 600 13px/1 system-ui, sans-serif; padding: 8px 12px; border-radius: 8px; border: 2px solid #ffd23f; background: #1b1b1f; color: #fffdf6; cursor: pointer; }
@media (max-width: 700px) { .cd-cap { bottom: 64px; font-size: 15px; } }
@media (prefers-reduced-motion: reduce) { .cd-ripple { animation: none; opacity: 0; } .cd-ring { transition: none; } }`;
  const ARROW = '<svg viewBox="0 0 26 26"><path d="M3 2 L3 21 L8 16.5 L11.5 24 L15 22.5 L11.6 15.2 L18 15.2 Z" fill="#fffdf6" stroke="#1b1b1f" stroke-width="1.8" stroke-linejoin="round"/></svg>';

  const tours = new Map();
  const D = { speed: 1, tours };
  let ui = null; // { cursor, cap, bar, ring }
  let at = { x: 0, y: 0 };
  let pressed = false;
  let alt = false;
  let capture = null; // the element that took the pointer (setPointerCapture), as a real browser would route to it
  let playing = null; // { stopped }
  const STOP = { stop: true };

  /* ---------- the pointer and the caption ---------- */
  function style() {
    if (doc.getElementById("cd-style")) return;
    const s = doc.createElement("style");
    s.id = "cd-style";
    s.textContent = CSS;
    doc.head.appendChild(s);
  }
  function build() {
    style();
    const cursor = doc.createElement("div");
    cursor.className = "cd-cursor cd-ui";
    cursor.innerHTML = ARROW;
    const cap = doc.createElement("div");
    cap.className = "cd-cap cd-ui";
    cap.setAttribute("role", "status");
    cap.setAttribute("aria-live", "polite");
    cap.hidden = true;
    const bar = doc.createElement("div");
    bar.className = "cd-bar cd-ui";
    bar.innerHTML = '<button type="button" data-cd="stop" title="Stop the demonstration (Esc)">■ Stop</button>';
    bar.addEventListener("click", (e) => e.target.closest("[data-cd=stop]") && D.stop());
    doc.body.append(cursor, cap, bar);
    ui = { cursor, cap, bar, ring: null };
    at = { x: root.innerWidth * 0.5, y: root.innerHeight * 0.45 };
    place();
  }
  function teardown() {
    if (!ui) return;
    ui.cursor.remove();
    ui.cap.remove();
    ui.bar.remove();
    ui.ring && ui.ring.remove();
    doc.querySelectorAll(".cd-ripple").forEach((r) => r.remove());
    ui = null;
  }
  function place() {
    if (!ui) return;
    ui.cursor.style.transform = `translate(${at.x - 3}px, ${at.y - 2}px)`;
    ui.cursor.classList.toggle("down", pressed);
    ui.cursor.classList.toggle("alt", alt);
    // the caption moves to the top while the pointer works near the bottom, so it never covers what is shown
    const low = at.y > root.innerHeight - 190;
    if (low !== ui.cap.classList.contains("top")) ui.cap.classList.toggle("top", low);
  }
  function ripple(x, y) {
    if (!ui) return;
    const r = doc.createElement("div");
    r.className = "cd-ripple cd-ui";
    r.style.left = x + "px";
    r.style.top = y + "px";
    doc.body.appendChild(r);
    setTimeout(() => r.remove(), 600);
  }

  /* ---------- time ---------- */
  function check() {
    if (!playing || playing.stopped) throw STOP;
  }
  function wait(ms, floor) {
    check();
    const t = Math.max(floor || 0, (ms || 0) / D.speed);
    return new Promise((res, rej) => {
      const t0 = performance.now();
      const tick = () => {
        if (!playing || playing.stopped) return rej(STOP);
        if (performance.now() - t0 >= t) return res();
        setTimeout(tick, Math.min(50, t));
      };
      tick();
    });
  }
  /* The pause after a press. Never shorter than 0.75 s, even played fast: the app reads two presses on one spot
     within 0.7 s as a double-click, so a quicker next press would remove the node the last one made. */
  const settle = (ms) => wait(ms, 750);
  const frame = () => new Promise((res) => (root.requestAnimationFrame ? root.requestAnimationFrame(() => res()) : setTimeout(res, 16)));
  async function waitFor(test, ms) {
    const t0 = performance.now();
    for (;;) {
      check();
      let v = null;
      try {
        v = test();
      } catch (e) {
        v = null;
      }
      if (v) return v;
      if (performance.now() - t0 > (ms || 6000)) return null;
      await new Promise((res) => setTimeout(res, 40));
    }
  }

  /* ---------- where things are ---------- */
  function visibleRect(el) {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 ? r : null;
  }
  // a point inside el that really lands on el (or something inside it), not on whatever covers part of it
  function hitPoint(el, fx, fy) {
    if (el.scrollIntoView) {
      const r0 = el.getBoundingClientRect();
      if (r0.bottom < 0 || r0.top > root.innerHeight || r0.right < 0 || r0.left > root.innerWidth || r0.top < 0 || r0.bottom > root.innerHeight) el.scrollIntoView({ block: "nearest", inline: "nearest" });
    }
    const r = visibleRect(el);
    if (!r) return null;
    const tries = [[fx == null ? 0.5 : fx, fy == null ? 0.5 : fy], [0.5, 0.5], [0.3, 0.5], [0.7, 0.5], [0.5, 0.3], [0.5, 0.7], [0.2, 0.2], [0.8, 0.8], [0.2, 0.8], [0.8, 0.2]];
    for (const [a, b] of tries) {
      const x = r.left + r.width * a;
      const y = r.top + r.height * b;
      const hit = under(x, y);
      if (hit && (hit === el || el.contains(hit))) return { x, y };
    }
    return { x: r.left + r.width * (fx == null ? 0.5 : fx), y: r.top + r.height * (fy == null ? 0.5 : fy) };
  }
  function pointOf(t, fx, fy) {
    if (typeof t === "function") t = t();
    if (!t) return null;
    if (t.nodeType === 1) return hitPoint(t, fx, fy);
    if (typeof t.x === "number") return { x: t.x, y: t.y };
    return null;
  }
  // what is under a point, looking through the demonstration's own pointer and caption
  function under(x, y) {
    let el = doc.elementFromPoint(x, y);
    if (el && el.closest && el.closest(".cd-ui")) {
      const hide = [...doc.querySelectorAll(".cd-ui")].filter((u) => u.style.visibility !== "hidden");
      hide.forEach((u) => (u.style.visibility = "hidden"));
      el = doc.elementFromPoint(x, y);
      hide.forEach((u) => (u.style.visibility = ""));
    }
    return el;
  }

  /* ---------- real events ---------- */
  function fire(type, x, y, extra) {
    const routed = capture && capture.isConnected && /^(pointermove|pointerup|mousemove|mouseup|pointercancel)$/.test(type);
    const target = routed ? capture : under(x, y) || doc.body;
    const o = Object.assign(
      {
        bubbles: true,
        cancelable: true,
        composed: true,
        view: root,
        clientX: x,
        clientY: y,
        screenX: x + (root.screenX || 0),
        screenY: y + (root.screenY || 0),
        altKey: alt,
        button: 0,
        buttons: pressed ? 1 : 0,
      },
      extra || {}
    );
    let ev;
    if (/^pointer/.test(type) && root.PointerEvent) ev = new PointerEvent(type, Object.assign({ pointerId: 1, pointerType: "mouse", isPrimary: true, width: 1, height: 1, pressure: pressed ? 0.5 : 0 }, o));
    else if (type === "wheel") ev = new WheelEvent(type, o);
    else ev = new MouseEvent(type, o);
    target.dispatchEvent(ev);
    return target;
  }
  /* While a demonstration plays, setPointerCapture for its pointer is kept here (a made-up pointer cannot be
     captured by the browser), and later moves go to that element, as they would for a real one. */
  const P = root.Element && root.Element.prototype;
  const orig = P ? { set: P.setPointerCapture, rel: P.releasePointerCapture, has: P.hasPointerCapture } : null;
  function patch(on) {
    if (!P || !orig) return;
    if (!on) {
      P.setPointerCapture = orig.set;
      P.releasePointerCapture = orig.rel;
      P.hasPointerCapture = orig.has;
      capture = null;
      return;
    }
    P.setPointerCapture = function (id) {
      if (id === 1 && playing) return void (capture = this);
      return orig.set.call(this, id);
    };
    P.releasePointerCapture = function (id) {
      if (id === 1 && playing) return void (capture === this && (capture = null));
      return orig.rel.call(this, id);
    };
    P.hasPointerCapture = function (id) {
      if (id === 1 && playing) return capture === this;
      return orig.has.call(this, id);
    };
  }

  /* ---------- steps ---------- */
  const ease = (k) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
  async function glide(to, ms, onStep) {
    const from = { x: at.x, y: at.y };
    const dist = Math.hypot(to.x - from.x, to.y - from.y);
    const t = Math.max(1, (ms == null ? Math.min(900, 250 + dist * 0.9) : ms) / D.speed);
    const t0 = performance.now();
    for (;;) {
      check();
      await frame();
      const k = Math.min(1, (performance.now() - t0) / t);
      const e = ease(k);
      at = { x: from.x + (to.x - from.x) * e, y: from.y + (to.y - from.y) * e };
      place();
      fire("pointermove", at.x, at.y, { button: -1 });
      fire("mousemove", at.x, at.y);
      onStep && onStep(e);
      if (k >= 1) break;
    }
  }
  async function move(target, ms) {
    const p = pointOf(target);
    if (!p) return false;
    await glide(p, ms);
    return true;
  }
  function focusAt(t) {
    const f = t && t.closest && t.closest('input,select,textarea,button,a[href],[tabindex]:not([tabindex="-1"]),[contenteditable="true"]');
    if (f && f !== doc.activeElement && f.focus) f.focus({ preventScroll: true });
  }
  function down(x, y) {
    pressed = true;
    place();
    const t = fire("pointerdown", x, y);
    fire("mousedown", x, y, { detail: 1 });
    focusAt(t);
    return t;
  }
  function up(x, y, detail) {
    pressed = false;
    place();
    const t = fire("pointerup", x, y);
    fire("mouseup", x, y, { detail: detail || 1 });
    capture = null;
    return t;
  }
  async function click(target, opts) {
    opts = opts || {};
    const p = pointOf(target, opts.fx, opts.fy);
    if (!p) return false;
    await glide(p, opts.ms);
    await wait(120);
    alt = !!opts.alt;
    down(p.x, p.y);
    await wait(70);
    up(p.x, p.y);
    ripple(p.x, p.y);
    fire("click", p.x, p.y, { detail: 1 });
    alt = false;
    place();
    await settle(opts.after == null ? 350 : opts.after);
    return true;
  }
  async function dbl(target, opts) {
    opts = opts || {};
    const p = pointOf(target, opts.fx, opts.fy);
    if (!p) return false;
    await glide(p, opts.ms);
    await wait(150);
    down(p.x, p.y);
    up(p.x, p.y, 1);
    fire("click", p.x, p.y, { detail: 1 });
    ripple(p.x, p.y);
    await wait(90);
    down(p.x, p.y);
    up(p.x, p.y, 2);
    fire("click", p.x, p.y, { detail: 2 });
    fire("dblclick", p.x, p.y, { detail: 2 });
    ripple(p.x, p.y);
    await settle(opts.after == null ? 400 : opts.after);
    return true;
  }
  /* A right-click: the context menu event, as a mouse's right button sends it. */
  async function right(target, opts) {
    opts = opts || {};
    const p = pointOf(target, opts.fx, opts.fy);
    if (!p) return false;
    await glide(p, opts.ms);
    await wait(150);
    fire("pointerdown", p.x, p.y, { button: 2, buttons: 2 });
    fire("mousedown", p.x, p.y, { button: 2, buttons: 2 });
    fire("pointerup", p.x, p.y, { button: 2, buttons: 0 });
    fire("mouseup", p.x, p.y, { button: 2, buttons: 0 });
    fire("contextmenu", p.x, p.y, { button: 2, buttons: 0 });
    ripple(p.x, p.y);
    await settle(opts.after == null ? 450 : opts.after);
    return true;
  }
  /* Press at `from`, move to `to` (a point, or { dx, dy } from where it pressed), let go. opts.alt holds Alt;
     opts.ms is how long the move takes; opts.path(k) can bend the way (returns { x, y } for 0..1). */
  async function drag(from, to, opts) {
    opts = opts || {};
    const a = pointOf(from, opts.fx, opts.fy);
    if (!a) return false;
    await glide(a, opts.reach);
    alt = !!opts.alt;
    place();
    if (alt) key("Alt", { down: true });
    await wait(alt ? 300 : 120);
    down(a.x, a.y);
    await wait(90);
    const b = to && typeof to.dx === "number" ? { x: a.x + to.dx, y: a.y + (to.dy || 0) } : pointOf(to);
    if (opts.path) {
      const t = Math.max(1, (opts.ms || 1200) / D.speed);
      const t0 = performance.now();
      for (;;) {
        check();
        await frame();
        const k = Math.min(1, (performance.now() - t0) / t);
        at = opts.path(k, a);
        place();
        fire("pointermove", at.x, at.y);
        fire("mousemove", at.x, at.y);
        if (k >= 1) break;
      }
    } else await glide(b, opts.ms == null ? 900 : opts.ms);
    await wait(120);
    up(at.x, at.y);
    if (alt) key("Alt", { up: true });
    alt = false;
    place();
    await settle(opts.after == null ? 300 : opts.after);
    return true;
  }
  /* A range slider: the pointer takes its handle and slides it to `value`, the slider sending input as it goes
     and change when let go, the way the browser does for a hand on it. */
  function setNative(input, v) {
    const d = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(input), "value");
    if (d && d.set) d.set.call(input, String(v));
    else input.value = String(v);
  }
  async function slide(input, value, ms) {
    if (!input) return false;
    const min = Number(input.min || 0);
    const max = Number(input.max === "" || input.max == null ? 100 : input.max);
    const step = Number(input.step) || 1;
    const vertical = /vertical/.test(input.getAttribute("orient") || "") || (getComputedStyle(input).writingMode || "").startsWith("vertical");
    const knobAt = (v) => {
      const r = input.getBoundingClientRect();
      const f = (v - min) / (max - min || 1);
      return vertical ? { x: r.left + r.width / 2, y: r.bottom - 8 - f * (r.height - 16) } : { x: r.left + 8 + f * (r.width - 16), y: r.top + r.height / 2 };
    };
    pointOf(input); // scrolls it into view
    const v0 = Number(input.value);
    await glide(knobAt(v0));
    await wait(150);
    down(at.x, at.y);
    const to = Math.max(min, Math.min(max, value));
    let last = v0;
    const a = { x: at.x, y: at.y };
    const b = knobAt(to);
    const t = Math.max(1, (ms || 1400) / D.speed);
    const t0 = performance.now();
    for (;;) {
      check();
      await frame();
      const k = Math.min(1, (performance.now() - t0) / t);
      const e = ease(k);
      at = { x: a.x + (b.x - a.x) * e, y: a.y + (b.y - a.y) * e };
      place();
      fire("pointermove", at.x, at.y);
      const v = Math.round((v0 + (to - v0) * e - min) / step) * step + min;
      if (v !== last) {
        last = v;
        setNative(input, v);
        input.dispatchEvent(new Event("input", { bubbles: true }));
      }
      if (k >= 1) break;
    }
    up(at.x, at.y);
    input.dispatchEvent(new Event("change", { bubbles: true }));
    await wait(250);
    return true;
  }
  /* A knob (drag up to turn it up): press on it and drag up or down by dy pixels. */
  const turn = (knob, dy, ms) => drag(knob, { dx: 0, dy: -dy }, { ms: ms || 1000 });
  async function wheel(target, deltaY, times, opts) {
    const p = pointOf(target);
    if (!p) return false;
    await glide(p);
    alt = !!(opts && opts.alt);
    place();
    if (alt) await wait(250);
    for (let i = 0; i < (times || 1); i++) {
      fire("wheel", p.x, p.y, { deltaY, deltaMode: 0 });
      await wait(60);
    }
    alt = false;
    place();
    await wait(200);
    return true;
  }
  function key(k, opts) {
    opts = opts || {};
    const t = doc.activeElement || doc.body;
    const o = { key: k, code: k.length === 1 ? "Key" + k.toUpperCase() : k, bubbles: true, cancelable: true, altKey: k === "Alt" ? !opts.up : alt, shiftKey: !!opts.shift, ctrlKey: !!opts.ctrl, metaKey: !!opts.meta };
    if (!opts.up) t.dispatchEvent(new KeyboardEvent("keydown", o));
    if (!opts.down) t.dispatchEvent(new KeyboardEvent("keyup", o));
  }
  async function type(input, text) {
    if (!(await click(input, { after: 150 }))) return false;
    input.focus && input.focus();
    for (const ch of text) {
      setNative(input, input.value + ch);
      input.dispatchEvent(new Event("input", { bubbles: true }));
      await wait(90);
    }
    input.dispatchEvent(new Event("change", { bubbles: true }));
    await wait(300);
    return true;
  }
  async function choose(select, value) {
    if (!(await move(select))) return false;
    await wait(200);
    select.value = value;
    select.dispatchEvent(new Event("input", { bubbles: true }));
    select.dispatchEvent(new Event("change", { bubbles: true }));
    ripple(at.x, at.y);
    await wait(400);
    return true;
  }
  /* A yellow frame round something worth looking at (null takes it away). */
  function ring(el) {
    if (!ui) return;
    if (!el) {
      ui.ring && ui.ring.remove();
      ui.ring = null;
      return;
    }
    const r = el.getBoundingClientRect();
    if (!ui.ring) {
      ui.ring = doc.createElement("div");
      ui.ring.className = "cd-ring cd-ui";
      doc.body.appendChild(ui.ring);
    }
    Object.assign(ui.ring.style, { left: r.left - 6 + "px", top: r.top - 6 + "px", width: r.width + 12 + "px", height: r.height + 12 + "px" });
  }
  /* The caption. Held long enough to read (about a third of a second a word), unless ms says otherwise. */
  async function say(text, ms, title) {
    check();
    if (!ui) return;
    ui.cap.hidden = !text;
    ui.cap.innerHTML = (title || D.title ? `<small>${esc(title || D.title)}</small>` : "") + esc(text || "");
    const words = String(text || "").split(/\s+/).length;
    await wait(ms == null ? Math.max(1600, words * 330) : ms);
  }
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  async function point(target, text, ms) {
    const el = typeof target === "function" ? target() : target;
    if (el && el.nodeType === 1) {
      await move(el);
      ring(el);
    }
    if (text) await say(text, ms);
    ring(null);
  }

  /* ---------- playing ---------- */
  function onKey(e) {
    if (e.key === "Escape" && e.isTrusted) D.stop();
  }
  async function run(what, opts) {
    if (playing) D.stop();
    const t = typeof what === "function" ? { run: what, label: "" } : tours.get(what);
    if (!t) return { ok: false, error: "There is no demonstration called " + what };
    playing = { stopped: false };
    const me = playing;
    D.title = t.label || "";
    build();
    patch(true);
    root.addEventListener("keydown", onKey, true);
    let out = { ok: true };
    try {
      await t.run(D, opts || {});
      await say("");
    } catch (e) {
      if (e === STOP) out = { ok: false, stopped: true };
      else {
        out = { ok: false, error: String((e && e.message) || e) };
        if (root.console) console.error("Show me:", e);
        try {
          if (ui) {
            ui.cap.hidden = false;
            ui.cap.textContent = "This demonstration stopped early: " + out.error;
          }
          await new Promise((res) => setTimeout(res, 2500));
        } catch (e2) {
          /* nothing */
        }
      }
    } finally {
      if (playing === me) {
        if (pressed) up(at.x, at.y);
        playing = null;
        patch(false);
        root.removeEventListener("keydown", onKey, true);
        teardown();
        D.title = "";
      }
    }
    return out;
  }
  Object.assign(D, {
    add(id, t) {
      tours.set(id, Object.assign({ id }, t));
      return D;
    },
    list: () => [...tours.values()].filter((t) => !t.ready || t.ready()),
    run,
    stop() {
      if (playing) playing.stopped = true;
    },
    running: () => !!playing,
    at: () => ({ x: at.x, y: at.y }),
    say,
    move,
    click,
    dbl,
    right,
    drag,
    slide,
    turn,
    wheel,
    key,
    type,
    choose,
    ring,
    point,
    wait,
    waitFor,
    hitPoint,
    under,
  });
  root.CurioDemo = D;
})(typeof window !== "undefined" ? window : globalThis);
