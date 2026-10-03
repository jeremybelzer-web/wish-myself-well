/* Editing: the live picture at the top of each editing curiosity's window (CuriosityWindows.look).
   Most editing pictures are a little timeline (shots or scenes as colored blocks, left to right) under or
   beside a small "screen" that shows what the viewer sees. Every own setting moves something in the picture. */
(function (W) {
  const BG = "#141418";
  const PAL = ["#e07a5f", "#81b29a", "#f2cc8f", "#7fb7ff", "#c77dff", "#ef476f", "#06d6a0", "#ffd166"];
  const r1 = (n) => Math.round(n * 10) / 10;
  const line = (x1, y1, x2, y2, c, w, dash) => `<line x1="${r1(x1)}" y1="${r1(y1)}" x2="${r1(x2)}" y2="${r1(y2)}" stroke="${c || "#888"}" stroke-width="${w || 1.5}"${dash ? ` stroke-dasharray="${dash}"` : ""} stroke-linecap="round"/>`;
  const rect = (x, y, w, h, fill, o) => {
    o = o || {};
    return `<rect x="${r1(x)}" y="${r1(y)}" width="${r1(Math.max(0.5, w))}" height="${r1(Math.max(0.5, h))}"${o.rx ? ` rx="${o.rx}"` : ""} fill="${fill || "none"}"${o.stroke ? ` stroke="${o.stroke}" stroke-width="${o.sw || 1}"` : ""}${o.dash ? ` stroke-dasharray="${o.dash}"` : ""}${o.op != null ? ` opacity="${r1(o.op * 100) / 100}"` : ""}/>`;
  };
  const tag = (k, x, y, text, color, anchor, size) => k.label({ x, y, text, size: size || 8, color: color || "#aaa", anchor: anchor || "middle" });
  /* A row of blocks, widths in proportion to len. items: [{len, color, stroke, op, mark}] */
  function blocks(x, y, w, h, items, gap) {
    const tot = items.reduce((a, b) => a + Math.max(0, b.len), 0) || 1;
    let at = x;
    const g = gap == null ? 1.5 : gap;
    return items
      .map((it) => {
        const ww = (Math.max(0, it.len) / tot) * w;
        const s = rect(at, y, ww - g, h, it.color || "#6c8fb8", { stroke: it.stroke || "#0b0b0d", sw: it.sw || 1, op: it.op, dash: it.dash });
        it._x = at;
        it._w = ww;
        at += ww;
        return s;
      })
      .join("");
  }
  /* A whole 320x180 scene drawn small at (x, y), w wide, clipped to its frame. */
  const mini = (id, x, y, w, inner, stroke) =>
    `<g transform="translate(${r1(x)} ${r1(y)}) scale(${r1((w / 320) * 1000) / 1000})"><clipPath id="${id}"><rect x="0" y="0" width="320" height="180"/></clipPath><g clip-path="url(#${id})">${inner}</g><rect x="0" y="0" width="320" height="180" fill="none" stroke="${stroke || "#666"}" stroke-width="6"/></g>`;
  /* A film frame w by h at (x, y) holding a 320x180 drawing scaled to the frame's height and centred, clipped. */
  const cell = (id, x, y, w, h, inner, stroke) => {
    /* A frame wider than 16:9 fills its width and shows the middle band of the picture (around y 110). */
    const s = Math.max(h / 180, w / 320);
    const ty = Math.min(y, Math.max(y + h - 180 * s, y + h / 2 - 110 * s));
    return `<clipPath id="${id}"><rect x="${r1(x)}" y="${r1(y)}" width="${r1(Math.max(0.5, w))}" height="${r1(h)}"/></clipPath><g clip-path="url(#${id})"><g transform="translate(${r1(x + w / 2 - 160 * s)} ${r1(ty)}) scale(${r1(s * 1000) / 1000})">${inner}</g></g>` + rect(x, y, w, h, "none", { stroke: stroke || "#0b0b0d", sw: 1 });
  };
  /* The dark band and sprocket holes behind a strip of film frames. */
  const sprockets = (x, y, w, h) => {
    let o = rect(x - 2, y - 6, w + 4, h + 12, "#0b0b0d");
    for (let hx = x + 2; hx < x + w - 2; hx += 7) o += rect(hx, y - 4, 3, 2.5, "#4a4a52") + rect(hx, y + h + 1.5, 3, 2.5, "#4a4a52");
    return o;
  };
  /* A plain backdrop with a floor, for people inside a frame. */
  const set = (k, c) => rect(0, 0, 320, 180, c) + rect(0, 128, 320, 52, k.mix(c, "#000000", 0.45));
  const room = (k, o) => k.wall({ y: (o && o.y) || 125, color: (o && o.wall) || "#cdbfa8", floor: (o && o.floor) || "#7d6650" });
  const path = (pts, c, w, dash, fill) => `<path d="${pts.map((p, i) => (i ? "L" : "M") + r1(p[0]) + " " + r1(p[1])).join(" ")}" fill="${fill || "none"}" stroke="${c || "#ffd166"}" stroke-width="${w || 2}"${dash ? ` stroke-dasharray="${dash}"` : ""} stroke-linejoin="round" stroke-linecap="round"/>`;
  const star = (x, y, r, c, n) => {
    n = n || 8;
    const p = [];
    for (let i = 0; i < n * 2; i++) {
      const a = (i / (n * 2)) * Math.PI * 2;
      const rr = i % 2 ? r * 0.45 : r;
      p.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]);
    }
    return path(p.concat([p[0]]), "#0b0b0d", 1, null, c || "#ffd166");
  };
  const axis = (k, x, y, w, l, r) => line(x, y, x + w, y, "#555", 1) + (l ? tag(k, x, y + 9, l, "#888", "start", 7) : "") + (r ? tag(k, x + w, y + 9, r, "#888", "end", 7) : "");
  const wordsOf = (v, id) => String(v(id));
  /* The bottom caption, shrunk to fit when it is long. */
  const cap = (k, text) => `<rect x="0" y="${k.H - 18}" width="${k.W}" height="18" fill="rgba(0,0,0,0.55)"/>` + k.label({ x: k.W / 2, y: k.H - 5, text, size: r1(k.clamp(560 / Math.max(1, String(text).length), 6.5, 10)), color: "#f4f4f4" });

  /* ---------------- story-shape curiosities ---------------- */

  /* Tension over the hour: peaks that build, hold and let go, and a viewer's face that grips harder. */
  W.look("tensionCurve", (v, k) => {
    const lvl = 0.3 + 0.7 * v.p("setting");
    const shape = v.p("shape");
    const n = k.clamp(Math.round(40 / v.n("peakSpacing")), 1, 12);
    let build = k.clamp(v.n("buildTime") / 600, 0.05, 1) * 0.55;
    let hold = (v.n("peakHold") / 60) * 0.25;
    const fall = 0.06;
    let calm = (v.n("releaseLength") / 120) * 0.35;
    const sum = build + hold + fall + calm;
    if (sum > 0.95) (build *= 0.95 / sum), (hold *= 0.95 / sum), (calm *= 0.95 / sum);
    const pts = [];
    for (let i = 0; i <= 160; i++) {
      const t = i / 160;
      const base = shape < 0.2 ? 0.3 : shape < 0.5 ? 0.08 + 0.5 * t : shape < 0.8 ? 0.58 - 0.5 * t : 0.08;
      const amp = shape > 0.8 ? 0.6 : 0.35;
      const ph = (t * n) % 1;
      const rest = 1 - build - hold - fall - calm;
      let e;
      if (ph < rest) e = 0.1;
      else if (ph < rest + build) e = 0.1 + 0.9 * ((ph - rest) / build);
      else if (ph < rest + build + hold) e = 1;
      else if (ph < rest + build + hold + fall) e = 1 - 0.9 * ((ph - rest - build - hold) / fall);
      else e = 0.1;
      pts.push(k.clamp((base + amp * e) * lvl, 0, 1));
    }
    const rk = v("releaseKind");
    const icon = { "slow exhale": "~ phew", "a laugh": "ha!", "a shock": "!!", "a cut away": "| cut" }[rk] || rk;
    const grip = v.p("audienceGrip");
    const from = wordsOf(v, "tensionFrom");
    const fromIcon = /clock/.test(from) ? k.clock({ x: 232, y: 88, r: 8, p: 0.8 }) : /threat/.test(from) ? star(232, 88, 8, "#ef476f", 5) : /secret/.test(from) ? rect(224, 82, 16, 12, "#c77dff", { stroke: "#000", rx: 2 }) : /person/.test(from) ? k.face({ x: 232, y: 88, r: 8, mood: -0.6 }) : k.text({ x: 232, y: 94, text: "?", size: 16, color: "#7fb7ff" });
    /* The film: eight frames across the hour; the face moves closer and tenser as the tension climbs. */
    const NF = 8;
    const fw = 300 / NF;
    let strip = sprockets(10, 24, 300, 44);
    for (let f = 0; f < NF; f++) {
      const e = pts[Math.round(((f + 0.5) / NF) * 160)];
      const inner = rect(0, 0, 320, 180, k.mix("#2c3444", "#6a1a24", e)) + k.face({ x: 160, y: 96, r: 48 + e * 50, mood: 0.4 - e * 1.3, eyes: 0.5 + e * 0.5, brows: -e, mouth: e > 0.8 ? 0.5 : 0 });
      strip += cell(`cw-tc-f${f}`, 10 + f * fw + 1, 24, fw - 2, 44, inner, e > 0.75 ? "#ef476f" : "#0b0b0d");
    }
    return (
      k.bg(BG) +
      k.title("Tension through the hour") +
      strip +
      axis(k, 14, 140, 196, "start", "end") +
      k.graph({ x: 14, y: 80, w: 196, h: 58, points: pts, color: "#ef476f", w2: 1.5 }) +
      tag(k, 112, 157, icon + " (how it lets go)", "#f2cc8f", "middle", 7) +
      fromIcon +
      tag(k, 244, 92, from, "#ccc", "start", 7) +
      k.face({ x: 268, y: 124, r: 16 + grip * 6, mood: -0.3 - grip * 0.6, eyes: 0.4 + grip * 0.6, mouth: grip > 0.9 ? 0.6 : 0, brows: -grip }) +
      tag(k, 268, 157, v("audienceGrip"), "#ccc", "middle", 7) +
      cap(k, `${v("shape")} · peaks every ${r1(v.n("peakSpacing"))} min · builds ${r1(v.n("buildTime"))} s, holds ${r1(v.n("peakHold"))} s, calm ${r1(v.n("releaseLength"))} s`)
    );
  });

  /* A reveal: clues planted along the story, the reveal itself, who learns first, and whose face we watch. */
  W.look("reveal", (v, k) => {
    const x0 = 16;
    const rx = x0 + 30 + (v.n("holdBack") / 60) * 190;
    const rw = 4 + (v.n("revealLength") / 60) * 40;
    const setupW = v.p("setup") * 60;
    const clues = v.n("clueCount");
    let out = k.bg(BG) + k.title("The story, left to right") + axis(k, x0, 50, 288);
    out += rect(rx - setupW, 38, setupW, 12, "#3a4a66", { op: 0.8 });
    if (setupW > 4) out += tag(k, rx - setupW / 2, 34, "setup", "#7fb7ff", "middle", 7);
    for (let i = 0; i < clues; i++) out += k.dot({ x: x0 + 6 + ((rx - x0 - 10) * (i + 0.5)) / Math.max(1, clues), y: 50, r: 3, color: "#ffd166" });
    const sp = v("revealSpeed");
    const pieces = { "all at once": 1, "in two steps": 2, "in pieces": 5, "slow dawning": 10 }[sp] || 1;
    for (let i = 0; i < pieces; i++) out += rect(rx + (rw / pieces) * i, 38, rw / pieces - (pieces > 1 ? 1 : 0), 12, "#f4f1ea", { op: pieces === 10 ? 0.15 + (0.85 * i) / 9 : 1 });
    out += star(rx + rw / 2, 60, 4 + v.p("size") * 7, "#ffd166", 7);
    /* the reveal on screen: a curtain pulled back on a hidden figure; the bigger the reveal, the bigger the light */
    const sz = v.p("size");
    const fig = pieces >= 10 ? 0.45 : 1;
    let scr = k.bg("#2c2630") + k.floor(140, "#3b302a") + k.beam({ x: 160, y: 0, dir: 90, len: 170, spread: 16 + sz * 40, color: "#fff3c4", alpha: 0.2 + sz * 0.35 });
    scr += `<g opacity="${fig}">${k.person({ x: 160, y: 160, s: 1.5, color: "#e07a5f", arms: 0.6, mood: 0.6 })}</g>`;
    if (pieces === 5) scr += [0, 1, 2].map((i) => rect(110 + i * 40, 20, 20, 145, "#7a2a3a")).join("");
    if (pieces === 2) scr += rect(160, 0, 160, 180, "#7a2a3a", { op: 0.9 });
    scr += rect(0, 0, 70, 180, "#7a2a3a") + rect(250, 0, 70, 180, "#7a2a3a") + k.text({ x: 218, y: 70, text: "!", size: 30 + sz * 20, color: "#ffd166", weight: 800, outline: "#000" });
    out += mini("cw-reveal-scr", 10, 74, 140, scr);
    /* who learns first: two short tracks, the earlier dot learns first */
    const shift = (v.p("setting") - 0.5) * 40 - v.n("aheadBy") * 1.5; /* "before": the audience learns before the characters */
    const tx = (d) => k.clamp(198 + d * 0.6, 162, 236);
    out += tag(k, 160, 88, "we learn", "#ccc", "start", 7) + line(162, 95, 236, 95, "#444", 2) + k.dot({ x: tx(shift), y: 95, r: 4.5, color: "#06d6a0" });
    out += tag(k, 160, 110, `${v("aheadOf")} learns`, "#ccc", "start", 7) + line(162, 117, 236, 117, "#444", 2) + k.dot({ x: tx(0), y: 117, r: 4.5, color: "#e07a5f" });
    out += tag(k, 160, 134, shift < -3 ? "we know first" : shift > 3 ? "they know first" : "together", "#ffd166", "start", 7);
    /* reaction */
    const rf = v("reactionFocus");
    const mood = { "the one who learns": -0.7, "the one who knew": 0.3, "a bystander": -0.2, nobody: 0 }[rf];
    out += rf === "nobody" ? rect(252, 96, 40, 30, "#222", { stroke: "#555" }) + tag(k, 272, 115, "no face", "#777") : k.face({ x: 272, y: 108, r: 17, mood: mood == null ? 0 : mood, eyes: 1, mouth: rf === "the one who learns" ? 0.6 : 0 });
    out += tag(k, 160, 152, "on their face", "#aaa", "start", 7) + k.meter({ x: 212, y: 146, w: 98 * (0.1 + v.p("reactionHold") * 0.9), p: 1, color: "#e07a5f" });
    return out + cap(k, `${v("setting")} · ${v("revealSpeed")} · held back ${r1(v.n("holdBack"))} min · on the reaction ${r1(v.n("reactionHold"))} s`);
  });

  /* Mains: each lead's lane through the hour, who gets the most, when they meet, and the longest absence. */
  W.look("mains", (v, k) => {
    const n = k.clamp(v.n("setting"), 2, 4);
    const share = v.n("share") / 100;
    const pull = v.p("focusPull");
    const wts = Array.from({ length: n }, (_, i) => (i === 0 ? 1 + pull * 4 : 1));
    const sw = wts.reduce((a, b) => a + b, 0);
    const slots = 2 + Math.round(v.p("handoffSpeed") * 10);
    const X0 = 50;
    const WW = 258;
    const pxMin = WW / 60;
    const intro = v.n("introducedBy");
    const away = v.n("longestAway");
    const meets = { never: 0, once: 1, "a few times": 3, constantly: 7 }[v("crossPaths")] || 0;
    const meetX = Array.from({ length: meets }, (_, m) => X0 + ((m + 0.5) / meets) * WW);
    /* Where each main is on screen, as spans along the hour. */
    const spans = [];
    const covers = [];
    for (let i = 0; i < n; i++) {
      const cover = k.clamp(share * ((n * wts[i]) / sw), 0.03, 1);
      covers.push(cover);
      const start = n > 1 ? (intro * i) / (n - 1) : 0;
      const sp = [];
      for (let s = 0; s < slots; s++) {
        const a = (s + (i / n) * 0.6) / slots;
        let x1 = X0 + a * WW;
        let x2 = x1 + (cover * WW) / slots;
        x1 = Math.max(x1, X0 + start * pxMin);
        if (i === n - 1) {
          const g1 = X0 + 30 * pxMin - (away * pxMin) / 2;
          const g2 = g1 + away * pxMin;
          if (x1 > g1 && x2 < g2) continue;
          if (x1 < g1 && x2 > g1) x2 = g1;
          if (x1 < g2 && x2 > g2) x1 = g2;
        }
        x2 = Math.min(x2, X0 + WW);
        if (x2 > x1) sp.push([x1, x2]);
      }
      spans.push(sp);
    }
    /* The film: ten frames through the hour, each showing whoever is on screen then (everyone, when they meet). */
    const NF = 10;
    const fw = 300 / NF;
    let out = k.bg(BG) + k.title("Who's on screen through the hour") + sprockets(10, 22, 300, 42);
    for (let f = 0; f < NF; f++) {
      const a = X0 + (f / NF) * WW;
      const b = X0 + ((f + 1) / NF) * WW;
      const meet = meetX.some((x) => x >= a && x < b);
      const who = [];
      for (let i = 0; i < n; i++) if (meet || spans[i].some(([x1, x2]) => x1 < b && x2 > a)) who.push(i);
      let inner = set(k, who.length ? "#4a4458" : "#24222a");
      who.forEach((i, j) => (inner += k.person({ x: 160 + (j - (who.length - 1) / 2) * 70, y: 168, s: 1.7, color: PAL[i], mood: meet ? 0.6 : 0.2 })));
      out += cell(`cw-mains-f${f}`, 10 + f * fw + 1, 22, fw - 2, 42, inner, meet ? "#ffffff" : "#0b0b0d");
    }
    /* Thin lanes underneath: the same spans, one row per main. */
    const L0 = 76;
    out += axis(k, X0, L0 + n * 13 + 2, WW, "0", "60 min");
    for (let i = 0; i < n; i++) {
      const y = L0 + i * 13;
      out += k.face({ x: 30, y: y + 4, r: 4 + covers[i] * 3, color: PAL[i], mood: 0.3 }) + rect(X0, y + 1, WW, 6, "#202026");
      spans[i].forEach(([x1, x2]) => (out += rect(x1, y + 1, x2 - x1, 6, PAL[i])));
      if (i > 0 && intro > 0) out += line(X0 + ((intro * i) / (n - 1)) * pxMin, y - 1, X0 + ((intro * i) / (n - 1)) * pxMin, y + 9, "#fff", 1.5);
    }
    if (away > 0) {
      const y = L0 + (n - 1) * 13 + 10;
      const g1 = X0 + 30 * pxMin - (away * pxMin) / 2;
      out += line(g1, y, g1 + away * pxMin, y, "#ffd166", 1.5) + tag(k, X0 + 30 * pxMin, L0 + n * 13 + 11, `away ${away} min`, "#ffd166", "middle", 7);
    }
    meetX.forEach((x) => (out += line(x, L0 - 4, x, L0 + n * 13 - 4, "#ffffff", 1, "2 2")));
    return out + cap(k, `${n} mains · ${r1(v.n("share"))}% of the hour · ${v("focusPull")} · all met by ${intro} min`);
  });

  /* An exit: the hint, the warnings, the moment they go, who watches, and how long they're missed. */
  W.look("exit", (v, k) => {
    const how = v("setting");
    const wt = v.p("weight");
    let out = k.bg(k.mix("#3a4252", "#101014", wt));
    for (let i = 0; i < Math.round(wt * 12); i++) out += line(20 + i * 25, 30, 12 + i * 25, 46, "#5a6a80", 1);
    /* timeline */
    const ex = 20 + ({ opening: 0.15, middle: 0.5, "last minutes": 0.92 }[v("exitTiming")] || 0.5) * 280;
    const hx = Math.max(20, ex - (v.n("firstHint") / 60) * 140);
    out += axis(k, 20, 18, 280) + k.dot({ x: hx, y: 18, r: 3, color: "#ffd166" }) + tag(k, hx, 12, "hint", "#ffd166", "middle", 7);
    const warn = Math.min(v.n("warning"), Math.floor((ex - hx) / 8));
    for (let i = 0; i < warn; i++) out += tag(k, hx + ((ex - hx) * (i + 1)) / (warn + 1), 22, "!", "#f2cc8f", "middle", 9);
    out += rect(ex - 2, 12, 4, 12, "#ef476f");
    const agStep = Math.min(6, (308 - ex - 6) / Math.max(1, v.n("afterglow")));
    for (let i = 0; i < v.n("afterglow"); i++) out += k.dot({ x: ex + 6 + i * agStep, y: 18, r: 2.4, color: `rgba(239,71,111,${r1(1 - i / 11)})` });
    /* the screen */
    out += rect(60, 40, 200, 112, "#cdbfa8", { stroke: "#666", sw: 2 }) + rect(60, 120, 200, 32, "#7d6650");
    const on = v("onScreen");
    const alpha = on === "told afterwards" ? 0.25 : 1;
    const fx = on === "just off screen" ? 262 : how === "leave" ? 220 : 150;
    const surprise = v.p("surprise");
    if (how === "die") out += `<g transform="rotate(-90 ${fx} 140)" opacity="${alpha}">${k.person({ x: fx, y: 140, s: 0.9, color: "#777", eyes: 0 })}</g>`;
    else out += k.person({ x: fx, y: 145, s: 1, color: "#e07a5f", walk: how === "leave" ? 1 : 0, alpha, look: how === "leave" ? 1 : 0 });
    if (how === "leave") out += k.arrow({ x1: fx + 14, y1: 100, x2: fx + 40, y2: 100, color: "#fff" });
    if (on === "told afterwards") out += k.bubble({ x: 120, y: 60, text: "they're gone", w: 90, h: 24, size: 9 });
    if (on === "just off screen") out += rect(260, 40, 60, 112, BG, { op: 0.75 });
    const gb = v.p("goodbyeScene");
    if (gb > 0) out += k.person({ x: fx - 90 + gb * 60, y: 145, s: 0.9, color: "#7fb7ff", arms: gb > 0.9 ? 0.8 : 0, look: 1, mood: -0.4 });
    const seen = v("seenBy");
    const watchers = { nobody: 0, "one main": 1, "the whole group": 3, "only the audience": 0 }[seen] || 0;
    for (let i = 0; i < watchers; i++) out += k.person({ x: 76 + i * 14, y: 150, s: 0.55, color: "#81b29a", mouth: surprise, mood: -surprise, look: 1 });
    if (seen === "only the audience") out += `<ellipse cx="290" cy="100" rx="14" ry="8" fill="#fff" stroke="#000"/><circle cx="290" cy="100" r="4" fill="#000"/>`;
    out += k.text({ x: 230, y: 70, text: "!".repeat(1 + Math.round(surprise * 3)), size: 12 + surprise * 14, color: "#ef476f", weight: 800 });
    return out + cap(k, `${how} · ${v("exitTiming")} · ${v("surprise")} · ${v("goodbyeScene")} goodbye · missed ${r1(v.n("afterglow"))} scenes`);
  });

  /* Cross-cutting: storylines as colors in one strip, shots shrinking toward the peak, and storylines that meet. */
  W.look("intercut", (v, k) => {
    const lines = k.clamp(v.n("storylines"), 2, 6);
    const N = k.clamp(Math.round(4 + v.n("setting") * 2 + v.n("switchesPerMin") / 2), 3, 40);
    const s = v.n("speedUp") / 5;
    const rh = 1 - v.n("rhythm") / 5;
    const lead = 0.4 + v.n("leadShare") / 40;
    const items = [];
    for (let i = 0; i < N; i++) {
      const t = i / Math.max(1, N - 1);
      let L = v.n("dwell") * (1 - s * t) + v.n("finalDwell") * s * t;
      L *= 1 + rh * (k.rnd(i + 2) - 0.5) * 1.4;
      if (i % lines === 0) L *= lead;
      items.push({ len: Math.max(0.3, L), color: PAL[i % lines] });
    }
    /* The film: each shot is a frame from its storyline (its own place and person), widths by time on screen. */
    blocks(12, 24, 296, 30, items);
    let out = k.bg(BG) + k.title("Cutting between storylines") + sprockets(12, 24, 296, 30);
    items.forEach((it, i) => {
      const sl = i % lines;
      const w = it._w - 1.5;
      if (w < 9) out += rect(it._x, 24, Math.max(0.5, w), 30, it.color, { stroke: "#0b0b0d" });
      else out += cell(`cw-ic-f${i}`, it._x, 24, w, 30, set(k, k.mix(PAL[sl], "#1a1a20", 0.55)) + k.person({ x: 160, y: 168, s: 1.7, color: PAL[sl], walk: sl % 2, mood: 0.3 }), it.color);
    });
    const match = v("cutOnMatch");
    items.forEach((it, i) => {
      if (!i) return;
      const x = it._x;
      if (match === "similar shapes") out += k.ring({ x, y: 62, r: 3, color: "#fff", w: 1 });
      else if (match === "matching words") out += tag(k, x, 66, "”", "#fff", "middle", 9);
      else if (match === "matching action") out += k.arrow({ x1: x - 4, y1: 62, x2: x + 4, y2: 62, color: "#fff", w: 1 });
    });
    /* the storylines' paths */
    const conv = v("converge");
    const sync = v.p("climaxSync");
    for (let i = 0; i < lines; i++) {
      const y0 = 82 + (i * 56) / Math.max(1, lines - 1);
      const pts = [];
      for (let j = 0; j <= 30; j++) {
        const t = j / 30;
        let y = y0;
        if (conv === "echo each other") y += Math.sin(t * 12) * 5;
        if (conv === "near miss") y = k.lerp(y0, 110 + (i - (lines - 1) / 2) * 4, Math.sin(t * Math.PI));
        if (conv === "meet") y = k.lerp(y0, 110, t * t);
        pts.push([20 + t * 260, y]);
      }
      out += path(pts, PAL[i], 2);
      const endX = 280 + (1 - sync) * (k.rnd(i + 9) - 0.5) * 50;
      out += k.dot({ x: Math.min(300, endX), y: pts[30][1], r: 3.5, color: PAL[i] });
    }
    if (sync > 0.5) out += line(280, 76, 280, 144, "#fff", 1, "3 2");
    return out + cap(k, `${lines} storylines · ${r1(v.n("dwell"))} s each, down to ${r1(v.n("finalDwell"))} s at the peak · ${v("converge")}`);
  });

  /* Point of view: the people whose story it is, who we're with over time, and how deep inside them we are. */
  W.look("povSwitch", (v, k) => {
    const n = k.clamp(v.n("characters"), 1, 8);
    const mode = v.p("setting");
    const sw = Math.round(1 + mode * 6 + v.n("switchesPerHour") / 4);
    const main = v.n("mainShare") / 100;
    const ret = v.p("returnTo");
    const minW = v.n("shortestStay");
    let out = k.bg(BG) + k.title("Whose eyes we see through");
    for (let i = 0; i < n; i++) out += k.face({ x: 22 + i * 26, y: 38, r: 9, color: PAL[i % 8], mood: 0.2 });
    out += k.ring({ x: 22, y: 38, r: 12, color: "#fff", w: 2 });
    const back = ret * 4;
    if (back > 0) out += `<path d="M${22 + Math.max(1, n - 1) * 26} 26 Q${r1(22 + (Math.max(1, n - 1) * 26) / 2)} ${r1(14 - back * 2)} 22 26" fill="none" stroke="#ffd166" stroke-width="${r1(back * 0.6 + 0.6)}"/>`;
    out += tag(k, 300, 40, `back to main: ${v("returnTo")}`, "#ffd166", "end", 7);
    const items = [];
    for (let i = 0; i < Math.min(sw, 30); i++) {
      const who = n === 1 ? 0 : ret > 0.9 || (ret > 0.3 && i % Math.round(4 - ret * 3) === 0) ? 0 : 1 + (i % Math.max(1, n - 1));
      items.push({ len: Math.max(minW, who === 0 ? 1 + main * 8 : 1 + (1 - main) * 3) + minW * 0.2, color: PAL[who % 8] });
    }
    out += blocks(12, 58, 296, 22, items);
    /* how deep */
    const d = v("povDepth");
    const S = room(k) + k.person({ x: 220, y: 160, s: 1.6, color: "#81b29a", look: -1 });
    let view = S;
    if (d === "from outside") view = room(k) + k.person({ x: 220, y: 150, s: 0.8, color: "#81b29a" }) + k.person({ x: 120, y: 150, s: 0.8, color: PAL[0] });
    if (d === "over the shoulder") view = S + `<ellipse cx="60" cy="170" rx="80" ry="70" fill="${PAL[0]}" stroke="#000" stroke-width="3"/>`;
    if (d === "through their eyes") view = S + `<path d="M0 0 H320 V180 H0 Z M30 90 Q160 -20 290 90 Q160 200 30 90 Z" fill="#000" fill-rule="evenodd" opacity="0.85"/>`;
    if (d === "their thoughts") view = S + `<ellipse cx="90" cy="50" rx="70" ry="34" fill="#fff" stroke="#000" stroke-width="3"/><text x="90" y="58" font-size="26" text-anchor="middle" fill="#333">what if…</text>`;
    out += mini("cw-povSwitch-clip", 12, 90, 120, view) + tag(k, 72, 162 - 8, d, "#ccc");
    const ho = v("handoff");
    const hoIcon = { "hard cut": line(206, 100, 206, 140, "#fff", 3), "a shared object": rect(196, 110, 20, 18, "#f2cc8f", { stroke: "#000", rx: 3 }), "a look": `<ellipse cx="206" cy="120" rx="14" ry="8" fill="#fff"/><circle cx="206" cy="120" r="4" fill="#000"/>`, "a sound": k.speaker({ x: 200, y: 120, s: 1, level: 1 }) }[ho] || "";
    out += k.face({ x: 160, y: 120, r: 13, color: PAL[0] }) + hoIcon + k.face({ x: 252, y: 120, r: 13, color: PAL[1] }) + k.arrow({ x1: 176, y1: 120, x2: 190, y2: 120, color: "#888", w: 1.5 }) + k.arrow({ x1: 222, y1: 120, x2: 236, y2: 120, color: "#888", w: 1.5 }) + tag(k, 206, 150, `passes by ${ho}`, "#ccc");
    return out + cap(k, `${v("setting")} · ${n} people · ${r1(v.n("mainShare"))}% with the main · shortest stay ${r1(minW)} min`);
  });

  /* A scene's last moments: the last shot, how long it holds, the sound tail, and the pull into the next scene. */
  W.look("sceneEnding", (v, k) => {
    const end = v("setting");
    const on = v("endsOn");
    let shot = on === "black" ? k.bg("#000") : room(k);
    if (on === "a face") shot += k.face({ x: 160, y: 90, r: 60, mood: end === "button joke" ? 0.8 : -0.3, eyes: 1 });
    if (on === "an object") shot += rect(135, 80, 50, 46, "#e07a5f", { stroke: "#000", sw: 3, rx: 6 }) + rect(184, 92, 18, 22, "none", { stroke: "#000", sw: 5, rx: 8 });
    if (on === "the place") shot = k.sky(0.6) + k.floor(120, "#4a6a3a") + k.window_({ x: 120, y: 60, w: 80, h: 60, light: 0.9 });
    const fx = { "button joke": k.bubble({ x: 230, y: 40, text: "ha!", w: 80, h: 40, size: 22 }), cliffhanger: k.text({ x: 260, y: 70, text: "?!", size: 60, color: "#ef476f", weight: 800 }), "quiet fade": k.tint({ color: "#000", alpha: 0.6 }), "open question": k.text({ x: 270, y: 70, text: "?", size: 70, color: "#7fb7ff", weight: 800 }), "cut on action": k.arrow({ x1: 40, y1: 150, x2: 290, y2: 150, color: "#ffd166", w: 8 }), "smash cut": `<path d="M200 0 L170 60 L215 90 L180 180 L320 180 L320 0 Z" fill="#fff"/>`, callback: k.ring({ x: 270, y: 50, r: 30, color: "#06d6a0", w: 8 }) + k.text({ x: 270, y: 62, text: "↺", size: 34, color: "#06d6a0" }) }[end] || "";
    let out = k.bg(BG) + mini("cw-sceneEnding-clip", 10, 10, 170, shot + fx);
    /* next scene, and the pull toward it */
    out += mini("cw-sceneEnding-next", 228, 26, 82, k.sky(0.8) + k.floor(130, "#3b5a7a") + k.person({ x: 160, y: 160, s: 1.6, color: "#81b29a" }), "#444") + tag(k, 269, 84, "next scene", "#888");
    const pull = v.p("pullForward");
    out += k.arrow({ x1: 186, y1: 50, x2: 222, y2: 50, color: "#ffd166", w: 1 + pull * 6 });
    /* timeline */
    const X = 10;
    const pxS = 8;
    const lastLine = X + 30;
    const leave = lastLine + v.p("late") * 30 + v.n("holdAfter") * pxS * 0.6;
    const shotStart = Math.max(X, leave - v.n("lastShotLength") * pxS * 0.6);
    out += axis(k, X, 130, 300) + rect(shotStart, 116, leave - shotStart, 12, "#6c8fb8", { stroke: "#000" }) + k.dot({ x: lastLine, y: 122, r: 3, color: "#ffd166" }) + tag(k, lastLine, 112, "last line", "#ffd166", "middle", 7) + line(leave, 104, leave, 150, "#fff", 2) + tag(k, leave, 102, "cut", "#fff", "middle", 7);
    const so = v("soundOut");
    const tail = v.n("soundTail") * pxS * 1.5 + (so === "cuts dead" ? 0 : 6);
    const wpts = [];
    for (let i = 0; i <= 60; i++) {
      const x = shotStart + (i / 60) * (leave - shotStart + tail);
      const past = x > leave ? (x - leave) / Math.max(1, tail) : 0;
      const a = so === "cuts dead" ? (past > 0 ? 0 : 1) : so === "rings on" ? Math.exp(-past * 3) : so === "fades" ? 1 - Math.min(1, (x - shotStart) / (leave - shotStart + tail)) : 1;
      wpts.push([x, 142 + Math.sin(i * 1.3) * 5 * a]);
    }
    out += path(wpts, "#9fd3ff", 1.5);
    return out + cap(k, `${end} · ends on ${on} · ${v("late")} · hold ${r1(v.n("holdAfter"))} s · sound ${so}`);
  });

  /* The opening seconds: the first image, the first sound, a viewer pulled in, and when the title lands. */
  W.look("openingGrab", (v, k) => {
    const g = v("setting");
    let shot = room(k, { wall: "#2c3444", floor: "#1d2430" });
    if (g === "mid-action") shot += k.person({ x: 150, y: 160, s: 1.6, color: "#e07a5f", walk: 1, lean: 15, arms: 0.6 }) + k.arrow({ x1: 40, y1: 80, x2: 110, y2: 80, color: "#fff", w: 5 });
    if (g === "a question") shot += k.text({ x: 160, y: 120, text: "?", size: 110, color: "#7fb7ff", weight: 800 });
    if (g === "a shock") shot += star(160, 90, 70, "#ef476f", 9);
    if (g === "a joke") shot += k.person({ x: 160, y: 165, s: 1.6, color: "#f2cc8f", mood: 1 }) + k.bubble({ x: 240, y: 40, text: "ha", w: 70, h: 36, size: 22 });
    if (g === "a promise") shot += k.sky(0.3) + k.text({ x: 160, y: 100, text: "soon…", size: 50, color: "#ffd166", italic: true });
    if (g === "none") shot += k.person({ x: 160, y: 160, s: 1.4, color: "#888" });
    const stakes = v.p("stakesShown");
    if (stakes > 0) shot += `<g opacity="${r1(0.3 + stakes * 0.7)}">${star(270, 140, 10 + stakes * 22, "#ffd166", 5)}</g>`;
    let out = k.bg(BG) + mini("cw-openingGrab-clip", 10, 14, 180, shot);
    const fs = v("firstSound");
    out += fs === "silence" ? k.speaker({ x: 24, y: 128, s: 0.9, level: 0 }) + line(14, 120, 36, 138, "#ef476f", 2) : fs === "a voice" ? k.speaker({ x: 24, y: 128, s: 0.9, level: 0.3 }) + k.bubble({ x: 64, y: 122, text: "…", w: 30, h: 16, size: 9, tail: -8 }) : fs === "music" ? k.speaker({ x: 24, y: 128, s: 0.9, level: 0.6 }) + k.text({ x: 56, y: 134, text: "♪♫", size: 16, color: "#c77dff" }) : k.speaker({ x: 24, y: 128, s: 1.3, level: 1 });
    /* viewer */
    const hold = v.p("grabHold");
    out += k.person({ x: 255, y: 150, s: 1.3, mood: -0.2 * hold, look: -1, lean: -hold * 14, eyes: 0.3 + hold * 0.7, arms: hold * 0.5, color: "#4a6fa5" }) + tag(k, 255, 50, v("grabHold"), "#ccc", "middle", 7);
    const m = Math.round(v.p("mystery") * 5);
    for (let i = 0; i < m; i++) out += k.text({ x: 222 + i * 16, y: 34 - (i % 2) * 8, text: "?", size: 14, color: "#7fb7ff" });
    /* the first 30 seconds, and the whole film */
    const X = 80;
    const sec = (s) => X + (Math.min(s, 30) / 30) * 120;
    out += axis(k, X, 134, 120, "0", "30 s") + line(sec(v.n("seconds")), 124, sec(v.n("seconds")), 140, "#ffd166", 2) + tag(k, sec(v.n("seconds")), 121, "lands", "#ffd166", "middle", 7) + line(sec(v.n("firstCutAt")), 128, sec(v.n("firstCutAt")), 140, "#fff", 2) + tag(k, sec(v.n("firstCutAt")), 152, "1st cut", "#ccc", "middle", 7);
    const fx = (min) => 210 + (Math.min(min, 120) / 120) * 100;
    out += axis(k, 210, 152, 100) + rect(fx(v.n("titleAt") / 60) - 1, 146, 3, 8, "#c77dff") + rect(fx(v.n("questionAnswered")) - 1, 146, 3, 8, "#06d6a0");
    return out + cap(k, `${g} · title at ${r1(v.n("titleAt"))} s · question answered by ${r1(v.n("questionAnswered"))} min`);
  });

  /* Two groups of people: how big, how balanced, how they get on, who links them, and when they merge. */
  W.look("groups", (v, k) => {
    const two = v.n("setting") >= 2;
    const size = k.clamp(v.n("groupSize"), 2, 20);
    const bal = v.n("groupBalance") / 100;
    const fr = v.p("friction");
    const frCol = k.mix(k.mix("#06d6a0", "#ffd166", Math.min(1, fr * 2)), "#ef476f", Math.max(0, fr * 2 - 1));
    let out = k.bg(BG) + k.title(two ? "Two groups" : "One group");
    const cluster = (cx, cy, R, col) => {
      let s = k.ring({ x: cx, y: cy, r: R + 6, color: col, w: 1, dash: "3 3" });
      for (let i = 0; i < size; i++) {
        const a = i * 2.4;
        const rr = R * Math.sqrt((i + 0.5) / size);
        s += k.dot({ x: cx + Math.cos(a) * rr, y: cy + Math.sin(a) * rr, r: 3.5, color: col });
      }
      return s;
    };
    if (two) {
      out += cluster(78, 72, 12 + bal * 30, PAL[0]) + cluster(242, 72, 12 + (1 - bal) * 30, PAL[3]);
      out += rect(128, 50, 64, 60, frCol, { op: 0.25, rx: 8 });
      if (fr > 0.9) out += path([[150, 55], [165, 78], [155, 80], [172, 105]], "#ef476f", 3);
      const c = v.n("crossings");
      for (let i = 0; i < c; i++) out += `<path d="M110 ${70 + i * 4} Q160 ${30 + i * 12} 210 ${70 + i * 4}" fill="none" stroke="#fff" stroke-width="1" stroke-dasharray="3 2"/>`;
      const b = v("bridge");
      if (b !== "nobody") out += k.person({ x: 160, y: 108, s: b === "a main" ? 0.8 : 0.55, color: b === "a main" ? "#ffd166" : "#bbb" }) + (b === "a messenger" ? rect(166, 82, 10, 7, "#fff", { stroke: "#000" }) : "");
      out += tag(k, 160, 129, `${v("friction")}${b !== "nobody" ? ", linked by " + b : ""}`, "#ccc");
    } else out += cluster(160, 72, 36, PAL[0]) + tag(k, 160, 129, `${v("friction")} · ${r1(v.n("crossings"))} crossings · linked by ${v("bridge")}`, "#888");
    /* when they come together */
    const mp = { never: 1.2, midway: 0.5, "near the end": 0.8, "only at the end": 1 }[v("mergePoint")];
    const mx = 30 + Math.min(1, mp) * 260;
    out += path([[30, 136], [mx, mp > 1 ? 136 : 146], [290, mp > 1 ? 136 : 146]], PAL[0], 2) + path([[30, 156], [mx, mp > 1 ? 156 : 146], [290, mp > 1 ? 156 : 146]], PAL[3], 2);
    return out + cap(k, `${two ? "2 groups" : "1 group"} of ${size} · first gets ${r1(v.n("groupBalance"))}% · ${v("mergePoint")}`);
  });

  /* A main across the season: the hours they're in, the long rest, spotlight hours and a celebrated return. */
  W.look("featureRate", (v, k) => {
    const H = k.clamp(v.n("seasonHours"), 4, 26);
    const every = Math.max(1, v.n("setting"));
    const spread = v.n("spread") / 5;
    const rest = v.n("restLength");
    const spot = { none: 0, one: 1, several: 3 }[v("spotlightHour")] || 0;
    const fan = v.p("returnFanfare");
    const cw = Math.min(22, 296 / H);
    const restStart = Math.floor(H * 0.4);
    let out = k.bg(BG) + k.title("The season, one frame per hour");
    /* where they appear: evenly every N hours when spread is high, bunched together when it is low */
    const count = Math.ceil(H / every);
    const on = new Set();
    for (let i = 0; i < count; i++) {
      let h = Math.round(k.lerp(i, i * every, spread));
      while (h >= restStart && h < restStart + rest) h++;
      while (on.has(h)) h++;
      if (h < H) on.add(h);
    }
    /* The season as a strip of episodes: the main is in the frame when they are in that hour, bigger the more
       screen time they get; an hour built around them is lit gold; the hours away are dark. */
    let shown = 0;
    out += sprockets(12, 50, H * cw - 2, 60);
    for (let h = 0; h < H; h++) {
      const x = 12 + h * cw;
      const inRest = h >= restStart && h < restStart + rest;
      let inner = set(k, inRest ? "#151518" : "#2a2a34");
      let stroke = "#0b0b0d";
      if (on.has(h)) {
        const share = k.clamp((v.n("screenShare") / 100) * (1 + (k.rnd(h + 11) - 0.5) * (0.2 + spread)), 0.03, 1);
        const isSpot = shown < spot && (h % 3 === 1 || H - h <= spot - shown);
        inner = set(k, isSpot ? "#5a4a2a" : "#3a3a4a") + (isSpot ? k.beam({ x: 160, y: 0, dir: 90, len: 180, spread: 50, color: "#fff3c4", alpha: 0.4 }) : "") + k.person({ x: 160, y: 170, s: 0.7 + share * 1.5, color: isSpot ? "#ffd166" : PAL[0], mood: 0.4 });
        out += rect(x, 118, (cw - 2) * share, 3, isSpot ? "#ffd166" : PAL[0]);
        if (isSpot) (out += star(x + cw / 2 - 1, 36, 5, "#ffd166", 5)), (stroke = "#ffd166"), shown++;
      }
      out += cell(`cw-fr-f${h}`, x, 50, cw - 2, 60, inner, stroke);
    }
    if (rest > 0 && fan > 0) {
      const rx = 12 + Math.min(H - 1, restStart + rest) * cw + cw / 2 - 1;
      out += fan > 0.9 ? star(rx, 130, 7, "#c77dff", 6) + star(rx - 7, 134, 3.5, "#c77dff", 5) : k.ring({ x: rx, y: 130, r: 4, color: "#c77dff" });
    }
    if (rest > 0) out += line(12 + restStart * cw, 140, 12 + Math.min(H, restStart + rest) * cw - 2, 140, "#ffd166", 2) + tag(k, 12 + (restStart + rest / 2) * cw, 152, `away ${rest} h`, "#ffd166", "middle", 8);
    return out + cap(k, `${H}-hour season · every ${every} h · ${r1(v.n("screenShare"))}% screen time · spotlight ${v("spotlightHour")} · return ${v("returnFanfare")}`);
  });

  /* Scenes through the hour: how many, a fast run then a breather, and the pace speeding up or slowing. */
  W.look("sceneRate", (v, k) => {
    const mult = [0.7, 1, 1.4][Math.round(v.p("setting") * 2)];
    const n = k.clamp(Math.round(v.n("perHour") * mult), 3, 110);
    const tr = v.p("trend") - 0.5;
    const burst = k.clamp(v.n("burstLength"), 1, 20);
    const br = v.p("breather");
    const L = [];
    const bStart = Math.floor(n * 0.45);
    for (let i = 0; i < n; i++) {
      let l = 1 - tr * 1.6 * (i / n - 0.5);
      if (i >= bStart && i < bStart + burst) l *= 0.35;
      if (i === bStart + burst) l *= 1 + br * 5;
      L.push(Math.max(0.1, l));
    }
    let out = k.bg(BG) + k.title("Scenes through the hour") + k.strip({ x: 10, y: 34, w: 300, h: 34, lengths: L, gap: n > 60 ? 0.3 : 1.2 });
    /* pace graph with the time to change pace */
    const ramp = v.n("paceChangeTime") / 30;
    const pts = [];
    for (let i = 0; i <= 40; i++) {
      const t = i / 40;
      const a = k.clamp((t - 0.3) / Math.max(0.02, ramp * 0.6), 0, 1);
      pts.push(0.5 + tr * a * 0.8);
    }
    out += tag(k, 10, 86, "pace", "#888", "start") + k.graph({ x: 10, y: 90, w: 190, h: 50, points: pts, color: "#06d6a0" });
    const pull = v.p("pacingPull");
    for (let i = 0; i < 1 + Math.round(pull * 5); i++) out += line(222 + i * 2, 100 + i * 8, 252, 100 + i * 8, "#ffd166", 1.5);
    out += k.person({ x: 275, y: 150, s: 1, walk: pull, lean: pull * 20, color: "#e07a5f" });
    return out + cap(k, `${n} scenes an hour · fast runs of ${burst} · breather ${v("breather")} · ${v("trend")}`);
  });

  /* Walking into a scene: the first image, how late we join, when we know where we are and hear the first line. */
  W.look("sceneEntry", (v, k) => {
    const how = v("setting");
    const fi = v("firstImage");
    let shot = room(k);
    if (fi === "a wide view") shot = k.sky(0.7) + k.floor(120, "#4a6a3a") + rect(120, 70, 80, 50, "#a08060", { stroke: "#000", sw: 3 }) + k.person({ x: 230, y: 140, s: 0.5 });
    if (fi === "a face") shot += k.face({ x: 160, y: 90, r: 60 });
    if (fi === "a detail") shot += k.hand({ x: 160, y: 110, s: 3, open: 0.4 });
    if (fi === "darkness") shot = k.bg("#050505") + `<ellipse cx="140" cy="90" rx="10" ry="5" fill="#ddd"/><ellipse cx="180" cy="90" rx="10" ry="5" fill="#ddd"/>`;
    if (how === "in action") shot += [0, 1, 2].map((i) => line(20, 40 + i * 30, 90, 40 + i * 30, "#fff", 5)).join("");
    if (how === "on a line") shot += k.bubble({ x: 230, y: 34, text: "So…", w: 90, h: 34, size: 18 });
    if (how === "sound first") shot += k.speaker({ x: 40, y: 40, s: 2, level: 1 });
    if (how === "establishing") shot += k.text({ x: 260, y: 30, text: "WIDE", size: 22, color: "#fff", weight: 800 });
    let out = k.bg(BG) + mini("cw-sceneEntry-clip", 98, 10, 150, shot);
    const pull = v.p("startPull");
    out += k.arrow({ x1: 20, y1: 52, x2: 88, y2: 52, color: "#ffd166", w: 1 + pull * 6 }) + tag(k, 50, 70, v("startPull"), "#ffd166");
    /* the scene's full arc and where we join it */
    const X = 20;
    const late = v.n("lateness") / 5;
    out += tag(k, X + 8, 106, "the scene as written", "#888", "start") + rect(X, 110, 280, 8, "#33333a") + rect(X + late * 180, 110, 280 - late * 180, 8, "#6c8fb8") + k.arrow({ x1: X + late * 180, y1: 100, x2: X + late * 180, y2: 109, color: "#fff", w: 1.5 });
    /* the first minute, one row each, names in a column on the left */
    const X2 = 86;
    const s = (t) => X2 + (Math.min(60, t) / 60) * 214;
    out += tag(k, 300, 106, "rows below: its first 60 s", "#888", "end", 7);
    out += tag(k, X, 130, "where are we?", "#c77dff", "start", 7) + rect(X2, 124, 214, 7, "#26262c") + rect(X2, 124, s(v.n("orientTime")) - X2, 7, "#c77dff", { op: 0.75 });
    out += tag(k, X, 141, "first shot", "#81b29a", "start", 7) + rect(X2, 135, 214, 7, "#26262c") + rect(X2, 135, s(v.n("firstShotLength")) - X2, 7, "#81b29a", { stroke: "#000" });
    out += tag(k, X, 152, "first line", "#ffd166", "start", 7) + rect(X2, 148, 214, 2, "#26262c") + k.dot({ x: s(v.n("firstLineAt")), y: 149, r: 4, color: "#ffd166" });
    return out + cap(k, `${how} · first image: ${fi} · enter late ${r1(v.n("lateness"))}/5`);
  });

  /* A signature image that keeps coming back: when, how big, and how its meaning grows. */
  W.look("hook", (v, k) => {
    const on = v.n("setting") > 0 || v("setting") === "yes";
    const cnt = v.n("count");
    const first = 20 + ({ opening: 0, early: 0.15, middle: 0.45, late: 0.7 }[v("firstShown")] || 0) * 280;
    const last = 20 + ({ middle: 0.55, "near the end": 0.85, "final shot": 1 }[v("lastShown")] || 1) * 262;
    const pay = v.p("payoff");
    const vari = v.n("variation") / 5;
    const spot = v.p("spotlight");
    const each = v.n("secondsEach");
    let out = k.bg(BG) + k.title("Signature image through the film") + axis(k, 20, 92, 280, "start", "end");
    const xs = [first];
    for (let i = 1; i <= cnt; i++) xs.push(first + ((Math.max(first, last) - first) * i) / Math.max(1, cnt));
    xs.forEach((x, i) => {
      const t = xs.length > 1 ? i / (xs.length - 1) : 0;
      const sz = 6 * (1 + pay * t * 0.8);
      const col = pay > 0.9 ? k.mix("#ef476f", "#ffd166", t) : "#ef476f";
      const rot = (k.rnd(i + 1) - 0.5) * 80 * vari;
      if (spot > 0.3) out += k.ring({ x, y: 66, r: sz + 3 + spot * 3, color: "#ffd166", w: 1 + spot * 2 });
      out += `<g transform="rotate(${r1(rot)} ${r1(x)} 66)" opacity="${on ? 1 : 0.25}"><path d="M${r1(x)} ${r1(66 - sz)} L${r1(x + sz * 0.8)} 66 L${r1(x)} ${r1(66 + sz)} L${r1(x - sz * 0.8)} 66 Z" fill="${col}" stroke="#000"/></g>`;
      out += rect(x - (each / 30) * 9 - 1, 88, (each / 30) * 18 + 2, 8, "#f2cc8f");
    });
    out += line(last, 84, last, 100, "#888", 1, "2 2") + tag(k, last, 108, "last", "#888", "middle", 7);
    out += tag(k, 100, 128, `${r1(v.n("minutesBetween"))} min apart`, "#aaa", "middle", 8) + rect(30, 132, 130, 4, "#333") + rect(30, 132, (v.n("minutesBetween") / 60) * 130, 4, "#f2cc8f");
    /* how big in the frame */
    const fs = v.n("frameShare") / 100;
    out += rect(214, 112, 82, 46, "#2c3444", { stroke: "#666" }) + `<path d="M255 ${r1(135 - 22 * fs)} L${r1(255 + 18 * fs)} 135 L255 ${r1(135 + 22 * fs)} L${r1(255 - 18 * fs)} 135 Z" fill="#ef476f" stroke="#000"/>` + tag(k, 180, 138, "in frame:", "#888", "middle", 8);
    return out + cap(k, `${on ? "yes" : "no signature image"} · ${cnt} returns · ${v("payoff")} · ${v("spotlight")}`);
  });

  /* Energy across the film: its peaks, the dips between, the flat stretches, and what happens at a cut. */
  W.look("energyArc", (v, k) => {
    const lvl = 0.35 + 0.65 * (v.n("setting") / 5);
    const shape = v("shape");
    const pk = v.n("peakPlace") / 100;
    const n = k.clamp(v.n("peakCount"), 1, 10);
    const dip = v.n("dropDepth") / 5;
    const plat = v.n("plateauLength") / 60;
    const climb = 0.02 + (v.n("climbTime") / 20) * 0.12;
    const co = v.p("carryOver");
    const pts = [];
    for (let i = 0; i <= 120; i++) {
      const t = i / 120;
      let base = shape === "rising" ? 0.2 + 0.4 * t : shape === "falling" ? 0.6 - 0.4 * t : shape === "flat" ? 0.4 : 0.3;
      let e = 0;
      for (let j = 0; j < n; j++) {
        const c = n === 1 ? pk : j === Math.round(pk * (n - 1)) ? pk : (j + 0.5) / n;
        const d = t - c;
        const h = j === Math.round(pk * (n - 1)) || n === 1 ? 1 : shape === "peaks and valleys" ? 0.8 : 0.55;
        const f = d < 0 ? Math.max(0, 1 + d / climb) : Math.abs(d) < plat ? 1 : Math.max(0, 1 - (d - plat) / 0.05);
        e = Math.max(e, f * h);
      }
      let y = base * (1 - dip * 0.8) + e * 0.45;
      const cutPh = (t * 6) % 1;
      if (cutPh < 0.06) y *= co + (1 - co) * (cutPh / 0.06);
      pts.push(k.clamp(y * lvl + 0.03, 0, 1));
    }
    let out = k.bg(BG) + k.title("Energy across the film");
    for (let c = 1; c < 6; c++) out += line(14 + (c / 6) * 292, 26, 14 + (c / 6) * 292, 144, "#333", 1, "2 3");
    out += axis(k, 14, 144, 292, "start", "end") + k.graph({ x: 14, y: 30, w: 292, h: 112, points: pts, color: "#ffd166" });
    const peakY = 30 + 112 * (1 - Math.max(...pts));
    out += k.person({ x: 14 + pk * 292, y: peakY - 2, s: 0.5, arms: 1, mood: 1, color: "#e07a5f" });
    return out + cap(k, `${v("shape")} · ${n} high points · climbs in ${r1(v.n("climbTime"))} min · energy across cuts: ${v("carryOver")}`);
  });

  /* A psych-out: dreamy fake beats, the snap back to reality, the clues, and how it feels after. */
  W.look("psychOut", (v, k) => {
    const fake = v("setting") === "psych-out";
    const len = v.n("length");
    const conv = v.n("convincing") / 5;
    const snapW = 4 + (v.n("snapTime") / 5) * 30;
    const sharp = v.p("snapBack");
    let out = k.bg(BG) + k.title(fake ? "A fake-out, then back to real" : "It's real");
    let x = 14;
    const bw = 26;
    if (!len) out += rect(x, 34, bw - 3, 34, k.mix("#c77dff", "#6c8fb8", conv), { stroke: "#fff", dash: "2 2", op: 0.3, rx: 6 * (1 - conv) });
    for (let i = 0; i < len; i++) {
      out += rect(x, 34, bw - 3, 34, fake ? k.mix("#c77dff", "#6c8fb8", conv) : "#6c8fb8", { stroke: fake && conv < 0.5 ? "#fff" : "#000", dash: fake && conv < 0.5 ? "3 2" : null, rx: fake ? 6 * (1 - conv) : 0 });
      x += bw;
    }
    const clues = { none: 0, one: 1, several: 3, obvious: 6 }[v("tipOff")] || 0;
    const c0 = 14 + (v.n("firstClueAt") / 60) * Math.max(bw, len * bw - 10);
    out += line(c0, 70, c0, 80, "#ef476f", 1, "2 1");
    for (let i = 0; i < clues; i++) out += k.dot({ x: Math.min(x - 6, c0 + i * 8), y: 74, r: 2.5, color: "#ef476f" });
    if (fake) {
      const zz = [];
      for (let i = 0; i <= 6; i++) zz.push([x + (i / 6) * snapW, 51 + (i % 2 ? -1 : 1) * (4 + sharp * 14)]);
      out += path(zz, "#ffd166", 2 + sharp * 2);
      x += snapW + 4;
    }
    for (let i = 0; i < 3 && x < 300; i++) (out += rect(x, 34, bw - 3, 34, "#81b29a", { stroke: "#000" })), (x += bw);
    /* whose fantasy, and the feeling after */
    const who = v("whoseMind");
    out += who === "the hero" ? k.person({ x: 50, y: 150, s: 0.9, color: "#e07a5f" }) : who === "a side character" ? k.person({ x: 50, y: 150, s: 0.6, color: "#bbb" }) : who === "the audience only" ? `<ellipse cx="50" cy="128" rx="18" ry="10" fill="#fff"/><circle cx="50" cy="128" r="5" fill="#000"/>` : `<path d="M38 116 L62 140 M62 116 L38 140" stroke="#ddd" stroke-width="3"/><circle cx="36" cy="142" r="5" fill="none" stroke="#ddd" stroke-width="2"/><circle cx="64" cy="142" r="5" fill="none" stroke="#ddd" stroke-width="2"/>`;
    out += `<ellipse cx="96" cy="100" rx="22" ry="12" fill="#fff" opacity="${fake ? 0.9 : 0.2}"/><circle cx="70" cy="112" r="3" fill="#fff" opacity="${fake ? 0.9 : 0.2}"/>`;
    const tone = v("payoffTone");
    out += k.face({ x: 190, y: 120, r: 22, mood: tone === "dread" ? -0.9 : tone === "a laugh" ? 1 : 0.4, mouth: tone === "a laugh" ? 0.7 : 0, eyes: tone === "relief" ? 0.3 : 1 }) + tag(k, 190, 154, tone, "#ccc");
    const fq = v.n("frequency");
    out += tag(k, 300, 100, "per film", "#888", "end", 7);
    for (let i = 0; i < fq; i++) out += k.dot({ x: 300 - i * 9, y: 110, r: 3, color: "#c77dff" });
    return out + cap(k, `${len} fake beats · ${v("snapBack")} snap in ${r1(v.n("snapTime"))} s · ${v("tipOff")} clue${clues === 1 ? "" : "s"}`);
  });

  /* Shot order: a strip of shots, how they join, the sound track leading or trailing, and where the eye lands. */
  W.look("shotOrderLens", (v, k) => {
    const lp = v.p("length");
    const rp = v.p("rate");
    const lo = v.n("shortestShot");
    const hi = Math.max(lo, v.n("longestShot"));
    const n = k.clamp(Math.round(6 + rp * 10 - lp * 3), 4, 16);
    const acc = v.p("accelerate");
    const cov = v.p("coverage");
    const cols = cov < 0.3 ? ["#6c8fb8"] : cov < 0.7 ? ["#6c8fb8", "#e07a5f"] : PAL.slice(0, 5);
    const L = [];
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      const base = k.lerp(lo, hi, k.clamp(lp * 0.8 + k.rnd(i + 4) * 0.4 - 0.2, 0, 1));
      L.push({ len: base * (1 - acc * t * 0.85), color: cols[i % cols.length] });
    }
    let out = k.bg(BG) + k.title("Shots in order") + blocks(10, 30, 300, 36, L);
    const joins = v("joins");
    L.forEach((it, i) => {
      if (!i) return;
      if (joins === "cut on action") out += k.arrow({ x1: it._x - 5, y1: 26, x2: it._x + 5, y2: 26, color: "#fff", w: 1 });
      if (joins === "match cuts") out += k.ring({ x: it._x, y: 25, r: 3, color: "#fff", w: 1 });
      if (joins === "overlapping") out += rect(it._x - 4, 30, 8, 36, "#fff", { op: 0.35 });
    });
    /* sound track */
    const lead = v.p("leads") - 0.5;
    const shift = -lead * 20 - v.n("leadBy") * 6;
    out += tag(k, 10, 80, "sound", "#888", "start", 7);
    L.forEach((it) => (out += rect(it._x + shift, 84, it._w - 2, 8, "#9fd3ff", { op: 0.7 })));
    /* where the eye lands in each shot */
    const jump = v.n("eyeJump") / 100;
    const care = v.p("eyeTrace");
    const ep = L.map((it, i) => [it._x + it._w / 2, 48 + (k.rnd(i + 20) - 0.5) * 30 * jump]);
    if (care > 0.2) out += path(ep, "#ffd166", 1, care < 0.8 ? "3 2" : null);
    ep.forEach((p) => (out += k.dot({ x: p[0], y: p[1], r: 2.5, color: "#ffd166" })));
    out += k.meter({ x: 20, y: 120, w: 130, label: `shortest ${r1(lo)} s`, p: lo / 10, color: "#81b29a" }) + k.meter({ x: 170, y: 120, w: 130, label: `longest ${r1(hi)} s`, p: hi / 120, color: "#e07a5f" });
    return out + cap(k, `${v("length")} shots · ${v("rate")} cutting · ${joins} · ${v("leads")}`);
  });

  /* Shots grouped into runs (pairs, threes...), the pause between runs, and where the pattern breaks. */
  W.look("phraseScheme", (v, k) => {
    const per = [1, 2, 3, 4, 7][Math.round(v.p("setting") * 4)];
    const runs = k.clamp(v.n("runsPerScene"), 1, 20);
    const runL = v.n("runLength");
    const pause = v.n("pausesBetween");
    const brk = { never: 0, once: 1, often: 3 }[v("break")] || 0;
    const at = v.p("breakAt");
    const pace = v.p("runPace") - 0.5;
    const unit = 296 / (runs * runL + (runs - 1) * pause * 3);
    let out = k.bg(BG) + k.title("Shots grouped into runs") + sprockets(12, 44, 296, 40);
    let x = 12;
    const breaks = new Set();
    for (let b = 0; b < brk; b++) breaks.add(k.clamp(Math.round(at * (runs - 1)) + b * 2 * (at > 0.5 ? -1 : 1), 0, runs - 1));
    for (let r = 0; r < runs; r++) {
      const odd = breaks.has(r);
      const m = odd ? per + 1 : per;
      const ls = Array.from({ length: m }, (_, i) => 1 - pace * 1.4 * (i / Math.max(1, m - 1) - 0.5));
      const w = runL * unit;
      /* each run is one little moment in shots: the same place, the person moving across it shot by shot */
      const tot = ls.reduce((a2, b2) => a2 + b2, 0);
      let sx = x;
      ls.forEach((l, j) => {
        const sw2 = (l / tot) * w;
        const bgc = odd ? "#5a2a36" : r % 2 ? "#2e3a52" : "#36324a";
        if (sw2 < 7) out += rect(sx, 44, Math.max(0.6, sw2 - (sw2 > 2.5 ? 1 : 0.3)), 40, odd ? "#ef476f" : j % 2 ? "#6c8fb8" : "#8fb2d8");
        else out += cell(`cw-ps-${r}-${j}`, sx, 44, sw2 - 1, 40, set(k, bgc) + k.person({ x: 110 + (j / Math.max(1, m - 1)) * 100, y: 168, s: 1.6, color: odd ? "#ef476f" : "#7fb7ff", walk: j % 2, arms: odd ? 0.8 : 0 }));
        sx += sw2;
      });
      if (odd) out += rect(x - 1, 42, w + 1, 44, "none", { stroke: "#ffd166", sw: 1.5 });
      x += w + pause * 3 * unit;
    }
    if (!brk) out += tag(k, 12 + at * 280, 34, "▾", "#555", "middle", 9);
    out += tag(k, 160, 104, `${per === 7 ? "long runs" : per + " shot" + (per > 1 ? "s" : "")} per run · ${v("runPace")} inside`, "#ccc");
    out += tag(k, 160, 122, `pause ${pause} s between runs · each run ${runL} s`, "#999");
    return out + cap(k, `${runs} runs per scene · pattern breaks ${v("break")}${brk ? " at the " + v("breakAt") : ""}`);
  });

  /* A transition from shot A to shot B: its kind, length, what carries over, how far it leaps, how hard it jolts. */
  W.look("transition", (v, k) => {
    const kind = v("setting");
    const len = v.n("length");
    const tw = 6 + len * 16;
    const ax = 10;
    const aw = 140 - tw / 2;
    const bx = ax + aw + tw;
    const bw = 310 - bx;
    const leap = v("leap");
    const off = (v.n("matchOffset") / 50) * 40;
    let A = room(k) + k.person({ x: 140, y: 160, s: 1.6, color: "#e07a5f" });
    let B = leap === "same place" ? room(k) : leap === "next room" ? room(k, { wall: "#9fb8a0", floor: "#5a5040" }) : leap === "new place" ? k.sky(0.8) + k.floor(130, "#4a6a3a") : k.sky(0.4) + k.floor(130, "#5a5a5a");
    B += k.person({ x: 170, y: 160, s: 1.6, color: "#e07a5f", skin: leap === "years later" ? "#d8b8a0" : undefined }) + (leap === "years later" ? `<path d="M150 66 Q170 52 190 66" stroke="#eee" stroke-width="8" fill="none"/>` : "");
    const mo = kind === "match cut" ? 1 : 0.2;
    A += `<g opacity="${mo}">${k.ring({ x: 160, y: 70, r: 40, color: "#ffd166", w: 8 })}</g>`;
    B += `<g opacity="${mo}">${k.ring({ x: 160 + off * 3, y: 70, r: 40, color: "#ffd166", w: 8 })}</g>`;
    const jolt = v.p("jolt");
    let out = k.bg(BG) + k.title(kind) + mini("cw-transition-a", ax, 30, aw * 1, A);
    out += `<g transform="translate(${r1(jolt * 6)} ${r1(-jolt * 4)})">${mini("cw-transition-b", bx, 30, bw, B)}</g>`;
    for (let i = 0; i < Math.round(jolt * 4); i++) out += line(bx + bw + 2, 40 + i * 12, bx + bw + 8, 36 + i * 12, "#fff", 1.5);
    const mid = ax + aw + tw / 2;
    const tz = { cut: line(mid, 30, mid, 130, "#fff", 2), "match cut": line(mid, 30, mid, 130, "#ffd166", 2), "smash cut": path([[mid, 30], [mid - 6, 60], [mid + 6, 80], [mid - 6, 110], [mid, 130]], "#ef476f", 3), dissolve: `<defs><linearGradient id="cw-transition-g"><stop offset="0" stop-color="#6c8fb8"/><stop offset="1" stop-color="#81b29a"/></linearGradient></defs>` + rect(ax + aw, 30, tw, 100, "url(#cw-transition-g)"), "sound bridge": k.wave({ x: ax + aw - 20, y: 80, w: tw + 40, h: 30, amp: 0.8, cycles: 4 }) }[kind];
    out += tz || "";
    const car = v("carries");
    const cIcon = { nothing: "", "a shape": k.ring({ x: mid, y: 20, r: 5, color: "#ffd166" }), "a sound": tag(k, mid, 24, "♪", "#9fd3ff", "middle", 14), "a movement": k.arrow({ x1: mid - 12, y1: 20, x2: mid + 12, y2: 20, color: "#fff" }), "a word": tag(k, mid, 24, "“word”", "#fff", "middle", 9) }[car];
    out += cIcon || "";
    /* sound arriving early */
    const se = v.n("soundEarly") * 10;
    out += axis(k, 10, 148, 300) + rect(10, 136, mid - 10, 8, "#6c8fb8") + rect(mid - se, 136, 310 - mid + se, 8, "#9fd3ff", { op: 0.8 }) + tag(k, mid - se, 133, se ? `B's sound ${r1(v.n("soundEarly"))} s early` : "sound cuts with it", "#9fd3ff", "middle", 7);
    return out + cap(k, `${kind} · ${len} s · carries ${car} · ${leap} · ${v("jolt")}`);
  });

  /* Call and answer across cuts: a call in one shot, the answer some cuts later, faces looking across. */
  W.look("callResponse", (v, k) => {
    const how = v.p("setting");
    const ex = k.clamp(v.n("exchanges"), 1, 20);
    const delay = v.n("delay");
    const str = v.n("strength") / 5;
    const tempo = v.p("tempo");
    const gap = v.n("answerGap");
    const kind = v("answerKind");
    const kc = { echoes: "#7fb7ff", agrees: "#06d6a0", contradicts: "#ef476f", mocks: "#f2cc8f" }[kind] || "#fff";
    const n = k.clamp(Math.round(ex * 2 + delay), 3, 40);
    const L = Array.from({ length: n }, (_, i) => 1.4 - tempo + (i % 2 ? gap / 30 : 0));
    const items = L.map((l, i) => ({ len: l, color: i % 2 ? "#3a4a5a" : "#4a3a3a" }));
    let out = k.bg(BG) + k.title("Calls (?) and answers (!) across cuts") + blocks(10, 30, 300, 28, items);
    const step = how < 0.3 ? 0 : how < 0.7 ? 3 : 1;
    let c = 0;
    let lastX = -99;
    if (step)
      for (let i = 0; i + delay < n && c < ex; i += step * 2, c++) {
        const a = items[i];
        const b = items[Math.min(n - 1, i + Math.max(1, delay))];
        /* Skip a pair whose marks would crowd the last one drawn, so every ? and ! stays readable. */
        const ax = a._x + a._w / 2;
        const bxm = b._x + b._w / 2;
        if (ax - lastX < 14 || bxm - ax < 10) continue;
        lastX = bxm;
        out += tag(k, a._x + a._w / 2, 50, "?", "#fff", "middle", 12) + `<g opacity="${r1(0.3 + str * 0.7)}">${tag(k, b._x + b._w / 2, 50, "!", kc, "middle", 10 + str * 8)}</g>`;
        out += `<path d="M${r1(a._x + a._w / 2)} 62 Q${r1((a._x + b._x) / 2 + a._w / 2)} ${r1(70 + str * 10)} ${r1(b._x + b._w / 2)} 62" fill="none" stroke="${kc}" stroke-width="${r1(0.8 + str * 1.5)}" opacity="${r1(0.4 + str * 0.6)}"/>`;
      }
    /* the two sides */
    const eye = v.p("eyeline");
    const lookA = eye < 0.3 ? -1 : eye > 0.7 ? 1 : 1;
    const lookB = eye < 0.3 ? 1 : eye > 0.7 ? -1 : 1;
    out += k.face({ x: 80, y: 124, r: 22, look: lookA, mood: 0.1 }) + k.bubble({ x: 80, y: 88, text: "?", w: 30, h: 20, size: 12, tail: 0 });
    const who = v("answerer");
    out += who === "the place" ? `<path d="M210 140 L210 112 L240 92 L270 112 L270 140 Z" fill="#a08060" stroke="#000" stroke-width="2"/>` : who === "an object" ? rect(220, 108, 40, 32, "#f2cc8f", { stroke: "#000", rx: 4 }) : k.face({ x: 240, y: 124, r: 22, look: lookB, color: who === "the same person" ? undefined : "#c9a07a", mood: kind === "agrees" ? 0.7 : kind === "mocks" ? 0.5 : -0.4 });
    out += k.bubble({ x: 240, y: 88, text: kind, w: 70, h: 20, size: 9, tail: 0 }) + tag(k, 160, 136, `${gap} s`, "#888") + k.arrow({ x1: 112, y1: 120, x2: 206, y2: 120, color: kc, w: 1 + str * 4 });
    return out + cap(k, `${v("setting")} · answered ${delay} cuts later · ${ex} in a row · ${v("tempo")}`);
  });

  /* A repeated image coming back across scenes, changing a little each time, and how the last one lands. */
  W.look("repetition", (v, k) => {
    const n = v.n("setting");
    const sp = v.n("spacing");
    const vari = v.n("variation") / 5;
    const what = v("changeWhat");
    const ts = v.p("timingShift") - 0.5;
    const land = v("landing");
    const ret = v.n("returnLength");
    let out = k.bg(BG) + k.title("The same image, returning");
    const tot0 = Math.max(2, n + 1);
    const unit = Math.min(7.4, 280 / Math.max(1, sp * (tot0 - 1) * (1 + Math.max(0, -ts) * 0.9)));
    for (let i = 0; i * unit <= 296; i++) out += line(12 + i * unit, 96, 12 + i * unit, 100, "#444", 1);
    out += tag(k, 12, 110, `scenes (one tick each)`, "#777", "start", 7);
    let x = 20;
    /* With no returns yet, show a faded example of three, spaced so they read as frames. */
    let gap = n ? sp * unit : 70;
    const tot = n ? Math.max(2, n + 1) : 4;
    for (let i = 0; i < tot && x < 310; i++) {
      const t = i / (tot - 1);
      const ghost = i > n;
      const isLast = i === n && n > 0;
      if (ghost) out += `<g opacity="0.3">`;
      let r = 10;
      let rot = 0;
      let col = "#ffd166";
      const vi = i ? vari : 0;
      if (what === "size") r = 10 * (1 + (k.rnd(i + 3) - 0.6) * vi * 1.4);
      if (what === "angle") rot = (k.rnd(i + 3) - 0.5) * 120 * vi;
      if (what === "color") col = k.mix("#ffd166", "#7fb7ff", (0.3 + k.rnd(i + 3) * 0.7) * vi);
      /* each return is a little film frame holding the same star */
      if (what === "context") out += rect(x - 16, 50, 32, 40, k.mix("#2a2a30", "#3a5a4a", k.rnd(i + 3) * vari), { stroke: "#666" });
      else if (gap >= 30 || i === 0) out += rect(x - 16, 50, 32, 40, "#24242a", { stroke: "#555" });
      if (isLast && land === "a twist") (rot += 180), (col = "#ef476f");
      if (isLast && land === "a payoff") (r *= 1.6), (out += k.ring({ x, y: 70, r: r + 6, color: "#ffd166", w: 3 }));
      out += `<g transform="rotate(${r1(rot)} ${r1(x)} 70)">${star(x, 70, r, col, 5)}</g>`;
      out += rect(x - 1, 90, Math.max(1.5, ret / 3), 5, "#81b29a");
      if (ghost) out += "</g>";
      x += gap;
      gap *= 1 - ts * 0.35;
      gap = Math.max(6, gap);
      void t;
    }
    if (!n) out += tag(k, 160, 40, "no repeats yet (faded: what one would look like)", "#666");
    return out + cap(k, `${n} returns · every ${sp} scenes, ${v("timingShift")} · varies by ${what} · last is ${land}`);
  });

  /* A contrast map: the film flipping between two sides of a pair (loud and quiet, dark and bright...). */
  W.look("contrastMap", (v, k) => {
    const pairs = v.n("setting");
    const str = v.n("strength") / 5;
    const pr = String(v("mainPair")).split(":");
    const flips = Math.max(1, v.n("flipsPerHour"));
    const share = v.n("sideShare") / 100;
    const edge = v.p("edgeSharp");
    let out = k.bg(BG) + k.title(`${pr[0]} against ${pr[1]}`);
    const segW = 296 / (flips + 1);
    const pair = v("mainPair");
    const aCol = k.mix("#555560", "#2a2a40", str);
    const bCol = k.mix("#666670", "#ffd166", str);
    /* The two sides as frames of the film: the same person, played quiet then loud, still then moving, and so on.
       Strength pushes the two sides further apart. */
    const side = (B) => {
      const d = B ? str : 0;
      if (/dark/.test(pair)) return set(k, B ? k.mix("#6a6a70", "#f2e6c8", 0.3 + str * 0.7) : k.mix("#3a3a44", "#08080c", str)) + k.person({ x: 160, y: 168, s: 1.6, color: "#7fb7ff", mood: B ? 0.6 : -0.2 });
      if (/crowded/.test(pair)) {
        let o = set(k, "#3a3a48") + k.person({ x: 160, y: 168, s: 1.6, color: "#7fb7ff" });
        if (B) for (let j = 0; j < 2 + Math.round(str * 6); j++) o += k.person({ x: 40 + ((j * 53) % 250), y: 150 + (j % 3) * 10, s: 1.1, color: "#8a8a96" });
        return o;
      }
      if (/moving|fast/.test(pair)) return set(k, "#3a3a48") + (B ? [0, 1, 2].map((j) => line(30, 70 + j * 25, 100 + str * 30, 70 + j * 25, "#ddd", 4)).join("") : "") + k.person({ x: 170, y: 168, s: 1.6, color: "#7fb7ff", walk: B ? 1 : 0, lean: B ? 10 + str * 10 : 0, arms: B ? 0.6 : 0 });
      return set(k, B ? k.mix("#3a3a48", "#6a2a30", str) : "#2e3444") + k.person({ x: 160, y: 168, s: 1.6, color: "#7fb7ff", mood: B ? -0.6 : 0.2 }) + (B ? k.text({ x: 230, y: 70, text: "!".repeat(1 + Math.round(d * 2)), size: 40 + d * 30, color: "#ffd166", weight: 800 }) : [0, 1, 2].map((j) => k.dot({ x: 212 + j * 14, y: 56, r: 4, color: "#9fd3ff" })).join(""));
    };
    const sideA = side(false);
    const sideB = side(true);
    out += sprockets(12, 30, 296, 60);
    for (let i = 0; i <= flips; i++) {
      const x = 12 + i * segW;
      const aw = segW * share;
      if (aw >= 1) out += cell(`cw-cm-a${i}`, x, 30, aw, 60, sideA, "#0b0b0d");
      if (segW - aw >= 1) out += cell(`cw-cm-b${i}`, x + aw, 30, segW - aw, 60, sideB, "#0b0b0d");
      if (edge < 0.9 && aw >= 1 && segW - aw >= 1) out += rect(x + aw - (1 - edge) * 6, 30, (1 - edge) * 12, 60, k.mix(aCol, bCol, 0.5), { op: 0.5 });
      if (edge > 0.9 && i % 2 === 0) out += path([[x + aw, 30], [x + aw - 4, 50], [x + aw + 4, 70], [x + aw, 90]], "#fff", 1.5);
      if (/loud/.test(pair)) out += k.wave({ x: x + aw + 1, y: 84, w: Math.max(1, segW - aw - 2), h: 8, amp: 0.4 + str * 0.6, cycles: 2, color: "#ffd166" });
    }
    for (let p = 0; p < pairs; p++) out += rect(12, 104 + p * 8, 296, 5, p === 0 ? "#ffd166" : "#444", { op: 0.7, rx: 2 });
    out += tag(k, 12, 152, `${pairs} contrast pair${pairs === 1 ? "" : "s"} in play`, "#999", "start");
    /* The real number in words (the strip draws at least one flip, so 0 and 1 drew the same before). */
    return out + cap(k, `${v.n("flipsPerHour")} flip${v.n("flipsPerHour") === 1 ? "" : "s"} an hour · ${r1(v.n("sideShare"))}% on "${pr[0]}" · ${v("edgeSharp")} switch`);
  });

  /* A single cut seen up close: the seam, sound overlapping it, a breath of black, and action clipped short. */
  W.look("cutArticulation", (v, k) => {
    const art = v.n("setting") / 5;
    const style = v("style");
    const br = v.n("breathFrames");
    const bw = br * 1.5;
    const cx = 160;
    const ax = 20;
    const bx = cx + bw;
    let out = k.bg(BG) + k.title("One cut, up close") + rect(ax, 30, cx - ax, 60, "#6c8fb8") + rect(cx, 30, bw, 60, "#000") + rect(bx, 30, 300 - bx, 60, "#81b29a");
    /* the action in A, clipped */
    const clip = v.n("clipFrames") / 24;
    const pts = [];
    for (let i = 0; i <= 20; i++) {
      const t = i / 20;
      if (t > 1 - clip * 0.8) break;
      pts.push([40 + t * 110, 80 - Math.sin(t * Math.PI) * 40]);
    }
    out += path(pts, "#fff", 2, "3 2") + k.dot({ x: pts[pts.length - 1][0], y: pts[pts.length - 1][1], r: 5, color: "#ffd166" });
    out += style === "jarring" ? path([[cx, 26], [cx - 6, 46], [cx + 6, 66], [cx, 94]], "#ef476f", 1 + art * 4) : line(cx, 26, cx, 94, "#fff", 0.5 + art * 3, style === "invisible" ? "2 3" : null);
    if (style === "rhythmic") for (let i = 0; i < 7; i++) out += line(ax + i * 46, 22, ax + i * 46, 27, "#ffd166", 2);
    /* sound overlap */
    const ov = v.n("overlap") * 30;
    const way = v("overlapWay");
    const inA = way !== "next sound leads in" ? ov : 0;
    const inB = way !== "last sound trails out" ? ov : 0;
    out += tag(k, 20, 102, "sound", "#888", "start", 7) + rect(ax, 106, cx - ax + inA, 8, "#9fd3ff", { op: 0.8 }) + rect(bx - inB, 118, 300 - bx + inB, 8, "#c7f0d0", { op: 0.8 });
    /* how often the moment is cut short */
    const ce = Math.round(v.p("clipEarly") * 4);
    for (let i = 0; i < 4; i++) out += rect(200 + i * 26, 136, i < ce ? 14 : 22, 12, i < ce ? "#ef476f" : "#555", { stroke: "#000" });
    out += tag(k, 196, 146, "moments cut short:", "#999", "end", 8);
    return out + cap(k, `${style} · ${br} frames of breath · sound overlaps ${r1(v.n("overlap"))} s (${way})`);
  });

  /* A motif that rises and falls each time it returns: size, height, brightness or closeness. */
  W.look("motifShape", (v, k) => {
    const shape = v("setting");
    const amp = 0.2 + (v.n("size") / 5) * 0.8;
    const trait = v("trait");
    const pk = v.n("peakAt") / 100;
    const n = k.clamp(v.n("returns"), 2, 12);
    const gapPx = (270 / (n - 1)) * (0.45 + (v.n("returnGap") / 60) * 0.55);
    let out = k.bg(BG) + k.title(`Motif ${shape}, by ${trait}`);
    const val = (t) => (shape === "rises" ? t : shape === "falls" ? 1 - t : shape === "arch" ? (t <= pk ? t / Math.max(0.01, pk) : (1 - t) / Math.max(0.01, 1 - pk)) : 0.5);
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      const x = 24 + i * gapPx;
      const q = 0.5 + (val(t) - 0.5) * amp;
      if (trait === "size") out += star(x, 80, 6 + q * 18, "#ffd166", 5);
      if (trait === "height") out += star(x, 126 - q * 84, 9, "#ffd166", 5);
      if (trait === "brightness") out += star(x, 80, 12, k.mix("#2a2a2a", "#fff7c0", q), 5);
      if (trait === "closeness") out += k.dot({ x: x - 3 - (1 - q) * 9, y: 80, r: 4, color: "#e07a5f" }) + k.dot({ x: x + 3 + (1 - q) * 9, y: 80, r: 4, color: "#7fb7ff" });
    }
    out += axis(k, 20, 142, 290, "first return", "") + tag(k, 24 + gapPx / 2, 134, `${r1(v.n("returnGap"))} min apart`, "#888", "middle", 7);
    out += line(20 + pk * 290, 138, 20 + pk * 290, 146, shape === "arch" ? "#ffd166" : "#555", 2);
    return out + cap(k, `${n} returns · ${shape}${shape === "arch" ? " peaking at " + v.n("peakAt") + "%" : ""} · size ${r1(v.n("size"))}/5`);
  });

  /* Scene lengths across an hour: a typical scene, the shortest and longest, and how much air is trimmed. */
  W.look("sceneLength", (v, k) => {
    const mult = [0.6, 1, 1.6][Math.round(v.p("setting") * 2)];
    const base = Math.max(0.1, v.n("minutes") * mult);
    const spread = v.p("lengthSpread");
    const smin = v.n("shortestMin");
    const smax = Math.max(smin, v.n("longestMin"));
    const where = v.p("longestAt");
    const trim = v.p("trim");
    const px = 296 / 60;
    const L = [];
    let tot = 0;
    for (let i = 0; tot < 60 && i < 700; i++) {
      const l = k.clamp(base * (1 + spread * (k.rnd(i + 5) - 0.5) * 1.8), smin, smax);
      L.push(l);
      tot += l;
    }
    const li = k.clamp(Math.round(where * (L.length - 1)), 0, L.length - 1);
    L[li] = smax;
    let out = k.bg(BG) + k.title("Scenes across one hour") + axis(k, 12, 92, 296, "0", "60 min");
    let x = 12;
    L.forEach((l, i) => {
      const w = Math.min(l * px, 308 - x);
      if (w <= 0) return;
      out += w > 3 ? rect(x, 40, w - 1, 46, i === li ? "#e07a5f" : "#6c8fb8", { stroke: "#000" }) : rect(x, 40, w, 46, i === li ? "#e07a5f" : i % 2 ? "#6c8fb8" : "#9fbfe0");
      if (w > 4) out += rect(x + w * (0.6 + trim * 0.4) - 1, 40, w * (0.4 - trim * 0.4), 46, "#000", { op: 0.4 });
      x += l * px;
    });
    out += k.clock({ x: 40, y: 128, r: 18, p: base / 60 }) + tag(k, 66, 132, `typical ${r1(base)} min`, "#ccc", "start");
    out += k.meter({ x: 180, y: 118, w: 120, label: `shortest ${r1(smin)} min`, p: smin / 10, color: "#81b29a" }) + k.meter({ x: 180, y: 140, w: 120, label: `longest ${smax} min`, p: smax / 30, color: "#e07a5f" });
    return out + cap(k, `${v("setting")} · ${v("lengthSpread")} · longest at the ${v("longestAt")} · ${v("trim")}`);
  });

  /* Speed of time: a runner drawn as a trail of poses, spaced by speed, plus the speed ramp over time. */
  W.look("timeLens", (v, k) => {
    const warp = [0, 0.15, 0.4, 1, 2, 4][Math.round(v.p("warp") * 5)];
    const pct = v.n("speedPct") / 100;
    const speed = warp * (0.5 + pct * 0.5);
    const dir = v("direction");
    const hold = Math.round([1, 2, 3][Math.round(v.p("drawnOn") * 2)]);
    const sgn = dir === "rewinds" ? -1 : 1;
    let out = k.bg(BG) + k.title(v("warp"));
    const N = 6;
    for (let i = 0; i < N; i++) {
      const step = Math.floor(i / hold) * hold;
      const x = 160 + sgn * (step - (N - 1) / 2) * Math.min(40, speed * 9 + (dir === "pauses" ? 0 : 1));
      out += k.person({ x, y: 100, s: 0.8, walk: (step % 2) * 0.8 + 0.1, color: "#e07a5f", alpha: 0.25 + (0.75 * (i + 1)) / N });
    }
    out += dir === "pauses" ? rect(282, 30, 6, 22, "#fff") + rect(294, 30, 6, 22, "#fff") : k.arrow({ x1: 290 - sgn * 20, y1: 40, x2: 290 + sgn * 10, y2: 40, color: "#fff" });
    const rep = v.p("repeat");
    if (rep > 0) out += k.text({ x: 30, y: 46, text: rep > 0.9 ? "↻↻" : "↻", size: 20, color: "#06d6a0" });
    const so = v("slowOn");
    if (so !== "nothing") out += k.label({ x: 160, y: 30, text: `slowed on ${so}`, size: 9, color: "#ffd166" }) + (so === "the impact" ? star(200, 70, 9, "#ffd166", 6) : "");
    /* speed through the shot */
    const rt = v.n("rampTime") / 5;
    const hl = v.n("holdLength") / 10;
    const rk = v.p("ramp");
    const pts = [];
    const low = k.clamp(speed / 4, 0, 1);
    for (let i = 0; i <= 60; i++) {
      const t = i / 60;
      const r = 0.04 + rt * 0.2 * (1.3 - rk);
      const a = k.clamp((t - 0.15) / r, 0, 1);
      const b = k.clamp((t - 0.15 - r - hl * 0.5) / r, 0, 1);
      pts.push(k.lerp(0.25, low, a - (rk > 0.9 ? b : 0)));
    }
    out += tag(k, 12, 122, "speed", "#888", "start", 7) + k.graph({ x: 40, y: 116, w: 260, h: 34, points: pts, color: "#06d6a0" });
    return out + cap(k, `${r1(v.n("speedPct"))}% · ${v("ramp")} change · on ${v("drawnOn")} · ${dir} · ${v("repeat")} · odd speed ${r1(v.n("holdLength"))} s`);
  });

  /* Reframing in the edit: the crop box on the full shot, the face's place in it, and the result. */
  W.look("reframe", (v, k) => {
    const mode = v("setting");
    const z = (v.n("zoom") / 100) * ({ "full frame": 1, "slight punch-in": 1.15, "strong punch-in": 1.4, "slow drift": 1.1 }[mode] || 1);
    const scene = room(k) + k.window_({ x: 30, y: 30 }) + k.person({ x: 190, y: 165, s: 1.8, color: "#4a6fa5" });
    const fxF = 190;
    const fyF = 165 - (24 + 34 + 9) * 1.8;
    const cw = 320 / z;
    const ch = 180 / z;
    const across = v.n("faceAcross") / 100;
    const up = v.n("faceUp") / 100;
    const keep = v.p("keepFace");
    let cx = k.clamp(fxF - across * cw, 0, 320 - cw);
    let cy = k.clamp(fyF - (1 - up) * ch, 0, 180 - ch);
    const d = v("drift");
    const dv = { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1], "the face": [Math.sign(fxF - (cx + cw / 2)), Math.sign(fyF - (cy + ch / 2))] }[d] || [0, 0];
    const mt = v.n("moveTime");
    const s = 150 / 320;
    let out = k.bg(BG) + mini("cw-reframe-full", 8, 22, 150, scene);
    out += `<g transform="translate(8 22) scale(${r1(s * 1000) / 1000})"><rect x="${r1(cx)}" y="${r1(cy)}" width="${r1(cw)}" height="${r1(ch)}" fill="none" stroke="#ffd166" stroke-width="5"/><circle cx="${fxF}" cy="${r1(fyF)}" r="${r1(20 + (1 - keep) * 30)}" fill="none" stroke="#06d6a0" stroke-width="3" stroke-dasharray="${keep > 0.9 ? "0" : "8 6"}"/>${k.arrow({ x1: cx + cw / 2, y1: cy + ch / 2, x2: cx + cw / 2 + dv[0] * (20 + mt * 5), y2: cy + ch / 2 + dv[1] * (20 + mt * 5), color: "#ffd166", w: 5 })}</g>`;
    const hx = 8 + (cx + across * cw) * s;
    const hy = 22 + (cy + (1 - up) * ch) * s;
    out += line(hx - 5, hy, hx + 5, hy, "#ef476f", 1.5) + line(hx, hy - 5, hx, hy + 5, "#ef476f", 1.5);
    out += tag(k, 83, 18, "the full shot", "#888");
    const inner = `<g transform="scale(${r1(z * 1000) / 1000}) translate(${r1(-cx)} ${r1(-cy)})">${scene}</g>`;
    out += mini("cw-reframe-out", 166, 22, 146, inner, "#ffd166") + tag(k, 239, 18, "what we see", "#ffd166");
    out += axis(k, 8, 126, 150, "0", "20 s") + rect(8, 116, (mt / 20) * 150 + 1, 8, "#ffd166") + tag(k, 166, 124, `on ${v("punchOn")}`, "#ccc", "start");
    return out + cap(k, `${mode} · ${r1(v.n("zoom"))}% · drifts ${d} · face ${v("keepFace")} in view`);
  });

  /* A camera effect added in the edit, drawn on the frame, plus when it fires through a minute. */
  W.look("cameraEffect", (v, k) => {
    const fx = v("setting");
    const st = v.n("strength") / 100;
    const sp = v.p("speed");
    let scene = room(k) + k.person({ x: 160, y: 165, s: 1.8, color: "#4a6fa5" });
    let over = "";
    if (fx === "slam zoom") scene = `<g transform="translate(160 90) scale(${r1(1 + st)}) translate(-160 -90)">${scene}</g>`;
    if (fx === "zoom lens") for (let i = 1; i <= 3; i++) over += rect(160 - 160 / (1 + i * st * 0.4), 90 - 90 / (1 + i * st * 0.4), 320 / (1 + i * st * 0.4), 180 / (1 + i * st * 0.4), "none", { stroke: "#ffd166", sw: 2, op: 0.6 });
    if (fx === "gentle sway" || fx === "camera roll") scene = `<g transform="rotate(${r1(st * (fx === "camera roll" ? 40 : 8))} 160 90)">${scene}</g>`;
    if (fx === "subtle shake") scene = `<g opacity="0.5" transform="translate(${r1(st * 10)} ${r1(-st * 6)})">${scene}</g>` + scene;
    if (fx === "wobble") over += k.wave({ x: 0, y: 20, w: 320, h: 30, amp: st, cycles: 3 + sp * 4, color: "#ffd166" }) + k.wave({ x: 0, y: 160, w: 320, h: 30, amp: st, cycles: 3 + sp * 4, color: "#ffd166" });
    if (fx === "radial blur") for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; over += line(160 + Math.cos(a) * 60, 90 + Math.sin(a) * 60, 160 + Math.cos(a) * (60 + st * 120), 90 + Math.sin(a) * (60 + st * 120), "#fff", 2); }
    if (fx === "tracking shot") scene = `<g transform="translate(${r1(-st * 60)} 0)">${scene}</g>`;
    for (let i = 0; i < Math.round(1 + sp * 3) && fx !== "none"; i++) over += line(10, 20 + i * 10, 30 + sp * 40, 20 + i * 10, "#fff", 3);
    let out = k.bg(BG) + mini("cw-cameraEffect-clip", 70, 8, 180, scene + over);
    /* one minute */
    const per = v.n("perMinute");
    const len = v.n("effectLength");
    const off = v.n("hitOffset") * 6;
    const ease = v.p("ease");
    const to = v("timedTo");
    const X = 12;
    const W2 = 296;
    out += axis(k, X, 160, W2, "", "") + tag(k, X, 124, "one minute:", "#888", "start", 7);
    for (let i = 0; i < Math.max(per, 1); i++) {
      const hx = X + ((i + 0.5) / Math.max(1, per)) * W2;
      if (to === "a hit") out += star(hx, 132, 4, "#ffd166", 5);
      if (to === "the music beat") out += tag(k, hx, 136, "♩", "#c77dff", "middle", 10);
      if (to === "a line") out += k.bubble({ x: hx, y: 132, text: "", w: 10, h: 7, tail: 0 });
      if (!per) break;
      const w = (len / 60) * W2 + 2;
      const x0 = hx + off;
      out += ease < 0.2 ? rect(x0, 142, w, 14, "#e07a5f", { op: 0.8 }) : path([[x0, 156], [x0 + w * 0.25 * ease * 2, 142], [x0 + w - w * 0.25 * ease * 2, 142], [x0 + w, 156]], "#e07a5f", 1, null, "rgba(224,122,95,0.8)");
    }
    return out + cap(k, `${fx} · ${r1(v.n("strength"))}% · ${v("speed")} · ${per}/min, ${len} s each · ${v("ease")}`);
  });

  /* A 3D move: the shot as a card turning and moving in depth, with the next shot showing behind it. */
  W.look("frameMove3D", (v, k) => {
    const kind = v("setting");
    const turn = k.rad(v.n("turnAngle"));
    const tilt = k.rad(v.n("tiltAngle"));
    const depth = v.n("depth") / 100;
    const dir = v("spinDir");
    const cx = 160;
    const cy = 82;
    const hw = 80;
    const hh = 45;
    /* With no 3D move the frame stays flat; otherwise it turns (edge-on at 90°). */
    const still = kind === "none";
    const yawW = dir === "left" ? -turn : dir === "right" ? turn : 0;
    const pitchW = (dir === "up" ? turn : dir === "down" ? -turn : 0) + tilt;
    let yaw = still ? 0 : yawW;
    let pitch = still ? 0 : pitchW;
    const dist = 260 + depth * 400;
    const proj = (x, y) => {
      let X = x * Math.cos(yaw);
      let Z = x * Math.sin(yaw);
      const Y = y * Math.cos(pitch) - Z * Math.sin(pitch);
      Z = y * Math.sin(pitch) + Z * Math.cos(pitch);
      const f = 260 / (dist + Z);
      return [cx + X * f, cy + Y * f];
    };
    const quad = () => [proj(-hw * 1.4, -hh * 1.4), proj(hw * 1.4, -hh * 1.4), proj(hw * 1.4, hh * 1.4), proj(-hw * 1.4, hh * 1.4)];
    const q = quad();
    /* With no move, a faint dashed outline shows where the frame would turn to. */
    let ghostQ = "";
    if (still && (yawW || pitchW)) {
      yaw = yawW;
      pitch = pitchW;
      const g = quad();
      ghostQ = path(g.concat([g[0]]), "#ffd166", 1.5, "5 4");
      yaw = 0;
      pitch = 0;
    }
    const rev = v.p("revealsNext");
    let out = k.bg(BG) + k.title(kind);
    out += `<g opacity="${r1(0.15 + rev * 0.85)}">${rect(40, 26, 240, 116, "#81b29a", { stroke: "#444" })}${k.person({ x: 230, y: 136, s: 1, color: "#06d6a0" })}</g>` + tag(k, 46, 37, "next shot", "#81b29a", "start", 7);
    const faceW = Math.abs(q[1][0] - q[0][0]);
    out += path(q.concat([q[0]]), "#000", 2, null, "#6c8fb8") + (faceW < 40 ? "" : k.person({ x: (q[0][0] + q[2][0]) / 2, y: (q[2][1] + q[3][1]) / 2 - 4, s: k.clamp((q[2][1] - q[1][1]) / 110, 0.2, 1.2), color: "#e07a5f" }));
    out += ghostQ;
    if (kind === "cube spin") out += path([q[1], [q[1][0] + 30, q[1][1] - 14], [q[2][0] + 30, q[2][1] - 14], q[2]], "#888", 1.5, "3 2");
    if (kind === "shatter mirror") for (let i = 0; i < 6; i++) out += line(cx, cy, cx + Math.cos(i) * 70, cy + Math.sin(i * 1.7) * 40, "#fff", 1);
    if (kind === "earth zoom") out += k.ring({ x: cx, y: cy, r: 50, color: "#7fb7ff", w: 3 });
    if (kind === "unfurl") out += path([q[2], [q[2][0] - 30, q[2][1]], [q[2][0], q[2][1] - 20], q[2]], "#000", 1, null, "#ddd");
    if (kind === "phone showcase") out += rect(cx - 30, cy - 52, 60, 104, "none", { stroke: "#fff", sw: 4, rx: 10 });
    if (kind === "wheel gallery") for (let i = -2; i <= 2; i++) if (i) out += rect(cx + i * 58 - 20, cy - 12 + Math.abs(i) * 6, 40, 24, "#3a4a5a", { stroke: "#888" });
    if (kind === "floating widgets") for (let i = 0; i < 3; i++) out += rect(40 + i * 90, 30 + (i % 2) * 90, 36, 18, "#f2cc8f", { rx: 4, stroke: "#000" });
    if (kind === "door opens") out += line(q[0][0], q[0][1], q[3][0], q[3][1], "#ffd166", 4);
    if (kind === "mosaic zoom") for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) out += rect(30 + i * 70, 28 + j * 38, 66, 34, "none", { stroke: "#444" });
    out += k.pie({ x: 296, y: 30, r: 12, p: v.n("turnAngle") / 360, color: "#ffd166" }) + tag(k, 296, 54, `${r1(v.n("turnAngle"))}°`, "#ccc", "middle", 7);
    /* speed and how long */
    const ml = v.n("moveLength");
    out += axis(k, 12, 158, 120, "0", "5 s") + rect(12, 148, (ml / 5) * 120 + 1, 7, "#ffd166") + tag(k, 140, 156, v("speed"), "#ccc", "start");
    for (let i = 0; i < 1 + Math.round(v.p("speed") * 3); i++) out += k.arrow({ x1: 250 + i * 12, y1: 152, x2: 258 + i * 12, y2: 152, color: "#ffd166", w: 1.5 });
    return out;
  });

  /* Multi-camera: cameras around two people (top view), and the cut list switching between them. */
  W.look("multicamSwitch", (v, k) => {
    const n = k.clamp(v.n("angles"), 2, 16);
    const spread = v.n("cameraSpread");
    const sw = v("setting");
    let out = k.bg(BG) + rect(8, 22, 110, 110, "#1d1d22", { stroke: "#444", rx: 6 }) + k.title("Cameras (top view)");
    const mx = 63;
    const my = 77;
    out += k.dot({ x: mx - 10, y: my, r: 6, color: "#e07a5f" }) + k.dot({ x: mx + 10, y: my, r: 6, color: "#7fb7ff" });
    for (let i = 0; i < n; i++) {
      const a = k.rad(90 + (n > 1 ? (i / (n - 1) - 0.5) : 0) * spread);
      const x = mx + Math.cos(a) * 42;
      const y = my + Math.sin(a) * 42;
      out += k.cam({ x, y, dir: (Math.atan2(my - y, mx - x) * 180) / Math.PI, s: 0.38, color: PAL[i % 8] });
    }
    /* the switching */
    const rate = v.n("rate");
    const m = k.clamp(Math.max(1, rate), 1, 30);
    const shortest = v.n("shortestHold");
    const rh = v.n("reactionHold");
    const items = [];
    for (let i = 0; i < m; i++) {
      let cam = sw === "one angle" ? 0 : sw === "switch on the speaker" ? i % 2 : sw === "switch on reactions" ? (i % 3 === 2 ? 2 : i % 2) : sw === "switch on the beat" ? i % n : Math.floor(k.rnd(i + 7) * n);
      let len = sw === "switch on the beat" ? 1 : 0.6 + k.rnd(i + 3);
      if (sw === "switch on reactions" && i % 3 === 2) len = 0.5 + rh / 2;
      items.push({ len: Math.max(shortest / 4, len), color: PAL[cam % 8], dash: sw === "switch on reactions" && i % 3 === 2 ? "2 2" : null, stroke: sw === "switch on reactions" && i % 3 === 2 ? "#fff" : null });
    }
    out += tag(k, 128, 34, "the cut, one minute", "#888", "start") + blocks(128, 40, 182, 30, items);
    /* who speaks, and how the cut lands against it */
    const lead = v.n("leadTime") * 8 + (v.p("cutLead") - 0.5) * -16;
    const vx = 230;
    out += tag(k, 128, 90, `cut ${v("cutLead")}:`, "#888", "start", 7) + rect(vx, 82, 70, 6, "#9fd3ff") + tag(k, vx + 35, 96, "voice", "#9fd3ff", "middle", 7) + line(vx - lead, 78, vx - lead, 92, "#ffd166", 2);
    const sf = v("soundFrom");
    out += tag(k, 128, 106, `sound: ${sf}`, "#888", "start");
    if (sf === "a separate recorder") out += rect(128, 112, 180, 8, "#999") + k.mic({ x: 300, y: 104, s: 0.5 });
    else if (sf === "one angle") out += rect(128, 112, 180, 8, PAL[0]);
    else items.forEach((it) => (out += rect(it._x, 112, it._w - 1.5, 8, it.color)));
    out += k.meter({ x: 128, y: 136, w: 180, label: `shortest hold ${r1(shortest)} s`, p: shortest / 10, color: "#81b29a" });
    return out + cap(k, `${sw} · ${n} cameras over ${spread}° · ${rate} switches a minute · reaction ${rh} s`);
  });

  /* A piece nested inside the edit (a group of shots, a sequence, a scene in a scene), reused along the film. */
  W.look("nestedScene", (v, k) => {
    const lvl = Math.round(v.p("setting") * 3);
    const uses = { once: 1, twice: 2, "as a motif": 4 }[v("reuse")] || 1;
    const pc = k.clamp(v.n("pieceCount"), 2, 20);
    const pw = 24 + (v.n("pieceLength") / 120) * 70;
    const gap = 6 + (v.n("reuseGap") / 60) * 60;
    const ch = v.p("changeEachTime");
    let out = k.bg(BG) + k.title("A nested piece, used along the film") + axis(k, 10, 120, 300, "film", "");
    out += k.strip({ x: 10, y: 86, w: 300, h: 26, lengths: [3, 2, 4, 2, 3, 2, 4, 3], color: ["#3a3a44", "#45454f"] });
    let x = 16;
    for (let u = 0; u < uses && x < 300; u++) {
      const order = Array.from({ length: pc }, (_, i) => (ch > 0.4 && u ? (i * 7 + u * 3) % pc : i));
      const cols = order.map((i) => k.mix(PAL[i % 8], "#ffffff", ch > 0.1 && u ? 0.25 * u * (ch < 0.6 ? 1 : 0) : 0));
      const ls = order.map((i) => (ch > 0.9 && u ? 1 + ((i + u) % 3) : 1));
      const w = Math.min(pw, 306 - x);
      out += line(x + w / 2, 70, x + w / 2, 86, "#888", 1, "2 2");
      if (lvl === 0) out += k.strip({ x, y: 36, w, h: 30, lengths: ls, color: cols, gap: 3 });
      else {
        out += k.strip({ x, y: 36, w, h: 30, lengths: ls, color: cols, gap: 0.6 }) + rect(x - 2, 33, w + 3, 36, "none", { stroke: "#ffd166", sw: 1.5 });
        if (lvl >= 2) out += rect(x - 5, 30, w + 9, 42, "none", { stroke: "#ffd166", sw: 1 });
        if (lvl >= 3) out += rect(x - 9, 26, w + 17, 50, "none", { stroke: "#c77dff", sw: 1.5, dash: "3 2" });
      }
      x += w + gap;
    }
    out += tag(k, 160, 142, `${pc} shots inside, ${r1(v.n("pieceLength"))} s long · ${r1(v.n("reuseGap"))} min between uses`, "#aaa");
    return out + cap(k, `${v("setting")} · used ${v("reuse")} · ${v("changeEachTime")}`);
  });

  /* Focus pulled in the edit: who is sharp, how blurred the rest is, and when and how fast the focus moves. */
  W.look("editFocus", (v, k) => {
    const mode = v("setting");
    const bl = v.n("blur") / 100;
    const gap = v.p("gap");
    const target = mode === "pull to the listener" ? "B" : mode === "pull to an object" ? "O" : mode === "as filmed" ? "none" : "A";
    const blurOf = (who) => (target === "none" ? 0.6 : who === target || (mode === "rack back and forth" && who === "B") ? 0 : 1) * bl * 6;
    const f = (id, s) => (s > 0.05 ? `<filter id="${id}"><feGaussianBlur stdDeviation="${r1(s)}"/></filter>` : "");
    const g = (id, s, inner) => `${f(id, s)}<g${s > 0.05 ? ` filter="url(#${id})"` : ""}>${inner}</g>`;
    const bx = 200 + gap * 70;
    const bs = 1.3 - gap * 0.6;
    const guide = v.p("guideEye");
    let out = k.bg(BG) + room(k, { y: 110 });
    out += g("cw-editFocus-b", blurOf("B"), k.person({ x: bx, y: 120 - gap * 20, s: bs, color: "#7fb7ff", look: -1 }));
    out += g("cw-editFocus-o", blurOf("O"), rect(150, 102 - gap * 8, 20, 18, "#f2cc8f", { stroke: "#000", rx: 3 }));
    out += g("cw-editFocus-a", blurOf("A"), k.person({ x: 80, y: 150, s: 1.4, color: "#e07a5f", look: 1 }) + k.bubble({ x: 50, y: 30, text: "…", w: 40, h: 22, size: 12, tail: 10 }));
    const tx = target === "B" ? bx : target === "O" ? 160 : 80;
    const ty = target === "B" ? 90 : target === "O" ? 108 : 100;
    if (target !== "none") out += k.ring({ x: tx, y: ty, r: 40 - guide * 12, color: "#ffd166", w: 1 + guide * 3, dash: guide < 0.5 ? "3 3" : null });
    /* when the pull happens, against the line */
    const timing = v.p("pullTiming");
    const sp = [0.03, 0.12, 0.35][Math.round(v.p("pullSpeed") * 2)];
    out += rect(0, 128, 320, 34, "#141418");
    const lx = 120;
    out += rect(lx, 132, 60, 6, "#9fd3ff") + tag(k, lx + 30, 147, "the line", "#9fd3ff", "middle", 7);
    const st = lx + (timing - 0.5) * 80;
    const pts = [];
    for (let i = 0; i <= 40; i++) {
      const t = i / 40;
      const x = 20 + t * 280;
      pts.push([x, 158 - k.clamp((x - st) / (sp * 280), 0, 1) * 16]);
    }
    out += path(pts, "#ffd166", 2) + tag(k, 16, 152, "focus", "#888", "start", 7);
    /* the distance to what's sharp */
    const sd = Math.log(v.n("sharpDistance") / 0.3) / Math.log(100);
    out += k.cam({ x: 214, y: 140, s: 0.4 }) + line(222, 140, 310, 140, "#555", 1) + line(222 + sd * 86, 134, 222 + sd * 86, 146, "#06d6a0", 2) + tag(k, 222 + sd * 86, 132, `${r1(v.n("sharpDistance"))} m`, "#06d6a0", "middle", 7);
    return out + cap(k, `${mode} · blur ${r1(v.n("blur"))}% · ${v("pullSpeed")} pull ${v("pullTiming")} · ${v("guideEye")}`);
  });

  /* Visual density: how much is in the frame, where the clutter sits, the empty space and the one clear subject. */
  W.look("visualDensity", (v, k) => {
    const d = v.n("setting");
    const empty = v.n("emptySpace") / 100;
    const where = v("clutterWhere");
    const fp = v.p("focusPoint");
    const mv = v.n("motionLoad");
    let out = k.bg("#2a2e38") + k.floor(120, "#3a3530");
    const ew = 300 * empty;
    out += rect(10, 24, ew, 118, "#000", { op: 0.25, dash: "4 3", stroke: "#888" });
    const count = d * 5;
    for (let i = 0; i < count; i++) {
      let x = 10 + ew + k.rnd(i + 1) * (300 - ew);
      let y = 24 + k.rnd(i + 50) * 118;
      let s = 4 + k.rnd(i + 90) * 6;
      if (where === "background") (y = 24 + k.rnd(i + 50) * 60), (s *= 0.6);
      if (where === "foreground") (y = 110 + k.rnd(i + 50) * 40), (s *= 1.6);
      if (where === "edges") x = k.rnd(i + 7) > 0.5 ? 300 - k.rnd(i) * 30 : 10 + ew + k.rnd(i) * 30;
      out += rect(x - s / 2, y - s / 2, s, s, PAL[i % 8], { op: 0.75 });
      if (i < mv) out += line(x - s - 10, y, x - s - 2, y, "#fff", 1.5) + line(x - s - 8, y + 3, x - s - 2, y + 3, "#fff", 1);
    }
    const subj = fp > 0.9 ? 1 : fp > 0.6 ? 1 : fp > 0.3 ? 3 : 5;
    for (let i = 0; i < subj; i++) out += k.person({ x: 10 + ew + 30 + i * 46, y: 150, s: fp > 0.6 ? 1.1 : 0.8, color: fp > 0.6 ? "#ffd166" : PAL[i], alpha: fp > 0.9 ? 1 : 0.9 });
    if (fp > 0.9) out += k.vignette(0.7);
    const tr = v.p("trend");
    for (let j = 0; j < 3; j++) out += rect(256 + j * 18, 6, 14, 12, "#222", { stroke: "#666" }) + rect(258 + j * 18, 16 - Math.max(1, (0.5 + (tr - 0.5) * (j - 1)) * 8), 10, Math.max(1, (0.5 + (tr - 0.5) * (j - 1)) * 8), "#ffd166");
    return out + cap(k, `density ${d}/10 · ${r1(v.n("emptySpace"))}% empty · busy in the ${where} · ${mv} moving · ${v("trend")}`);
  });

  /* A held constant (a sound, a color, a pose...) running under a row of panels, and the pressure it builds. */
  W.look("pedal", (v, k) => {
    const many = v.p("setting");
    const len = Math.round(k.lerp(2, 12, (v.n("length") - 1) / 39));
    const what = v("heldWhat");
    const pr = v.p("pressure");
    const sh = v.n("heldShare") / 100;
    let out = k.bg(k.mix("#18181c", "#3a1418", pr)) + k.title("A constant held under the scene");
    for (let i = 0; i < Math.round(pr * 10); i++) out += line(0, 30 + i * 13, 320, 30 + i * 13, "#ef476f", 0.6, "2 4");
    for (let i = 0; i < 12; i++) {
      const x = 10 + i * 25;
      const held = many > 0 && i < len;
      out += rect(x, 40, 22, 40, "#2a2a32", { stroke: "#555" });
      if (!held) continue;
      const s = 5 + sh * 9;
      const cx = x + 11;
      if (what === "a sound") out += k.wave({ x: x + 1, y: 60, w: 20, h: s * 2, amp: 1, cycles: 2, color: "#9fd3ff" });
      if (what === "a color") out += rect(x + 11 - s, 60 - s, s * 2, s * 2, "#c77dff", { op: 0.8 });
      if (what === "a place") out += path([[x + 2, 72], [cx, 72 - s * 2], [x + 20, 72]], "#81b29a", 2);
      if (what === "a camera position") out += k.cam({ x: cx, y: 60, s: s / 14 });
      if (what === "a pose") out += k.person({ x: cx, y: 78, s: s / 28, arms: 1, color: "#e07a5f" });
      if (many > 0.9) out += k.dot({ x: cx, y: 46, r: 2.5, color: "#ffd166" });
    }
    if (!many) out += tag(k, 160, 64, "nothing held", "#777");
    const bp = { never: -1, "at the turn": 0.5, "at the climax": 0.8, "at the end": 1 }[v("breakAt")];
    out += axis(k, 10, 112, 300, "scene", "");
    if (bp >= 0) out += star(10 + bp * 300, 108, 8, "#ffd166", 6) + tag(k, k.clamp(10 + bp * 300, 34, 286), 128, "it changes", "#ffd166", "middle", 8);
    else out += tag(k, 300, 128, "never changes", "#888", "end", 8);
    return out + cap(k, `${v("setting")}: ${what} · held ${r1(v.n("length"))} panels · ${v("pressure")} · ${r1(v.n("heldShare"))}% attention`);
  });

  /* The camera operator: a frame that sways, breathes, hunts for the subject and finds them late. */
  W.look("operatorFeel", (v, k) => {
    const feel = v.n("setting") / 5;
    const sway = v.n("swayDegrees") * (0.4 + feel * 0.6);
    const br = v.n("breathing") / 5;
    const hunt = v.p("searching");
    const urg = v.p("urgency");
    const mis = v.n("mistakes");
    let out = k.bg(BG) + room(k, { y: 120 }) + k.person({ x: 160, y: 150, s: 1.3, color: "#e07a5f" });
    const fx = 160 + hunt * 40;
    const fy = 75 - br * 10;
    for (let g = 0; g < 1 + Math.round(br * 2); g++) out += `<rect x="${r1(fx - 70)}" y="${r1(fy - 45 + g * 5)}" width="140" height="90" fill="none" stroke="#ffd166" stroke-width="1" opacity="${r1(0.3 / (g + 1))}" transform="rotate(${r1(sway)} ${r1(fx)} ${r1(fy)})"/>`;
    out += `<rect x="${r1(fx - 70)}" y="${r1(fy - 45)}" width="140" height="90" fill="none" stroke="#ffd166" stroke-width="2.5" transform="rotate(${r1(sway)} ${r1(fx)} ${r1(fy)})"/>`;
    if (hunt > 0) out += path([[fx - 60, fy + 30], [fx - 30, fy - 20], [fx + 10, fy + 20], [fx, fy]], "#fff", 1, "2 3");
    for (let i = 0; i < mis; i++) out += star(30 + i * 14, 30, 4, "#ef476f", 4);
    for (let i = 0; i < Math.round(urg * 4); i++) out += line(272, 30 + i * 8, 300, 26 + i * 8, "#fff", 1.5);
    /* breathing and cut timing */
    out += rect(0, 124, 320, 38, BG);
    out += k.wave({ x: 12, y: 136, w: 180, h: 18, amp: 0.15 + br * 0.85, cycles: v.n("breathsPerMin") / 4, color: "#9fd3ff" }) + tag(k, 12, 128, "breath", "#888", "start", 7);
    const cd = v.n("cutDrift");
    for (let i = 0; i < 5; i++) {
      const x = 210 + i * 20;
      out += line(x, 142, x, 150, "#666", 1) + line(x + (k.rnd(i + 2) - 0.5) * cd * 1.5, 130, x + (k.rnd(i + 2) - 0.5) * cd * 1.5, 140, "#fff", 2);
    }
    const late = v.n("findLate");
    out += line(12, 156, 12 + late * 60, 156, "#06d6a0", 3) + tag(k, 16 + late * 60, 158, `finds them ${r1(late)} s late`, "#06d6a0", "start", 7);
    return out + cap(k, `handheld ${r1(v.n("setting"))}/5 · sway ${r1(v.n("swayDegrees"))}° · ${v("urgency")} · hunts ${v("searching")}`);
  });

  /* A loop: the ending joins back to the start, the seam between them, and how closely the two ends match. */
  W.look("loopEnding", (v, k) => {
    const mode = v.p("setting");
    const close = v.n("matchClose") / 100;
    const sig = v.p("signal");
    const seam = v.n("seamLength");
    const m = v("match");
    const cx = 160;
    const cy = 88;
    const R = 54;
    let out = k.bg(BG) + k.title("End joins back to the start");
    const gapA = mode === 0 ? 0.5 : 0.05;
    const arc = (a0, a1) => `M${r1(cx + Math.cos(a0) * R)} ${r1(cy + Math.sin(a0) * R)} A${R} ${R} 0 1 1 ${r1(cx + Math.cos(a1) * R)} ${r1(cy + Math.sin(a1) * R)}`;
    out += `<path d="${arc(-Math.PI / 2 + gapA, -Math.PI / 2 - gapA)}" fill="none" stroke="#6c8fb8" stroke-width="8"${mode > 0.3 && mode < 0.7 ? ' stroke-dasharray="10 3"' : ""}/>`;
    const tl = Math.round(4 + (v.n("loopLength") / 600) * 36);
    for (let i = 0; i < tl; i++) { const a = (i / tl) * Math.PI * 2; out += line(cx + Math.cos(a) * (R - 6), cy + Math.sin(a) * (R - 6), cx + Math.cos(a) * (R - 10), cy + Math.sin(a) * (R - 10), "#555", 1); }
    if (mode < 0.9) out += rect(cx - 2 - seam * 6, cy - R - 6, 4 + seam * 12, 12, "#ffd166", { op: 0.7 });
    out += k.label({ x: cx, y: cy + 4, text: `${r1(v.n("loopLength"))} s`, size: 12, color: "#ddd" });
    /* the end and the start, side by side */
    const diff = 1 - close;
    const thumb = (shift, tintC) => room(k) + k.person({ x: 160 + shift * 60, y: 165, s: 1.6, color: "#e07a5f", arms: shift }) + (m === "the line" || m === "everything" ? k.bubble({ x: 230, y: 34, text: shift ? "Wait…" : "Again?", w: 120, h: 40, size: 20 }) : "") + (tintC ? k.tint({ color: tintC, alpha: 0.3 }) : "");
    const ms = v.p("meaningShift");
    out += mini("cw-loopEnding-end", 12, 30, 80, thumb(m === "the sound" ? diff : diff)) + tag(k, 52, 84, "the end", "#888");
    out += mini("cw-loopEnding-start", 228, 30, 80, thumb(m === "the picture" || m === "everything" ? 0 : diff * 0.5, ms > 0 ? k.mix("#ffd166", "#ef476f", ms) : null)) + tag(k, 268, 84, "the start, again", "#888");
    if (m === "the sound" || m === "everything") out += k.wave({ x: 12, y: 100, w: 80, h: 12, amp: 0.8, cycles: 3 }) + k.wave({ x: 228, y: 100, w: 80, h: 12, amp: 0.8 * (1 - diff * 0.7), cycles: 3 + diff * 3 });
    out += k.text({ x: cx, y: cy + 34, text: "↻", size: 10 + sig * 18, color: "#06d6a0", alpha: 0.25 + sig * 0.75 });
    return out + cap(k, `${v("setting")} · matches ${m} ${r1(v.n("matchClose"))}% · seam ${seam} s · ${v("meaningShift")} new`);
  });

  /* Turning or flipping the picture: around a pivot, cropped in, and how uneasy it makes the frame. */
  W.look("imageTransform", (v, k) => {
    const how = v("setting");
    const ang = v.n("angle");
    const crop = v.n("crop") / 100;
    const px = (v.n("pivotAcross") / 100) * 320;
    const py = (1 - v.n("pivotUp") / 100) * 180;
    const un = v.p("unease");
    const scene = k.sky(0.7) + k.floor(130, "#4a6a3a") + `<circle cx="60" cy="40" r="18" fill="#ffd166"/>` + k.person({ x: 210, y: 160, s: 1.6, color: "#e07a5f", arms: 0.8 });
    const tf = how === "mirrored" ? `translate(320 0) scale(-1 1)` : how === "flipped" ? `translate(0 180) scale(1 -1)` : how === "rotated" ? `rotate(${ang} ${r1(px)} ${r1(py)})` : how === "tilted" ? `rotate(${r1(ang / 6)} ${r1(px)} ${r1(py)})` : "";
    const z = 1 / (1 - crop);
    const inner = `<g transform="translate(200 105) scale(${r1(z * 100) / 100}) translate(-200 -105)"><g transform="${tf}">${scene}</g></g>` + (un > 0 ? k.tint({ color: "#7a9a3a", alpha: un * 0.35 }) : "");
    let out = k.bg(BG) + mini("cw-imageTransform-clip", 70, 8, 180, inner);
    out += `<clipPath id="cw-imageTransform-ov"><rect x="70" y="8" width="180" height="101"/></clipPath><g clip-path="url(#cw-imageTransform-ov)"><g transform="translate(70 8) scale(0.5625)"><rect x="40" y="25" width="240" height="130" fill="none" stroke="#fff" stroke-width="2" stroke-dasharray="6 5" transform="rotate(${r1(ang)} ${r1(px)} ${r1(py)})" opacity="0.6"/><circle cx="${r1(px)}" cy="${r1(py)}" r="7" fill="#ffd166" stroke="#000" stroke-width="2"/></g></g>`;
    const tt = v.n("turnTime");
    const when = { "at the start": 0, "mid-shot": 0.45, "on a hit": 0.6, throughout: 0 }[v("turnWhen")];
    const w2 = v("turnWhen") === "throughout" ? 296 : Math.max(2, (tt / 10) * 140);
    out += axis(k, 12, 128, 296, "shot start", "end") + rect(12 + when * 296, 116, Math.min(w2, 296 - when * 296), 9, "#ffd166", { op: 0.8 }) + (v("turnWhen") === "on a hit" ? star(12 + when * 296, 112, 5, "#ef476f", 5) : "");
    return out + cap(k, `${how} · ${ang}° · crop ${r1(v.n("crop"))}% · turns over ${tt} s ${v("turnWhen")} · ${v("unease")}`);
  });

  /* Steadying shaky footage: the raw shake against the smoothed path, the crop that hides the edges, and wobble. */
  W.look("stabilization", (v, k) => {
    const lvl = v.p("setting");
    const keep = v.n("keepShake") / 100;
    const crop = v.n("edgeCrop") / 100;
    const rise = v.p("shakeRise");
    const win = v.n("smoothTime");
    const rs = v("rollingShutter") === "on";
    const raw = [];
    for (let i = 0; i <= 80; i++) raw.push(0.5 + (k.rnd(i) - 0.5) * 0.7 * (1 + rise * (i / 80) * 1.2) * 0.8);
    const W2 = Math.max(1, Math.round(1 + win * 4 + lvl * 6));
    const sm = raw.map((_, i) => {
      let s = 0;
      let c = 0;
      for (let j = Math.max(0, i - W2); j <= Math.min(80, i + W2); j++) (s += raw[j]), c++;
      const smooth = lvl > 0.9 ? 0.5 : s / c;
      return smooth + (raw[i] - smooth) * keep * 0.5 * (1 - lvl * 0.5);
    });
    let out = k.bg(BG) + k.title("Camera path: raw (grey) and steadied (yellow)");
    out += k.graph({ x: 12, y: 24, w: 180, h: 70, points: raw, color: "#666", w2: 1.2 }) + k.graph({ x: 12, y: 24, w: 180, h: 70, points: sm, color: "#ffd166" });
    /* the frame */
    const resid = (1 - lvl) * 8 + keep * 4;
    const scene = room(k) + k.person({ x: 160, y: 165, s: 1.6, color: "#4a6fa5" }) + [0, 1, 2, 3].map((i) => `<path d="M${40 + i * 80} 0 ${rs ? `L${40 + i * 80} 125` : `Q${70 + i * 80} 62 ${40 + i * 80} 125`}" stroke="#5a4a3a" stroke-width="5" fill="none"/>`).join("");
    const inner = `<g opacity="0.35" transform="translate(${r1(resid * 3)} ${r1(-resid * 2)})">${scene}</g><g transform="translate(160 90) scale(${r1((1 + crop) * 100) / 100}) translate(-160 -90)">${scene}</g>`;
    out += mini("cw-stabilization-clip", 200, 30, 110, inner);
    out += rect(200 + 55 - 55 / (1 + crop), 30 + 31 - 31 / (1 + crop), 110 / (1 + crop), 62 / (1 + crop), "none", { stroke: "#06d6a0", sw: 1, dash: "3 2" });
    out += tag(k, 255, 104, rs ? "wobble fixed" : "wobble left in", rs ? "#06d6a0" : "#ef476f");
    out += k.meter({ x: 12, y: 116, w: 120, label: `smoothing window ${r1(win)} s`, p: win / 5, color: "#ffd166" }) + k.meter({ x: 12, y: 142, w: 120, label: `keep ${r1(v.n("keepShake"))}% life`, p: keep, color: "#9fd3ff" });
    out += tag(k, 200, 128, `shake rises: ${v("shakeRise")}`, "#aaa", "start") + tag(k, 200, 144, `zoom ${r1(v.n("edgeCrop"))}% to hide edges`, "#aaa", "start");
    return out + cap(k, `${v("setting")}`);
  });

  /* Fitting a clip into a different frame shape: what fills the edges, where the clip sits and how big. */
  W.look("canvasFill", (v, k) => {
    const ratio = v("ratio");
    const r = /9:16/.test(ratio) ? 9 / 16 : /1:1/.test(ratio) ? 1 : /2.39/.test(ratio) ? 2.39 : 16 / 9;
    const H2 = 140;
    let cw = Math.min(300, H2 * r);
    let ch = cw / r;
    const cx = 160 - cw / 2;
    const cy = 12 + (H2 - ch) / 2;
    const clipR = r < 1.2 ? 16 / 9 : 9 / 16;
    const sz = v.n("clipSize") / 100;
    let w = Math.min(cw, ch * clipR) * sz;
    let h = w / clipR;
    if (h > ch * sz) (h = ch * sz), (w = h * clipR);
    const x = cx + (cw - w) * (v.n("clipAcross") / 100);
    const y = cy + (ch - h) * (1 - v.n("clipUp") / 100);
    const scene = k.sky(0.7) + k.floor(120, "#4a6a3a") + k.person({ x: 160, y: 165, s: 1.6, color: "#e07a5f" });
    const edge = v("setting");
    const fc = { black: "#000000", white: "#f4f4f4", "matched to the shot": "#5f8a5a", "brand color": "#c77dff" }[v("fillColor")];
    const bl = v.n("blur") / 100;
    let bgS = `<clipPath id="cw-canvasFill-c"><rect x="${r1(cx)}" y="${r1(cy)}" width="${r1(cw)}" height="${r1(ch)}"/></clipPath><g clip-path="url(#cw-canvasFill-c)">`;
    if (edge === "black bars") bgS += rect(cx, cy, cw, ch, "#000");
    else if (edge === "blurred copy") bgS += `<filter id="cw-canvasFill-b"><feGaussianBlur stdDeviation="${r1(1 + bl * 12)}"/></filter><g filter="url(#cw-canvasFill-b)" transform="translate(${r1(cx)} ${r1(cy)}) scale(${r1((Math.max(cw / 320, ch / 180)) * 100) / 100})">${scene}</g>`;
    else if (edge === "a color") bgS += rect(cx, cy, cw, ch, fc);
    else {
      bgS += rect(cx, cy, cw, ch, fc);
      for (let i = -20; i < 40; i++) bgS += line(cx + i * 10, cy, cx + i * 10 + ch, cy + ch, "#ffffff", 2);
    }
    bgS += rect(cx, cy, cw, ch, "#000", { op: (v.n("bgDim") / 100) * 0.85 }) + "</g>";
    let out = k.bg(BG) + bgS + rect(cx, cy, cw, ch, "none", { stroke: fc === "#000000" ? "#555" : fc, sw: 2 });
    /* The clip keeps its own shape (a tall phone clip in a wide frame, or the other way round), cropped, not squashed. */
    const cs = Math.max(w / 320, h / 180);
    out += `<clipPath id="cw-canvasFill-k"><rect x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(h)}"/></clipPath><g clip-path="url(#cw-canvasFill-k)"><g transform="translate(${r1(x + w / 2 - 160 * cs)} ${r1(y + h / 2 - 90 * cs)}) scale(${r1(cs * 1000) / 1000})">${scene}</g></g>` + rect(x, y, w, h, "none", { stroke: "#fff", sw: 1.5 });
    return out + cap(k, `${ratio} · edges: ${edge} · ${v("fillColor")} · blur ${r1(v.n("blur"))}% · clip ${r1(v.n("clipSize"))}%`);
  });

  /* Dot-grid controls: one extra pad for curiosities that had none, pairing two settings that belong together. */
  const pad = (id, x, y, xLabel, yLabel) => {
    const g = W.get(id);
    if (g && (g.faces || []).some((f) => f.face === "pad")) return;
    W.add(id, { window: { faces: [{ face: "pad", x, y, xLabel, yLabel }] } });
  };
  pad("tensionCurve", "buildTime", "setting", "Slower build", "More tension");
  pad("mains", "share", "longestAway", "More of the hour", "Longer away");
  pad("exit", "warning", "weight", "More warning", "Heavier");
  pad("povSwitch", "switchesPerHour", "mainShare", "More switches", "More with the main");
  pad("sceneEnding", "lastShotLength", "holdAfter", "Longer last shot", "Longer hold");
  pad("openingGrab", "seconds", "firstCutAt", "Lands later", "First cut later");
  pad("groups", "groupBalance", "groupSize", "More to group one", "Bigger groups");
  pad("sceneRate", "perHour", "burstLength", "More scenes", "Longer fast runs");
  pad("hook", "minutesBetween", "frameShare", "Further apart", "Bigger in frame");
  pad("phraseScheme", "runLength", "runsPerScene", "Longer runs", "More runs");
  pad("transition", "length", "soundEarly", "Longer transition", "Sound earlier");
  pad("contrastMap", "sideShare", "flipsPerHour", "More on the first side", "More flips");
  pad("cutArticulation", "breathFrames", "clipFrames", "More breath", "More cut off");
  pad("motifShape", "peakAt", "size", "Peak later", "Bigger swing");
  pad("sceneLength", "shortestMin", "longestMin", "Longer shortest", "Longer longest");
  pad("timeLens", "speedPct", "holdLength", "Faster", "Odd speed lasts longer");
  pad("frameMove3D", "turnAngle", "tiltAngle", "Turns further", "Tilts toward us");
  pad("multicamSwitch", "rate", "angles", "More switches", "More cameras");
  pad("nestedScene", "pieceLength", "pieceCount", "Longer piece", "More shots inside");
  pad("editFocus", "sharpDistance", "blur", "Sharp further away", "More blur");
  pad("visualDensity", "emptySpace", "motionLoad", "More empty space", "More moving");
  pad("pedal", "length", "heldShare", "Held longer", "More attention");
  pad("loopEnding", "loopLength", "matchClose", "Longer loop", "Ends match closer");
  pad("imageTransform", "pivotAcross", "pivotUp", "Pivot to the right", "Pivot higher");
})(typeof window !== "undefined" ? window.CuriosityWindows : require("./windows.js"));
