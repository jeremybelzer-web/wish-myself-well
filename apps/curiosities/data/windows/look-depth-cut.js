/* look for the curiosities in data/db-depth-cut.js (depth thread, cut): the live picture at the top of each window.
   Same house style as look-heart-comedy.js: a picture on top (y 0 to 120) showing the cut, the speed, the words,
   the frame or the color, a strip of small labelled gauges below it, and a caption. Colors: gold = the moment,
   red = trouble, blue = the first shot, green = the next shot. Every own setting moves something of its own. */
(function (W) {
  const S = { bg: "#17161d", floor: "#2b2533", gold: "#ffd166", red: "#e4572e", blue: "#4a6fa5", orange: "#e8913a", green: "#5fae78", purple: "#9b6bb5", grey: "#8a8a96", pink: "#d9789b", paper: "#f4f1ea", ink: "#1c1712", ice: "#9fd3ff", screen: "#24232c" };
  const r1 = (n) => Math.round(n * 10) / 10;
  const fmt = (n) => String(Math.round(n * 100) / 100);
  const FY = 112; /* the floor: people's feet */

  /* ---------- shared pieces (copied from look-heart-comedy.js) ---------- */
  const stage = (k, o) => {
    o = o || {};
    return k.bg(o.bg || S.bg) + (o.floor === false ? "" : `<rect x="0" y="${FY}" width="320" height="8" fill="${o.floor || S.floor}"/>`);
  };
  const guy = (k, x, o) => k.person(Object.assign({ x, y: FY }, o || {}));
  function burst(k, x, y, r, color, txt, tsize) {
    const pts = [];
    for (let i = 0; i < 20; i++) {
      const a = (i / 20) * Math.PI * 2;
      const rr = i % 2 ? r * 0.62 : r;
      pts.push(`${r1(x + Math.cos(a) * rr)},${r1(y + Math.sin(a) * rr)}`);
    }
    return `<polygon points="${pts.join(" ")}" fill="${color || S.gold}" stroke="${S.ink}" stroke-width="2"/>` + (txt ? k.text({ x, y: y + (tsize || 10) * 0.35, text: txt, size: tsize || 10, color: S.ink, weight: 900 }) : "");
  }
  const motion = (k, x, y, n, len, dir) => Array.from({ length: Math.max(0, Math.round(n)) }, (_, i) => `<line x1="${r1(x)}" y1="${r1(y + i * 6)}" x2="${r1(x - (dir || 1) * len)}" y2="${r1(y + i * 6)}" stroke="#eee" stroke-width="1.5" stroke-linecap="round" opacity="0.7"/>`).join("");
  const chip = (k, x, y, text, color, anchor) => {
    const w = String(text).length * 5.2 + 10;
    const x0 = anchor === "end" ? x - w : anchor === "middle" ? x - w / 2 : x;
    return `<rect x="${r1(x0)}" y="${r1(y - 10)}" width="${r1(w)}" height="14" rx="7" fill="${color || "#33323d"}" stroke="#555" stroke-width="0.8"/>` + k.label({ x: x0 + w / 2, y: y + 0.5, text, size: 9, color: "#fff" });
  };
  function film(k, x, y, w, o) {
    o = o || {};
    let out = `<rect x="${x}" y="${y}" width="${w}" height="10" rx="2" fill="#2e2d36" stroke="#555"/>`;
    for (let i = 1; i < 12; i++) out += `<line x1="${r1(x + (i * w) / 12)}" y1="${y + 1}" x2="${r1(x + (i * w) / 12)}" y2="${y + 9}" stroke="#444"/>`;
    (o.spans || []).forEach((s) => (out += `<rect x="${r1(x + w * s.a)}" y="${y + 1}" width="${r1(Math.max(1.5, w * (s.b - s.a)))}" height="8" fill="${s.color || S.gold}" opacity="${s.alpha || 0.85}"/>`));
    (o.pins || []).forEach((p) => {
      const px = x + w * k.clamp(p.p, 0, 1);
      out += `<path d="M${r1(px)} ${y + 10} l-4 -14 h8 Z" fill="${p.color || S.red}" stroke="${S.ink}"/>` + (p.label ? k.label({ x: px, y: y - 7, text: p.label, size: 8, color: p.color || "#eee" }) : "");
    });
    if (o.ends !== false) out += k.label({ x, y: y + 20, text: o.startText || "start", size: 7, color: "#888", anchor: "start" }) + k.label({ x: x + w, y: y + 20, text: o.endText || "end", size: 7, color: "#888", anchor: "end" });
    return out;
  }
  const stopwatch = (k, x, y, w, sec, max, color, lab) => `<rect x="${x}" y="${y}" width="${w}" height="7" rx="3.5" fill="#33323d"/><rect x="${x}" y="${y}" width="${r1(Math.max(2, (w * k.clamp(sec, 0, max)) / max))}" height="7" rx="3.5" fill="${color || S.gold}"/>` + k.label({ x: x + w + 4, y: y + 7, text: lab || `${fmt(sec)} s`, size: 8, color: "#ddd", anchor: "start" });
  const beats = (k, x, y, n, color, gap) => Array.from({ length: Math.max(0, Math.round(n)) }, (_, i) => k.dot({ x: x + i * (gap || 9), y, r: 3, color: color || "#bbb" })).join("");
  /* A little screen: a picture inside the picture. */
  const screen = (x, y, w, h, fill, stroke) => `<rect x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(h)}" rx="3" fill="${fill || S.screen}" stroke="${stroke || "#5a5966"}" stroke-width="1.5"/>`;
  const box = (x, y, w, h, fill, o) => `<rect x="${r1(x)}" y="${r1(y)}" width="${r1(Math.max(0.5, w))}" height="${r1(Math.max(0.5, h))}" fill="${fill}"${o ? " " + o : ""}/>`;
  const emoji = (k, x, y, t, size) => k.label({ x, y, text: t, size: size || 14 });

  /* ---------- the strip of small gauges (copied from look-heart-comedy.js) ---------- */
  function strip(k, items) {
    const n = items.length;
    const cols = n > 4 ? 3 : 2;
    const cw = 304 / cols;
    let out = `<rect x="0" y="120" width="320" height="42" fill="#0e0e13"/><line x1="0" y1="120" x2="320" y2="120" stroke="#34323c"/>`;
    items.forEach((it, j) => {
      const x = 8 + (j % cols) * cw;
      const y = 130 + Math.floor(j / cols) * 19;
      const w = cw - 12;
      const c = it.color || S.gold;
      out += k.label({ x, y, text: it.label, size: 8, color: "#a3a3b3", anchor: "start" });
      const by = y + 3;
      const txt = String(it.text);
      const short = txt.length > (cols === 3 ? 15 : 24) ? txt.slice(0, cols === 3 ? 14 : 23) + "…" : txt;
      if (it.kind === "word") {
        out += k.label({ x, y: by + 7, text: short, size: 8, color: "#fff", anchor: "start", weight: 700 });
      } else if (it.kind === "steps") {
        const sw = Math.min(9, (w * 0.42) / it.n);
        for (let i = 0; i < it.n; i++) out += `<rect x="${r1(x + i * sw)}" y="${by}" width="${r1(sw - 1.5)}" height="7" rx="1.5" fill="${i <= it.i ? c : "#33323d"}"/>`;
        out += k.label({ x: x + it.n * sw + 3, y: by + 7, text: short, size: 8, color: "#fff", anchor: "start", weight: 700 });
      } else {
        const bw = w - (cols === 3 ? 30 : 40);
        out += `<rect x="${x}" y="${by}" width="${r1(bw)}" height="7" rx="3.5" fill="#33323d"/>`;
        out += `<rect x="${x}" y="${by}" width="${r1(Math.max(2, bw * k.clamp(it.p, 0, 1)))}" height="7" rx="3.5" fill="${c}"/>`;
        out += k.label({ x: x + bw + 4, y: by + 7, text: short, size: 8, color: "#fff", anchor: "start", weight: 700 });
      }
    });
    return out;
  }
  const G = (v) => ({
    num: (id, label, unit, color) => ({ label, kind: "bar", p: v.p(id), text: fmt(v.n(id)) + (unit || ""), color }),
    steps: (id, label, color) => {
      const s = v.slider(id);
      const sc = (s && s.scale) || [];
      return { label, kind: "steps", n: sc.length, i: sc.indexOf(v(id)), text: v(id), color };
    },
    word: (id, label) => ({ label, kind: "word", text: v(id) }),
  });
  const idx = (v, id, len) => {
    const s = v.slider(id);
    const i = s && s.scale ? Math.max(0, s.scale.indexOf(v(id))) : 0;
    return len ? Math.min(len - 1, i) : i;
  };
  const look = (id, fn) => W.look(id, (v, k) => fn(v, k, G(v)));

  /* ======================= Transitions ======================= */

  /* holdBeforeCut: a screen showing what we hold on, the sound beside it, and a film bar where the hold stretches. */
  look("holdBeforeCut", (v, k, g) => {
    const hl = v.n("holdLength");
    const on = idx(v, "onWhat", 4);
    const st = idx(v, "stillness", 4);
    const so = idx(v, "sound", 4);
    const ex = idx(v, "exit", 3);
    let out = stage(k, { floor: false }) + screen(16, 8, 150, 82);
    if (on === 0) out += box(16, 8, 150, 82, "#3a3428") + box(70, 28, 30, 62, "#1e1a14", `stroke="${S.ink}"`) + emoji(k, 130, 40, "🪑", 16);
    else if (on === 1) out += k.face({ x: 91, y: 49, r: 28, mood: -0.25, look: 0.3, eyes: 0.7 });
    else if (on === 2) out += `<path d="M76 50 h30 v26 q0 8 -8 8 h-14 q-8 0 -8 -8 Z" fill="${S.paper}" stroke="${S.ink}" stroke-width="2"/><path d="M106 56 q10 0 10 8 q0 8 -10 8" fill="none" stroke="${S.ink}" stroke-width="2"/>` + box(36, 84, 110, 4, "#6a5440");
    else out += `<path d="M16 70 Q60 40 100 64 T166 56 V90 H16 Z" fill="#3f6b4a"/>` + k.dot({ x: 140, y: 26, r: 9, color: S.gold });
    /* stillness: the less still, the more motion lines */
    out += motion(k, 160, 18, (3 - st) * 2, 16, 1);
    if (st === 3) out += k.label({ x: 30, y: 22, text: "❄ still", size: 9, color: S.ice, anchor: "start" });
    /* the sound */
    out += emoji(k, 200, 32, ["🗣️", "〰️", "🎻", "🔇"][so], 18) + k.wave({ x: 220, y: 28, w: 84, h: 26, amp: [0.6, 0.15, 0.95, 0][so], cycles: [7, 12, 3, 4][so], noise: so === 1 ? 0.6 : 0, color: [S.ice, S.grey, S.gold, "#444"][so] });
    /* the film bar: the line ends, the hold stretches, then the exit */
    const a = 0.3;
    const b = a + (hl / 8) * 0.55;
    out += k.label({ x: 186, y: 66, text: `holds ${fmt(hl)} s`, size: 10, color: S.gold, anchor: "start", weight: 700 });
    let bar = film(k, 16, 100, 288, { spans: [{ a: 0, b: a, color: S.blue }, { a, b, color: S.gold }], pins: [{ p: a, label: "line ends", color: "#ccc" }], ends: false });
    const cx = 16 + 288 * b;
    if (ex === 0) bar += `<line x1="${r1(cx)}" y1="96" x2="${r1(cx)}" y2="114" stroke="${S.red}" stroke-width="3"/>`;
    else if (ex === 1) for (let i = 0; i < 5; i++) bar += box(cx + i * 6, 101, 6, 8, "#000", `opacity="${r1(0.2 + i * 0.16)}"`);
    else bar += k.arrow({ x1: cx + 24, y1: 92, x2: cx - 14, y2: 92, color: S.green, w: 2 }) + `<line x1="${r1(cx)}" y1="96" x2="${r1(cx)}" y2="114" stroke="${S.green}" stroke-width="2"/>`;
    out += bar;
    out += strip(k, [g.num("holdLength", "Hold", " s"), g.word("onWhat", "On"), g.steps("stillness", "Still", S.ice), g.word("sound", "Sound"), g.word("exit", "Leaves")]);
    return out + k.caption(`Holds ${fmt(hl)} s on ${v("onWhat")}, then ${v("exit")}`);
  });

  /* bridgeLine: two screens, a line starts in one and is finished in the other, joined by an arc. */
  look("bridgeLine", (v, k, g) => {
    const fit = v.n("fit");
    const kind = idx(v, "kind", 4);
    const lp = idx(v, "leap", 4);
    const sp = idx(v, "speaker", 4);
    const sg = idx(v, "sting", 4);
    let out = stage(k, { floor: false });
    out += screen(10, 34, 120, 70, "#26324a") + screen(190, 34, 120, 70, k.mix("#2c4a36", "#4a2c2c", sg / 3));
    out += guy(k, 60, { s: 0.6, color: S.blue, look: 1, mood: 0 });
    out += k.bubble({ x: 70, y: 18, w: 96, h: 22, text: "Where is he?", tail: -10, size: 10 });
    /* the speaker on the other side */
    if (sp === 3) out += box(236, 70, 30, 22, "#6a5440", `stroke="${S.ink}"`) + `<line x1="262" y1="70" x2="270" y2="54" stroke="${S.ink}" stroke-width="2"/>` + k.dot({ x: 244, y: 81, r: 5, color: "#333" });
    else out += guy(k, 250, { s: 0.6, color: [S.blue, S.orange, S.grey][sp], look: -1, mood: sg === 2 ? 0.7 : sg === 3 ? -0.6 : 0.2 });
    out += k.bubble({ x: 250, y: 18, w: 104, h: 22, text: ["Right here.", "...left at dawn.", "Nowhere!", "Where is he?"][kind], tail: 10, size: 10 });
    out += k.label({ x: 300, y: 46, text: ["", "😉", "😂", "💔"][sg], size: 12 });
    /* the arc: thick and bright when the lines fit neatly */
    out += `<path d="M118 22 Q160 ${r1(-6 + (5 - fit) * 4)} 198 22" fill="none" stroke="${S.gold}" stroke-width="${r1(1 + fit * 0.8)}" opacity="${r1(0.3 + fit * 0.14)}" stroke-dasharray="${fit >= 4 ? "none" : "4 3"}"/>`;
    /* the cut and the leap between the places */
    out += `<line x1="160" y1="34" x2="160" y2="104" stroke="${S.red}" stroke-width="2" stroke-dasharray="3 3"/>` + k.label({ x: 160, y: 30, text: "cut", size: 8, color: S.red });
    for (let i = 0; i <= lp; i++) out += k.clock({ x: 146 + (i % 2) * 28, y: 56 + Math.floor(i / 2) * 26, r: 9, p: 0.15 + i * 0.22 });
    out += strip(k, [g.num("fit", "Fits", " of 5"), g.word("kind", "Connects"), g.steps("leap", "Leap"), g.word("speaker", "Second half"), g.steps("sting", "Stings", S.red)]);
    return out + k.caption(`The line ${v("kind")}, ${v("leap")}`);
  });

  /* cutBeforeHit: the fist on the left stops short of the face; the screen cuts to something else on the right. */
  look("cutBeforeHit", (v, k, g) => {
    const e = idx(v, "early", 4);
    const ct = idx(v, "cutTo", 4);
    const hd = idx(v, "heard", 4);
    const hu = v.n("hurt");
    const sl = idx(v, "shownLater", 4);
    let out = stage(k, { floor: false }) + screen(10, 8, 140, 84);
    out += k.face({ x: 118, y: 50, r: 20, mood: -0.4, look: -1, eyes: 0.9 });
    const fx = 92 - e * 18;
    out += `<rect x="${r1(fx - 26)}" y="42" width="26" height="16" rx="6" fill="#f0c8a0" stroke="${S.ink}" stroke-width="1.5"/>` + box(12, 46, Math.max(1, fx - 38), 8, S.blue);
    /* the cut line and the next screen */
    out += `<line x1="160" y1="6" x2="160" y2="94" stroke="${S.red}" stroke-width="2.5"/>` + k.label({ x: 160, y: 104, text: "CUT", size: 8, color: S.red, weight: 700 });
    out += screen(170, 8, 140, 84, ["#000", "#2c4a36", "#26324a", "#3a3428"][ct]);
    if (ct === 1) out += k.dot({ x: 280, y: 30, r: 10, color: S.gold }) + `<path d="M170 76 Q220 56 310 72 V92 H170 Z" fill="#3f6b4a"/>`;
    else if (ct === 2) out += k.face({ x: 240, y: 50, r: 24, mood: -0.7, eyes: 1, mouth: 0.5 });
    else if (ct === 3) out += `<ellipse cx="240" cy="56" rx="24" ry="16" fill="#fff" stroke="${S.ink}"/><circle cx="240" cy="56" r="8" fill="${S.gold}"/>`;
    /* the hit we never see: a dashed burst, bigger when worse */
    if (hu > 0) out += `<g opacity="0.55">${burst(k, 160, 50, 6 + hu * 4, S.red)}</g>`;
    /* what we hear */
    out += k.text({ x: 240, y: 22, text: "CRUNCH", size: 9 + (3 - hd) * 3, color: S.paper, weight: 900, alpha: [1, 0.6, 0.3, 0.05][hd] });
    /* shown later? */
    out += film(k, 10, 106, 300, { spans: sl === 3 ? [{ a: 0.7, b: 0.8, color: S.red }] : [], pins: sl === 1 ? [{ p: 0.55, color: S.grey }] : sl === 2 ? [{ p: 0.75, color: S.purple }] : [], ends: false });
    if (sl === 0) out += k.label({ x: 300, y: 104, text: "never shown", size: 8, color: "#888", anchor: "end" });
    out += strip(k, [g.steps("early", "Cuts", S.red), g.word("cutTo", "Cut to"), g.steps("heard", "Heard"), g.num("hurt", "Missed hurt", " of 5", S.red), g.word("shownLater", "Later")]);
    return out + k.caption(`Cuts ${v("early")} to ${v("cutTo")}`);
  });

  /* hiddenCut: one long bar that looks unbroken, with the real cuts showing more or less clearly inside it. */
  look("hiddenCut", (v, k, g) => {
    const hid = v.n("hidden");
    const hb = idx(v, "hiddenBy", 5);
    const tl = v.n("takeLength");
    const jn = Math.round(v.n("joins"));
    const why = idx(v, "why", 4);
    let out = stage(k);
    /* the camera follows a person through the scene */
    out += guy(k, 190, { s: 0.75, color: S.orange, walk: 0.7, look: 1 }) + k.cam({ x: 120, y: 70, dir: 0, s: 0.8 }) + k.arrow({ x1: 140, y1: 96, x2: 240, y2: 96, color: "#777", w: 2 });
    out += emoji(k, 270, 60, ["🧥", "💨", "🚪", "⚡", "🚶"][hb], 26);
    out += chip(k, 16, 22, ["to show off", "real time", "join two places", "hide a trick"][why], ["#4a3a20", "#2c3346", "#2f4a36", "#4a2a2a"][why]);
    /* the one long shot */
    const w = 30 + (tl / 600) * 270;
    out += box(16, 36, w, 12, S.blue, `rx="3"`);
    for (let i = 1; i <= jn; i++) {
      const x = 16 + (w * i) / (jn + 1);
      out += `<line x1="${r1(x)}" y1="34" x2="${r1(x)}" y2="50" stroke="${S.red}" stroke-width="2" opacity="${r1(1 - (hid / 5) * 0.88)}"/>`;
    }
    out += k.label({ x: 16, y: 60, text: `${Math.round(tl)} s, ${jn} hidden cut${jn === 1 ? "" : "s"}`, size: 8, color: "#ccc", anchor: "start" });
    out += strip(k, [g.num("hidden", "Hidden", " of 5"), g.word("hiddenBy", "Hidden by"), g.num("takeLength", "Shot", " s", S.blue), g.num("joins", "Cuts", "", S.red), g.word("why", "Why")]);
    return out + k.caption(`Looks like one ${Math.round(tl)} s shot`);
  });

  /* cutToBlack: a film bar where the black lands, and what we hear and see after. */
  look("cutToBlack", (v, k, g) => {
    const bl = v.n("blackLength");
    const wh = idx(v, "when", 4);
    const so = idx(v, "sound", 4);
    const cb = idx(v, "comeBack", 4);
    const jo = idx(v, "jolt", 3);
    let out = stage(k, { floor: false });
    const x0 = 16;
    const sA = 110;
    const bw = 8 + (bl / 10) * 120;
    out += screen(x0, 20, sA, 72, "#2c3346") + guy(k, 70, { s: 0.6, color: S.blue, mood: wh === 1 ? -0.7 : 0 });
    out += [k.bubble({ x: 80, y: 30, w: 50, h: 18, text: "I nev-", tail: -6, size: 9 }), burst(k, 100, 34, 12, S.red, "!", 10), chip(k, 96, 34, "✓ chose", "#2f4a36", "middle"), chip(k, 96, 34, "the end", "#33323d", "middle")][wh];
    out += box(x0 + sA, 20, bw, 72, "#000");
    out += emoji(k, x0 + sA + bw / 2, 60, ["", "🔊", "💥", "🎵"][so], 16) + (so === 0 ? k.label({ x: x0 + sA + bw / 2, y: 60, text: "...", size: 10, color: "#444" }) : "");
    const x2 = x0 + sA + bw;
    const ww = Math.max(20, 304 - x2);
    out += screen(x2, 20, ww, 72, ["#2c3346", "#3a4a5a", "#4a4a4a", "#000"][cb]);
    if (cb === 3) out += k.label({ x: x2 + ww / 2, y: 50, text: "THE END", size: 9, color: "#ddd", weight: 700 }) + k.label({ x: x2 + ww / 2, y: 64, text: "credits", size: 7, color: "#888" });
    else out += k.label({ x: x2 + ww / 2, y: 60, text: ["same moment", "later", "much later"][cb], size: 8, color: "#ddd" });
    /* the jolt: jagged marks around the cut */
    for (let i = 0; i < jo * 3; i++) out += `<path d="M${r1(x0 + sA - 2)} ${r1(24 + i * 8)} l-6 3 l6 3" fill="none" stroke="${S.gold}" stroke-width="1.5"/>`;
    out += stopwatch(k, 16, 102, 120, bl, 10, "#666", `${fmt(bl)} s of black`);
    out += strip(k, [g.num("blackLength", "Black", " s", "#888"), g.word("when", "When"), g.word("sound", "In the dark"), g.steps("comeBack", "Back to"), g.steps("jolt", "Jolt", S.red)]);
    return out + k.caption(`Black ${v("when")} for ${fmt(bl)} s`);
  });

  /* ======================= Speed & timing ======================= */

  /* timeLapse: the sun arcs across the sky once per stretch of time, the subject changes, lights streak. */
  look("timeLapse", (v, k, g) => {
    const sq = idx(v, "squeeze", 5);
    const stt = v.n("screenTime");
    const sub = idx(v, "subject", 5);
    const cm = idx(v, "camMove", 3);
    const strk = Math.round(v.n("streaks"));
    let out = stage(k, { bg: "#1b2236" });
    for (let i = 0; i <= sq; i++) {
      const x = 20 + i * 58;
      out += `<path d="M${x} 60 Q${x + 26} ${r1(6 - i)} ${x + 52} 60" fill="none" stroke="${S.gold}" stroke-width="1.5" stroke-dasharray="3 3" opacity="0.7"/>` + k.dot({ x: x + 26, y: 32, r: 5, color: S.gold });
    }
    if (sub === 0) for (let i = 0; i < 4; i++) out += `<ellipse cx="${60 + i * 60}" cy="${70 + (i % 2) * 6}" rx="22" ry="7" fill="#cfd8e6" opacity="0.6"/>`;
    else if (sub === 1) for (let i = 0; i < 9; i++) out += guy(k, 40 + i * 28, { s: 0.45, color: S.grey, alpha: 0.35, walk: 1 });
    else if (sub === 2) for (let i = 0; i < 6; i++) out += box(30 + i * 46, 70 - (i % 3) * 12, 32, 42 + (i % 3) * 12, "#2a2a3a", `stroke="#444"`) + box(38 + i * 46, 80 - (i % 3) * 12, 6, 6, S.gold);
    else if (sub === 3) out += box(130, 96, 60, 6, "#6a5440") + guy(k, 160, { s: 0.6, color: S.blue }) + guy(k, 80, { s: 0.5, color: S.grey, alpha: 0.3, walk: 1 }) + guy(k, 240, { s: 0.5, color: S.grey, alpha: 0.3, walk: 1 });
    else out += `<path d="M160 112 V${r1(96 - sq * 10)}" stroke="${S.green}" stroke-width="3"/>` + `<ellipse cx="168" cy="${r1(96 - sq * 10)}" rx="9" ry="5" fill="${S.green}"/>`;
    for (let i = 0; i < strk * 3; i++) out += `<line x1="${20 + ((i * 47) % 260)}" y1="${r1(88 + (i % 5) * 4)}" x2="${60 + ((i * 47) % 260)}" y2="${r1(88 + (i % 5) * 4)}" stroke="${i % 2 ? S.red : "#fff"}" stroke-width="1.5" opacity="0.7"/>`;
    out += [k.label({ x: 16, y: 16, text: "📷 still", size: 9, color: "#ccc", anchor: "start" }), k.arrow({ x1: 16, y1: 12, x2: 60, y2: 12, color: "#ccc", w: 2 }), k.arrow({ x1: 16, y1: 12, x2: 120, y2: 12, color: "#ccc", w: 3 })][cm];
    out += stopwatch(k, 200, 8, 70, stt, 20, S.ice, `${fmt(stt)} s`);
    out += strip(k, [g.steps("squeeze", "Squeezes"), g.num("screenTime", "On screen", " s", S.ice), g.word("subject", "Watching"), g.steps("camMove", "Camera"), g.num("streaks", "Streaks", " of 5", S.red)]);
    return out + k.caption(`${v("squeeze")} in ${fmt(stt)} s`);
  });

  /* slowReveal: a speed line that drops, a lens on the detail, and the sound beside it. */
  look("slowReveal", (v, k, g) => {
    const sd = idx(v, "slowdown", 4);
    const det = idx(v, "detail", 5);
    const ri = idx(v, "rampIn", 3);
    const sl = v.n("slowLength");
    const snd = idx(v, "soundDrops", 4);
    let out = stage(k, { floor: false });
    /* speed graph: normal, then down to the slow level for the slow length */
    const low = [70, 82, 94, 104][sd];
    const x1 = 20;
    const xs = 70;
    const xe = xs + 12 + (sl / 8) * 100;
    const rampW = [0, 24, 2][ri];
    out += `<line x1="16" y1="40" x2="196" y2="40" stroke="#444" stroke-dasharray="2 3"/>` + k.label({ x: 16, y: 34, text: "normal speed", size: 7, color: "#888", anchor: "start" });
    const path = ri === 0 ? `M${x1} ${low} L${r1(xe)} ${low} L${r1(xe + 10)} 40 L196 40` : `M${x1} 40 L${xs} 40 ${ri === 1 ? `Q${xs + rampW / 2} 40 ${xs + rampW} ${low}` : `L${xs + rampW} ${low}`} L${r1(xe)} ${low} L${r1(xe + 10)} 40 L196 40`;
    out += `<path d="${path}" fill="none" stroke="${S.gold}" stroke-width="3" stroke-linejoin="round"/>`;
    out += k.label({ x: (xs + xe) / 2, y: low + 12, text: `${fmt(sl)} s slow`, size: 8, color: S.gold });
    /* the lens on the detail */
    out += `<circle cx="260" cy="50" r="38" fill="#2c3346" stroke="${S.gold}" stroke-width="3"/>` + emoji(k, 260, 62, ["💍", "👀", "✋", "🩸", "🔭"][det], 32);
    /* the sound */
    out += snd === 2 ? `<path d="M196 104 h20 l5 -10 l5 18 l5 -8 h20" fill="none" stroke="${S.red}" stroke-width="2"/>` : k.wave({ x: 196, y: 104, w: 110, h: 18, amp: [0.9, 0.5, 0, 0.02][snd], cycles: [8, 2, 4, 4][snd], color: S.ice });
    out += k.label({ x: 306, y: 116, text: v("soundDrops"), size: 7, color: "#aaa", anchor: "end" });
    out += strip(k, [g.steps("slowdown", "Slows"), g.word("detail", "Shows"), g.steps("rampIn", "Into it"), g.num("slowLength", "Slow for", " s", S.ice), g.steps("soundDrops", "Sound", S.red)]);
    return out + k.caption(`${v("slowdown")} on ${v("detail")}`);
  });

  /* frozenOrbit: seen from above, the frozen moment in the middle and the camera's path around it. */
  look("frozenOrbit", (v, k, g) => {
    const fr = idx(v, "frozen", 3);
    const sw = v.n("sweep");
    const ol = v.n("orbitLength");
    const air = Math.round(v.n("inAir"));
    const rs = idx(v, "restart", 3);
    let out = stage(k, { floor: false });
    const cx = 110;
    const cy = 60;
    const R = 46;
    /* things hanging in the air */
    for (let i = 0; i < air; i++) out += k.dot({ x: cx + Math.cos(i * 2.4) * (12 + (i % 5) * 7), y: cy + Math.sin(i * 2.4) * (10 + (i % 4) * 6), r: 1.6, color: S.ice });
    /* the frozen person: ghosts behind when only slowed */
    for (let i = 2 - fr; i > 0; i--) out += k.person({ x: cx - i * 8, y: cy + 30, s: 0.6, color: S.orange, alpha: 0.25, arms: 0.6 });
    out += k.person({ x: cx, y: cy + 30, s: 0.6, color: S.orange, arms: 0.6, lean: 10 });
    if (fr === 2) out += k.label({ x: cx + 26, y: cy - 30, text: "❄", size: 12, color: S.ice });
    /* the camera's arc */
    const a0 = Math.PI * 0.5;
    const a1 = a0 + (sw * Math.PI) / 180;
    const pts = [];
    for (let i = 0; i <= 24; i++) {
      const a = a0 + ((a1 - a0) * i) / 24;
      pts.push(`${r1(cx + Math.cos(a) * R)},${r1(cy + Math.sin(a) * R * 0.6)}`);
    }
    out += `<polyline points="${pts.join(" ")}" fill="none" stroke="${S.gold}" stroke-width="2.5" stroke-dasharray="5 3"/>`;
    out += k.cam({ x: cx + Math.cos(a1) * R, y: cy + Math.sin(a1) * R * 0.6, dir: (a1 * 180) / Math.PI + 180, s: 0.6 });
    out += k.label({ x: 200, y: 22, text: `${Math.round(sw)}° around`, size: 11, color: S.gold, anchor: "start", weight: 700 });
    out += stopwatch(k, 200, 40, 70, ol, 10, S.ice, `${fmt(ol)} s`);
    out += chip(k, 200, 70, ["⚡ snaps back", "⏩ speeds up", "✂ cut away"][rs], "#33323d");
    out += strip(k, [g.steps("frozen", "Frozen", S.ice), g.num("sweep", "Around", "°"), g.num("orbitLength", "Lasts", " s", S.ice), g.num("inAir", "In the air", ""), g.word("restart", "Restart")]);
    return out + k.caption(`${v("frozen")}, the camera goes ${Math.round(sw)}° around`);
  });

  /* timeSkip: before and after, with the gap between them and the clues that tell us. */
  look("timeSkip", (v, k, g) => {
    const sk = idx(v, "skip", 4);
    const cl = idx(v, "clue", 4);
    const sm = idx(v, "smooth", 3);
    const sd = idx(v, "skipped", 5);
    const cu = idx(v, "catchUp", 3);
    let out = stage(k, { floor: false });
    out += screen(10, 10, 100, 86, "#2c3346") + guy(k, 60, { s: 0.65, color: S.blue });
    const afterBg = cl === 1 ? "#4a3a5a" : "#2c3346";
    out += screen(210, 10, 100, 86, afterBg) + guy(k, 260, { s: 0.65, color: cl === 2 ? S.orange : S.blue });
    if (cl === 2) out += `<path d="M250 ${FY - 64} q10 -10 20 0" fill="none" stroke="#6a4a2a" stroke-width="5"/>`;
    if (cl === 1) out += k.clock({ x: 292, y: 26, r: 10, p: 0.6 });
    if (cl === 3) out += box(214, 70, 92, 16, "#000", `opacity="0.75"`) + k.label({ x: 260, y: 81, text: ["minutes later", "hours later", "days later", "years later"][sk].toUpperCase(), size: 8, color: "#fff", weight: 700 });
    /* the gap */
    out += `<rect x="120" y="22" width="80" height="50" rx="4" fill="none" stroke="#666" stroke-dasharray="4 3"/>` + emoji(k, 160, 54, ["🚗", "⏳", "🥊", "🩹", "🧒"][sd], 20);
    out += k.label({ x: 160, y: 16, text: `+ ${v("skip")}`, size: 10, color: S.gold, weight: 700 });
    for (let i = 0; i <= sk; i++) out += k.dot({ x: 136 + i * 16, y: 80, r: 3, color: S.gold });
    out += [`<path d="M112 100 l10 -6 l10 6 l10 -6 l10 6 l10 -6 l10 6 l10 -6 l10 6 l6 -3" fill="none" stroke="${S.red}" stroke-width="2"/>`, k.arrow({ x1: 112, y1: 100, x2: 206, y2: 100, color: "#ccc", w: 2 }), `<path d="M112 100 Q160 84 206 100" fill="none" stroke="${S.green}" stroke-width="2.5"/>`][sm];
    out += k.label({ x: 160, y: 114, text: ["never explained", "a line explains", "flashback later"][cu], size: 8, color: ["#888", "#ccc", S.purple][cu] });
    out += strip(k, [g.steps("skip", "Skips"), g.steps("clue", "Clue"), g.steps("smooth", "Feels"), g.word("skipped", "Skipped"), g.word("catchUp", "Catch up")]);
    return out + k.caption(`Skips ${v("skip")} of ${v("skipped")}`);
  });

  /* stretchedMoment: the real moment as a short bar, the screen version as many shots, repeats marked. */
  look("stretchedMoment", (v, k, g) => {
    const st = v.n("stretch");
    const an = Math.max(1, Math.round(v.n("angles")));
    const rp = Math.round(v.n("repeats"));
    const pc = idx(v, "pieces", 4);
    const wt = idx(v, "weight", 3);
    let out = stage(k, { floor: false });
    out += k.label({ x: 16, y: 18, text: "real life", size: 8, color: "#aaa", anchor: "start" }) + box(16, 22, 28, 12, S.gold, `rx="2"`);
    out += k.label({ x: 16, y: 50, text: "on screen", size: 8, color: "#aaa", anchor: "start" });
    const w = 28 * Math.max(1, st);
    const lengths = Array.from({ length: an + rp }, (_, i) => 1 + k.rnd(i + 7) * 0.6);
    const cols = Array.from({ length: an + rp }, (_, i) => (i >= an ? S.purple : [S.gold, S.blue, S.green, S.orange][[0, 1, 2, i % 3][pc] % 4]));
    out += k.strip({ x: 16, y: 54, w: Math.min(288, w), h: 22, lengths, color: cols });
    for (let i = 0; i < rp; i++) out += k.label({ x: 16 + Math.min(288, w) - 8 - i * 14, y: 90, text: "↺", size: 11, color: S.purple });
    out += k.label({ x: 16, y: 100, text: `${fmt(st)} times as long, ${an} angle${an === 1 ? "" : "s"}`, size: 9, color: "#ddd", anchor: "start" });
    out += emoji(k, 220, 106, ["🎬", "👀", "🔍", "🎬👀🔍"][pc], 12);
    /* the weight of the moment */
    const ws = 10 + wt * 9;
    out += `<path d="M${r1(290 - ws)} 34 h${r1(ws * 2)} l-4 ${r1(-ws)} h${r1(-ws * 2 + 8)} Z" fill="#555" stroke="${S.ink}"/>` + k.label({ x: 290, y: 30, text: ["small", "big", "life/death"][wt], size: 7, color: "#ddd" });
    out += strip(k, [g.num("stretch", "Stretch", "x"), g.num("angles", "Angles", "", S.blue), g.num("repeats", "Repeats", "", S.purple), g.word("pieces", "Cut to"), g.steps("weight", "Weight", S.red)]);
    return out + k.caption(`One moment, ${fmt(st)} times as long`);
  });

  /* ======================= Text & captions ======================= */

  /* kineticWords: a person speaks; the words around them move the way they sound. */
  look("kineticWords", (v, k, g) => {
    const mo = v.n("motion");
    const ru = idx(v, "rule", 4);
    const ch = idx(v, "chunk", 3);
    const sz = idx(v, "size", 4);
    const sy = idx(v, "sync", 3);
    let out = stage(k);
    out += guy(k, 60, { s: 0.85, color: S.orange, mood: 0.2, arms: 0.4, look: 1 });
    const words = [["NO"], ["NO", "WAY"], ["NO", "WAY", "NOT", "TODAY"]][ch];
    const size = Math.min([10, 16, 24, 36][sz], ru === 3 ? 22 : 150 / words.length);
    words.forEach((wd, i) => {
      let x;
      let y;
      if (ru === 3) {
        const a = -1.2 + i * 0.9;
        x = 60 + Math.cos(a) * 60;
        y = 54 + Math.sin(a) * 34;
      } else {
        x = 120 + i * (size * 1.4 + 8);
        y = ru === 2 ? 40 + i * 10 : 56;
      }
      const rot = (k.rnd(i + 3) - 0.5) * mo * 8;
      out += k.text({ x: Math.min(300, x), y, text: wd, size, color: S.gold, weight: 900, outline: S.ink, outlineW: 2 }).replace("<text", `<text transform="rotate(${r1(rot)} ${r1(Math.min(300, x))} ${r1(y)})"`);
      if (mo > 0 && ru !== 3) out += motion(k, Math.min(300, x) - size, y - size * 0.4, Math.min(3, Math.round(mo / 2)), 4 + mo * 2, 1);
    });
    if (ru === 0) out += beats(k, 140, 92, 6, S.gold, 14);
    if (ru === 1) out += k.wave({ x: 130, y: 92, w: 160, h: 14, amp: 0.7, cycles: 5, color: S.ice });
    if (ru === 2) out += k.label({ x: 290, y: 104, text: "↯ shake", size: 9, color: S.red, anchor: "end" });
    /* timing ticks */
    const ticks = [2, words.length + 1, words.length * 3][sy];
    for (let i = 0; i < ticks; i++) out += `<line x1="${r1(130 + i * (160 / ticks))}" y1="104" x2="${r1(130 + i * (160 / ticks))}" y2="110" stroke="#bbb" stroke-width="1.5"/>`;
    out += strip(k, [g.num("motion", "Moves", " of 5"), g.word("rule", "How"), g.steps("chunk", "Words"), g.steps("size", "Size"), g.steps("sync", "Timed", S.ice)]);
    return out + k.caption(`Words ${v("rule")}, ${v("size")}`);
  });

  /* screenMessages: a person and their phone, with the messages where the setting puts them. */
  look("screenMessages", (v, k, g) => {
    const sh = idx(v, "shown", 4);
    const ty = idx(v, "typing", 3);
    const cnt = Math.round(v.n("count"));
    const sty = idx(v, "style", 4);
    const rep = v.n("reply");
    let out = stage(k);
    out += guy(k, 60, { s: 0.85, color: S.blue, look: 1, mood: ty === 2 ? -0.3 : 0.1 });
    out += `<rect x="74" y="52" width="10" height="16" rx="2" fill="#111" stroke="#ccc"/>`;
    const fill = ["#3a7bd5", "rgba(0,0,0,0)", S.paper, "#5a2a6a"][sty];
    const tcol = ["#fff", "#fff", S.ink, "#ffe9ff"][sty];
    const ox = [100, 92, 40, 110][sh];
    const oy = [70, 60, 10, 10][sh];
    if (sh === 0) out += screen(96, 8, 120, 100, "#111", "#888");
    const shown = Math.min(cnt, sh === 3 ? 6 : 4);
    for (let i = 0; i < shown; i++) {
      const bx = sh === 2 ? 100 + (i % 2) * 70 : ox + 8 + (i % 2) * (sh === 3 ? 12 : 20);
      const by = sh === 0 ? 20 + i * 20 : sh === 1 ? oy - 40 + i * 18 : sh === 2 ? 14 + Math.floor(i / 2) * 20 : oy + i * 16;
      out += `<rect x="${r1(bx)}" y="${r1(by)}" width="${sh === 3 ? 160 : 80}" height="14" rx="7" fill="${fill}" stroke="${sty === 1 ? "none" : sty === 3 ? "#e9b3ff" : "#333"}"/>` + k.label({ x: bx + 6, y: by + 10, text: i === shown - 1 && ty === 2 ? "I love y̶o̶u̶" : ["ok", "where r u", "come home", "...", "call me", "now"][i % 6], size: 8, color: tcol, anchor: "start" });
    }
    if (cnt > shown) out += k.label({ x: 300, y: 18, text: `+${cnt - shown}`, size: 9, color: "#ccc", anchor: "end" });
    if (ty >= 1) out += beats(k, 240, 100, 3, "#ccc", 8) + (ty === 2 ? k.label({ x: 270, y: 104, text: "⌫", size: 12, color: S.red }) : "");
    out += stopwatch(k, 200, 108, 60, rep, 10, S.gold, `reply ${fmt(rep)} s`);
    out += strip(k, [g.steps("shown", "Shown"), g.steps("typing", "Typing"), g.num("count", "Messages", ""), g.word("style", "Look"), g.num("reply", "Reply wait", " s", S.ice)]);
    return out + k.caption(`${cnt} message${cnt === 1 ? "" : "s"}, ${v("shown")}`);
  });

  /* nameCard: the new face, the card beside them, and the row of people who get one. */
  look("nameCard", (v, k, g) => {
    const ch = idx(v, "cheek", 4);
    const fz = idx(v, "freeze", 3);
    const sty = idx(v, "style", 4);
    const hm = Math.round(v.n("howMany"));
    const os = v.n("onScreen");
    let out = stage(k);
    out += guy(k, 70, { s: 0.95, color: S.orange, walk: fz === 0 ? 0.8 : fz === 1 ? 0.4 : 0, mood: 0.4 });
    if (fz === 0) out += motion(k, 52, 50, 3, 14, 1);
    if (fz === 1) out += k.label({ x: 30, y: 26, text: "🐢", size: 12 });
    if (fz === 2) out += box(14, 14, 4, 14, "#fff") + box(22, 14, 4, 14, "#fff") + k.tint({ color: "#7a6a4a", alpha: 0.18 });
    const cardFill = [S.paper, S.gold, "#fffbe6", "#d9e4ef"][sty];
    out += `<rect x="120" y="14" width="150" height="${22 + ch * 14}" rx="${sty === 3 ? 2 : 6}" fill="${cardFill}" stroke="${S.ink}" stroke-width="2"/>`;
    if (sty === 3) out += box(126, 20, 22, 26, "#9aa", `stroke="${S.ink}"`);
    const lx = sty === 3 ? 154 : 128;
    out += k.text({ x: lx, y: 32, text: "DAVE", size: sty === 1 ? 16 : 12, color: S.ink, weight: 900, anchor: "start", italic: sty === 2 });
    ["driver", "never on time", "owes everyone money"].slice(0, ch).forEach((t, i) => (out += k.label({ x: lx, y: 46 + i * 14, text: t, size: 9, color: "#333", anchor: "start" })));
    /* who gets a card */
    for (let i = 0; i < Math.min(hm, 12); i++) out += k.dot({ x: 130 + i * 14, y: 98, r: 5, color: "#c9b49a" }) + box(126 + i * 14, 104, 8, 4, S.gold);
    out += stopwatch(k, 200, 82, 60, os, 5, S.ice, `${fmt(os)} s`);
    out += strip(k, [g.steps("cheek", "Label"), g.steps("freeze", "Picture", S.ice), g.word("style", "Style"), g.num("howMany", "Get one", ""), g.num("onScreen", "Stays", " s", S.ice)]);
    return out + k.caption(`Name card: ${v("cheek")}`);
  });

  /* titleDrop: the title on screen, sized and arriving as set, and a pin for when it lands in the film. */
  look("titleDrop", (v, k, g) => {
    const lt = v.n("lateness");
    const ld = idx(v, "landing", 4);
    const sz = idx(v, "size", 3);
    const ar = idx(v, "arrives", 4);
    const sp = idx(v, "spoken", 3);
    let out = stage(k, { floor: false });
    out += screen(16, 8, 288, 80, "#111");
    const size = [14, 28, 44][sz];
    const word = ar === 2 ? "CUR" : "CURIO";
    out += k.text({ x: 160, y: 48 + size * 0.35, text: word, size, color: "#fff", weight: 900, spacing: 3, alpha: ar === 1 ? 0.45 : 1 });
    if (ar === 2) out += k.text({ x: 160 + size * 1.2, y: 48 + size * 0.35, text: "IO", size, color: "#fff", weight: 900, alpha: 0.15 });
    if (ar === 3) for (let i = 0; i < 8; i++) out += `<line x1="${r1(160 + Math.cos(i * 0.785) * (size * 1.6))}" y1="${r1(48 + Math.sin(i * 0.785) * size * 0.8)}" x2="${r1(160 + Math.cos(i * 0.785) * (size * 2.2))}" y2="${r1(48 + Math.sin(i * 0.785) * size * 1.1)}" stroke="${S.gold}" stroke-width="2"/>`;
    out += emoji(k, 34, 26, ["🌅", "😱", "🥁", "💬"][ld], 14);
    if (sp > 0) out += k.bubble({ x: 262, y: 22, w: 70, h: 18, text: sp === 2 ? "...Curio." : "...cur...", tail: 8, size: 9 });
    out += film(k, 16, 100, 288, { pins: [{ p: lt / 30, label: `${Math.round(lt)} min`, color: S.gold }], startText: "0 min", endText: "30 min" });
    out += strip(k, [g.num("lateness", "Comes at", " min"), g.word("landing", "Lands on"), g.steps("size", "Size"), g.steps("arrives", "Arrives"), g.steps("spoken", "Said", S.ice)]);
    return out + k.caption(`Title at ${Math.round(lt)} min, ${v("arrives")}`);
  });

  /* ======================= Frame & canvas ======================= */

  /* frameInFrame: an outer picture with a doorway (or window, mirror) inside it, nested, with the person inside. */
  look("frameInFrame", (v, k, g) => {
    const ti = idx(v, "tightness", 4);
    const fr = idx(v, "framer", 5);
    const ly = Math.round(v.n("layers"));
    const sh = v.n("share");
    const wa = idx(v, "watcher", 3);
    let out = stage(k, { floor: false }) + screen(10, 6, 300, 108, "#3a3428");
    const fw = 40 + (sh / 100) * 200;
    const fh = Math.min(100, fw * 0.62);
    const cx = 160;
    const cy = 62;
    for (let i = 0; i < ly; i++) {
      const w = fw * (1 - i * 0.2);
      const h = fh * (1 - i * 0.2);
      const x = cx - w / 2;
      const y = cy - h / 2;
      if (fr === 2) out += `<ellipse cx="${cx}" cy="${cy}" rx="${r1(w / 2)}" ry="${r1(h / 2)}" fill="${i === ly - 1 ? "#26324a" : "none"}" stroke="#c9c2b0" stroke-width="3"/>`;
      else if (fr === 4) out += guy(k, x - 8, { s: 0.7, color: "#333" }) + guy(k, x + w + 8, { s: 0.7, color: "#333" });
      else out += `<rect x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(h)}" rx="${fr === 3 ? 10 : 1}" fill="${i === ly - 1 ? "#26324a" : "none"}" stroke="${["#6a4a2a", "#ddd", "#c9c2b0", "#999"][fr]}" stroke-width="${fr === 0 ? 5 : 3}"/>` + (fr === 1 ? `<line x1="${cx}" y1="${r1(y)}" x2="${cx}" y2="${r1(y + h)}" stroke="#ddd" stroke-width="1.5"/>` : "");
    }
    const inner = fh * (1 - (ly - 1) * 0.2);
    const ps = k.clamp((inner / 90) * [0.5, 0.7, 0.9, 1.05][ti], 0.2, 1.1);
    out += k.person({ x: cx + 6, y: cy + inner / 2 - 2, s: ps, color: S.orange, mood: [0.2, 0, -0.3, -0.6][ti] });
    if (wa === 1) out += emoji(k, 290, 108, "👁", 14);
    if (wa === 2) out += k.person({ x: 34, y: 112, s: 1.0, color: "#222", look: 1 });
    out += strip(k, [g.steps("tightness", "Framed", S.red), g.word("framer", "By"), g.num("layers", "Frames", ""), g.num("share", "Size", "%"), g.word("watcher", "Watcher")]);
    return out + k.caption(`${v("tightness")} by ${v("framer")}`);
  });

  /* screenLook: the picture dressed up as a screen in the story. */
  look("screenLook", (v, k, g) => {
    const re = v.n("realness");
    const src = idx(v, "source", 5);
    const mk = idx(v, "marks", 4);
    const q = idx(v, "quality", 4);
    const sh = v.n("share");
    let out = stage(k, { floor: false });
    const x = src === 1 ? 110 : 16;
    const w = src === 1 ? 100 : 288;
    out += screen(x, 6, w, 92, ["#3a4a3a", "#2c3346", "#26324a", "#2c3346", "#4a3a28"][src]);
    out += k.person({ x: x + w / 2, y: 92, s: 0.8, color: S.blue });
    if (src === 2) out += screen(x + w - 70, 10, 60, 40, "#3a3428") + k.face({ x: x + w - 40, y: 30, r: 12 });
    if (src === 3) out += box(x, 76, w, 16, "#a31d1d") + k.label({ x: x + 8, y: 88, text: "BREAKING NEWS", size: 9, color: "#fff", anchor: "start", weight: 700 });
    if (src === 4) out += k.tint({ color: "#ffb347", alpha: 0.12 });
    /* realness: scan lines */
    for (let i = 0; i < re * 4; i++) out += `<line x1="${x}" y1="${r1(8 + i * (88 / 20))}" x2="${x + w}" y2="${r1(8 + i * (88 / 20))}" stroke="#000" stroke-width="1" opacity="0.25"/>`;
    /* marks */
    if (mk >= 1) out += k.label({ x: x + w - 6, y: 18, text: "02:14:07", size: 9, color: "#eee", anchor: "end" });
    if (mk >= 2) out += k.dot({ x: x + 10, y: 14, r: 4, color: S.red }) + k.label({ x: x + 18, y: 18, text: "REC", size: 8, color: "#eee", anchor: "start" });
    if (mk >= 3) out += [0, 1, 2, 3].map((i) => k.dot({ x: x + w / 2 - 24 + i * 16, y: 70, r: 5, color: i === 3 ? S.red : "#555" })).join("");
    /* quality: noise specks and blocks */
    for (let i = 0; i < q * 14; i++) out += box(x + k.rnd(i + 2) * (w - 4), 8 + k.rnd(i + 40) * 86, q === 3 ? 6 : 1.5, q === 3 ? 4 : 1.5, q === 3 ? "#7a7a8a" : "#ddd", `opacity="0.5"`);
    out += film(k, 16, 104, 288, { spans: [{ a: 0, b: sh / 100, color: S.grey }], ends: false });
    out += strip(k, [g.num("realness", "Real", " of 5"), g.word("source", "Screen"), g.steps("marks", "Marks"), g.steps("quality", "Rough", S.red), g.num("share", "Of film", "%")]);
    return out + k.caption(`Seen through ${v("source")}, ${v("quality")}`);
  });

  /* frameBreak: a letterboxed picture with something bursting past its edge. */
  look("frameBreak", (v, k, g) => {
    const bg = v.n("bigness");
    const wh = idx(v, "what", 5);
    const ed = idx(v, "edge", 4);
    const ho = idx(v, "howOften", 3);
    const ba = idx(v, "bars", 3);
    let out = stage(k, { floor: false });
    const bar = [0, 12, 26][ba];
    out += screen(16, 4, 288, 100, "#2c3346");
    if (bar) out += box(16, 4, 288, bar, "#000") + box(16, 104 - bar, 288, bar, "#000");
    const top = 4 + bar;
    const bot = 104 - bar;
    const push = 4 + bg * 7;
    const pos = [[160, top - push + 14], [160, bot + push - 14], [304 + push - 14, 54], [160, 54]][ed];
    const icon = ["✊", "⚽", "🏃", "POW", "💥"][wh];
    const sz = ed === 3 ? 18 + bg * 7 : 24;
    if (wh === 3) out += k.text({ x: pos[0], y: pos[1] + 8, text: icon, size: sz, color: S.gold, weight: 900, outline: S.ink });
    else out += emoji(k, pos[0], pos[1] + 8, icon, sz);
    if (wh === 4) out += `<path d="M150 ${top} l8 20 l-10 14 l12 18" fill="none" stroke="#fff" stroke-width="2"/>`;
    if (ed !== 3) out += [0, 1, 2].map((i) => `<line x1="${r1(pos[0] - 14 + i * 14)}" y1="${r1(pos[1] + (ed === 0 ? 20 : -6))}" x2="${r1(pos[0] - 18 + i * 18)}" y2="${r1(pos[1] + (ed === 0 ? 30 : -16))}" stroke="${S.gold}" stroke-width="2"/>`).join("");
    out += film(k, 16, 108, 288, { pins: [[0.6], [0.3, 0.6, 0.9], [0.15, 0.3, 0.45, 0.6, 0.75, 0.9]][ho].map((p) => ({ p, color: S.gold })), ends: false });
    out += strip(k, [g.num("bigness", "Breaks out", " of 5"), g.word("what", "What"), g.word("edge", "Edge"), g.steps("howOften", "How often"), g.steps("bars", "Bars", "#888")]);
    return out + k.caption(`${v("what")} breaks out, ${v("edge")}`);
  });

  /* irisShot: black everywhere except a circle, closing or opening on its target. */
  look("irisShot", (v, k, g) => {
    const sz = idx(v, "size", 4);
    const way = idx(v, "way", 3);
    const so = v.n("softness");
    const sp = v.n("speed");
    const tg = idx(v, "target", 4);
    let out = stage(k, { bg: "#3a3428" });
    out += k.person({ x: 120, y: FY, s: 1, color: S.orange, mood: 0.3 }) + `<rect x="200" y="74" width="26" height="22" fill="${S.paper}" stroke="${S.ink}"/>` + k.dot({ x: 160, y: 98, r: 3, color: S.gold });
    const ctr = [[120, 45], [213, 85], [160, 98], [256, 40]][tg];
    const R = [130, 60, 30, 10][sz];
    const ring = (rr) => `M${r1(ctr[0] - rr)} ${ctr[1]} A${r1(rr)} ${r1(rr)} 0 1 0 ${r1(ctr[0] + rr)} ${ctr[1]} A${r1(rr)} ${r1(rr)} 0 1 0 ${r1(ctr[0] - rr)} ${ctr[1]} Z`;
    out += `<path d="M0 0 H320 V120 H0 Z ${ring(R)}" fill="#000" fill-rule="evenodd"/>`;
    /* the soft edge: rings of shade inside the circle */
    const n = Math.round(so / 20);
    for (let i = 1; i <= n; i++) out += `<circle cx="${ctr[0]}" cy="${ctr[1]}" r="${r1(Math.max(1, R - i * (R / 12)))}" fill="none" stroke="#000" stroke-width="${r1(R / 12)}" opacity="${r1(0.5 - i * 0.08)}"/>`;
    /* which way: arrows */
    const arr = (dir) => k.arrow({ x1: ctr[0] + (R + 22) * (dir > 0 ? 1 : 0.6), y1: ctr[1] - 4, x2: ctr[0] + (R + 22) * (dir > 0 ? 0.6 : 1), y2: ctr[1] - 4, color: S.gold, w: 2 });
    out += way === 0 ? arr(1) : way === 1 ? arr(-1) : arr(1) + arr(-1);
    out += stopwatch(k, 16, 108, 60, sp, 5, S.gold, `${fmt(sp)} s`);
    out += strip(k, [g.steps("size", "Closes to"), g.word("way", "Way"), g.num("softness", "Soft", "%", S.ice), g.num("speed", "Takes", " s"), g.word("target", "Lands on")]);
    return out + k.caption(`The circle ${v("way")} to ${v("size")} on ${v("target")}`);
  });

  /* ======================= Color ======================= */

  const HUES = ["#3a6fd3", "#e8913a", "#5fae78", "#d9789b", "#9b6bb5", "#e8c33a"];

  /* characterColor: people each in their own color, the color reaching into their space and meeting another's. */
  look("characterColor", (v, k, g) => {
    const st = v.n("strength");
    const re = idx(v, "reach", 4);
    const hm = Math.round(v.n("howMany"));
    const sp = idx(v, "spreads", 4);
    const mt = idx(v, "meet", 3);
    let out = stage(k, { bg: "#2a2830" });
    const n = Math.max(1, Math.min(6, hm));
    const zone = 300 / n;
    for (let i = 0; i < n; i++) {
      const x0 = 10 + i * zone;
      const col = HUES[i];
      const a = (st / 5) * [0, 0.12, 0.3, 0.5][re];
      if (a > 0) out += box(x0, 0, zone, FY, col, `opacity="${r1(a)}"`);
      if (re >= 1) out += box(x0 + zone - 22, 86, 14, 26, col, `stroke="${S.ink}" opacity="${r1(0.3 + (st / 5) * 0.7)}"`);
      const faded = sp === 3 && i === 0;
      out += guy(k, x0 + zone / 2 - 6, { s: 0.75, color: faded ? "#777" : k.mix("#888888", col, 0.3 + (st / 5) * 0.7) });
    }
    /* where two colors meet */
    if (n >= 2) {
      const bx = 10 + zone;
      out += mt === 0 ? `<rect x="${r1(bx - 14)}" y="0" width="28" height="${FY}" fill="${k.mix(HUES[0], HUES[1], 0.5)}" opacity="0.5"/>` : mt === 1 ? `<line x1="${r1(bx)}" y1="0" x2="${r1(bx)}" y2="${FY}" stroke="#ddd" stroke-width="1"/>` : `<path d="M${r1(bx)} 0 l8 14 l-10 14 l10 14 l-10 14 l10 14 l-10 14 l8 14 l-6 14" fill="none" stroke="${S.red}" stroke-width="3"/>`;
    }
    /* spreads */
    if (sp === 1 && n >= 2) out += k.arrow({ x1: 10 + zone / 2, y1: 14, x2: 10 + zone * 1.5, y2: 14, color: HUES[0], w: 3 });
    if (sp === 2) out += box(10, 0, 300, 10, HUES[0]);
    if (sp === 3) out += k.label({ x: 10 + zone / 2, y: 14, text: "fading", size: 8, color: "#aaa" });
    out += strip(k, [g.num("strength", "Tie", " of 5"), g.steps("reach", "Reach"), g.num("howMany", "People", ""), g.word("spreads", "Color"), g.steps("meet", "Meet", S.red)]);
    return out + k.caption(`${n} ${n === 1 ? "person" : "people"}, colors ${v("spreads")}`);
  });

  /* colorArc: the film as a row of frames, each colored by where the color journey has reached. */
  look("colorArc", (v, k, g) => {
    const d = v.n("distance") / 5;
    const pa = idx(v, "path", 5);
    const sh = idx(v, "shape", 3);
    const no = idx(v, "noticed", 3);
    const fo = idx(v, "follows", 4);
    let out = stage(k, { floor: false });
    const ends = [["#7a7a7a", "#e8913a"], ["#e8913a", "#7a7a7a"], ["#e8913a", "#3a6fd3"], ["#3a6fd3", "#e8913a"], ["#e8913a", "#3a6fd3"]][pa];
    const N = 12;
    for (let i = 0; i < N; i++) {
      let t = i / (N - 1);
      if (pa === 4) t = 1 - Math.abs(t * 2 - 1);
      const p = sh === 0 ? t : sh === 1 ? Math.floor(t * 3.999) / 3 : t >= 0.5 ? 1 : 0;
      const col = k.mix(ends[0], ends[1], p * d);
      out += `<rect x="${r1(14 + i * 24.5)}" y="30" width="21" height="44" rx="2" fill="${col}" stroke="${["#2a2a2a", "#666", "#fff"][no]}" stroke-width="${[0.5, 1, 2][no]}"/>`;
    }
    out += k.label({ x: 14, y: 22, text: "first scene", size: 8, color: "#aaa", anchor: "start" }) + k.label({ x: 306, y: 22, text: "last scene", size: 8, color: "#aaa", anchor: "end" });
    out += emoji(k, 160, 104, ["🙂", "🍂", "💞", "⚠️"][fo], 18) + k.label({ x: 180, y: 100, text: `follows ${v("follows")}`, size: 8, color: "#ccc", anchor: "start" });
    out += strip(k, [g.num("distance", "Travels", " of 5"), g.word("path", "Way"), g.steps("shape", "Moves"), g.steps("noticed", "Noticed", S.ice), g.word("follows", "Follows")]);
    return out + k.caption(`${v("path")}, ${v("shape")}`);
  });

  /* worldColors: one panel per world, each with its own color, and drops of color leaking between them. */
  look("worldColors", (v, k, g) => {
    const df = v.n("difference") / 5;
    const sb = idx(v, "splitBy", 4);
    const wn = Math.round(v.n("worlds"));
    const cr = idx(v, "crossings", 3);
    const mb = idx(v, "madeBy", 3);
    let out = stage(k, { floor: false });
    const n = Math.max(2, Math.min(5, wn));
    const pw = 296 / n;
    for (let i = 0; i < n; i++) {
      const hue = 30 + (i * 360 * df) / n + (1 - df) * 180;
      out += `<rect x="${r1(12 + i * pw)}" y="10" width="${r1(pw - 6)}" height="80" rx="3" fill="${k.hsl(hue, 20 + df * 50, 40)}"/>`;
      out += emoji(k, 12 + i * pw + (pw - 6) / 2, 56, [["🏙️", "🌲", "🏜️", "🏝️", "🏔️"], ["🕰️", "📼", "📱", "🚀", "🏛️"], ["🧵", "🧶", "🪡", "🎗️", "🪢"], ["💭", "👁️", "💭", "👁️", "💭"]][sb][i], 18);
      if (cr > 0 && i < n - 1) for (let j = 0; j < (cr === 1 ? 1 : 4); j++) out += k.dot({ x: 12 + (i + 1) * pw + 4 + j * 6, y: 24 + j * 12, r: 3, color: k.hsl(hue, 70, 55) });
    }
    out += emoji(k, 300, 108, ["💡", "👕", "🎚️"][mb], 14) + k.label({ x: 286, y: 112, text: v("madeBy"), size: 8, color: "#ccc", anchor: "end" });
    out += strip(k, [g.num("difference", "Different", " of 5"), g.word("splitBy", "Split by"), g.num("worlds", "Looks", ""), g.steps("crossings", "Leaks", S.red), g.word("madeBy", "Made by")]);
    return out + k.caption(`${n} looks for ${v("splitBy")}, ${v("crossings")}`);
  });

  /* warningColor: a row of scenes, each with the warning color hidden somewhere, and what it warns of at the end. */
  look("warningColor", (v, k, g) => {
    const dr = v.n("dread");
    const hu = idx(v, "hue", 5);
    const tm = Math.round(v.n("times"));
    const hd = idx(v, "hidden", 3);
    const wo = idx(v, "warnsOf", 4);
    let out = stage(k, { floor: false });
    const col = ["#d33a2c", "#3f9e5a", "#e8c33a", "#3a6fd3", "#8b4fc2"][hu];
    const n = Math.max(1, Math.min(15, tm));
    const fw = Math.min(40, 260 / n);
    for (let i = 0; i < n; i++) {
      const x = 12 + i * (fw + 2);
      out += box(x, 20, fw, 34, "#3a3a44", `rx="2"`);
      const dx = hd === 0 ? x + fw / 2 : x + fw - 4;
      const dy = hd === 0 ? 37 : 24;
      out += k.dot({ x: dx, y: dy, r: [Math.min(8, fw / 3), 3, 1.2][hd], color: col });
    }
    out += emoji(k, 290, 44, ["⚠️", "💀", "🤥", "👻"][wo], 22);
    /* dread: a face that gets more afraid, with a glow of the color */
    out += `<circle cx="80" cy="88" r="${r1(10 + dr * 3)}" fill="${col}" opacity="${r1(0.08 + dr * 0.06)}"/>` + k.face({ x: 80, y: 88, r: 14, mood: -dr / 5, eyes: 0.5 + dr / 10, mouth: dr / 6 });
    out += k.label({ x: 110, y: 92, text: `seen ${tm} time${tm === 1 ? "" : "s"}`, size: 9, color: "#ccc", anchor: "start" });
    out += strip(k, [g.num("dread", "Dread", " of 5", S.red), g.word("hue", "Color"), g.num("times", "Times", ""), g.steps("hidden", "Hidden"), g.word("warnsOf", "Warns of")]);
    return out + k.caption(`${v("hue")} warns of ${v("warnsOf")}`);
  });
})(typeof window !== "undefined" ? window.CuriosityWindows : require("./windows.js"));
