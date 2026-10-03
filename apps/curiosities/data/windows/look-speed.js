/* Speed: the live picture at the top of each speed curiosity's window (CuriosityWindows.look). */
(function (W) {
  /* ---------- small shared drawing pieces ---------- */
  const R = (n, d) => {
    const m = Math.pow(10, d == null ? 1 : d);
    return Math.round(n * m) / m;
  };
  const sm = (k, x, y, t, o) => k.label(Object.assign({ x, y, text: t, size: 8, color: "#bbb", anchor: "start" }, o || {}));
  const ln = (x1, y1, x2, y2, c, w, dash) => `<line x1="${R(x1)}" y1="${R(y1)}" x2="${R(x2)}" y2="${R(y2)}" stroke="${c || "#888"}" stroke-width="${w || 1}"${dash ? ` stroke-dasharray="${dash}"` : ""} stroke-linecap="round"/>`;
  const box = (x, y, w, h, fill, stroke, rx, op) => `<rect x="${R(x)}" y="${R(y)}" width="${R(Math.max(0.5, w))}" height="${R(Math.max(0.5, h))}" rx="${rx || 0}" fill="${fill || "none"}"${stroke ? ` stroke="${stroke}"` : ""}${op != null ? ` opacity="${R(op, 2)}"` : ""}/>`;
  const poly = (pts, c, w, fill, dash) => `<polyline points="${pts.map((p) => R(p[0]) + "," + R(p[1])).join(" ")}" fill="${fill || "none"}" stroke="${c || "#ffd166"}" stroke-width="${w || 2}" stroke-linejoin="round" stroke-linecap="round"${dash ? ` stroke-dasharray="${dash}"` : ""}/>`;
  function chip(k, x, y, t, fill) {
    const w = Math.max(18, String(t).length * 4.3 + 10);
    return `<rect x="${R(x)}" y="${R(y - 9)}" width="${R(w)}" height="12" rx="6" fill="${fill || "#2c2c34"}" stroke="#555" stroke-width="0.8"/>` + k.label({ x: x + w / 2, y, text: t, size: 7.5, color: "#eee" });
  }
  function shot(k, id, x, y, w, inner, stroke) {
    const s = w / 320;
    return `<g transform="translate(${R(x)} ${R(y)}) scale(${R(s, 4)})"><clipPath id="${id}"><rect x="0" y="0" width="320" height="180"/></clipPath><g clip-path="url(#${id})">${inner}</g><rect x="0" y="0" width="320" height="180" fill="none" stroke="${stroke || "#888"}" stroke-width="${R(1.5 / s)}"/></g>`;
  }
  const idx = (v, id) => {
    const s = v.slider(id);
    return s && Array.isArray(s.scale) ? Math.max(0, s.scale.indexOf(v(id))) : 0;
  };
  const fig = (k, x, feet, h, o) => k.person(Object.assign({ x, y: feet, s: h / 76 }, o || {}));
  const room = (k, y) => k.wall({ y, color: "#3a3640", floor: "#2a2520" });
  /* Shot lengths along a strip. */
  function shots(lengths, x, y, w, h, colorOf) {
    const tot = lengths.reduce((a, b) => a + b, 0) || 1;
    let at = x;
    return lengths
      .map((l, i) => {
        const ww = (l / tot) * w;
        const r = box(at, y, Math.max(0.6, ww - 1), h, colorOf ? colorOf(i) : i % 2 ? "#6c8fb8" : "#8fb2d8", "#1c1712");
        at += ww;
        return r;
      })
      .join("");
  }
  /* A runner trailed by ghosts: close ghosts read slow, far apart read fast. */
  function runner(k, x, feet, h, speed, color) {
    const n = Math.max(2, Math.min(9, Math.round(6 / Math.sqrt(Math.max(0.1, speed)))));
    const gap = 12 * Math.sqrt(Math.max(0.05, speed));
    const out = [];
    for (let i = n; i >= 1; i--) out.push(`<g opacity="${R(0.45 - i * 0.04, 2)}">${fig(k, x - i * gap, feet, h, { walk: 1, lean: 8, color: color || "#4a6fa5" })}</g>`);
    return out.join("") + fig(k, x, feet, h, { walk: 1, lean: 8, color: color || "#4a6fa5" });
  }
  const SKY = "#141418";

  /* Freeze frame: a jump caught mid-air, how the frozen picture changes, and where the freezes fall. */
  W.look("freezeFrame", (v, k) => {
    const mode = idx(v, "setting");
    const on = v("onWhat");
    const lc = idx(v, "lookChange");
    const zoom = v.n("zoom") / 100;
    /* The zoom aims somewhere on the subject, so even an extreme corner keeps them partly in the picture. */
    const zx = 160 + (v.n("zoomX") / 100 - 0.5) * 160;
    const zy = 90 - (v.n("zoomY") / 100 - 0.5) * 80;
    const pose = on === "a face" ? k.face({ x: 160, y: 90, r: 55, mood: 0.6, mouth: 0.3 }) : on === "a reaction" ? k.face({ x: 160, y: 90, r: 55, mood: -0.2, brows: 1, eyes: 1, mouth: 0.8 }) : fig(k, 160, on === "a mid-air jump" ? 120 : 160, 120, { arms: 1, walk: on === "a mid-air jump" ? 1 : 0.4, mood: 0.6, color: "#4a6fa5" }) + (on === "a mid-air jump" ? `<ellipse cx="160" cy="165" rx="30" ry="5" fill="#000" opacity="0.4"/>` : "");
    const sc = 1 + zoom * 1.2;
    let pic = `<g transform="translate(${R(zx)} ${R(zy)}) scale(${R(sc, 2)}) translate(${R(-zx)} ${R(-zy)})">${room(k, 140)}${pose}</g>`;
    if (lc === 1) pic += box(0, 0, 320, 180, "#808080", null, 0, 0.35);
    if (lc === 2) pic = `<g filter="url(#cw-ff-gray)">${pic}</g>`;
    if (lc === 3) pic = `<g filter="url(#cw-ff-ink)">${pic}</g>` + box(0, 0, 320, 180, "#f4f1ea", null, 0, 0.35);
    const ghost = mode === 0;
    const title = mode === 3 ? k.text({ x: 20, y: 160, text: "Meet Sam.", size: 26, color: "#ffd166", weight: 700, anchor: "start", outline: "#000" }) : "";
    const frozen = (ghost ? "" : box(6, 6, 308, 168, "none", "#9fd3ff", 0).replace("/>", ' stroke-width="6"/>')) + title;
    const defs = `<defs><filter id="cw-ff-gray"><feColorMatrix type="saturate" values="0"/></filter><filter id="cw-ff-ink"><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncR type="discrete" tableValues="0 1"/><feFuncG type="discrete" tableValues="0 1"/><feFuncB type="discrete" tableValues="0 1"/></feComponentTransfer></filter></defs>`;
    const len = v.n("length");
    const slow = v.n("slowInto");
    const at = [0.12, 0.5, 0.85][idx(v, "timing")];
    const n = v.n("freezes");
    const fx = 10 + at * 200;
    const marks = [];
    for (let i = 0; i < n; i++) marks.push(k.dot({ x: 228 + i * 8.5, y: 150, r: 3, color: "#9fd3ff" }));
    return (
      defs +
      k.bg(SKY) +
      shot(k, "cw-ff-clip", 4, 4, 206, pic + frozen + (zoom > 0 ? `<rect x="${R(zx - 160 / sc)}" y="${R(zy - 90 / sc)}" width="${R(320 / sc)}" height="${R(180 / sc)}" fill="none" stroke="#ffd166" stroke-width="3" stroke-dasharray="8 6"/>` : "")) +
      box(214, 4, 102, 154, "#1d1d22", "#3a3a44", 6) +
      sm(k, 220, 18, ghost ? "No freeze" : `Freeze ${len} s`, { size: 9, color: "#fff", weight: 700 }) +
      sm(k, 220, 34, `on ${on}`, { size: 7.5 }) +
      sm(k, 220, 50, `Sound: ${v("soundWhile")}`, { size: 7 }) +
      sm(k, 220, 66, `Look: ${v("lookChange")}`, { size: 7 }) +
      sm(k, 220, 82, `Zoom ${v("zoom")}% to ${v("zoomX")}%, ${v("zoomY")}%`, { size: 6.8 }) +
      sm(k, 220, 100, `Slows ${slow} s first`, { size: 7.5 }) +
      sm(k, 220, 140, `${n} per scene`, { size: 7.5 }) +
      marks.join("") +
      sm(k, 6, 132, `Lands at ${v("timing")}`, { size: 7.5 }) +
      box(10, 140, 200, 6, "#34343c", null, 3) +
      poly([[Math.max(10, fx - slow * 30), 143], [fx, 137]], "#ffd166", 2) +
      box(fx, 136, Math.max(3, Math.min(208 - fx, len * 14)), 14, ghost ? "#555" : "#9fd3ff", null, 2) +
      k.caption(ghost ? "No freeze (the frame keeps moving)" : `${v("setting")} on ${on}`)
    );
  });

  /* Pace across the scene: cuts per minute over the scene, its peak and pauses, and the shots that makes. */
  W.look("pacingCurve", (v, k) => {
    const shape = v("setting");
    const s0 = v.n("startCuts");
    const pk = v.n("peakCuts");
    const at = v.n("peakAt") / 100;
    const after = idx(v, "afterPeak");
    const pauses = v.n("pauses");
    const pl = v.n("pauseLength");
    const maxC = 120;
    const N = 60;
    const rate = [];
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      let r;
      if (shape === "slows down") r = pk + (s0 - pk) * t;
      else if (shape === "steady") r = (s0 + pk) / 2;
      else if (shape === "speeds up") r = s0 + (pk - s0) * t;
      else if (shape === "stop and go") r = Math.sin(t * Math.PI * 4) > 0 ? pk : s0 * 0.3;
      else r = t < 0.85 ? s0 + (pk - s0) * (t / 0.85) : 0;
      /* the peak: a bump at peakAt, then the after-peak behaviour */
      r += (pk - r) * Math.exp(-Math.pow((t - at) / 0.08, 2));
      if (t > at + 0.08) r = after === 0 ? Math.max(r, pk * 0.9) : after === 1 ? r * 0.7 : r * 0.08;
      rate.push(Math.max(0, r));
    }
    for (let p = 0; p < pauses; p++) {
      const c = Math.round(((p + 1) / (pauses + 1)) * N);
      const w = Math.max(1, Math.round(pl / 2));
      for (let j = c - w; j <= c + w; j++) if (rate[j] != null) rate[j] = 0;
    }
    const pts = rate.map((r, i) => [10 + (i / N) * 300, 92 - (Math.min(maxC, r) / maxC) * 70]);
    /* shots from the rate, clamped between the shortest (frames) and longest (seconds) */
    const minS = v.n("shortest") / 24;
    const maxS = v.n("longest");
    const L = [];
    let t = 0;
    while (t < 60 && L.length < 80) {
      const r = rate[Math.min(N, Math.round((t / 60) * N))];
      const len = k.clamp(r > 0.5 ? 60 / r : maxS, minS, maxS);
      L.push(len);
      t += len;
    }
    return (
      k.bg(SKY) +
      sm(k, 10, 14, "Cuts per minute across the scene", { size: 8 }) +
      box(10, 20, 300, 74, "#1d1d22", "#3a3a44", 3) +
      ln(10 + at * 300, 20, 10 + at * 300, 94, "#ff6b6b", 1, "3 3") +
      poly(pts, "#ffd166", 2.5) +
      sm(k, 14, k.clamp(92 - (Math.min(maxC, s0) / maxC) * 70 - 3, 30, 90), `${s0}`, { size: 7, color: "#9fd3ff" }) +
      sm(k, k.clamp(14 + at * 300, 30, 294), k.clamp(92 - (Math.min(maxC, pk) / maxC) * 70 - 4, 30, 90), `${pk}`, { size: 7, color: "#ff8a8a" }) +
      sm(k, 10, 108, `The shots (${L.length}), each ${v("shortest")} frames to ${maxS} s`, { size: 7.5 }) +
      shots(L, 10, 114, 300, 22) +
      sm(k, 10, 152, `${pauses} pauses of ${pl} s · after the peak: ${v("afterPeak")}`, { size: 7.5, color: "#ddd" }) +
      k.caption(`Pace ${shape}`)
    );
  });

  /* Something new every: a minute with a new thing marked each time one arrives. */
  W.look("attentionReset", (v, k) => {
    const band = [1.5, 4, 10, 25][idx(v, "setting")];
    const every = v.n("everySec");
    const drift = v.p("drift") * 2 - 1;
    const first = v.n("opening");
    const vr = idx(v, "variety");
    const kinds = ["a cut", "a sound", "a joke", "a new face", "a new place"];
    const k0 = Math.max(0, kinds.indexOf(v("kind")));
    const sur = idx(v, "surprise");
    const jolt = v.n("jolt") / 100;
    const gapMax = v.n("longestGap");
    const icon = (i, x, y, s) => {
      const c = ["#ffd166", "#9fd3ff", "#ff8ad8", "#f0c8a0", "#81b29a"][i];
      if (i === 0) return ln(x, y - 8 * s, x, y + 8 * s, c, 3);
      if (i === 1) return k.speaker({ x, y, s: 0.5 * s, level: 0.7, color: c });
      if (i === 2) return k.face({ x, y, r: 7 * s, mood: 1, color: c });
      if (i === 3) return k.face({ x, y, r: 7 * s, mood: 0, color: c });
      return `<path d="M${R(x - 8 * s)} ${R(y + 6 * s)} L${R(x - 8 * s)} ${R(y - 2 * s)} L${R(x)} ${R(y - 9 * s)} L${R(x + 8 * s)} ${R(y - 2 * s)} L${R(x + 8 * s)} ${R(y + 6 * s)} Z" fill="${c}"/>`;
    };
    const ev = [];
    let t = first;
    let i = 0;
    let gap = every;
    let biggest = 0;
    let last = 0;
    while (t <= 60 && i < 60) {
      const kind = vr === 0 ? k0 : vr === 1 ? [k0, (k0 + 1) % 5, (k0 + 2) % 5][i % 3] : Math.floor(k.rnd(i + 3) * 5);
      const s = 0.7 + jolt * 0.8 + sur * 0.2 * k.rnd(i);
      ev.push(icon(kind, 14 + (t / 60) * 292, 70, s));
      biggest = Math.max(biggest, t - last);
      last = t;
      t += gap;
      gap = Math.max(0.5, gap * (1 - drift * 0.12));
      i++;
    }
    const over = biggest > gapMax;
    return (
      k.bg(SKY) +
      sm(k, 10, 18, "One minute: each mark is something new", { size: 8, color: "#ddd" }) +
      box(10, 30, 300, 80, "#1d1d22", "#3a3a44", 4) +
      box(14, 34, Math.min(292, (band / 60) * 292), 72, "#81b29a", null, 2, 0.14) +
      sm(k, 16, 104, `target: ${v("setting")}`, { size: 7, color: "#81b29a" }) +
      ln(14 + (first / 60) * 292, 34, 14 + (first / 60) * 292, 106, "#ff6b6b", 1, "2 2") +
      ev.join("") +
      sm(k, 10, 126, `About every ${every} s, ${v("drift")} · first hook at ${first} s`, { size: 7.5, color: "#ddd" }) +
      sm(k, 10, 140, `Longest gap allowed ${gapMax} s${over ? " (broken!)" : ""}`, { size: 7.5, color: over ? "#ff8a8a" : "#bbb" }) +
      box(170, 135, Math.min(140, (gapMax / 120) * 140), 6, over ? "#ff6b6b" : "#555", null, 3) +
      sm(k, 10, 154, `${v("kind")} · ${v("variety")} · ${v("surprise")} · size ${v("jolt")}%`, { size: 7.5 }) +
      k.caption(`Something new ${v("setting")}`)
    );
  });

  /* Clip speed: a runner with ghosts, the speed dial, the voice and sound, and how the speed changes. */
  W.look("clipSpeed", (v, k) => {
    const lvl = idx(v, "setting");
    const pct = v.n("percent");
    const sp = (pct / 100) * [0.2, 0.5, 0.8, 1, 1.4, 2][lvl] * (lvl === 3 ? 1 : 1);
    const feel = idx(v, "feel");
    const tintC = ["#9fd3ff", "#6a6a8a", "#ffd166", "#ff6b6b"][feel];
    const pitchFollows = v("pitch") === "follows the speed";
    const shift = v.n("pitchShift");
    const cycles = Math.max(1, 6 * Math.pow(2, shift / 12) * (pitchFollows ? Math.max(0.2, sp) : 1));
    const sb = idx(v, "soundBend");
    const smooth = idx(v, "smoothChange");
    const ct = v.n("changeTime");
    const w = 4 + ct * 10 + smooth * 14;
    const frozen = lvl === 0;
    return (
      k.bg(SKY) +
      box(4, 4, 206, 104, "#3a3640") +
      box(4, 80, 206, 28, "#2a2520") +
      (frozen ? `<g opacity="0.25">${runner(k, 120, 100, 60, sp, "#4a6fa5")}</g>` + fig(k, 120, 100, 60, { walk: 1, lean: 8, color: "#4a6fa5" }) + k.label({ x: 160, y: 30, text: "❚❚ frozen", size: 12, color: "#9fd3ff" }) : runner(k, 140, 100, 60, sp)) +
      box(4, 4, 206, 104, tintC, null, 0, 0.12) +
      box(214, 4, 102, 104, "#1d1d22", "#3a3a44", 6) +
      k.dial({ x: 265, y: 42, r: 24, p: Math.min(1, pct / 400), color: tintC }) +
      sm(k, 265, 82, `${pct}%`, { size: 10, color: "#fff", anchor: "middle", weight: 700 }) +
      sm(k, 265, 98, `feels ${v("feel")}`, { size: 7.5, anchor: "middle" }) +
      sm(k, 8, 122, `Voice: ${v("pitch")}, ${shift > 0 ? "+" : ""}${shift} semitones`, { size: 7.5 }) +
      k.wave({ x: 10, y: 136, w: 140, h: 16, amp: 0.8, cycles, color: "#9fd3ff" }) +
      sm(k, 8, 156, `Sound: ${v("soundBend")}`, { size: 7.5 }) +
      (sb === 2 ? k.label({ x: 140, y: 157, text: "♪♪", size: 10, color: "#ffd166" }) : "") +
      sm(k, 170, 122, `Change: ${v("smoothChange")}, ${ct} s`, { size: 7.5 }) +
      poly([[170, 148], [230 - w / 2, 148], [230 + w / 2, 134], [310, 134]], "#ffd166", 2) +
      k.caption(`${v("setting")} (${pct}%)`)
    );
  });

  /* Reverse and replay: the play line going forward, rewinding and replaying, with a map of the replay's camera. */
  W.look("playDirection", (v, k) => {
    const dir = v("setting");
    const reps = v.n("replays");
    const rs = idx(v, "replaySpeed");
    const rwp = v.n("rewindPct");
    const rpp = v.n("replayPct");
    const gap = v.n("replayGap");
    const look = idx(v, "rewindLook");
    const ang = idx(v, "replayAngle");
    const turn = v.n("replayTurn");
    const fw = 90;
    const segs = [];
    let x = 10;
    const y = 52;
    if (dir === "reversed") {
      segs.push(k.arrow({ x1: x + fw, y1: y, x2: x, y2: y, w: 8, color: "#e07a5f" }));
      x += fw + 6;
    } else {
      segs.push(box(x, y - 8, fw, 16, "#4a6fa5", "#1c1712", 3) + k.arrow({ x1: x + 10, y1: y, x2: x + fw - 8, y2: y, w: 2, color: "#fff" }));
      x += fw + 4;
    }
    const ghost = dir !== "rewind and replay";
    const rwLen = Math.max(8, (fw * 100) / rwp);
    let g = `<g${ghost ? ' opacity="0.35"' : ""}>`;
    g += box(x, y - 8, rwLen, 16, "#e07a5f", "#1c1712", 3) + k.arrow({ x1: x + rwLen - 2, y1: y, x2: x + 2, y2: y, w: 2, color: "#fff" });
    if (look === 1) for (let i = 0; i < 3; i++) g += ln(x, y - 5 + i * 5, x + rwLen, y - 5 + i * 5, "#000", 1);
    if (look === 2) g += ln(x - 6, y - 10, x + rwLen + 6, y - 10, "#fff", 2) + ln(x - 6, y + 10, x + rwLen + 6, y + 10, "#fff", 2);
    x += rwLen + gap * 20 + 4;
    const repLen = Math.min(120, (fw * 100) / rpp / (rs === 0 ? 1 : rs === 1 ? 1.5 : 2));
    for (let i = 0; i < Math.max(1, reps); i++) {
      if (x > 310) break;
      g += box(x, y - 8, Math.min(repLen, 312 - x), 16, "#81b29a", "#1c1712", 3, reps === 0 ? 0.3 : 1);
      x += Math.min(repLen, 312 - x) + 3;
    }
    g += "</g>";
    const mx = 70;
    const my = 126;
    const camA = k.rad(-90 + (ang === 2 ? turn + 30 : turn));
    const cr = ang === 1 ? 14 : 22;
    return (
      k.bg(SKY) +
      sm(k, 10, 22, dir === "forward" ? "Plays forward (faded: a rewind and replay)" : dir === "reversed" ? "Plays backward (faded: a rewind and replay)" : "Plays, rewinds, then replays", { size: 8, color: "#ddd" }) +
      segs.join("") +
      g +
      sm(k, 10, 78, `Rewind ${rwp}% · ${v("rewindLook")} · ${v("rewindSound")}`, { size: 7.5 }) +
      sm(k, 10, 90, `Replay ${reps}x at ${rpp}% (${v("replaySpeed")}) after ${gap} s`, { size: 7.5 }) +
      box(10, 96, 120, 62, "#1d1d22", "#3a3a44", 4) +
      k.dot({ x: mx, y: my + 8, r: 5, color: "#4a6fa5" }) +
      k.cam({ x: mx, y: my + 8 - 22, dir: 90, s: 0.45, color: "#777" }) +
      k.cam({ x: mx + Math.cos(camA) * cr, y: my + 8 + Math.sin(camA) * cr, dir: (Math.atan2(-Math.sin(camA), -Math.cos(camA)) * 180) / Math.PI, s: 0.45, color: "#81b29a" }) +
      sm(k, 140, 116, `Replay from: ${v("replayAngle")}`, { size: 7.5 }) +
      sm(k, 140, 130, `turned ${turn}°`, { size: 7.5 }) +
      sm(k, 140, 146, `Rewind sound: ${v("rewindSound")}`, { size: 7.5 }) +
      k.caption(`Direction: ${dir}`)
    );
  });

  /* Cutting to the beat: the beats of the music and where the cuts land on them. */
  W.look("beatSync", (v, k) => {
    const mode = idx(v, "setting");
    const every = v.n("every");
    const off = v.n("offset");
    const acc = idx(v, "accents");
    const loose = idx(v, "looseness");
    const jit = v.n("jitter");
    const build = idx(v, "buildToDrop");
    const share = v.n("onBeatShare") / 100;
    const sp = v.n("dropSpeedup") / 100;
    const beatW = 9;
    const nB = 32;
    const x0 = 12;
    const drop = 24;
    const beats = [];
    for (let i = 0; i < nB; i++) {
      const strong = i % 4 === 0;
      const isDrop = i === drop;
      beats.push(ln(x0 + i * beatW, 60, x0 + i * beatW, 60 - (isDrop ? 22 : strong ? 14 : 8), isDrop ? "#ff6b6b" : strong ? "#9fd3ff" : "#557", isDrop ? 3 : 2));
    }
    const cuts = [];
    const stepBase = mode === 3 ? Math.max(every, 4) : mode === 4 ? 16 : every;
    let b = 0;
    let i = 0;
    while (b < nB && i < 60) {
      const near = drop - b;
      const speed = build && near > 0 && near <= 8 ? (build === 1 ? 1 + (sp - 1) * 0.5 : sp) : 1;
      let x = x0 + b * beatW + (off / 6) * 4;
      if (mode === 0) x += (k.rnd(i + 5) - 0.5) * beatW * 1.6;
      else if (mode === 1) x += (k.rnd(i + 5) - 0.5) * beatW * 0.6;
      if (k.rnd(i + 17) > share) x += beatW * 0.45;
      x += (k.rnd(i + 31) - 0.5) * (jit / 6) * beatW * 0.8 + (loose ? (k.rnd(i + 9) - 0.5) * loose * 2 : 0);
      const big = (acc === 0 && true) || (acc === 1 && b % 4 === 0) || (acc === 2 && b === drop);
      cuts.push(ln(x, 70, x, 70 + (big && (acc > 0) ? 34 : 22), big && acc > 0 ? "#ffd166" : "#ddd", big && acc > 0 ? 3 : 1.6));
      b += Math.max(0.5, stepBase / speed);
      i++;
    }
    return (
      k.bg(SKY) +
      sm(k, 10, 18, "Beats (bars marked tall, the drop red)", { size: 8 }) +
      box(8, 30, 304, 34, "#1d1d22", "#3a3a44", 3) +
      beats.join("") +
      k.label({ x: x0 + drop * beatW, y: 28, text: "drop", size: 7.5, color: "#ff8a8a" }) +
      sm(k, 10, 116, "Cuts", { size: 8 }) +
      cuts.join("") +
      sm(k, 10, 132, `Every ${every} beats · ${off > 0 ? "+" : ""}${off} frames · ${v("onBeatShare")}% on the beat`, { size: 7.5, color: "#ddd" }) +
      sm(k, 10, 146, `${v("looseness")}, ${jit} frames loose · big moments on ${v("accents")}`, { size: 7.5 }) +
      sm(k, 10, 158, `Before the drop: ${v("buildToDrop")}, ${v("dropSpeedup")}%`, { size: 7.5 }) +
      k.caption(`Cutting ${v("setting")}`)
    );
  });

  /* Jump cuts: three frames in a row with the same person, jumping; the reframe and the sound across it. */
  W.look("jumpCut", (v, k) => {
    const mode = idx(v, "setting");
    const gap = v.n("gap");
    const ref = idx(v, "reframe");
    const punch = v.n("punchIn") / 100;
    const sideS = v.n("sideShift") / 100;
    const sc = idx(v, "soundCarry");
    const dens = v.n("density");
    const frames = [0, 1, 2].map((i) => {
      const zoom = 1 + (ref === 0 ? 0 : ref === 1 ? i * 0.1 : (i % 2) * 0.15) + punch * (ref === 2 ? i % 2 : i) * 0.6;
      const shift = (i % 2 ? 1 : -1) * sideS * 160 * (i ? 1 : 0);
      const pose = { arms: [0, 0.6, -0.2][i], look: [1, -1, 0][i], mood: [0.2, 0.6, -0.2][i] };
      const inner = `<g transform="translate(160 90) scale(${R(zoom, 2)}) translate(-160 -90) translate(${R(shift)} 0)">${room(k, 130)}${box(240, 30, 40, 50, "#5b6f8f")}${fig(k, 150, 170, 120, Object.assign({ color: "#4a6fa5" }, pose))}</g>`;
      return shot(k, `cw-jc-${i}`, 8 + i * 104, 20, 96, inner);
    });
    const jumps = [];
    const n = [0, 3, 8, 16][mode] + Math.round(dens / 2);
    for (let i = 0; i < Math.min(40, n); i++) {
      const t = mode === 2 ? (i + 0.5) / Math.max(1, n) : k.rnd(i + 4);
      jumps.push(ln(10 + t * 300, 118, 10 + t * 300, 130, "#ffd166", 2));
    }
    const sound = sc === 0 ? [0, 1, 2].map((i) => box(10 + i * 102, 140, 96, 5, "#9fd3ff", null, 2)).join("") : sc === 1 ? box(10, 140, 300, 5, "#9fd3ff", null, 2) : box(10, 140, 300, 5, "#ffd166", null, 2) + [0, 1, 2, 3, 4].map((i) => k.label({ x: 40 + i * 60, y: 138, text: "♪", size: 9, color: "#ffd166" })).join("");
    return (
      k.bg(SKY) +
      sm(k, 8, 14, `Skips ${gap} frames each jump · ${v("reframe")}`, { size: 8, color: "#ddd" }) +
      frames.join("") +
      [0, 1].map((i) => k.label({ x: 108 + i * 104, y: 50, text: "✂", size: 10, color: "#ffd166" })).join("") +
      sm(k, 8, 88, `Punch-in ${v("punchIn")}% · shift ${v("sideShift")}%`, { size: 7.5 }) +
      sm(k, 8, 100, `Why: ${v("purpose")}`, { size: 7.5 }) +
      box(10, 122, 300, 4, "#34343c") +
      sm(k, 10, 114, `A minute: ${n} jumps (${dens} a minute)`, { size: 7.5 }) +
      jumps.join("") +
      sound +
      sm(k, 10, 156, `Sound: ${v("soundCarry")}`, { size: 7.5 }) +
      k.caption(`Jump cuts: ${v("setting")}`)
    );
  });

  /* Edit template: a phone-shaped edit in the template's style, its clips, words and effects, and where the best clip lands. */
  W.look("editTemplate", (v, k) => {
    const tpls = ["none", "cinematic", "daily life", "selfie", "velocity", "lyrics", "meme", "travel", "relationship", "friendship", "family", "school life", "business"];
    const ti = Math.max(0, tpls.indexOf(v("setting")));
    const accent = ["#8a8a8a", "#d8a531", "#81b29a", "#ff8ad8", "#ff6b6b", "#b48aff", "#ffd166", "#5fb8e0", "#e07a5f", "#7fe07f", "#f2b880", "#7fb7ff", "#9fa8b8"][ti];
    const clips = Math.round(v.n("clips"));
    const cl = v.n("clipLength");
    const txt = idx(v, "textAmount");
    const fx = idx(v, "effectsLevel");
    const hook = idx(v, "hookFirst");
    const total = v.n("totalLength");
    const best = v.n("bestAt");
    const phone = box(14, 8, 84, 148, "#111", "#888", 12) + box(20, 18, 72, 128, ti === 1 ? "#1a1a24" : "#2a2a34") + (ti === 1 ? box(20, 18, 72, 14, "#000") + box(20, 132, 72, 14, "#000") : "") + fig(k, 56, 138, 64, { color: accent, mood: 0.5, arms: ti === 4 ? 1 : 0 });
    const words = [0, 1, 2, 3].slice(0, [0, 1, 4][txt]).map((i) => box(28, 26 + i * 9, 56 - (i % 2) * 14, 5, "#fff", null, 2)).join("");
    const spark = Array.from({ length: [0, 3, 9][fx] }, (_, i) => k.label({ x: 24 + k.rnd(i + 2) * 64, y: 30 + k.rnd(i + 7) * 100, text: "✦", size: 8, color: "#ffd166" })).join("");
    const L = Array.from({ length: clips }, (_, i) => cl * (0.8 + k.rnd(i + 1) * 0.4));
    const best0 = hook === 2 ? 0 : hook === 1 ? 0 : -1;
    return (
      k.bg(SKY) +
      phone +
      words +
      spark +
      sm(k, 112, 18, ti === 0 ? "No template" : `${v("setting")} template`, { size: 10, color: ti ? accent : "#ddd", weight: 700 }) +
      sm(k, 112, 36, `${clips} ${clips === 1 ? "clip" : "clips"} of ${cl} s`, { size: 8 }) +
      shots(L, 112, 42, 198, 20, (i) => (i === best0 && hook ? "#ffd166" : i % 2 ? "#6c8fb8" : "#8fb2d8")) +
      (hook === 1 ? sm(k, 112, 72, "best clip first, sometimes", { size: 7 }) : hook === 2 ? sm(k, 112, 72, "best clip always first", { size: 7, color: "#ffd166" }) : sm(k, 112, 72, "best clip not first", { size: 7 })) +
      sm(k, 112, 92, `Words: ${v("textAmount")} · effects: ${v("effectsLevel")}`, { size: 7.5 }) +
      sm(k, 112, 114, `Whole edit ${total} s`, { size: 8 }) +
      box(112, 120, 198, 6, "#34343c", null, 3) +
      box(112, 120, Math.max(3, (total / 180) * 198), 6, accent, null, 3) +
      k.label({ x: 112 + Math.min(198, (best / Math.max(1, total)) * ((total / 180) * 198)), y: 140, text: "★", size: 11, color: "#ffd166" }) +
      sm(k, 112, 154, `Best clip at ${best} s`, { size: 7.5 }) +
      k.caption(ti === 0 ? "No template: edit by hand" : `A ${v("setting")} edit`)
    );
  });

  /* Slow motion quality: a strip of frames; filmed ones solid, invented ones in the method's style, and glitches. */
  W.look("retimeQuality", (v, k) => {
    const how = idx(v, "setting");
    const smooth = v.n("smoothness") / 5;
    const art = idx(v, "artifacts");
    const src = [24, 60, 120, 240][idx(v, "sourceRate")];
    const slow = v.n("slowFactor");
    const made = Math.max(v.n("madeShare") / 100, Math.max(0, 1 - src / (24 * slow)));
    const n = 14;
    const cells = [];
    for (let i = 0; i < n; i++) {
      const isMade = (i / n) % 1 >= 0 && k.rnd(i + 2) < made && i % Math.max(1, Math.round(1 / Math.max(0.01, 1 - made))) !== 0;
      const x = 8 + i * 22;
      const ballX = x + 4 + ((i * 3 + (isMade && how === 0 ? -3 : 0)) % 14) * (0.3 + smooth * 0.7);
      let cell = box(x, 40, 20, 34, isMade ? "#2a2a34" : "#3a4a6a", isMade ? "#888" : "#9fd3ff", 2);
      if (isMade && how === 1) cell += k.dot({ x: ballX - 3, y: 57, r: 4, color: "#e07a5f80" }) + k.dot({ x: ballX + 3, y: 57, r: 4, color: "#e07a5f80" });
      else cell += k.dot({ x: ballX, y: 57, r: 4, color: isMade ? (how === 2 ? "#e0a07f" : "#e07a5f") : "#e07a5f" });
      if (isMade && art && k.rnd(i + 9) < art * 0.45) cell += box(x + 2, 46 + k.rnd(i) * 20, 16, 3, "#0ff", null, 0, 0.8);
      cells.push(cell);
    }
    const pathPts = [];
    for (let i = 0; i <= 40; i++) {
      const t = i / 40;
      const step = Math.floor(t * (6 + smooth * 30)) / (6 + smooth * 30);
      pathPts.push([10 + t * 300, 120 - (how === 0 ? step : t) * 30 - (art === 2 ? Math.sin(i * 3) * 2 : 0)]);
    }
    return (
      k.bg(SKY) +
      sm(k, 10, 18, `Filmed at ${src} frames, played ${slow}x slower`, { size: 8.5, color: "#ddd" }) +
      sm(k, 10, 32, `Blue = filmed · grey = invented (${Math.round(made * 100)}%)`, { size: 7.5 }) +
      cells.join("") +
      sm(k, 10, 88, "The motion as it plays", { size: 7.5 }) +
      poly(pathPts, "#ffd166", 2) +
      sm(k, 10, 140, `Smoothness ${v("smoothness")} · glitches: ${v("artifacts")}`, { size: 7.5 }) +
      sm(k, 10, 154, `Invented share ${v("madeShare")}%`, { size: 7.5 }) +
      k.caption(`Frames made by ${v("setting")}`)
    );
  });

  /* ---------- extra dot grids ---------- */
  const pad = (id, x, y, xLabel, yLabel) => {
    const spec = W.get(id);
    if (spec && !(spec.faces || []).some((f) => f.face === "pad")) W.add(id, { window: { faces: [{ face: "pad", x, y, xLabel, yLabel }] } });
  };
  pad("attentionReset", "everySec", "jolt", "Seconds between", "How big");
  pad("clipSpeed", "percent", "pitchShift", "Speed", "Voice pitch");
  pad("playDirection", "rewindPct", "replayPct", "Rewind speed", "Replay speed");
  pad("jumpCut", "sideShift", "punchIn", "Sideways shift", "Punch-in");
  pad("retimeQuality", "slowFactor", "madeShare", "How much slower", "Frames invented");
})(typeof window !== "undefined" ? window.CuriosityWindows : require("./windows.js"));
