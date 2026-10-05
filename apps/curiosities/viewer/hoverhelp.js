/* Hover help (Jeremy's notes, 2026-10-04 20:16Z): rest the pointer on anything, in the Viewer, the Screen or
   the rest of the app, and a small bubble says what it is and what it does. Help ▸ Hover help turns it on or
   off (remembered per device, key "curio-hoverhelp-v1"; on unless switched off; automated test browsers start
   with it off unless the address has ?hoverhelp=1).

   What it says, in order:
   - the control itself: its own description (title, aria-label or data-help), or for a slider or a menu its
     label and its two ends ("Speed: slow drawl … auctioneer"), or a button's words;
   - in the picture: the thing under the pointer ("Biju: click to pick, drag to swing the camera round");
   - the part of the app it belongs to, in the App Walkthrough's own words (its first sentence or two).
   API: window.CurioHoverHelp { on(), set(bool), toggle(), describe(element, event) }. */
(function () {
  "use strict";
  if (window.CurioHoverHelp) return;
  const KEY = "curio-hoverhelp-v1";
  let on = true;
  try {
    const q = location.search;
    const saved = localStorage.getItem(KEY);
    if (saved) on = saved === "on";
    else if (navigator.webdriver && !/[?&]hoverhelp=1\b/.test(q)) on = false;
    if (/[?&]hoverhelp=0\b/.test(q)) on = false;
  } catch (e) {}

  const clean = (s) => String(s || "").replace(/\s+/g, " ").trim();
  const firstSentences = (s, n) => {
    const parts = clean(s).match(/[^.!?]+[.!?]+(\s|$)/g) || [clean(s)];
    return parts.slice(0, n).join("").trim();
  };

  /* the part of the app an element belongs to, from the walkthrough's steps: the smallest part that holds it */
  function partOf(el) {
    const W = window.CurioWalkthrough;
    if (!W || !W.steps) return null;
    let best = null;
    W.steps().forEach((s) => {
      if (!s.sel || !s.text) return;
      let host;
      try {
        host = document.querySelector(s.sel);
      } catch (e) {
        return;
      }
      if (!host || !host.contains(el)) return;
      const r = host.getBoundingClientRect();
      const area = r.width * r.height;
      /* steps on the same panel differ by tab: Move it, Camera & lens, Words ... */
      if (s.tab && window.CurioViewer && CurioViewer.live && host.closest(".cv-details") && CurioViewer.live().tab !== s.tab) return;
      if (!best || area < best.area) best = { title: s.title, text: s.text, area };
    });
    return best;
  }
  /* the nearest control with something to say */
  function controlOf(el) {
    for (let n = el, k = 0; n && n !== document.body && k < 8; n = n.parentElement, k++) {
      const said = n.dataset && (n.dataset.help || n.dataset.hhTitle);
      /* aria-labels name big regions too ("Player"); only a control's own one says what it does */
      const small = /^(BUTTON|INPUT|SELECT|TEXTAREA|CANVAS|A|SVG)$/i.test(n.tagName) || (n.getAttribute && n.getAttribute("role") === "img");
      const t = said || n.getAttribute("title") || (small ? n.getAttribute("aria-label") : "");
      const field = n.closest && n.closest(".cv-field");
      if ((n.tagName === "INPUT" || n.tagName === "SELECT" || n.tagName === "TEXTAREA") && field) {
        const lab = clean((field.querySelector("b") || {}).textContent);
        const ends = [...field.querySelectorAll(".cv-ends span")].map((x) => clean(x.textContent));
        const now = clean((field.querySelector("em") || {}).textContent);
        if (n.tagName === "INPUT" && n.type === "range") return { head: lab, body: `${t ? clean(t) + ". " : ""}Slide from ${ends[0] || "less"} to ${ends[1] || "more"}.${now ? " Now: " + now + "." : ""}` };
        if (n.tagName === "SELECT") return { head: lab || clean(t), body: `Choose one: ${[...n.options].map((o) => clean(o.textContent)).slice(0, 6).join(", ")}${n.options.length > 6 ? " …" : ""}.` };
        return { head: lab, body: clean(t) || "Type here." };
      }
      if (t) return { head: clean(n.tagName === "BUTTON" || n.tagName === "A" ? n.textContent : "") || "", body: clean(t), node: n };
      if (n.tagName === "BUTTON" || n.tagName === "A" || n.tagName === "SELECT") {
        const words = clean(n.textContent);
        if (words) return { head: words, body: "" };
      }
    }
    return null;
  }
  function inPicture(el, e) {
    const V = window.CurioViewer;
    if (!V || !el.closest || !el.closest(".cv-win") || el.tagName !== "CANVAS" || !V.pickAt) return null;
    let p = null;
    try {
      if (V.live().canvas === el) p = V.pickAt(e);
    } catch (err) {}
    const f = V.film && V.film();
    const o = p && p.obj && f ? f.objects.find((x) => x.id === p.obj) : null;
    if (o) return { head: o.name, body: `Click to pick ${o.name}; once picked, drag to move it. Drag anywhere else to swing the camera round, hold Control and drag to slide, double-click to zoom in there.` };
    return { head: "The picture", body: "Drag to swing the camera round, hold Control and drag to slide through the world, scroll to go closer or farther, double-click a spot to zoom in there." };
  }
  function describe(el, e) {
    if (!el || el.closest(".cw-bubble, .cw-menu, .hh-bubble")) return null;
    const c = (e && inPicture(el, e)) || controlOf(el);
    const part = partOf(el);
    if (!c && !part) return null;
    if (!c) return { html: `<b class="hh-head">${esc(part.title)}</b><span>${esc(firstSentences(part.text, 2))}</span>` };
    const head = c.head || (part ? part.title : "");
    const body = c.body || "";
    const ctx = part && (!c || part.title !== head || body.length < 40) ? `<span class="hh-part"><b>${esc(part.title)}:</b> ${esc(firstSentences(part.text, 2))}</span>` : part && !body ? esc(firstSentences(part.text, 2)) : "";
    return { html: `${head ? `<b class="hh-head">${esc(head)}</b>` : ""}${body ? `<span>${esc(body)}</span>` : ""}${ctx}`, node: c && c.node };
  }
  const esc = (v) =>
    String(v == null ? "" : v)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  /* ---------- the bubble ---------- */
  let bubble = null;
  let timer = 0;
  let at = null;
  let stripped = null;
  function restore() {
    if (stripped && stripped.dataset.hhTitle != null) {
      if (!stripped.getAttribute("title")) stripped.setAttribute("title", stripped.dataset.hhTitle);
      delete stripped.dataset.hhTitle;
    }
    stripped = null;
  }
  function hide() {
    clearTimeout(timer);
    if (bubble) bubble.hidden = true;
    restore();
  }
  function show(el, x, y, e) {
    const d = describe(el, e);
    if (!d) return hide();
    if (!bubble) {
      bubble = document.createElement("div");
      bubble.className = "hh-bubble";
      bubble.setAttribute("role", "tooltip");
      document.body.appendChild(bubble);
    }
    bubble.innerHTML = d.html;
    bubble.hidden = false;
    const w = bubble.offsetWidth;
    const h = bubble.offsetHeight;
    let left = x + 14;
    let top = y + 18;
    if (left + w > window.innerWidth - 8) left = Math.max(8, x - w - 14);
    if (top + h > window.innerHeight - 8) top = Math.max(8, y - h - 14);
    bubble.style.left = left + "px";
    bubble.style.top = top + "px";
  }
  function onMove(e) {
    if (!on || e.pointerType === "touch") return;
    if (at && Math.hypot(e.clientX - at.x, e.clientY - at.y) < 6 && bubble && !bubble.hidden) return;
    hide();
    const el = e.target;
    if (!el || !el.closest) return;
    /* the browser's own tooltip would say the same thing a second time */
    for (let n = el, k = 0; n && n !== document.body && k < 8; n = n.parentElement, k++) {
      if (n.getAttribute && n.getAttribute("title")) {
        n.dataset.hhTitle = n.getAttribute("title");
        n.removeAttribute("title");
        stripped = n;
        break;
      }
    }
    at = { x: e.clientX, y: e.clientY };
    const ev = { clientX: e.clientX, clientY: e.clientY, target: el };
    timer = setTimeout(() => show(el, ev.clientX, ev.clientY, ev), 550);
  }
  function set(v) {
    on = !!v;
    try {
      localStorage.setItem(KEY, on ? "on" : "off");
    } catch (e) {}
    if (!on) hide();
    document.querySelectorAll('[data-cw="hover"] .hh-state').forEach((s) => (s.textContent = on ? "on" : "off"));
  }
  const CSS = `
.hh-bubble { position: fixed; z-index: 2147483600; max-width: 300px; background: #fffdf5; color: #1a1a1a; border: 2px solid #111; border-radius: 14px; padding: 8px 11px; font: 12.5px/1.4 -apple-system, "Segoe UI", system-ui, sans-serif; box-shadow: 0 6px 18px #0006; pointer-events: none; display: grid; gap: 3px; }
.hh-bubble[hidden] { display: none; }
.hh-bubble .hh-head { font-size: 13px; }
.hh-bubble .hh-part { color: #5a5148; font-size: 11.5px; }
`;
  function wire() {
    const st = document.createElement("style");
    st.textContent = CSS;
    document.head.appendChild(st);
    document.addEventListener("pointermove", onMove, true);
    document.addEventListener("pointerdown", hide, true);
    document.addEventListener("wheel", hide, { capture: true, passive: true });
    document.addEventListener("keydown", hide, true);
    window.addEventListener("blur", hide);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", wire);
  else setTimeout(wire, 0);

  window.CurioHoverHelp = { on: () => on, set, toggle: () => set(!on), describe, hide };
})();
