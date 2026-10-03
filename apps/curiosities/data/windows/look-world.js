/* World: the live picture at the top of each world curiosity's window (CuriosityWindows.look). Each picture shows
   the place itself changing: the room, the weather, the crowd, the things in it. Small strips along the top show
   the settings that are about time (seconds, minutes, how often). */
(function (W) {
  /* ---------- small shared drawing helpers ---------- */
  const idx = (v, id) => {
    const s = v.slider(id);
    return s && Array.isArray(s.scale) ? Math.max(0, s.scale.indexOf(v(id))) : 0;
  };
  /* Place on a log scale, for ranges like 5 m to 10 km. */
  const logp = (x, a, b) => Math.max(0, Math.min(1, (Math.log(Math.max(a, x)) - Math.log(a)) / (Math.log(b) - Math.log(a))));
  /* The bottom caption, kept short enough to read at phone width. */
  /* The bottom line, shrunk to fit the frame when the words are long. */
  const cap = (k, t) => {
    t = String(t).replace(/(\d+\.\d{2})\d+/g, "$1").replace(/ · ( ·)+/g, " ·").replace(/:\s*$/, "");
    return `<rect x="0" y="${k.H - 18}" width="${k.W}" height="18" fill="rgba(0,0,0,0.55)"/>` + k.fitText({ x: k.W / 2, y: k.H - 5, text: t, size: 10, min: 7.5, w: 312, color: "#f4f4f4" });
  };
  const chip = (k, x, y, text, color, anchor) => {
    const w = String(text).length * 5.2 + 10;
    const x0 = anchor === "end" ? x - w : x;
    return `<rect x="${x0}" y="${y - 10}" width="${w}" height="14" rx="7" fill="rgba(0,0,0,0.55)" stroke="${color || "#666"}"/>` + k.label({ x: x0 + w / 2, y: y + 0.5, text, size: 8.5, color: color || "#ddd" });
  };
  /* A thin time strip: a bar from x to x+w with coloured stretches and marks, and a label on its left. */
  function tl(k, o) {
    const x = o.x == null ? 60 : o.x;
    const w = o.w || 250;
    const y = o.y == null ? 8 : o.y;
    let s = `<rect x="${x}" y="${y}" width="${w}" height="6" rx="3" fill="#2e2e36"/>`;
    (o.segs || []).forEach((g) => (s += `<rect x="${(x + k.clamp(g.a, 0, 1) * w).toFixed(1)}" y="${y}" width="${Math.max(1.5, (k.clamp(g.b, 0, 1) - k.clamp(g.a, 0, 1)) * w).toFixed(1)}" height="6" rx="3" fill="${g.color}"/>`));
    (o.marks || []).forEach((m) => (s += `<rect x="${(x + k.clamp(m.at, 0, 1) * w - 1).toFixed(1)}" y="${y - 3}" width="2.5" height="12" fill="${m.color || "#fff"}"/>`));
    if (o.label) s += k.label({ x: x - 4, y: y + 6, text: o.label, size: 7.5, color: "#aaa", anchor: "end" });
    return s;
  };
  const tree = (k, x, y, s, sway) => `<g transform="rotate(${(sway || 0).toFixed(1)} ${x} ${y})"><rect x="${x - 2 * s}" y="${y - 22 * s}" width="${4 * s}" height="${22 * s}" fill="#5b3f2a"/><circle cx="${x}" cy="${y - 30 * s}" r="${13 * s}" fill="#3f7a46" stroke="${k.INK}"/></g>`;
  const box = (k, x, y, w, h, c) => `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" fill="${c || "#8a6b4a"}" stroke="${k.INK}" stroke-width="1.2"/>`;
  const snow = (k, n, seed) => Array.from({ length: n }, (_, i) => k.dot({ x: k.rnd(seed + i) * 320, y: 20 + k.rnd(seed + i * 3.1) * 140, r: 1.6, color: "#e8f2ff" })).join("");

  /* ---------- setting: what kind of place ---------- */
  function place(k, kind, strange) {
    const tilt = strange * 4;
    const t = (s) => `<g transform="rotate(${tilt.toFixed(1)} 160 90)">${s}</g>`;
    if (/kitchen/.test(kind)) return k.wall({ y: 120, color: "#e6d6b8", floor: "#9c7f5f" }) + t(`<rect x="20" y="80" width="280" height="40" fill="#b9a07e" stroke="${k.INK}"/><rect x="20" y="74" width="280" height="8" fill="#ddd"/><rect x="40" y="26" width="60" height="34" fill="#c9b18e" stroke="${k.INK}"/><rect x="220" y="26" width="60" height="34" fill="#c9b18e" stroke="${k.INK}"/><circle cx="160" cy="68" r="6" fill="#777"/>`);
    if (/lab/.test(kind)) return k.wall({ y: 118, color: "#cfe2e6", floor: "#7a8a90" }) + t(`<rect x="20" y="86" width="280" height="10" fill="#eee" stroke="${k.INK}"/>${[50, 80, 240, 270].map((x, i) => `<path d="M${x - 6} 86 L${x - 3} 68 L${x - 3} 60 L${x + 3} 60 L${x + 3} 68 L${x + 6} 86 Z" fill="${["#7fd1ae", "#f2a65a", "#9fb7ff", "#e57373"][i]}" stroke="${k.INK}"/>`).join("")}<rect x="120" y="20" width="80" height="40" fill="#1d2a30" stroke="${k.INK}"/>`);
    if (/courtyard/.test(kind)) return k.sky(0.8) + k.floor(118, "#b5a27f") + t(`<rect x="0" y="40" width="40" height="78" fill="#d7b98c" stroke="${k.INK}"/><rect x="280" y="40" width="40" height="78" fill="#d7b98c" stroke="${k.INK}"/>${tree(k, 70, 118, 1.2)}${tree(k, 250, 118, 1)}<circle cx="160" cy="120" r="14" fill="#7ab6d9" stroke="${k.INK}"/>`);
    if (/wall/.test(kind)) {
      let b = "";
      for (let r = 0; r < 9; r++) for (let c = 0; c < 11; c++) b += `<rect x="${c * 32 - (r % 2) * 16}" y="${r * 14}" width="31" height="13" fill="#a8553d" stroke="#6b3022" stroke-width="1"/>`;
      return k.bg("#6b3022") + t(b) + k.floor(126, "#555");
    }
    return k.bg("#2b3240") + t(`<rect x="10" y="20" width="300" height="70" fill="#c3ccd6" stroke="${k.INK}"/>${[0, 1, 2, 3].map((i) => `<rect x="${24 + i * 72}" y="30" width="58" height="40" fill="#6fa3c7" stroke="${k.INK}"/>`).join("")}<line x1="10" y1="110" x2="310" y2="110" stroke="#aaa" stroke-width="3"/>`) + k.floor(128, "#444");
  }
  W.look("setting", (v, k) => {
    const strange = v.p("familiarity");
    const focus = v.p("placeFocus");
    const turf = v.p("homeTurf");
    const share = v.p("placeInFrame");
    const s = k.lerp(1.35, 0.45, share);
    const est = v.n("establishTime") / 10;
    const lead = v.n("leadIn");
    const here = v.p("timeHere");
    const visits = [1, 2, 3, 5][idx(v, "returns")];
    const eye = ["the main character", "a newcomer", "the owner", "nobody in particular"][idx(v, "seenThrough")];
    const placeLayer = place(k, String(v("setting")), strange);
    const strangeTint = strange > 0 ? k.tint({ color: "#7a3cff", alpha: strange * 0.28 }) : "";
    /* The place pulls focus: the person fades back and the place gets a bright outline. */
    const glow = focus > 0 ? `<rect x="3" y="20" width="314" height="138" fill="none" stroke="#ffd166" stroke-width="${(focus * 5).toFixed(1)}" opacity="${(0.3 + focus * 0.6).toFixed(2)}"/>` : "";
    const pers = k.person({ x: 160, y: 158, s, mood: k.lerp(-0.6, 0.8, turf), arms: k.lerp(-0.3, 0.4, turf), lean: k.lerp(-8, 0, turf), alpha: 1 - focus * 0.55, color: "#4a6fa5", look: idx(v, "seenThrough") === 1 ? -1 : 0 });
    /* Top strip: how long the place is shown first, when the people arrive, the share of film here, visits. */
    const leadAt = k.clamp(0.5 + lead / 60, 0, 1);
    const strip = tl(k, { x: 70, w: 160, y: 24, label: "place first", segs: [{ a: 0, b: est, color: "#ffd166" }], marks: [{ at: leadAt, color: "#9fd3ff" }] });
    const visitsS = Array.from({ length: visits }, (_, i) => `<rect x="${240 + i * 14}" y="22" width="10" height="10" rx="2" fill="#7fd1ae"/>`).join("");
    const pieS = k.pie({ x: 300, y: 50, r: 11, p: here, color: "#ffd166" });
    const turfLabel = chip(k, 8, 52, ["nobody's", "a stranger's", "shared", "the hero's own"][idx(v, "homeTurf")] + " place", "#ccc");
    return k.bg("#141418") + placeLayer + strangeTint + glow + pers + `<rect x="0" y="16" width="320" height="22" fill="rgba(0,0,0,0.5)"/>` + strip + visitsS + pieS + turfLabel + cap(k, `${v("setting")} · seen through ${eye} · ${["familiar", "", "", "", "", "strange"][Math.round(strange * 5)] || "a little strange"}`.replace(" ·  ·", " ·"));
  });

  /* ---------- temperature ---------- */
  W.look("temperature", (v, k) => {
    const deg = v.n("degrees");
    const tp = k.clamp((deg + 30) / 80, 0, 1);
    const hot = v.is("setting", /hot/) ? 1 : v.is("setting", /cold/) ? -1 : 0;
    const shown = v.p("shown");
    const body = v.p("bodyReaction");
    const sweat = idx(v, "breathSweat");
    const feel = [0, 1, 3, 4][idx(v, "whoFeels")];
    const link = v.p("tensionLink");
    const cold = hot < 0 || (hot === 0 && deg < 10);
    const sky = hot > 0 ? "#f0b070" : hot < 0 ? "#9cc3e6" : "#c9d2c0";
    let s = k.bg(sky) + k.floor(130, hot > 0 ? "#c79a5a" : hot < 0 ? "#eef4fa" : "#8a9a6a");
    if (hot > 0) s += `<circle cx="40" cy="40" r="${16 + shown * 8}" fill="#ffdf6b" opacity="0.9"/>`;
    if (hot < 0) s += snow(k, 6 + Math.round(shown * 30), 4);
    /* Heat haze or frost lines grow with how it shows. */
    s += Array.from({ length: Math.round(shown * 6) }, (_, i) => (cold ? `<path d="M${10 + i * 50} 178 l8 -12 l8 12" fill="none" stroke="#fff" stroke-width="2"/>` : `<path d="M${30 + i * 48} 128 q6 -8 0 -16 q-6 -8 0 -16" fill="none" stroke="#fff" stroke-width="1.5" opacity="0.6"/>`)).join("");
    for (let i = 0; i < 4; i++) {
      const x = 70 + i * 55;
      const on = i < feel;
      const arms = on ? (cold ? k.lerp(0, -0.9, body) : k.lerp(0, 1, body)) : 0;
      s += k.person({ x, y: 160, s: 1, mood: on ? k.lerp(0.4, -1, body) : 0.3, arms, lean: on ? body * (i % 2 ? 8 : -8) : 0, color: ["#4a6fa5", "#a5524a", "#5a9a5a", "#8a6aa5"][i] });
      if (sweat > 0)
        for (let d = 0; d < sweat * 2; d++) s += cold ? `<circle cx="${x + 12 + d * 5}" cy="${92 - d * 3}" r="${2 + d * 0.6}" fill="#fff" opacity="0.8"/>` : `<path d="M${x - 10 + d * 4} ${80 + (d % 2) * 6} q2 4 0 6 q-2 -2 0 -6" fill="#6ec3ff"/>`;
    }
    /* Thermometer. */
    s += `<rect x="296" y="30" width="10" height="90" rx="5" fill="#eee" stroke="${k.INK}"/><rect x="298" y="${(32 + (1 - tp) * 86).toFixed(1)}" width="6" height="${(tp * 86).toFixed(1)}" fill="${k.mix("#3c8cff", "#e53935", tp)}"/><circle cx="301" cy="124" r="8" fill="${k.mix("#3c8cff", "#e53935", tp)}" stroke="${k.INK}"/>`;
    /* Tension against heat: two small lines that match more as the link grows. */
    const ten = [0.2, 0.3, 0.6, 0.4, 0.9, 0.7];
    const heat = ten.map((t) => k.lerp(0.5, t, link));
    s += `<rect x="190" y="18" width="96" height="40" rx="4" fill="rgba(0,0,0,0.45)"/>` + k.graph({ x: 196, y: 24, w: 84, h: 28, points: ten, color: "#ff8a80", w2: 1.5 }) + k.graph({ x: 196, y: 24, w: 84, h: 28, points: heat, color: "#ffd166", w2: 2 }) + k.label({ x: 238, y: 66, text: "tension vs heat", size: 7, color: "#eee" });
    s += `<rect x="0" y="0" width="320" height="18" fill="rgba(0,0,0,0.45)"/>` + tl(k, { x: 70, w: 110, y: 6, label: "heats in", segs: [{ a: 0, b: v.n("turnTime") / 120, color: "#ff9a3c" }] }) + tl(k, { x: 236, w: 80, y: 6, label: "first sign", marks: [{ at: v.n("firstSign") / 60, color: "#fff" }] });
    return s + cap(k, `${v("setting")} · ${deg}°C · ${v("whoFeels")} feels it · ${v("bodyReaction")}`);
  });

  /* ---------- props ---------- */
  function propIcon(k, era, x, y, s, color) {
    const e = String(era);
    if (/ancient|medieval/.test(e)) return `<path d="M${x - 8 * s} ${y} Q${x - 12 * s} ${y - 14 * s} ${x - 5 * s} ${y - 22 * s} L${x + 5 * s} ${y - 22 * s} Q${x + 12 * s} ${y - 14 * s} ${x + 8 * s} ${y} Z" fill="${color || "#b5652f"}" stroke="${k.INK}" stroke-width="1.2"/>`;
    if (/1700|1800|west/.test(e)) return `<rect x="${x - 7 * s}" y="${y - 20 * s}" width="${14 * s}" height="${20 * s}" rx="${2 * s}" fill="${color || "#c9a24a"}" stroke="${k.INK}" stroke-width="1.2"/><circle cx="${x}" cy="${y - 10 * s}" r="${4 * s}" fill="#ffe08a"/>`;
    if (/19[2-9]0/.test(e)) return `<rect x="${x - 12 * s}" y="${y - 16 * s}" width="${24 * s}" height="${16 * s}" rx="${3 * s}" fill="${color || "#7a5a3a"}" stroke="${k.INK}" stroke-width="1.2"/><circle cx="${x - 5 * s}" cy="${y - 8 * s}" r="${4 * s}" fill="#ddd"/>`;
    if (/future/.test(e)) return `<rect x="${x - 9 * s}" y="${y - 18 * s}" width="${18 * s}" height="${18 * s}" rx="${4 * s}" fill="${color || "#5ff5ff"}" stroke="#bff" stroke-width="1.5" opacity="0.9"/>`;
    return `<rect x="${x - 6 * s}" y="${y - 22 * s}" width="${12 * s}" height="${22 * s}" rx="${2 * s}" fill="${color || "#333"}" stroke="#999" stroke-width="1.2"/>`;
  }
  W.look("props", (v, k) => {
    const n = v.n("count");
    const imp = v.p("importance");
    const cond = idx(v, "condition");
    const hand = idx(v, "handling");
    const focus = v.p("propFocus");
    const size = k.lerp(0.6, 2.6, v.p("propInFrame"));
    const reach = v.p("propReach");
    const era = v("era");
    const owner = ["#4a6fa5", "#c0392b", "#888", "#555", "#7fd1ae"][idx(v, "propOwner")];
    let s = k.wall({ y: 112, color: "#3a3640", floor: "#4a3c30" }) + `<rect x="20" y="118" width="280" height="10" fill="#7a5a3a" stroke="${k.INK}"/>`;
    /* The other props on the table. */
    for (let i = 0; i < n; i++) s += propIcon(k, era, 30 + i * 18 + (i > 4 ? 120 : 0), 118, 0.6, k.mix("#8a7a6a", "#c0b0a0", k.rnd(i)));
    /* The key prop: bigger as it fills more of the frame, further from the hand as reach grows. */
    const px = 170 + reach * 110;
    const color = cond === 3 ? "#666" : cond === 2 ? "#9a8060" : undefined;
    s += imp > 0 ? `<circle cx="${px}" cy="${118 - 12 * size}" r="${(14 + imp * 14) * size * 0.8}" fill="#ffd166" opacity="${(0.1 + imp * 0.35).toFixed(2)}"/>` : "";
    s += propIcon(k, era, px, 118, size, color);
    if (cond >= 2) s += `<path d="M${px - 4} ${118 - 18 * size} l4 6 l-3 5 l5 6" fill="none" stroke="${k.INK}" stroke-width="1.5"/>`;
    if (cond === 0) s += `<path d="M${px + 10 * size} ${110 - 20 * size} l3 -6 l3 6 l-3 6 Z" fill="#fff"/>`;
    s += `<circle cx="${px}" cy="122" r="3" fill="${owner}"/>`;
    /* The person and their hands: ignored, touched, used, fought over. */
    s += k.person({ x: 120, y: 158, s: 1.4, arms: hand === 0 ? -0.2 : 0.55, mood: hand === 3 ? -0.8 : 0.2, look: hand === 0 ? -1 : 1, color: "#4a6fa5" });
    if (hand >= 1) s += `<line x1="140" y1="112" x2="${px - 8}" y2="${118 - 10 * size}" stroke="${k.INK}" stroke-width="3" stroke-linecap="round" opacity="${hand === 1 ? 0.5 : 1}"/>`;
    if (hand === 2) s += `<path d="M${px - 14} ${100 - 14 * size} l-6 -6 M${px + 14} ${100 - 14 * size} l6 -6" stroke="#ffd166" stroke-width="2"/>`;
    if (hand === 3) s += k.person({ x: 280, y: 158, s: 1.3, arms: 0.55, mood: -0.8, look: -1, color: "#c0392b" }) + `<line x1="262" y1="112" x2="${px + 8}" y2="${118 - 10 * size}" stroke="${k.INK}" stroke-width="3"/>`;
    /* The camera singles it out: a frame closing in on it. */
    if (focus > 0) {
      const fw = k.lerp(200, 40 * size + 20, focus);
      s += k.frame({ x: px - fw / 2, y: 118 - 12 * size - fw * 0.28, w: fw, h: fw * 0.56, color: "#ffd166", dash: "5 3" });
    }
    /* Top strip: planted (marks), how long ahead, seconds in hand. */
    const plants = [[], [0.5], [0.15], [0.15, 0.4, 0.65]][idx(v, "setupPayoff")];
    const ahead = v.n("plantedAhead") / 90;
    s += `<rect x="0" y="0" width="320" height="34" fill="rgba(0,0,0,0.55)"/>` + tl(k, { x: 60, w: 250, y: 6, label: "set up", marks: plants.map((a) => ({ at: a * (1 - ahead * 0.6), color: "#7fd1ae" })).concat([{ at: 0.95, color: "#ffd166" }]), segs: [{ a: 0.95 - ahead * 0.9, b: 0.95, color: "#3d5a4a" }] }) + tl(k, { x: 60, w: 250, y: 22, label: "in hand", segs: [{ a: 0, b: v.n("heldFor") / 120, color: "#9fd3ff" }] });
    return s + cap(k, `${n} props · ${era} · ${v("condition")} · ${v("importance")} · ${v("propOwner")}'s`);
  });

  /* ---------- interior or exterior ---------- */
  W.look("intExt", (v, k) => {
    const ext = v.is("setting", /exterior/);
    const view = v.p("view");
    const leak = Math.round(v.p("outsideSound") * 3);
    const thr = idx(v, "threshold");
    const shelter = v.p("shelter");
    const pull = v.p("pullOutside");
    const exitD = v.p("exitDistance");
    const cross = v.n("crossings");
    const inside = v.p("insideShare");
    let s;
    if (ext) s = k.sky(0.75) + k.floor(120, "#6f8f4f") + `<rect x="70" y="40" width="180" height="80" fill="#c9b18e" stroke="${k.INK}" stroke-width="2"/><path d="M60 40 L160 8 L260 40 Z" fill="#8a4a3a" stroke="${k.INK}"/>`;
    else s = k.wall({ y: 128, color: "#d6c4a8", floor: "#7a6250" });
    /* Window: bigger as the view outside grows. */
    const ww = 24 + view * 60;
    const wh = 16 + view * 40;
    s += k.window_({ x: ext ? 100 : 40, y: ext ? 54 : 30, w: ww, h: wh, light: ext ? 0.3 : 0.85 });
    if (!ext && view > 0.3) s += tree(k, 40 + ww * 0.6, 30 + wh, 0.6 + view * 0.4);
    /* Walls: thin with gaps when exposed, thick and sealed when safe. */
    const wallW = 2 + shelter * 10;
    s += `<rect x="${wallW / 2}" y="${wallW / 2}" width="${320 - wallW}" height="${128 - wallW}" fill="none" stroke="#5a4636" stroke-width="${wallW.toFixed(1)}"${shelter < 0.4 ? ' stroke-dasharray="18 8"' : ""} opacity="${ext ? 0.35 : 1}"/>`;
    /* Door: further from the person as the way out gets further. Tally of crossings above it. */
    const doorX = 150 + exitD * 140;
    s += `<rect x="${doorX - 14}" y="${ext ? 80 : 74}" width="28" height="${ext ? 40 : 54}" fill="#5a3a22" stroke="${k.INK}" stroke-width="1.5"/>`;
    s += Array.from({ length: cross }, (_, i) => `<line x1="${doorX - 14 + i * 3}" y1="${ext ? 72 : 64}" x2="${doorX - 14 + i * 3}" y2="${ext ? 78 : 70}" stroke="#ffd166" stroke-width="1.6"/>`).join("");
    /* Outside sound leaking in through the window. */
    for (let i = 1; i <= leak; i++) s += `<path d="M${(ext ? 100 : 40) + ww + 4 + i * 7} ${30 + wh / 2 - 6 - i * 3} q${6} ${6 + i * 3} 0 ${12 + i * 6}" fill="none" stroke="#9fd3ff" stroke-width="2"/>`;
    /* The person: stays, glimpses, steps through, goes back and forth; looks toward the window as the pull grows. */
    const px = [130, 140, doorX, doorX - 30][thr];
    s += k.person({ x: px, y: 158, s: 1.15, look: -pull, mood: pull > 0.9 ? -0.4 : 0.2, lean: -pull * 6, color: "#4a6fa5", alpha: thr === 2 ? 0.75 : 1 });
    if (thr === 3) s += k.arrow({ x1: doorX - 50, y1: 138, x2: Math.min(312, doorX + 20), y2: 138 }) + k.arrow({ x1: Math.min(312, doorX + 20), y1: 146, x2: doorX - 50, y2: 146, color: "#9fd3ff" });
    if (thr === 1) s += k.arrow({ x1: 150, y1: 90, x2: (ext ? 100 : 40) + ww / 2, y2: 40 + wh / 2, color: "#9fd3ff", w: 1.5 });
    s += k.pie({ x: 300, y: 20, r: 11, p: inside, color: "#ffd166" }) + k.label({ x: 300, y: 42, text: "inside", size: 8, color: "#eee" });
    return s + cap(k, `${v("setting")} · ${v("shelter")} · door ${v("exitDistance")} m away · ${v("threshold")}`);
  });

  /* ---------- weather ---------- */
  W.look("weather", (v, k) => {
    const kind = String(v("setting"));
    const str = v.p("strength");
    const wind = v.p("wind");
    const on = idx(v, "onPeople");
    const mm = idx(v, "moodMatch");
    const vis = logp(v.n("visibility"), 5, 10000);
    const from = v.n("blowsFrom");
    const skyShare = v.p("skyInFrame");
    const horizon = 20 + skyShare * 130;
    const skyC = /clear/.test(kind) ? k.mix("#7fb7e6", "#3f8fd6", str) : /rain/.test(kind) ? k.mix("#8a95a0", "#3a4048", str) : k.mix("#d9b98a", "#a07040", str);
    let s = `<rect x="0" y="0" width="320" height="180" fill="${skyC}"/>` + k.floor(horizon, /dust/.test(kind) ? "#b08a5a" : "#5a7040");
    if (/clear/.test(kind)) s += `<circle cx="260" cy="${Math.min(horizon - 14, 40)}" r="${12 + str * 10}" fill="#ffe36b"/>`;
    /* Rain or dust: more with strength, slanted with wind. */
    const n = /clear/.test(kind) ? Math.round(wind * 10) : 10 + Math.round(str * 70);
    const slant = wind * 18 * (Math.cos(k.rad(from)) >= 0 ? 1 : -1);
    for (let i = 0; i < n; i++) {
      const x = k.rnd(i + 1) * 340 - 10;
      const y = k.rnd(i + 7.3) * 170;
      s += /rain/.test(kind) ? `<line x1="${x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${(x - slant).toFixed(1)}" y2="${(y + 12).toFixed(1)}" stroke="#cfe6ff" stroke-width="1.2" opacity="0.8"/>` : /dust/.test(kind) ? `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${1.5 + k.rnd(i) * 2}" fill="#e6c99a" opacity="0.7"/>` : `<path d="M${x.toFixed(1)} ${y.toFixed(1)} l${(10 + slant).toFixed(1)} 0" stroke="#fff" stroke-width="1.2" opacity="0.6"/>`;
    }
    /* Person: marked by the weather, and smiling or not depending on whether it fights or matches the mood. */
    const mood = [0.8, 0.2, -0.5, -1][mm];
    const coat = ["#4a6fa5", "#41608c", "#2d4566", "#1f2f45"][on];
    s += k.person({ x: 120, y: 158, s: 1.4, mood, lean: -wind * 14 * (on === 3 ? 1.5 : 1), arms: on === 3 ? 0.8 : 0, color: coat });
    if (on >= 2) s += Array.from({ length: on * 3 }, (_, i) => `<circle cx="${108 + k.rnd(i + 40) * 24}" cy="${100 + k.rnd(i + 50) * 50}" r="1.6" fill="${/dust/.test(kind) ? "#d9b98a" : "#cfe6ff"}"/>`).join("");
    /* Visibility: fog that hides the far trees. */
    s += tree(k, 230, horizon + 8, 0.7, wind * 12) + tree(k, 280, horizon + 4, 0.5, wind * 12);
    s += `<rect x="0" y="0" width="320" height="180" fill="${/dust/.test(kind) ? "#d9c09a" : "#dfe6ec"}" opacity="${((1 - vis) * 0.75).toFixed(2)}"/>`;
    /* Where it blows from: a compass. */
    const a = k.rad(from - 90);
    s += `<circle cx="292" cy="30" r="18" fill="rgba(0,0,0,0.4)" stroke="#ccc"/>` + k.arrow({ x1: 292 + Math.cos(a) * 16, y1: 30 + Math.sin(a) * 16, x2: 292 - Math.cos(a) * 10, y2: 30 - Math.sin(a) * 10, color: "#fff", w: 2 }) + k.label({ x: 292, y: 60, text: `from ${from}°`, size: 7.5, color: "#fff" });
    /* How it builds, and the gusts: a small intensity line along the top. */
    const shapes = [[0.6, 0.6, 0.6, 0.6, 0.6, 0.6], [0.1, 0.25, 0.4, 0.6, 0.8, 0.95], [0.3, 0.8, 0.3, 0.8, 0.3, 0.8], [0.1, 0.1, 0.1, 0.1, 0.95, 0.9]][idx(v, "buildUp")];
    const gap = v.n("burstEvery");
    const gusts = gap > 0 ? Array.from({ length: Math.min(12, Math.floor(60 / gap)) }, (_, i) => ({ at: ((i + 1) * gap) / 60, color: "#fff" })) : [];
    s += `<rect x="6" y="6" width="150" height="36" rx="4" fill="rgba(0,0,0,0.45)"/>` + k.graph({ x: 12, y: 10, w: 138, h: 18, points: shapes, color: "#ffd166", w2: 2 }) + tl(k, { x: 12, w: 138, y: 32, marks: gusts });
    return s + cap(k, `${kind} · strength ${v("strength")} · see ${v.n("visibility") >= 1000 ? (v.n("visibility") / 1000).toFixed(1) + " km" : v.n("visibility") + " m"} · ${v("moodMatch")}`);
  });

  /* ---------- scale of the place ---------- */
  W.look("scale", (v, k) => {
    const kind = idx(v, "setting");
    const wide = logp(v.n("width"), 1, 5000);
    const tall = logp(v.n("tall"), 2, 500);
    const ppl = v.n("people");
    const ps = [1.9, 1.2, 0.6, 0.22][idx(v, "personSize")];
    const feel = idx(v, "feelSize");
    let s = k.bg("#141418");
    /* The space: its walls spread with width; the ceiling rises with height. */
    const half = 40 + wide * 115;
    const top = 150 - (30 + tall * 115);
    if (kind === 2) {
      s += k.sky(0.55) + k.floor(150, "#555");
      for (let i = 0; i < 14; i++) {
        const bh = (20 + k.rnd(i + 2) * 80) * (0.3 + tall);
        s += `<rect x="${(160 - half + (i * 2 * half) / 14).toFixed(1)}" y="${(150 - bh).toFixed(1)}" width="${((2 * half) / 14 - 2).toFixed(1)}" height="${bh.toFixed(1)}" fill="${k.mix("#3a4458", "#6a7488", k.rnd(i))}"/>`;
      }
    } else {
      s += `<rect x="${160 - half}" y="${top}" width="${half * 2}" height="${150 - top}" fill="${kind === 0 ? "#6a5a48" : "#c9bfae"}" stroke="${k.INK}" stroke-width="2"/>` + `<rect x="${160 - half}" y="150" width="${half * 2}" height="10" fill="#7a6250"/>`;
      if (kind === 1) for (let i = 1; i < 6; i++) s += `<rect x="${(160 - half + (i * 2 * half) / 6 - 4).toFixed(1)}" y="${top}" width="8" height="${150 - top}" fill="#e6ddcc" stroke="${k.INK}"/>`;
      if (kind === 0) s += `<line x1="${160 - half + 8}" y1="${top + 14}" x2="${160 + half - 8}" y2="${top + 14}" stroke="#333" stroke-width="2"/>`;
    }
    /* Other people as small dots across the floor. */
    for (let i = 0; i < Math.min(60, ppl); i++) s += k.dot({ x: 160 - half + 6 + k.rnd(i + 11) * (half * 2 - 12), y: 146 + k.rnd(i + 19) * 12, r: 1.8, color: "#ffcf9f" });
    s += k.person({ x: 160, y: 158, s: ps, color: "#e57373" });
    /* Feels bigger or smaller: arrows pushing the walls out or in. */
    if (feel !== 1) {
      const d = feel === 2 ? 1 : -1;
      s += k.arrow({ x1: 160 - half + 20, y1: 90, x2: 160 - half + 20 - 22 * d, y2: 90, color: "#ffd166" }) + k.arrow({ x1: 160 + half - 20, y1: 90, x2: 160 + half - 20 + 22 * d, y2: 90, color: "#ffd166" });
    }
    /* How the size shows: three tiny frames, all wide / widening / tight then one wide. */
    const rev = idx(v, "sizeReveal");
    const sizes = [[1, 1, 1], [0.35, 0.65, 1], [0.3, 0.3, 1]][rev];
    s += `<rect x="4" y="4" width="98" height="40" rx="4" fill="rgba(0,0,0,0.55)"/>` + sizes.map((z, i) => `<rect x="${10 + i * 30}" y="10" width="26" height="16" fill="#2a2a30" stroke="#888"/><rect x="${(23 + i * 30 - 12 * z).toFixed(1)}" y="${(18 - 7 * z).toFixed(1)}" width="${(24 * z).toFixed(1)}" height="${(14 * z).toFixed(1)}" fill="#7fb7ff"/>`).join("") + tl(k, { x: 10, w: 86, y: 32, marks: [{ at: v.n("revealAt") / 300, color: "#ffd166" }] });
    return s + cap(k, `${v("setting")} · ${v("width")} m wide · ${v("tall")} m high · ${ppl} people · feels ${v("feelSize")}`);
  });

  /* ---------- cramped to open (a plan from above) ---------- */
  W.look("layoutOpen", (v, k) => {
    const open = v.p("setting");
    const rw = 110 + open * 170;
    const rh = 60 + open * 80;
    const x0 = 160 - rw / 2;
    const y0 = 88 - rh / 2;
    const ob = v.n("obstacles");
    const paths = [1, 2, 4][idx(v, "paths")];
    const roam = idx(v, "roaming");
    const close = idx(v, "closingIn");
    const gap = logp(v.n("personGap"), 0.2, 20);
    const floor = logp(v.n("freeFloor"), 1, 2000);
    const walked = v.p("walked");
    let s = k.bg("#141418") + `<rect x="${x0}" y="${y0}" width="${rw}" height="${rh}" fill="#3b332b" stroke="#d9cbb5" stroke-width="4"/>`;
    /* Floor tiles: one tile per few square metres, so a bigger free floor shows more, smaller tiles. */
    const tile = k.lerp(26, 6, floor);
    for (let x = x0 + tile; x < x0 + rw; x += tile) s += `<line x1="${x.toFixed(1)}" y1="${y0}" x2="${x.toFixed(1)}" y2="${y0 + rh}" stroke="#4a4038" stroke-width="1"/>`;
    for (let i = 0; i < ob; i++) s += box(k, x0 + 10 + k.rnd(i + 3) * (rw - 34), y0 + 6 + k.rnd(i + 9) * (rh - 24), 20, 14, "#8a6b4a");
    for (let i = 0; i < paths; i++) {
      const yy = y0 + ((i + 1) * rh) / (paths + 1);
      s += `<path d="M${x0 - 10} ${yy.toFixed(1)} Q160 ${(yy + (i % 2 ? 14 : -14)).toFixed(1)} ${x0 + rw + 10} ${yy.toFixed(1)}" fill="none" stroke="#7fd1ae" stroke-width="1.6" stroke-dasharray="4 3"/>`;
    }
    /* Two people, spaced by the gap; a walked trail behind the first. */
    const half = 4 + gap * Math.min(rw / 2 - 10, 120);
    const p1 = [160 - half, 88];
    const p2 = [160 + half, 88];
    const trail = walked * 140;
    s += `<path d="M${p1[0]} ${p1[1]} l${-Math.min(trail, 60)} ${trail > 60 ? -20 : 0} l${-Math.max(0, trail - 60) * 0.4} ${trail > 60 ? 30 : 0}" fill="none" stroke="#ffd166" stroke-width="1.5" stroke-dasharray="2 3"/>`;
    /* the two people, seen from above: a shirt-colored body under each face */
    s += [[p1, "#4a6fa5", 1], [p2, "#e57373", -1]].map(([p, c, lk]) => `<ellipse cx="${p[0]}" cy="${p[1] + 4}" rx="10" ry="6" fill="${c}" stroke="#1c1712"/>` + k.face({ x: p[0], y: p[1] - 2, r: 7, look: lk, eyes: 1, color: "#f0c8a0" })).join("");
    s += k.label({ x: 160, y: 14, text: "the room seen from above", size: 8, color: "#999" });
    for (let i = 0; i < roam; i++) s += k.arrow({ x1: p1[0], y1: p1[1], x2: p1[0] + Math.cos(i * 2.1) * (12 + i * 6), y2: p1[1] + Math.sin(i * 2.1) * (12 + i * 6), color: "#9fd3ff", w: 1.5 });
    if (close !== 1) {
      const d = close === 2 ? 1 : -1;
      s += k.arrow({ x1: x0 + 2 - 14 * d, y1: 88, x2: x0 + 2 + 4 * d, y2: 88, color: "#ff8a80" }) + k.arrow({ x1: x0 + rw - 2 + 14 * d, y1: 88, x2: x0 + rw - 2 - 4 * d, y2: 88, color: "#ff8a80" });
    }
    return s + cap(k, `${v("setting")} · ${v("freeFloor")} m² free · ${v("personGap")} m apart · walked ${v("walked")} m`);
  });

  /* ---------- how the room is laid out (plan from above) ---------- */
  W.look("setLayout", (v, k) => {
    const lay = idx(v, "setting");
    const zones = v.n("zones");
    const ent = v.n("entrances");
    const lv = idx(v, "heightLevels");
    const focal = idx(v, "focalPoint");
    const from = idx(v, "layoutFrom");
    const R = { x: 20, y: 22, w: 200, h: 130 };
    let s = k.bg("#141418") + `<rect x="${R.x}" y="${R.y}" width="${R.w}" height="${R.h}" fill="#3b332b" stroke="#d9cbb5" stroke-width="3"/>`;
    for (let i = 0; i < zones; i++) s += `<rect x="${(R.x + (i * R.w) / zones + 2).toFixed(1)}" y="${R.y + 3}" width="${(R.w / zones - 4).toFixed(1)}" height="${R.h - 6}" fill="${k.hsl(i * 47, 45, 40, 0.35)}"/>`;
    for (let i = 0; i < lv; i++) s += `<rect x="${R.x + 3}" y="${R.y + 3 + i * 14}" width="${R.w - 6}" height="${R.h * 0.25 - i * 6}" fill="none" stroke="#bfa98a" stroke-width="1.2" stroke-dasharray="3 2"/>`;
    /* The furniture of each layout. */
    if (lay === 0) s += box(k, R.x + 20, R.y + 10, R.w - 40, 14, "#7a5a3a");
    if (lay === 1) for (let i = 0; i < 5; i++) s += box(k, R.x + 6, R.y + 8 + i * 24, 16, 18, "#8a4a3a") + box(k, R.x + R.w - 22, R.y + 8 + i * 24, 16, 18, "#8a4a3a");
    if (lay === 2) for (let i = 0; i < 6; i++) s += `<circle cx="${R.x + 50 + (i % 3) * 50}" cy="${R.y + 40 + Math.floor(i / 3) * 50}" r="10" fill="#7a5a3a" stroke="${k.INK}"/>`;
    if (lay === 3) for (let i = 0; i < 3; i++) s += box(k, R.x + 24 + i * 58, R.y + 46, 40, 30, "#6a7a8a");
    if (lay === 4) s += box(k, R.x + 10, R.y + 8, R.w - 20, 26, "#5a6a5a") + box(k, R.x + 10, R.y + 96, 60, 26, "#5a6a5a");
    /* Doors: gaps in the walls. */
    for (let i = 0; i < ent; i++) {
      const t = (i + 0.5) / ent;
      const per = t * 2 * (R.w + R.h);
      let x;
      let y;
      if (per < R.w) (x = R.x + per), (y = R.y);
      else if (per < R.w + R.h) (x = R.x + R.w), (y = R.y + per - R.w);
      else if (per < 2 * R.w + R.h) (x = R.x + R.w - (per - R.w - R.h)), (y = R.y + R.h);
      else (x = R.x), (y = R.y + R.h - (per - 2 * R.w - R.h));
      s += `<rect x="${(x - 7).toFixed(1)}" y="${(y - 7).toFixed(1)}" width="14" height="14" fill="#141418"/><rect x="${(x - 7).toFixed(1)}" y="${(y - 2).toFixed(1)}" width="14" height="4" fill="#7fd1ae"/>`;
    }
    /* Where it's measured from, and the focal point at its angle and distance from there. */
    const origin = [[80, 120], [R.x + R.w / 2, R.y + R.h + 10], [R.x, R.y + R.h / 2], [R.x + R.w / 2, R.y + R.h / 2]][from];
    const fd = 6 + v.p("focalDistance") * 70;
    const fa = k.rad(v.n("focalAround") - 90);
    const fx = k.clamp(origin[0] + Math.cos(fa) * fd, R.x + 12, R.x + R.w - 12);
    const fy = k.clamp(origin[1] + Math.sin(fa) * fd, R.y + 12, R.y + R.h - 22);
    s += `<clipPath id="cw-setLayout-clip"><rect x="${R.x}" y="${R.y}" width="${R.w}" height="${R.h + 14}"/></clipPath><g clip-path="url(#cw-setLayout-clip)">` + k.ring({ x: origin[0], y: origin[1], r: fd, color: "#888", dash: "3 3", w: 1 }) + `</g>`;
    /* People in the room, seen from above (a face on a shirt), so the plan reads as a real place. */
    const topP = (x, y, c, lk) => `<ellipse cx="${x.toFixed(1)}" cy="${(y + 4).toFixed(1)}" rx="8" ry="5" fill="${c}" stroke="${k.INK}"/>` + k.face({ x, y: y - 1, r: 5.5, look: lk, eyes: 1, color: "#f0c8a0" });
    [[R.x + 62, R.y + 104, "#8a6a9a", 1], [R.x + 112, R.y + 66, "#6a8a6a", -1], [R.x + 168, R.y + 108, "#9a7a4a", -1]].forEach(([x, y, c, lk]) => (s += topP(x, y, c, lk)));
    s += from === 1 ? k.cam({ x: origin[0], y: origin[1], dir: -90, s: 0.5 }) : from === 0 ? topP(origin[0], origin[1], "#4a6fa5", 1) : k.dot({ x: origin[0], y: origin[1], r: 5, color: "#ccc" });
    if (focal > 0) s += `<path d="M${fx} ${fy - 8} l2.4 5.6 l6 0.6 l-4.6 4 l1.4 6 l-5.2 -3.2 l-5.2 3.2 l1.4 -6 l-4.6 -4 l6 -0.6 Z" fill="#ffd166" stroke="${k.INK}"/>` + k.label({ x: fx, y: fy + 18, text: ["", "counter", "center", "stage"][focal], size: 8, color: "#ffd166" });
    else s += k.ring({ x: fx, y: fy, r: 5, color: "#888", dash: "2 2", w: 1 });
    s += k.fitText({ x: 120, y: 16, text: `the room from above · focal point at ${v("focalAround")}°, ${v("focalDistance")} m`, size: 8, min: 6.5, w: 210, color: "#ccc" });
    /* Side view: how far the levels drop. */
    const drop = v.p("levelDrop") * 70;
    s += `<rect x="232" y="22" width="82" height="130" rx="4" fill="#1d1d22" stroke="#444"/><path d="M236 ${60} L270 60 L270 ${60 + drop + 4} L310 ${60 + drop + 4}" fill="none" stroke="#d9cbb5" stroke-width="3"/>` + k.person({ x: 252, y: 60, s: 0.35 }) + k.label({ x: 273, y: 146, text: `${v("levelDrop")} m drop`, size: 8, color: "#ccc" });
    return s + cap(k, `${v("setting")} · ${zones} areas · ${ent} doors · from ${v("layoutFrom")}`);
  });

  /* ---------- crowd ---------- */
  W.look("crowdLens", (v, k) => {
    const none = idx(v, "count") === 0;
    /* With no crowd, a faint ghost crowd still shows how it would stand. */
    const n = none ? 10 : [0, 4, 10, 24, 44][idx(v, "count")];
    const variety = v.p("variety");
    const sync = v.p("sync");
    const spreadI = idx(v, "spread");
    const follow = idx(v, "follow");
    const ripple = v.n("ripple");
    const focus = v.p("crowdFocus");
    const dist = logp(v.n("crowdDistance") + 1, 1, 101);
    const share = v.p("crowdInFrame");
    const space = logp(v.n("crowdSpacing"), 0.2, 10);
    const around = idx(v, "crowdAround");
    const sz = k.lerp(1.1, 0.35, dist);
    const cx = 160;
    const cy = k.lerp(160, 112, dist);
    const half = 30 + share * 130;
    let s = k.bg("#141418") + k.floor(k.lerp(90, 70, dist), "#2a2622");
    const pts = [];
    for (let i = 0; i < n; i++) {
      const t = n > 1 ? i / (n - 1) : 0.5;
      let x;
      let y;
      if (spreadI === 0) (x = cx + (k.rnd(i + 1) - 0.5) * half * 0.6), (y = cy - k.rnd(i + 2) * 20);
      else if (spreadI === 1) (x = cx + (k.rnd(i + 1) - 0.5) * half * 2), (y = cy - k.rnd(i + 2) * 40);
      else if (spreadI === 2) (x = cx - half + (i % 11) * ((half * 2) / 10)), (y = cy - Math.floor(i / 11) * 16);
      else {
        const a = (i / Math.max(1, n)) * Math.PI * 2;
        (x = cx + Math.cos(a) * half * 0.8), (y = cy - 20 + Math.sin(a) * 18);
      }
      /* Spacing pushes them apart from the middle. */
      x = cx + (x - cx) * k.lerp(0.5, 1.2, space);
      pts.push([x, y, t, i]);
    }
    pts.sort((a, b) => a[1] - b[1]);
    const leaderX = cx;
    pts.forEach(([x, y, t, i]) => {
      const lag = ripple > 0 ? Math.sin(t * Math.PI * 2 * (ripple / 4)) : 0;
      const own = k.rnd(i + 31) * 2 - 1;
      const arms = k.lerp(own, 0.8 + lag * 0.4 * (1 - sync), sync);
      const followsMe = follow === 2 || (follow === 1 && i % 2 === 0);
      const color = variety < 0.01 ? "#6a7a9a" : k.hsl((variety * k.rnd(i + 5) * 360) % 360, 20 + variety * 45, 45);
      s += k.person({ x, y, s: sz, arms, color, look: followsMe ? k.clamp((leaderX - x) / 40, -1, 1) : own, alpha: none ? 0.18 + focus * 0.1 : k.lerp(0.45, 1, focus) });
    });
    /* What they gather around. */
    const ar = [["#e57373", "hero"], ["#ffd166", "leader"], ["#9fd3ff", "stage"], ["#fff", "camera"], [null, ""]][around];
    if (ar[0]) s += around === 2 ? `<rect x="${cx - 26}" y="${cy + 4}" width="52" height="8" fill="#9fd3ff"/>` : around === 3 ? k.cam({ x: cx, y: cy + 12, dir: -90, s: 0.7 }) : k.person({ x: cx, y: cy + 14, s: sz * 1.2, color: ar[0], arms: 1 });
    /* How the crowd builds: arrows of people coming in. */
    const grow = idx(v, "grow");
    for (let i = 0; i < grow * 2; i++) s += k.arrow({ x1: i % 2 ? 316 : 4, y1: 120 + i * 8, x2: i % 2 ? 290 : 30, y2: 120 + i * 8, color: "#7fd1ae", w: 1.5 });
    return s + cap(k, `${v("count")} · ${v("variety")} · ${v("sync")} · ${v("crowdDistance")} m away · ripple ${ripple}`);
  });

  /* ---------- motion of the environment ---------- */
  W.look("envMotion", (v, k) => {
    const kind = idx(v, "setting");
    const much = v.p("howMuch");
    const spd = v.p("speed");
    const dir = idx(v, "direction");
    const touch = idx(v, "touches");
    const dist = v.p("motionDistance");
    const share = v.p("movingShare");
    const n = Math.round(2 + much * 14);
    const ly = k.lerp(130, 60, dist);
    const sc = k.lerp(1.2, 0.45, dist);
    const band = 20 + share * 120;
    let s = k.sky(0.6) + k.floor(120, "#5a6a4a") + `<rect x="0" y="${(ly - band / 2).toFixed(1)}" width="320" height="${band.toFixed(1)}" fill="#fff" opacity="0.08"/>`;
    const dx = [0, 1, 0, -1][dir];
    const dyS = [1, 0, -1, 0][dir];
    for (let i = 0; i < n; i++) {
      const x = 10 + k.rnd(i + 2) * 300;
      const y = ly - band / 2 + k.rnd(i + 5) * band;
      let thing;
      if (kind === 0) thing = `<rect x="${x - 6 * sc}" y="${y - 8 * sc}" width="${12 * sc}" height="${12 * sc}" fill="#8a7a6a"/>`;
      else if (kind === 1) thing = tree(k, x, y + 10 * sc, sc * 0.7, spd * 25 * (dx || 1));
      else if (kind === 2) thing = k.person({ x, y: y + 10, s: sc * 0.6, walk: spd, color: k.hsl(k.rnd(i) * 360, 40, 50) });
      else if (kind === 3) thing = `<path d="M${x - 14 * sc} ${y} q${7 * sc} ${-8 * sc} ${14 * sc} 0 t${14 * sc} 0" fill="none" stroke="#7fc1ff" stroke-width="2.5"/>`;
      else thing = `<rect x="${x - 16 * sc}" y="${y - 8 * sc}" width="${32 * sc}" height="${14 * sc}" rx="3" fill="#c3ccd6" stroke="${k.INK}"/>`;
      s += thing;
      if (kind > 0 && spd > 0) {
        const L = 4 + spd * 26;
        s += dx ? `<line x1="${x - dx * 12}" y1="${y}" x2="${x - dx * (12 + L)}" y2="${y}" stroke="#fff" stroke-width="1.2" opacity="0.7"/>` : `<circle cx="${x}" cy="${y}" r="${(2 + spd * 6) * (dyS > 0 ? 1.3 : 0.6)}" fill="none" stroke="#fff" stroke-width="1" opacity="0.6"/>`;
      }
    }
    s += k.arrow({ x1: 160 - dx * 30, y1: 30 - dyS * 8, x2: 160 + dx * 30, y2: 30 + dyS * 8, color: "#ffd166" }) + k.label({ x: 160, y: 50, text: v("direction"), size: 8, color: "#ffd166" });
    s += k.person({ x: 160, y: 158, s: 1.3, lean: touch * 6 * (dx || 1), arms: [0, 0.2, 0.6, 1][touch], mood: [0.3, 0.2, -0.3, -0.8][touch], color: "#e57373" });
    /* Rhythm and surges: a small intensity line and surge ticks. */
    const shape = [[0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5], [0.3, 0.7, 0.3, 0.7, 0.3, 0.7, 0.3, 0.7], [0.3, 0.3, 0.9, 0.3, 0.4, 0.95, 0.3, 0.3], [0.2, 0.9, 0.4, 0.1, 0.8, 0.3, 1, 0.2]][idx(v, "rhythm")];
    const pe = v.n("pulseEvery");
    s += `<rect x="6" y="6" width="110" height="36" rx="4" fill="rgba(0,0,0,0.45)"/>` + k.graph({ x: 12, y: 10, w: 98, h: 16, points: shape, color: "#9fd3ff", w2: 2 }) + tl(k, { x: 12, w: 98, y: 31, marks: pe > 0 ? Array.from({ length: Math.min(10, Math.floor(30 / pe)) }, (_, i) => ({ at: ((i + 1) * pe) / 30 })) : [] });
    return s + cap(k, `${v("setting")} · how much ${v("howMuch")} · speed ${v("speed")} · ${v("touches")}`);
  });

  /* ---------- repetition in the frame ---------- */
  W.look("repeatInFrame", (v, k) => {
    const rep = v.p("setting");
    const pat = idx(v, "pattern");
    const odd = idx(v, "oddOne");
    const rec = idx(v, "recede");
    const built = idx(v, "builtUp");
    const copies = Math.round(logp(v.n("copies") + 1, 1, 501) * 60);
    const gap = v.p("copyGap");
    const share = v.p("repeatShare");
    const R = 30 + share * 120;
    let s = k.bg("#16161c");
    const sp = k.lerp(0.7, 1.6, gap);
    for (let i = 0; i < copies; i++) {
      let x;
      let y;
      if (pat === 0) (x = 160 + (k.rnd(i + 3) - 0.5) * 2 * R), (y = 88 + (k.rnd(i + 8) - 0.5) * R * 0.9);
      else if (pat === 1) (x = 160 - R + (i % 10) * ((2 * R) / 9) * sp * 0.7), (y = 50 + Math.floor(i / 10) * 18 * sp);
      else if (pat === 2) {
        const c = Math.ceil(Math.sqrt(copies));
        (x = 160 - R + (i % c) * ((2 * R) / Math.max(1, c - 1)) * sp * 0.7), (y = 40 + Math.floor(i / c) * ((110 / c) * sp));
      } else {
        const a = i * 0.5;
        const r = 4 + i * (R / 60) * sp;
        (x = 160 + Math.cos(a) * r), (y = 88 + Math.sin(a) * r * 0.6);
      }
      /* Receding: further copies get smaller toward a vanishing point. */
      const depth = rec === 0 ? 0 : rec === 1 ? Math.min(1, (y - 30) / 120) * 0.5 : Math.min(1, (y - 30) / 120);
      const sz = 9 * (1 - depth * 0.75);
      if (rec > 0) x = 160 + (x - 160) * (1 - depth * 0.6);
      const alpha = built === 0 ? 1 : built === 1 ? 0.15 + (0.85 * (copies - i)) / copies : (Math.floor(i / 8) % 2 ? 0.35 : 1);
      const isOdd = odd > 0 && i === Math.floor(copies / 2);
      const col = isOdd ? k.mix("#7fb7ff", "#ff5252", odd / 3) : "#7fb7ff";
      /* each copy is a little figure (a head on a body), so the repeat reads as people or things in a row */
      const zw = sz * (isOdd ? 1 + odd * 0.3 : 1);
      if (y < 150 && y > 20) s += `<g opacity="${(alpha * k.lerp(0.25, 1, rep)).toFixed(2)}" fill="${col}"><circle cx="${x.toFixed(1)}" cy="${(y - sz * 0.55).toFixed(1)}" r="${(zw * 0.32).toFixed(1)}"/><rect x="${(x - zw * 0.35).toFixed(1)}" y="${(y - sz * 0.2).toFixed(1)}" width="${(zw * 0.7).toFixed(1)}" height="${(sz * 0.9).toFixed(1)}" rx="${(zw * 0.2).toFixed(1)}"/></g>`;
    }
    const ag = v.n("appearGap");
    s += k.person({ x: 28, y: 158, s: 0.62, color: "#e0a050", look: 1 });
    s += tl(k, { x: 70, w: 240, y: 6, label: "appear", marks: Array.from({ length: Math.min(16, ag > 0 ? Math.floor(5 / ag) + 1 : 16) }, (_, i) => ({ at: ag > 0 ? (i * ag) / 5 : 0, color: "#7fb7ff" })) });
    return s + cap(k, `${v("pattern")} · ${v("copies")} copies · ${v("copyGap")} m apart · odd one: ${v("oddOne")}`);
  });

  /* ---------- era and style of the place ---------- */
  W.look("setStyle", (v, k) => {
    const era = idx(v, "setting");
    const fam = idx(v, "styleFamily");
    const ceil = [62, 42, 24, 8, 0][idx(v, "ceiling")];
    const wealth = v.p("wealth");
    const sym = v.p("symmetry");
    const win = v.n("windows");
    const hue = [[30, 8], [25, 45], [210, 35], [35, 35], [320, 35], [0, 70]][idx(v, "colorFamily")];
    const personal = idx(v, "personal");
    const real = v.p("realism");
    const steal = v.p("styleSteal");
    const styled = v.p("styledShare");
    const wallC = k.hsl(hue[0], hue[1], 58);
    let s = k.bg("#141418");
    s += ceil === 0 ? k.sky(0.7) : `<rect x="0" y="0" width="320" height="${ceil}" fill="#2a2420"/>`;
    s += `<rect x="0" y="${ceil}" width="320" height="${150 - ceil}" fill="${wallC}"/>` + k.floor(150, k.mix("#6a5040", "#d8d0c4", wealth));
    /* Era features: columns, beams, saloon boards, wallpaper, gold lines, pastel curve, pipes, plain, neon. */
    const feat = [
      () => [40, 280].map((x) => `<rect x="${x - 8}" y="${ceil}" width="16" height="${150 - ceil}" fill="#e6e0d4" stroke="${k.INK}"/>`).join(""),
      () => Array.from({ length: 4 }, (_, i) => `<rect x="0" y="${ceil + 4 + i * 28}" width="320" height="5" fill="#5b3f2a"/>`).join(""),
      () => Array.from({ length: 16 }, (_, i) => `<line x1="${i * 20}" y1="${ceil}" x2="${i * 20}" y2="150" stroke="#7a5a3a" stroke-width="2"/>`).join(""),
      () => Array.from({ length: 30 }, (_, i) => `<circle cx="${(i % 10) * 32 + 16}" cy="${ceil + 14 + Math.floor(i / 10) * 30}" r="3" fill="#7a3a4a" opacity="0.5"/>`).join(""),
      () => `<path d="M0 ${ceil + 18} H320 M0 ${ceil + 24} H320" stroke="#e6c35a" stroke-width="2"/>`,
      () => `<rect x="0" y="110" width="320" height="40" fill="#8ac6c0"/>`,
      () => `<path d="M0 ${ceil + 10} H320 M30 ${ceil + 10} V150" stroke="#777" stroke-width="5" fill="none"/>`,
      () => "",
      () => `<path d="M0 140 H320" stroke="#5ff5ff" stroke-width="3"/><path d="M0 ${ceil + 6} H320" stroke="#ff5ff5" stroke-width="2"/>`,
    ][era]();
    s += feat;
    /* Windows, placed evenly when symmetric, jittered when not. */
    for (let i = 0; i < win; i++) {
      const x = 20 + ((i + 0.5) * 280) / win + (1 - sym) * (k.rnd(i + 4) - 0.5) * 50;
      s += k.window_({ x: x - 14, y: ceil + 12 + (1 - sym) * k.rnd(i + 9) * 20, w: 28, h: 32, light: 0.85 });
    }
    /* Furniture in the family's shape; two mirrored pieces when symmetric. */
    const sofa = (x, sc) =>
      [
        `<rect x="${x - 26}" y="${130}" width="52" height="20" fill="#7a5a3a" stroke="${k.INK}"/>`,
        `<path d="M${x - 26} 150 V128 Q${x} 116 ${x + 26} 128 V150 Z" fill="#a08060" stroke="${k.INK}"/>`,
        `<rect x="${x - 26}" y="128" width="52" height="22" fill="#666" stroke="${k.INK}"/><line x1="${x - 22}" y1="150" x2="${x - 22}" y2="160" stroke="#333" stroke-width="3"/>`,
        `<rect x="${x - 26}" y="132" width="52" height="12" rx="6" fill="#d98a3a" stroke="${k.INK}"/><line x1="${x - 18}" y1="144" x2="${x - 22}" y2="156" stroke="${k.INK}" stroke-width="2"/>`,
        `<rect x="${x - 26}" y="136" width="52" height="10" fill="#eee" stroke="${k.INK}"/>`,
        `<rect x="${x - 30}" y="124" width="60" height="26" rx="8" fill="#a03a6a" stroke="#e6c35a" stroke-width="3"/>`,
        `<ellipse cx="${x}" cy="138" rx="28" ry="10" fill="#cfe" stroke="#5ff"/>`,
        `<path d="M${x - 26} 150 Q${x - 30} 120 ${x} 126 Q${x + 30} 120 ${x + 26} 150 Z" fill="#6a5aa5" stroke="${k.INK}"/>`,
      ][fam];
    s += sofa(90 - (1 - sym) * 20) + sofa(230 + (1 - sym) * 30);
    /* Wealth: a chandelier and gold trim. Personal: photos and things on a shelf. */
    if (wealth > 0.4 && ceil > 0) s += `<circle cx="160" cy="${ceil + 16}" r="${6 + wealth * 10}" fill="#ffe08a" opacity="0.9"/>`;
    if (wealth > 0.7) s += `<rect x="0" y="146" width="320" height="4" fill="#e6c35a"/>`;
    for (let i = 0; i < personal * 4; i++) s += `<rect x="${140 + i * 10}" y="104" width="8" height="10" fill="${k.hsl(i * 70, 50, 60)}" stroke="${k.INK}"/>`;
    if (personal) s += `<rect x="134" y="114" width="${personal * 44}" height="3" fill="#5b3f2a"/>`;
    /* Styled pieces: little gold markers on the share of things that are styled. */
    for (let i = 0; i < Math.round(styled * 8); i++) s += k.dot({ x: 20 + i * 38, y: ceil + 4, r: 3, color: "#ffd166" });
    s += k.person({ x: 160, y: 158, s: 1.1, alpha: 1 - steal * 0.6, color: "#4a6fa5" });
    /* Real to dreamlike: a haze and a tilt. */
    s = `<g transform="skewX(${(real * 8).toFixed(1)}) translate(${(-real * 10).toFixed(1)} 0)">${s}</g>` + (real > 0.5 ? k.tint({ color: "#c8a0ff", alpha: (real - 0.5) * 0.6 }) : "");
    return s + cap(k, `${v("setting")} · ${v("styleFamily")} · ${v("wealth")} · ${v("realism")}`);
  });

  /* ---------- main material ---------- */
  W.look("setMaterial", (v, k) => {
    const m = idx(v, "setting");
    const tex = v.p("texture");
    const shine = v.p("shine");
    const age = idx(v, "ageMarks");
    const touch = idx(v, "touched");
    const share = v.p("materialShare");
    const near = v.p("nearestWall");
    const wallW = 60 + share * 260;
    const base = ["#6b4f35", "#a0703f", "#a8553d", "#9a9890", "#8a9098", "#bfe0ee", "#ecebe6"][m];
    let s = k.bg("#2a2a30") + `<rect x="0" y="0" width="${wallW}" height="150" fill="${base}"/>`;
    /* Pattern of each material. */
    let pat = "";
    if (m <= 1) for (let i = 0; i < 12; i++) pat += `<line x1="0" y1="${i * 13}" x2="${wallW}" y2="${i * 13}" stroke="#4a3020" stroke-width="${m === 0 ? 2.5 : 1}"/>`;
    if (m === 2) for (let r = 0; r < 11; r++) for (let c = 0; c < 12; c++) pat += `<rect x="${c * 28 - (r % 2) * 14}" y="${r * 14}" width="27" height="13" fill="none" stroke="#e6d6c6" stroke-width="1"/>`;
    if (m === 3) for (let r = 0; r < 5; r++) for (let c = 0; c < 6; c++) pat += `<rect x="${c * 56 - (r % 2) * 20}" y="${r * 30}" width="54" height="28" rx="4" fill="none" stroke="#5a5850" stroke-width="2"/>`;
    if (m === 4) for (let r = 0; r < 3; r++) for (let c = 0; c < 6; c++) pat += `<rect x="${c * 56}" y="${r * 50}" width="54" height="48" fill="none" stroke="#555" stroke-width="2"/><circle cx="${c * 56 + 5}" cy="${r * 50 + 5}" r="2" fill="#444"/>`;
    if (m === 5) for (let c = 0; c < 6; c++) pat += `<rect x="${c * 56}" y="0" width="54" height="150" fill="none" stroke="#7aa" stroke-width="3"/>`;
    if (m === 6) for (let i = 0; i < 6; i++) pat += `<path d="M${i * 60} 0 q20 40 -10 80 t20 70" fill="none" stroke="#bbb" stroke-width="1"/>`;
    s += `<clipPath id="cw-setMaterial-clip"><rect x="0" y="0" width="${wallW}" height="150"/></clipPath><g clip-path="url(#cw-setMaterial-clip)">${pat}`;
    /* Rough to polished: speckle that thins out. Shine: a white streak. Age: cracks. */
    const speck = Math.round((1 - tex) * 120);
    for (let i = 0; i < speck; i++) s += `<rect x="${(k.rnd(i + 1) * wallW).toFixed(1)}" y="${(k.rnd(i + 2) * 150).toFixed(1)}" width="2" height="2" fill="#000" opacity="0.3"/>`;
    if (shine > 0) s += `<path d="M${wallW * 0.2} 0 L${wallW * 0.35} 0 L${wallW * 0.1} 150 L${wallW * -0.05} 150 Z" fill="#fff" opacity="${(shine * 0.45).toFixed(2)}"/><path d="M${wallW * 0.5} 0 L${wallW * 0.55} 0 L${wallW * 0.4} 150 L${wallW * 0.35} 150 Z" fill="#fff" opacity="${(shine * 0.3).toFixed(2)}"/>`;
    for (let i = 0; i < [0, 2, 5, 9][age]; i++) {
      const x = k.rnd(i + 40) * wallW;
      const y = k.rnd(i + 41) * 130;
      s += `<path d="M${x.toFixed(1)} ${y.toFixed(1)} l6 8 l-4 6 l7 10 l-3 6" fill="none" stroke="#222" stroke-width="1.5"/>`;
    }
    if (age === 3) s += `<path d="M0 150 L20 130 L40 150 Z M${wallW - 50} 150 l14 -16 l20 16 Z" fill="#555"/>`;
    s += `</g>` + k.floor(150, "#3b332b");
    /* The person, nearer the wall or further out; touching it more and more. */
    const px = 30 + near * 220;
    s += k.person({ x: px, y: 156, s: 1.2, arms: touch >= 2 ? 0.4 : touch === 1 ? 0.1 : -0.2, lean: touch === 2 ? -10 : 0, look: -1, color: "#4a6fa5" });
    if (touch >= 1) s += k.hand({ x: Math.max(18, px - 30), y: 100, s: 0.4, open: 1 });
    if (touch === 3) s += k.arrow({ x1: px - 10, y1: 80, x2: px - 46, y2: 60 });
    s += k.arrow({ x1: px - 8, y1: 154, x2: 6, y2: 154, color: "#ffd166", w: 1.5 }) + k.text({ x: (px + 6) / 2, y: 149, text: `${v("nearestWall")} m`, size: 8, color: "#ffd166", weight: 700, outline: "#1c1712", outlineW: 2.5 });
    return s + cap(k, `${v("setting")} · ${v("texture")} · shine ${v("shine")} · ${v("ageMarks")} marks · ${v("materialShare")}% of frame`);
  });

  /* ---------- soft curves to sharp lines ---------- */
  W.look("setLines", (v, k) => {
    const sharp = v.p("setting");
    const corners = v.n("corners");
    const lead = v.p("leadEye");
    const shape = idx(v, "shapes");
    const tilt = v.n("lineTilt");
    const vx = 20 + v.p("meetAcross") * 280;
    const vy = 160 - v.p("meetUp") * 150;
    const target = [160, 120];
    let s = k.bg("#1b1b22");
    /* Lines from the edges toward where they meet; the more they lead, the closer that point pulls to the person. */
    const mx = k.lerp(vx, target[0], lead * 0.8);
    const my = k.lerp(vy, target[1] - 30, lead * 0.8);
    const ends = [[0, 0], [80, 0], [240, 0], [320, 0], [0, 180], [320, 180], [0, 90], [320, 90]];
    s += `<g transform="rotate(${tilt * 0.5} 160 90)">`;
    ends.forEach(([x, y], i) => {
      const cx = (x + mx) / 2 + (1 - sharp) * (i % 2 ? 40 : -40);
      const cy = (y + my) / 2 + (1 - sharp) * 30;
      s += `<path d="M${x} ${y} Q${cx.toFixed(1)} ${cy.toFixed(1)} ${mx.toFixed(1)} ${my.toFixed(1)}" fill="none" stroke="${k.mix("#d9a066", "#9fd3ff", sharp)}" stroke-width="2" opacity="0.8"/>`;
    });
    /* Doorway and arch: round-topped when soft, square when sharp. */
    const r = (1 - sharp) * 30;
    s += `<rect x="40" y="40" width="60" height="110" rx="${r.toFixed(1)}" fill="none" stroke="#d9cbb5" stroke-width="4"/><rect x="220" y="40" width="60" height="110" rx="${r.toFixed(1)}" fill="none" stroke="#d9cbb5" stroke-width="4"/>`;
    s += `</g>`;
    /* Sharp corners: little triangles. Repeated shapes along the floor. */
    for (let i = 0; i < corners; i++) s += `<path d="M${120 + i * 18} 30 l8 -14 l8 14 Z" fill="#ff8a80"/>`;
    for (let i = 0; i < 8 && shape > 0; i++) {
      const x = 20 + i * 40;
      s += [null, `<circle cx="${x}" cy="160" r="6" fill="#ffd166"/>`, `<rect x="${x - 6}" y="154" width="12" height="12" fill="#ffd166"/>`, `<path d="M${x - 7} 166 l7 -12 l7 12 Z" fill="#ffd166"/>`, `<rect x="${x - 10}" y="156" width="20" height="4" fill="#ffd166"/><rect x="${x - 10}" y="163" width="20" height="4" fill="#ffd166"/>`][shape];
    }
    s += k.dot({ x: mx, y: my, r: 4, color: "#fff" });
    s += k.person({ x: target[0], y: 158, s: 1.1, color: "#4a6fa5" });
    return s + cap(k, `${v("setting")} · ${corners} corners · lines ${v("leadEye")} · tilt ${tilt}°`);
  });

  /* ---------- art on the walls ---------- */
  function artPiece(k, kind, x, y, w, h, meaning) {
    const inner = [
      `<rect x="${x + 2}" y="${y + 2}" width="${w - 4}" height="${h - 4}" fill="#7fb7d9"/><path d="M${x + 2} ${y + h - 2} l${w * 0.4} ${-h * 0.5} l${w * 0.6 - 4} ${h * 0.5 - 0}" fill="#5a8a4a"/>`,
      `<rect x="${x + 2}" y="${y + 2}" width="${w - 4}" height="${h - 4}" fill="#ddd"/><circle cx="${x + w / 2}" cy="${y + h * 0.45}" r="${Math.min(w, h) * 0.2}" fill="#888"/>`,
      `<rect x="${x + 2}" y="${y + 2}" width="${w - 4}" height="${h - 4}" fill="#e85d4a"/><rect x="${x + 5}" y="${y + h * 0.3}" width="${w - 10}" height="${h * 0.12}" fill="#fff"/>`,
      `<rect x="${x + 2}" y="${y + 2}" width="${w - 4}" height="${h - 4}" fill="#cfe6f0"/><path d="M${x + 4} ${y + h - 4} L${x + w - 4} ${y + 4}" stroke="#fff" stroke-width="2"/>`,
      `<circle cx="${x + w / 2}" cy="${y + h / 2}" r="${Math.min(w, h) * 0.35}" fill="#c9a24a"/>`,
    ][kind];
    const tag = meaning > 1 ? `<circle cx="${x + w - 3}" cy="${y + 3}" r="${meaning}" fill="#ff5252"/>` : "";
    return (kind === 4 ? "" : `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#5b3f2a"/>`) + inner + tag;
  }
  W.look("wallArt", (v, k) => {
    const amt = v.n("setting");
    const kind = idx(v, "artKind");
    const size = [10, 18, 26, 36, 52][idx(v, "artSize")];
    const meaning = idx(v, "artMeaning");
    const count = v.n("pieceCount");
    const eyeY = 74;
    const dy = -v.n("vsEyes") * 18;
    const back = v.p("artDistance");
    const sc = k.lerp(1.2, 0.55, back);
    let s = k.wall({ y: 140, color: "#cfc2ab", floor: "#7a6250" });
    /* The main pieces at their height against the eyes; smaller when the wall is further behind. */
    const w = size * sc;
    const xs = [60, 260, 30, 290, 200].slice(0, amt);
    xs.forEach((x, i) => (s += artPiece(k, kind, x - w / 2, eyeY + dy - w * 0.4 + (i % 2) * 6, w, w * 0.8, meaning)));
    /* The many small pieces: rows of little frames at the same height against the eyes. */
    for (let i = 0; i < Math.min(40, count); i++) s += artPiece(k, kind, 90 + (i % 10) * 14, eyeY + dy - 16 + Math.floor(i / 10) * 12, 10 * sc, 8 * sc, 0);
    s += `<line x1="0" y1="${eyeY}" x2="320" y2="${eyeY}" stroke="#4a6fa5" stroke-dasharray="4 4" opacity="0.6"/>` + k.label({ x: 316, y: eyeY - 3, text: "eyes", size: 7.5, color: "#4a6fa5", anchor: "end" });
    s += k.person({ x: 160, y: 158, s: 1.4, color: "#4a6fa5" });
    if (meaning === 3) s += k.arrow({ x1: 80, y1: eyeY + dy, x2: 140, y2: 70, color: "#ff5252", w: 1.5 });
    return s + cap(k, `${v("artKind")} · ${v("artSize")} · ${count} pieces · ${v("artMeaning")} · ${v("artDistance")} m behind`);
  });

  /* ---------- how the art is arranged ---------- */
  W.look("artArrangement", (v, k) => {
    const how = idx(v, "setting");
    const crook = 1 - v.p("straightness");
    const gap = 2 + v.p("spacing") * 10 + v.p("artGap") * 14;
    const center = idx(v, "centerpiece");
    const frames = idx(v, "framesFaces");
    const rows = Math.max(1, v.n("artRows"));
    const ghost = how === 0;
    const off = v.n("centerOffset") / 100;
    let s = k.wall({ y: 150, color: "#cfc2ab", floor: "#7a6250" });
    const pw = 22;
    const ph = 16;
    const perRow = Math.max(1, Math.floor(300 / (pw + gap)));
    const shown = Math.min(rows, 6);
    for (let r = 0; r < shown; r++)
      for (let c = 0; c < perRow; c++) {
        const i = r * perRow + c;
        let x = 10 + c * (pw + gap);
        let y = 14 + r * (ph + gap * 0.6);
        if (how === 1) (x += (k.rnd(i + 1) - 0.5) * 30), (y += (k.rnd(i + 2) - 0.5) * 24);
        if (how === 2) (x += Math.floor(c / 3) * 8), (y += (c % 3) * 3);
        if (how === 3) y += (k.rnd(i + 5) - 0.5) * 4;
        if (y > 128 || x > 300) continue;
        if (how === 2 && c % 4 === 3) continue;
        const rot = (k.rnd(i + 7) - 0.5) * 24 * crook;
        s += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${pw}" height="${ph}" fill="${ghost ? "none" : "#7fb7d9"}" stroke="${ghost ? "#8a7a6a" : "#5b3f2a"}" stroke-width="2"${ghost ? ' stroke-dasharray="3 2"' : ""} transform="rotate(${rot.toFixed(1)} ${(x + pw / 2).toFixed(1)} ${(y + ph / 2).toFixed(1)})"/>`;
      }
    if (center === 0) s += `<rect x="${160 + off * 120 - 18}" y="58" width="36" height="25" fill="none" stroke="#8a7a6a" stroke-dasharray="3 2"/>`;
    if (center > 0) {
      const cw = center === 1 ? 36 : 58;
      const cx = 160 + off * 120;
      s += `<rect x="${cx - cw / 2}" y="${70 - cw * 0.35}" width="${cw}" height="${cw * 0.7}" fill="#e6c35a" stroke="#5b3f2a" stroke-width="3" transform="rotate(${(crook * 8).toFixed(1)} ${cx} 70)"/>`;
    }
    /* The person, and a frame around their face when the art frames them. */
    s += k.person({ x: 160, y: 158, s: 1.5, color: "#4a6fa5" });
    if (frames > 0) s += `<rect x="134" y="${76}" width="52" height="40" fill="none" stroke="#5b3f2a" stroke-width="${frames * 3}" opacity="${frames === 1 ? 0.5 : 1}"/>`;
    return s + cap(k, `${v("setting")} · ${v("straightness")} · ${rows} rows · ${v("artGap")} cm gaps`);
  });

  /* ---------- clutter ---------- */
  W.look("clutter", (v, k) => {
    const lvl = v.p("setting");
    const kind = idx(v, "mess");
    const order = v.p("order");
    const way = idx(v, "inTheWay");
    const piles = idx(v, "pilesUp");
    const n = Math.round(lvl * 25 + logp(v.n("itemCount") + 1, 1, 501) * 45);
    const clear = v.p("clearFloor");
    const reach = v.p("clutterReach");
    let s = k.wall({ y: 100, color: "#bfb3a0", floor: "#6f5a48" });
    const pathW = clear * 140;
    s += `<path d="M${160 - pathW / 2} 180 L${160 - pathW / 6} 100 L${160 + pathW / 6} 100 L${160 + pathW / 2} 180 Z" fill="#8a7460"/>`;
    const px = 160;
    const item = (x, y, i) => {
      const r = (1 - order) * (k.rnd(i + 3) - 0.5) * 80;
      const c = k.hsl((kind * 60 + k.rnd(i) * 30) % 360, 40, 55);
      const sh = [`<rect x="-6" y="-4" width="12" height="8" fill="#f4f1ea" stroke="${k.INK}" stroke-width="0.6"/>`, `<ellipse cx="0" cy="0" rx="7" ry="3" fill="#eee" stroke="${k.INK}" stroke-width="0.6"/>`, `<path d="M-7 -3 L7 -3 L5 4 L-5 4 Z" fill="${c}"/>`, `<rect x="-8" y="-1.5" width="16" height="3" fill="#888"/><rect x="5" y="-4" width="4" height="8" fill="#555"/>`, `<rect x="-5" y="-5" width="10" height="10" fill="${c}" stroke="${k.INK}" stroke-width="0.6"/>`, `<circle cx="0" cy="0" r="4" fill="${c}" stroke="${k.INK}" stroke-width="0.6"/>`][kind];
      return `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${r.toFixed(1)})">${sh}</g>`;
    };
    for (let i = 0; i < n; i++) {
      /* Organized hoards stack in neat rows; chaos spreads everywhere. Stay off the clear path. */
      let x;
      let y;
      if (order > 0.9) (x = 14 + (i % 14) * 6 + (i % 28 >= 14 ? 220 : 0)), (y = 154 - Math.floor(i / 28) * 7);
      else {
        x = k.rnd(i + 11) * 320;
        y = 104 + k.rnd(i + 12) * 52;
        const halfAt = (pathW / 2) * ((y - 100) / 80) + 6;
        if (Math.abs(x - 160) < halfAt && way === 0) x = x < 160 ? 160 - halfAt - 6 : 160 + halfAt + 6;
      }
      /* Mess within reach: the closest pieces are pulled to the person. */
      if (i < 6) (x = px + (i % 2 ? 1 : -1) * (14 + reach * 110)), (y = 146 + (i % 3) * 5);
      s += item(x, y, i);
    }
    /* Piles up over the film: a heap that grows. */
    const heap = [0, 10, 26, 46][piles];
    if (heap) s += `<path d="M230 100 Q260 ${100 - heap} 300 100 Z" fill="${k.hsl(kind * 60, 30, 45)}" stroke="${k.INK}"/>`;
    if (piles === 0) s += k.arrow({ x1: 270, y1: 90, x2: 300, y2: 70, color: "#7fd1ae" });
    s += k.person({ x: px, y: 158, s: 1.3, lean: way === 3 ? 18 : way * 3, mood: way >= 2 ? -0.6 : 0.2, arms: way === 3 ? 0.9 : 0, color: "#4a6fa5" });
    return s + cap(k, `clutter ${v("setting")} · ${v("itemCount")} things · ${v("mess")} · ${v("order")} · ${v("clearFloor")}% clear`);
  });

  /* ---------- run down to spotless ---------- */
  W.look("setUpkeep", (v, k) => {
    const keep = v.p("setting");
    const dust = v.p("dust");
    const rep = idx(v, "repairs");
    const decay = idx(v, "decay");
    const years = logp(v.n("yearsSince") + 1, 1, 201);
    const dmg = v.p("damagedShare");
    const paint = k.mix(k.mix("#e6d6b8", "#a89880", years), "#6a5a48", 1 - keep);
    let s = k.wall({ y: 130, color: paint, floor: k.mix("#3b332b", "#9a8a70", keep) });
    /* Damage: cracks and peeled patches over that share of the wall. */
    for (let i = 0; i < Math.round(dmg * 16); i++) {
      const x = k.rnd(i + 3) * 300;
      const y = k.rnd(i + 4) * 110;
      s += `<path d="M${x.toFixed(1)} ${y.toFixed(1)} q8 4 6 12 q-6 8 4 14 l-14 -2 Z" fill="#7a6a58" opacity="0.8"/>`;
    }
    for (let i = 0; i < Math.round((1 - keep) * 6); i++) s += `<path d="M${30 + i * 50} 0 l6 18 l-4 10 l8 20" fill="none" stroke="#3a2a1a" stroke-width="1.5"/>`;
    /* Repairs: tape, patches, scaffolding, fresh paint. */
    if (rep === 1) s += `<rect x="60" y="40" width="30" height="8" fill="#e6e0c0" transform="rotate(-20 75 44)"/><rect x="220" y="70" width="24" height="24" fill="#b9a07e" stroke="#5b3f2a"/>`;
    if (rep === 2) s += `<path d="M200 10 V130 M250 10 V130 M200 50 H250 M200 90 H250" stroke="#999" stroke-width="3"/><rect x="100" y="20" width="60" height="60" fill="#f2ece0"/>`;
    if (rep === 3) s += `<rect x="0" y="0" width="160" height="130" fill="#f6f2ea" opacity="0.85"/><rect x="150" y="100" width="20" height="30" fill="#f6f2ea" stroke="#999"/>`;
    s += k.window_({ x: 240, y: 30, w: 50, h: 40, light: k.lerp(0.35, 0.95, keep) - dust * 0.3 });
    s += k.person({ x: 120, y: 158, s: 1.2, color: "#4a6fa5" });
    /* Dust and grime: a brown film and floating specks. */
    s += k.tint({ color: "#6a5030", alpha: dust * 0.35 }) + Array.from({ length: Math.round(dust * 40) }, (_, i) => k.dot({ x: k.rnd(i + 70) * 320, y: k.rnd(i + 71) * 160, r: 1, color: "#e6d0a0" })).join("");
    /* Over the film: a small trend line. Years since done up: a calendar badge. */
    const tr = [[0.2, 0.5, 0.8], [0.5, 0.5, 0.5], [0.6, 0.45, 0.3], [0.8, 0.4, 0.05]][decay];
    s += `<rect x="6" y="6" width="80" height="34" rx="4" fill="rgba(0,0,0,0.5)"/>` + k.graph({ x: 12, y: 10, w: 68, h: 18, points: tr, color: decay === 0 ? "#7fd1ae" : "#ff8a80", w2: 2 }) + k.label({ x: 46, y: 36, text: "over the film", size: 7, color: "#ddd" });
    s += chip(k, 314, 20, `done up ${v("yearsSince")} yrs ago`, "#ffd166", "end");
    return s + cap(k, `${v("setting")} · dust ${v("dust")} · ${v("repairs")} · ${v("damagedShare")}% damaged`);
  });

  /* ---------- layers behind the people ---------- */
  W.look("setDepth", (v, k) => {
    const layers = [0, 1, 3, 5][idx(v, "setting")];
    const life = idx(v, "backLife");
    const doors = v.n("doorways");
    const pull = v.p("depthPull");
    const see = logp(v.n("seeDepth"), 0.3, 1000);
    const first = logp(v.n("firstLayer") + 0.3, 0.3, 50.3);
    const bp = Math.round(logp(v.n("backPeople") + 1, 1, 201) * 30);
    let s = k.bg(k.mix("#4a4038", "#9fb4c8", see));
    /* Each layer is a flat further back: smaller, lighter, hazier. */
    for (let i = layers; i >= 1; i--) {
      const d = first + ((i - 1) / Math.max(1, layers)) * (1 - first) * see;
      const h = k.lerp(130, 30, d);
      const y = k.lerp(30, 110, d);
      s += `<rect x="${(160 - k.lerp(150, 50, d)).toFixed(1)}" y="${y.toFixed(1)}" width="${(k.lerp(300, 100, d)).toFixed(1)}" height="${h.toFixed(1)}" fill="${k.mix("#5a4a3a", "#c8c0b0", d)}" stroke="${k.INK}" opacity="${k.lerp(1, 0.6, d).toFixed(2)}"/>`;
    }
    /* Frames within frames: nested doorways in the middle. */
    for (let i = 0; i < doors; i++) s += `<rect x="${200 + i * 7}" y="${40 + i * 8}" width="${70 - i * 14}" height="${110 - i * 16}" fill="none" stroke="#2a2016" stroke-width="5"/>`;
    /* People in the background: still or busy. */
    for (let i = 0; i < bp; i++) s += k.person({ x: 20 + k.rnd(i + 2) * 280, y: k.lerp(150, 120, see) - k.rnd(i + 3) * 20, s: k.lerp(0.5, 0.25, see), walk: life >= 2 ? 1 : 0, arms: life === 3 ? (i % 2 ? 1 : -0.5) : 0, color: life === 0 ? "#555" : k.hsl(k.rnd(i) * 360, 30, 50), alpha: life === 0 ? 0.3 : k.lerp(0.5, 1, pull) });
    /* Background pulling focus: the foreground person fades a little, the back brightens. */
    s += k.tint({ color: "#000", alpha: (1 - pull) * 0.3 });
    s += k.person({ x: 90, y: 178, s: 2, color: "#4a6fa5", alpha: 1 - pull * 0.4 });
    s += k.arrow({ x1: 116, y1: 120, x2: 116 + first * 120, y2: 120, color: "#ffd166", w: 1.5 }) + k.label({ x: 116 + first * 60, y: 114, text: `${v("firstLayer")} m`, size: 8, color: "#ffd166" });
    return s + cap(k, `${v("setting")} · see ${v("seeDepth")} m back · ${v.n("backPeople")} people · ${v("backLife")}`);
  });

  /* ---------- dark to bright colors ---------- */
  W.look("setBrightness", (v, k) => {
    const b = v.p("setting");
    const con = v.p("contrast");
    const pop = v.p("popOut");
    const acc = [0, 1, 3, 7][idx(v, "accent")];
    const dark = idx(v, "darkens");
    const refl = v.p("wallReflect");
    const face = v.n("faceVsWall");
    const wallC = k.mix("#1c1a18", "#f2ece0", b);
    let s = k.wall({ y: 130, color: wallC, floor: k.mix("#100e0c", "#c8bca8", b) });
    for (let i = 0; i < 5; i++) s += `<rect x="${i * 64}" y="0" width="32" height="130" fill="${con > 0 ? (b > 0.5 ? "#000" : "#fff") : wallC}" opacity="${(con * 0.4).toFixed(2)}"/>`;
    for (let i = 0; i < acc; i++) s += `<rect x="${20 + i * 42}" y="${40 + (i % 2) * 30}" width="14" height="14" fill="${["#ff3d3d", "#ffd23d", "#3dd6ff"][i % 3]}"/>`;
    /* The light walls give back: a soft glow on the person's side. */
    s += `<ellipse cx="150" cy="110" rx="70" ry="60" fill="#fff6e0" opacity="${(refl * 0.3).toFixed(2)}"/>`;
    /* The face: brighter or darker than the wall by the stops; the body pops or sinks. */
    const bodyC = k.mix(wallC, pop > 0.5 ? (b > 0.5 ? "#1a2a4a" : "#9fd3ff") : "#4a6fa5", 0.2 + pop * 0.8);
    const skin = k.mix("#000000", "#f0c8a0", k.clamp(0.5 + b * 0.3 + face / 6, 0.05, 1));
    s += `<g>${k.person({ x: 160, y: 158, s: 1.6, color: bodyC, skin })}</g>`;
    if (pop === 1) s += `<rect x="134" y="54" width="52" height="120" fill="none" stroke="#fff" stroke-width="1" opacity="0.4"/>`;
    s += `<rect x="248" y="30" width="60" height="30" rx="4" fill="rgba(0,0,0,0.55)"/>` + k.arrow({ x1: 256, y1: 45, x2: 300, y2: 45, color: ["#fff6c0", "#999", "#444"][dark] }) + k.label({ x: 278, y: 56, text: v("darkens"), size: 7.5, color: "#eee" });
    return s + cap(k, `${v("setting")} · contrast ${v("contrast")} · faces ${face >= 0 ? "+" : ""}${face} stops · ${v("popOut")}`);
  });

  /* ---------- scattered things on the ground ---------- */
  W.look("scatterLens", (v, k) => {
    const how = v.p("how");
    const what = idx(v, "what");
    const spr = idx(v, "spread");
    const sizes = v.p("sizes");
    const moves = idx(v, "moves");
    const path = idx(v, "clearPath");
    const dist = idx(v, "disturbed");
    const n = Math.round(how * 40 + logp(v.n("perSquareMeter") + 1, 1, 501) * 60);
    const size = logp(v.n("pieceSize"), 0.5, 500);
    const pathFull = 6 + v.p("pathWidth") * 90;
    const pw = path === 0 ? 0 : (path === 1 ? 0.4 : 1) * pathFull;
    let s = k.sky(0.7) + k.floor(70, "#6a7a4a");
    if (!pw) s += `<path d="M${160 - pathFull} 180 L${160 - pathFull * 0.15} 70 M${160 + pathFull * 0.15} 70 L${160 + pathFull} 180" stroke="#d9cbb5" stroke-width="1" stroke-dasharray="3 4" opacity="0.6"/>`;
    if (pw) s += `<path d="M${160 - pw} 180 L${160 - pw * 0.15} 70 L${160 + pw * 0.15} 70 L${160 + pw} 180 Z" fill="#a08a64" opacity="${path === 1 ? 0.5 : 1}"/>`;
    const draw = (x, y, sc, i) => {
      const sway = moves === 1 ? Math.sin(i) * 14 : moves === 2 ? i * 37 : 0;
      const g = (t) => `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${sway.toFixed(0)}) scale(${sc.toFixed(2)})">${t}</g>`;
      return g([`<path d="M0 0 l-2 -8 M0 0 l0 -10 M0 0 l3 -8" stroke="#3f7a2a" stroke-width="1.5"/>`, `<ellipse cx="0" cy="-2" rx="5" ry="3.5" fill="#888" stroke="${k.INK}" stroke-width="0.6"/>`, `<ellipse cx="0" cy="-2" rx="5" ry="2.5" fill="#c46a2a"/>`, `<rect x="-4" y="-5" width="8" height="5" fill="#ddd" stroke="#888" stroke-width="0.6"/>`, `<circle cx="0" cy="-4" r="3" fill="#ff7aa8"/><line x1="0" y1="0" x2="0" y2="-2" stroke="#3f7a2a"/>`, `<rect x="-1" y="-10" width="2" height="10" fill="#5b3f2a"/><circle cx="0" cy="-13" r="6" fill="#3f7a46"/>`][what]);
    };
    for (let i = 0; i < n; i++) {
      let x;
      let y;
      if (spr === 0) {
        const c = i % 4;
        (x = 40 + c * 80 + (k.rnd(i + 1) - 0.5) * 40), (y = 90 + (c % 2) * 50 + (k.rnd(i + 2) - 0.5) * 30);
      } else if (spr === 1) (x = k.rnd(i + 1) * 320), (y = 72 + k.rnd(i + 2) * 108);
      else (x = ((i * 37) % 320) + 6), (y = 74 + ((Math.floor((i * 37) / 320) * 13) % 104));
      const d = (y - 70) / 110;
      const halfAt = pw * (0.15 + 0.85 * d);
      if (pw && Math.abs(x - 160) < halfAt) continue;
      const sc = (0.4 + size * 2.2) * (0.4 + d) * (1 + (k.rnd(i + 9) - 0.5) * sizes * 1.6);
      s += draw(x, y, Math.max(0.15, sc), i);
    }
    s += k.person({ x: 160, y: 158, s: 1.3, walk: dist >= 2 ? 1 : 0.3, mood: dist === 3 ? -0.5 : 0.2, color: "#4a6fa5" });
    for (let i = 0; i < dist * 3; i++) s += draw(150 + (i % 2 ? 24 : -24) + i * 2, 150 - i * 8, 0.8, i + 100);
    if (moves === 2) s += k.arrow({ x1: 20, y1: 60, x2: 70, y2: 60, color: "#fff", w: 1.5 });
    return s + cap(k, `${v("what")} · ${v("perSquareMeter")} per m² · ${v("pieceSize")} cm · ${v("spread")} · ${v("moves")}`);
  });

  /* ---------- dot grids for pairs that belong together ---------- */
  const pad = (id, x, y, xLabel, yLabel) => W.add(id, { window: { faces: [{ face: "pad", x, y, xLabel, yLabel }] } });
  pad("temperature", "degrees", "shown", "How hot or cold", "How it shows");
  pad("intExt", "exitDistance", "insideShare", "Distance to the way out", "Time spent inside");
  pad("setStyle", "symmetry", "windows", "Symmetry", "Windows");
  pad("wallArt", "artDistance", "vsEyes", "Art behind the head", "Above or below their eyes");
  pad("clutter", "itemCount", "clearFloor", "Things lying around", "Clear floor");
  pad("setUpkeep", "yearsSince", "damagedShare", "Years since done up", "Share damaged");
  pad("setBrightness", "wallReflect", "faceVsWall", "Light the walls give back", "Faces brighter than walls");
  pad("setting", "placeInFrame", "timeHere", "Place's share of the frame", "Share of the film here");
})(typeof window !== "undefined" ? window.CuriosityWindows : require("./windows.js"));
