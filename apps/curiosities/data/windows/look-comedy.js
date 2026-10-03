/* Comedy: the live picture at the top of each comedy curiosity's window (CuriosityWindows.look).

   Every picture has the same two parts so a beginner learns to read them once:
     the stage (top, y 0 to 122)  little people acting out the joke: faces, "HA!" bursts, speech bubbles,
                                  timelines of the film, crowds. The main settings live here.
     the strip (y 122 to 162)     small labelled gauges for the remaining settings: a bar for a number
                                  (with its value and unit), steps for an ordered choice (with its words),
                                  a pin on a film bar for "when in the film", and a plain word for a choice
                                  that has no order. Every gauge says its value in plain words.
   A caption at the bottom names the key value. Colors: gold = laughs, red = trouble, blue = the straight one,
   orange = the funny one. */
(function (W) {
  /* The bottom caption, its words shrunk (and at worst cut) so a long one never runs off the picture. */
  const fitCap = (k, text) => `<rect x="0" y="162" width="320" height="18" fill="rgba(0,0,0,0.55)"/>` + k.fitText({ x: 160, y: 175, text, size: 10, min: 7, w: 308, color: "#f4f4f4" });
  const S = { bg: "#17161d", floor: "#2b2533", gold: "#ffd166", red: "#e4572e", blue: "#4a6fa5", orange: "#e8913a", green: "#5fae78", purple: "#9b6bb5", grey: "#8a8a96", pink: "#d9789b", paper: "#f4f1ea", ink: "#1c1712" };
  const r1 = (n) => Math.round(n * 10) / 10;
  const fmt = (n) => String(Math.abs(n) >= 10 ? Math.round(n) : Math.round(n * 100) / 100);
  const FY = 112; /* the stage floor: people's feet */

  /* ---------- the stage ---------- */
  const stage = (k, o) => {
    o = o || {};
    return k.bg(o.bg || S.bg) + `<rect x="0" y="${FY}" width="320" height="8" fill="${o.floor || S.floor}"/>` + (o.spot ? `<ellipse cx="${o.spot}" cy="${FY + 2}" rx="70" ry="9" fill="#fff4c8" opacity="0.12"/>` : "");
  };
  const guy = (k, x, o) => k.person(Object.assign({ x, y: FY }, o || {}));
  /* A laugh: "HA!" in gold. p 0..1 is how big. */
  const ha = (k, x, y, p, rot, word) => k.text({ x, y, text: word || "HA!", size: 9 + k.clamp(p, 0, 1) * 18, color: S.gold, weight: 900, outline: S.ink, outlineW: 3 }).replace("<text", `<text transform="rotate(${rot || -8} ${r1(x)} ${r1(y)})"`);
  /* A comic burst (a jagged star). */
  function burst(k, x, y, r, color, txt, tsize) {
    const pts = [];
    for (let i = 0; i < 20; i++) {
      const a = (i / 20) * Math.PI * 2;
      const rr = i % 2 ? r * 0.62 : r;
      pts.push(`${r1(x + Math.cos(a) * rr)},${r1(y + Math.sin(a) * rr)}`);
    }
    return `<polygon points="${pts.join(" ")}" fill="${color || S.gold}" stroke="${S.ink}" stroke-width="2"/>` + (txt ? k.text({ x, y: y + (tsize || 10) * 0.35, text: txt, size: tsize || 10, color: S.ink, weight: 900 }) : "");
  }
  /* n small heads in rows, inside a box. */
  function heads(k, n, x, y, w, o) {
    o = o || {};
    const rr = o.r || 4;
    const per = Math.max(1, Math.floor(w / (rr * 2.4)));
    n = Math.max(0, Math.round(n));
    const shown = Math.min(n, o.max || 40);
    let out = "";
    for (let i = 0; i < shown; i++) out += k.dot({ x: x + (i % per) * rr * 2.4 + rr, y: y + Math.floor(i / per) * rr * 2.4, r: rr, color: typeof o.color === "function" ? o.color(i) : o.color || "#c9b49a" });
    if (n > shown) out += k.label({ x: x + w, y: y + Math.ceil(shown / per) * rr * 2.4 + 6, text: `+${n - shown} more`, size: 8, color: "#ccc", anchor: "end" });
    return out;
  }
  const sweat = (k, x, y, n) => Array.from({ length: Math.max(0, Math.round(n)) }, (_, i) => `<path d="M${r1(x + i * 6)} ${r1(y + (i % 2) * 5)} q-3 5 0 7 q3 -2 0 -7 Z" fill="#9fd3ff"/>`).join("");
  const motion = (k, x, y, n, len, dir) => Array.from({ length: Math.max(0, Math.round(n)) }, (_, i) => `<line x1="${r1(x)}" y1="${r1(y + i * 6)}" x2="${r1(x - (dir || 1) * len)}" y2="${r1(y + i * 6)}" stroke="#eee" stroke-width="1.5" stroke-linecap="round" opacity="0.7"/>`).join("");
  const chip = (k, x, y, text, color, anchor) => {
    const w = String(text).length * 5.2 + 10;
    const x0 = anchor === "end" ? x - w : anchor === "middle" ? x - w / 2 : x;
    return `<rect x="${r1(x0)}" y="${r1(y - 10)}" width="${r1(w)}" height="14" rx="7" fill="${color || "#33323d"}" stroke="#555" stroke-width="0.8"/>` + k.label({ x: x0 + w / 2, y: y + 0.5, text, size: 9, color: "#fff" });
  };
  /* A film bar from start to end, with pins at places 0..1 (or a filled stretch). */
  function film(k, x, y, w, o) {
    o = o || {};
    let out = `<rect x="${x}" y="${y}" width="${w}" height="10" rx="2" fill="#2e2d36" stroke="#555"/>`;
    for (let i = 1; i < 12; i++) out += `<line x1="${r1(x + (i * w) / 12)}" y1="${y + 1}" x2="${r1(x + (i * w) / 12)}" y2="${y + 9}" stroke="#444"/>`;
    (o.spans || []).forEach((s) => (out += `<rect x="${r1(x + w * s.a)}" y="${y + 1}" width="${r1(Math.max(1.5, w * (s.b - s.a)))}" height="8" fill="${s.color || S.gold}" opacity="${s.alpha || 0.85}"/>`));
    (o.pins || []).forEach((p) => {
      const px = x + w * k.clamp(p.p, 0, 1);
      out += `<path d="M${r1(px)} ${y + 10} l-4 -14 h8 Z" fill="${p.color || S.red}" stroke="${S.ink}"/>` + (p.label ? k.label({ x: px, y: y - 7, text: p.label, size: 8, color: p.color || "#eee" }) : "");
    });
    if (o.ends !== false) out += k.label({ x, y: y + 20, text: "start", size: 7, color: "#888", anchor: "start" }) + k.label({ x: x + w, y: y + 20, text: "end", size: 7, color: "#888", anchor: "end" });
    return out;
  }
  /* A stopwatch row: a bar of seconds with the number. */
  const stopwatch = (k, x, y, w, sec, max, color, lab) => `<rect x="${x}" y="${y}" width="${w}" height="7" rx="3.5" fill="#33323d"/><rect x="${x}" y="${y}" width="${r1(Math.max(2, (w * k.clamp(sec, 0, max)) / max))}" height="7" rx="3.5" fill="${color || S.gold}"/>` + k.label({ x: x + w + 4, y: y + 7, text: lab || `${fmt(sec)} s`, size: 8, color: "#ddd", anchor: "start" });

  /* ---------- the strip of small gauges ---------- */
  /* items: { label, kind: "bar" | "steps" | "when" | "word", p, text, n (steps), i (filled step) } */
  function strip(k, items) {
    const n = items.length;
    const cols = n > 4 ? 3 : 2;
    const cw = 304 / cols;
    /* Bold 8px text runs about 4.9 px a letter: cut a value to the room left in its column. */
    const fit = (txt, room) => {
      const max = Math.max(3, Math.floor(room / 4.7));
      return txt.length > max ? txt.slice(0, max - 1) + "…" : txt;
    };
    let out = `<rect x="0" y="120" width="320" height="42" fill="#0e0e13"/><line x1="0" y1="120" x2="320" y2="120" stroke="#34323c"/>`;
    items.forEach((it, j) => {
      const x = 8 + (j % cols) * cw;
      const y = 130 + Math.floor(j / cols) * 19;
      const w = cw - 8;
      const c = it.color || S.gold;
      out += k.label({ x, y, text: it.label, size: 8, color: "#a3a3b3", anchor: "start" });
      const by = y + 3;
      const txt = String(it.text);
      if (it.kind === "word") {
        out += k.label({ x, y: by + 7, text: fit(txt, w), size: 8, color: "#fff", anchor: "start", weight: 700 });
      } else if (it.kind === "steps") {
        const sw = Math.min(8, (w * 0.28) / it.n);
        for (let i = 0; i < it.n; i++) out += `<rect x="${r1(x + i * sw)}" y="${by}" width="${r1(sw - 1.5)}" height="7" rx="1.5" fill="${i <= it.i ? c : "#33323d"}"/>`;
        out += k.label({ x: x + it.n * sw + 3, y: by + 7, text: fit(txt, w - it.n * sw - 3), size: 8, color: "#fff", anchor: "start", weight: 700 });
      } else {
        /* The bar gives way to its value: the number always shows whole. */
        const tw = Math.min(txt.length * 4.7, w * 0.55);
        const bw = Math.max(20, w - tw - 5);
        out += `<rect x="${x}" y="${by}" width="${r1(bw)}" height="7" rx="3.5" fill="#33323d"/>`;
        if (it.kind === "when") out += `<line x1="${r1(x + bw * it.p)}" y1="${by - 2}" x2="${r1(x + bw * it.p)}" y2="${by + 9}" stroke="${c}" stroke-width="3" stroke-linecap="round"/>`;
        else out += `<rect x="${x}" y="${by}" width="${r1(Math.max(2, bw * k.clamp(it.p, 0, 1)))}" height="7" rx="3.5" fill="${c}"/>`;
        out += k.label({ x: x + bw + 4, y: by + 7, text: fit(txt, w - bw - 4), size: 8, color: "#fff", anchor: "start", weight: 700 });
      }
    });
    return out;
  }
  /* Gauge makers, read straight from the settings. */
  const G = (v) => ({
    num: (id, label, unit, color) => ({ label, kind: "bar", p: v.p(id), text: fmt(v.n(id)) + (unit || ""), color }),
    when: (id, label, color) => ({ label, kind: "when", p: v.p(id), text: Math.round(v.n(id)) + "% in", color }),
    steps: (id, label, color) => {
      const s = v.slider(id);
      const sc = (s && s.scale) || [];
      return { label, kind: "steps", n: sc.length, i: sc.indexOf(v(id)), text: v(id), color };
    },
    word: (id, label) => ({ label, kind: "word", text: v(id) }),
  });
  const pick = (v, id, list) => {
    const s = v.slider(id);
    const i = s && s.scale ? s.scale.indexOf(v(id)) : 0;
    return list[Math.max(0, Math.min(list.length - 1, i))];
  };
  const idx = (v, id) => {
    const s = v.slider(id);
    return s && s.scale ? Math.max(0, s.scale.indexOf(v(id))) : 0;
  };
  const pad = (id, x, y, xLabel, yLabel) => W.add(id, { window: { faces: [{ face: "pad", x, y, xLabel, yLabel }] } });
  const look = (id, fn) => W.look(id, (v, k) => fn(v, k, G(v)));

  /* ======================= the plot and the people ======================= */

  /* The plot as a road: the mix bends, loops or breaks it at the trouble point. */
  look("mixPlot", (v, k, g) => {
    const lvl = idx(v, "setting");
    const tx = k.lerp(270, 60, v.p("fuse"));
    const y0 = 34;
    const road = [
      `M14 ${y0} H306`,
      `M14 ${y0} H${tx - 14} q14 -18 28 0 H306`,
      `M14 ${y0} H${tx} q40 0 40 26 q0 22 -30 22 q-24 0 -10 -48 H306`,
      `M14 ${y0} H${tx} L${Math.min(306, tx + 70)} ${y0 + 46} H306`,
      `M14 ${y0} H${tx} l6 10 l-8 8 l10 12`,
    ][lvl];
    const R = 10 + v.p("spread") * 28;
    let out = stage(k) + `<circle cx="${r1(tx)}" cy="${y0}" r="${r1(R)}" fill="${S.red}" opacity="${r1(0.15 + v.p("spread") * 0.2)}"/>`;
    out += `<path d="${road}" fill="none" stroke="${S.gold}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`;
    if (lvl === 4) out += burst(k, tx + 10, y0 + 32, 10, S.red);
    else if (lvl > 0) out += k.dot({ x: tx, y: y0, r: 5, color: S.red });
    /* who caused it, standing under the trouble */
    const who = idx(v, "who");
    const ppl = [2, 1, 3, 5][who];
    const cx = k.clamp(tx, 40, 240);
    for (let i = 0; i < ppl; i++) out += guy(k, cx + (i - (ppl - 1) / 2) * 20, { s: 0.5, color: who === 1 ? S.orange : S.blue, mood: 0.6, arms: 0.6 });
    /* the people pulled in */
    /* the people pulled in: a red crowd in the free top corner, away from the blamed one */
    out += heads(k, v.n("peopleCaught"), tx > 160 ? 10 : 248, 46, 66, { r: 3, color: S.red, max: 18 });
    /* the audience's eye, ahead of the trouble when we see it coming */
    if (v.p("seenComing") > 0) out += k.label({ x: Math.max(74, tx - 16 - v.p("seenComing") * 60), y: y0 - 6, text: "👀", size: 12 });
    /* blame */
    const bl = idx(v, "blame");
    const bx = tx > 160 ? 30 : 290;
    out += guy(k, bx, { s: 0.5, color: "#666", mood: bl === 1 || bl === 3 ? -0.7 : 0 });
    if (bl === 1 || bl === 3) out += chip(k, bx > 160 ? bx - 12 : bx + 12, 96, "blamed", S.red, bx > 160 ? "end" : "start");
    if (bl >= 2) out += chip(k, cx, 66, "blamed", S.red, "middle");
    out += chip(k, 6, 18, "the plot", "#26252d", "start");
    out += strip(k, [g.steps("seenComing", "We see it coming"), g.steps("fixable", "How hard to fix", S.red), g.num("scenesChanged", "Later scenes changed", " scenes"), g.num("peopleCaught", "People pulled in", "", S.red)]);
    return out + fitCap(k, `The plot: ${v("setting")} · caused by ${v("who")}`);
  });

  /* A flawed hero: the flaw is a thought cloud; size and trigger shake them; the cost falls on someone. */
  const FLAW = { vanity: "🪞", greed: "💰", cowardice: "🐔", pride: "🦚", cluelessness: "🤷", laziness: "🛋️", neediness: "🥺", rigidity: "📏" };
  look("comicFlaw", (v, k, g) => {
    const size = v.p("size");
    const blind = v.p("blind");
    const like = v.p("likeable");
    let out = stage(k, { spot: 90 });
    out += guy(k, 90, { s: 1, color: S.orange, mood: k.lerp(-0.5, 0.8, like), lean: v.p("trigger") * 10, arms: v.p("trigger") * 0.8, eyes: k.lerp(0.9, 0.1, blind) });
    /* the flaw: a cloud that grows */
    const fr = 10 + size * 22;
    out += `<ellipse cx="150" cy="${r1(40 - size * 6)}" rx="${r1(fr * 1.3)}" ry="${r1(fr)}" fill="#fff" stroke="${S.ink}" stroke-width="2"/>` + k.text({ x: 150, y: 40 - size * 6 + fr * 0.35, text: FLAW[v("flaw")] || "?", size: 8 + size * 24 });
    out += k.dot({ x: 112, y: 52, r: 2.5, color: "#fff" }) + k.dot({ x: 120, y: 48, r: 3.5, color: "#fff" });
    if (blind > 0.6) out += k.label({ x: 90, y: 12, text: "can't see it", size: 9, color: "#bbb" });
    else if (blind > 0.2) out += k.label({ x: 90, y: 12, text: "half sees it", size: 9, color: "#bbb" });
    else out += k.label({ x: 90, y: 12, text: "sees it", size: 9, color: "#bbb" });
    /* likeable: hearts */
    out += Array.from({ length: Math.round(v.n("likeable")) }, (_, i) => k.text({ x: 306 - i * 12, y: 20, text: "♥", size: 11, color: S.pink })).join("");
    /* who pays, and what */
    const pays = v("whoPays");
    const px = 250;
    const n = pays === "the whole group" ? 3 : 1;
    for (let i = 0; i < n; i++) out += guy(k, px + (i - (n - 1) / 2) * 22, { s: 0.6, color: pays === "themselves" ? S.orange : S.blue, mood: -0.4 - v.p("cost") * 0.6 });
    out += chip(k, px, 58, `pays: ${pays}`, "#3a2a2a", "middle") + chip(k, px, 76, `loses ${v("cost")}`, S.red, "middle");
    /* how often it shows: tick marks */
    out += Array.from({ length: Math.round(v.n("showsPerScene")) }, (_, i) => `<rect x="${136 + i * 9}" y="96" width="6" height="12" rx="1.5" fill="${S.orange}"/>`).join("") + k.label({ x: 136, y: 92, text: `shows ${fmt(v.n("showsPerScene"))}× a scene`, size: 8, color: "#bbb", anchor: "start" });
    out += strip(k, [g.steps("trigger", "Set off by"), g.num("kickIn", "Kicks in after", " s"), g.steps("firstShown", "First seen"), g.steps("byTheEnd", "By the end", S.green)]);
    return out + fitCap(k, `Flaw: ${v("flaw")} · ${Math.round(v.n("size"))} of 5 · ${v("blind")}`);
  });

  /* A premise as a sign over the stage: how clear, how hard it grabs, and how far it gets taken. */
  look("comicPremise", (v, k, g) => {
    const clr = v.p("clarity");
    const world = idx(v, "grounded");
    const bgc = ["#2a1f3a", "#1f2533", "#1a1d22"][world];
    let out = stage(k, { bg: bgc });
    /* the premise card: blurry when unclear */
    out += `<defs><filter id="cw-comicPremise-blur${Math.round(clr * 100)}"><feGaussianBlur stdDeviation="${r1((1 - clr) * 2.5)}"/></filter></defs>`;
    out += `<g filter="url(#cw-comicPremise-blur${Math.round(clr * 100)})"><rect x="70" y="8" width="180" height="30" rx="6" fill="${S.paper}" stroke="${S.ink}" stroke-width="2"/>${k.text({ x: 160, y: 28, text: "WHAT IF…?", size: 14, color: S.ink, weight: 900 })}</g>`;
    /* hook: fishing line from the sign down */
    const hook = v.p("hook");
    out += `<path d="M160 38 V${r1(48 + hook * 24)} q0 8 -6 6" fill="none" stroke="${S.gold}" stroke-width="${r1(1 + hook * 3)}"/>`;
    /* world style: cartoon wobble or real */
    out += guy(k, 160, { s: 0.75, color: S.orange, mood: 0.5 + hook * 0.4, arms: hook, eyes: world === 0 ? 1 : 0.7 });
    out += k.label({ x: 160, y: 60 - 2, text: "", size: 1 });
    /* mined: rungs of a ladder going up the right side */
    const mined = Math.round(v.n("mined"));
    for (let i = 0; i < 5; i++) out += `<rect x="268" y="${100 - i * 18}" width="34" height="12" rx="2" fill="${i < mined ? S.gold : "#33323d"}" stroke="#555"/>`;
    out += k.label({ x: 285, y: 18, text: "taken far", size: 8, color: "#bbb" });
    /* fresh angles: arrows out of the premise */
    const ang = Math.round(v.n("newAngles"));
    for (let i = 0; i < ang; i++) {
      const a = Math.PI * (0.15 + (i / Math.max(1, 7)) * 0.7);
      out += k.arrow({ x1: 160 - Math.cos(a) * 30, y1: 60 + 0, x2: 160 - Math.cos(a) * 70, y2: 60 + Math.sin(a) * -22 + 20, color: S.green, w: 1.5 });
    }
    /* rules: a fence. strictly = straight; anything goes = broken */
    const rl = idx(v, "rules");
    out += `<path d="M10 104 ${rl === 2 ? "H70" : rl === 1 ? "H30 l6 -5 H70" : "H24 m8 -8 l10 6 m6 2 H70"}" stroke="#bbb" stroke-width="2" fill="none"/>` + k.label({ x: 10, y: 96, text: `rules: ${v("rules")}`, size: 8, color: "#bbb", anchor: "start" });
    out += chip(k, 40, 20, ["cartoon world", "heightened", "real world"][world], "#33323d", "middle");
    out += strip(k, [g.steps("clearBy", "Clear by"), g.steps("stakes", "What's riding on it", S.red), g.num("screenShare", "Share of the scene", "%"), g.num("premiseJokes", "Premise jokes", "/min")]);
    return out + fitCap(k, `Premise clarity ${Math.round(v.n("clarity"))} of 5 · fresh angles ${ang}`);
  });
  pad("comicPremise", "clarity", "mined", "How clear", "How far it is taken");

  /* A tower of lies: blocks stacked under a sweating liar; it tips as it nears collapse. */
  look("escalatingLie", (v, k, g) => {
    const layers = Math.round(v.n("layers"));
    const size = v.p("size");
    const near = idx(v, "near");
    const tilt = [0, 4, 10, 30][near];
    let out = stage(k);
    const bw = 30 + size * 50;
    let tower = "";
    for (let i = 0; i <= layers; i++) {
      const w = bw * (1 - i * 0.08);
      tower += `<rect x="${r1(200 - w / 2 + i * tilt * 0.4)}" y="${FY - 14 * (i + 1)}" width="${r1(w)}" height="13" rx="2" fill="${k.mix("#c9a77a", "#e4572e", i / 6)}" stroke="${S.ink}"/>`;
    }
    tower += k.label({ x: 200, y: FY - 4, text: "the lie", size: 8, color: S.ink });
    out += near === 3 ? `<g transform="rotate(40 220 ${FY})">${tower}</g>` + burst(k, 260, 96, 12, S.red) : `<g transform="rotate(${tilt} 200 ${FY})">${tower}</g>`;
    /* the liar: calm when skilled */
    const skill = v.p("liarSkill");
    out += guy(k, 70, { s: 0.9, color: S.orange, mood: k.lerp(-0.5, 0.7, skill), look: 1 });
    out += sweat(k, 82, 34, Math.round((1 - skill) * 3 + near * 0.5));
    /* made-up details: little speech bubbles */
    const md = idx(v, "madeUp");
    for (let i = 0; i < md * 2; i++) out += `<rect x="${95 + (i % 3) * 22}" y="${10 + Math.floor(i / 3) * 14}" width="18" height="10" rx="4" fill="#fff" stroke="${S.ink}"/>`;
    /* who is fooled: heads on the right */
    out += heads(k, v.n("fooled"), 262, 20, 52, { r: 4, color: S.blue });
    out += k.label({ x: 288, y: 12, text: `to ${v("toldTo")}`, size: 8, color: "#bbb" });
    /* the audience in on it */
    if (v.p("audienceIn") > 0) out += k.label({ x: 20, y: 18, text: v.p("audienceIn") > 0.7 ? "👀 we know" : "👀 we suspect", size: 9, color: "#ddd", anchor: "start" });
    out += strip(k, [g.when("collapseAt", "When it collapses", S.red), g.word("collapseHow", "How it collapses"), g.num("newLieGap", "New lie every", " s"), g.num("coverPause", "Pause before cover", " s"), g.steps("near", "Collapse", S.red), g.word("liarSkill", "Liar")]);
    return out + fitCap(k, `Lie size ${Math.round(v.n("size"))} of 5 · ${layers} lies on lies · ${v("near")}`);
  });
  pad("escalatingLie", "layers", "size", "Lies on lies", "How big the lie");

  /* Two people, two different pictures in their thought bubbles. */
  const SRC = { "a misheard word": ["🦆", "🦢"], "a wrong room": ["🚪1", "🚪2"], "a mixed-up object": ["💍", "🍩"], "a wrong identity": ["🧑‍⚕️", "🧑‍🍳"], "a half-heard talk": ["💬", "💔"] };
  look("misunderstanding", (v, k, g) => {
    const depth = v.p("depth");
    const ppl = Math.round(v.n("peopleIn"));
    const pair = SRC[v("source")] || ["?", "?"];
    const gap = 90 + depth * 60;
    const ax = 160 - gap / 2;
    const bx = 160 + gap / 2;
    let out = stage(k);
    out += guy(k, ax, { s: 0.85, color: S.blue, mood: 0.4, look: 1 }) + guy(k, bx, { s: 0.85, color: S.orange, mood: 0.4 - depth, look: -1 });
    out += `<ellipse cx="${r1(ax)}" cy="20" rx="24" ry="15" fill="#fff" stroke="${S.ink}" stroke-width="2"/>${k.text({ x: ax, y: 27, text: pair[0], size: 18 })}`;
    out += `<ellipse cx="${r1(bx)}" cy="20" rx="24" ry="15" fill="#fff" stroke="${S.ink}" stroke-width="2"/>${k.text({ x: bx, y: 27, text: pair[1], size: 18 })}`;
    out += k.label({ x: 160, y: 24, text: "≠", size: 20, color: S.red, weight: 900 });
    /* lines that work both ways: double arrows between them */
    for (let i = 0; i < Math.round(v.n("doubleLines")); i++) out += k.label({ x: 151 + (i % 2) * 18 - (i === 4 ? 9 : 0), y: 48 + Math.floor(i / 2) * 12, text: "⇄", size: 11, color: S.gold });
    /* near misses */
    for (let i = 0; i < Math.round(v.n("nearMisses")); i++) out += k.label({ x: 138 + i * 9, y: 108, text: "!", size: 11, color: S.red, weight: 900 });
    /* everyone else caught */
    const extra = Math.max(0, ppl - 2);
    out += heads(k, extra, 6, 74, 40, { r: 3.5, color: S.grey }) + heads(k, Math.ceil(extra / 2), 274, 74, 40, { r: 0.01, color: "transparent" });
    /* who sees it: eye */
    const who = v("who");
    out += chip(k, 160, 98 - Math.round(v.n("nearMisses")) * 0 - 0, `sees it: ${who}`, "#2c3346", "middle").replace(/y="88/g, 'y="88');
    out += strip(k, [g.num("lasts", "How long", " scenes"), g.steps("clearsUp", "Clears up"), g.steps("audienceAhead", "We get it"), g.word("between", "Between"), g.num("peopleIn", "People in it", ""), g.num("dawnSilence", "Silence when clear", " s")]);
    return out + fitCap(k, `Misunderstanding from ${v("source")} · depth ${Math.round(v.n("depth"))} of 5`);
  });

  /* A room of people: insiders glow gold and trade looks; the outsider is in grey. */
  look("whoKnows", (v, k, g) => {
    const room = Math.round(v.n("roomSize"));
    const inOn = Math.min(room - 1, Math.round(v.n("inOn")));
    const gapI = idx(v, "gap");
    const frac = [0, 0.2, 0.5, 0.95][gapI];
    const knowers = Math.max(gapI === 0 ? 0 : 1, Math.round(Math.max(inOn, frac * room)) * (gapI === 0 ? 0 : 1));
    let out = stage(k);
    const per = Math.min(room, 15);
    const pos = (i) => [20 + (i % per) * (220 / per), 64 + Math.floor(i / per) * 22];
    for (let i = 0; i < Math.min(room, 30); i++) {
      const [x, y] = pos(i);
      const ins = i < knowers;
      out += k.face({ x: x + 6, y, r: Math.min(8, 110 / per - 0.6), mood: ins ? 0.6 : 0, look: ins ? 1 : 0, color: ins ? "#f3d27a" : "#c9c4bb", eyes: 0.8 });
    }
    /* secret looks: arcs between insiders */
    const looks = Math.round(v.n("secretLooks"));
    for (let i = 0; i < Math.min(looks, Math.max(0, knowers - 1) || looks); i++) {
      const [x1] = pos(i % Math.max(1, knowers));
      const x2 = x1 + 40 + i * 6;
      out += `<path d="M${r1(x1 + 6)} 54 Q${r1((x1 + x2) / 2 + 6)} ${r1(40 - v.n("lookLength") * 4)} ${r1(x2)} 54" fill="none" stroke="${S.gold}" stroke-width="1.5" stroke-dasharray="3 2"/>`;
    }
    /* the outsider */
    const outsider = idx(v, "outsider");
    out += guy(k, 280, { s: 0.85, color: "#666", mood: outsider === 2 ? 0.3 : 0, look: -1, eyes: [0.4, 0.8, 1][outsider] });
    out += k.label({ x: 280, y: 14, text: ["🙂 no idea", "🤨 senses it", "💡 figures it out"][outsider], size: 9, color: "#ddd" });
    /* the secret: a locked box, leaking */
    const leak = idx(v, "leak");
    out += `<rect x="236" y="88" width="20" height="16" rx="2" fill="${S.gold}" stroke="${S.ink}"/>` + k.label({ x: 246, y: 100, text: leak >= 3 ? "!" : "🔒", size: 9, color: S.ink, weight: 900 });
    for (let i = 0; i < leak; i++) out += `<circle cx="${250 + i * 5}" cy="${84 - i * 6}" r="${2 + i}" fill="${S.gold}" opacity="${r1(0.8 - i * 0.2)}"/>`;
    /* the audience */
    out += k.label({ x: 8, y: 16, text: `we know: ${v("audience")}`, size: 9, color: "#ddd", anchor: "start" });
    /* hiding effort: sweat on the first insider */
    if (knowers) out += sweat(k, 30, 46, v.n("hiding"));
    out += strip(k, [g.num("hiding", "Effort to hide", ""), g.steps("revealAt", "Comes out"), g.num("closeCalls", "Close calls", "/scene", S.red), g.num("lookLength", "Insider looks", " s"), g.num("inOn", "People in on it", "", S.gold)]);
    return out + fitCap(k, `In on it: ${v("gap")} · ${knowers} of ${room} people`);
  });

  /* A staircase of steps climbing to a ceiling: the last step tells how far it goes. */
  look("comicEscalation", (v, k, g) => {
    const steps = Math.max(1, Math.round(v.n("steps")));
    const lvl = v.p("setting");
    const jump = v.n("stepJump") / 100;
    const shape = idx(v, "speed");
    const gapS = v.p("stepGap");
    const calm = idx(v, "falseCalm");
    let out = stage(k);
    const calmW = calm ? 16 + v.p("calmLength") * 30 : 0;
    const x0 = 14 + calmW;
    const avail = 210 - calmW;
    const sw = Math.min(42, avail / steps);
    /* heights: grow by stepJump each step; shaped by speed */
    const hs = [];
    let h = 1;
    for (let i = 0; i < steps; i++) {
      hs.push(h);
      h *= 1 + jump;
    }
    const mx = hs[hs.length - 1] || 1;
    const top = 16 + (1 - lvl) * 60;
    hs.forEach((hh, i) => {
      let f = hh / mx;
      if (shape === 0) f = Math.pow(f, 1.6);
      if (shape === 3) f = i === steps - 1 ? 1 : 0.15;
      const hgt = 6 + f * (FY - top - 6);
      out += `<rect x="${r1(x0 + i * sw + gapS * sw * 0.3)}" y="${r1(FY - hgt)}" width="${r1(Math.max(2, sw * (1 - gapS * 0.3) - 2))}" height="${r1(hgt)}" fill="${k.mix("#5fae78", "#e4572e", f)}" stroke="${S.ink}"/>`;
    });
    if (calm) out += `<rect x="14" y="${FY - 6}" width="${r1(calmW - 4)}" height="6" fill="#7fb7ff"/>` + k.label({ x: 14 + calmW / 2, y: FY - 10, text: calm === 2 ? "calm" : "beat", size: 8, color: "#7fb7ff" });
    /* point of no return */
    const nr = x0 + avail * v.p("noReturn");
    out += `<line x1="${r1(nr)}" y1="10" x2="${r1(nr)}" y2="${FY}" stroke="${S.red}" stroke-dasharray="4 3"/>` + k.label({ x: k.clamp(nr, 28, 200), y: 9, text: "no way back", size: 8, color: S.red });
    /* the ceiling */
    const ceil = v("ceiling");
    out += `<rect x="232" y="10" width="84" height="44" rx="6" fill="#22212a" stroke="#555"/>` + k.text({ x: 274, y: 32, text: ["😬", "😳", "🌀", "🔥", "☄️"][idx(v, "ceiling")], size: 18 }) + k.label({ x: 274, y: 48, text: ceil, size: 9, color: "#ddd" });
    out += heads(k, v.n("peopleAtEnd"), 234, 66, 80, { r: 3, color: S.red, max: 30 });
    out += strip(k, [g.num("stepGap", "Breathing room", " s"), g.num("stepJump", "Each step bigger", "%"), g.num("calmLength", "Length of calm", " s", "#7fb7ff"), g.num("peopleAtEnd", "People caught", "", S.red)]);
    return out + fitCap(k, `Escalation ${Math.round(v.n("setting"))} of 5 · ${steps} steps · ${v("speed")}`);
  });
  pad("comicEscalation", "steps", "setting", "Number of steps", "How high it climbs");

  /* Setup and payoff as a little comic strip: plant (panel 1), build, payoff (last panel). */
  const DISG = { nothing: "", "a different joke": "😂", "story business": "📜", "a prop in the background": "🪴" };
  look("comicBeat", (v, k, g) => {
    const st = idx(v, "setting");
    const vis = v.p("visibility");
    const builds = Math.round(v.n("builds"));
    const twist = idx(v, "twist");
    const lp = v.p("payoffSize");
    let out = k.bg(S.bg);
    const n = 2 + Math.min(builds, 3);
    const pw = 300 / n;
    for (let i = 0; i < n; i++) {
      const x = 10 + i * pw;
      const lit = (i === 0 && st >= 1) || (i > 0 && i < n - 1 && st >= 2) || (i === n - 1 && st >= 3);
      out += k.panel({ x, y: 8, w: pw - 6, h: 104, fill: lit ? S.paper : "#4a4852" });
      const cx = x + (pw - 6) / 2;
      if (i === 0) {
        /* the plant: a banana peel, more or less obvious */
        out += `<path d="M${r1(cx - 6)} 100 q6 -16 12 0 q-6 -6 -12 0" fill="${S.gold}" opacity="${r1(0.25 + vis * 0.75)}" stroke="${S.ink}"/>`;
        if (vis > 0.9) out += k.ring({ x: cx, y: 94, r: 14, color: S.red, w: 2 });
        if (DISG[v("disguise")]) out += k.text({ x: cx + 18, y: 40, text: DISG[v("disguise")], size: 16 });
        out += guy(k, cx - 14, { y: 108, s: 0.55, color: S.blue }).replace(/y="112/, "");
        out += k.label({ x: cx, y: 22, text: "plant", size: 9, color: S.ink, weight: 700 });
      } else if (i < n - 1) {
        out += k.label({ x: cx, y: 60, text: "…", size: 18, color: S.ink }) + k.label({ x: cx, y: 22, text: "build", size: 9, color: S.ink, weight: 700 });
      } else {
        /* the payoff: someone slips — or, twisted, the peel slips on them */
        out += twist === 2 ? `<path d="M${r1(cx - 14)} 70 q8 -18 16 0 q-8 -8 -16 0" fill="${S.gold}" stroke="${S.ink}" transform="rotate(-30 ${r1(cx)} 70)"/>` + guy(k, cx + 8, { y: 108, s: 0.55, color: S.orange, mood: 0.8 }) : `<g transform="rotate(${twist ? -50 : -80} ${r1(cx)} 104)">${guy(k, cx, { y: 104, s: 0.55, color: S.orange, mood: -0.6, arms: 1 })}</g>`;
        if (st >= 3) out += ha(k, cx, 64, Math.min(lp, (pw - 26) / 36), -8);
        out += k.label({ x: cx, y: 22, text: "payoff", size: 9, color: S.ink, weight: 700 });
      }
    }
    out += strip(k, [g.steps("plantedWhen", "Planted"), g.num("plantToPayoff", "Setup → payoff", " min"), g.num("setupSeen", "Setup on screen", " s"), g.num("payoffPause", "Beat before payoff", " s"), g.steps("payoffSize", "Laugh"), g.word("disguise", "Hidden by")]);
    return out + fitCap(k, `${v("setting")} · setup ${v("visibility")} · ${v("twist")}`);
  });

  /* A film line from the setup to the payoff, with reminders along the way and the audience's memory fading. */
  const PLANT = { "a line": "💬", "a prop": "🎁", "an action": "🤸", "a sound": "🔔", "a background detail": "🖼️" };
  look("payoffDistance", (v, k, g) => {
    const sc = Math.round(v.n("setting"));
    const forget = v.p("forget");
    const nRem = idx(v, "reminder") === 0 ? 0 : idx(v, "reminder") === 1 ? 1 : 3;
    let out = stage(k);
    const x0 = 30;
    const x1 = 96 + (sc / 10) * 194;
    /* scenes as film frames */
    for (let i = 0; i <= sc; i++) out += `<rect x="${r1(x0 + ((x1 - x0) * i) / Math.max(1, sc) - 8)}" y="44" width="16" height="22" rx="2" fill="#2e2d36" stroke="#555"/>`;
    /* memory: a fading line */
    out += `<defs><linearGradient id="cw-payoffDistance-mem"><stop offset="0" stop-color="${S.gold}"/><stop offset="1" stop-color="${S.gold}" stop-opacity="${r1(1 - forget * 0.95)}"/></linearGradient></defs><rect x="${x0}" y="76" width="${r1(x1 - x0)}" height="5" rx="2.5" fill="url(#cw-payoffDistance-mem)"/>` + k.label({ x: x0, y: 92, text: forget > 0.5 ? "we forget…" : "we remember", size: 8, color: "#bbb", anchor: "start" });
    out += k.text({ x: x0, y: 34, text: PLANT[v("plantedIn")] || "•", size: 18 }) + k.label({ x: x0, y: 16, text: "setup", size: 9, color: "#ddd" });
    const lands = idx(v, "landsAt");
    out += burst(k, x1, 30, 10 + lands * 4, S.gold, "HA", 8 + lands) + k.label({ x: x1, y: 104, text: v("landsAt"), size: 8, color: "#ddd" });
    const rem = ["👁", "💬", "🎁", "📣"][idx(v, "reminderLook")];
    const nR = Math.min(nRem, Math.max(1, sc)); /* only as many reminders as there are scenes to put them in */
    for (let i = 0; i < nR; i++) out += k.text({ x: x0 + ((x1 - x0) * (i + 1)) / (nR + 1), y: 40, text: rem, size: 11 });
    out += strip(k, [g.steps("reminder", "Reminders"), g.word("reminderLook", "Reminder looks like"), g.steps("recognize", "We recognize it"), g.num("minutes", "Setup → payoff", " min")]);
    return out + fitCap(k, `${sc} scenes from setup to payoff · ${v("plantedIn")}`);
  });

  /* Two shapes of people: same to opposite; friction is sparks between them. */
  look("typeClash", (v, k, g) => {
    const diff = v.p("setting");
    const fr = v.p("friction");
    const apart = v.n("apart");
    const sizeI = idx(v, "size");
    const gap = 30 + (apart / 10) * 160;
    const ax = 160 - gap / 2;
    const bx = 160 + gap / 2;
    let out = stage(k);
    const swap = idx(v, "roleSwap");
    const cA = S.blue;
    const cB = k.mix("#4a6fa5", "#e8913a", diff);
    out += guy(k, ax, { s: 0.9, color: cA, mood: k.lerp(0.3, -0.2, v.p("straightness")) * 1, lean: -fr * 8, look: 1 });
    out += `<g transform="translate(${r1(bx)} ${FY}) scale(${r1(1 + diff * 0.25)} ${r1(1 - diff * 0.2)}) translate(${r1(-bx)} -${FY})">${guy(k, bx, { s: 0.9, color: cB, mood: 0.6, arms: diff, lean: fr * 8, look: -1 })}</g>`;
    if (sizeI >= 1) out += guy(k, 160, { s: 0.6, color: S.green, mood: 0.2 });
    if (sizeI >= 2) out += guy(k, 22, { s: 0.55, color: S.purple }) + guy(k, 298, { s: 0.55, color: S.pink });
    /* sparks */
    for (let i = 0; i < Math.round(fr * 5); i++) out += k.label({ x: 160 + (i - 2) * 9, y: 28 + (i % 2) * 8, text: "⚡", size: 12 });
    if (swap) out += k.arrow({ x1: ax, y1: 16, x2: bx, y2: 16, color: "#bbb", w: 1.5 }) + k.arrow({ x1: bx, y1: 22, x2: ax, y2: 22, color: "#bbb", w: 1.5 }) + k.label({ x: 160, y: 12, text: `swap ${v("roleSwap")}`, size: 8, color: "#bbb" });
    /* need each other: a rope between their hands */
    const need = idx(v, "need");
    if (need) out += `<path d="M${r1(ax + 14)} 72 Q160 ${80 + need * 8} ${r1(bx - 14)} 72" fill="none" stroke="#c9a77a" stroke-width="${need * 1.5}"/>`;
    out += strip(k, [g.num("straightness", "Plays it straight", ""), g.steps("flashpoint", "Set off by", S.red), g.steps("showsWhen", "Clash shows"), g.num("clashesPerScene", "Clashes", "/scene", S.red), g.num("apart", "Space between", " m"), g.steps("need", "Need each other")]);
    return out + fitCap(k, `${v("setting")} · ${v("size") === "two" ? "a pair" : v("size")}`);
  });
  pad("typeClash", "apart", "friction", "Space between them", "How much they rub");

  /* A formal room of neat chairs, with chaos scribbling over a share of the frame. */
  const CHAOS = { "a person": "🤪", "an animal": "🐐", "an object": "🎈", "the weather": "🌪️", "a misunderstanding": "❓" };
  look("chaosInRoom", (v, k, g) => {
    const lvl = idx(v, "setting");
    const order = idx(v, "order");
    const share = v.p("frameShare");
    let out = stage(k, { bg: ["#2a2420", "#22262a", "#1e2230", "#1a1a24"][order] });
    /* the orderly room: rows of people, neater when formal */
    const n = Math.min(24, Math.round(v.n("roomPeople")));
    const spr = idx(v, "spread");
    for (let i = 0; i < n; i++) {
      const x = 62 + (i % 12) * 20;
      const y = 74 + Math.floor(i / 12) * 26;
      const caught = spr === 2 || (spr === 1 && i % 3 === 0) || lvl >= 3;
      const jig = order === 0 || caught ? (k.rnd(i) - 0.5) * 8 : 0;
      out += k.face({ x: x + jig, y: y + jig * 0.5, r: 8, mood: caught ? -0.6 : 0, eyes: caught ? 1 : 0.6, color: caught ? "#f0b48a" : "#c9c4bb" });
    }
    if (v.n("roomPeople") > 24) out += k.label({ x: 312, y: 104, text: `+${Math.round(v.n("roomPeople")) - 24}`, size: 8, color: "#bbb", anchor: "end" });
    /* the chaos zone */
    const cw = 20 + share * 220;
    const ent = idx(v, "entrance");
    out += `<rect x="${r1(300 - cw)}" y="16" width="${r1(cw)}" height="96" rx="10" fill="${S.red}" opacity="${r1(0.08 + lvl * 0.06)}"/>`;
    out += k.text({ x: 300 - cw / 2, y: 50, text: CHAOS[v("source")] || "🤪", size: 14 + lvl * 5 });
    if (ent === 2) out += motion(k, 300 - cw / 2 - 18, 40, 3, 26);
    if (ent === 1) out += k.label({ x: 300 - cw / 2, y: 62, text: "…creeping", size: 8, color: "#ddd" });
    /* keeping order: a stern host */
    out += guy(k, 30, { s: 0.7, color: "#333a4a", arms: v.p("keepOrder"), mood: -v.p("keepOrder") * 0.6 });
    out += sweat(k, 38, 42, v.n("keepOrder") * 0.6);
    out += chip(k, 160, 14, `broken: ${v("damage")}`, idx(v, "damage") ? S.red : "#33323d", "middle");
    out += strip(k, [g.when("arrivesAt", "Chaos arrives"), g.when("peakAt", "Peaks", S.red), g.steps("order", "Room was"), g.steps("entrance", "Arrives"), g.steps("spread", "Spreads", S.red), g.num("roomPeople", "People", "")]);
    return out + fitCap(k, `${v("setting")} · from ${v("source")}`);
  });
  pad("chaosInRoom", "arrivesAt", "frameShare", "When chaos arrives", "How much of the frame");

  /* Rank as height: one on a pedestal, one low; a flip swaps them; pretending puts a fake crown on. */
  look("statusGap", (v, k, g) => {
    const gap = v.p("setting");
    const flip = idx(v, "flip");
    const hg = v.n("heightGap");
    const ped = gap * 28 + Math.max(0, hg) * 0.2;
    const highL = flip < 2;
    const lx = 100;
    const rx = 220;
    const hx = highL ? lx : rx;
    const lowx = highL ? rx : lx;
    let out = stage(k);
    out += `<rect x="${hx - 26}" y="${r1(FY - ped)}" width="52" height="${r1(ped)}" fill="#6b5a7a" stroke="${S.ink}"/>`;
    const play = idx(v, "playing");
    const fall = v.p("fall");
    out += guy(k, hx, { y: FY - ped, s: 0.75, color: S.purple, mood: play === 2 || play === 3 ? -0.2 : 0.4, lean: flip === 1 ? 12 : -4 + fall * 0, arms: play === 2 || play === 3 ? -0.6 : 0.5 });
    out += k.text({ x: hx, y: Math.max(20, FY - ped - 64), text: "👑", size: 13 });
    out += guy(k, lowx, { s: 0.75, color: "#7a6a55", mood: play === 1 || play === 3 ? 0.6 : -0.2, lean: play === 1 || play === 3 ? -6 : 10, look: highL ? -1 : 1, arms: play === 1 || play === 3 ? 0.8 : -0.4 });
    if (v.n("pretense") > 0) out += k.text({ x: lowx, y: FY - 72, text: "👑", size: 6 + v.n("pretense") * 3, alpha: 0.6 });
    /* the fall: an arrow down from the pedestal */
    if (fall > 0) out += k.arrow({ x1: hx + 34, y1: FY - ped - 40, x2: hx + 34, y2: FY - ped - 40 + fall * 50, color: S.red });
    /* the look up: a sight line */
    const la = v.n("lookUp");
    out += `<line x1="${lowx + (highL ? -8 : 8)}" y1="${FY - 66}" x2="${r1(lowx + (highL ? -1 : 1) * 70)}" y2="${r1(FY - 66 - Math.tan(k.rad(la)) * 70)}" stroke="${S.gold}" stroke-dasharray="3 3"/>`;
    /* who we root for */
    const root = idx(v, "rootFor");
    const rootX = root === 0 ? hx + 24 : root === 2 ? lowx + 24 : 160;
    out += k.text({ x: rootX, y: 14, text: root === 1 ? "♥ ♥" : "♥", size: 13, color: S.pink });
    out += strip(k, [g.steps("flip", "Status flip", S.red), g.steps("shiftWhen", "Shifts"), g.num("heightGap", "Higher in frame", "%"), g.num("lookUp", "Looks up", "°"), g.word("rankAgainst", "Rank against"), g.word("playing", "Playing")]);
    return out + fitCap(k, `Gap in rank: ${v("setting")}`);
  });

  /* Two people before and after: a change meter between the two halves. */
  look("mixArc", (v, k, g) => {
    const ch = v.p("setting");
    const dir = v.p("direction");
    const learns = idx(v, "learns");
    let out = stage(k) + `<line x1="160" y1="12" x2="160" y2="${FY}" stroke="#444" stroke-dasharray="4 4"/>`;
    out += k.label({ x: 80, y: 14, text: "before", size: 9, color: "#aaa" }) + k.label({ x: 240, y: 14, text: "after", size: 9, color: "#aaa" });
    out += guy(k, 55, { s: 0.75, color: S.blue, mood: 0 }) + guy(k, 105, { s: 0.75, color: S.orange, mood: 0 });
    const m = (on) => (on ? k.lerp(-0.8, 0.9, dir) * ch : 0);
    const changed = (who) => learns === 3 || learns === who;
    const sticks = idx(v, "sticks");
    out += guy(k, 215, { s: 0.75 + (changed(2) ? ch * 0.2 : 0), color: S.blue, mood: m(changed(2)), arms: changed(2) ? ch * dir : 0, alpha: sticks === 0 ? 0.6 : 1 });
    out += guy(k, 265, { s: 0.75 + (changed(1) ? ch * 0.2 : 0), color: S.orange, mood: m(changed(1)), arms: changed(1) ? ch * dir : 0, alpha: sticks === 0 ? 0.6 : 1 });
    /* the pace: a smooth ramp, steps or a jump */
    const pace = idx(v, "pace");
    const path = ["M130 60 L190 30", "M130 60 h15 v-10 h15 v-10 h15 v-10 h15", "M130 60 h30 v-30 h30"][pace];
    out += `<path d="${path}" fill="none" stroke="${S.gold}" stroke-width="2.5"/>`;
    /* resisting: a brake */
    out += Array.from({ length: Math.round(v.n("resists")) }, (_, i) => k.label({ x: 134 + i * 12, y: 80, text: "✋", size: 10 })).join("");
    out += chip(k, 240, 30, `shown: ${v("shownBy")}`, "#33323d", "middle");
    if (sticks === 0) out += k.label({ x: 240, y: 104, text: "↩ snaps back", size: 8, color: S.red });
    out += strip(k, [g.steps("direction", "Better or worse", S.green), g.steps("sticks", "Sticks"), g.when("changeAt", "Change shows"), g.num("scenesTogether", "Scenes together", "")]);
    return out + fitCap(k, `The mix: ${v("setting")} · ${v("learns")} learns`);
  });
  pad("mixArc", "changeAt", "resists", "When the change shows", "How hard they fight it");

  /* A line said once, then echoed later: two speech bubbles far apart on a film bar. */
  const ECHO = { "a line": "“Nice hat.”", "an image": "🖼️", "a sound": "🔔", "a gesture": "👍", "a prop": "🎩" };
  look("callback", (v, k, g) => {
    const dist = v.p("distance");
    const form = idx(v, "form");
    const mood = idx(v, "mood");
    const times = Math.round(v.n("times"));
    const memo = v.p("memorable");
    let out = stage(k);
    const ex = ECHO[v("echoes")] || "…";
    const x0 = 46;
    const x1 = 136 + dist * 150;
    out += guy(k, x0, { s: 0.65, color: S.orange, mood: 0.5 }) + `<rect x="${x0 - 30}" y="4" width="70" height="26" rx="10" fill="#fff" stroke="${S.ink}" stroke-width="${r1(1 + memo * 3)}"/>` + k.text({ x: x0 + 5, y: 21, text: ex, size: 10, color: S.ink });
    const spk = form === 1 ? S.blue : S.orange;
    const moodFace = [0.5, 0.95, -0.7, 0.4][mood];
    out += guy(k, x1, { s: 0.65, color: spk, mood: moodFace });
    const txt = form === 3 ? "…?" : ex;
    out += `<rect x="${r1(x1 - 40)}" y="4" width="70" height="26" rx="10" fill="${["#fff", "#fff3b0", "#cfe0ff", "#ffd7e6"][mood]}" stroke="${S.ink}" stroke-width="2"/>` + k.text({ x: x1 - 5, y: 21, text: txt, size: 10, color: S.ink, italic: form === 2 });
    if (form === 2) out += k.label({ x: x1 - 5, y: 40, text: "new meaning", size: 8, color: S.gold });
    for (let i = 1; i < times; i++) out += k.text({ x: x1 - 18 - i * 11, y: 100, text: "↻", size: 11, color: S.gold });
    out += `<path d="M${x0 + 20} 50 Q${r1((x0 + x1) / 2)} ${r1(60 + dist * 20)} ${r1(x1 - 20)} 50" fill="none" stroke="${S.gold}" stroke-dasharray="4 3"/>` + k.label({ x: (x0 + x1) / 2, y: 74 + dist * 8, text: `${Math.round(v.n("distance"))} scenes back`, size: 8, color: "#ddd" });
    const lead = idx(v, "leadIn");
    if (lead) out += k.label({ x: x1 - 26, y: 50, text: lead === 2 ? "wait for it…" : "hint", size: 8, color: "#bbb" });
    out += strip(k, [g.steps("landsOn", "Lands on"), g.num("minutesBack", "Since original", " min"), g.num("callPause", "Pause before", " s"), g.steps("leadIn", "Lead-in"), g.num("times", "Times called back", "×"), g.steps("mood", "Mood shift")]);
    return out + fitCap(k, `Callback: ${v("form")} · ${v("echoes")}`);
  });
  pad("callback", "distance", "memorable", "How far back", "How memorable the original");

  /* What we're led to expect (a big thought) against the truth behind a curtain. */
  const EXPECT = { danger: "🔪", romance: "💋", "sad news": "😢", "a big moment": "🎆", "something ordinary": "☕" };
  look("misdirection", (v, k, g) => {
    const str = v.p("strength");
    const hid = v.p("hiddenShare");
    let out = stage(k);
    /* the arrow that leads us */
    out += k.arrow({ x1: 40, y1: 30, x2: 110, y2: 30, color: S.gold, w: 1 + str * 5 }) + k.text({ x: 70, y: 22, text: "look here", size: 9, color: S.gold });
    out += `<rect x="114" y="8" width="70" height="56" rx="8" fill="#2c2b36" stroke="#666"/>` + k.text({ x: 149, y: 46, text: EXPECT[v("expect")] || "?", size: 14 + str * 10 });
    /* the truth: half hidden behind a curtain */
    out += `<rect x="200" y="8" width="110" height="${FY - 8}" fill="#262530"/>` + k.text({ x: 255, y: 70, text: "🐈", size: 30 }) + `<rect x="200" y="8" width="${r1(110 * hid)}" height="${FY - 8}" fill="#7a2230" stroke="${S.ink}"/>` + k.label({ x: 255, y: 20, text: "the truth", size: 8, color: "#ddd" });
    /* fair clues: little dots on the stage that point to the truth */
    for (let i = 0; i < Math.round(v.n("clues")); i++) out += k.label({ x: 30 + i * 30, y: 96, text: "🔍", size: 10 });
    /* who's fooled with us */
    const fw = idx(v, "fooledWithUs");
    if (fw >= 1) out += guy(k, 160, { s: 0.45, color: S.blue, mood: -0.4 });
    if (fw === 2) out += guy(k, 180, { s: 0.45, color: S.orange, mood: -0.4 }) + guy(k, 140, { s: 0.45, color: S.green, mood: -0.4 });
    out += chip(k, 60, 66, v("fairness"), idx(v, "fairness") === 2 ? S.red : "#2f4a37", "middle");
    out += strip(k, [g.word("reveal", "Truth arrives"), g.steps("fooledFor", "Fooled for"), g.num("revealBeat", "Beat before reveal", " s"), g.num("revealTakes", "Reveal takes", " s"), g.num("hiddenShare", "Truth hidden", "%"), g.steps("fairness", "Fair or cheat", S.red)]);
    return out + fitCap(k, `Led to expect ${v("expect")} · strength ${Math.round(v.n("strength"))} of 5`);
  });
  pad("misdirection", "strength", "hiddenShare", "How strongly we are led", "How much is hidden");

  /* Irony: what's said (or hoped) against what happens, in a two-panel strip. */
  look("irony", (v, k, g) => {
    const kind = idx(v, "kind");
    const tone = idx(v, "tone");
    const bite = idx(v, "bite");
    const ob = v.p("obviousness");
    let out = k.bg(S.bg);
    out += k.panel({ x: 8, y: 6, w: 146, h: 108 }) + k.panel({ x: 166, y: 6, w: 146, h: 108, fill: ["#f4f1ea", "#e6dccb", "#c9c2c8"][tone] });
    const L = ["“Lovely weather!”", "“This plan can't fail.”", "“The coast is clear.”"][kind];
    out += k.bubble({ x: 81, y: 28, text: L, w: 130, h: 26, size: 9, tail: -10 });
    out += guy(k, 70, { y: 108, s: 0.62, color: S.orange, mood: 0.8 });
    if (kind === 2) out += k.text({ x: 130, y: 100, text: "🐻", size: 16 + ob * 10 });
    /* panel two: the opposite */
    const R = ["🌧️", "💥", "🐻"][kind];
    out += k.text({ x: 268, y: 60, text: R, size: Math.min(28, 20 + bite * 8 + ob * 6) });
    out += guy(k, 230, { y: 108, s: 0.62, color: S.orange, mood: [0.2, -0.5, -1][tone] - bite * 0.1, arms: -0.5 });
    const fo = idx(v, "findsOut");
    out += k.label({ x: 239, y: 22, text: ["never finds out", "finds out too late", "just in time!"][fo], size: 8, color: S.ink });
    const pt = idx(v, "pointedOut");
    if (pt === 1) out += k.label({ x: 290, y: 80, text: "👀", size: 12 });
    if (pt === 2) out += k.frame({ x: 242, y: 30, w: 54, h: 38, color: S.red });
    if (pt === 3) out += k.label({ x: 290, y: 80, text: "♪!", size: 14, color: S.red, weight: 900 });
    out += k.label({ x: 160, y: 66, text: "→", size: 14, color: S.gold });
    out += strip(k, [g.num("delay", "Delay before it bites", " scenes"), g.steps("bite", "Bites", S.red), g.num("feltBeat", "Beat before felt", " s"), g.num("holdOnIt", "Hold on the image", " s"), g.num("obviousness", "How obvious", ""), g.steps("tone", "Funny or sad")]);
    return out + fitCap(k, `Irony: ${v("kind")}`);
  });
  pad("irony", "delay", "obviousness", "Delay before it bites", "How obvious");

  /* A fish (well, a person in the wrong colors) in a world of others. */
  const WORLD = { "a new job": "🏢", "a new class": "🎩", "a new country": "🗺️", "a new time": "⏳", "a new species": "👽" };
  look("fishOutOfWater", (v, k, g) => {
    const mm = v.p("mismatch");
    const vis = v.p("visibility");
    const from = v.n("fromOthers");
    let out = stage(k, { bg: "#1a2230" });
    out += k.text({ x: 296, y: 26, text: WORLD[v("world")] || "?", size: 18 });
    /* the locals: all alike */
    for (let i = 0; i < 6; i++) out += guy(k, 30 + i * 26, { s: 0.6, color: "#5a7a8a", mood: 0.1, look: 1 - vis * 0, eyes: 0.6 });
    /* everyone can tell: eyes turned */
    for (let i = 0; i < Math.round(v.n("visibility")); i++) out += k.label({ x: 30 + i * 26, y: 50, text: "👀", size: 9 });
    const x = 190 + (from / 10) * 100;
    const conf = idx(v, "confidence");
    out += guy(k, x, { s: 0.75, color: k.mix("#5a7a8a", "#e8913a", mm), mood: [-0.6, -0.3, 0.6, 0.9][conf], lean: [10, 5, -4, -10][conf], arms: conf >= 2 ? 0.8 : -0.4, look: -1 });
    if (mm > 0.6) out += k.text({ x: Math.min(x, 262), y: 30, text: "🐟", size: Math.min(18, 12 + mm * 8) });
    /* clashes */
    const ncl = Math.round(v.n("clashes"));
    for (let i = 0; i < ncl; i++) out += k.label({ x: x - (ncl - 1) * 4.5 + i * 9, y: 46, text: "!", size: 11, color: S.red, weight: 900 });
    const use = idx(v, "useful");
    if (use) out += k.label({ x: Math.min(x, 248), y: 10, text: use === 2 ? "⭐ saves the day" : "⭐ useful once", size: 8, color: S.gold });
    out += strip(k, [g.steps("adapts", "Learns to fit", S.green), g.steps("confidence", "Acts like"), g.when("fitAt", "Finally fits", S.green), g.num("fromOthers", "Space from others", " m"), g.word("comparedTo", "Next to"), g.num("clashes", "Clashes", "/scene", S.red)]);
    return out + fitCap(k, `Out of place: ${Math.round(v.n("mismatch"))} of 5 · ${v("world")}`);
  });

  /* A pratfall moment: how bad, who saw, who laughs, and how they recover. */
  look("humiliation", (v, k, g) => {
    const size = v.p("size");
    const fs = v.n("frameSize") / 100;
    let out = stage(k, { spot: 110 });
    const rec = idx(v, "recovery");
    const s = k.clamp(0.4 + fs * 0.45, 0.4, 1.3);
    out += `<g transform="rotate(${r1(size * 60)} 110 ${FY})">${guy(k, 110, { s, color: S.orange, mood: [-1, 0.2, 0.5, 0.9][rec] - size * 0.2, arms: rec === 3 ? 1 : -0.6 })}</g>`;
    if (size > 0) out += `<ellipse cx="110" cy="${FY - 2}" rx="${r1(10 + size * 30)}" ry="4" fill="#8b5a2b" opacity="0.8"/>` + k.label({ x: 110, y: 24, text: ["", "oops", "splat", "SPLAT!", "total wipeout", "ruined"][Math.round(v.n("size"))], size: 9 + size * 6, color: S.red, weight: 900 });
    /* earned: a banana peel they dropped themselves */
    const earned = idx(v, "earned");
    out += k.label({ x: 60, y: 104, text: ["", "🍌", "🍌🍌"][earned], size: 12 });
    /* witnesses and who laughs */
    const wit = [0, 1, 4, 9][idx(v, "witnesses")];
    const laughs = idx(v, "laughsAt");
    for (let i = 0; i < wit; i++) {
      const lx = 196 + (i % 5) * 24;
      const ly = 60 + Math.floor(i / 5) * 28;
      const laughing = laughs === 3 || (laughs === 2 && i === 0);
      out += k.face({ x: lx, y: ly, r: 9, mood: laughing ? 1 : -0.2, mouth: laughing ? 0.8 : 0, color: i === 0 && laughs === 2 ? "#e0a0a0" : "#c9c4bb" });
    }
    if (laughs === 1) out += k.label({ x: 250, y: 22, text: "only we laugh", size: 8, color: S.gold });
    if (laughs >= 2) out += ha(k, 250, 30, 0.4 + laughs * 0.2);
    out += k.label({ x: 8, y: 44, text: ["surprise!", "⚠ a moment ahead", "⚠⚠ long before"][idx(v, "seenComing")], size: 8, color: "#ddd", anchor: "start" });
    out += strip(k, [g.steps("recovery", "Recovers", S.green), g.num("dragsOn", "Lasts", " s", S.red), g.num("recoverSec", "To recover", " s"), g.num("frameSize", "Size in frame", "%"), g.steps("earned", "Earned it"), g.steps("seenComing", "Seen coming")]);
    return out + fitCap(k, `How bad: ${Math.round(v.n("size"))} of 5 · witnesses: ${v("witnesses")}`);
  });
  pad("humiliation", "dragsOn", "size", "How long it lasts", "How bad");

  /* Two egos nose to nose, voices growing each round, a friend squeezed in between. */
  const OVER = { "who's in charge": "👑", "who's right": "✔️", "who's loved": "❤️", "who's best": "🏆" };
  look("egoClash", (v, k, g) => {
    const size = v.p("size");
    const d = v.n("standOff");
    const gap = 44 + (d / 5) * 166;
    const ax = 160 - gap / 2;
    const bx = 160 + gap / 2;
    const tac = idx(v, "tactics");
    const win = idx(v, "winner");
    let out = stage(k);
    const s = 0.75 + size * 0.25;
    out += guy(k, ax, { s, color: S.blue, mood: win === 0 ? 0.8 : -0.5, lean: 6 + tac * 3, arms: tac / 3, look: 1 });
    out += guy(k, bx, { s, color: S.orange, mood: win === 3 ? 0.8 : -0.5, lean: -6 - tac * 3, arms: tac / 3, look: -1 });
    out += k.text({ x: 160, y: 22, text: OVER[v("over")] || "?", size: 12 + size * 10 * (1 - v.p("petty") * 0.6) });
    if (v.p("petty") > 0.6) out += k.label({ x: 160, y: 36, text: "(over a parking space)", size: 8, color: "#bbb" });
    /* rounds of one-upping: louder bubbles */
    const rounds = Math.round(v.n("rounds"));
    const loud = v.n("louderBy") / 100;
    for (let i = 0; i < Math.min(rounds, 8); i++) {
      const side = i % 2 ? 1 : -1;
      const fsz = Math.min(13, 7 * Math.pow(1 + loud, i));
      /* each one's comebacks stack in a column beside them (outside when they stand close) */
      const colX = side < 0 ? ax - 26 : bx + 26;
      out += k.text({ x: colX, y: 46 + Math.floor(i / 2) * 13, text: ["hm", "oh?", "ha!", "!!", "!!!"][Math.min(4, Math.floor(i / 2) + tac)], size: fsz, color: side < 0 ? "#9fc0ff" : "#ffc690", weight: 900 });
    }
    const caught = idx(v, "caught");
    if (caught === 1) out += guy(k, 160, { s: 0.45, color: S.green, mood: -0.7 });
    if (caught === 2) out += heads(k, 8, 120, 104, 80, { r: 3.5, color: S.green });
    if (win === 2) out += k.label({ x: 10, y: 16, text: "both lose", size: 9, color: S.red, anchor: "start" });
    if (win === 1) out += k.label({ x: 10, y: 16, text: "no winner", size: 9, color: "#bbb", anchor: "start" });
    out += strip(k, [g.steps("tactics", "How they fight", S.red), g.steps("petty", "How petty"), g.num("rounds", "Rounds", ""), g.num("comebackGap", "Comeback gap", " s"), g.num("standOff", "Distance", " m"), g.num("louderBy", "Louder each round", "%")]);
    return out + fitCap(k, `Clash over ${v("over")} · ${v("winner")} wins`.replace("neither wins", "no one wins").replace("both lose wins", "both lose"));
  });

  /* People sorting into colored sides that switch. */
  look("alliances", (v, k, g) => {
    const sides = Math.max(1, Math.round(v.n("sides")));
    const n = Math.round(v.n("groupSize"));
    const gapM = v.n("sideGap");
    const cols = [S.blue, S.orange, S.green, S.purple];
    let out = stage(k);
    const zone = 300 / sides;
    const pad_ = (gapM / 10) * (zone * 0.4);
    const left = idx(v, "leftAlone");
    /* each side gets its own patch of floor, so the groups read at a glance */
    for (let sd = 0; sd < sides; sd++) out += `<rect x="${r1(10 + sd * zone + pad_ / 2)}" y="68" width="${r1(Math.max(12, zone - pad_))}" height="34" rx="10" fill="${cols[sd]}" opacity="0.18"/>` + k.label({ x: 10 + sd * zone + zone / 2, y: 112, text: sides > 1 ? `side ${"ABCD"[sd]}` : "one side", size: 8, color: "#aaa" });
    for (let i = 0; i < Math.min(n, 20); i++) {
      const sd = i % sides;
      const j = Math.floor(i / sides);
      const per = Math.ceil(Math.min(n, 20) / sides);
      const x = 10 + sd * zone + pad_ / 2 + ((j + 0.5) * (zone - pad_)) / Math.max(1, per);
      const alone = left === 2 && i === 0;
      out += k.face({ x: alone ? 300 : x, y: alone ? 30 : 84, r: Math.min(10, 120 / Math.max(6, n)), color: alone ? "#999" : cols[sd], mood: alone ? -0.6 : 0.3 });
    }
    /* switching arrows */
    const sh = Math.round(v.n("shifts"));
    const how = idx(v, "switchHow");
    for (let i = 0; i < sh; i++) out += `<path d="M${40 + i * 50} 60 q20 ${-20 - i * 3} 40 0" fill="none" stroke="${how === 2 ? S.red : S.gold}" stroke-width="2" ${how === 0 ? 'stroke-dasharray="3 3"' : ""}/>` + k.label({ x: 80 + i * 50, y: 58, text: "›", size: 12, color: how === 2 ? S.red : S.gold });
    if (how === 2 && sh) out += k.label({ x: 160, y: 30, text: "🗡 betrayal", size: 9, color: S.red });
    const talk = idx(v, "sideTalk");
    out += k.label({ x: 10, y: 16, text: ["", "👀 glances", "🤫 whispers", "🗣 huddles"][talk], size: 9, color: "#ddd", anchor: "start" });
    if (left === 1) out += k.label({ x: 300, y: 16, text: "now and then alone", size: 8, color: "#bbb", anchor: "end" });
    out += strip(k, [g.num("sides", "Sides", ""), g.steps("switchHow", "Switch by"), g.when("lastSwitch", "Last switch"), g.num("groupSize", "People", ""), g.num("sideGap", "Space between", " m"), g.steps("leftAlone", "Left alone")]);
    return out + fitCap(k, `${sides} side${sides > 1 ? "s" : ""} · switch ${Math.round(v.n("shifts"))} of 5`);
  });
  pad("alliances", "sideGap", "shifts", "Space between the sides", "How often sides switch");

  /* The host at a nice dinner, and the guest who should not be there. */
  const TOHOST = { "an ex": "💔", "a boss": "💼", "a parent": "👵", "a rival": "⚔️", "a stranger": "❔" };
  look("unwantedGuest", (v, k, g) => {
    const wrong = v.p("wrong");
    const d = v.n("fromHost");
    let out = stage(k, { bg: "#1e1a24" });
    out += `<rect x="40" y="86" width="90" height="8" fill="#6b4f3a"/><rect x="48" y="94" width="4" height="18" fill="#6b4f3a"/><rect x="118" y="94" width="4" height="18" fill="#6b4f3a"/>` + k.text({ x: 85, y: 84, text: "🍷🍰", size: 12 });
    const hide = v.p("hostHides");
    out += guy(k, 70, { s: 0.8, color: S.blue, mood: -wrong * 0.9, arms: hide, lean: hide * 10, look: 1 });
    out += sweat(k, 80, 40, v.n("hostHides") * 0.7);
    const gx = 110 + (d / 20) * 190;
    const knows = idx(v, "knows");
    const arr = v("arrives");
    out += guy(k, gx, { s: 0.8, color: S.red, mood: [0.8, 0.2, 0.6][knows], look: -1, lean: arr === "bursts in" ? -14 : arr === "sneaks in" ? 14 : 0, alpha: idx(v, "leaves") === 2 ? 0.55 : 1 });
    out += k.text({ x: gx, y: 18, text: TOHOST[v("toHost")] || "", size: 14 });
    if (arr === "bursts in") out += motion(k, gx + 30, 60, 3, 20, -1);
    if (arr === "sneaks in") out += k.label({ x: gx, y: 104, text: "tiptoe", size: 8, color: "#bbb" });
    if (knows === 2) out += k.label({ x: Math.min(gx, 270), y: 34, text: "😏 knows, stays", size: 8, color: "#ddd" });
    /* damage: tipped glasses */
    const dmg = idx(v, "damage");
    for (let i = 0; i < dmg; i++) out += k.text({ x: 150 + i * 18, y: 104, text: "💥", size: 9 + i * 3 });
    out += strip(k, [g.steps("leaves", "Leaves"), g.num("stays", "In the scene", "%"), g.when("arrivesAt", "Shows up", S.red), g.num("fromHost", "From the host", " m"), g.word("toHost", "Who they are"), g.steps("damage", "Damage", S.red)]);
    return out + fitCap(k, `Wrong: ${Math.round(v.n("wrong"))} of 5 · ${v("toHost")}, ${v("arrives")}`);
  });
  pad("unwantedGuest", "arrivesAt", "stays", "When they show up", "Share of the scene they're in");

  /* A joke card: the kind, light to dark, mean to kind, stacked jokes. */
  const DEV = { understatement: "🤏", irony: "🙃", deadpan: "😐", "the straight one and the funny one": "🧍🤡", banter: "💬💬", misunderstanding: "❓", "status play": "👑", "fish out of water": "🐟", reversal: "🔄", callback: "↩️", "running gag": "🔁", "rule of three": "1·2·3", escalation: "📈", cringe: "😬", absurdity: "🦄", slapstick: "🍌" };
  look("comedyDevice", (v, k, g) => {
    const dark = v.p("darkness");
    const warm = v.p("warmth");
    const sur = v.p("surprise");
    let out = k.bg(k.mix("#2a2f45", "#07070a", dark)) + `<rect x="0" y="${FY}" width="320" height="10" fill="${S.floor}"/>`;
    const stacked = Math.round(v.n("stacked"));
    for (let i = stacked - 1; i >= 0; i--) out += `<rect x="${92 + i * 8}" y="${10 + i * 5}" width="130" height="80" rx="10" fill="${i ? "#3a3946" : S.paper}" stroke="${S.ink}" stroke-width="2"/>`;
    out += k.text({ x: 157, y: 52, text: DEV[v("setting")] || "?", size: 24 }) + k.label({ x: 157, y: 78, text: v("setting").replace("the straight one and the funny one", "straight & funny"), size: 10, color: S.ink, weight: 700 });
    /* surprise: a jack-in-the-box spring */
    out += `<path d="M260 ${FY} ${Array.from({ length: 4 }, (_, i) => `l${i % 2 ? -8 : 8} -${r1(4 + sur * 9)}`).join(" ")}" fill="none" stroke="#bbb" stroke-width="2"/>` + k.text({ x: 260, y: FY - 20 - sur * 40, text: sur > 0.5 ? "😲" : "🙂", size: 14 });
    /* mean or kind: a face on the left */
    out += k.face({ x: 46, y: 60, r: 22, mood: k.lerp(-0.9, 1, warm), brows: k.lerp(-1, 0.6, warm), color: k.mix("#e2a090", "#f0c8a0", warm) });
    out += k.label({ x: 46, y: 98, text: v("warmth"), size: 9, color: "#ddd" });
    out += strip(k, [g.steps("darkness", "Light to dark", S.purple), g.steps("variety", "Kinds in scene"), g.steps("storyRoom", "Joke or story"), g.num("jokeLength", "Length", " s"), g.num("stacked", "Jokes stacked", "")]);
    return out + fitCap(k, `${v("setting")} · ${v("darkness")} · surprise ${Math.round(v.n("surprise"))} of 5`);
  });
  pad("comedyDevice", "stacked", "surprise", "Jokes stacked", "How surprising");

  /* An ordinary room where something impossible sits; how the people take it. */
  look("absurdity", (v, k, g) => {
    const a = v.p("setting");
    const share = v.p("frameShare");
    const acc = idx(v, "acceptance");
    let out = stage(k, { bg: "#1f2328" });
    out += k.window_({ x: 24, y: 16, w: 46, h: 36, light: 0.5 });
    /* the absurd thing, size by frame share */
    const sz = 14 + share * 62 * (0.4 + a * 0.6);
    const thing = ["🪑", "🐟", "🦒", "🐙", "🐋", "🪐"][Math.round(v.n("setting"))];
    const care = v.p("detail");
    out += k.text({ x: 210, y: FY - 12, text: thing, size: sz });
    if (care > 0) out += k.ring({ x: 210, y: FY - 12 - sz * 0.35, r: sz * 0.6, color: S.gold, w: 0.5 + care * 1.5, dash: care > 0.6 ? "" : "3 3" });
    out += guy(k, 80, { s: 0.75, color: S.blue, mood: acc === 0 ? -0.8 : acc === 1 ? -0.2 : 0.3, eyes: acc === 0 ? 1 : 0.6, arms: acc === 0 ? 1 : 0, look: 1 });
    out += guy(k, 122, { s: 0.75, color: S.green, mood: acc === 2 ? 0.3 : -0.8, eyes: acc === 2 ? 0.5 : 1, arms: acc === 2 ? 0 : 0.9, look: 1 });
    out += k.label({ x: 100, y: 14, text: ["😱 everyone is shocked", "🤨 some notice", "😐 nobody blinks"][acc], size: 9, color: "#ddd" });
    /* its own logic: a rule card */
    const lg = idx(v, "ownLogic");
    if (lg) out += chip(k, 270, 18, lg === 2 ? "strict rules" : "loose rules", "#2f3a4a", "middle");
    /* real feeling: a heart */
    if (v.n("realFeeling") > 0) out += k.text({ x: 101, y: 70, text: "♥", size: Math.min(18, 6 + v.n("realFeeling") * 3), color: S.pink });
    out += strip(k, [g.steps("arrives", "Arrives"), g.steps("spills", "Spills over"), g.num("normalFirst", "Normal first", " s"), g.num("frameShare", "Frame that's absurd", "%"), g.num("detail", "Played with care", ""), g.steps("ownLogic", "Own logic")]);
    return out + fitCap(k, `Absurdity ${Math.round(v.n("setting"))} of 5 · ${v("acceptance")}`);
  });

  /* A blunder with a hush: witnesses' faces, the camera holding, the silence growing. */
  const FRONT = { "a date": "🌹", "the boss": "💼", family: "🏠", strangers: "🚶", "a crowd": "🎤" };
  look("cringe", (v, k, g) => {
    const c = v.p("setting");
    const fs = v.n("faceSize") / 100;
    const aware = idx(v, "selfAware");
    let out = stage(k, { bg: k.mix("#1d1d26", "#2a1418", c) });
    const r = 12 + Math.min(fs, 2) * 14;
    out += k.face({ x: 80, y: 68, r, mood: [0.7, -0.2, -0.9][aware], brows: aware === 2 ? 1 : 0, eyes: aware === 0 ? 0.8 : 1, mouth: idx(v, "digsDeeper") === 2 ? 0.4 : 0, color: k.mix("#f0c8a0", "#f08a80", c) });
    out += sweat(k, 80 + r * 0.8, 68 - r, 1 + c * 3);
    /* blunders in a row */
    for (let i = 0; i < Math.round(v.n("blunders")); i++) out += k.label({ x: 20 + i * 12, y: 16, text: "💬", size: 10 });
    out += k.label({ x: 168, y: 34, text: v("digsDeeper") === "doubles down" ? "…and doubles down" : v("digsDeeper") === "tries to fix it" ? "…tries to fix it" : "", size: 8, color: "#ddd", anchor: "start" });
    /* witnesses */
    const w = Math.round(v.n("witnesses"));
    for (let i = 0; i < w; i++) out += k.face({ x: 170 + (i % 5) * 28, y: 54 + Math.floor(i / 5) * 30, r: 10, mood: -0.4 - c * 0.5, eyes: 1, brows: 0.8, color: "#c9c4bb" });
    out += k.text({ x: 300, y: 22, text: FRONT[v("inFrontOf")] || "", size: 14 });
    /* the silence: a cricket and an empty bar */
    out += k.label({ x: 160, y: 108, text: v.n("silence") > 0 ? "🦗 " + "· ".repeat(Math.min(10, Math.round(v.n("silence")))) : "", size: 10, color: "#bbb" });
    /* camera holds: frame corners around the face */
    const hold = v.p("hold");
    if (hold > 0) out += k.frame({ x: 80 - r - 8, y: 68 - r - 8, w: 2 * r + 16, h: 2 * r + 16, color: S.red, dash: `${r1(4 + hold * 20)} 4` });
    const rescue = idx(v, "rescue");
    if (rescue) out += guy(k, 300, { s: 0.5, color: S.green, mood: 0.6, arms: 0.8, alpha: rescue === 1 ? 0.5 : 1 });
    out += strip(k, [g.num("silence", "Silence after", " s"), g.num("hold", "Camera stays", ""), g.steps("rescue", "Saved", S.green), g.num("witnesses", "Who sees it", " people"), g.num("faceSize", "Face size", "%"), g.steps("digsDeeper", "Digs deeper", S.red)]);
    return out + fitCap(k, `Cringe ${Math.round(v.n("setting"))} of 5 · in front of ${v("inFrontOf")}`);
  });
  pad("cringe", "silence", "setting", "Silence after the blunder", "How cringe");

  /* A frame with the joke holder lit up: who carries it, where across, how big. */
  look("jokeCarrier", (v, k, g) => {
    const who = idx(v, "setting");
    const fs = v.n("frameSize") / 100;
    const ax = 20 + v.p("across") * 280;
    const lookTo = v("lookTo");
    let out = stage(k);
    /* the others in the room */
    const lay = [
      { x: 60, c: S.blue, s: 0.75, id: 2 },
      { x: 250, c: S.orange, s: 0.75, id: 3 },
      { x: 160, c: "#666", s: 0.45, id: 1 },
    ];
    lay.forEach((p) => {
      const carry = who === p.id || (who === 4 && p.id >= 2) || who === 5;
      const xx = carry && who !== 4 && who !== 5 ? ax : p.x;
      const ss = carry && who !== 4 && who !== 5 ? k.clamp(0.4 + fs * 0.35, 0.3, 1) : p.s;
      out += guy(k, xx, { s: ss, color: p.c, mood: carry ? 0.9 : 0, arms: carry ? 0.7 : 0, alpha: carry || who === 0 ? 1 : 0.55 });
      if (carry) out += ha(k, xx, Math.min(46, FY - ss * 76 - 4), 0.3 + v.p("lineShare") * 0.6);
    });
    /* passing: arrows */
    const ps = idx(v, "passing");
    if (ps) out += k.arrow({ x1: 80, y1: 62, x2: 230, y2: 62, color: S.gold, w: 1.5 }) + (ps === 2 ? k.arrow({ x1: 230, y1: 70, x2: 80, y2: 70, color: S.gold, w: 1.5 }) : "");
    /* knows it's funny: a wink */
    const aw = idx(v, "aware");
    out += k.label({ x: 10, y: 16, text: ["🙂 has no idea", "😏 half knows", "😉 knows"][aw], size: 9, color: "#ddd", anchor: "start" });
    /* generous: gifts */
    out += k.label({ x: 310, y: 16, text: "🎁".repeat(Math.round(v.n("generous"))), size: 9, anchor: "end" });
    out += k.label({ x: 160, y: 118, text: `camera: ${v("favors")} · look to: ${lookTo}`, size: 8, color: "#bbb" });
    out += strip(k, [g.num("across", "Across the frame", "%"), g.num("frameSize", "Size in frame", "%"), g.num("lineShare", "Funny lines", "%"), g.steps("passing", "Passes"), g.num("generous", "Feeds others", "")]);
    return out + fitCap(k, `Carried by ${v("setting")}`);
  });
  pad("jokeCarrier", "across", "frameSize", "Across the frame", "How big in frame");

  /* A big face reacting: a look, a slow burn (going red), a double take, a spit take. */
  const REACTS = { "the joke-teller": "🤡", "the target": "🎯", "the thing that happened": "💥", "the audience": "🎥" };
  look("comicReaction", (v, k, g) => {
    const t = idx(v, "setting");
    const fs = v.n("faceSize") / 100;
    const whose = v("whose");
    const tc = idx(v, "toCamera");
    let out = stage(k);
    const r = 14 + Math.min(fs, 2) * 17;
    const fx = 120;
    const fy = 60;
    const faceColor = t === 2 ? k.mix("#f0c8a0", "#e05050", 0.3 + v.p("buildTime") * 0.7) : "#f0c8a0";
    if (whose === "an animal") out += k.text({ x: fx, y: fy + r * 0.5, text: "🐶", size: r * 1.5 });
    else if (whose === "the whole room") for (let i = 0; i < 4; i++) out += k.face({ x: fx - 45 + i * 30, y: fy, r: r * 0.55, mood: t === 0 ? 0 : -0.3, eyes: 1, mouth: t === 4 ? 0.8 : 0, look: tc ? 0 : 1 });
    else out += k.face({ x: fx, y: fy, r, mood: [0, -0.1, -0.6, -0.2, -0.5][t], brows: [0, 0.6, -1, 1, 1][t], eyes: [0.7, 1, 0.7, 1, 1][t], mouth: t === 4 ? 0.9 : t === 3 ? 0.4 : 0, look: tc ? 0 : 1, color: whose === "a bystander" ? "#c9c4bb" : faceColor });
    if (t === 3) out += motion(k, fx - r - 4, fy - 10, 3, 16) + k.label({ x: fx + r + 12, y: fy - r, text: "?!", size: 14, color: S.gold, weight: 900 });
    if (t === 4) for (let i = 0; i < 7; i++) out += k.dot({ x: fx + r + 6 + i * 6, y: fy + r * 0.45 + (k.rnd(i) - 0.5) * 12, r: 2.5, color: "#9fd3ff" });
    if (t === 2) out += k.label({ x: fx, y: fy - r - 6, text: "♨", size: 14, color: S.red });
    if (tc === 2) out += k.label({ x: fx, y: 112, text: "looks right at us", size: 8, color: S.gold });
    /* count: more reaction shots */
    for (let i = 0; i < Math.round(v.n("count")); i++) out += `<rect x="${226 + (i % 3) * 30}" y="${18 + Math.floor(i / 3) * 24}" width="26" height="20" rx="2" fill="#2e2d36" stroke="#666"/>` + k.face({ x: 239 + (i % 3) * 30, y: 28 + Math.floor(i / 3) * 24, r: 6, mood: -0.2, eyes: 1 });
    out += k.text({ x: 270, y: 96, text: REACTS[v("reactsTo")] || "", size: 16 }) + k.label({ x: 312, y: 110, text: `to ${v("reactsTo")}`, size: 8, color: "#bbb", anchor: "end" });
    out += strip(k, [g.num("delay", "Delay before", " s"), g.num("hold", "On the face", " s"), g.num("buildTime", "Builds over", " s"), g.num("faceSize", "Face size", "%"), g.steps("toCamera", "Looks at camera"), g.num("count", "Reactions", "")]);
    return out + fitCap(k, `Reaction: ${v("setting")} · ${whose}`);
  });

  /* The same gag returning along the film: each return a little different, with a final version. */
  look("runningGag", (v, k, g) => {
    const n = Math.round(v.n("count"));
    const a = v.n("firstAt") / 100;
    const b = Math.max(a + 0.05, v.n("lastAt") / 100);
    const ret = idx(v, "returns");
    const varp = v.p("variation");
    const fin = idx(v, "finale");
    let out = stage(k) + film(k, 14, 90, 292, {});
    const xs = [];
    for (let i = 0; i < n; i++) {
      let t = n > 1 ? i / (n - 1) : 0;
      if (ret === 0) t = t * t;
      if (ret === 2) t = Math.sqrt(t);
      xs.push(14 + 292 * (a + (b - a) * t));
    }
    const len = v.p("eachLength");
    const tight = xs.some((x, i) => i > 0 && x - xs[i - 1] < 15); /* crowded: stack them in three rows */
    xs.forEach((x, i) => {
      const last = i === n - 1 && fin;
      const dy = tight ? -(i % 3) * 17 : 0;
      const s = last && fin === 1 ? 1.6 : 1;
      const rot = (k.rnd(i + 1) - 0.5) * 60 * varp;
      out += `<rect x="${r1(x - 1)}" y="91" width="${r1(2 + len * 10)}" height="8" fill="${S.gold}"/>`;
      out += `<g transform="rotate(${r1(last && fin === 2 ? 180 : rot)} ${r1(x)} ${60 + dy})">${k.text({ x, y: 68 + dy, text: last && fin === 3 ? "🎉" : "🦆", size: (tight ? 13 : 16) * s })}</g>`;
    });
    const noticed = idx(v, "noticed");
    out += k.label({ x: 10, y: 16, text: ["", "🙄 one notices", "😩 everyone groans"][noticed], size: 9, color: "#ddd", anchor: "start" });
    out += k.label({ x: 310, y: 16, text: ["", "bigger finale", "reversed finale", "finally pays off"][fin], size: 9, color: S.gold, anchor: "end" });
    out += strip(k, [g.num("spacing", "Space between", " scenes"), g.num("minutesApart", "Minutes apart", " min"), g.steps("returns", "Gaps"), g.when("firstAt", "First time"), g.when("lastAt", "Last time"), g.num("eachLength", "Each time", " s")]);
    return out + fitCap(k, `Running gag × ${n} · change each time ${Math.round(v.n("variation"))} of 5`);
  });

  /* Three items and a break: two (or more) matching cards, then the odd one. */
  const BREAKS = { "the words": "💬", "the picture": "🖼️", "the sound": "🔊", "the action": "🤸" };
  look("ruleOfThree", (v, k, g) => {
    const n = Math.round(v.n("pattern"));
    const bs = v.p("breakSize");
    const sp = idx(v, "speed");
    const match = idx(v, "matched");
    const item = v.p("itemLength");
    const third = v.n("thirdLonger") / 100;
    let out = stage(k);
    const gapX = [16, 10, 4][sp];
    const baseW = 26 + item * 30;
    const ws = [];
    for (let i = 0; i < n; i++) ws.push(i === n - 1 ? baseW * (1 + third * 0.5) : baseW * (match === 2 ? 1 : 1 + (k.rnd(i + 2) - 0.5) * (match === 0 ? 0.6 : 0.25)));
    const pause = v.n("breakPause") * 16;
    const total = ws.reduce((s, w) => s + w, 0) + gapX * (n - 1) + pause;
    const sc = Math.min(1, 280 / total);
    let x = 20;
    ws.forEach((w, i) => {
      const brk = i === n - 1;
      const ww = w * sc;
      if (brk) x += pause * sc;
      out += `<g transform="rotate(${brk ? r1(bs * 14) : 0} ${r1(x + ww / 2)} 60)"><rect x="${r1(x)}" y="30" width="${r1(ww)}" height="56" rx="6" fill="${brk ? k.mix("#f4f1ea", "#ffb3a0", bs) : S.paper}" stroke="${S.ink}" stroke-width="2"/>${k.text({ x: x + ww / 2, y: 66, text: brk ? BREAKS[v("breaksIn")] || "!" : "🍎", size: brk ? 16 + bs * 10 : 18 })}</g>`;
      out += k.label({ x: x + ww / 2, y: 22, text: brk ? "the break!" : String(i + 1), size: 9, color: brk ? S.red : "#ddd", weight: 700 });
      x += ww + gapX * sc;
    });
    if (pause > 0) out += k.label({ x: x - ws[n - 1] * sc - pause * sc / 2 - gapX * sc, y: 100, text: "…", size: 14, color: "#bbb" });
    out += k.label({ x: 160, y: 108, text: `break by ${v("breakBy")} · hold ${fmt(v.n("holdAfterBreak"))} s after`, size: 8, color: "#bbb" });
    out += strip(k, [g.steps("speed", "Pace"), g.num("breakPause", "Pause before break", " s"), g.steps("matched", "Same rhythm"), g.num("itemLength", "Per item", " s"), g.num("thirdLonger", "Last one longer", "%"), g.num("holdAfterBreak", "Hold after", " s")]);
    return out + fitCap(k, `${n} items, then the break · break ${Math.round(v.n("breakSize"))} of 5`);
  });

  /* A tumble: the person falls from a height, a chain of dominoes, stars of pain. */
  look("physicalComedy", (v, k, g) => {
    const size = idx(v, "size");
    const h = v.n("fallHeight");
    const framing = idx(v, "framing");
    const zoom = [1.6, 1.15, 0.8][framing];
    let inner = "";
    let over = ""; /* words drawn at normal size on top of the zoomed shot, kept inside the frame */
    const Z = (x, y) => [160 + (x - 160) * zoom, 70 + (y - 70) * zoom];
    const ledge = FY - h * 16;
    if (h > 0) inner += `<rect x="40" y="${r1(ledge)}" width="50" height="${r1(FY - ledge)}" fill="#4a4250" stroke="${S.ink}"/>`;
    inner += `<path d="M90 ${r1(ledge - 40)} Q130 ${r1(ledge - 50)} 150 ${FY - 20}" fill="none" stroke="#eee" stroke-dasharray="4 4" opacity="0.6"/>`;
    const get = v("getsUp");
    const rot = [20, 50, 90, 120, 160][size];
    const down = get === "stays down" || get === "slowly";
    inner += `<g transform="rotate(${down ? rot : get === "bounces up" ? -10 : 0} 160 ${FY})">${guy(k, 160, { s: 0.8, color: S.orange, mood: get === "pretends it didn't happen" ? 0.6 : -0.6, arms: 1 })}</g>`;
    if (get === "bounces up") inner += motion(k, 150, 40, 3, 0) + k.label({ x: 180, y: 30, text: "boing!", size: 9, color: S.gold });
    if (get === "pretends it didn't happen") { const [lx, ly] = Z(186, 30); over += k.label({ x: Math.min(lx, 228), y: k.clamp(ly, 30, 110), text: "…totally meant that", size: 8, color: "#ddd", anchor: "start" }); }
    /* pain: stars */
    for (let i = 0; i < Math.round(v.n("pain")); i++) inner += k.text({ x: 150 + i * 10, y: 50 - (i % 2) * 6, text: "★", size: 10, color: S.gold });
    /* chain reaction: dominoes */
    const ch = Math.round(v.n("chain"));
    for (let i = 0; i < ch; i++) inner += `<rect x="${200 + i * 16}" y="${FY - 26}" width="6" height="26" fill="${S.paper}" stroke="${S.ink}" transform="rotate(${r1(20 + i * 8)} ${203 + i * 16} ${FY})"/>`;
    if (size === 4) { const [cx2, cy2] = Z(270, 60); over += burst(k, Math.min(cx2, 286), k.clamp(cy2, 36, 100), 24, S.red, "CRASH", 7); }
    /* build up: wobble lines before the fall */
    for (let i = 0; i < Math.round(v.n("buildUp")); i++) inner += `<path d="M${60 + i * 6} ${r1(ledge - 50)} q3 -4 6 0" fill="none" stroke="#bbb"/>`;
    let out = stage(k) + `<g transform="translate(160 70) scale(${zoom}) translate(-160 -70)">${inner}</g>` + over;
    const prec = idx(v, "precision");
    out += chip(k, 6, 16, ["〰 loose and messy", "· clean", "⚙ clockwork"][prec], "#26252d", "start");
    out += k.label({ x: 310, y: 16, text: ["close", "medium", "wide"][framing] + " shot", size: 9, color: "#ddd", anchor: "end" });
    out += strip(k, [g.num("pain", "Real hurt", "", S.red), g.num("fallHeight", "Fall height", " m"), g.num("warning", "Warning", " s"), g.num("downFor", "Down for", " s"), g.word("getsUp", "Gets up"), g.num("chain", "Chain reaction", "")]);
    return out + fitCap(k, `${v("size")} · ${v("framing")} shot · ${v("precision")}`);
  });
  pad("physicalComedy", "fallHeight", "downFor", "Height of the fall", "Seconds down");

  /* A cliche playing straight, then deflated: the familiar shape and the twist. */
  const CLICHE = { "the hero speech": ["🦸", "📣"], "the slow-motion walk": ["🚶", "💨"], "the kiss": ["💋", "🌅"], "the chase": ["🏃", "🚓"], "the big reveal": ["🎭", "😮"], "the jump scare": ["🚪", "👻"] };
  look("subversion", (v, k, g) => {
    const fam = v.p("familiarity");
    const br = idx(v, "break");
    const ear = v.p("earnest");
    const cl = CLICHE[v("cliche")] || ["?", "?"];
    let out = k.bg(S.bg);
    out += k.panel({ x: 8, y: 6, w: 146, h: 108, fill: k.mix("#4a4852", "#f4f1ea", 0.4 + fam * 0.6) }) + k.panel({ x: 166, y: 6, w: 146, h: 108 });
    out += k.text({ x: 81, y: 72, text: cl[0] + cl[1], size: 26 + ear * 8 });
    out += k.label({ x: 81, y: 22, text: fam > 0.5 ? "we've seen this before" : "something new?", size: 9, color: S.ink });
    out += k.label({ x: 81, y: 106, text: `${fmt(v.n("clichePlays"))} s played ${ear > 0.5 ? "dead straight" : "lightly"}`, size: 8, color: S.ink });
    const twist = [cl[0] + "🤧", cl[0] + "🫥", "🙃" + cl[1].split("").reverse().join("")][br];
    out += `<g transform="rotate(${br === 2 ? 180 : 0} 239 60)">${k.text({ x: 239, y: 72, text: br === 2 ? cl[1] + cl[0] : twist, size: br === 1 ? 18 : 26 })}</g>`;
    out += k.label({ x: 239, y: 22, text: ["a small twist", "…deflated", "inside out!"][br], size: 9, color: S.red, weight: 700 });
    const after = idx(v, "after");
    out += k.label({ x: 239, y: 106, text: ["moves on", "lingers…", "“Well, that happened.”"][after], size: 8, color: S.ink });
    /* knows it's a movie: a film frame peeking in */
    const sa = Math.round(v.n("selfAware"));
    for (let i = 0; i < sa; i++) out += `<rect x="${170 + i * 10}" y="88" width="8" height="10" fill="none" stroke="${S.ink}"/>`;
    out += k.label({ x: 160, y: 64, text: "→", size: 16, color: S.gold });
    out += strip(k, [g.word("cliche", "Cliche"), g.num("clichePlays", "Cliche plays", " s"), g.num("breakBeat", "Beat before break", " s"), g.num("afterHold", "Hold after", " s"), g.num("selfAware", "Knows it's a movie", ""), g.num("earnest", "Played straight", "")]);
    return out + fitCap(k, `Subverting ${v("cliche")} · ${v("break")}`);
  });
  pad("subversion", "earnest", "familiarity", "Played straight first", "How familiar the setup");

  /* The edit as a film strip of shots: lengths, smash cuts (red slashes), cutaways, jump cuts. */
  look("comicEdit", (v, k, g) => {
    const tempo = idx(v, "tempo");
    const shape = idx(v, "tempoShape");
    const avg = v.n("shotLength");
    const count = Math.max(4, Math.min(22, Math.round(40 / (avg + 0.6))));
    const L = [];
    for (let i = 0; i < count; i++) {
      const t = i / (count - 1);
      let f = 1;
      if (shape === 0) f = 0.5 + t * 1.2;
      if (shape === 2) f = 1.6 - t * 1.2;
      if (shape === 3) f = t > 0.85 ? 4 : 1.6 - t * 1.4;
      L.push(f * (1 + (k.rnd(i + tempo) - 0.5) * 0.3));
    }
    let out = k.bg(S.bg) + k.label({ x: 10, y: 18, text: "the scene, shot by shot →", size: 9, color: "#bbb", anchor: "start" });
    out += k.strip({ x: 10, y: 28, w: 300, h: 34, lengths: L, color: ["#6c8fb8", "#8fb2d8"], gap: [3, 2, 1.5, 1][tempo] });
    const tot = L.reduce((a, b) => a + b, 0);
    const xAt = (i) => 10 + (300 * L.slice(0, i).reduce((a, b) => a + b, 0)) / tot;
    const mark = (n, y, draw) => {
      for (let i = 0; i < n; i++) out += draw(xAt(Math.floor(((i + 1) * count) / (n + 1))), y);
    };
    mark(Math.round(v.n("smashCut")), 28, (x, y) => `<path d="M${r1(x - 4)} ${y - 4} L${r1(x + 4)} ${y + 38}" stroke="${S.red}" stroke-width="3"/>`);
    mark(Math.round(v.n("cutaway")), 70, (x, y) => k.text({ x, y: y + 10, text: "↗🦄", size: 10 }));
    mark(Math.round(v.n("contradict")), 86, (x, y) => k.text({ x, y: y + 10, text: "✗", size: 11, color: S.red, weight: 900 }));
    mark(Math.round(v.n("jumpCuts")), 64, (x, y) => `<path d="M${r1(x - 3)} ${y} l3 4 l3 -4" stroke="${S.gold}" fill="none" stroke-width="2"/>`);
    const hp = v.n("holdPast");
    if (hp > 0) out += `<rect x="${r1(310 - hp * 14)}" y="26" width="${r1(hp * 14)}" height="38" fill="${S.gold}" opacity="0.25"/>` + k.label({ x: 310, y: 20, text: "awkward hold", size: 8, color: S.gold, anchor: "end" });
    out += k.label({ x: 10, y: 112, text: "▬ smash cut   ↗ cutaway   ✗ cut that proves them wrong   ˅ jump cut", size: 7.5, color: "#999", anchor: "start" });
    out += strip(k, [g.steps("tempo", "Tempo"), g.word("tempoShape", "Across the scene"), g.num("shotLength", "Average shot", " s"), g.num("smashGap", "Line to smash", " s"), g.num("holdPast", "Hold past comfort", " s"), g.num("smashCut", "Smash cuts", "", S.red)]);
    return out + fitCap(k, `${v("tempo")} cutting · ${count} shots`);
  });
  pad("comicEdit", "shotLength", "smashCut", "Average shot length", "Smash cuts");

  /* A character turns from the scene to look at us (the lens in the corner). */
  const ATT = { confiding: "🤫", smug: "😏", pleading: "🥺", annoyed: "😒" };
  look("fourthWall", (v, k, g) => {
    const br = idx(v, "break");
    const fs = v.n("faceSize") / 100;
    const off = v.n("offLens");
    const wp = idx(v, "worldPauses");
    let out = stage(k, { bg: wp === 2 ? "#26262e" : S.bg });
    /* the lens: us */
    out += k.ring({ x: 160, y: 104, r: 12, color: "#9fd3ff", w: 3 }) + k.dot({ x: 160, y: 104, r: 5, color: "#2a4a6a" }) + k.label({ x: 182, y: 108, text: "us", size: 8, color: "#9fd3ff", anchor: "start" });
    const r = 14 + Math.min(fs, 2) * 15;
    const lookTo = br === 0 ? 1 : k.clamp(off / 45, 0, 1);
    out += k.face({ x: 118, y: 54, r, mood: br >= 2 ? 0.5 : 0.2, look: lookTo, eyes: 1 });
    out += k.text({ x: 118 + r + 10, y: 40, text: br ? ATT[v("attitude")] : "", size: 14 });
    if (br) out += `<line x1="118" y1="54" x2="${r1(160 + off * 1.5)}" y2="96" stroke="${S.gold}" stroke-dasharray="3 3" stroke-width="${r1(1 + v.p("lookLength") * 3)}"/>`;
    if (br === 3) out += k.bubble({ x: 240, y: 50, text: "You see what I deal with?", w: 136, h: 26, size: 8, tail: -40 });
    if (br === 2) out += k.label({ x: 230, y: 32, text: "(psst…)", size: 10, color: "#ddd" });
    /* the others: keep going, slow, freeze */
    const oth = idx(v, "others");
    out += guy(k, 270, { s: 0.6, color: S.blue, mood: 0, look: oth ? 0 : -1, eyes: oth ? 1 : 0.7, alpha: wp === 2 ? 0.5 : 1 }) + (wp === 0 ? motion(k, 296, 70, 2, 10) : wp === 1 ? k.label({ x: 270, y: 30, text: "slow-mo", size: 8, color: "#bbb" }) : k.label({ x: 270, y: 30, text: "❄ frozen", size: 8, color: "#9fd3ff" }));
    if (oth) out += k.label({ x: 270, y: 18, text: oth === 2 ? "everyone notices" : "one notices", size: 8, color: S.gold });
    out += k.label({ x: 10, y: 16, text: `${Math.round(v.n("howOften"))}× a scene`, size: 9, color: "#ddd", anchor: "start" });
    out += strip(k, [g.word("attitude", "Attitude"), g.num("lookLength", "Look lasts", " s"), g.num("offLens", "Eyes off the lens", "°"), g.num("faceSize", "Face size", "%"), g.num("asideLength", "Aside lasts", " s"), g.num("howOften", "Times per scene", "")]);
    return out + fitCap(k, `Breaking the fourth wall: ${v("break")}`);
  });

  /* A double act: two people trading lines; a ping-pong of bubbles in the middle. */
  const BOND = { strangers: "❔", coworkers: "💼", friends: "🤝", rivals: "⚔️", "a couple": "💞", family: "🏠" };
  look("doubleAct", (v, k, g) => {
    const d = v.n("apart");
    const gap = 96 + (d / 5) * 150;
    const st = v("staging");
    const ax = 160 - gap / 2;
    const bx = 160 + gap / 2;
    const lead = idx(v, "lead");
    let out = stage(k);
    const facing = st === "face to face";
    const behind = st === "one behind";
    out += guy(k, ax, { s: lead === 0 ? 0.9 : 0.8, color: S.blue, mood: 0.2, look: facing ? 1 : 0.3 });
    out += guy(k, behind ? ax + 26 : bx, { y: behind ? FY - 6 : FY, s: lead === 1 ? 0.9 : 0.8, color: S.orange, mood: 0.7, look: facing ? -1 : -0.3, alpha: behind ? 0.85 : 1 });
    out += k.text({ x: 160, y: 18, text: BOND[v("bond")] || "", size: 14 });
    if (lead === 2) out += k.label({ x: 160, y: 30, text: "lead swaps ⇄", size: 8, color: "#bbb" });
    /* volley: bubbles going back and forth */
    const vol = Math.round(v.n("volley")) + 1;
    const ov = idx(v, "overlap");
    for (let i = 0; i < vol; i++) {
      const side = i % 2 ? 1 : -1;
      out += `<rect x="${r1(160 + side * 22 - 14 + (ov === 2 ? -side * 10 : 0))}" y="${r1(38 + i * (ov === 0 ? 11 : ov === 1 ? 8 : 5))}" width="28" height="10" rx="5" fill="${side < 0 ? "#cfe0ff" : "#ffe0c0"}" stroke="${S.ink}"/>`;
    }
    const fin = idx(v, "finish");
    if (fin) out += k.label({ x: 160, y: 104, text: fin === 2 ? "…finish each other's lines" : "…sometimes finish lines", size: 8, color: S.gold });
    const bic = idx(v, "bicker");
    out += k.label({ x: 10, y: 16, text: ["⚡ bicker", "⚡🤝 both", "🤝 back each other"][bic], size: 9, color: "#ddd", anchor: "start" });
    out += strip(k, [g.word("staging", "Stand"), g.steps("overlap", "Talk over"), g.num("lineGap", "Gap between lines", " s"), g.num("apart", "Distance", " m"), g.num("twoShot", "In one shot", "%"), g.steps("finish", "Finish lines")]);
    return out + fitCap(k, `${v("bond")} · trade lines ${Math.round(v.n("volley"))} of 5 · ${v("lead")} leads`);
  });
  pad("doubleAct", "apart", "lineGap", "Distance between them", "Gap between lines");

  /* A row of matching people and one who doesn't fit. */
  const SPOT = { "what they say": "💬", "what they wear": "👒", "what they eat": "🌶️", "how they move": "🕺" };
  look("oddOneOut", (v, k, g) => {
    const gp = v.p("gap");
    const n = Math.min(14, Math.round(v.n("groupSize")));
    const iso = idx(v, "isolation");
    const grp = idx(v, "group");
    const from = v.n("fromGroup");
    let out = stage(k);
    const span = iso === 2 ? 170 : 230;
    for (let i = 0; i < n; i++) {
      const x = 16 + (i + 0.5) * (span / n);
      out += guy(k, x, { s: 0.55, color: "#5a7a8a", mood: grp === 1 ? 0.8 : grp === 2 ? 0.5 : 0, look: grp === 0 ? -1 : 1, lean: grp === 3 ? 6 : 0 });
    }
    if (v.n("groupSize") > 14) out += k.label({ x: 16, y: 18, text: `+${Math.round(v.n("groupSize")) - 14} more`, size: 8, color: "#bbb", anchor: "start" });
    const ox = Math.min(300, 16 + span + 12 + (from / 15) * 60 + (iso === 0 ? -span / 2 : 0));
    const tries = idx(v, "tries");
    out += guy(k, ox, { s: 0.7, color: k.mix("#5a7a8a", "#e8913a", 0.3 + gp * 0.7), mood: tries === 2 ? 0.9 : 0.2, arms: tries === 2 ? 1 : 0, lean: (tries - 1) * -8 });
    out += k.text({ x: ox, y: 20, text: SPOT[v("spotted")] || "", size: 12 + gp * 8 });
    if (iso === 2) out += k.frame({ x: ox - 30, y: 8, w: 60, h: 106, color: S.gold, dash: "4 3" });
    if (grp === 3) out += k.arrow({ x1: 220, y1: 40, x2: ox - 20, y2: 40, color: S.green, w: 1.5 });
    out += strip(k, [g.steps("tries", "Tries to fit"), g.steps("group", "Group"), g.steps("comesAround", "Comes around", S.green), g.when("turnsAt", "Tide turns"), g.num("fromGroup", "From the group", " m"), g.num("groupSize", "Group size", "")]);
    return out + fitCap(k, `Fits badly: ${Math.round(v.n("gap"))} of 5 · spotted by ${v("spotted")}`);
  });
  pad("oddOneOut", "fromGroup", "gap", "Distance from the group", "How badly they fit");

  /* Two people and the spark between them. */
  const SPARK = { comic: "⚡", romantic: "💗", rivalry: "🔥", family: "🏡" };
  look("chemistry", (v, k, g) => {
    const sp = v.p("spark");
    const m = v.n("meters");
    const gap = 30 + (m / 3) * 170;
    const ax = 160 - gap / 2;
    const bx = 160 + gap / 2;
    const lk = idx(v, "looks");
    const mir = idx(v, "mirror");
    let out = stage(k);
    const arms = mir === 2 ? 0.6 : 0.2;
    out += guy(k, ax, { s: 0.85, color: S.blue, mood: 0.3 + sp * 0.6, look: lk === 0 ? -1 : 1, arms, lean: mir ? 4 : 0 });
    out += guy(k, bx, { s: 0.85, color: S.orange, mood: 0.3 + sp * 0.6, look: lk === 0 ? 1 : -1, arms: mir === 0 ? -0.4 : arms, lean: mir ? -4 : 10 });
    /* sparks */
    const nsp = Math.round(v.n("spark") * 1.4);
    /* sparks in a loose row above them, never piled on top of each other */
    for (let i = 0; i < nsp; i++) out += k.text({ x: 150 + (i - (nsp - 1) / 2) * 16, y: 27 + (i % 2) * 8, text: SPARK[v("kind")] || "⚡", size: 9 + sp * 6 });
    if (lk >= 2) out += `<line x1="${ax + 6}" y1="40" x2="${bx - 6}" y2="40" stroke="${S.pink}" stroke-width="${r1(1 + v.p("lookHold") * 3)}" stroke-dasharray="${lk === 3 ? "" : "3 3"}"/>`;
    const cl = idx(v, "closeness");
    out += k.label({ x: 10, y: 16, text: ["far apart", "arm's length", "close", "touching"][cl], size: 9, color: "#ddd", anchor: "start" });
    const tm = idx(v, "timing");
    out += Array.from({ length: 6 }, (_, i) => `<rect x="${222 + i * 14}" y="${i % 2 ? 12 : 12 + (2 - tm) * 4 * (k.rnd(i) - 0.3)}" width="8" height="8" rx="2" fill="${i % 2 ? S.orange : S.blue}"/>`).join("") + k.label({ x: 260, y: 32, text: `timing: ${v("timing")}`, size: 8, color: "#bbb" });
    out += strip(k, [g.steps("closeness", "Closeness", S.pink), g.word("grows", "How it grows"), g.num("lookHold", "Looks last", " s"), g.num("meters", "Between them", " m"), g.num("answerGap", "Gap between lines", " s"), g.steps("mirror", "Mirroring")]);
    return out + fitCap(k, `${v("kind")} spark · ${Math.round(v.n("spark"))} of 5`);
  });

  /* The topic as a big sign; who gets punched; how many it touches. */
  const TOPIC = { manners: "🫖", rules: "📏", work: "💼", money: "💰", status: "👑", family: "👪", love: "❤️", age: "👴", "the body": "💪", food: "🍔", technology: "📱", fear: "😱", ego: "🪞", death: "💀" };
  look("comedyTopic", (v, k, g) => {
    const rel = v.p("relatable");
    const depth = idx(v, "depth");
    let out = stage(k);
    out += k.text({ x: 70, y: 70, text: TOPIC[v("setting")] || "?", size: 40 + depth * 6 }) + k.label({ x: 70, y: 98, text: v("setting"), size: 10, color: "#ddd", weight: 700 });
    if (depth >= 1) out += `<path d="M30 104 h80" stroke="${S.gold}" stroke-width="${depth * 2}"/>`;
    /* the punch */
    const pu = idx(v, "punch");
    const target = [["🙋", "the self"], ["🧍", "an equal"], ["🎩", "the powerful"], ["🧎", "the powerless"]][pu];
    out += k.text({ x: 190, y: 50, text: "👊", size: 22 }) + k.arrow({ x1: 206, y1: 44, x2: 236, y2: 44, color: pu === 3 ? S.red : S.gold }) + k.text({ x: 258, y: 54, text: target[0], size: 24 }) + k.label({ x: 258, y: 70, text: target[1], size: 8, color: pu === 3 ? S.red : "#ddd" });
    /* relatable: nodding heads */
    const tN = [1, 3, 7][idx(v, "touches")];
    out += heads(k, tN, 180, 84, 120, { r: 5, color: S.blue });
    out += k.label({ x: 180, y: 106, text: `touches ${v("touches")}`, size: 8, color: "#bbb", anchor: "start" });
    out += k.label({ x: 10, y: 16, text: rel > 0.6 ? "😂 “that's so me”" : rel > 0.2 ? "🙂 sort of relatable" : "🤔 not relatable", size: 9, color: "#ddd", anchor: "start" });
    out += k.label({ x: 310, y: 16, text: `${v("angle")} · back ${Math.round(v.n("returns"))}×`, size: 9, color: "#ddd", anchor: "end" });
    out += strip(k, [g.num("relatable", "Relatable", ""), g.steps("depth", "Depth"), g.word("angle", "Seen as"), g.num("returns", "Comes back", "×"), g.num("sceneShare", "Share of scene", "%")]);
    return out + fitCap(k, `About ${v("setting")} · punches ${v("punch")}`);
  });
  pad("comedyTopic", "relatable", "sceneShare", "How relatable", "Share of the scene");

  /* Comic timing as a beat track: setup, pause, punchline, laugh, and the next line maybe stepping on it. */
  look("comicTiming", (v, k, g) => {
    const pause = v.n("setting");
    const beat = v.n("beatLength");
    const hold = v.n("holdAfter");
    const setup = v.n("setupLength");
    const rush = idx(v, "rush");
    const pace = idx(v, "pace");
    let out = stage(k);
    /* the teller and the listener, and a track of time under them */
    const step = idx(v, "stepOn");
    out += guy(k, 40, { s: 0.6, color: S.orange, mood: 0.6, arms: 0.4, y: 66 }) + guy(k, 284, { s: 0.6, color: S.blue, mood: 0.9, y: 66 });
    const rf = rush === 0 ? 0.6 : rush === 2 ? 1.5 : 1;
    const pauseS = pause * beat * rf;
    const setW = 34 + (setup / 60) * 70;
    const pxs = Math.min(36, (300 - setW - 10) / Math.max(1, pauseS + 1 + hold));
    const ty = 76;
    out += `<rect x="10" y="${ty}" width="${r1(setW)}" height="18" rx="4" fill="${S.blue}"/>` + k.label({ x: 10 + setW / 2, y: ty + 13, text: "setup", size: 9, color: "#fff" });
    const px = 10 + setW;
    const pW = pauseS * pxs;
    if (pW > 0.5) out += `<rect x="${r1(px)}" y="${ty}" width="${r1(pW)}" height="18" fill="none" stroke="#bbb" stroke-dasharray="2 2"/>` + k.label({ x: px + pW / 2, y: ty - 4, text: `${fmt(pauseS)} s pause`, size: 8, color: "#ddd" });
    const pl = px + pW;
    const pw = Math.max(26, pxs);
    out += `<rect x="${r1(pl)}" y="${ty}" width="${r1(pw)}" height="18" rx="4" fill="${S.orange}"/>` + k.label({ x: pl + pw / 2, y: ty + 13, text: "punch", size: 8, color: "#fff" });
    const lx = pl + pw;
    const hw = Math.max(4, hold * pxs);
    out += `<rect x="${r1(lx)}" y="${ty}" width="${r1(hw)}" height="18" fill="${S.gold}" opacity="0.45"/>` + ha(k, Math.min(270, lx + 14), 54, 0.5, -10);
    if (step) out += `<rect x="${r1(lx + 2)}" y="${ty + 20}" width="44" height="11" rx="3" fill="${S.red}"/>` + k.label({ x: lx + 24, y: ty + 28, text: step === 2 ? "steps on it" : "sometimes", size: 7, color: "#fff" });
    out += k.bubble({ x: 100, y: 18, text: "…and then the duck said", w: 128, h: 20, size: 8, tail: -40 });
    /* the cut */
    const oc = idx(v, "onCut");
    const cx = oc === 0 ? pl + pw + 30 : oc === 1 ? pl : pl + pw;
    out += `<line x1="${r1(cx)}" y1="${ty - 14}" x2="${r1(cx)}" y2="${ty + 34}" stroke="#9fd3ff" stroke-width="2"/>` + k.label({ x: cx + 3, y: ty - 6, text: "✂ cut", size: 8, color: "#9fd3ff", anchor: "start" });
    /* pace: metronome ticks */
    const tick = 6 + pace * 4;
    const rb = idx(v, "rhythmBreak");
    for (let i = 0; i < tick; i++) out += `<line x1="${r1(186 + i * (80 / tick) + (rb === 2 ? (k.rnd(i) - 0.5) * 6 : 0))}" y1="4" x2="${r1(186 + i * (80 / tick))}" y2="${rb === 1 && i === 3 ? 4 : 12}" stroke="${rb === 1 && i === 3 ? S.red : "#888"}" stroke-width="2"/>`;
    out += k.label({ x: 270, y: 12, text: "beat", size: 7, color: "#888", anchor: "start" });
    out += k.label({ x: 268, y: 26, text: `${v("pace")} · ${v("rush")}`, size: 8, color: "#ddd", anchor: "end" });
    out += strip(k, [g.num("holdAfter", "Hold after laugh", " s"), g.steps("onCut", "Lands"), g.steps("stepOn", "Steps on laugh", S.red), g.steps("rhythmBreak", "Rhythm"), g.num("beatLength", "One beat", " s"), g.num("linesPerMin", "Lines", "/min")].concat([]).slice(0, 6));
    return out + fitCap(k, `Pause before the punchline: ${pause} beat${pause === 1 ? "" : "s"} · setup ${fmt(setup)} s`);
  });

  /* The same line delivered small to huge: face, voice, body. */
  look("comicRegister", (v, k, g) => {
    const reg = v.p("setting");
    const fm = v.p("faceMoves");
    const vo = idx(v, "voice");
    const body = idx(v, "body");
    const reach = v.n("gestureReach");
    let out = stage(k, { spot: 110 });
    out += guy(k, 110, { s: 0.95, color: S.orange, mood: fm * 0.9, arms: k.clamp(reach / 2, 0, 1) * (body ? 1 : 0.2), lean: body * 5, walk: body === 3 ? 1 : 0 });
    out += k.face({ x: 110, y: 26, r: 1, alpha: 0 });
    out += `<line x1="${r1(110 - 16 - reach * 30)}" y1="56" x2="${r1(110 + 16 + reach * 30)}" y2="56" stroke="${S.gold}" stroke-dasharray="2 3" opacity="0.6"/>`;
    const vw = ["hm.", "oh.", "oh!", "OH!", "OHHH!!"][Math.min(4, Math.round(reg * 2 + vo * 0.7))];
    out += k.text({ x: 230, y: 46, text: vw, size: Math.min(8 + vo * 7 + reg * 6, 140 / (vw.length * 0.72)), color: "#fff", weight: vo >= 2 ? 900 : 400 });
    out += k.speaker({ x: 196, y: 78, level: vo / 3 });
    /* the others: match or opposite */
    const ct = idx(v, "contrast");
    out += guy(k, 280, { s: 0.7, color: S.blue, mood: ct === 2 ? (reg > 0.5 ? 0 : 0.9) : reg * 0.8, arms: ct === 2 ? (reg > 0.5 ? 0 : 1) : reg });
    const cons = idx(v, "consistency");
    out += k.label({ x: 10, y: 16, text: ["breaks it often", "breaks now and then", "never breaks"][cons], size: 9, color: "#ddd", anchor: "start" });
    out += strip(k, [g.num("faceMoves", "Face moves", ""), g.steps("voice", "Voice"), g.steps("body", "Body"), g.num("gestureReach", "Gesture reach", " m"), g.steps("contrast", "Against others"), g.steps("consistency", "Holds it")]);
    return out + fitCap(k, `Register: ${v("setting")}`);
  });
  pad("comicRegister", "gestureReach", "faceMoves", "Gesture reach", "How much the face moves");

  /* A laugh track over one minute of a scene: bars where laughs land. */
  look("laughsPerMinute", (v, k, g) => {
    const n = Math.round(v.n("setting"));
    const sz = v.p("size");
    const shape = v("shape");
    const cl = idx(v, "clusters");
    const big = v.n("bigOneAt") / 100;
    const first = v.n("firstLaughAt") / 120;
    let out = k.bg(S.bg) + k.label({ x: 10, y: 116, text: "laughs across the scene →", size: 8, color: "#999", anchor: "start" });
    const y0 = 104;
    out += `<line x1="10" y1="${y0}" x2="310" y2="${y0}" stroke="#555"/>`;
    const pos = [];
    for (let i = 0; i < n; i++) {
      let t = n > 1 ? i / (n - 1) : 0.5;
      if (shape === "front loaded") t = Math.sqrt(t) * 0.9;
      if (shape === "builds to the end") t = t * t;
      if (cl) t = Math.floor(i / (cl + 1)) / Math.max(1, Math.ceil(n / (cl + 1))) + (i % (cl + 1)) * 0.03;
      pos.push(k.clamp(first * 0.3 + t * (1 - first * 0.3), 0, 1));
    }
    pos.forEach((t, i) => {
      const h = 14 + sz * 40 * (shape === "builds to the end" ? 0.5 + (i / Math.max(1, n)) * 0.5 : 1);
      out += `<rect x="${r1(10 + t * 290)}" y="${r1(y0 - h)}" width="8" height="${r1(h)}" rx="2" fill="${S.gold}"/>`;
    });
    /* the big one */
    const bx = 10 + big * 290;
    out += `<rect x="${r1(bx)}" y="${y0 - 76}" width="10" height="76" rx="2" fill="${S.red}"/>` + ha(k, k.clamp(bx + 4, 24, 290), 22, 0.6, -8, "BIG");
    const q = v.n("quietAfter");
    if (q > 0) out += `<rect x="${r1(bx + 12)}" y="${y0 - 6}" width="${r1(q * 6)}" height="6" fill="#7fb7ff" opacity="0.6"/>`;
    /* breathers */
    for (let i = 0; i < Math.round(v.n("breather")); i++) out += k.label({ x: 130 + i * 36, y: 117, text: "~ breathe", size: 7, color: "#7fb7ff", anchor: "start" });
    out += strip(k, [g.steps("size", "Size"), g.num("breather", "Breathers", ""), g.steps("clusters", "Clusters"), g.num("quietAfter", "Quiet after big", " s"), g.num("firstLaughAt", "First laugh after", " s"), g.num("longestGap", "Longest gap", " s")]);
    return out + fitCap(k, `${n} laughs a minute · ${v("shape")} · big laugh at ${Math.round(big * 100)}%`);
  });

  /* Laughs from the mix: a group in frame; gold "HA!" over whoever gets the laughs. */
  const SRCM = { looks: "👀", "clashing habits": "🧦", "what they say": "💬", "what they do": "🤸" };
  look("mixLaughs", (v, k, g) => {
    const lv = idx(v, "setting");
    const who = idx(v, "who");
    const bal = idx(v, "balance");
    const n = Math.round(v.n("inFrame"));
    let out = stage(k);
    const xs = [];
    const extra = Math.max(0, n - 2);
    out += guy(k, 110, { s: 0.85, color: S.blue, mood: 0.1 }) + guy(k, 200, { s: 0.85, color: S.orange, mood: 0.7, arms: 0.5 });
    for (let i = 0; i < Math.min(extra, 10); i++) {
      const x = i % 2 ? 230 + Math.floor(i / 2) * 18 : 80 - Math.floor(i / 2) * 18;
      xs.push(x);
      out += guy(k, x, { s: 0.5, color: "#666", mood: who === 3 ? 0.7 : 0 });
    }
    const p = [0, 0.3, 0.6, 1][lv];
    if (lv) {
      if (who === 0 || who === 2) out += ha(k, 110, 34, p * (bal === 0 && who === 2 ? 0.4 : 1));
      if (who === 1 || who === 2) out += ha(k, 200, 34, p);
      if (who === 3) {
        out += ha(k, 110, 34, p * 0.7) + ha(k, 200, 34, p * 0.7);
        xs.forEach((x, i) => (out += ha(k, x, 64, 0.05, i % 2 ? 8 : -8, "ha")));
      }
    }
    out += k.text({ x: 155, y: 70, text: SRCM[v("source")] || "", size: 16 });
    const b = idx(v, "builds");
    out += k.graph({ x: 250, y: 10, w: 60, h: 20, points: [0.3, 0.3 + b * 0.15, 0.3 + b * 0.35], color: S.gold });
    const sh = idx(v, "shakeUp");
    if (sh) out += k.text({ x: 300, y: 100, text: sh === 2 ? "🌪️" : "💨", size: 14 });
    out += strip(k, [g.steps("balance", "Shared"), g.steps("builds", "Builds"), g.steps("shakeUp", "Shake-up"), g.num("reactRoom", "Room to react", ""), g.num("inFrame", "In frame", " people"), g.word("source", "From")]);
    return out + fitCap(k, `Laughs from the mix: ${v("setting")} · ${v("who")}`);
  });
  pad("mixLaughs", "inFrame", "reactRoom", "People in frame", "Room for reactions");

  /* A line of words with the pun word lit up; the listener groans or tops it. */
  const PUN = { pun: ["I'm reading a book on", "anti-gravity", "— can't put it down."], misunderstanding: ["Did you", "steal", "the show? I only borrowed it."], comeback: ["You're late.", "Early", "for tomorrow."], malapropism: ["It's a", "pigment", "of your imagination."], repetition: ["No.", "No.", "No no no."] };
  look("wordplay", (v, k, g) => {
    const p = PUN[v("kind")] || PUN.pun;
    const cl = idx(v, "cleverness");
    const ch = idx(v, "chain");
    let out = stage(k);
    out += guy(k, 50, { s: 0.75, color: S.orange, mood: 0.8 });
    const words = Math.round(v.n("lineWords"));
    out += `<rect x="86" y="8" width="226" height="46" rx="12" fill="#fff" stroke="${S.ink}" stroke-width="2"/>`;
    out += k.text({ x: 199, y: 22, text: p[0], size: 9, color: S.ink }) + k.text({ x: 199, y: 36, text: p[1], size: 12, color: [S.grey, "#2f7a4a", "#b07a00", "#b03a6a"][cl], weight: 900 }) + k.text({ x: 199, y: 49, text: p[2], size: 9, color: S.ink });
    out += k.label({ x: 306, y: 19, text: `${words} words`, size: 7, color: "#888", anchor: "end" });
    /* chain of puns */
    for (let i = 0; i < ch * 2; i++) out += `<rect x="${100 + i * 22}" y="60" width="18" height="9" rx="4" fill="#cfe0ff"/>`;
    /* others catch it */
    const c = idx(v, "caught");
    out += guy(k, 250, { s: 0.7, color: S.blue, mood: [0, -0.6, 0.9, 0.7][c], arms: c === 3 ? 0.9 : 0, look: -1 });
    out += k.label({ x: 264, y: 66, text: ["", "groan…", "HA!", "tops it!"][c], size: 9, color: c === 1 ? "#bbb" : S.gold, weight: 700, anchor: "start" });
    out += k.label({ x: 10, y: 104, text: ["🙄 groaner", "😄 silly", "😏 sharp", "🤯 brilliant"][cl], size: 9, color: "#ddd", anchor: "start" });
    out += strip(k, [g.steps("speed", "Speed"), g.num("density", "Per minute", ""), g.num("landPause", "Pause to land", " s"), g.num("topsWithin", "Topped within", " s"), g.steps("chain", "Chain"), g.num("lineWords", "Words in line", "")]);
    return out + fitCap(k, `Wordplay: ${v("kind")} · ${v("cleverness")}`);
  });
  pad("wordplay", "density", "landPause", "Wordplay per minute", "Pause for it to land");

  /* Calm person, chaos behind: "Bit of a drizzle," says the person in a hurricane. */
  look("understatement", (v, k, g) => {
    const dir = idx(v, "direction");
    const gap = v.p("gap");
    const chaos = v.n("chaosBehind");
    const fs = v.n("faceSize") / 100;
    let out = stage(k);
    /* chaos behind */
    for (let i = 0; i < Math.round(chaos * 2); i++) out += k.text({ x: 160 + (i % 5) * 25, y: 50 + Math.floor(i / 5) * 26 - (i % 2) * 6, text: ["🔥", "🌪️", "💥", "🐄"][i % 4], size: Math.min(18, 12 + chaos * 2) });
    const r = 14 + Math.min(fs, 2) * 13;
    const sf = idx(v, "straightFace");
    out += k.face({ x: 90, y: 62, r, mood: sf === 0 ? 0.6 : 0, brows: 0, eyes: 0.6, mouth: 0 });
    const line = dir === 0 ? "Bit of a breeze." : dir === 2 ? "This is a CATASTROPHE." : "Hm. Well.";
    const bsz = [8, 9, 9, 10][idx(v, "delivery")];
    out += k.bubble({ x: 92, y: 14, text: line, w: Math.max(110, Math.min(176, line.length * bsz * 0.6 + 16)), h: 22, size: bsz, tail: 0 });
    out += k.label({ x: 90, y: 117, text: `${v("delivery")} · ${v("straightFace")}`, size: 8, color: "#bbb" });
    /* the mismatch: a see-saw */
    out += `<line x1="140" y1="${r1(100 + gap * 10 * (dir === 2 ? -1 : 1))}" x2="210" y2="${r1(100 - gap * 10 * (dir === 2 ? -1 : 1))}" stroke="${S.gold}" stroke-width="3"/><path d="M175 100 l-5 10 h10 Z" fill="${S.gold}"/>`;
    const ans = idx(v, "answered");
    if (ans) out += guy(k, 290, { s: 0.5, color: S.blue, mood: 0 }) + k.label({ x: 312, y: 117, text: ans === 2 ? "everyone: “mm.”" : "“mm.”", size: 8, color: "#ddd", anchor: "end" });
    out += strip(k, [g.steps("delivery", "Delivery"), g.num("beatBefore", "Beat before", " s"), g.steps("straightFace", "Straight face"), g.steps("answered", "Answered"), g.num("faceSize", "Face size", "%"), g.num("holdAfter", "Hold after", " s")]);
    return out + fitCap(k, `${v("direction")} · mismatch ${Math.round(v.n("gap"))} of 5`);
  });
  pad("understatement", "chaosBehind", "gap", "Chaos behind them", "Size of the mismatch");

  /* A frame with a gag hidden in it: where, how big, in focus, how the camera points it out. */
  const VGAG = { "a sign": "🪧", "a prop": "🎺", "a background action": "🤸", "a costume": "🦖", "a match of shapes": "⭕" };
  look("visualGag", (v, k, g) => {
    const plc = idx(v, "place");
    const ax = v.n("across") / 100;
    const up = v.n("up") / 100;
    const sz = v.n("gagSize") / 100;
    const foc = idx(v, "inFocus");
    const sub = idx(v, "subtlety");
    const pt = idx(v, "pointsOut");
    const zoom = pt === 2 ? 1.25 : pt === 3 ? 1.6 : 1;
    const gm = (8 + sz * 40 * (plc === 2 ? 1.2 : plc === 1 ? 1 : 0.8)) / Math.sqrt(zoom); /* the main gag's size */
    const gx = k.clamp(20 + ax * 280, gm * 0.6 + 4, 316 - gm * 0.6);
    const gy = k.clamp(FY - up * 100, 28 + gm * 0.9, FY);
    let inner = k.wall({ y: FY, color: "#3a3646", floor: S.floor }) + k.window_({ x: 40, y: 20, w: 40, h: 34, light: 0.4 });
    inner += guy(k, 160, { s: 0.85 + (plc === 2 ? -0.2 : 0), color: S.blue, mood: 0.2, alpha: plc === 2 ? 0.7 : 1 });
    inner += `<defs><filter id="cw-visualGag-blur"><feGaussianBlur stdDeviation="${[2.5, 1, 0][foc]}"/></filter></defs>`;
    const n = Math.max(1, Math.round(v.n("count")));
    for (let i = 0; i < n; i++) {
      const xx = i === 0 ? gx : 30 + k.rnd(i + 3) * 260;
      const yy = i === 0 ? gy : 30 + k.rnd(i + 7) * 70;
      inner += `<g filter="url(#cw-visualGag-blur)" opacity="${v.n("count") === 0 ? 0.15 : [0.5, 0.8, 1][sub]}">${k.text({ x: xx, y: yy, text: VGAG[v("kind")] || "?", size: gm * (i === 0 ? 1 : 0.5) })}</g>`;
    }
    let out = k.bg(S.bg) + `<clipPath id="cw-visualGag-clip"><rect x="0" y="0" width="320" height="122"/></clipPath><g clip-path="url(#cw-visualGag-clip)"><g transform="translate(${r1(gx)} ${r1(gy)}) scale(${zoom}) translate(${r1(-gx)} ${r1(-gy)})">${inner}</g></g>`;
    if (pt === 1) out += k.arrow({ x1: 160, y1: 20, x2: k.clamp(gx, 30, 290), y2: 20, color: "#9fd3ff", w: 1.5 });
    if (pt === 3) out += chip(k, 314, 14, "✂ cut to it", "#1d2a38", "end");
    if (pt === 2) out += chip(k, 314, 14, "push in", "#1d2a38", "end");
    out += chip(k, 6, 14, ["background", "edge of frame", "center"][plc], "#26252d", "start");
    out += strip(k, [g.steps("subtlety", "Easy to spot"), g.num("count", "Gags", ""), g.num("onScreen", "On screen", " s"), g.steps("inFocus", "Focus"), g.word("kind", "Kind"), g.num("gagSize", "Size", "%")]);
    return out + fitCap(k, `${v("kind")} in the ${v("place")} · ${v("subtlety")}`);
  });
  pad("visualGag", "across", "up", "Across the frame", "Up the frame");

  /* Sound: a speaker, the funny sound effects as onomatopoeia, the sting and a pointed silence. */
  look("comicSound", (v, k, g) => {
    const fx = Math.round(v.n("effects"));
    const style = idx(v, "style");
    const loud = v.p("loudness");
    let out = k.bg(S.bg) + k.speaker({ x: 30, y: 60, s: 1.4, level: loud });
    const words = [["tap", "thud", "clink", "pop", "bump"], ["THUD", "CLANK", "POP", "WHOOSH", "BONK"], ["BOING!", "KA-BLAM!", "SPROING!", "HONK!", "WHEEE!"]][style];
    /* the sound words flow in rows between the speaker and the sting, shrinking until they fit */
    let fsz = 9 + loud * 10 + style * 2;
    let place = [];
    for (let tries = 0; tries < 8; tries++) {
      place = [];
      let x = 96;
      let y = 18 + fsz * 0.8;
      for (let i = 0; i < fx; i++) {
        const w = words[i].length * fsz * (style ? 0.68 : 0.55);
        if (x + w > 266 && x > 96) {
          x = 96;
          y += fsz + 6;
        }
        place.push([x, y, w]);
        x += w + 10;
      }
      if (y <= 80) break;
      fsz *= 0.86;
    }
    place.forEach(([x, y], i) => (out += k.text({ x, y: y + (k.rnd(i) - 0.5) * 4, text: words[i], size: fsz, color: style === 2 ? S.gold : "#eee", weight: style ? 900 : 400, outline: style === 2 ? S.ink : "", anchor: "start" })));
    /* a little time line: hit, sound, silence */
    const len = v.n("soundLength");
    const lands = idx(v, "lands");
    const hit = 120;
    out += `<line x1="10" y1="96" x2="310" y2="96" stroke="#444"/>` + k.label({ x: hit, y: 112, text: "the hit", size: 8, color: "#bbb" }) + `<line x1="${hit}" y1="88" x2="${hit}" y2="104" stroke="#fff" stroke-width="2"/>`;
    const sx = hit + [-20, 0, 18][lands];
    out += `<rect x="${sx}" y="90" width="${r1(4 + len * 16)}" height="12" rx="3" fill="${S.gold}"/>`;
    const sil = v.n("silenceBeat");
    if (sil > 0) out += `<rect x="${r1(sx + 6 + len * 16)}" y="90" width="${r1(sil * 14)}" height="12" fill="none" stroke="#7fb7ff" stroke-dasharray="2 2"/>` + k.label({ x: sx + 6 + len * 16 + sil * 7, y: 86, text: "silence", size: 7, color: "#7fb7ff" });
    const st = idx(v, "sting");
    if (st) out += k.text({ x: 280, y: 74, text: st === 2 ? "♪♪!" : "♪", size: 14 + st * 4, color: S.pink, weight: 900 });
    const ms = idx(v, "musicStop");
    if (ms) out += k.label({ x: 312, y: 14, text: ms === 2 ? "♫ music stops again" : "♫ music stops dead", size: 8, color: S.red, anchor: "end" });
    out += strip(k, [g.steps("sting", "Sting"), g.num("silenceBeat", "Pointed silence", " s"), g.steps("style", "Style"), g.word("lands", "Lands"), g.num("loudness", "Loudness", "%"), g.num("soundLength", "Length", " s")]);
    return out + fitCap(k, `${fx} funny sound effect${fx === 1 ? "" : "s"} · ${v("style")}`);
  });
  pad("comicSound", "loudness", "effects", "How loud", "How many funny sounds");

  /* The joke, then toppers stacking on top: bigger or smaller laughs in a row. */
  const TOPFROM = { "the same character": S.orange, "another character": S.blue, "the background": S.grey, "the edit": "#9fd3ff" };
  look("topper", (v, k, g) => {
    const n = Math.round(v.n("count"));
    const big = idx(v, "bigger");
    const sur = v.p("surprise");
    const gp = v.n("gapBetween");
    let out = stage(k);
    const step = Math.min(40 + gp * 4, 250 / Math.max(1, n)); /* the toppers always fit across */
    let x = 30;
    let s = 0.55;
    out += ha(k, x, 66, s, -8, "joke") + k.label({ x, y: 100, text: "the joke", size: 8, color: "#bbb" });
    for (let i = 0; i < n; i++) {
      x += step;
      s = s * [0.75, 1, 1.35][big];
      out += `<rect x="${r1(x - 14)}" y="80" width="28" height="10" rx="3" fill="${TOPFROM[v("from")] || S.gold}"/>`;
      out += ha(k, x, Math.max(44, 66 - i * (4 + sur * 8)), s, (k.rnd(i) - 0.5) * 30 * (0.3 + sur), "HA!");
    }
    out += `<rect x="96" y="104" width="10" height="10" rx="2" fill="${TOPFROM[v("from")] || S.gold}"/>` + k.label({ x: 110, y: 113, text: `toppers come from ${v("from")}`, size: 8, color: "#bbb", anchor: "start" });
    const ends = idx(v, "endsScene");
    if (ends) out += k.label({ x: 310, y: 16, text: ends === 2 ? "◼ always ends the scene" : "◼ sometimes ends it", size: 8, color: "#ddd", anchor: "end" });
    out += k.label({ x: 10, y: 16, text: `last laugh: ${v("lastLaugh")}`, size: 9, color: S.gold, anchor: "start" });
    out += strip(k, [g.steps("bigger", "Each one"), g.num("beatBefore", "Beat before", " s"), g.num("surprise", "Surprise", ""), g.num("gapBetween", "Gap between", " s"), g.num("holdAfter", "Hold after", " s"), g.steps("endsScene", "Ends scene")]);
    return out + fitCap(k, `${n} topper${n === 1 ? "" : "s"} · each one ${v("bigger")}`);
  });
  pad("topper", "count", "surprise", "How many toppers", "How unexpected");

  /* A detail that gets more and more specific: a tag that grows with numbers. */
  const SPEC = ["a dog", "a big dog", "a 40-kilo dog named Kevin", "a 41.5-kilo beagle-mastiff named Kevin Jr., born on a Tuesday"];
  const WHERE = { "a line": "💬", "a prop": "🎁", "the set": "🏠", "a costume": "👕" };
  look("specificity", (v, k, g) => {
    const lv = idx(v, "level");
    const piled = Math.round(v.n("piled"));
    let out = stage(k);
    out += guy(k, 40, { s: 0.75, color: S.orange, mood: [0.6, 0.2, 0, 0][idx(v, "saidLike")], eyes: idx(v, "saidLike") === 2 ? 0.5 : 0.8 });
    out += k.text({ x: 40, y: 20, text: WHERE[v("where")] || "", size: 14 });
    for (let i = 0; i < Math.min(piled, 8); i++) out += `<rect x="${80 + i * 3}" y="${30 + i * 3}" width="212" height="30" rx="6" fill="${i === piled - 1 ? S.paper : "#3a3946"}" stroke="${S.ink}"/>`;
    const top = Math.min(piled, 8) - 1;
    const txt = SPEC[lv];
    out += k.text({ x: 186 + top * 3, y: 49 + top * 3, text: txt.length > 42 ? txt.slice(0, 40) + "…" : txt, size: [12, 11, 9, 7][lv], color: S.ink, weight: 700 });
    out += Array.from({ length: Math.round(v.n("numbers")) }, (_, i) => k.text({ x: 100 + i * 22, y: 100, text: ["4", "2", "7", "1", "9"][i], size: 14, color: S.gold, weight: 900 })).join("");
    out += k.label({ x: 310, y: 16, text: ["said: “notice this!”", "said casually", "said dead serious"][idx(v, "saidLike")], size: 9, color: "#ddd", anchor: "end" });
    out += k.label({ x: 310, y: 104, text: ["", "↩ comes back once", "🔁 a running gag"][idx(v, "comesBack")], size: 9, color: S.gold, anchor: "end" });
    out += strip(k, [g.steps("level", "How specific"), g.word("where", "Where"), g.num("piled", "Details piled", ""), g.num("detailWords", "Words", ""), g.num("numbers", "Exact numbers", ""), g.num("afterPause", "Pause after", " s")]);
    return out + fitCap(k, `${v("level")}: “${SPEC[lv].slice(0, 36)}${SPEC[lv].length > 36 ? "…" : ""}”`);
  });
  pad("specificity", "detailWords", "numbers", "Words in the detail", "Exact numbers");

  /* One thing blown up out of proportion next to its real size. */
  const EXAG = { "a reaction": "😱", "a description": "🗣️", "a problem": "🔥", "a body": "💪", "a prop": "🍔" };
  look("exaggeration", (v, k, g) => {
    const size = v.p("size");
    const x = v.n("timesReal");
    const grows = idx(v, "grows");
    const oth = idx(v, "othersReact");
    let out = stage(k);
    const e = EXAG[v("what")] || "?";
    out += k.text({ x: 40, y: FY - 4, text: e, size: 14 }) + k.label({ x: 40, y: FY - 26, text: "real", size: 8, color: "#bbb" });
    const big = Math.min(78, 14 + Math.min(1, Math.log10(Math.max(1, x)) / 2) * 50 + size * 26);
    if (grows === 1) for (let i = 1; i < 4; i++) out += k.text({ x: 70 + i * 22, y: FY - 4, text: e, size: 14 + (big - 14) * (i / 4), alpha: 0.4 });
    if (grows === 2) out += `<path d="M60 ${FY - 10} Q130 ${FY - 40} 170 ${FY - 60}" stroke="#bbb" fill="none" stroke-dasharray="3 3"/>`;
    if (grows === 0) out += burst(k, 190, FY - big * 0.45, big * 0.7, "#3a2a2a");
    out += k.text({ x: 190, y: FY - 10, text: e, size: big });
    out += k.label({ x: 190, y: 14, text: `× ${fmt(x)}`, size: 12, color: S.gold, weight: 900 });
    out += guy(k, 290, { s: 0.6, color: S.blue, mood: [-0.8, -0.2, 0.3][oth], eyes: oth === 0 ? 1 : 0.6, arms: oth === 0 ? 1 : 0 });
    out += k.label({ x: 290, y: 24, text: ["😱 shocked", "🤨 half notice", "😐 normal"][oth], size: 8, color: "#ddd" });
    const df = idx(v, "deflate");
    if (df) out += k.label({ x: 190, y: 28, text: df === 2 ? "…then POP!" : "…then shrinks back", size: 8, color: S.gold });
    out += strip(k, [g.word("grows", "Grows"), g.steps("deflate", "Snaps back"), g.when("peakAt", "Peaks"), g.num("timesReal", "Times real", "×"), g.num("growSec", "Grows over", " s"), g.steps("othersReact", "Others")]);
    return out + fitCap(k, `Blowing up ${v("what")} · ${Math.round(v.n("size"))} of 5`);
  });
  pad("exaggeration", "timesReal", "growSec", "Times bigger than real", "Seconds to grow");

  /* The scene, a sudden cut away to a bubble-world, then back. */
  const CUTK = { "a memory": "🕰️", "an imagined moment": "💭", "somewhere else": "🌴", "a contradiction": "🙅" };
  const TRIG = { "a line": "💬", "a look": "👀", "a word": "🔤", "a sound": "🔔" };
  look("cutawayGag", (v, k, g) => {
    const len = v.n("length");
    const ld = idx(v, "looksDifferent");
    const back = idx(v, "comingBack");
    let out = k.bg(S.bg);
    /* the timeline: scene / cutaway / scene */
    /* cutaway, gap before it and beat after it, squeezed together if they would push the scene off the frame */
    const fit = Math.min(1, 150 / (20 + len * 14 + v.n("triggerGap") * 20 + v.n("backBeat") * 10));
    const cw = (20 + len * 14) * fit;
    const tg = v.n("triggerGap") * 20 * fit;
    const bb = v.n("backBeat") * 10 * fit;
    const a = 70;
    out += `<rect x="10" y="20" width="${a}" height="70" fill="#2e3440" stroke="#555"/>` + guy(k, 45, { y: 86, s: 0.5, color: S.blue, mood: 0.2 }) + k.text({ x: 60, y: 34, text: TRIG[v("trigger")] || "", size: 12 });
    const cx = 10 + a + tg;
    if (tg > 0) out += `<line x1="${10 + a}" y1="55" x2="${r1(cx)}" y2="55" stroke="#888" stroke-dasharray="2 2"/>`;
    const fill = ["#2e3440", "#4a2f5a", "#f4f1ea", "#1f5a4a"][ld];
    out += `<rect x="${r1(cx)}" y="14" width="${r1(cw)}" height="82" fill="${fill}" stroke="${S.gold}" stroke-width="2" ${ld === 2 ? 'stroke-dasharray="5 2"' : ""}/>` + k.text({ x: cx + cw / 2, y: 64, text: CUTK[v("kind")] || "?", size: Math.min(30, 14 + len * 2) });
    if (ld === 3) out += k.label({ x: cx + cw / 2, y: 86, text: "puppets!", size: 8, color: "#fff" });
    const bx = cx + cw + bb;
    out += `<rect x="${r1(bx)}" y="20" width="${r1(Math.max(30, 300 - bx))}" height="70" fill="#2e3440" stroke="#555"/>` + guy(k, bx + 30, { y: 86, s: 0.5, color: S.blue, mood: back === 0 ? 0.2 : -0.3, look: back ? 1 : 0 });
    if (back >= 1) out += guy(k, bx + 60, { y: 86, s: 0.5, color: S.orange, mood: back === 2 ? -0.7 : 0.2, eyes: 1 }) + k.label({ x: Math.min(bx + 60, 272), y: 34, text: back === 2 ? "“Did you see that?”" : "?", size: 8, color: "#ddd" });
    out += k.label({ x: 10, y: 108, text: `${Math.round(v.n("perScene"))} cutaway${v.n("perScene") === 1 ? "" : "s"} a scene: ` + "▮".repeat(Math.round(v.n("perScene"))), size: 9, color: S.gold, anchor: "start" });
    out += strip(k, [g.word("trigger", "Set off by"), g.steps("looksDifferent", "Looks different"), g.steps("comingBack", "Back in scene"), g.num("triggerGap", "Line to cutaway", " s"), g.num("backBeat", "Beat back", " s"), g.num("length", "Lasts", " s")]);
    return out + fitCap(k, `Cutaway to ${v("kind")} · ${fmt(len)} s`);
  });
  pad("cutawayGag", "length", "perScene", "How long", "Cutaways per scene");

  /* The straight man stands still while madness swirls; their reaction ranges from nothing to a line. */
  look("straightMan", (v, k, g) => {
    const calm = idx(v, "calm");
    const fs = v.n("frameSize") / 100;
    const sees = idx(v, "sees");
    const re = idx(v, "reacts");
    let out = stage(k, { spot: 100 });
    out += guy(k, 230, { s: 0.75, color: S.orange, mood: 1, arms: 1, lean: -15, walk: 1 }) + motion(k, 270, 50, 3, 20, -1) + k.text({ x: 270, y: 30, text: "🎺", size: 14 });
    const s = k.clamp(0.4 + fs * 0.3, 0.4, 1);
    out += guy(k, 100, { s, color: S.blue, mood: [-0.9, -0.4, 0, 0][calm], arms: calm === 0 ? 1 : 0, lean: calm === 0 ? 8 : 0, eyes: sees === 0 ? 0.4 : 1, look: sees ? 1 : 0 });
    if (re === 1) out += k.label({ x: 100, y: FY - 80 * s - 6, text: "👀", size: 10 });
    if (re === 2) out += k.label({ x: 100 + 20, y: FY - 80 * s - 4, text: "sigh…", size: 9, color: "#bbb" });
    if (re === 3) out += k.bubble({ x: 210, y: 38, text: "Are we doing this?", w: 104, h: 20, size: 8, tail: -50 });
    const sp = idx(v, "speaksForUs");
    if (sp) out += k.label({ x: 10, y: 104, text: sp === 2 ? "🗣 says what we think" : "🗣 now and then", size: 8, color: S.gold, anchor: "start" });
    out += k.label({ x: 10, y: 16, text: `played by ${v("who")}`, size: 9, color: "#ddd", anchor: "start" });
    out += strip(k, [g.steps("sees", "Sees it"), g.steps("reacts", "Reaction"), g.when("cracksAt", "Finally cracks", S.red), g.num("reactBeat", "Pause before", " s"), g.num("frameSize", "Size in frame", "%"), g.num("stillShare", "Time still", "%")]);
    return out + fitCap(k, `The straight one: ${v("calm")}`);
  });
  pad("straightMan", "reactBeat", "stillShare", "Pause before reacting", "Time spent still");
})(typeof window !== "undefined" ? window.CuriosityWindows : require("./windows.js"));
