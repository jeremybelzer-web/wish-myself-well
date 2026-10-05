/* look for the background, set, placement and page curiosities in data/db-depth-world.js (depth thread, world):
   the live picture at the top of each window. Same house style as look-heart-comedy.js and look-depth-sound.js: a
   picture on top (y 0 to 120) that draws the place, the people in it or the comic page as simple shapes, a strip
   of small labelled gauges below it, and a caption. Colors: gold = the main character, blue = other people,
   red = danger, green = safe or calm, purple = memory or mood, paper and ink for comic pages. Every own setting
   moves something of its own. */
(function (W) {
  const S = { bg: "#15151c", lane: "#22222b", gold: "#ffd166", red: "#e4572e", blue: "#6fa8dc", green: "#5fae78", purple: "#9b6bb5", grey: "#8a8a96", pink: "#d9789b", paper: "#f4f1ea", ink: "#1c1712", ice: "#9fd3ff", orange: "#e8913a", wall: "#3a3440", floor: "#2b2620" };
  const r1 = (n) => Math.round(n * 10) / 10;
  const fmt = (n) => String(Math.round(n * 100) / 100);

  /* ---------- small drawing helpers ---------- */
  const chip = (k, x, y, text, color, anchor) => {
    const w = String(text).length * 5.2 + 10;
    const x0 = anchor === "end" ? x - w : anchor === "middle" ? x - w / 2 : x;
    return `<rect x="${r1(x0)}" y="${r1(y - 10)}" width="${r1(w)}" height="14" rx="7" fill="#33323d" stroke="${color || "#555"}" stroke-width="0.8"/>` + k.label({ x: x0 + w / 2, y: y + 0.5, text, size: 9, color: "#fff" });
  };
  const emo = (k, x, y, e, size) => k.label({ x, y, text: e, size: size || 16 });
  const rect = (x, y, w, h, fill, extra) => `<rect x="${r1(x)}" y="${r1(y)}" width="${r1(Math.max(0.5, w))}" height="${r1(Math.max(0.5, h))}" fill="${fill}"${extra || ""}/>`;
  const line = (x1, y1, x2, y2, color, w, dash) => `<line x1="${r1(x1)}" y1="${r1(y1)}" x2="${r1(x2)}" y2="${r1(y2)}" stroke="${color}" stroke-width="${w || 2}"${dash ? ` stroke-dasharray="${dash}"` : ""} stroke-linecap="round"/>`;
  /* A person seen from behind: the kit's person with the face covered by the back of the head. */
  const backOf = (k, o) => {
    const s = o.s || 1;
    return k.person(o) + `<circle cx="${r1(o.x)}" cy="${r1(o.y - 67 * s)}" r="${r1(9.5 * s)}" fill="#3b2a20"/>`;
  };
  /* A small clock face showing a share of a minute. */
  const timer = (k, x, y, p, color) => `<circle cx="${x}" cy="${y}" r="9" fill="#2a2a33" stroke="#666"/>` + (p > 0.001 ? k.pie({ x, y, r: 8, p: k.clamp(p, 0, 0.999), color: color || S.gold }) : "");
  /* A comic panel with ink border. */
  const pan = (k, x, y, w, h, fill) => k.panel({ x, y, w, h, fill: fill || S.paper, w2: 1.5 });

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
        /* the words after the steps have less room, so they are cut shorter */
        const room = Math.max(6, Math.floor((w - it.n * sw - 3) / 5.2));
        const shorter = txt.length > room ? txt.slice(0, room - 1) + "…" : txt;
        out += k.label({ x: x + it.n * sw + 3, y: by + 7, text: shorter, size: 8, color: "#fff", anchor: "start", weight: 700 });
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
  const bg = (k) => k.bg(S.bg);
  const room = (k, floorY) => rect(0, 0, 320, floorY, S.wall) + rect(0, floorY, 320, 120 - floorY, S.floor);

  /* ======================= crowdReacts ======================= */
  /* Two main people in front; small people behind who turn and stare, or carry on (and dance, when they clash). */
  look("crowdReacts", (v, k, g) => {
    const re = idx(v, "reaction", 4);
    const n = Math.round(v.n("howMany"));
    const shown = Math.min(14, 3 + Math.round(n / 4.5));
    const delay = v.n("delay");
    const kind = idx(v, "kind", 6);
    const side = idx(v, "side", 3);
    const clash = v.n("clash");
    const frac = [0, 0.2, 0.55, 1][re];
    const sideCol = [S.red, S.grey, S.green][side];
    let out = room(k, 78);
    for (let i = 0; i < shown; i++) {
      const x = 14 + (i * 292) / Math.max(1, shown - 1 || 1);
      const reacts = i < Math.round(shown * frac);
      const look = x < 160 ? 1 : -1;
      out += k.person({ x, y: 82, s: 0.36, color: reacts ? sideCol : "#556", look: reacts ? look : 0, walk: reacts ? 0 : 0.7, arms: reacts ? (kind === 4 ? 1 : 0) : clash / 5, alpha: 0.85 });
      if (reacts) out += emo(k, x, 50, ["🚶", "👀", "🤫", "📱", "🙌", "🏃"][kind], 9);
    }
    out += emo(k, 22, 22, ["🚶", "👀", "🤫", "📱", "🙌", "🏃"][kind], 14);
    out += k.arrow({ x1: 161, y1: 30, x2: 161 + [24, 0.1, -24][side], y2: 30, color: sideCol, w: 2 });
    out += k.person({ x: 140, y: 116, s: 0.6, color: S.gold, mood: -0.4 }) + k.person({ x: 182, y: 116, s: 0.6, color: S.blue, look: -1 });
    out += timer(k, 300, 16, delay / 5, S.orange) + k.label({ x: 286, y: 19, text: `${fmt(delay)}s`, size: 8, color: "#ccc", anchor: "end" });
    if (clash > 0) out += emo(k, 50, 22, "🎶", 8 + clash * 2);
    out += strip(k, [g.steps("reaction", "Reaction"), g.num("howMany", "People", ""), g.num("delay", "Delay", "s"), g.word("kind", "They"), g.steps("side", "Side"), g.num("clash", "Clash", "")]);
    return out + k.caption(`${n} people behind: ${v("reaction")}`);
  });

  /* ======================= backStory ======================= */
  /* The main pair in front; a little story steps across the background, step by step, to its ending. */
  look("backStory", (v, k, g) => {
    const vis = v.n("visible");
    const steps = Math.round(v.n("steps"));
    const kind = idx(v, "kind", 5);
    const who = idx(v, "who", 4);
    const during = idx(v, "during", 3);
    const end = idx(v, "ending", 4);
    let out = room(k, 70);
    const alpha = 0.2 + vis * 0.16;
    for (let i = 0; i < steps; i++) {
      const x = 150 + (i * 150) / Math.max(1, steps - 1 || 1);
      out += `<g opacity="${r1(alpha * 100) / 100}">` + emo(k, x, 66, ["🧍", "👫", "🐕", "👥"][who], 12) + `</g>` + k.label({ x, y: 40, text: String(i + 1), size: 8, color: "#aaa" });
    }
    out += line(150, 46, 300, 46, "#666", 1, "3 3");
    const ex = 300;
    if (end === 1) out += k.dot({ x: ex, y: 46, r: 3, color: S.green });
    if (end === 2) out += emo(k, ex, 30, "⭐", 14);
    if (end === 3) out += k.arrow({ x1: ex, y1: 50, x2: 120, y2: 92, color: S.red, w: 2.5 });
    out += emo(k, 300, 18, ["😄", "🪞", "⚠️", "💕", "🔍"][kind], 14);
    out += k.person({ x: 60, y: 116, s: 0.6, color: S.gold }) + k.person({ x: 100, y: 116, s: 0.6, color: S.blue, look: -1 });
    out += emo(k, 80, 36, ["💬", "⏸️", "🎥"][during], 12);
    out += strip(k, [g.num("visible", "Easy to spot", ""), g.num("steps", "Steps", ""), g.word("kind", "Kind"), g.word("who", "Who"), g.word("during", "Seen"), g.steps("ending", "Ending")]);
    return out + k.caption(`A little story behind them: ${v("kind")}`);
  });

  /* ======================= behindTheirBack ======================= */
  /* The character in front, facing away from the danger; the danger behind, nearer or further, clearer or fainter. */
  look("behindTheirBack", (v, k, g) => {
    const seen = idx(v, "seen", 4);
    const what = idx(v, "what", 5);
    const dist = v.n("distance");
    const closing = idx(v, "closing", 4);
    const hold = v.n("hold");
    const turn = idx(v, "turn", 4);
    let out = room(k, 76);
    const dx = 220 - (dist / 50) * 190;
    const size = 30 - (dist / 50) * 18;
    out += `<g opacity="${[0.25, 0.5, 0.8, 1][seen]}">` + emo(k, dx, 78, ["👤", "🔪", "🔥", "🐺", "🔍"][what], size) + `</g>`;
    if (seen === 0) out += `<circle cx="${r1(dx)}" cy="68" r="${r1(size * 0.6)}" fill="${S.wall}" opacity="0.5"/>`;
    const dir = [-1, 0, 0.6, 1.4][closing];
    if (dir) out += k.arrow({ x1: dx, y1: 90, x2: dx + dir * 26, y2: 90, color: S.red, w: 2 });
    else out += k.ring({ x: dx, y: 90, r: 4, color: S.red });
    const look = [-1, -0.5, -0.2, 1][turn];
    out += k.person({ x: 250, y: 116, s: 0.75, color: S.gold, look, mood: [0, -0.6, -0.9, 0.4][turn] });
    out += rect(20, 8, 180, 6, "#33323d", ' rx="3"') + rect(20, 8, 180 * (hold / 30), 6, S.orange, ' rx="3"') + k.label({ x: 206, y: 14, text: `${fmt(hold)}s`, size: 8, color: "#ccc", anchor: "start" });
    out += strip(k, [g.steps("seen", "We see it"), g.word("what", "What"), g.num("distance", "Behind", " m"), g.steps("closing", "Closing"), g.num("hold", "Watch", "s"), g.steps("turn", "Turn", S.red)]);
    return out + k.caption(`${v("what")}, ${fmt(dist)} m behind them`);
  });

  /* ======================= signsInBackground ======================= */
  /* A wall of signs behind a person; the main sign's words fade in as it gets easier to read. */
  look("signsInBackground", (v, k, g) => {
    const read = v.n("readable");
    const kind = idx(v, "kind", 6);
    const job = idx(v, "job", 5);
    const count = Math.round(v.n("count"));
    const rt = v.n("readTime");
    const noticed = idx(v, "noticed", 4);
    let out = room(k, 92);
    for (let i = 0; i < count; i++) out += rect(8 + (i % 5) * 22, 14 + Math.floor(i / 5) * 26, 18, 20, k.hsl(i * 47, 40, 45), ' rx="2"');
    out += rect(140, 14, 120, 54, "#26262e", ` stroke="${S.gold}" stroke-width="1.5" rx="3"`) + emo(k, 154, 32, ["🖼️", "🪧", "📺", "🎨", "📰", "📱"][kind], 13);
    const words = ["OPEN", "STORM COMING", "EVERYTHING MUST GO", "DANGER", "HOME"][job];
    out += k.text({ x: 210, y: 52, text: words, size: 9, color: "#fff", weight: 700, alpha: 0.1 + read * 0.18 });
    out += rect(140, 72, 120 * (rt / 10), 4, S.orange);
    const lookAt = [0.6, -0.3, -0.8, -1][noticed];
    out += k.person({ x: 290, y: 118, s: 0.55, color: S.gold, look: lookAt, mood: noticed === 3 ? -0.5 : 0 });
    if (noticed >= 2) out += k.bubble({ x: 280, y: 30, w: 40, h: 18, text: "…", size: 9, tail: 4 });
    out += strip(k, [g.num("readable", "Readable", ""), g.word("kind", "Kind"), g.word("job", "Job"), g.num("count", "Signs", ""), g.num("readTime", "Read time", "s"), g.steps("noticed", "Noticed")]);
    return out + k.caption(`${count} signs; the main one ${v("job")}`);
  });

  /* ======================= seasons ======================= */
  /* A tree in a field, dressed for the season; dots above count the seasons that pass. */
  look("seasons", (v, k, g) => {
    const shown = v.n("shown");
    const season = idx(v, "season", 4);
    const sign = idx(v, "signs", 6);
    const passes = Math.round(v.n("passes"));
    const hol = idx(v, "holiday", 4);
    const mean = idx(v, "meaning", 5);
    const skyC = ["#7c8ea3", "#9fd0e6", "#6fb3e8", "#c49a6c"][season];
    const groundC = ["#e8eef2", "#6fae5a", "#c9b35a", "#9a6a3a"][season];
    let out = rect(0, 0, 320, 120, k.mix("#3a3a44", skyC, 0.3 + shown * 0.14)) + rect(0, 92, 320, 28, k.mix("#3a3a44", groundC, 0.3 + shown * 0.14));
    out += rect(156, 50, 8, 44, "#5a3a22") + line(160, 60, 136, 40, "#5a3a22", 4) + line(160, 56, 186, 36, "#5a3a22", 4);
    const col = ["#5a3a22", "#f2a7c3", "#ffffff", "#e8913a", "#ffd166", "#ffb070"][sign];
    const n = 3 + Math.round(shown * 7);
    for (let i = 0; i < n; i++) {
      const x = 120 + k.rnd(i + 1) * 80;
      const y = 22 + k.rnd(i + 9) * 34 + (sign === 3 ? k.rnd(i + 4) * 50 : 0);
      out += sign === 5 ? line(x - 6, y + 40, x + 6, y + 38, col, 1) : k.dot({ x, y, r: sign === 0 ? 1 : 2.5, color: sign === 4 ? k.hsl(i * 70, 80, 60) : col });
    }
    for (let i = 0; i <= passes; i++) out += k.dot({ x: 14 + i * 14, y: 12, r: 4.5, color: ["#cfe3f0", "#f2a7c3", "#ffd166", "#e8913a"][(season + i) % 4] });
    if (hol) out += emo(k, 270, 80, ["", "🎁", "🎄", "🎉"][hol], 8 + hol * 6);
    out += chip(k, 310, 30, ["just a time of year", "a new start ↑", "full life ●", "fading ↓", "an ending ■"][mean], S.purple, "end");
    out += strip(k, [g.num("shown", "Shows", ""), g.word("season", "Season"), g.word("signs", "Sign"), g.num("passes", "Passes", ""), g.steps("holiday", "Holiday"), g.steps("meaning", "Means")]);
    return out + k.caption(`${v("season")}, ${passes} seasons pass`);
  });

  /* ======================= roomMirrorsThem ======================= */
  /* A row of small snapshots of the same room, one per visit, getting worse or better; the big room is the last look. */
  look("roomMirrorsThem", (v, k, g) => {
    const fol = v.n("follows");
    const dir = idx(v, "direction", 3) - 1;
    const by = idx(v, "shownBy", 6);
    const visits = Math.round(v.n("visits"));
    const last = idx(v, "lastLook", 4);
    const seen = idx(v, "seenBy", 3);
    const thing = (x, y, s, q) => {
      /* q from -1 (worst) to 1 (best) */
      if (by === 0) return Array.from({ length: Math.round((1 - q) * 4) }, (_, i) => k.dot({ x: x + 4 * s + i * 3 * s, y: y + 18 * s, r: 1.4 * s, color: "#8a6a4a" })).join("");
      if (by === 1) return rect(x + 4 * s, y + 3 * s, 10 * s, 8 * s, k.mix("#26313f", "#e6f0f7", (q + 1) / 2));
      if (by === 2) return line(x + 20 * s, y + 20 * s, x + 20 * s, y + (12 - q * 6) * s, q > 0 ? S.green : "#7a6a3a", 2 * s);
      if (by === 3) return rect(x + 6 * s, y + 4 * s, 8 * s, 6 * s, q > -0.3 ? S.gold : "#444") + rect(x + 18 * s, y + 4 * s, 6 * s, 6 * s, q > 0.3 ? S.pink : "#444");
      if (by === 4) return rect(x + (6 + (1 - q) * 6) * s, y + 14 * s, 10 * s, 5 * s, "#7a5a3a");
      return rect(x, y, 30 * s, 22 * s, k.hsl(30 + q * 90, 50, 50, 0.4));
    };
    const box = (x, y, s, q) => rect(x, y, 30 * s, 22 * s, k.mix("#2a2a30", "#6a6a78", (q + 1) / 2), ` stroke="#888" stroke-width="0.6"`) + thing(x, y, s, q);
    let out = bg(k);
    for (let i = 0; i < visits; i++) {
      const t = visits > 1 ? i / (visits - 1) : 0;
      out += box(8 + i * 31, 8, 0.95, k.clamp(dir * t * (0.2 + (fol / 5) * 0.8), -1, 1));
    }
    const q = [-1, 0, 1, 0][last];
    out += box(90, 40, 3.2, q);
    if (last === 3) out += rect(90, 40, 96, 70, "#1a1a20", ' opacity="0.7"') + k.label({ x: 138, y: 80, text: "empty", size: 10, color: "#aaa" });
    out += [k.label({ x: 230, y: 80, text: "👁️ us", size: 12 }), k.person({ x: 240, y: 112, s: 0.5, color: S.blue, look: -1 }), k.person({ x: 240, y: 112, s: 0.5, color: S.gold, look: -1 })][seen];
    out += strip(k, [g.num("follows", "Follows", ""), g.steps("direction", "Way"), g.word("shownBy", "Shown by"), g.num("visits", "Visits", ""), g.word("lastLook", "Last look"), g.steps("seenBy", "Seen by")]);
    return out + k.caption(`The place ${v("direction")}, ${visits} visits`);
  });

  /* ======================= threshold ======================= */
  /* A wall with a doorway; the other side is lit as much as we see of it; the person stands back, on, or past the line. */
  look("threshold", (v, k, g) => {
    const wgt = v.n("weight");
    const kind = idx(v, "kind", 6);
    const pause = v.n("pause");
    const way = idx(v, "way", 3);
    const beyond = idx(v, "beyond", 4);
    const behind = idx(v, "behind", 4);
    let out = room(k, 100);
    out += rect(140, 20, 50, 80, "#0c0c10");
    out += rect(140, 20, 50 * [0, 0.15, 0.5, 1][beyond], 80, "#f2e2b0", ' opacity="0.8"');
    out += `<rect x="138" y="18" width="54" height="82" fill="none" stroke="${k.mix("#777777", "#ffd166", wgt / 5)}" stroke-width="${r1(2 + wgt)}"/>`;
    const leaf = [0.9, 0.5, 0.15, 0.05][behind];
    out += rect(192, 20, 40 * leaf, 80, "#6a4a32", ' stroke="#222"');
    if (behind === 3) out += emo(k, 214, 60, "🔒", 14);
    out += emo(k, 165, 14, ["🚪", "🛏️", "⛩️", "🪟", "🚗", "⛺"][kind], 12);
    const px = [90, 165, 240][way];
    out += k.person({ x: px, y: 112, s: 0.6, color: S.gold, look: way === 0 ? -1 : 1, mood: way === 0 ? -0.4 : 0.2 });
    out += timer(k, 30, 20, pause / 10, S.orange) + k.label({ x: 44, y: 24, text: `${fmt(pause)}s at the door`, size: 8, color: "#ccc", anchor: "start" });
    out += strip(k, [g.num("weight", "Matters", ""), g.word("kind", "Doorway"), g.num("pause", "Pause", "s"), g.steps("way", "They"), g.steps("beyond", "Beyond"), g.steps("behind", "Behind")]);
    return out + k.caption(`At ${v("kind")}: they ${v("way")}`);
  });

  /* ======================= waysOut ======================= */
  /* A room seen from above: doors in the walls, the blocked ones crossed out, hiding spots, and the way they know. */
  look("waysOut", (v, k, g) => {
    const tr = v.n("trapped");
    const exits = Math.round(v.n("exits"));
    const blocked = idx(v, "blocked", 4);
    const guard = idx(v, "guard", 5);
    const hiding = Math.round(v.n("hiding"));
    const knows = idx(v, "knows", 3);
    let out = bg(k) + rect(60, 12, 200, 100, "#2a2630", ` stroke="${k.mix("#888888", "#e4572e", tr / 5)}" stroke-width="${r1(2 + tr * 1.2)}"`);
    const spots = [[160, 12], [260, 62], [160, 112], [60, 62], [110, 12], [210, 112]];
    const nBlocked = exits ? [0, 1, Math.max(1, exits - 1), exits][blocked] : 0;
    for (let i = 0; i < exits; i++) {
      const [x, y] = spots[i];
      const horiz = y === 12 || y === 112;
      out += horiz ? rect(x - 10, y - 3, 20, 6, S.green) : rect(x - 3, y - 10, 6, 20, S.green);
      if (i < nBlocked) out += k.label({ x, y: y + 4, text: "✖", size: 12, color: S.red });
      if (i === 0 && nBlocked) out += emo(k, x + 18, y + 20, ["🙂", "🔒", "🧍", "🔥", "😨"][guard], 11);
    }
    out += emo(k, 30, 40, ["🙂", "🔒", "🧍", "🔥", "😨"][guard], 16);
    out += rect(60, 12, 200, 100, S.red, ` opacity="${[0, 0.1, 0.2, 0.32][blocked]}"`);
    for (let i = 0; i < hiding; i++) out += rect(72 + i * 30, 80, 14, 14, "#111", ' rx="2"');
    out += k.dot({ x: 160, y: 62, r: 6, color: S.gold });
    if (exits && knows) out += line(160, 62, spots[exits - 1][0], spots[exits - 1][1], S.gold, 1.5, knows === 1 ? "3 3" : "");
    if (knows === 0) out += k.label({ x: 160, y: 50, text: "?", size: 12, color: S.gold });
    out += strip(k, [g.num("trapped", "Trapped", ""), g.num("exits", "Ways out", ""), g.steps("blocked", "Blocked", S.red), g.word("guard", "In the way"), g.num("hiding", "Hiding spots", ""), g.steps("knows", "Know the way")]);
    return out + k.caption(`${exits} ways out, ${v("blocked")}`);
  });

  /* ======================= mirrorInRoom ======================= */
  /* A person and a mirror; inside the mirror their reflection, with someone behind or a different self, cracked or fogged. */
  look("mirrorInRoom", (v, k, g) => {
    const pres = v.n("presence");
    const kind = idx(v, "kind", 6);
    const shows = idx(v, "shows", 4);
    const state = idx(v, "state", 5);
    const face = idx(v, "face", 4);
    const copies = Math.round(v.n("copies"));
    let out = room(k, 100);
    const mw = 50 + pres * 12;
    const mh = kind === 4 ? 18 : kind === 5 ? 30 : 40 + pres * 8;
    const mx = 300 - mw;
    const my = kind === 4 ? 100 : 12;
    out += kind === 4 ? `<ellipse cx="${r1(mx + mw / 2)}" cy="${r1(my + 8)}" rx="${r1(mw / 2)}" ry="9" fill="#4a5a6a"/>` : rect(mx, my, mw, mh, kind === 3 ? "#111118" : "#5a6a7a", ` stroke="#c9b37a" stroke-width="${kind === 2 ? 1 : 3}"${kind === 1 ? ' rx="10"' : ""}`);
    const n = Math.min(copies, 6);
    for (let i = 0; i < n; i++) {
      const rx = mx + mw / 2 + (i - (n - 1) / 2) * 10;
      out += `<g opacity="${r1((1 - i * 0.12) * 100) / 100}">` + k.person({ x: rx, y: my + Math.max(16, mh) - 2, s: 0.28, color: shows === 3 ? S.red : S.gold, mood: shows === 3 ? -0.8 : 0 }) + `</g>`;
    }
    if (copies > 6) out += k.label({ x: mx + mw - 4, y: my + 10, text: `×${copies}`, size: 8, color: "#fff", anchor: "end" });
    if (shows === 1) out += k.person({ x: mx + mw / 2 + 16, y: my + Math.max(16, mh) - 2, s: 0.32, color: "#222", alpha: 0.9 });
    if (shows === 2) out += emo(k, mx + 10, my + 14, "👁️", 10);
    if (state === 1) out += rect(mx, my, mw, mh, "#ddd", ' opacity="0.45"');
    if (state === 2) out += rect(mx, my, mw, mh, "#6a5a3a", ' opacity="0.35"');
    if (state >= 3) out += line(mx + mw * 0.3, my, mx + mw * 0.6, my + mh, "#fff", 1.2) + line(mx, my + mh * 0.4, mx + mw, my + mh * 0.7, "#fff", 1.2);
    if (state === 4) out += Array.from({ length: 5 }, (_, i) => rect(mx + i * 12, 104 + (i % 2) * 5, 6, 3, "#9fb0c0")).join("");
    const lk = [-1, 0.3, 1, 1][face];
    out += k.person({ x: 80, y: 116, s: 0.7, color: S.gold, look: lk, mood: face === 0 ? -0.5 : 0 });
    if (face === 3) out += k.bubble({ x: 110, y: 20, w: 50, h: 18, text: "you…", size: 9, tail: -10 });
    out += strip(k, [g.num("presence", "Matters", ""), g.word("kind", "Mirror"), g.word("shows", "Shows"), g.steps("state", "State"), g.steps("face", "They"), g.num("copies", "Reflections", "")]);
    return out + k.caption(`${v("kind")}: ${v("shows")}`);
  });

  /* ======================= homeBase ======================= */
  /* The home place as an icon with a glow; below it, the film's timeline with a dot for every return. */
  look("homeBase", (v, k, g) => {
    const pull = v.n("pull");
    const ret = Math.round(v.n("returns"));
    const kind = idx(v, "kind", 6);
    const safe = idx(v, "safety", 4);
    const first = idx(v, "firstSeen", 4);
    const last = idx(v, "lastVisit", 4);
    const col = [S.red, S.orange, S.green, "#9fe8b0"][safe];
    let out = bg(k);
    for (let i = 0; i < Math.round(pull); i++) out += k.ring({ x: 160, y: 46, r: 18 + i * 7, color: col, w: 1.2 });
    out += emo(k, 160, 54, ["🏠", "☕", "🏢", "🚗", "🌳", "🏚️"][kind], 22);
    out += rect(20, 96, 280, 4, "#33323d");
    const start = [0, 0.15, 0.5, 0.85][first];
    for (let i = 0; i < ret; i++) out += k.dot({ x: 20 + 280 * (start + ((1 - start) * i) / Math.max(1, ret - 1)), y: 98, r: 3, color: col });
    out += emo(k, 306, 86, ["🔥", "👋", "🏠", "👥"][last], 13);
    out += strip(k, [g.num("pull", "Home", ""), g.num("returns", "Returns", ""), g.word("kind", "Place"), g.steps("safety", "Safety"), g.steps("firstSeen", "First seen"), g.word("lastVisit", "At the end")]);
    return out + k.caption(`${v("kind")}, ${ret} visits, ${v("safety")}`);
  });

  /* ======================= oneLocation ======================= */
  /* The building with its rooms; walls pressing in; red arrows for tries to leave; a window if we see outside. */
  look("oneLocation", (v, k, g) => {
    const share = v.n("share");
    const size = idx(v, "size", 5);
    const rooms = Math.round(v.n("rooms"));
    const leaving = Math.round(v.n("leaving"));
    const outside = idx(v, "outside", 4);
    const sq = v.n("squeeze");
    const bw = 70 + size * 28;
    const bx = 160 - bw / 2;
    const inset = sq * 4;
    let out = bg(k) + rect(bx, 22, bw, 80, "#2a2630", ` stroke="#999" stroke-width="2"`);
    out += rect(bx + inset, 22 + inset, bw - inset * 2, 80 - inset * 2, "#3a3440", ` stroke="${k.mix("#888888", "#e4572e", sq / 5)}" stroke-width="1.5"`);
    const cols = Math.min(rooms, 5);
    for (let i = 1; i < rooms; i++) {
      const x = bx + inset + ((bw - inset * 2) * (i % cols)) / cols;
      if (i % cols) out += line(x, 22 + inset, x, 102 - inset, "#666", 1);
    }
    if (rooms > 5) out += line(bx + inset, 62, bx + bw - inset, 62, "#666", 1);
    for (let i = 0; i < leaving; i++) out += k.arrow({ x1: bx + 20 + i * 8, y1: 60, x2: bx - 4, y2: 30 + i * 7, color: S.red, w: 1 });
    out += [ "", rect(bx + bw - 22, 30, 14, 12, "#9fd3ff"), emo(k, bx + bw + 16, 40, "💭", 14), emo(k, bx + bw + 16, 110, "🌅", 14)][outside];
    out += rect(20, 10, 280, 5, "#33323d") + rect(20, 10, 280 * (share / 100), 5, S.gold);
    out += strip(k, [g.num("share", "In one place", "%"), g.steps("size", "Size"), g.num("rooms", "Rooms", ""), g.num("leaving", "Tries to leave", ""), g.word("outside", "Outside"), g.num("squeeze", "Squeeze", "")]);
    return out + k.caption(`${fmt(share)}% of the film in ${v("size")}`);
  });

  /* ======================= heightGap ======================= */
  /* Two people; one raised on a step by the height gap; a little camera at whose eye height we look from. */
  look("heightGap", (v, k, g) => {
    const gap = v.n("gap");
    const higher = idx(v, "higher", 3);
    const how = idx(v, "how", 6);
    const m = v.n("meters");
    const flips = idx(v, "flips", 3);
    const cam = idx(v, "camera", 3);
    const lift = m * 18 + gap * 3;
    const leftUp = higher === 2 ? lift : higher === 0 ? 0 : lift / 2;
    const rightUp = higher === 0 ? lift : higher === 2 ? 0 : lift / 2;
    let out = room(k, 112);
    out += rect(70, 112 - leftUp, 60, leftUp, "#5a4a3a") + rect(190, 112 - rightUp, 60, rightUp, "#5a4a3a");
    out += k.person({ x: 100, y: 112 - leftUp, s: 0.62, color: S.gold, look: 1, mood: higher === 2 ? 0.4 : -0.3 });
    out += k.person({ x: 220, y: 112 - rightUp, s: 0.62, color: S.blue, look: -1, mood: higher === 0 ? 0.4 : -0.3 });
    out += emo(k, 160, 104, ["🪑", "🪜", "🎭", "🧎", "📏", "🐎"][how], 14);
    const camY = [Math.max(leftUp, rightUp) > 0 ? 112 - Math.min(leftUp, rightUp) - 40 : 72, 112 - (leftUp + rightUp) / 2 - 40, 112 - Math.max(leftUp, rightUp) - 40][cam];
    out += k.cam({ x: 20, y: k.clamp(camY + [10, 0, -10][cam], 10, 110), dir: 0, s: 0.6 });
    for (let i = 0; i < [0, 1, 3][flips]; i++) out += `<path d="M${130 + i * 20} 20 q10 -12 20 0" fill="none" stroke="${S.orange}" stroke-width="1.5"/>`;
    out += strip(k, [g.num("gap", "Gap", ""), g.steps("higher", "Higher"), g.word("how", "How"), g.num("meters", "Height", " m"), g.steps("flips", "Flips"), g.steps("camera", "Camera at")]);
    return out + k.caption(`${fmt(m)} m higher: ${v("higher")}`);
  });

  /* ======================= nearestCamera ======================= */
  /* A near person big in front, a far person small behind; the near one covers the far one as much as set. */
  look("nearestCamera", (v, k, g) => {
    const lead = v.n("lead");
    const who = idx(v, "who", 4);
    const dg = v.n("depthGap");
    const facing = idx(v, "facing", 3);
    const hides = idx(v, "hides", 4);
    const swaps = Math.round(v.n("swaps"));
    let out = room(k, 80);
    const farS = 0.75 - dg * 0.045 - lead * 0.03;
    const farX = 200;
    out += k.person({ x: farX, y: 84 + (1 - dg / 10) * 20, s: Math.max(0.25, farS), color: S.blue, look: -1 });
    const nearX = farX - 80 + hides * 26;
    const nearS = 0.75 + lead * 0.13;
    const o = { x: nearX, y: 150, s: nearS, color: [S.grey, S.green, S.orange, S.gold][who], look: facing === 1 ? 1 : 0 };
    out += facing === 0 ? backOf(k, o) : k.person(o);
    for (let i = 0; i < swaps; i++) out += `<path d="M${20 + i * 18} 22 q8 -10 16 0" fill="none" stroke="${S.orange}" stroke-width="1.5"/>` + k.dot({ x: 36 + i * 18, y: 22, r: 1.8, color: S.orange });
    out += strip(k, [g.num("lead", "Near one size", ""), g.word("who", "Nearest"), g.num("depthGap", "Near to far", " m"), g.steps("facing", "Faces"), g.steps("hides", "Hides"), g.num("swaps", "Swaps", "")]);
    return out + k.caption(`${v("who")} nearest, ${fmt(dg)} m in front`);
  });

  /* ======================= dividingLine ======================= */
  /* Two people with a line through the frame between them; a hand, a step or a break when it is crossed. */
  look("dividingLine", (v, k, g) => {
    const st = v.n("strength");
    const what = idx(v, "what", 7);
    const where = idx(v, "where", 3);
    const crossed = idx(v, "crossed", 4);
    const when = idx(v, "when", 3);
    const sides = idx(v, "sides", 3);
    let out = room(k, 104);
    const lx = [100, 140, 160][where];
    const w = 2 + st * 3;
    const col = what === 4 ? "#000" : ["#7a5a3a", "#9a9aa8", "#5a5060", "#6a4a2a", "#000", "#c8d0d8", "#8a7a5a"][what];
    const op = what === 4 ? 0.3 + st * 0.08 : 1;
    const dash = crossed === 3 ? "8 6" : "";
    out += `<line x1="${lx}" y1="0" x2="${lx}" y2="120" stroke="${col}" stroke-width="${r1(w)}" opacity="${r1(op * 100) / 100}"${dash ? ` stroke-dasharray="${dash}"` : ""}/>`;
    if (what === 0 || what === 5) out += `<line x1="${r1(lx + w + 4)}" y1="0" x2="${r1(lx + w + 4)}" y2="120" stroke="${col}" stroke-width="${r1(w / 2)}"/>`;
    const aX = sides === 0 ? lx - 70 : lx - 50;
    const bX = sides === 0 ? lx - 30 : lx + 50;
    const bStep = crossed === 2 ? lx - 18 : bX;
    out += k.person({ x: aX, y: 112, s: 0.6, color: S.gold, look: 1, arms: crossed === 1 ? 0.6 : 0 });
    out += k.person({ x: bStep, y: 112, s: 0.6, color: S.blue, look: -1 });
    if (sides === 2) out += k.person({ x: lx + 90, y: 112, s: 0.45, color: S.grey, look: -1, alpha: 0.7 });
    if (crossed === 1) out += k.arrow({ x1: aX + 12, y1: 60, x2: lx + 14, y2: 60, color: S.gold, w: 1.5 });
    out += emo(k, 300, 20, ["🎬", "💢", "🤫"][when], 13);
    out += strip(k, [g.num("strength", "Splits", ""), g.word("what", "Line"), g.steps("where", "Where"), g.steps("crossed", "Crossed"), g.word("when", "When"), g.steps("sides", "Sides")]);
    return out + k.caption(`${v("what")} between them, ${v("crossed")}`);
  });

  /* ======================= facingAway ======================= */
  /* The speaker and the listener; one or both turned away by degrees; a thought shows why, a timer how long. */
  look("facingAway", (v, k, g) => {
    const turn = idx(v, "turn", 4);
    const who = idx(v, "who", 4);
    const hold = v.n("hold");
    const back = idx(v, "back", 4);
    const why = idx(v, "why", 5);
    const others = idx(v, "others", 3);
    let out = room(k, 104);
    const turned = (i) => who === 2 || (who === 0 && i === 0) || (who === 1 && i === 1) || (who === 3 && i === 0);
    const draw = (x, col, i) => {
      const o = { x, y: 116, s: 0.75, color: col, look: turned(i) ? [0, 0.4, 0.9, 0][turn] : 0, mood: turned(i) && why === 0 ? -0.7 : 0 };
      return turned(i) && turn === 3 ? backOf(k, o) : k.person(o);
    };
    out += draw(110, S.gold, 0) + draw(220, S.blue, 1);
    [110, 220].forEach((x, i) => { if (turned(i)) out += k.arrow({ x1: x, y1: 14, x2: x, y2: 28, color: who === 3 ? S.gold : "#ddd", w: 1.5 }); });
    out += emo(k, 60, 30, ["😢", "🤥", "🙄", "😳", "🤔"][why], 14);
    out += timer(k, 300, 18, hold / 30, S.orange);
    out += [line(150, 14, 180, 14, S.red, 2), k.arrow({ x1: 150, y1: 14, x2: 180, y2: 14, color: S.green, w: 1 }), k.arrow({ x1: 150, y1: 14, x2: 180, y2: 14, color: S.green, w: 2.5 }), `<path d="M150 22 q15 -20 30 0" fill="none" stroke="${S.green}" stroke-width="2.5"/>`][back];
    if (others >= 1) out += line(205, 50, 125, 50, "#fff", 1, "2 3");
    if (others === 2) out += k.person({ x: 300, y: 116, s: 0.45, color: S.grey, look: -1, alpha: 0.7 }) + line(290, 70, 125, 52, "#fff", 1, "2 3");
    out += strip(k, [g.steps("turn", "Turned"), g.word("who", "Who"), g.num("hold", "Hold", "s"), g.steps("back", "Turns back"), g.word("why", "Why"), g.steps("others", "Others see")]);
    return out + k.caption(`${v("who")}: ${v("turn")}, ${v("why")}`);
  });

  /* ======================= apartFromGroup ======================= */
  /* A cluster of people and one person placed apart; an arrow if the gap closes. */
  look("apartFromGroup", (v, k, g) => {
    const apart = v.n("apart");
    const where = idx(v, "where", 4);
    const size = Math.round(v.n("groupSize"));
    const wants = idx(v, "wants", 4);
    const joins = idx(v, "joins", 4);
    const noticed = idx(v, "noticed", 3);
    let out = room(k, 80);
    const n = Math.min(12, size);
    for (let i = 0; i < n; i++) {
      const x = 70 + (i % 6) * 18 + (Math.floor(i / 6) ? 9 : 0);
      const y = 108 - Math.floor(i / 6) * 14;
      out += k.person({ x, y, s: 0.45, color: S.blue, look: noticed === 0 ? 0 : i < (noticed === 1 ? 1 : n) ? 1 : 0 });
    }
    if (size > 12) out += k.label({ x: 120, y: 30, text: `+${size - 12}`, size: 9, color: "#aaa" });
    const gap = 30 + apart * 30;
    const pos = [[190 + apart * 22, 112], [110, 70 - apart * 3], [110, 116], [180 + gap * 0.6, 112]][where];
    out += k.person({ x: Math.min(306, pos[0]), y: pos[1], s: where === 2 ? 0.7 : 0.55, color: S.gold, look: -1, mood: [-0.5, 0, 0.2, -0.8][wants], arms: wants === 2 ? 0.3 : 0 });
    if (joins === 1) out += k.arrow({ x1: Math.min(300, pos[0]) - 10, y1: 60, x2: Math.min(300, pos[0]) - 30, y2: 60, color: S.gold, w: 1 });
    if (joins === 2) out += k.arrow({ x1: Math.min(300, pos[0]) - 10, y1: 60, x2: 180, y2: 60, color: S.gold, w: 2 });
    if (joins === 3) out += k.arrow({ x1: 180, y1: 60, x2: Math.min(300, pos[0]) - 14, y2: 60, color: S.green, w: 2.5 });
    out += strip(k, [g.num("apart", "Apart", ""), g.word("where", "Where"), g.num("groupSize", "Group", ""), g.word("wants", "Feels"), g.word("joins", "Joins"), g.steps("noticed", "Noticed")]);
    return out + k.caption(`Apart from ${size}: ${v("wants")}`);
  });

  /* ======================= splashPage ======================= */
  /* Two pages of a comic: small lead-in panels on the left, the big picture taking as much as set. */
  look("splashPage", (v, k, g) => {
    const size = idx(v, "size", 4);
    const when = idx(v, "when", 4);
    const words = v.n("words");
    const lead = Math.round(v.n("leadIn"));
    const detail = v.n("detail");
    const per = Math.round(v.n("perBook"));
    let out = bg(k) + rect(20, 6, 140, 108, S.paper) + rect(160, 6, 140, 108, S.paper) + line(160, 6, 160, 114, "#bbb", 1);
    const sw = [{ x: 166, y: 60, w: 128, h: 48 }, { x: 166, y: 34, w: 128, h: 74 }, { x: 166, y: 12, w: 128, h: 96 }, { x: 26, y: 12, w: 268, h: 96 }][size];
    const leftFree = size === 3 ? 0 : lead;
    for (let i = 0; i < leftFree; i++) out += pan(k, 26 + (i % 4) * 32, 12 + Math.floor(i / 4) * 32, 28, 28, "#ddd");
    if (size < 2) for (let i = 0; i < 2; i++) out += pan(k, 166 + i * 66, 12, 62, size === 0 ? 44 : 18, "#ddd");
    out += pan(k, sw.x, sw.y, sw.w, sw.h, "#e9dcc0");
    for (let i = 0; i < Math.round(detail * 3); i++) out += k.dot({ x: sw.x + 8 + k.rnd(i + 2) * (sw.w - 16), y: sw.y + 8 + k.rnd(i + 7) * (sw.h - 16), r: 1.5 + k.rnd(i) * 2, color: S.ink });
    out += emo(k, sw.x + sw.w / 2, sw.y + sw.h / 2 + 8, ["📖", "🎭", "💥", "🌅"][when], 18 + size * 4);
    if (words > 0) out += rect(sw.x + 6, sw.y + 4, Math.min(sw.w - 12, 10 + words * 2.5), 9, "#fff", ` stroke="${S.ink}" stroke-width="0.8"`);
    for (let i = 0; i < per; i++) out += rect(304, 8 + i * 10, 10, 7, i === 0 ? S.gold : "#555");
    out += strip(k, [g.steps("size", "Size"), g.word("when", "For"), g.num("words", "Words", ""), g.num("leadIn", "Lead-in panels", ""), g.num("detail", "Detail", ""), g.num("perBook", "In the book", "")]);
    return out + k.caption(`A splash of ${v("size")}, for ${v("when")}`);
  });

  /* ======================= panelJump ======================= */
  /* Two panels and the gap between them; what changes from one to the next shows the size of the jump. */
  look("panelJump", (v, k, g) => {
    const leap = idx(v, "leap", 5);
    const fill = v.n("fillIn");
    const angle = idx(v, "angle", 3);
    const mix = v.n("mix");
    const glue = idx(v, "glue", 4);
    const gutterW = 10 + fill * 6;
    const pw = (300 - gutterW) / 2;
    const bx = 10 + pw + gutterW;
    let out = bg(k) + pan(k, 10, 10, pw, 80) + pan(k, bx, 10, pw, 80, leap === 4 ? "#c9d6ea" : S.paper);
    out += k.person({ x: 10 + pw / 2, y: 84, s: 0.6, color: S.gold, arms: 0.2 });
    const s2 = [0.6, 0.75, 1][angle];
    if (leap === 0) out += k.person({ x: bx + pw / 2, y: 84, s: s2 * 0.6 / 0.6 * 0.6, color: S.gold, arms: 0.3 });
    if (leap === 1) out += k.person({ x: bx + pw / 2 + 14, y: 84, s: s2, color: S.gold, arms: 1, walk: 0.8 });
    if (leap === 2) out += k.person({ x: bx + pw / 2, y: 84, s: s2, color: S.blue, look: -1 });
    if (leap === 3) out += rect(bx + 10, 50, pw - 20, 30, "#8aa0b0") + rect(bx + 20, 30, 20, 20, "#6a7a8a") + (angle ? emo(k, bx + pw - 20, 30, "🌳", 10 + angle * 4) : "");
    if (leap === 4) out += emo(k, bx + pw / 2, 56, angle === 2 ? "🌙" : angle === 1 ? "🏙️" : "🏞️", 26);
    for (let i = 0; i < Math.round(fill); i++) out += k.label({ x: 10 + pw + gutterW / 2, y: 26 + i * 12, text: "?", size: 9, color: S.gold });
    out += ["", k.text({ x: 160, y: 22, text: "BOOM", size: 12, color: S.red, weight: 800 }), rect(10 + pw - 30, 14, gutterW + 60, 12, "#fff", ` stroke="${S.ink}" stroke-width="0.8" rx="6"`), k.ring({ x: 10 + pw - 8, y: 40, r: 8, color: S.ink, w: 2 }) + k.ring({ x: bx + 8, y: 40, r: 8, color: S.ink, w: 2 })][glue];
    for (let i = 0; i < 8; i++) out += rect(20 + i * 36, 100, 4 + (i % 2 ? mix * 3 : 0) + (i % 3 === 0 ? mix * 1.5 : 0), 10, "#666");
    out += strip(k, [g.steps("leap", "Jump"), g.num("fillIn", "Reader fills in", ""), g.steps("angle", "Angle"), g.num("mix", "Mixed jumps", ""), g.word("glue", "Tied by")]);
    return out + k.caption(`Jump: ${v("leap")}`);
  });

  /* ======================= silentPanel ======================= */
  /* A row of panels: one with words, then the silent ones, then what breaks the silence. */
  look("silentPanel", (v, k, g) => {
    const sil = idx(v, "silence", 4);
    const count = Math.round(v.n("count"));
    const shows = idx(v, "shows", 5);
    const size = idx(v, "size", 4);
    const placed = idx(v, "placed", 4);
    const broken = idx(v, "broken", 4);
    let out = bg(k) + rect(6, 6, 308, 108, S.paper);
    out += pan(k, 12, 14, 36, 40, "#ddd") + k.bubble({ x: 30, y: 26, w: 30, h: 12, text: ["!!", "!", "…", "?"][placed], size: 7, tail: 0 });
    out += emo(k, 30, 50, ["😠", "😮", "⏳", "🔚"][placed], 10);
    const pw = [16, 24, 34, 44][size];
    const n = Math.min(count, Math.floor(220 / (pw + 3)));
    for (let i = 0; i < n; i++) {
      const x = 54 + i * (pw + 3);
      out += pan(k, x, 14, pw, 40);
      out += emo(k, x + pw / 2, 40, ["🙂", "🏞️", "🚪", "🔑", "🔁"][shows], Math.min(14, pw * 0.6));
      if (sil === 0) out += rect(x + 2, 16, pw - 4, 6, "#fff", ` stroke="${S.ink}" stroke-width="0.6"`);
      if (sil === 1) out += k.label({ x: x + pw / 2, y: 24, text: "tik", size: 6, color: S.red });
    }
    if (count > n) out += k.label({ x: 290, y: 66, text: `+${count - n}`, size: 8, color: S.ink });
    if (sil === 3) out += rect(12, 60, 296, 46, "#e8e3d8", ` stroke="${S.ink}" stroke-width="1"`) + k.label({ x: 160, y: 86, text: "(a whole page, no words)", size: 9, color: "#777" });
    else out += pan(k, 240, 62, 66, 44) + [k.bubble({ x: 273, y: 76, w: 50, h: 14, text: "…well.", size: 8, tail: 0 }), k.text({ x: 273, y: 90, text: "BANG!", size: 14, color: S.red, weight: 800 }), `<path d="M290 106 L306 90 L306 106 Z" fill="#ccc"/>`, ""][broken];
    out += strip(k, [g.steps("silence", "Silence"), g.num("count", "In a row", ""), g.word("shows", "Shows"), g.steps("size", "Size"), g.word("placed", "Placed"), g.word("broken", "Broken by")]);
    return out + k.caption(`${count} silent panels of ${v("shows")}`);
  });

  /* ======================= repeatedPanel ======================= */
  /* The same picture again and again, a little different each time as set, shrinking or growing, and the last one. */
  look("repeatedPanel", (v, k, g) => {
    const rep = Math.round(v.n("repeats"));
    const ch = idx(v, "changes", 4);
    const what = idx(v, "what", 5);
    const purpose = idx(v, "purpose", 5);
    const end = idx(v, "ending", 3);
    const shape = idx(v, "shape", 3);
    let out = bg(k) + rect(6, 6, 308, 108, S.paper);
    const base = 280 / rep - 4;
    let x = 12;
    for (let i = 0; i < rep; i++) {
      const t = rep > 1 ? i / (rep - 1) : 0;
      const sc = [1 - t * 0.5, 1, 0.5 + t * 0.5][shape];
      const w = Math.max(10, base * sc);
      const h = Math.max(14, 70 * sc);
      const last = i === rep - 1;
      out += pan(k, x, 60 - h / 2, w, h, last && end === 2 ? "#ffe6a8" : S.paper);
      const shift = ch * i * 1.5;
      out += emo(k, x + w / 2 + shift * 0.3, 60 + 5, ["🙂", "🕰️", "🛋️", "👫", "📱"][what], Math.min(18, w * 0.7));
      if (ch >= 2) out += k.dot({ x: x + 4 + ((i * 7) % Math.max(4, w - 8)), y: 60 - h / 2 + 5, r: 1.6, color: S.red });
      if (last && end === 1) out += k.dot({ x: x + w - 5, y: 60 - h / 2 + 5, r: 3, color: S.gold });
      if (last && end === 2) out += k.text({ x: x + w / 2, y: 60 - h / 2 + 12, text: "!", size: 12, color: S.red, weight: 800 });
      x += w + 4;
    }
    out += emo(k, 300, 108, ["😄", "⏳", "😬", "😰", "🌫️"][purpose], 11);
    out += strip(k, [g.num("repeats", "Repeats", ""), g.steps("changes", "Changes"), g.word("what", "Shows"), g.word("purpose", "For"), g.steps("ending", "Ending"), g.steps("shape", "Shape")]);
    return out + k.caption(`${rep} times the same ${v("what")}, ${v("purpose")}`);
  });

  const bw0 = (cover) => [26, 34, 46][cover];
  /* ======================= readingPath ======================= */
  /* A comic page with numbered balloons and the line the eye follows between them. */
  look("readingPath", (v, k, g) => {
    const clar = v.n("clarity");
    const order = idx(v, "order", 5);
    const first = idx(v, "firstSpeaker", 3);
    const tails = idx(v, "tails", 3);
    const nb = Math.round(v.n("balloons"));
    const cover = idx(v, "cover", 3);
    let out = bg(k) + rect(60, 4, 200, 112, S.paper);
    for (let r = 0; r < 2; r++) for (let c = 0; c < 2; c++) out += pan(k, 66 + c * 96, 10 + r * 52, 92, 48);
    const paths = [
      [[0, 0], [1, 0], [0, 1], [1, 1]],
      [[0, 0], [1, 0], [1, 1], [0, 1]],
      [[0, 0], [1, 0], [1, 1], [0, 1], [0.5, 0.5]],
      [[1, 0], [0, 0], [1, 1], [0, 1]],
      [[0.5, 1], [0, 0], [1, 1], [1, 0]],
    ][order];
    const pt = (p, j) => [70 + p[0] * 150 + (5 - clar) * 6 * (k.rnd(j + 3) - 0.5), 18 + p[1] * 70 + (5 - clar) * 6 * (k.rnd(j + 8) - 0.5)];
    const route = paths.map((p, j) => pt(p, j));
    out += `<polyline points="${route.map((p) => `${r1(p[0] + 30)},${r1(p[1] + 14)}`).join(" ")}" fill="none" stroke="${S.purple}" stroke-width="${r1(0.8 + clar * 0.5)}" opacity="${r1((0.3 + clar * 0.14) * 100) / 100}"/>`;
    const pts = Array.from({ length: Math.max(1, nb) }, (_, j) => pt(paths[j % paths.length], j));
    /* a key balloon at the side shows the balloon style even when the page has none */
    out += `<rect x="8" y="84" width="${bw0(cover)}" height="${[10, 13, 17][cover]}" rx="5" fill="#fff" stroke="${S.ink}" stroke-width="0.8"/>` + (tails ? line(16, 93, 12, 93 + tails * 7, "#fff", 1) : "") + k.label({ x: 16, y: 91, text: "1", size: 7, color: first ? S.red : S.ink, weight: first === 2 ? 800 : 400 });
    if (nb > 1) out += `<polyline points="${pts.map((p) => `${r1(p[0] + 15)},${r1(p[1] + 5)}`).join(" ")}" fill="none" stroke="${S.orange}" stroke-width="${r1(0.6 + clar * 0.4)}" stroke-dasharray="3 2"/>`;
    const bw = bw0(cover);
    pts.slice(0, nb).forEach((p, j) => {
      out += `<rect x="${r1(p[0])}" y="${r1(p[1] - 2)}" width="${bw}" height="${[10, 13, 17][cover]}" rx="5" fill="#fff" stroke="${S.ink}" stroke-width="0.8"/>`;
      if (tails) out += line(p[0] + 8, p[1] + 9, p[0] + 8 + (j % 2 ? 4 : -4), p[1] + 9 + tails * 7, S.ink, 1);
      out += k.label({ x: p[0] + 8, y: p[1] + 7, text: String(j + 1), size: 7, color: j === 0 && first ? S.red : S.ink, weight: j === 0 && first === 2 ? 800 : 400 });
    });
    out += emo(k, 30, 60, ["➡️", "↩️", "🌀", "⬅️", "🔀"][order], 16);
    out += strip(k, [g.num("clarity", "Clear", ""), g.word("order", "Order"), g.steps("firstSpeaker", "First first"), g.steps("tails", "Tails"), g.num("balloons", "Balloons", ""), g.steps("cover", "Cover art")]);
    return out + k.caption(`${nb} balloons, read ${v("order")}`);
  });
})(typeof window !== "undefined" ? window.CuriosityWindows : require("./windows.js"));
