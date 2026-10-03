/* Print: the board strip, or the whole Storyboard, drawn as printable pages, after Maya's Render settings
   (Toon shader and outlines, render layers, image size and formats, batch render to frames).
   Layouts: comic strip (4 across), comic page (2x3), zine (8 pages folded from one sheet, with fold
   and cut guides and the right imposition) and a storyboard sheet with shot notes.
   Source: My film (the board's panels) or the Storyboard (storyboard.js: every scene, or one), split into as
   many pages as it needs, a scene never sharing a page. Each panel can carry its plain-word caption (the
   curiosities that are on). Download one page or every page as PNG, or "Printable page": the pages go into
   a print-only part of this page and the browser's print dialog opens, so "Save as PDF" makes a PDF.
   Curiosities: renderStyle, lineWeight, saturation. The default look comes from the Shading tool. */

(function () {
  if (!window.CuriosityStudio) return;
  const KEY = "curiosities-studio-print-v1";
  const SHADING_KEY = "curiosities-studio-shading-v1";
  const LAYOUTS = { strip: "Comic strip (4 across)", page: "Comic page (2 x 3)", zine: "Zine (8 pages, one sheet)", board: "Storyboard sheet" };
  /* [width, height] in inches, or pixels when px is true */
  const SIZES = { letter: { label: "Letter 8.5 x 11 in", w: 8.5, h: 11 }, a4: { label: "A4 210 x 297 mm", w: 8.27, h: 11.69 }, square: { label: "Square social 1080 px", w: 1080, h: 1080, px: true }, wide: { label: "16:9 1920 x 1080 px", w: 1920, h: 1080, px: true } };
  const STYLES = ["toon", "flat", "painterly", "photoreal"];
  const LINES = ["none", "thin", "heavy"];
  const LOOKS = {
    "Comic ink": { style: "toon", line: "heavy", sat: 2, bands: 2, halftone: false, paper: "#fffdf6" },
    "Zine xerox": { style: "flat", line: "heavy", sat: 0, bands: 2, halftone: true, paper: "#f4f1ea" },
    "Storyboard pencil": { style: "flat", line: "thin", sat: 1, bands: 3, halftone: false, paper: "#ffffff" },
  };
  const LIGHT = { dusk: ["#e8945a", "#6b3b5a"], flat: ["#d8d4cc", "#a8a49c"], practical: ["#f2c46b", "#5a3a22"], hard: ["#f6f2e8", "#1c1712"], moon: ["#8fa6cf", "#1d2a4a"] };
  const SKIN = ["#e8b48f", "#b77a52", "#8a5634", "#f0c9a8"];
  const CLOTH = ["#3b6ea8", "#b0412e", "#3f7d4f", "#7a4f9a", "#c08a2a"];

  const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);
  function rgb(hex) {
    const n = parseInt(String(hex).replace("#", ""), 16) || 0;
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  /* Saturation 0 to 5, 3 neutral; k is a band brightness factor. */
  function col(hex, L, k) {
    let [r, g, b] = rgb(hex).map((c) => c * (k == null ? 1 : k));
    const y = 0.3 * r + 0.59 * g + 0.11 * b;
    const s = L.sat / 3;
    [r, g, b] = [r, g, b].map((c) => Math.round(clamp(y + (c - y) * s, 0, 255)));
    return `rgb(${r},${g},${b})`;
  }

  function boardState() {
    let st = {};
    try {
      st = JSON.parse(localStorage.getItem("curiosities-board-v2") || "{}") || {};
    } catch (e) {}
    const B = window.CuriosityBoard;
    if (B && B.values) Object.assign(st, B.values());
    return st;
  }
  function shotOf(i, st) {
    if (st.shotSize) return st.shotSize;
    const fam = { coverage: ["wide", "medium", "close", "insert", "medium", "wide", "close", "medium"], oner: ["wide"], montage: ["insert", "close", "wide", "insert", "medium", "wide", "insert", "close"], handheld: ["medium", "close", "medium", "medium", "wide", "close", "medium", "wide"] }[st.angleFamily] || ["medium"];
    return fam[i % fam.length];
  }
  /* The panels: one per line of the board's scene, with the applied Shelf strand cycled per panel. */
  function panels(n) {
    const B = window.CuriosityBoard;
    const sc = B && B.scene ? B.scene() : { title: "Untitled", slug: "", people: ["A", "B"], lines: [{ who: "A", text: "Hello." }] };
    const base = boardState();
    const out = [];
    for (let i = 0; i < n; i++) {
      const st = Object.assign({}, base);
      if (base.applied && base.applied.values) Object.entries(base.applied.values).forEach(([id, vals]) => { const v = vals && vals.length ? vals[i % vals.length] : null; if (v != null && v !== "") st[id] = v; });
      const line = sc.lines[i % sc.lines.length];
      out.push({ i, st, line, shot: shotOf(i, st), people: sc.people.slice(0, clamp(Number(st.peopleCount) || 1, 1, 3)) });
    }
    return { scene: sc, list: out };
  }

  /* How many panels one page holds, per layout. */
  const PER_PAGE = { strip: 4, page: 6, board: 6, zine: 6 };
  function sbScenes() {
    try {
      const SB = window.CuriosityStoryboard;
      return SB && SB.data ? SB.data().scenes || [] : [];
    } catch (e) {
      return [];
    }
  }
  function sbCaption(p, prev, max) {
    try {
      const SB = window.CuriosityStoryboard;
      return SB && SB.caption ? SB.caption(p, prev, max) : "";
    } catch (e) {
      return "";
    }
  }
  /* The pages to print: [{scene: {title, slug}, list: [panel], label}], one scene per page or more. */
  function chunks(s) {
    const per = PER_PAGE[s.layout] || 6;
    const scenes = s.source === "storyboard" ? sbScenes() : [];
    if (!scenes.length) {
      const { scene, list } = panels(s.layout === "zine" ? 6 : s.layout === "strip" ? 4 : 6);
      list.forEach((P) => (P.caption = ""));
      return [{ scene, list, label: "", fill: false }];
    }
    const base = boardState();
    const out = [];
    const pick = s.scene === "all" || s.scene == null || !scenes[Number(s.scene)] ? scenes.map((x, i) => i) : [Number(s.scene)];
    pick.forEach((si) => {
      const sc = scenes[si];
      const people = ((sc.board && sc.board.people) || []).map((w) => (typeof w === "string" ? w : (w && w.name) || "")).filter(Boolean);
      const list = sc.panels.map((p, pi) => {
        const st = Object.assign({}, base, p.v || {});
        const line = p.line || { who: "", text: "" };
        const ppl = people.length ? people.slice(0, clamp(Number(st.peopleCount) || 1, 1, 3)) : [line.who || "A"];
        return { i: pi, st, line, shot: shotOf(pi, st), people: ppl, caption: sbCaption(p, pi > 0 ? sc.panels[pi - 1] : null, 3) };
      });
      const pagesHere = Math.max(1, Math.ceil(list.length / per));
      for (let k = 0; k < pagesHere; k++)
        out.push({
          scene: { title: `${si + 1}. ${sc.name || "Scene " + (si + 1)}`, slug: (sc.board && sc.board.slug) || sc.note || "" },
          list: list.slice(k * per, (k + 1) * per),
          label: pagesHere > 1 ? `part ${k + 1} of ${pagesHere}` : "",
          fill: true,
        });
    });
    return out;
  }

  /* ---------- drawing ---------- */
  function wrap(ctx, text, maxW) {
    const words = String(text).split(/\s+/);
    const lines = [];
    let cur = "";
    words.forEach((w) => {
      const t = cur ? cur + " " + w : w;
      if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t;
    });
    if (cur) lines.push(cur);
    return lines;
  }
  function lw(L, u) {
    return L.line === "heavy" ? 3.2 * u : L.line === "thin" ? 1.2 * u : 0;
  }
  function halftone(ctx, x, y, w, h, u, color, density) {
    ctx.fillStyle = color;
    const step = 5 * u;
    const r = step * 0.45 * density;
    for (let yy = y; yy < y + h + step; yy += step) for (let xx = x + ((yy / step) % 2 ? step / 2 : 0); xx < x + w + step; xx += step) {
      ctx.beginPath();
      ctx.arc(xx, yy, r, 0, 6.283);
      ctx.fill();
    }
  }
  /* Fill a path in shaded bands: lit on the key side, dark away from it (or halftone dots). */
  function shadeShape(ctx, path, bx, by, bw, bh, hex, L, u, keyRight) {
    ctx.save();
    ctx.fill(path);
    ctx.clip(path);
    if (L.style === "flat") { ctx.restore(); return; }
    if (L.style === "photoreal" || L.style === "painterly") {
      const g = ctx.createLinearGradient(keyRight ? bx + bw : bx, by, keyRight ? bx : bx + bw, by + bh);
      g.addColorStop(0, "rgba(255,255,255,0.25)");
      g.addColorStop(1, "rgba(0,0,0,0.45)");
      ctx.fillStyle = g;
      ctx.fillRect(bx, by, bw, bh);
      if (L.style === "painterly") {
        for (let k = 0; k < 40; k++) {
          const px = bx + ((k * 37) % 100) / 100 * bw, py = by + ((k * 61) % 100) / 100 * bh;
          ctx.fillStyle = k % 2 ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)";
          ctx.fillRect(px, py, 7 * u, 2.5 * u);
        }
      }
      ctx.restore();
      return;
    }
    // toon: bands - 1 shadow steps across the shape away from the key
    for (let b = 1; b < L.bands; b++) {
      const f = b / L.bands;
      const x0 = keyRight ? bx : bx + bw - bw * (1 - f + 0.1);
      if (L.halftone) halftone(ctx, x0, by, bw * (1 - f + 0.1), bh, u, col("#1c1712", L), 0.35 + 0.25 * b);
      else { ctx.fillStyle = `rgba(0,0,0,${0.18})`; ctx.fillRect(x0, by, bw * (1 - f + 0.1), bh); }
    }
    ctx.restore();
  }

  function figure(ctx, cx, footY, H, idx, L, u, keyRight, headOnly) {
    const skin = SKIN[idx % SKIN.length], cloth = CLOTH[idx % CLOTH.length];
    const hr = headOnly ? H * 0.32 : H * 0.11;
    const headY = headOnly ? footY - H * 0.55 : footY - H + hr;
    const body = new Path2D();
    if (headOnly) {
      body.ellipse(cx, footY + H * 0.05, H * 0.55, H * 0.4, 0, Math.PI, 0);
      body.closePath();
    } else {
      const sw = H * 0.17, top = headY + hr * 1.05;
      body.moveTo(cx - sw, top + sw * 0.5);
      body.quadraticCurveTo(cx - sw, top, cx, top);
      body.quadraticCurveTo(cx + sw, top, cx + sw, top + sw * 0.5);
      body.lineTo(cx + sw * 0.75, footY);
      body.lineTo(cx - sw * 0.75, footY);
      body.closePath();
    }
    const bb = headOnly ? [cx - H * 0.55, footY - H * 0.35, H * 1.1, H * 0.45] : [cx - H * 0.17, headY, H * 0.34, footY - headY];
    ctx.fillStyle = col(cloth, L);
    shadeShape(ctx, body, bb[0], bb[1], bb[2], bb[3], cloth, L, u, keyRight);
    const head = new Path2D();
    head.ellipse(cx, headY, hr * 0.85, hr, 0, 0, 6.283);
    ctx.fillStyle = col(skin, L);
    shadeShape(ctx, head, cx - hr, headY - hr, hr * 2, hr * 2, skin, L, u, keyRight);
    if (lw(L, u)) {
      ctx.lineWidth = lw(L, u);
      ctx.strokeStyle = "#1c1712";
      ctx.stroke(body);
      ctx.stroke(head);
    }
    if (headOnly) {
      ctx.fillStyle = "#1c1712";
      [-1, 1].forEach((s) => { ctx.beginPath(); ctx.arc(cx + s * hr * 0.32, headY - hr * 0.05, Math.max(1.2 * u, hr * 0.06), 0, 6.283); ctx.fill(); });
    }
    return { x: cx, y: headY - hr };
  }

  function drawPanel(ctx, x, y, w, h, P, L, u) {
    const st = P.st;
    const [litHex, darkHex] = LIGHT[st.lighting] || LIGHT.flat;
    const keyRight = P.i % 2 === 0;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    // background in light bands
    const bands = L.style === "toon" ? L.bands : L.style === "flat" ? 1 : 12;
    for (let b = 0; b < bands; b++) {
      const t = bands === 1 ? 0.35 : b / (bands - 1);
      const k = 1 - t * 0.55;
      ctx.fillStyle = col(t < 0.5 ? litHex : darkHex, L, t < 0.5 ? k : 0.6 + 0.4 * k);
      ctx.fillRect(x, y + (h * b) / bands, w, h / bands + 1);
    }
    if (L.halftone && L.style !== "photoreal") halftone(ctx, x, y + h * 0.5, w, h * 0.5, u, "rgba(28,23,18,0.35)", 0.6);
    // camera: dutch and handheld tilt the whole frame
    const tilt = (st.dutch === "tilted" ? -0.14 : 0) + (st.cameraCarry === "handheld" ? (P.i % 2 ? 0.04 : -0.035) : 0);
    ctx.translate(x + w / 2, y + h / 2);
    ctx.rotate(tilt);
    ctx.translate(-(x + w / 2), -(y + h / 2));
    const floorY = y + h * 0.8;
    ctx.strokeStyle = "rgba(28,23,18,0.35)";
    ctx.lineWidth = Math.max(1, u);
    ctx.beginPath();
    ctx.moveTo(x - w, floorY);
    ctx.lineTo(x + 2 * w, floorY);
    ctx.stroke();
    let speaker = null;
    const n = P.people.length;
    if (P.shot === "insert") {
      // the object, big
      const ow = w * 0.3, oh = h * 0.42, ox = x + w / 2 - ow / 2, oy = y + h * 0.42;
      const cup = new Path2D();
      cup.moveTo(ox, oy);
      cup.lineTo(ox + ow, oy);
      cup.lineTo(ox + ow * 0.85, oy + oh);
      cup.lineTo(ox + ow * 0.15, oy + oh);
      cup.closePath();
      ctx.fillStyle = col("#9fb8c9", L);
      shadeShape(ctx, cup, ox, oy, ow, oh, "#9fb8c9", L, u, keyRight);
      if (lw(L, u)) { ctx.lineWidth = lw(L, u); ctx.strokeStyle = "#1c1712"; ctx.stroke(cup); }
      speaker = null; // the voice is off screen in an insert
    } else if (P.shot === "close") {
      speaker = figure(ctx, x + w * (keyRight ? 0.45 : 0.55), y + h * 1.02, h * 0.95, P.i, L, u, keyRight, true);
    } else {
      const H = P.shot === "wide" ? h * 0.42 : h * 0.95;
      const foot = P.shot === "wide" ? floorY : y + h * 1.25;
      for (let k = 0; k < n; k++) {
        const cx = x + w * ((k + 1) / (n + 1)) + (P.shot === "medium" ? (k - (n - 1) / 2) * w * 0.05 : 0);
        const hd = figure(ctx, cx, foot, H, P.i + k, L, u, keyRight, false);
        if (P.people[k] === P.line.who || (!speaker && k === n - 1)) speaker = hd;
      }
    }
    ctx.restore();
    // move arrow
    const mv = st.cameraMove;
    if (mv && mv !== "none") {
      ctx.fillStyle = "rgba(28,23,18,0.8)";
      ctx.font = `${9 * u}px monospace`;
      const sym = { pan: "<->", tilt: "^v", "push in": "> <", "pull out": "< >", track: "->", crane: "^", zoom: "[+]", orbit: "(O)" }[mv] || mv;
      ctx.fillText(sym, x + 5 * u, y + h - 6 * u);
    }
    // speech balloon
    const text = `${P.line.who}: ${P.line.text}`;
    const fs = clamp(Math.round(w / 22), 8 * u, 15 * u);
    ctx.font = `${fs}px system-ui, sans-serif`;
    const lines = wrap(ctx, text, w * 0.78).slice(0, 4);
    const bw = Math.min(w * 0.88, Math.max(...lines.map((l) => ctx.measureText(l).width)) + fs * 1.2);
    const bh = lines.length * fs * 1.2 + fs * 0.7;
    const bx = keyRight ? x + w - bw - 6 * u : x + 6 * u, by = y + 6 * u;
    ctx.fillStyle = "#fff";
    ctx.strokeStyle = "#1c1712";
    ctx.lineWidth = Math.max(1.2 * u, lw(L, u) * 0.7);
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(bx, by, bw, bh, fs * 0.6); else ctx.rect(bx, by, bw, bh);
    ctx.fill();
    ctx.stroke();
    if (speaker) {
      const tx = clamp(speaker.x, bx + fs, bx + bw - fs);
      ctx.beginPath();
      ctx.moveTo(tx - fs * 0.4, by + bh - 1);
      ctx.lineTo(clamp(speaker.x, x, x + w), Math.max(by + bh + fs * 0.8, Math.min(speaker.y - 2 * u, by + bh + fs * 1.6)));
      ctx.lineTo(tx + fs * 0.4, by + bh - 1);
      ctx.fill();
      ctx.stroke();
      ctx.fillRect(tx - fs * 0.4 + 1, by + bh - ctx.lineWidth - 1, fs * 0.8 - 2, ctx.lineWidth + 2);
    }
    ctx.fillStyle = "#1c1712";
    lines.forEach((l, k) => ctx.fillText(l, bx + fs * 0.6, by + fs * 1.05 + k * fs * 1.2));
    // the plain-word caption: a comic narration box along the bottom
    if (P.caption && P.showCap) {
      const cf = clamp(Math.round(w / 30), 7 * u, 12 * u);
      ctx.font = `${cf}px system-ui, sans-serif`;
      const cl = wrap(ctx, P.caption, w - cf * 2).slice(0, 2);
      const ch = cl.length * cf * 1.2 + cf * 0.6;
      ctx.fillStyle = "#fff1c9";
      ctx.fillRect(x, y + h - ch, w, ch);
      ctx.strokeStyle = "#1c1712";
      ctx.lineWidth = Math.max(1, 1.2 * u);
      ctx.strokeRect(x, y + h - ch, w, ch);
      ctx.fillStyle = "#1c1712";
      cl.forEach((l, k) => ctx.fillText(l, x + cf * 0.6, y + h - ch + cf * 1.05 + k * cf * 1.2));
    }
    // frame
    ctx.strokeStyle = "#1c1712";
    ctx.lineWidth = Math.max(1.5 * u, lw(L, u) * 1.2);
    ctx.strokeRect(x, y, w, h);
  }

  function notes(ctx, x, y, w, P, u) {
    const st = P.st;
    ctx.fillStyle = "#1c1712";
    const fs = clamp(Math.round(w / 26), 7 * u, 12 * u);
    ctx.font = `bold ${fs}px monospace`;
    ctx.fillText(`SC ${String(P.i + 1).padStart(2, "0")} · ${P.shot.toUpperCase()}`, x, y + fs);
    ctx.font = `${fs}px monospace`;
    const rows = [`Move: ${st.cameraMove || "none"} · ${st.cameraCarry || "smooth"}`, `Light: ${st.lighting || "flat"}`, `People: ${P.people.join(", ")}`];
    rows.forEach((r, k) => wrap(ctx, r, w).slice(0, 1).forEach((l) => ctx.fillText(l, x, y + fs * (2.3 + k * 1.25))));
    return fs * 6;
  }

  /* Page size in pixels at the chosen DPI, with orientation chosen per layout. */
  function pageSize(s) {
    const z = SIZES[s.size] || SIZES.letter;
    let w = z.px ? z.w : Math.round(z.w * s.dpi), h = z.px ? z.h : Math.round(z.h * s.dpi);
    const land = s.layout === "strip" || s.layout === "zine";
    if (!z.px && land !== w > h) [w, h] = [h, w];
    return [w, h];
  }

  function renderPage(canvas, s, L, chunk) {
    const [W, H] = pageSize(s);
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    const u = Math.min(W, H) / 600;
    ctx.fillStyle = L.paper;
    ctx.fillRect(0, 0, W, H);
    const m = Math.round(Math.min(W, H) * 0.05);
    const gut = Math.round(m * 0.35);
    const titleFs = Math.round(16 * u);
    const ch0 = chunk || chunks(s)[0];
    const scene = ch0.scene;
    const list = ch0.list.map((P) => Object.assign({}, P, { showCap: s.captions !== false }));
    /* A storyboard page keeps its panel size when the scene's last page is short. */
    const slots = ch0.fill ? PER_PAGE[s.layout] || list.length : list.length;
    const title = () => {
      ctx.fillStyle = "#1c1712";
      ctx.font = `bold ${titleFs}px system-ui, sans-serif`;
      ctx.fillText(scene.title + (ch0.label ? ` (${ch0.label})` : ""), m, m * 0.6 + titleFs * 0.6);
      ctx.font = `${Math.round(titleFs * 0.6)}px monospace`;
      ctx.fillText(`${scene.slug || ""}  ·  ${L.style}, ink ${L.line}, saturation ${L.sat}`, m, m * 0.6 + titleFs * 1.5);
    };
    if (s.layout === "strip" || s.layout === "page") {
      title();
      const top = m + titleFs * 1.8;
      const cols = s.layout === "strip" ? Math.min(4, W > H ? 4 : 2) : 2;
      const rows = Math.ceil(slots / cols);
      const pw = (W - 2 * m - gut * (cols - 1)) / cols;
      let ph = (H - top - m - gut * (rows - 1)) / rows;
      let y0 = top;
      if (s.layout === "strip") { ph = Math.min(ph, pw * 1.1); y0 = Math.max(top, (H - rows * ph - gut * (rows - 1)) / 2); }
      list.forEach((P, k) => drawPanel(ctx, m + (k % cols) * (pw + gut), y0 + Math.floor(k / cols) * (ph + gut), pw, ph, P, L, u));
    } else if (s.layout === "board") {
      title();
      const top = m + titleFs * 1.8;
      const cols = W > H ? 3 : 2, rows = Math.ceil(slots / cols);
      const pw = (W - 2 * m - gut * (cols - 1)) / cols;
      const cell = (H - top - m - gut * (rows - 1)) / rows;
      const nh = Math.min(cell * 0.32, 80 * u);
      const ph = Math.min(cell - nh, pw * 0.5625);
      list.forEach((P, k) => {
        const x = m + (k % cols) * (pw + gut), y = top + Math.floor(k / cols) * (cell + gut);
        drawPanel(ctx, x, y, pw, ph, P, L, u);
        notes(ctx, x, y + ph + 3 * u, pw, P, u);
      });
    } else {
      // zine: a landscape sheet, 4 x 2 cells. Top row upside down: 5 4 3 2; bottom row: 6 7 8 1.
      const cw = W / 4, ch = H / 2;
      const order = [[5, 4, 3, 2], [6, 7, 8, 1]];
      const pm = Math.round(cw * 0.07);
      order.forEach((row, r) =>
        row.forEach((pg, c) => {
          ctx.save();
          const cx = c * cw, cy = r * ch;
          if (r === 0) { ctx.translate(cx + cw, cy + ch); ctx.rotate(Math.PI); } else ctx.translate(cx, cy);
          zinePage(ctx, pg, cw, ch, pm, scene, list, L, u * 0.75);
          ctx.restore();
        })
      );
      if (s.guides) {
        ctx.save();
        ctx.strokeStyle = "rgba(28,23,18,0.45)";
        ctx.lineWidth = Math.max(1, u);
        ctx.setLineDash([6 * u, 5 * u]);
        for (let c = 1; c < 4; c++) { ctx.beginPath(); ctx.moveTo(c * cw, 0); ctx.lineTo(c * cw, H); ctx.stroke(); }
        ctx.beginPath(); ctx.moveTo(0, ch); ctx.lineTo(cw, ch); ctx.moveTo(3 * cw, ch); ctx.lineTo(W, ch); ctx.stroke();
        ctx.setLineDash([]);
        ctx.strokeStyle = "#b23a1f";
        ctx.lineWidth = Math.max(1.5, 1.6 * u);
        ctx.beginPath(); ctx.moveTo(cw, ch); ctx.lineTo(3 * cw, ch); ctx.stroke();
        ctx.fillStyle = "#b23a1f";
        ctx.font = `${Math.round(8 * u)}px monospace`;
        ctx.fillText("cut along the red line · dashed lines are folds", cw + 6 * u, ch - 4 * u);
        ctx.restore();
      }
    }
  }

  function zinePage(ctx, pg, w, h, pm, scene, list, L, u) {
    ctx.fillStyle = "#1c1712";
    const fs = Math.round(Math.max(7, 11 * u));
    if (pg === 1) {
      ctx.font = `bold ${Math.round(fs * 1.8)}px system-ui, sans-serif`;
      wrap(ctx, scene.title, w - 2 * pm).forEach((l, k) => ctx.fillText(l, pm, pm + fs * 2 + k * fs * 2));
      ctx.font = `${fs}px monospace`;
      ctx.fillText(scene.slug || "", pm, h - pm);
      drawPanel(ctx, pm, h * 0.32, w - 2 * pm, h * 0.48, list[0], L, u);
    } else if (pg === 8) {
      ctx.font = `bold ${fs}px monospace`;
      ctx.fillText("THE LOOK", pm, pm + fs);
      ctx.font = `${fs}px monospace`;
      [`renderStyle ${L.style}`, `lineWeight ${L.line}`, `saturation ${L.sat}`, `bands ${L.bands}`, `halftone ${L.halftone ? "on" : "off"}`, "", "Made on the Curiosities board."].forEach((t, k) => ctx.fillText(t, pm, pm + fs * (2.6 + k * 1.4)));
    } else {
      const P = list[(pg - 2) % list.length];
      drawPanel(ctx, pm, pm, w - 2 * pm, h - 2 * pm - fs * 1.6, P, L, u);
      ctx.fillStyle = "#1c1712";
      ctx.font = `${fs}px monospace`;
      ctx.fillText(String(pg), w / 2 - fs * 0.3, h - pm * 0.6);
    }
  }

  function css() {
    if (document.getElementById("studio-print")) return;
    const st = document.createElement("style");
    st.id = "studio-print";
    st.textContent = `
      .prt-view { width: 100%; height: auto; display: block; border: 1px solid var(--line); background: white; box-shadow: 0 2px 10px rgba(0,0,0,0.12); }
      .prt-tool select, .prt-tool input[type=range] { max-width: 100%; }
      .prt-prox li { font-size: 13px; }
      .prt-prox .holds { color: #2c7a3f; font-weight: 600; }
      .prt-prox .no { color: #b23a1f; font-weight: 600; }
      .prt-pages { display: flex; align-items: center; gap: 8px; margin: 0 0 6px; font-family: var(--mono); font-size: 12px; }
      .prt-pages button { min-width: 40px; }
    `;
    document.head.appendChild(st);
  }

  function draw(el, api) {
    css();
    const esc = api.esc;
    const st = api.store(KEY);
    const shade = api.store(SHADING_KEY).get(null);
    const fromShading = shade ? { style: STYLES.includes(shade.look) ? shade.look : "toon", line: LINES.includes(shade.line) ? shade.line : "thin", sat: Number.isFinite(shade.sat) ? shade.sat : 3, bands: clamp(Number(shade.bands) || 2, 2, 4) } : {};
    const s = Object.assign({ layout: "strip", size: "letter", dpi: 150, guides: true, source: "board", scene: "all", page: 0, captions: true, look: Object.assign({ style: "toon", line: "thin", sat: 3, bands: 3, halftone: false, paper: "#fffdf6" }, fromShading) }, st.get({}));
    const L = s.look;
    if (s.layout === "zine" && L.halftone == null) L.halftone = true;
    const save = () => st.set(s);
    const opts = (obj, v) => Object.entries(obj).map(([k, l]) => `<option value="${esc(k)}" ${k === v ? "selected" : ""}>${esc(l)}</option>`).join("");
    const list = (arr, v) => arr.map((k) => `<option ${k === v ? "selected" : ""}>${esc(k)}</option>`).join("");
    const sizesL = {};
    Object.entries(SIZES).forEach(([k, z]) => (sizesL[k] = z.label));
    const scenes = sbScenes();
    if (s.source === "storyboard" && !scenes.length) s.source = "board";
    const nPanels = scenes.reduce((n, x) => n + x.panels.length, 0);
    const sceneOpts = `<option value="all" ${s.scene === "all" ? "selected" : ""}>Every scene</option>` + scenes.map((x, i) => `<option value="${i}" ${String(s.scene) === String(i) ? "selected" : ""}>${i + 1}. ${esc(x.name || "Scene " + (i + 1))} (${x.panels.length} panels)</option>`).join("");
    el.innerHTML = `<div class="studio-grid prt-tool">
      <div>
        <label class="field">Print from<select data-s="source">
          <option value="board" ${s.source === "board" ? "selected" : ""}>My film (the board)</option>
          <option value="storyboard" ${s.source === "storyboard" ? "selected" : ""} ${scenes.length ? "" : "disabled"}>Storyboard${scenes.length ? ` (${scenes.length} scene${scenes.length === 1 ? "" : "s"}, ${nPanels} panels)` : " (save a scene there first)"}</option>
        </select></label>
        ${s.source === "storyboard" ? `<label class="field">Scenes<select data-s="scene">${sceneOpts}</select></label>
        <label class="field"><span><input type="checkbox" data-s="captions" ${s.captions !== false ? "checked" : ""}> Captions: what is on, in plain words</span></label>` : ""}
        <label class="field">Layout<select data-s="layout">${opts(LAYOUTS, s.layout)}</select></label>
        <label class="field">Image size<select data-s="size">${opts(sizesL, s.size)}</select></label>
        <label class="field">DPI (paper sizes)<select data-s="dpi">${list(["72", "150", "300"], String(s.dpi))}</select></label>
        <label class="field"><span><input type="checkbox" data-s="guides" ${s.guides ? "checked" : ""}> Fold and cut guides (zine)</span></label>
        <p class="cap">Look, as in Arnold's Toon shader${shade ? " (default read from the Shading tool)" : ""}</p>
        <p>${Object.keys(LOOKS).map((k) => `<button type="button" class="chip suite" data-look="${esc(k)}">${esc(k)}</button>`).join(" ")}</p>
        <label class="field">Render style<select data-l="style">${list(STYLES, L.style)}</select></label>
        <label class="field">Toon bands <b>${L.bands}</b><input type="range" min="2" max="4" step="1" data-l="bands" value="${L.bands}"></label>
        <label class="field">Ink line<select data-l="line">${list(LINES, L.line)}</select></label>
        <label class="field"><span><input type="checkbox" data-l="halftone" ${L.halftone ? "checked" : ""}> Halftone dots for shadows</span></label>
        <label class="field">Saturation (3 is neutral) <b>${L.sat}</b><input type="range" min="0" max="5" step="1" data-l="sat" value="${L.sat}"></label>
        <label class="field">Paper color<input type="color" data-l="paper" value="${esc(L.paper)}"></label>
      </div>
      <div>
        <div class="prt-pages"><button type="button" data-act="prev" aria-label="Previous page">◀</button> <span id="prt-pageno"></span> <button type="button" data-act="next" aria-label="Next page">▶</button></div>
        <canvas class="prt-view" aria-label="Printable page preview"></canvas>
        <p id="prt-chips"></p>
        <ul class="prt-prox" id="prt-prox"></ul>
        <div class="bar-actions">
          <button type="button" data-act="png">Download this page (PNG)</button>
          <button type="button" data-act="all">Download every page (PNG)</button>
          <button type="button" data-act="printable">Printable page (print or save as PDF)</button>
          <button type="button" data-act="frames">Download each panel</button>
          <button type="button" data-act="shelf">Keep on Shelf</button>
          <button type="button" data-act="redraw">Redraw from the board</button>
        </div>
        <p class="cap" id="prt-size"></p>
        <p class="cap">${s.source === "storyboard" ? "The panels are the Storyboard's, each with the values it was saved with. A scene starts on a new page." : "The panels are the board's scene, one per line, with any Shelf strand applied panel by panel. Change the board and press Redraw."} Printable page opens your browser's print window; choose "Save as PDF" there to keep a PDF.</p>
      </div></div>`;
    const canvas = el.querySelector(".prt-view");

    let pages = chunks(s);
    function current() {
      pages = chunks(s);
      s.page = clamp(Number(s.page) || 0, 0, pages.length - 1);
      return pages[s.page];
    }
    function preview() {
      const [W, H] = pageSize(s);
      const ch = current();
      el.querySelector("#prt-pageno").textContent = `Page ${s.page + 1} of ${pages.length}`;
      el.querySelector('[data-act="prev"]').disabled = s.page <= 0;
      el.querySelector('[data-act="next"]').disabled = s.page >= pages.length - 1;
      // the preview renders at 72 DPI equivalent for speed; the download uses the chosen DPI
      const ps = Object.assign({}, s, { dpi: 72 });
      renderPage(canvas, SIZES[s.size].px ? Object.assign(ps, {}) : ps, L, ch);
      if (SIZES[s.size].px && canvas.width > 1100) {
        const k = 1100 / canvas.width;
        const off = document.createElement("canvas");
        renderPage(off, s, L, ch);
        canvas.width = Math.round(off.width * k);
        canvas.height = Math.round(off.height * k);
        canvas.getContext("2d").drawImage(off, 0, 0, canvas.width, canvas.height);
      }
      el.querySelector("#prt-size").textContent = `Download: ${pages.length} page${pages.length === 1 ? "" : "s"}, each ${W} x ${H} px${SIZES[s.size].px ? "" : ` at ${s.dpi} DPI`}, PNG.`;
      el.querySelector("#prt-chips").innerHTML = [["renderStyle", L.style], ["lineWeight", L.line], ["saturation", L.sat]].map(([k, v]) => `<span class="chip">${esc(k)} ${esc(v)}</span>`).join("");
      const triggered = L.style === "toon";
      const holds = L.bands === 2 && L.line !== "none";
      el.querySelector("#prt-prox").innerHTML = `<li><span class="${!triggered ? "" : holds ? "holds" : "no"}">${!triggered ? "not triggered" : holds ? "holds" : "doesn't hold"}</span> When renderStyle becomes toon, lighting flattens to two bands and lineWeight rises (0 beats)</li>`;
    }
    function rerender() {
      save();
      preview();
    }
    el.querySelectorAll("[data-s]").forEach((x) =>
      x.addEventListener("change", () => {
        const k = x.dataset.s;
        s[k] = x.type === "checkbox" ? x.checked : k === "dpi" ? Number(x.value) : x.value;
        if (k === "source" || k === "scene" || k === "layout") s.page = 0;
        if (k === "source") {
          save();
          return draw(el, api);
        }
        rerender();
      })
    );
    el.querySelectorAll("[data-l]").forEach((x) =>
      x.addEventListener(x.type === "range" || x.type === "color" ? "input" : "change", () => {
        const k = x.dataset.l;
        L[k] = x.type === "checkbox" ? x.checked : x.type === "range" ? Number(x.value) : x.value;
        if (x.type === "range") x.parentElement.querySelector("b").textContent = x.value;
        rerender();
      })
    );
    el.querySelectorAll("[data-look]").forEach((b) =>
      b.addEventListener("click", () => {
        Object.assign(L, LOOKS[b.dataset.look]);
        save();
        draw(el, api);
      })
    );
    function download(c, name) {
      c.toBlob((blob) => {
        if (!blob) return;
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = name;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
      }, "image/png");
    }
    const fileBase = () => `curiosities-${s.source === "storyboard" ? "storyboard-" : ""}${s.layout}-${s.size}`;
    el.querySelector('[data-act="png"]').addEventListener("click", () => {
      const off = document.createElement("canvas");
      renderPage(off, s, L, current());
      download(off, `${fileBase()}${pages.length > 1 ? "-p" + String(s.page + 1).padStart(2, "0") : ""}.png`);
    });
    el.querySelector('[data-act="all"]').addEventListener("click", () => {
      current();
      pages.forEach((ch, k) =>
        setTimeout(() => {
          const off = document.createElement("canvas");
          renderPage(off, s, L, ch);
          download(off, `${fileBase()}-p${String(k + 1).padStart(2, "0")}.png`);
        }, k * 300)
      );
    });
    el.querySelector('[data-act="prev"]').addEventListener("click", () => {
      s.page = Math.max(0, s.page - 1);
      rerender();
    });
    el.querySelector('[data-act="next"]').addEventListener("click", () => {
      s.page = s.page + 1;
      rerender();
    });
    /* Printable page: every page as a picture in a print-only part of the document, then the print dialog. */
    el.querySelector('[data-act="printable"]').addEventListener("click", () => {
      current();
      const ps = Object.assign({}, s, { dpi: Math.min(150, Number(s.dpi) || 150) });
      const [W, H] = pageSize(ps);
      let box = document.getElementById("prt-printout");
      if (!box) {
        box = document.createElement("div");
        box.id = "prt-printout";
        box.setAttribute("aria-hidden", "true");
        document.body.appendChild(box);
      }
      let css = document.getElementById("prt-print-css");
      if (!css) {
        css = document.createElement("style");
        css.id = "prt-print-css";
        document.head.appendChild(css);
      }
      css.textContent = `
        #prt-printout { display: none; }
        @media print {
          @page { size: ${SIZES[s.size].px ? "auto" : (SIZES[s.size] === SIZES.a4 ? "A4 " : "letter ") + (W > H ? "landscape" : "portrait")}; margin: 0.25in; }
          html, body { background: #fff !important; }
          body > *:not(#prt-printout) { display: none !important; }
          #prt-printout { display: block !important; }
          #prt-printout img { display: block; width: 100%; height: auto; max-height: 99vh; object-fit: contain; margin: 0 auto; break-after: page; page-break-after: always; }
          #prt-printout img:last-child { break-after: auto; page-break-after: auto; }
        }`;
      box.innerHTML = "";
      const waits = pages.map((ch, k) => {
        const off = document.createElement("canvas");
        renderPage(off, ps, L, ch);
        const img = new Image();
        img.alt = `Page ${k + 1}`;
        img.src = off.toDataURL("image/png");
        box.appendChild(img);
        return img.decode ? img.decode().catch(() => {}) : Promise.resolve();
      });
      Promise.all(waits).then(() => window.print());
    });
    el.querySelector('[data-act="frames"]').addEventListener("click", () => {
      // batch render to frames: one PNG per panel at 16:9 (the panels of the page shown)
      const list = current().list.map((P) => Object.assign({}, P, { showCap: s.captions !== false }));
      list.forEach((P, k) => {
        const c = document.createElement("canvas");
        c.width = 1280;
        c.height = 720;
        const ctx = c.getContext("2d");
        ctx.fillStyle = L.paper;
        ctx.fillRect(0, 0, c.width, c.height);
        drawPanel(ctx, 0, 0, c.width, c.height, P, L, c.height / 360);
        setTimeout(() => download(c, `curiosities-panel-${String(k + 1).padStart(2, "0")}.png`), k * 250);
      });
    });
    el.querySelector('[data-act="shelf"]').addEventListener("click", () => {
      const n = s.layout === "strip" ? 4 : 6;
      api.toShelf("Print look", { renderStyle: Array(n).fill(L.style), lineWeight: Array(n).fill(L.line), saturation: Array(n).fill(L.sat) });
    });
    el.querySelector('[data-act="redraw"]').addEventListener("click", preview);
    preview();
  }

  window.CuriosityStudio.register({ id: "print", label: "Print", order: 70, maya: "Render: Toon shader and outlines, render layers, image size and formats, batch render to frames", draw });
})();
