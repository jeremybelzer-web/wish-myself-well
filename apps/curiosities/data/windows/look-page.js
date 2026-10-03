/* Page (comics and zines): the live picture at the top of each page curiosity's window (CuriosityWindows.look).
   Each picture is a small comic page or spread drawn in plain boxes, so a setting changes the page itself:
   panels, gutters, balloons, sound words. When a curiosity is switched off ("none"), what its other settings
   would do is still drawn, faded, so every knob shows its effect. */
(function (W) {
  const BG = "#141418";
  const PAPER = "#f4f1ea";
  const INK = "#1c1712";
  const r1 = (n) => Math.round(n * 10) / 10;
  const rect = (x, y, w, h, fill, o) => {
    o = o || {};
    return `<rect x="${r1(x)}" y="${r1(y)}" width="${r1(Math.max(0.5, w))}" height="${r1(Math.max(0.5, h))}"${o.rx ? ` rx="${o.rx}"` : ""} fill="${fill || "none"}"${o.stroke ? ` stroke="${o.stroke}" stroke-width="${o.sw || 1}"` : ""}${o.dash ? ` stroke-dasharray="${o.dash}"` : ""}${o.op != null ? ` opacity="${r1(o.op * 100) / 100}"` : ""}/>`;
  };
  const line = (x1, y1, x2, y2, c, w, dash) => `<line x1="${r1(x1)}" y1="${r1(y1)}" x2="${r1(x2)}" y2="${r1(y2)}" stroke="${c || INK}" stroke-width="${w || 1.5}"${dash ? ` stroke-dasharray="${dash}"` : ""} stroke-linecap="round"/>`;
  const path = (pts, c, w, fill, dash) => `<path d="${pts.map((p, i) => (i ? "L" : "M") + r1(p[0]) + " " + r1(p[1])).join(" ")}${fill ? " Z" : ""}" fill="${fill || "none"}" stroke="${c || INK}" stroke-width="${w || 1.5}" stroke-linejoin="round"${dash ? ` stroke-dasharray="${dash}"` : ""}/>`;
  const tag = (k, x, y, text, color, anchor, size) => k.label({ x, y, text, size: size || 8, color: color || "#aaa", anchor: anchor || "middle" });
  const cap = (k, text) => `<rect x="0" y="${k.H - 18}" width="${k.W}" height="18" fill="rgba(0,0,0,0.55)"/>` + k.fitText({ x: k.W / 2, y: k.H - 5, text, size: 10, min: 7, w: 312, color: "#f4f4f4" });
  const box = (x, y, w, h, o) => rect(x, y, w, h, (o && o.fill) || "#fff", { stroke: INK, sw: (o && o.sw) || 1.5, op: o && o.op });
  const star = (x, y, r, c, n, inner) => {
    n = n || 8;
    const p = [];
    for (let i = 0; i < n * 2; i++) {
      const a = (i / (n * 2)) * Math.PI * 2;
      const rr = i % 2 ? r * (inner || 0.5) : r;
      p.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]);
    }
    return path(p, INK, 1, c || "#ffd166");
  };
  /* A small stick figure for panels (k.person scaled). */
  const fig = (k, x, y, s, o) => k.person(Object.assign({ x, y, s, color: "#4a6fa5" }, o || {}));
  /* Lines of text standing in for words in a balloon. */
  const textLines = (x, y, w, n, h) => {
    let s = "";
    for (let i = 0; i < n; i++) s += line(x, y + i * (h || 4), x + w * (i === n - 1 && n > 1 ? 0.6 : 1), y + i * (h || 4), "#666", 1.4);
    return s;
  };
  /* A balloon of one shape around (x, y). */
  function balloonShape(shape, x, y, w, h, fill) {
    const f = fill || "#fff";
    if (shape === "square") return rect(x - w / 2, y - h / 2, w, h, f, { stroke: INK, sw: 1.5, rx: 2 });
    if (shape === "jagged" || shape === "wavy") {
      const p = [];
      const n = 18;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        const j = shape === "jagged" ? (i % 2 ? 0.75 : 1.12) : 1 + Math.sin(i * 1.7) * 0.07;
        p.push([x + Math.cos(a) * (w / 2) * j, y + Math.sin(a) * (h / 2) * j]);
      }
      return shape === "wavy" ? `<path d="${p.map((q, i) => (i ? "T" : "M") + r1(q[0]) + " " + r1(q[1])).join(" ")} Z" fill="${f}" stroke="${INK}" stroke-width="1.5" stroke-dasharray="5 2"/>` : path(p, INK, 1.5, f);
    }
    return `<ellipse cx="${r1(x)}" cy="${r1(y)}" rx="${r1(w / 2)}" ry="${r1(h / 2)}" fill="${f}" stroke="${INK}" stroke-width="1.5"/>`;
  }

  /* A page turn: the hook panel at the bottom of a spread, the corner lifting, and the reveal on the next page. */
  W.look("pageTurn", (v, k) => {
    const mode = v("setting");
    const right = v("hookSide") === "right page";
    const urge = v.p("turnUrge");
    const lps = v.n("lastPanelSize") / 100;
    const rs = v.n("revealSize") / 100;
    const str = v.n("strength") / 5;
    let out = k.bg(BG) + rect(18, 10, 240, 132, PAPER, { stroke: "#888" }) + line(138, 10, 138, 142, "#bbb", 1);
    /* ordinary panels on both pages, then the hook panel */
    const page = (px, hook) => {
      let s = "";
      const hh = hook ? 16 + lps * 80 : 0;
      const top = 116 - hh;
      const rows = Math.max(1, Math.floor(top / 38));
      for (let r = 0; r < rows; r++) for (let c = 0; c < 2; c++) s += box(px + 6 + c * 55, 16 + r * ((top - 4) / rows), 50, (top - 4) / rows - 4);
      if (hook) {
        const y = 16 + top;
        s += box(px + 6, y, 105, hh - 2, { fill: "#fff8e0", sw: 2.5 });
        const lp = v("lastPanel");
        const cx = px + 58;
        const cy = y + hh / 2;
        const r = Math.min(14, hh / 2 - 3);
        if (lp === "calm") s += k.face({ x: cx, y: cy, r, mood: 0.3, eyes: 0.6 });
        if (lp === "a question") s += k.face({ x: cx - 16, y: cy, r, mood: -0.2 }) + k.text({ x: cx + 18, y: cy + 6, text: "?", size: 10 + r, color: "#3a6fc0", weight: 800 });
        if (lp === "a look off-panel") s += k.face({ x: cx, y: cy, r, look: 1, mood: -0.4, brows: -0.6 }) + line(cx + r + 4, cy - 2, px + 108, cy - 2, "#999", 1, "2 2");
        if (lp === "a scream") s += k.face({ x: cx, y: cy, r, mouth: 1, mood: -1, eyes: 1 }) + star(cx + 30, cy - 4, 6, "#ef476f", 6);
      }
      return s;
    };
    out += page(18, !right) + page(138, right);
    /* the corner lifting */
    const cs = 6 + urge * 26;
    out += path([[258 - cs, 142], [258, 142 - cs], [258 - cs * 0.6, 142 - cs * 0.6]], INK, 1, "#d8d2c4");
    if (urge > 0.6) out += k.arrow({ x1: 246, y1: 132, x2: 274, y2: 118, color: "#ffd166", w: 1.5 + urge });
    /* the next page */
    out += rect(266, 22, 48, 110, PAPER, { stroke: "#888", op: 0.95 });
    const rh = 8 + rs * 96;
    out += box(270, 26, 40, rh, { fill: "#fff8e0" });
    const burstOp = mode === "none" ? 0.25 : 1;
    out += `<g opacity="${burstOp}">${star(290, 26 + rh / 2, 4 + str * 9 + (mode === "cliffhanger" ? 3 : 0), mode === "cliffhanger" ? "#ef476f" : "#ffd166", 7)}</g>`;
    out += tag(k, 290, 16, "next page", "#999", "middle", 7);
    /* big turns, page by page */
    const every = Math.max(1, v.n("turnsBetween"));
    for (let i = 0; i < 20; i++) {
      const big = i % every === every - 1;
      out += rect(18 + i * 14, 148, 10, 10, big ? "#ffd166" : "#3a3a40", { stroke: "#555" });
    }
    return out + cap(k, `${mode} · hook on the ${v("hookSide")} · ${v("lastPanel")} · ${v("turnUrge")} · big turn every ${every} page${every === 1 ? "" : "s"}`);
  });

  /* Panels per page: rows, how strict the grid is, the reading order, and how the count swings page to page. */
  W.look("panelCount", (v, k) => {
    const n = k.clamp(v.n("setting"), 1, 8);
    const rows = k.clamp(v.n("rowCount"), 1, 5);
    const grid = v.p("grid");
    const flow = v("readFlow");
    const swing = v.p("countSwing");
    const drawPage = (x, y, w, h, count, nums) => {
      let s = rect(x, y, w, h, PAPER, { stroke: "#888" });
      for (let r = 1; r < rows; r++) s += line(x + 2, y + (h * r) / rows, x + w - 2, y + (h * r) / rows, "#ccc", 0.6, "2 2");
      const rr = Math.min(rows, count);
      const per = Array.from({ length: rr }, (_, r) => Math.floor(count / rr) + (r < count % rr ? 1 : 0));
      const centers = [];
      per.forEach((m, r) => {
        const ry = y + 4 + (r * (h - 8)) / rr;
        const rhh = (h - 8) / rr - 4;
        const ws = Array.from({ length: m }, (_, i) => (grid > 0.9 ? 1 : 1 + (k.rnd(r * 7 + i + count) - 0.5) * (grid > 0.4 ? 0.5 : 1.4)));
        const tot = ws.reduce((a, b) => a + b, 0);
        let px = x + 4;
        ws.forEach((ww, i) => {
          const pw = (ww / tot) * (w - 8) - 4;
          const sl = grid < 0.4 ? (k.rnd(i + r * 3) - 0.5) * 8 : 0;
          s += path([[px, ry], [px + pw, ry + sl * 0.3], [px + pw + sl * 0.4, ry + rhh], [px, ry + rhh - sl * 0.3]], INK, 1.5, "#fff");
          centers.push([px + pw / 2, ry + rhh / 2, r, i]);
          px += pw + 4;
        });
      });
      if (nums) {
        let order = centers.slice();
        if (flow === "right to left") order.sort((a, b) => a[2] - b[2] || b[0] - a[0]);
        else if (flow === "top to bottom") order.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
        else order.sort((a, b) => a[2] - b[2] || a[0] - b[0]);
        order.forEach((c, i) => (s += k.label({ x: c[0], y: c[1] + 4, text: String(i + 1), size: 11, color: "#c0392b", weight: 700 })));
        if (order.length > 1) s += path(order.map((c) => [c[0], c[1] + 8]), "#c0392b", 1, null, "3 2");
        else {
          const ttb = flow === "top to bottom";
          const rtl = flow === "right to left";
          s += ttb ? k.arrow({ x1: x + w - 8, y1: y + 10, x2: x + w - 8, y2: y + h - 10, color: "#c0392b", w: 1.2 }) : k.arrow({ x1: rtl ? x + w - 10 : x + 10, y1: y + h - 8, x2: rtl ? x + 10 : x + w - 10, y2: y + h - 8, color: "#c0392b", w: 1.2 });
        }
      }
      return s;
    };
    let out = k.bg(BG) + drawPage(16, 10, 104, 146, n, true);
    for (let p = 0; p < 3; p++) {
      const c = k.clamp(Math.round(n + (k.rnd(p + 4) - 0.5) * swing * 8), 1, 9);
      out += drawPage(132 + p * 48, 40, 42, 58, c, false);
    }
    out += tag(k, 202, 34, "next pages", "#888");
    /* reading speed and story time per panel */
    const pace = v.p("readPace");
    out += `<ellipse cx="160" cy="128" rx="14" ry="8" fill="#fff"/><circle cx="${r1(160 + pace * 6)}" cy="128" r="4" fill="${INK}"/>`;
    for (let i = 0; i < 1 + Math.round(pace * 4); i++) out += line(178, 122 + i * 4, 186 + pace * 16, 122 + i * 4, "#ffd166", 1.5);
    const tp = Math.log(v.n("timePerPanel") / 0.5) / Math.log(1200);
    out += k.clock({ x: 270, y: 128, r: 14, p: tp }) + tag(k, 270, 154, `${Math.round(v.n("timePerPanel") * 100) / 100} s of story`, "#ccc", "middle", 7);
    return out + cap(k, `${n} panel${n === 1 ? "" : "s"} · ${rows} row${rows === 1 ? "" : "s"} · ${v("grid")} · ${flow} · ${v("readPace")}`);
  });

  /* The gutter between two panels: its width, color and slant, and the time that passes inside it. */
  W.look("gutter", (v, k) => {
    const mode = v("setting");
    const gw = 2 + v.n("width") * 6 + (mode === "scene" ? 8 : 0);
    const slant = Math.tan(k.rad(v.n("gutterSlant"))) * 60;
    const gc = { white: "#ffffff", black: "#000000", "a color": "#5fb0d0" }[v("gutterColor")] || "#fff";
    const skip = v("timeSkip");
    const mx = 160;
    const y0 = 24;
    const y1 = 140;
    let out = k.bg(BG) + rect(10, 14, 300, 136, gc, { stroke: "#666" });
    const L = [[16, y0], [mx - gw / 2 + slant, y0], [mx - gw / 2 - slant, y1], [16, y1]];
    const R = [[mx + gw / 2 + slant, y0], [304, y0], [304, y1], [mx + gw / 2 - slant, y1]];
    out += path(L, INK, 2, "#e9e2d0") + path(R, INK, 2, skip === "hours" ? "#2a3550" : "#e9e2d0");
    /* left: someone lifts a cup; right: what is left after the skip */
    out += fig(k, 80, 132, 1.3, { arms: 0.4 }) + rect(94, 70, 9, 10, "#e07a5f", { stroke: INK });
    const older = skip === "years";
    out += fig(k, 240, 132, 1.3, { arms: skip === "a moment" ? 0.9 : 0, skin: older ? "#d8b8a0" : undefined, mood: skip === "none" ? 0 : 0.2 });
    if (older) out += `<path d="M228 63 Q240 54 252 63" stroke="#eee" stroke-width="5" fill="none"/>`;
    if (skip === "none") out += rect(254, 70, 9, 10, "#e07a5f", { stroke: INK });
    if (skip === "a moment") out += rect(244, 52, 9, 10, "#e07a5f", { stroke: INK });
    if (skip === "minutes") out += rect(262, 120, 9, 10, "#fff", { stroke: INK });
    if (skip === "hours") out += `<circle cx="285" cy="42" r="8" fill="#f4f1ea"/>` + rect(262, 120, 9, 10, "#fff", { stroke: INK });
    if (older) out += path([[280, 132], [280, 92]], "#3a7a3a", 3) + `<circle cx="280" cy="88" r="10" fill="#4a9a4a"/>`;
    /* what the reader fills in */
    const cl = v.p("closure");
    const dots = Math.round(cl * 6);
    for (let i = 0; i < dots; i++) out += `<circle cx="${r1(mx - 10 + i * 4)}" cy="${r1(10 - (i % 2) * 2)}" r="${r1(1.5 + cl * 1.5)}" fill="#ffd166"/>`;
    if (cl > 0) out += `<ellipse cx="${mx}" cy="10" rx="${r1(8 + cl * 18)}" ry="${r1(4 + cl * 4)}" fill="none" stroke="#ffd166" stroke-width="1"/>`;
    return out + cap(k, `${mode} gutter · width ${v.n("width")} · ${v("gutterColor")} · ${v.n("gutterSlant")}° · skips ${skip} · reader fills ${v("closure")}`);
  });

  /* Balloons and captions in a panel: shape, size, where it sits, its tail, and how much the caption knows. */
  W.look("balloon", (v, k) => {
    const mode = v("setting");
    const size = v.n("size") / 5;
    const shape = v("shape");
    const place = v.p("placement");
    const across = v.n("balloonAcross") / 100;
    const tail = v("tailTo");
    let out = k.bg(BG) + box(16, 10, 288, 140, { fill: "#e9e2d0", sw: 2.5 });
    out += fig(k, 210, 146, 1.5, { mood: shape === "jagged" ? -0.5 : 0.2, eyes: 1 });
    /* the balloon */
    const bw = 50 + size * 70;
    const bh = 22 + size * 22;
    const bx = 18 + bw / 2 + across * Math.max(0, 284 - bw); /* the whole slider maps inside the panel, no clamping */
    let by = k.clamp(24 + place * 90, 14 + bh / 2, 148 - bh / 2);
    const iv = v("innerVoice");
    /* keep clear of the caption box (top left) and the inner-voice box or bubble */
    if (bx - bw / 2 < 142 && by - bh / 2 < 34) by = 36 + bh / 2;
    if (iv === "caption box" && bx + bw / 2 > 224 && by + bh / 2 > 118) by = Math.max(36 + bh / 2, 116 - bh / 2);
    if (iv === "thought bubble" && bx + bw / 2 > 226 && by - bh / 2 < 66) by = Math.max(by, 70 + bh / 2);
    by = Math.min(by, 148 - bh / 2);
    const balOp = mode === "caption" ? 0.25 : 1;
    let bal = "";
    if (tail === "the speaker") bal += path([[bx - 6, by + bh / 2 - 3], [204, 76], [bx + 6, by + bh / 2 - 3]], INK, 1.5, "#fff");
    if (tail === "off-panel") bal += path([[bx + bw / 2 - 6, by - 4], [314, by - 14], [bx + bw / 2 - 4, by + 6]], INK, 1.5, "#fff");
    bal += balloonShape(shape, bx, by, bw, bh) + textLines(bx - bw * 0.3, by - bh * 0.15, bw * 0.6, 2 + Math.round(size * 2), 5);
    out += `<g opacity="${balOp}">${bal}</g>`;
    /* the caption box and what it knows */
    const knows = v("captionKnows");
    const capText = { "same as the people": "Later that day.", "a bit more": "She hasn't noticed yet.", everything: "He never came back." }[knows] || knows;
    const capOp = mode === "balloon" ? 0.3 : 1;
    out += `<g opacity="${capOp}">${rect(20, 14, 120, 18, "#fff3b0", { stroke: INK, sw: 1.5 })}${k.text({ x: 80, y: 27, text: capText, size: 9, color: INK, italic: knows === "everything" })}</g>`;
    /* inner thoughts */
    if (iv === "thought bubble") out += `<ellipse cx="262" cy="34" rx="34" ry="16" fill="#fff" stroke="${INK}" stroke-width="1.5"/><circle cx="234" cy="56" r="4" fill="#fff" stroke="${INK}"/><circle cx="226" cy="64" r="2.5" fill="#fff" stroke="${INK}"/>` + k.text({ x: 262, y: 38, text: "hmm…", size: 10, color: INK, italic: true });
    if (iv === "caption box") out += rect(226, 120, 72, 24, "#d8ecff", { stroke: INK, sw: 1.5 }) + k.text({ x: 262, y: 136, text: "I knew it.", size: 9, color: INK, italic: true });
    return out + cap(k, `${mode} · ${shape} · size ${v.n("size")} · ${v("placement")} · tail to ${tail} · caption knows ${knows}`);
  });

  /* Panel sizes on a page: the biggest panel and what it holds, the smallest, and how often a splash comes. */
  W.look("panelSize", (v, k) => {
    const mult = [0.7, 1, 1.3, 1.8][Math.round(v.p("setting") * 3)];
    const big = k.clamp((v.n("biggestShare") / 100) * mult, 0.08, 0.9);
    const small = k.clamp(v.n("smallestShare") / 100, 0.01, 0.5);
    const vari = v.n("variation") / 5;
    const shape = v("panelShape");
    const px = 16;
    const py = 10;
    const pw = 110;
    const ph = 146;
    let out = k.bg(BG) + rect(px, py, pw, ph, PAPER, { stroke: "#888" });
    let bx = px + 4;
    let by = py + 4;
    let bw;
    let bh;
    if (shape === "tall") (bw = (pw - 8) * Math.sqrt(big) * 0.9), (bh = ph - 8);
    else if (shape === "wide") (bw = pw - 8), (bh = (ph - 8) * big);
    else (bw = (pw - 8) * Math.sqrt(big)), (bh = Math.min(ph - 8, bw * 1.1));
    bw = Math.max(20, bw);
    bh = Math.max(16, bh);
    const pull = v.p("eyePull");
    if (pull > 0) out += rect(bx - 3, by - 3, bw + 6, bh + 6, "#ffd166", { op: 0.2 + pull * 0.6, rx: 3 });
    out += box(bx, by, bw, bh, { fill: "#fff8e0", sw: 2 + pull * 2 });
    const bf = v("biggestFor");
    const cx = bx + bw / 2;
    const cy = by + bh / 2;
    const s = Math.min(bw, bh) / 60;
    if (bf === "the action") out += star(cx, cy, 18 * s, "#ef476f", 7);
    if (bf === "a face") out += k.face({ x: cx, y: cy, r: 18 * s });
    if (bf === "the place") out += path([[bx + 4, by + bh - 6], [cx - 6 * s, cy - 10 * s], [cx + 4 * s, cy], [cx + 14 * s, cy - 14 * s], [bx + bw - 4, by + bh - 6]], INK, 1.5, "#81b29a");
    if (bf === "the reveal") out += k.text({ x: cx, y: cy + 8 * s, text: "!", size: 30 * s, color: "#c0392b", weight: 800 });
    /* the other panels fill the rest, the smallest at its share */
    const rest = [];
    const restX = shape === "tall" ? bx + bw + 4 : px + 4;
    const restY = shape === "tall" ? py + 4 : by + bh + 4;
    const rw = px + pw - 4 - restX;
    const rh = py + ph - 4 - restY;
    if (rw > 8 && rh > 8) {
      const n = 4;
      const ws = Array.from({ length: n }, (_, i) => (i === n - 1 ? small * 4 : 1 + (k.rnd(i + 2) - 0.5) * vari * 1.6));
      const tot = ws.reduce((a, b) => a + b, 0);
      let at = restY;
      ws.forEach((w2, i) => {
        const hh = (w2 / tot) * rh;
        rest.push(box(restX, at, rw, Math.max(2, hh - 3), { fill: i === n - 1 ? "#ffe0e0" : "#fff" }));
        at += hh;
      });
    }
    out += rest.join("");
    out += tag(k, 220, 30, `biggest: ${Math.round(big * 100)}% of the page`, "#ffd166") + tag(k, 220, 46, `smallest: ${v.n("smallestShare")}% (pink)`, "#f2a0b0");
    /* splash pages across the book */
    const every = v.n("splashEvery");
    out += tag(k, 220, 80, every ? `a splash every ${every} pages` : "no splash pages", "#ccc");
    for (let i = 0; i < 20; i++) {
      const splash = every > 0 && i % every === every - 1;
      out += rect(140 + (i % 10) * 16, 90 + Math.floor(i / 10) * 22, 12, 18, splash ? "#ffd166" : "#3a3a40", { stroke: "#555" });
    }
    out += k.label({ x: 312, y: 12, text: `biggest panel ${v.n("biggestShare")}%`, size: 7, color: "#ddd", anchor: "end" });
    return out + cap(k, `${v("setting")} · ${shape} biggest panel for ${bf} · variation ${v.n("variation")} · ${v("eyePull")}`);
  });

  /* Breaking the frame: something reaching out of its panel border, which way, how far, and how often. */
  W.look("panelBreak", (v, k) => {
    const mode = v("setting");
    const much = v.n("howMuch") / 5;
    const dir = v("breakDir");
    const what = v("whatBreaks");
    const P = { x: 70, y: 40, w: 120, h: 80 };
    let out = k.bg(BG) + rect(40, 14, 180, 136, PAPER, { stroke: "#888" }) + box(P.x, P.y, P.w, P.h, { fill: "#e9e2d0", sw: 2.5 });
    const reach = (mode === "splash" ? 40 : mode === "edge" ? 22 : 14) * (0.2 + much);
    const d = { up: [0, -1], right: [1, 0], down: [0, 1], left: [-1, 0] }[dir] || [0, -1];
    const cx = P.x + P.w / 2;
    const cy = P.y + P.h / 2;
    const ex = cx + d[0] * (P.w / 2 + reach - 10);
    const ey = cy + d[1] * (P.h / 2 + reach - 10);
    const op = mode === "none" ? 0.35 : 1;
    let obj = "";
    if (what === "a hand") obj = line(cx, cy, ex, ey, "#4a6fa5", 7) + `<circle cx="${r1(ex)}" cy="${r1(ey)}" r="8" fill="#f0c8a0" stroke="${INK}" stroke-width="1.5"/>`;
    if (what === "a weapon") obj = line(cx, cy, ex, ey, "#8a8a9a", 4) + line(cx - d[1] * 8, cy - d[0] * 8, cx + d[1] * 8, cy + d[0] * 8, INK, 4);
    if (what === "a whole figure") obj = fig(k, ex, ey + 30, mode === "splash" ? 1.4 : 1, { arms: 1, color: "#e07a5f" });
    if (what === "an effect") obj = star(ex, ey, 14 + much * 12, "#ffd166", 9);
    out += `<g opacity="${op}">${obj}</g>`;
    if (mode === "none") out += tag(k, cx, P.y + P.h + 14, "stays inside (faded: how it would break)", "#777", "middle", 7);
    /* breaks per page and when they are saved for */
    const bpp = v.n("breaksPerPage");
    out += rect(240, 14, 66, 92, PAPER, { stroke: "#888" });
    for (let i = 0; i < 6; i++) out += box(244 + (i % 2) * 31, 18 + Math.floor(i / 2) * 29, 27, 25, { sw: 1 });
    for (let i = 0; i < bpp; i++) out += star(244 + (i % 2) * 31 + 24, 18 + Math.floor(i / 2) * 29 + 2, 5, "#ef476f", 5);
    out += tag(k, 273, 116, `${bpp} per page`, "#ccc");
    const sv = v("savedFor");
    out += line(240, 136, 306, 136, "#555", 1) + tag(k, 273, 148, `saved for ${sv}`, "#aaa", "middle", 7);
    const marks = sv === "anytime" ? [0.1, 0.3, 0.5, 0.7, 0.9] : sv === "action beats" ? [0.35, 0.6, 0.8] : [0.92];
    marks.forEach((m) => (out += `<circle cx="${r1(240 + m * 66)}" cy="136" r="3" fill="#ef476f"/>`));
    return out + cap(k, `${mode} · ${what} breaks out ${dir} · how much ${v.n("howMuch")}`);
  });

  /* Words per panel: balloons and their lines of text across a strip, silent panels, and the time to read. */
  W.look("textDensity", (v, k) => {
    const mult = [0.4, 0.8, 1.3][Math.round(v.p("setting") * 2)];
    const words = v.n("words") * mult;
    const per = v.n("balloonsPerPanel");
    const share = v.n("textShare") / 100;
    const silent = v.n("silentRun");
    let out = k.bg(BG) + rect(8, 10, 304, 118, PAPER, { stroke: "#888" });
    const n = 4;
    const pw = 70;
    for (let i = 0; i < n; i++) {
      const x = 14 + i * 74;
      out += box(x, 16, pw, 106, { fill: "#e9e2d0" }) + fig(k, x + 35, 118, 0.9, { look: i % 2 ? -1 : 1 });
      const isSilent = i < Math.min(n - 1, silent);
      if (isSilent) {
        out += tag(k, x + 35, 34, "silent", "#999", "middle", 8);
        continue;
      }
      const nb = Math.max(per, 0);
      for (let b = 0; b < Math.min(nb, 6); b++) {
        const bw = 18 + share * 80;
        const bh = 10 + share * 60;
        const w = Math.min(pw - 6, bw / Math.sqrt(Math.max(1, nb)));
        const h = Math.min(50, bh / Math.max(1, nb) + 8);
        const bx = x + 4 + (b % 2) * (pw - 8 - w);
        const by = 20 + Math.floor(b / 2) * (h + 3);
        out += rect(bx, by, w, h, "#fff", { stroke: INK, rx: 6 });
        const lines = k.clamp(Math.round(words / Math.max(1, nb) / 6), words > 0 ? 1 : 0, Math.floor((h - 4) / 4));
        out += textLines(bx + 3, by + 4, w - 6, lines, 4);
      }
      if (!nb) out += tag(k, x + 35, 34, "no balloons", "#999", "middle", 7);
    }
    /* time to read the page */
    const rt = v.p("readTime");
    out += k.clock({ x: 30, y: 146, r: 10, p: 0.05 + rt * 0.8 }) + tag(k, 46, 150, `time to read: ${v("readTime")}`, "#ccc", "start");
    out += tag(k, 306, 150, `${silent} silent in a row`, "#aaa", "end");
    return out + cap(k, `${v("setting")} · ${v.n("words")} words · ${per} balloon${per === 1 ? "" : "s"} a panel · words cover ${v.n("textShare")}%`);
  });

  /* Sound words drawn on the page: how big, what style and color, tilted, boxed or woven into the art. */
  W.look("soundLettering", (v, k) => {
    const mode = v("setting");
    const size = v.n("size") / 5;
    const style = v("style");
    const col = { black: "#1c1712", red: "#d62828", yellow: "#ffd166", blue: "#3a86ff" }[v("soundColor")] || "#1c1712";
    const inP = v("inPicture");
    const spread = v("spread");
    const tilt = v.n("letterTilt");
    let out = k.bg(BG) + rect(8, 10, 304, 132, PAPER, { stroke: "#888" });
    for (let i = 0; i < 3; i++) out += box(14 + i * 99, 16, 94, 120, { fill: "#e9e2d0" });
    out += fig(k, 61, 130, 1.2, { arms: 0.6 }) + rect(150, 70, 30, 40, "#a08060", { stroke: INK }) + fig(k, 259, 130, 1.2, { mood: -0.6, eyes: 1 });
    /* the main sound word */
    const span = spread === "a whole page" ? 3 : spread === "two panels" ? 2 : 1;
    const want = (mode === "page-sized" ? 46 : mode === "small" ? 16 : 26) * (0.6 + size * 0.8) * (0.7 + span * 0.3);
    /* keep the word inside the panels it spans and the frame's height */
    const shownTilt = tilt * 0.6; /* drawn a little gentler so a big word still fits */
    const tr = (Math.abs(shownTilt) * Math.PI) / 180;
    const wk = style === "explosive" ? 3.7 : 3.2; /* word width per font size (bold, spaced letters run wide) */
    const fs = Math.min(want, (span * 99 - 10) / (wk * Math.cos(tr) + Math.sin(tr)), 124 / (wk * Math.sin(tr) + Math.cos(tr)), 70);
    const cx = 14 + (span * 99) / 2;
    const cy = 16 + (wk * fs * Math.sin(tr) + fs * Math.cos(tr)) / 2 + fs * 0.35;
    const op = mode === "none" ? 0.3 : 1;
    let word = "";
    if (style === "explosive") word += star(cx, cy - fs * 0.3, Math.min(fs * 0.9 + 6, 56), "#ffffff", 10, 0.6);
    const tx = k.text({ x: cx, y: cy, text: "KRAK", size: fs, color: col, weight: style === "clean" ? 600 : 900, italic: style === "hand-drawn", outline: style === "explosive" ? INK : style === "hand-drawn" ? INK : null, outlineW: style === "explosive" ? 3 : 1, spacing: style === "explosive" ? 2 : 0 });
    if (inP === "in a box") word += rect(cx - fs * 1.5, cy - fs * 0.9, fs * 3, fs * 1.2, "#fff", { stroke: INK, sw: 1.5 });
    word += tx;
    out += `<g opacity="${op}" transform="rotate(${r1(shownTilt)} ${r1(cx)} ${r1(cy)})">${word}</g>`;
    if (inP === "woven into the art") out += fig(k, 61, 130, 1.2, { arms: 0.6 }) + rect(150, 70, 30, 40, "#a08060", { stroke: INK, op: 0.9 });
    /* the smaller sound words elsewhere on the page */
    const sp = v.n("soundsPerPage");
    const extras = ["tak", "fwip", "thud", "clik", "vrrm", "pok", "zing", "bonk", "whup", "tsss"];
    const hw = (wk * fs * Math.cos(tr) + fs * Math.sin(tr)) / 2 + 6;
    const hh = (wk * fs * Math.sin(tr) + fs * Math.cos(tr)) / 2 + 4;
    const wcy = cy - fs * 0.35;
    const slots = [];
    [30, 128, 112, 76].forEach((y, r) => [0, 1, 2].forEach((pi) => [20, 76].forEach((dx) => slots.push([14 + pi * 99 + dx, y]))));
    const free = slots.filter(([x, y]) => Math.abs(x - cx) > hw || Math.abs(y - wcy) > hh);
    /* only where the big word is not: past that, the count under the page still says how many */
    for (let i = 1; i < Math.min(sp, free.length + 1); i++) { const [x, y] = free[i - 1]; out += k.text({ x, y, text: extras[i % 10], size: 9, color: col, weight: 700, italic: style === "hand-drawn", alpha: op }); }
    out += tag(k, 160, 154, `${sp} sound word${sp === 1 ? "" : "s"} on the page`, "#aaa");
    out += k.label({ x: 312, y: 12, text: `size ${v.n("size")}/5`, size: 7, color: "#ddd", anchor: "end" });
    return out + cap(k, `${mode} · ${style} · ${v("soundColor")} · ${inP} · ${spread} · tilt ${tilt}°`);
  });

  /* Dot-grid controls: one extra pad for curiosities that had none, pairing two settings that belong together. */
  const pad = (id, x, y, xLabel, yLabel) => {
    const g = W.get(id);
    if (g && (g.faces || []).some((f) => f.face === "pad")) return;
    W.add(id, { window: { faces: [{ face: "pad", x, y, xLabel, yLabel }] } });
  };
  pad("pageTurn", "lastPanelSize", "revealSize", "Bigger last panel", "Bigger reveal");
  pad("panelCount", "setting", "rowCount", "More panels", "More rows");
  pad("gutter", "width", "gutterSlant", "Wider gutter", "Slanted more");
  pad("balloon", "balloonAcross", "size", "Further right", "Bigger balloon");
  pad("panelBreak", "howMuch", "breaksPerPage", "Breaks further", "More per page");
  pad("textDensity", "words", "textShare", "More words", "More of the panel");
  pad("soundLettering", "letterTilt", "size", "Tilted more", "Bigger");
})(typeof window !== "undefined" ? window.CuriosityWindows : require("./windows.js"));
