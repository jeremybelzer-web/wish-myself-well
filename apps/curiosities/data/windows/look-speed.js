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
  /* A film frame w by h at (x, y) holding a 320x180 drawing; a frame wider than 16:9 shows the middle band. */
  const cell = (id, x, y, w, h, inner, stroke) => {
    const s = Math.max(h / 180, w / 320);
    const ty = Math.min(y, Math.max(y + h - 180 * s, y + h / 2 - 110 * s));
    return `<clipPath id="${id}"><rect x="${R(x)}" y="${R(y)}" width="${R(Math.max(0.5, w))}" height="${R(h)}"/></clipPath><g clip-path="url(#${id})"><g transform="translate(${R(x + w / 2 - 160 * s)} ${R(ty)}) scale(${R(s, 3)})">${inner}</g></g>` + box(x, y, w, h, "none", stroke || "#0b0b0d");
  };
  /* The dark band and sprocket holes behind a strip of film frames. */
  const sprockets = (x, y, w, h) => {
    let o = box(x - 2, y - 6, w + 4, h + 12, "#0b0b0d");
    for (let hx = x + 2; hx < x + w - 2; hx += 7) o += box(hx, y - 4, 3, 2.5, "#4a4a52") + box(hx, y + h + 1.5, 3, 2.5, "#4a4a52");
    return o;
  };
  /* A plain backdrop with a floor, for people inside a frame. */
  const set = (k, c) => box(0, 0, 320, 180, c) + box(0, 128, 320, 52, k.mix(c, "#000000", 0.45));
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
    const pts = rate.map((r, i) => [10 + (i / N) * 300, 130 - (Math.min(maxC, r) / maxC) * 46]);
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
    /* The film: one frame per shot, as wide as the shot is long; each cut jumps to a new angle on the person. */
    let strip = sprockets(10, 22, 300, 42);
    const totL = L.reduce((a, b) => a + b, 0) || 1;
    let sx = 10;
    L.forEach((l, i) => {
      const w = (l / totL) * 300;
      if (w < 8) strip += box(sx, 22, Math.max(0.6, w - (w > 2.5 ? 1 : 0.3)), 42, i % 2 ? "#6c8fb8" : "#8fb2d8");
      else strip += cell(`cw-pc-f${i}`, sx, 22, w - 1, 42, set(k, ["#3a3a48", "#34404a", "#44384a"][i % 3]) + fig(k, 160 + ((i * 37) % 3 - 1) * 40, 172 + (i % 3) * 30, 110 + (i % 3) * 50, { color: "#4a6fa5", walk: i % 2, look: i % 2 ? 1 : -1 }));
      sx += w;
    });
    return (
      k.bg(SKY) +
      sm(k, 10, 12, `The scene as it plays: ${L.length} shots, ${v("shortest")} frames to ${maxS} s`, { size: 7.5 }) +
      strip +
      box(10, 78, 300, 56, "#1d1d22", "#3a3a44", 3) +
      sm(k, 310, 76, "cuts per minute", { size: 6.5, color: "#999", anchor: "end" }) +
      ln(10 + at * 300, 78, 10 + at * 300, 134, "#ff6b6b", 1, "3 3") +
      poly(pts, "#ffd166", 1.5) +
      sm(k, 14, k.clamp(130 - (Math.min(maxC, s0) / maxC) * 46 - 3, 98, 130), `${s0}`, { size: 7, color: "#9fd3ff" }) +
      sm(k, k.clamp(14 + at * 300, 80, 294), k.clamp(130 - (Math.min(maxC, pk) / maxC) * 46 - 4, 98, 130), `${pk}`, { size: 7, color: "#ff8a8a" }) +
      sm(k, 10, 150, `${pauses} pauses of ${pl} s · after the peak: ${v("afterPeak")}`, { size: 7.5, color: "#ddd" }) +
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
    const evs = [];
    let t = first;
    let i = 0;
    let gap = every;
    let biggest = 0;
    let last = 0;
    while (t <= 60 && i < 60) {
      const kind = vr === 0 ? k0 : vr === 1 ? [k0, (k0 + 1) % 5, (k0 + 2) % 5][i % 3] : Math.floor(k.rnd(i + 3) * 5);
      const s = 0.7 + jolt * 0.8 + sur * 0.2 * k.rnd(i);
      ev.push(icon(kind, 14 + (t / 60) * 292, 95, Math.min(1.1, s)));
      evs.push({ t, kind, s });
      biggest = Math.max(biggest, t - last);
      last = t;
      t += gap;
      gap = Math.max(0.5, gap * (1 - drift * 0.12));
      i++;
    }
    const over = biggest > gapMax;
    /* The film: ten frames of the minute. A frame with something new shows it (a new angle, a sound, a joke, a new
       face, a new place); between them the same shot sits there and the viewer's attention fades (it darkens). */
    const NF = 10;
    const fw = 300 / NF;
    let strip = sprockets(10, 24, 300, 40);
    let lastT = 0;
    for (let f = 0; f < NF; f++) {
      const a = f * 6;
      const hit = evs.find((e) => e.t >= a && e.t < a + 6);
      let inner;
      if (hit) {
        lastT = hit.t;
        const big = 0.8 + jolt * 0.6;
        inner =
          hit.kind === 4 ? set(k, "#2f4a3a") + `<path d="M60 128 L160 40 L260 128 Z" fill="#81b29a"/>` + fig(k, 230, 172, 90, { color: "#4a6fa5" })
          : hit.kind === 3 ? set(k, "#3a3a48") + fig(k, 120, 172, 120, { color: "#4a6fa5" }) + fig(k, 220, 172, 130 * big, { color: "#e07a5f", mood: 0.5 })
          : hit.kind === 2 ? set(k, "#3a3a48") + k.face({ x: 160, y: 95, r: 55 * big, mood: 1, mouth: 0.8 }) + k.text({ x: 260, y: 50, text: "ha", size: 40, color: "#ff8ad8", weight: 800 })
          : hit.kind === 1 ? set(k, "#3a3a48") + fig(k, 120, 172, 120, { color: "#4a6fa5", look: 1 }) + k.speaker({ x: 230, y: 70, s: 2.4 * big, level: 1, color: "#9fd3ff" })
          : f % 2 ? set(k, "#44384a") + k.face({ x: 160, y: 100, r: 60 * big, mood: 0.2 }) : set(k, "#34404a") + fig(k, 160, 200, 200 * big, { color: "#4a6fa5", look: -1 });
      } else {
        const bored = k.clamp((a + 6 - lastT) / Math.max(1, gapMax), 0, 1);
        inner = set(k, "#3a3a48") + fig(k, 160, 172, 120, { color: "#4a6fa5" }) + box(0, 0, 320, 180, "#000", null, 0, bored * 0.75);
      }
      strip += cell(`cw-ar-f${f}`, 10 + f * fw + 1, 24, fw - 2, 40, inner, hit ? (sur === 2 ? "#ff6b6b" : "#ffd166") : "#0b0b0d");
    }
    return (
      k.bg(SKY) +
      sm(k, 10, 13, "One minute of film (gold = something new)", { size: 8, color: "#ddd" }) +
      strip +
      box(10, 76, 300, 36, "#1d1d22", "#3a3a44", 4) +
      box(14, 78, Math.min(292, (band / 60) * 292), 32, "#81b29a", null, 2, 0.14) +
      sm(k, 16, 108, `target: ${v("setting")}`, { size: 6.5, color: "#81b29a" }) +
      ln(14 + (first / 60) * 292, 78, 14 + (first / 60) * 292, 110, "#ff6b6b", 1, "2 2") +
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
    const turnDeg = ang === 2 ? Math.min(180, turn + 30) : turn;
    /* The moment itself: someone jumps a crate. t runs 0..1 through the jump; view 1 is closer, view 2 turned. */
    const jump = (t, view, tint) => {
      const px = 90 + t * 140;
      const lift = Math.sin(Math.PI * t) * 45;
      const wallC = view === 0 ? "#3a3640" : k.mix("#3a3640", "#4b5e4a", Math.min(1, turnDeg / 120 + (view === 2 ? 0.3 : 0)));
      let sc = `${box(0, 0, 320, 180, wallC)}${box(0, 140, 320, 40, "#2a2520")}${box(140, 104, 40, 36, "#8a6a4a", "#1c1712", 2)}${fig(k, px, 140 - lift, 100, { arms: 0.8, walk: 0.6, mood: 0.6, color: "#4a6fa5" })}`;
      if (view && turnDeg > 90) sc = `<g transform="translate(320 0) scale(-1 1)">${sc}</g>`;
      if (view === 1 || (view === 2 && ang === 1)) sc = `<g transform="translate(160 95) scale(1.6) translate(${R(-(view && turnDeg > 90 ? 320 - px : px))} ${R(-(90 - lift))})">${sc}</g>`;
      return sc + (tint ? box(0, 0, 320, 180, tint, null, 0, 0.3) : "");
    };
    const fy = 30;
    const fh = 32;
    const fwid = 36;
    let strip = "";
    let x = 10;
    let nid = 0;
    const frame = (t, view, tint, stroke, op, extra) => {
      const c = cell(`cw-pd-${nid++}`, x, fy, fwid, fh, jump(t, view, tint) + (extra || ""), stroke);
      x += fwid + 1;
      return op < 1 ? `<g opacity="${op}">${c}</g>` : c;
    };
    const marks = [];
    /* Plays: forward, or backward with the frames running the other way. */
    marks.push([x, dir === "reversed" ? "plays backward ◀" : "plays ▶", dir === "reversed" ? "#ff8a8a" : "#9fd3ff"]);
    for (let i = 0; i < 4; i++) strip += frame(dir === "reversed" ? 1 - i / 3 : i / 3, 0, dir === "reversed" ? "#e07a5f" : null, "#0b0b0d", 1);
    const ghost = dir !== "rewind and replay";
    const op = ghost ? 0.3 : 1;
    /* Rewind: fewer frames the faster it runs, with its look on top. */
    const nRw = Math.max(1, Math.min(4, Math.round(400 / rwp)));
    const rwLook = look === 1 ? [40, 80, 120].map((yy) => box(0, yy, 320, 6, "#000", null, 0, 0.6)).join("") : look === 2 ? [50, 95, 130].map((yy) => box(0, yy, 320, 10, "#fff", null, 0, 0.4)).join("") : "";
    x += 3;
    marks.push([x, `rewind ${rwp}%`, "#ff8a8a", op]);
    for (let i = 0; i < nRw; i++) strip += frame(1 - (i + 1) / (nRw + 1), 0, "#e07a5f", "#e07a5f", op, rwLook);
    x += 3 + gap * 8;
    /* Replays: slower replays take more frames, from the chosen angle. */
    const nRp = Math.max(1, Math.min(7, Math.round(300 / rpp / [0.7, 1, 1.4][rs])));
    if (reps > 0 && x + fwid <= 311) marks.push([x, `replay ×${reps}`, "#81b29a", op]);
    for (let r = 0; r < Math.max(1, reps) && x < 300; r++) {
      for (let i = 0; i < nRp && x + fwid <= 311; i++) strip += frame(nRp > 1 ? i / (nRp - 1) : 0.5, ang ? (ang === 1 ? 1 : 2) : 0, null, "#81b29a", reps === 0 ? 0.15 : op);
      x += 4;
    }
    let lastEnd = 0;
    return (
      k.bg(SKY) +
      sm(k, 10, 12, dir === "forward" ? "Plays forward (faded: what a rewind and replay would add)" : dir === "reversed" ? "Plays backward (faded: a rewind and replay)" : "Plays, rewinds, then replays", { size: 8, color: "#ddd" }) +
      sprockets(10, fy, 300, fh) +
      strip +
      marks.map(([mx, t, c, o]) => { const at = Math.min(Math.max(mx, lastEnd), 310 - t.length * 3.6); lastEnd = at + t.length * 3.6 + 6; return `<g opacity="${o == null ? 1 : o}">${sm(k, at, fy - 9, t, { size: 6.5, color: c })}</g>`; }).join("") +
      sm(k, 10, 84, `Rewind ${rwp}% · ${v("rewindLook")} · ${v("rewindSound")}`, { size: 7.5 }) +
      sm(k, 10, 96, `Replay ${reps}x at ${rpp}% (${v("replaySpeed")}) after ${gap} s`, { size: 7.5 }) +
      sm(k, 10, 108, "The shot", { size: 7, color: "#9fd3ff" }) +
      cell("cw-pd-a", 10, 112, 80, 45, jump(0.5, 0), "#888") +
      sm(k, 98, 108, "The replay", { size: 7, color: "#81b29a" }) +
      cell("cw-pd-b", 98, 112, 80, 45, jump(0.5, ang ? (ang === 1 ? 1 : 2) : 0), "#81b29a") +
      sm(k, 188, 124, `Replay from: ${v("replayAngle")}`, { size: 7.5 }) +
      sm(k, 188, 138, `turned ${turn}°`, { size: 7.5 }) +
      sm(k, 188, 152, `Rewind sound: ${v("rewindSound")}`, { size: 7.5 }) +
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
    const cutX = [];
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
      cutX.push([x, big && acc > 0]);
      cuts.push(ln(x, 70, x, 106, big && acc > 0 ? "#ffd166" : "#ffffff", big && acc > 0 ? 2 : 1));
      b += Math.max(0.5, stepBase / speed);
      i++;
    }
    /* The film under the music: a dancer, one frame per shot; a big moment is a close-up. */
    const strip = () => {
      const xs = cutX.map((c) => c).filter(([x]) => x > 10 && x < 310).sort((a, b) => a[0] - b[0]);
      const edges = [[10, false], ...xs, [310, false]];
      let o = sprockets(10, 72, 300, 32);
      for (let j = 0; j < edges.length - 1; j++) {
        const x1 = edges[j][0];
        const w = edges[j + 1][0] - x1;
        if (w < 1) continue;
        const big = edges[j][1];
        const inner = big ? set(k, "#5a3a2a") + k.face({ x: 160, y: 95, r: 70, mood: 1, mouth: 0.7 }) : set(k, ["#3a3a48", "#34404a", "#44384a"][j % 3]) + fig(k, 160 + ((j % 3) - 1) * 50, 172, 120, { color: "#4a6fa5", arms: j % 2 ? 1 : -0.3, walk: (j + 1) % 2, lean: ((j % 3) - 1) * 8 });
        o += w < 6 ? box(x1, 72, w, 32, big ? "#ffd166" : j % 2 ? "#6c8fb8" : "#8fb2d8") : cell(`cw-bs-f${j}`, x1, 72, w, 32, inner, big ? "#ffd166" : "#0b0b0d");
      }
      return o;
    };
    return (
      k.bg(SKY) +
      sm(k, 10, 18, "Beats (bars marked tall, the drop red)", { size: 8 }) +
      box(8, 30, 304, 34, "#1d1d22", "#3a3a44", 3) +
      beats.join("") +
      k.label({ x: x0 + drop * beatW, y: 28, text: "drop", size: 7.5, color: "#ff8a8a" }) +
      strip() +
      cuts.join("") +
      sm(k, 10, 119, "The film, cut where the lines are (gold = a big moment)", { size: 7 }) +
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
    /* Each clip is its own little shot: a new place, the same person; the best one gets the gold frame. */
    const BGS = ["#4b5e4a", "#5b4a6b", "#7a5a48", "#3f5a6e", "#6b6a48"];
    const totL = L.reduce((a, b) => a + b, 0) || 1;
    let at = 112;
    const clipCells = L.map((l, i) => {
      const w = (l / totL) * 198;
      const bgc = BGS[i % BGS.length];
      const isBest = i === best0 && hook;
      const inner = set(k, bgc) + fig(k, 120 + (i % 3) * 40, 168, 80 - (i % 2) * 10, { color: accent, mood: 0.5, arms: i % 2 });
      const c = w < 6 ? box(at, 42, w, 22, bgc, "#0b0b0d") : cell(`cw-et-${i}`, at, 42, w, 22, inner, isBest ? "#ffd166" : "#0b0b0d");
      at += w;
      return c;
    }).join("");
    return (
      k.bg(SKY) +
      phone +
      words +
      spark +
      sm(k, 112, 18, ti === 0 ? "No template" : `${v("setting")} template`, { size: 10, color: ti ? accent : "#ddd", weight: 700 }) +
      sm(k, 112, 36, `${clips} ${clips === 1 ? "clip" : "clips"} of ${cl} s`, { size: 8 }) +
      sprockets(112, 42, 198, 22) +
      clipCells +
      (hook === 1 ? sm(k, 112, 80, "best clip first, sometimes", { size: 7 }) : hook === 2 ? sm(k, 112, 80, "best clip always first", { size: 7, color: "#ffd166" }) : sm(k, 112, 80, "best clip not first", { size: 7 })) +
      sm(k, 112, 97, `Words: ${v("textAmount")} · effects: ${v("effectsLevel")}`, { size: 7.5 }) +
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
