/* Text: the live picture at the top of each text curiosity's window (CuriosityWindows.look). Every picture is a
   small film frame with the words on it, so a beginner sees where the text sits, how big it is and how it moves.
   A thin strip at the top of some pictures is a clock for the shot: it shows when the text comes and goes. */
(function (W) {
  /* The bottom caption, its words shrunk (and at worst cut) so a long one never runs off the picture. */
  const fitCap = (k, text) => `<rect x="0" y="${k.H - 18}" width="${k.W}" height="18" fill="rgba(0,0,0,0.55)"/>` + k.fitText({ x: k.W / 2, y: k.H - 5, text, size: 10, min: 7.5, w: 312, color: "#f4f4f4" });
  const BG = "#141418";

  /* A plain little set behind the words: a wall, a floor and one person. */
  function set(k, o) {
    o = o || {};
    const y0 = o.y0 == null ? 24 : o.y0;
    return `<rect x="0" y="${y0}" width="320" height="${162 - y0}" fill="#3a3f4a"/><rect x="0" y="118" width="320" height="44" fill="#2b2620"/>${k.window_({ x: 240, y: y0 + 12, w: 50, h: 40, light: 0.5 })}${k.person({ x: o.px == null ? 110 : o.px, y: 150, s: 1.15, color: "#4a6fa5", mood: 0.2 })}`;
  }
  /* The shot's clock strip at the top: t0..t1 seconds across the width. Returns {s, X}. */
  function clockStrip(k, t0, t1, labelText) {
    const X = (t) => 8 + k.clamp((t - t0) / (t1 - t0), 0, 1) * 304;
    const s = `<rect x="0" y="0" width="320" height="22" fill="#0d0d10"/><line x1="8" y1="15" x2="312" y2="15" stroke="#555" stroke-width="1"/>${k.label({ x: 312, y: 9, text: labelText || "", size: 7, color: "#888", anchor: "end" })}`;
    return { s, X };
  }
  /* A bar on the clock strip from a to b seconds, with optional ramps (seconds) at each end. */
  function onBar(k, X, a, b, color, rampIn, rampOut, text) {
    const xa = X(a);
    const xb = Math.max(xa + 1, X(b));
    const ri = Math.min(xb - xa, Math.max(0, X(a + (rampIn || 0)) - xa));
    const ro = Math.min(xb - xa - ri, Math.max(0, xb - X(b - (rampOut || 0))));
    return `<path d="M${xa.toFixed(1)} 18 L${(xa + ri).toFixed(1)} 9 L${(xb - ro).toFixed(1)} 9 L${xb.toFixed(1)} 18 Z" fill="${color}" opacity="0.85"/>${text ? k.label({ x: (xa + xb) / 2, y: 16, text, size: 7, color: "#111" }) : ""}`;
  }
  const short = (s, n) => (String(s).length > n ? String(s).slice(0, n - 1) + "…" : String(s));

  /* ---------- On-screen text ---------- */
  W.look("onScreenText", (v, k) => {
    const kind = String(v("setting"));
    const sizeMul = [0.7, 1, 1.4, 2.2][Math.round(v.p("size") * 3)];
    let fs = k.clamp((6 + v.n("textHeight") * 1.1) * sizeMul, 6, 70);
    const pos = String(v("position"));
    let x = 10 + v.n("textAcross") * 3;
    let y = 160 - v.n("textUp") * 1.3;
    if (pos === "top") y = Math.min(y, 60);
    if (pos === "middle") y = (y + 95) / 2;
    if (pos === "bottom") y = Math.max(y, 140);
    const follows = pos === "follows a person";
    if (follows) (x = 140), (y = 62);
    const off = kind === "none";
    const words = { none: "I never said that.", caption: "I never said that.", "title card": "CHAPTER ONE", "lower third": "Sam · the neighbor", "sign or label": "BAKERY", "sound word": "BAM!", credits: "Directed by You" }[kind] || kind;
    const grab = v.p("grabsEye");
    const color = k.mix("#cfcfcf", "#ffe14d", grab);
    const anim = String(v("animation"));
    const shown = anim === "typewriter" ? words.slice(0, Math.ceil(words.length * 0.6)) + "▌" : words;
    /* keep the words inside the frame: shrink a long line, then slide it in from the edges */
    const cw = kind === "title card" || kind === "sound word" ? 0.74 : 0.62; /* width of a letter, per size */
    fs = Math.min(fs, 300 / (words.length * cw));
    const tw = words.length * fs * cw;
    x = k.clamp(x, 8, 312 - tw);
    y = k.clamp(y, 26 + fs * 0.8, 158);
    let s = k.bg(BG) + set(k, { px: 110 });
    if (kind === "title card") s += `<rect x="0" y="24" width="320" height="138" fill="#000" opacity="0.92"/>`;
    /* What it is placed against. */
    const anchor = String(v("anchoredTo"));
    const ax = { "the frame": 4, "a person": 110, "an object": 262, "the horizon": x }[anchor];
    const ay = { "the frame": 28, "a person": 92, "an object": 50, "the horizon": 118 }[anchor];
    if (anchor === "the horizon") s += `<line x1="0" y1="118" x2="320" y2="118" stroke="#ffd166" stroke-dasharray="4 3" stroke-width="1.2"/>`;
    if (anchor === "an object") s += k.ring({ x: 265, y: 46, r: 26, color: "#ffd166", w: 1.2, dash: "3 3" });
    s += `<line x1="${ax}" y1="${ay}" x2="${x.toFixed(1)}" y2="${(y - fs * 0.4).toFixed(1)}" stroke="#ffd166" stroke-width="1" stroke-dasharray="2 3" opacity="0.8"/>`;
    if (kind === "lower third" && words) s += `<rect x="${(x - 4).toFixed(1)}" y="${(y - fs).toFixed(1)}" width="${(words.length * fs * 0.55 + 8).toFixed(1)}" height="${(fs * 1.35).toFixed(1)}" fill="#c0392b" opacity="0.85"/>`;
    if (kind === "sign or label" && words) s += `<rect x="${(x - 4).toFixed(1)}" y="${(y - fs).toFixed(1)}" width="${(words.length * fs * 0.62 + 8).toFixed(1)}" height="${(fs * 1.35).toFixed(1)}" fill="#6b4a2b" stroke="#2a1a0c" stroke-width="2"/>`;
    /* How it animates in: ghost copies or marks. */
    if (anim === "fade") s += k.text({ x: x + 2, y: y + 2, text: words, size: fs, color, anchor: "start", alpha: 0.25 });
    if (anim === "slide") s += k.text({ x: Math.max(0, x - 30), y, text: words, size: fs, color, anchor: "start", alpha: 0.2 }) + k.arrow({ x1: Math.max(0, x - 30), y1: y + 6, x2: x - 4, y2: y + 6, color: "#ffd166", w: 1.5 });
    if (anim === "pop") s += [0, 1, 2, 3, 4, 5].map((i) => { const a = (i / 6) * Math.PI * 2; return `<line x1="${(x - 8 + Math.cos(a) * 6).toFixed(1)}" y1="${(y - fs / 2 + Math.sin(a) * 6).toFixed(1)}" x2="${(x - 8 + Math.cos(a) * 12).toFixed(1)}" y2="${(y - fs / 2 + Math.sin(a) * 12).toFixed(1)}" stroke="#ffd166" stroke-width="1.5"/>`; }).join("");
    if (anim === "bounce") s += `<path d="M${x - 20} ${y} Q${x - 12} ${y - fs - 14} ${x - 4} ${y - fs / 2}" fill="none" stroke="#ffd166" stroke-dasharray="2 2"/>`;
    if (words) s += k.text({ x, y, text: shown, size: fs, color: kind === "sound word" ? "#ff5a3c" : color, anchor: "start", weight: kind === "title card" || kind === "sound word" ? 800 : 600, outline: grab > 0.6 ? "#000" : null, outlineW: 3, alpha: off ? 0.45 : 1 });
    if (grab > 0.9 && words) s += k.ring({ x: x + Math.min(tw / 2, 40), y: y - fs / 3, r: Math.min(fs * 0.9 + 10, 48), color: "#ffe14d", w: 1, dash: "2 2" });
    /* The clock strip: comes in after the cut, animates in, stays, leaves. */
    const c = clockStrip(k, 0, 16, `read: ${v("readTime")}`);
    const a = v.n("inDelay");
    const exit = String(v("exitStyle"));
    const outRamp = exit === "fade" ? 1.2 : exit === "slide" ? 0.6 : exit === "pop" ? 0.2 : 0;
    s += c.s + `<line x1="${c.X(0)}" y1="4" x2="${c.X(0)}" y2="20" stroke="#fff" stroke-width="1.5"/>` + onBar(k, c.X, a, a + Math.max(0.2, v.n("duration")), "#ffd166", v.n("animIn"), outRamp, "") + k.label({ x: 30, y: 9, text: `cut · leaves by ${exit}`, size: 7, color: "#888", anchor: "start" });
    return s + fitCap(k, !off ? `${kind}: ${v("size")}, ${pos}, ${anim}` : "no text on screen (how it would look, shown faint)");
  });

  /* ---------- Mood sticker on a face ---------- */
  const MOOD = { none: "", sunny: "☀️", loved: "💕", struck: "💫", "bright idea": "💡", "red face": "", "sad tears": "💧", shy: "", confused: "❓", "departing soul": "👻", cool: "", "angry steam": "💢", "laughing till crying": "💦", "mallet bonk": "🔨", crackling: "⚡" };
  W.look("moodEffect", (v, k) => {
    const m = String(v("setting"));
    const fx = 120;
    const fy = 92;
    const r = 34;
    const big = [0.7, 1, 1.4][Math.round(v.p("size") * 2)] * (v.n("sizeVsFace") / 100);
    const gs = k.clamp(22 * big, 12, 64);
    /* the sticker stays inside the picture, however far it is pushed */
    const sx = k.clamp(fx + (v.n("sideOffset") / 100) * r * 1.4, gs * 0.6 + 4, 226 - gs * 0.6);
    const sy = k.clamp(fy - (v.n("heightOffset") / 100) * r * 1.4, 30 + gs * 0.9, 158);
    const mood = { sunny: 0.8, loved: 0.7, "sad tears": -0.7, "angry steam": -0.6, "laughing till crying": 1, confused: -0.1, "departing soul": -0.4, cool: 0.4 }[m] || 0;
    let s = k.bg(BG) + `<rect x="0" y="24" width="230" height="138" fill="#2a2f3a"/>`;
    s += k.face({ x: fx, y: fy, r, mood, eyes: m === "departing soul" ? 0.1 : 0.8, mouth: m === "laughing till crying" ? 0.8 : 0, color: m === "red face" ? "#e8805a" : "#f0c8a0" });
    if (m === "red face" || m === "shy") s += [-1, 1].map((sd) => `<ellipse cx="${fx + sd * r * 0.5}" cy="${fy + r * 0.15}" rx="${(8 * big).toFixed(1)}" ry="${(4 * big).toFixed(1)}" fill="#ff4d6d" opacity="0.6"/>`).join("");
    if (m === "cool") s += `<rect x="${fx - r * 0.65}" y="${fy - r * 0.3}" width="${r * 1.3}" height="${r * 0.32}" rx="4" fill="#111"/>`;
    const ghost = m === "none";
    const glyph = ghost ? "💫" : MOOD[m] || "";
    const wob = String(v("wobble"));
    if (wob === "bobs") s += `<path d="M${sx - 10} ${sy - gs - 4} q5 -5 10 0 q5 5 10 0" fill="none" stroke="#9fd3ff" stroke-width="1.5"/>`;
    if (wob === "shakes") s += `<path d="M${sx - gs * 0.7} ${sy - gs * 0.4} l-4 3 l4 3 M${sx + gs * 0.7} ${sy - gs * 0.4} l4 3 l-4 3" fill="none" stroke="#9fd3ff" stroke-width="1.5"/>`;
    const pop = String(v("popIn"));
    if (glyph && pop === "fades in") s += k.text({ x: sx + 4, y: sy + 4, text: glyph, size: gs, alpha: 0.3 });
    if (glyph && pop === "bursts with a sound") s += sx > 120 ? k.text({ x: sx - gs * 0.6 - 6, y: Math.max(sy - gs * 0.7, 38), text: "POP!", size: 10, color: "#ffd166", weight: 800, anchor: "end" }) : k.text({ x: sx + gs * 0.6 + 6, y: Math.max(sy - gs * 0.7, 38), text: "POP!", size: 10, color: "#ffd166", weight: 800, anchor: "start" });
    if (glyph && pop !== "fades in") s += [0, 1, 2, 3].map((i) => { const a = (i / 4) * Math.PI * 2 + 0.4; return `<line x1="${(sx + Math.cos(a) * gs * 0.6).toFixed(1)}" y1="${(sy - gs * 0.35 + Math.sin(a) * gs * 0.6).toFixed(1)}" x2="${(sx + Math.cos(a) * gs * 0.85).toFixed(1)}" y2="${(sy - gs * 0.35 + Math.sin(a) * gs * 0.85).toFixed(1)}" stroke="#ffd166" stroke-width="1.5"/>`; }).join("");
    if (glyph) s += k.text({ x: sx, y: sy, text: glyph, size: gs, alpha: ghost ? 0.45 : 1 });
    s += k.ring({ x: sx, y: sy - gs * 0.35, r: 3, color: "#ffd166", w: 1 });
    /* The clock strip: the line, then when the sticker arrives and how long it stays. */
    const c = clockStrip(k, -4, 8, "");
    const at = { "before the line": -1.5, "on the line": 0, "after the line": 2 }[String(v("timing"))] + v.n("landsAt");
    s += c.s + `<rect x="${c.X(0)}" y="10" width="${c.X(3) - c.X(0)}" height="8" fill="#3d5a80"/>` + k.label({ x: (c.X(0) + c.X(3)) / 2, y: 17, text: "the line", size: 7, color: "#dde" }) + onBar(k, c.X, at, at + Math.max(0.15, v.n("holdTime")), "#ffd166", 0.2, 0.2, "");
    /* How often: a row of reactions in the film, the ones that get a sticker lit. */
    const often = Math.round(v.p("howOften") * 2);
    s += `<rect x="236" y="28" width="80" height="130" rx="6" fill="#1d1d22" stroke="#444"/>` + k.label({ x: 276, y: 40, text: "reactions in the film", size: 7, color: "#aaa" });
    for (let i = 0; i < 8; i++) {
      const on = often === 2 || (often === 1 && i % 3 === 0) || (often === 0 && i === 4);
      s += `<rect x="${244 + (i % 2) * 34}" y="${48 + Math.floor(i / 2) * 26}" width="30" height="22" rx="3" fill="${on ? "#4b4225" : "#2a2a30"}" stroke="${on ? "#ffd166" : "#444"}"/>` + k.face({ x: 259 + (i % 2) * 34, y: 59 + Math.floor(i / 2) * 26, r: 6, mood: 0.3 }) + (on ? k.dot({ x: 266 + (i % 2) * 34, y: 52 + Math.floor(i / 2) * 26, r: 2.5, color: "#ffd166" }) : "");
    }
    return s + fitCap(k, !ghost ? `${m}, ${v("size")}, ${v("timing")}` : "no mood sticker (how it would look, shown faint)");
  });

  /* ---------- End card ---------- */
  const FONT = { plain: "system-ui, sans-serif", handwritten: "'Bradley Hand', 'Segoe Print', cursive", animated: "system-ui, sans-serif", "old film": "Georgia, serif", bold: "Impact, 'Arial Black', sans-serif", typewriter: "'Courier New', monospace" };
  W.look("endCard", (v, k) => {
    const card = String(v("setting"));
    const style = String(v("style"));
    const fs = k.clamp(v.n("cardTextHeight") * 1.1, 8, 44);
    const ghost = card === "none";
    const words = { none: "The End", "thank you for watching": "Thank you for watching", "to be continued": "To be continued…", "the end": "The End", subscribe: "Subscribe ▶", thanks: "Thanks!" }[card] || card;
    let s = k.bg("#000");
    if (style === "old film") s += `<rect x="0" y="24" width="320" height="138" fill="#3b2d1c"/>` + [40, 130, 250].map((x, i) => `<line x1="${x}" y1="24" x2="${x + 6 * (i - 1)}" y2="162" stroke="#cbb48a" stroke-width="0.8" opacity="0.5"/>`).join("");
    if (style === "animated") s += [0, 1, 2, 3, 4, 5].map((i) => k.text({ x: 70 + i * 36, y: 50 + (i % 2) * 70, text: "✦", size: 10, color: "#ffd166" })).join("");
    s += k.text({ x: 160, y: 98, text: words, size: Math.min(fs, 300 / (words.length * 0.55)), color: style === "old film" ? "#f1e2c0" : "#fff", font: FONT[style], weight: style === "plain" ? 400 : 600, alpha: ghost ? 0.45 : 1 });
    /* Music under it: notes that fall away, sit still or rise. */
    const mus = Math.round(v.p("music") * 2);
    if (mus > 0) s += [0, 1, 2].map((i) => k.text({ x: 40 + i * 14, y: 140 - (mus === 2 ? i * 10 : -i * 4), text: "♪", size: 10 + (mus === 2 ? i * 3 : -i * 2), color: "#9fd3ff", alpha: mus === 1 ? 0.8 - i * 0.25 : 1 })).join("");
    else s += k.label({ x: 52, y: 142, text: "silence", size: 8, color: "#666" });
    /* The clock strip: black, fade in, hold, then the extra moment. */
    const c = clockStrip(k, 0, 80, "");
    const b = v.n("blackBefore");
    const f = v.n("fadeSeconds");
    const h = v.n("holdFor");
    const st = Math.round(v.p("stinger") * 2);
    s += c.s + onBar(k, c.X, 0, Math.max(0.3, b), "#555", 0, 0, "") + onBar(k, c.X, b, b + f + h, "#ffd166", f, 0, "");
    if (st > 0) {
      const sa = b + f + h + v.n("stingerAfter");
      s += onBar(k, c.X, sa, sa + (st === 1 ? 3 : 14), "#7fd18b", 0, 0, "") + k.label({ x: Math.min(c.X(sa) + 2, 266), y: 8, text: st === 1 ? "a hint" : "extra scene", size: 7, color: "#7fd18b", anchor: "start" });
    } else s += k.label({ x: 312, y: 8, text: `+${v.n("stingerAfter")} s, no extra moment`, size: 7, color: "#666", anchor: "end" });
    return s + fitCap(k, !ghost ? `${words} · ${style} · ${h} s` : "no end card (how it would look, shown faint)");
  });

  /* ---------- Chapter cards ---------- */
  W.look("chapterCard", (v, k) => {
    const kind = String(v("setting"));
    const style = String(v("style"));
    const fs = k.clamp(v.n("cardTextHeight") * 0.9, 8, 40);
    const tease = Math.round(v.p("tease") * 2);
    const ttl = ["The Storm", "Before the Storm", "What Did the Sea Keep?"][tease];
    const ghost = kind === "none";
    const words = { none: `3 · ${ttl}`, number: "Chapter 3", title: ttl, "number and title": `3 · ${ttl}`, "date and place": "Tuesday, a harbor town" }[kind] || kind;
    const back = Math.round(v.p("backdrop") * 2);
    let s = k.bg("#000");
    if (back > 0) s += `<g opacity="0.45"><rect x="0" y="24" width="320" height="138" fill="#28405a"/><path d="M0 130 Q80 100 160 125 T320 120 L320 162 L0 162 Z" fill="#1d3044"/>${k.person({ x: 292, y: 156, s: 0.8 })}</g>`;
    if (back === 2) s += [0, 1, 2].map((i) => `<path d="M${30 + i * 30} ${60 + i * 8} q10 -6 20 0" fill="none" stroke="#9fd3ff" stroke-width="1.5"/>`).join("");
    s += k.text({ x: 160, y: 92, text: words, size: Math.min(fs, 280 / (words.length * (style === "typewriter" ? 0.64 : 0.56))), color: "#fff", font: FONT[style] || FONT.plain, weight: style === "bold" ? 800 : 500, alpha: ghost ? 0.45 : 1 });
    /* The clock strip: the film, with a mark for each chapter, minutes apart. */
    const n = Math.round(v.n("howMany"));
    const gap = v.n("minutesApart");
    s += `<rect x="0" y="0" width="320" height="22" fill="#0d0d10"/><rect x="8" y="10" width="304" height="6" fill="#333"/>`;
    for (let i = 0; i < n; i++) {
      const x = 8 + Math.min(1, (i * gap) / 120) * 304;
      s += `<rect x="${x.toFixed(1)}" y="6" width="3" height="14" fill="#ffd166"/>`;
    }
    s += k.label({ x: 312, y: 8, text: `${n} chapters, ${gap} min apart`, size: 7, color: "#aaa", anchor: "end" });
    /* Fade and hold, small, under the card. */
    const f = v.n("fadeSeconds");
    const h = v.n("holdFor");
    const X = (t) => 90 + (t / 15) * 140;
    s += `<line x1="90" y1="140" x2="230" y2="140" stroke="#555"/>` + `<path d="M${X(0)} 140 L${X(f)} 130 L${X(f + h)} 130 L${X(f + h)} 140 Z" fill="#ffd166" opacity="0.8"/>` + k.label({ x: 236, y: 140, text: `fade ${f} s, hold ${h} s`, size: 7, color: "#aaa", anchor: "start" });
    return s + fitCap(k, !ghost ? `${kind}, ${style}` : "no chapter cards (how they would look, shown faint)");
  });

  /* ---------- Captions ---------- */
  W.look("captions", (v, k) => {
    const mode = String(v("setting"));
    const line1 = "I never said that to anyone, I promise you".split(" ");
    const line2 = "Then who told her about the party".split(" ");
    const per = Math.max(1, Math.round(v.n("wordsPerLine")));
    const sizeMul = [0.75, 1, 1.3, 1.7][Math.round(v.p("size") * 3)];
    const fs0 = k.clamp(v.n("capHeight") * 2.6 * sizeMul, 7, 40);
    const pos = String(v("position"));
    const baseY = { bottom: 150, middle: 100, top: 50 }[pos];
    const y00 = k.clamp(baseY - v.n("capUp") * 0.9, 34, 158);
    const two = v.p("speakerColor") > 0.5;
    const hl = Math.round(v.p("highlight") * 2);
    const em = Math.round(v.p("emoji") * 2);
    const maxL = Math.round(v.n("maxLines"));
    let s = k.bg(BG) + `<rect x="0" y="24" width="320" height="138" fill="#3a3f4a"/><rect x="0" y="118" width="320" height="44" fill="#2b2620"/>`;
    s += k.person({ x: 70, y: 150, s: 1, color: "#e0a050", mood: -0.2 }) + k.person({ x: 250, y: 150, s: 1, color: "#5a9fd0", mood: 0 });
    /* Build the caption lines the chosen way. */
    const off = mode === "off";
    let lines = [];
    if (mode === "key words") lines = [[{ w: "NEVER", who: 0, key: true }]];
    else if (mode === "word by word") lines = [[{ w: "never", who: 0, key: true }]];
    else {
      const words = line1.map((w) => ({ w, who: 0, key: w === "never" })).concat(line2.map((w) => ({ w, who: 1, key: w === "party" })));
      for (let i = 0; i < words.length; i += per) lines.push(words.slice(i, i + per));
    }
    lines = lines.slice(0, maxL);
    /* shrink to fit the widest line, and lift the block so its top line stays in the picture */
    const chars = (ln) => ln.reduce((a, w) => a + w.w.length + 1, 0) + (em > 0 ? 3 : 0);
    const widest = Math.max(1, ...lines.map(chars));
    const fs = Math.min(fs0, 300 / (widest * 0.6));
    const y0 = k.clamp(y00, 30 + fs + (lines.length - 1) * fs * 1.25, 158);
    lines.forEach((ln, li) => {
      const y = y0 - (lines.length - 1 - li) * fs * 1.25;
      let txt = "";
      const total = chars(ln) * fs * 0.58;
      let x = 160 - total / 2;
      ln.forEach((w, wi) => {
        const col = w.key && hl > 0 ? "#ffd166" : two && w.who === 1 ? "#9fd3ff" : two ? "#ffcf99" : "#fff";
        txt += k.text({ x, y: y - (w.key && hl === 2 ? 5 : 0), text: w.w + (em > 0 && wi === ln.length - 1 && (em === 2 || li === 0) ? " 😮" : ""), size: fs, color: col, anchor: "start", weight: 700, outline: "#000", outlineW: Math.max(1, fs / 7) });
        x += (w.w.length + 1) * fs * 0.58;
      });
      s += off ? `<g opacity="0.45">${txt}</g>` : txt;
    });
    /* The clock strip: the voice, and the caption ahead of or behind it, long enough to read. */
    const c = clockStrip(k, -1.5, 6, `${v.n("readSpeed")} letters a second`);
    const read = Math.min(6, 30 / Math.max(1, v.n("readSpeed")));
    s += c.s + k.wave({ x: c.X(0), y: 13, w: c.X(3) - c.X(0), h: 10, amp: 0.8, cycles: 10, noise: 0.4, color: "#9fd3ff" });
    s += onBar(k, c.X, v.n("capLead"), v.n("capLead") + read, "#ffd166", 0, 0, "");
    return s + fitCap(k, mode === "off" ? "captions off (how they would look, shown faint)" : `${mode}, ${per} words a line, ${pos}`);
  });

  /* ---------- Stickers and emoji ---------- */
  W.look("stickers", (v, k) => {
    const n0 = [0, 1, 3, 8][Math.round(v.p("setting") * 3)];
    const n = Math.max(1, n0);
    const kind = String(v("kind"));
    const glyph = { emoji: "😄", arrow: "➜", sparkle: "✨", "speech bubble": "💬", reaction: "👍", shape: "★" }[kind] || "★";
    const sz = k.clamp(v.n("stickerHeight") * 1.4 * [0.7, 1, 1.4][Math.round(v.p("size") * 2)], 8, n0 > 3 ? 34 : n0 > 1 ? 50 : 72);
    const tilt = v.n("tilt");
    const mo = String(v("motion"));
    const pts = Math.round(v.p("pointsAt") * 2);
    let s = k.bg(BG) + set(k, { px: 110 }) + `<rect x="205" y="98" width="24" height="20" fill="#c0392b" stroke="#1c1712"/>` + k.label({ x: 217, y: 128, text: "the thing", size: 7, color: "#ccc" });
    let st = "";
    for (let i = 0; i < n; i++) {
      let x;
      let y;
      if (i === 0) (x = 10 + v.n("stickerAcross") * 3), (y = 160 - v.n("stickerUp") * 1.3);
      else if (pts === 0) (x = 20 + k.rnd(i) * 280), (y = 40 + k.rnd(i + 9) * 110);
      else if (pts === 1) (x = 110 + (k.rnd(i) - 0.5) * 90), (y = 70 + (k.rnd(i + 9) - 0.5) * 70);
      else (x = 217 + Math.cos(i * 0.9 + 0.3) * (30 + i * 4 + sz * 0.5)), (y = 100 - Math.abs(Math.sin(i * 0.9 + 0.3)) * (20 + i * 3 + sz * 0.3)); /* in an arc over the thing, clear of its label */
      x = k.clamp(x, sz * 0.85 + 2, 318 - sz * 0.85);
      y = k.clamp(y, 26 + sz * 0.9, 160);
      if (Math.abs(x - 217) < sz * 0.8 + 20 && y + sz * 0.3 > 118 && y - sz * 1.1 < 134) y = Math.max(26 + sz * 0.9, 114 - sz * 0.3); /* clear of "the thing" label */
      if (mo === "bounces") st += `<path d="M${x - 12} ${y + 4} Q${x - 6} ${y - sz} ${x} ${y - sz * 0.4}" fill="none" stroke="#9fd3ff" stroke-dasharray="2 2"/>`;
      if (mo === "follows a person") st += `<line x1="${x}" y1="${y}" x2="110" y2="80" stroke="#9fd3ff" stroke-dasharray="2 3"/>`;
      st += `<g transform="rotate(${tilt} ${x.toFixed(1)} ${(y - sz * 0.35).toFixed(1)})">${k.text({ x, y, text: glyph, size: sz, color: "#ffd166" })}</g>`;
    }
    s += n0 ? st : `<g opacity="0.45">${st}</g>`;
    if (pts === 2) s += k.arrow({ x1: 180, y1: 70, x2: 205, y2: 96, color: "#ffd166", w: 2 });
    /* The clock strip: when it lands and how long it stays. */
    const land = String(v("landsOn"));
    const c = clockStrip(k, 0, 12, `lands on ${land}`);
    const at = { anywhere: 0.5, "the line": 2, "the beat of the music": 3 }[land];
    s += c.s + (land === "the beat of the music" ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((t) => `<line x1="${c.X(t)}" y1="5" x2="${c.X(t)}" y2="20" stroke="#555"/>`).join("") : "") + (true ? onBar(k, c.X, at, at + Math.max(0.15, v.n("stayFor")), "#ffd166", 0, 0, "") : "");
    return s + fitCap(k, n0 ? `${v("setting")} ${kind} sticker${n > 1 ? "s" : ""}, ${mo}` : "no stickers (one shown faint)");
  });

  /* ---------- Text style ---------- */
  const FEEL = { clean: "system-ui, sans-serif", serif: "Georgia, 'Times New Roman', serif", handwritten: "'Bradley Hand', 'Segoe Print', cursive", "bold display": "Impact, 'Arial Black', sans-serif", retro: "'Cooper Black', 'Courier New', serif", comic: "'Comic Sans MS', 'Chalkboard SE', cursive" };
  const TCOL = { white: "#ffffff", yellow: "#ffe14d", black: "#111111", red: "#e8413c", pastel: "#f5b8d6" };
  W.look("textStyle", (v, k) => {
    const font = FEEL[String(v("setting"))] || FEEL.clean;
    const col = TCOL[String(v("color"))] || "#fff";
    const weight = [300, 400, 700, 900][Math.round(v.p("weight") * 3)];
    const sp = [-2, 0, 4, 10][Math.round(v.p("spread") * 3)];
    const stroke = v.n("stroke");
    const glow = v.n("glow") / 100;
    const sh = v.n("shadow") / 100;
    const a = k.rad(v.n("shadowAngle"));
    const off = v.n("shadowOffset");
    const box = Math.round(v.p("box") * 2);
    const bo = v.n("boxOpacity") / 100;
    const word = "Hello there!";
    const fs = Math.min(40, (290 - sp * word.length) / (word.length * (weight >= 700 ? 0.62 : 0.56)));
    const x = 160;
    const y = 100;
    const wEst = word.length * fs * 0.56 + sp * word.length;
    let s = k.bg(BG) + `<rect x="0" y="0" width="320" height="162" fill="#5d7a91"/><path d="M0 130 Q100 105 200 128 T320 118 L320 162 L0 162 Z" fill="#3e5a3a"/>`;
    if (box > 0) s += `<rect x="${(x - wEst / 2 - 12).toFixed(1)}" y="${y - fs * 0.95}" width="${(wEst + 24).toFixed(1)}" height="${fs * 1.35}" rx="${box === 1 ? 14 : 2}" fill="#000" opacity="${((box === 1 ? 0.5 : 1) * bo).toFixed(2)}"/>`;
    if (glow > 0) s += `<defs><filter id="cw-textStyle-glow" x="-30%" y="-60%" width="160%" height="220%"><feGaussianBlur stdDeviation="${(2 + glow * 6).toFixed(1)}"/></filter></defs><g filter="url(#cw-textStyle-glow)" opacity="${glow.toFixed(2)}">${k.text({ x, y, text: word, size: fs, color: col === "#111111" ? "#fff" : col, font, weight, spacing: sp })}</g>`;
    if (sh > 0) s += k.text({ x: x + Math.cos(a) * off, y: y + Math.sin(a) * off, text: word, size: fs, color: "#000", font, weight, spacing: sp, alpha: sh });
    s += k.text({ x, y, text: word, size: fs, color: col, font, weight, spacing: sp, outline: stroke > 0 ? (col === "#111111" ? "#fff" : "#000") : null, outlineW: stroke });
    /* A little shadow compass, so the angle reads at a glance. */
    s += `<circle cx="292" cy="28" r="14" fill="#1d1d22" stroke="#444"/>` + k.arrow({ x1: 292, y1: 28, x2: 292 + Math.cos(a) * (2 + off * 0.55), y2: 28 + Math.sin(a) * (2 + off * 0.55), color: "#ffd166", w: 1.5 }) + k.label({ x: 292, y: 52, text: `shadow ${Math.round(v.n("shadowAngle"))}°`, size: 7, color: "#ddd" }) + `<rect x="254" y="16" width="16" height="16" fill="#000" opacity="${bo.toFixed(2)}" stroke="#888" stroke-dasharray="2 2"/>` + k.label({ x: 262, y: 42, text: "box", size: 7, color: "#ddd" });
    return s + fitCap(k, `${v("setting")}, ${v("weight")}, ${v("color")}, outline ${stroke} px`);
  });

  /* Dot grids (a pad) where two settings pair naturally and the window has none yet. */
  const pad = (id, x, y, xLabel, yLabel) => {
    const spec = W.get(id);
    if (spec && !(spec.faces || []).some((f) => f.face === "pad")) W.add(id, { window: { faces: [{ face: "pad", x, y, xLabel, yLabel }] } });
  };
  pad("captions", "wordsPerLine", "capHeight", "fewer to more words a line", "smaller to bigger letters");
  pad("endCard", "blackBefore", "holdFor", "black before it", "how long it stays");
  pad("chapterCard", "howMany", "minutesApart", "fewer to more chapters", "closer to further apart");
  pad("textStyle", "stroke", "glow", "thinner to thicker outline", "no glow to strong glow");
})(typeof window !== "undefined" ? window.CuriosityWindows : require("./windows.js"));
