/* Recolor the app, every colour (window.CurioRecolor; Jeremy 2026-10-08: "literally every color of the app": the
   storyboards' yellow, the words, the automation lanes' lines and nodes). paintings.js turns it on with a painting's
   palette (paintings/theme.js) and off with null.

   While it is on, every colour the app draws goes through CurioPaintTheme.map, so it becomes one of the painting's:
   - every stylesheet rule (the files and the <style> each part adds, now or later), its first value kept so off
     puts it back;
   - inline styles and SVG fill, stroke and stop-color on any element, as they appear;
   - fillStyle, strokeStyle and shadowColor on 2D canvases (lanes, nodes, the storyboard's paper).
   Left alone: the film's pictures (the Viewer's windows, the panel cards of the storyboard strip and the comic page,
   and canvases that are not on the page),
   the colours of the film's own things wherever they show (they are project elements: the other tab recolours
   them), the painting swatches, colour pickers, and anything inside [data-own-colors]. */
(function () {
  const T = () => window.CurioPaintTheme;
  let pal = null;
  let skipCss = new Set(["cvp-theme"]);

  /* ---------- the film's own colours, never touched ---------- */
  let own = new Set();
  const cache = new Map();
  function refreshOwn() {
    own = new Set();
    cache.clear();
    try {
      const v = window.CurioViewer;
      const f = v && v.live ? v.live().film : null;
      (f ? f.objects : []).forEach((o) => {
        if (o.color) own.add(String(o.color).toLowerCase());
        (o.strokes || []).forEach((s) => s && s.c && own.add(String(s.c).toLowerCase()));
      });
      if (window.CURIO_PAINTINGS) window.CURIO_PAINTINGS.list.forEach((p) => p.colors.forEach((c) => own.add(c.toLowerCase())));
    } catch (e) {}
  }
  function mapColour(c) {
    if (!pal || typeof c !== "string") return c;
    const k = c.toLowerCase();
    if (own.has(k)) return c;
    let m = cache.get(k);
    if (m === undefined) {
      m = T().map(pal, c);
      if (cache.size > 4000) cache.clear();
      cache.set(k, m);
    }
    return m;
  }
  const COLOUR = /#[0-9a-f]{3,8}\b|rgba?\([^)]*\)|\b(?:white|black)\b/gi;
  const mapText = (s) => String(s).replace(COLOUR, (m) => mapColour(m));

  /* ---------- stylesheets ---------- */
  const origRules = new Map(); /* CSSStyleDeclaration -> [[prop, value, priority]] */
  const seen = new WeakSet();
  function eachRule(list, fn) {
    for (const r of list) {
      if (r.style) fn(r.style);
      if (r.cssRules) eachRule(r.cssRules, fn);
    }
  }
  function sheetOk(sh) {
    const n = sh.ownerNode;
    return !(n && skipCss.has(n.id));
  }
  function doSheet(sh) {
    let rules;
    try {
      rules = sh.cssRules;
    } catch (e) {
      return; /* a sheet from another site */
    }
    if (!rules || !sheetOk(sh)) return;
    seen.add(sh);
    eachRule(rules, (st) => {
      let o = origRules.get(st);
      if (!o) {
        o = [];
        for (let i = 0; i < st.length; i++) {
          const p = st[i];
          const v = st.getPropertyValue(p);
          if (/#|rgb|white|black/i.test(v)) o.push([p, v, st.getPropertyPriority(p)]);
        }
        if (!o.length) return;
        origRules.set(st, o);
      }
      o.forEach(([p, v, pr]) => st.setProperty(p, mapText(v), pr));
    });
  }
  function sheets(all) {
    for (const sh of document.styleSheets) if (all || !seen.has(sh)) doSheet(sh);
  }
  function undoSheets() {
    origRules.forEach((o, st) => o.forEach(([p, v, pr]) => st.setProperty(p, v, pr)));
    origRules.clear();
  }

  /* ---------- inline styles and SVG colours ---------- */
  const ATTRS = ["style", "fill", "stroke", "stop-color"];
  const origAttr = new Map(); /* element -> { attr: original } */
  const wrote = new WeakMap(); /* element -> { attr: what we wrote } */
  const SKIP = ".cvp-sw, .cvp-cell, .cvp-held, .cv-dot, [data-own-colors], input[type=color]";
  function doEl(el) {
    if (!el.getAttribute || (el.closest && el.closest(SKIP))) return;
    for (const a of ATTRS) {
      const cur = el.getAttribute(a);
      if (cur == null || !/#|rgb|white|black/i.test(cur)) continue;
      const w = wrote.get(el);
      if (w && w[a] === cur) continue;
      let o = origAttr.get(el);
      if (!o) origAttr.set(el, (o = {}));
      o[a] = cur;
      const m = mapText(cur);
      if (m === cur) continue;
      const ww = w || {};
      ww[a] = m;
      wrote.set(el, ww);
      el.setAttribute(a, m);
    }
  }
  function doTree(root) {
    if (root.nodeType !== 1) return;
    doEl(root);
    root.querySelectorAll("[style], [fill], [stroke], [stop-color]").forEach(doEl);
  }
  function undoEls() {
    origAttr.forEach((o, el) => {
      const w = wrote.get(el) || {};
      for (const a in o) if (el.getAttribute(a) === w[a]) el.setAttribute(a, o[a]);
      wrote.delete(el);
    });
    origAttr.clear();
  }

  /* ---------- 2D canvases ---------- */
  let live = null;
  let liveAt = 0;
  function picture(cv) {
    if (!cv || !cv.isConnected) return true;
    const now = Date.now();
    if (now - liveAt > 1000) {
      liveAt = now;
      try {
        const v = window.CurioViewer;
        live = v && v.live ? v.live().canvas : null;
      } catch (e) {
        live = null;
      }
    }
    /* the film's pictures: every Viewer window, the panel cards (storyboard strip, comic page) */
    return cv === live || !!(cv.closest && cv.closest(".cv-win, .cv-card, [data-own-colors]"));
  }
  function patchCanvas() {
    const P = window.CanvasRenderingContext2D && CanvasRenderingContext2D.prototype;
    if (!P || P.__curioRecolor) return;
    P.__curioRecolor = true;
    ["fillStyle", "strokeStyle", "shadowColor"].forEach((prop) => {
      const d = Object.getOwnPropertyDescriptor(P, prop);
      if (!d || !d.set) return;
      Object.defineProperty(P, prop, {
        configurable: true,
        enumerable: d.enumerable,
        get: d.get,
        set(v) {
          if (pal && typeof v === "string" && !picture(this.canvas)) v = mapColour(v);
          d.set.call(this, v);
        },
      });
    });
  }

  /* ---------- watching for what parts add later ---------- */
  let mo = null;
  let queued = [];
  let raf = 0;
  function flush() {
    raf = 0;
    if (!pal) return (queued = []);
    const q = queued;
    queued = [];
    sheets(false);
    q.forEach((n) => (n.isConnected ? doTree(n) : 0));
  }
  function watch(on) {
    if (on && !mo && window.MutationObserver) {
      mo = new MutationObserver((list) => {
        for (const m of list) {
          if (m.type === "attributes") queued.push(m.target);
          else m.addedNodes.forEach((n) => n.nodeType === 1 && queued.push(n));
        }
        if (!raf) raf = (window.requestAnimationFrame || setTimeout)(flush);
      });
      mo.observe(document.documentElement, { subtree: true, childList: true, attributes: true, attributeFilter: ATTRS });
    } else if (!on && mo) {
      mo.disconnect();
      mo = null;
      queued = [];
    }
  }

  /* palette from CurioPaintTheme.palette, or null for the app's own colours */
  function set(p) {
    if (!p) {
      if (!pal) return;
      pal = null;
      watch(false);
      undoSheets();
      undoEls();
      cache.clear();
      redraw();
      return;
    }
    const again = !!pal;
    if (again) {
      undoSheets();
      undoEls();
    }
    pal = p;
    cache.clear();
    refreshOwn();
    patchCanvas();
    sheets(true);
    doTree(document.documentElement);
    watch(true);
    redraw();
  }
  /* canvases already drawn draw again on the next change; nudge the parts that redraw on resize */
  function redraw() {
    try {
      window.dispatchEvent(new Event("resize"));
    } catch (e) {}
  }

  window.CurioRecolor = {
    set,
    on: () => !!pal,
    map: (c) => mapColour(c),
    refreshOwn,
  };
})();
