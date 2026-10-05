/* look for the music and audio-mix curiosities in data/db-depth-sound.js (depth thread, sound): the live picture at
   the top of each window. Same house style as look-heart-comedy.js and look-sound.js: a picture on top (y 0 to
   120) that draws the music as shapes you can read without hearing it (beats as dots, notes on a staff, loudness
   as a filled wave along a timeline, a room with an ear), a strip of small labelled gauges below it, and a
   caption. Colors: gold = the music, blue = the story's own sound, red = danger, green = calm, purple = memory.
   Every own setting moves something of its own. */
(function (W) {
  const S = { bg: "#15151c", lane: "#22222b", gold: "#ffd166", red: "#e4572e", blue: "#6fa8dc", green: "#5fae78", purple: "#9b6bb5", grey: "#8a8a96", pink: "#d9789b", paper: "#f4f1ea", ink: "#1c1712", ice: "#9fd3ff", orange: "#e8913a" };
  const r1 = (n) => Math.round(n * 10) / 10;
  const fmt = (n) => String(Math.round(n * 100) / 100);

  /* ---------- small drawing helpers ---------- */
  const chip = (k, x, y, text, color, anchor) => {
    const w = String(text).length * 5.2 + 10;
    const x0 = anchor === "end" ? x - w : anchor === "middle" ? x - w / 2 : x;
    return `<rect x="${r1(x0)}" y="${r1(y - 10)}" width="${r1(w)}" height="14" rx="7" fill="#33323d" stroke="${color || "#555"}" stroke-width="0.8"/>` + k.label({ x: x0 + w / 2, y: y + 0.5, text, size: 9, color: "#fff" });
  };
  const emo = (k, x, y, e, size) => k.label({ x, y, text: e, size: size || 16 });
  /* A loudness shape along a lane: f(t) gives 0..1 at each point, drawn as a filled wave around y. */
  function env(k, x, y, w, h, f, color, alpha) {
    const top = [];
    const bot = [];
    for (let i = 0; i <= 80; i++) {
      const t = i / 80;
      const a = k.clamp(f(t), 0, 1);
      const hh = (a * h * (0.6 + 0.4 * Math.abs(Math.sin(i * 1.7)))) / 2;
      top.push(`${r1(x + t * w)},${r1(y - hh)}`);
      bot.unshift(`${r1(x + t * w)},${r1(y + hh)}`);
    }
    return `<polygon points="${top.concat(bot).join(" ")}" fill="${color || S.gold}" opacity="${alpha == null ? 0.85 : alpha}"/>`;
  }
  const lane = (k, x, y, w, h, label) => `<rect x="${x}" y="${r1(y - h / 2)}" width="${w}" height="${h}" rx="3" fill="${S.lane}"/>` + (label ? k.label({ x: x - 4, y: y + 3, text: label, size: 8, color: "#aaa", anchor: "end" }) : "");
  const vline = (k, x, y1, y2, color, dash, w) => `<line x1="${r1(x)}" y1="${r1(y1)}" x2="${r1(x)}" y2="${r1(y2)}" stroke="${color || "#fff"}" stroke-width="${w || 2}"${dash ? ` stroke-dasharray="${dash}"` : ""}/>`;
  /* A note head with a stem. */
  const note = (k, x, y, color, s) => `<ellipse cx="${r1(x)}" cy="${r1(y)}" rx="${r1(4 * (s || 1))}" ry="${r1(3 * (s || 1))}" fill="${color || S.gold}"/><line x1="${r1(x + 3.5 * (s || 1))}" y1="${r1(y)}" x2="${r1(x + 3.5 * (s || 1))}" y2="${r1(y - 12 * (s || 1))}" stroke="${color || S.gold}" stroke-width="1.5"/>`;
  /* Five staff lines. */
  const staff = (k, x, y, w) => [0, 1, 2, 3, 4].map((i) => `<line x1="${x}" y1="${y + i * 6}" x2="${x + w}" y2="${y + i * 6}" stroke="#4a4a58" stroke-width="1"/>`).join("");
  const ear = (k, x, y, s) => `<path d="M${r1(x)} ${r1(y - 12 * s)} q${r1(10 * s)} 0 ${r1(10 * s)} ${r1(10 * s)} q0 ${r1(8 * s)} ${r1(-6 * s)} ${r1(12 * s)} q${r1(-4 * s)} ${r1(2 * s)} ${r1(-4 * s)} ${r1(6 * s)}" fill="none" stroke="#f0c8a0" stroke-width="${r1(3 * s)}" stroke-linecap="round"/>`;
  /* Rings of sound around a point. */
  const ripples = (k, x, y, n, color, gap) => Array.from({ length: Math.max(0, Math.round(n)) }, (_, i) => k.ring({ x, y, r: 6 + i * (gap || 7), color: color || S.ice, w: 1.4 })).join("");

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

  /* ======================= tempoShift ======================= */
  /* Beats as dots along a timeline: they bunch up as the music speeds up and spread out as it slows. */
  look("tempoShift", (v, k, g) => {
    const sh = idx(v, "shift", 5);
    const bpm = v.n("startBpm");
    const hq = idx(v, "howQuick", 4);
    const tie = idx(v, "tiedTo", 5);
    const feel = idx(v, "feel", 4);
    const land = idx(v, "landing", 4);
    const delta = [-0.6, -0.25, 0, 0.3, 1][sh];
    const prog = (t) => [t, k.clamp((t - 0.2) / 0.5, 0, 1), k.clamp((t - 0.45) / 0.1, 0, 1), t > 0.5 ? 1 : 0][hq];
    const speed = (t) => (land === 1 && t > 0.88 ? 1 : 1 + delta * prog(t));
    let out = bg(k) + lane(k, 30, 46, 270, 34, "beat");
    let t = 0;
    let i = 0;
    while (t <= 1 && i < 200) {
      if (land === 0 && t > 0.9) break;
      const x = 30 + t * 270;
      const y = 46 + (i % 2 ? [0, 0, 4, 8][feel] : 0) - (i % 2 ? 0 : [0, 0, 1, 2][feel]);
      out += feel === 0 ? `<rect x="${r1(x - 2.5)}" y="${r1(y - 2.5)}" width="5" height="5" fill="${S.gold}"/>` : k.dot({ x, y, r: 2.8, color: S.gold });
      t += 2400 / bpm / 270 / speed(t);
      i++;
    }
    if (land === 0) out += vline(k, 30 + 0.9 * 270, 28, 64, S.red, "", 3);
    if (land === 3) out += k.arrow({ x1: 290, y1: 74, x2: 314, y2: 74, color: S.gold, w: 2 });
    /* the speed as a line */
    const pts = Array.from({ length: 41 }, (_, j) => k.clamp(0.5 + (speed(j / 40) - 1) * 0.45, 0, 1));
    out += lane(k, 30, 92, 270, 26, "speed") + k.graph({ x: 30, y: 80, w: 270, h: 24, points: pts, color: S.orange });
    out += emo(k, 14, 22, ["🎵", "❤️", "👣", "⏰", "🏃"][tie], 14) + k.label({ x: 30, y: 20, text: `${fmt(bpm)} beats a minute at the start`, size: 9, color: "#ccc", anchor: "start" });
    out += strip(k, [g.steps("shift", "Speed goes"), g.num("startBpm", "Start", " bpm"), g.steps("howQuick", "How quick"), g.word("tiedTo", "Follows"), g.steps("feel", "Feel"), g.word("landing", "Ends")]);
    return out + k.caption(`Music ${v("shift")}, from ${fmt(bpm)} beats a minute`);
  });

  /* ======================= keyShift ======================= */
  /* A ribbon of color across the scene that turns from one mood to another, with notes climbing on it. */
  look("keyShift", (v, k, g) => {
    const dir = idx(v, "direction", 5);
    const trig = idx(v, "trigger", 5);
    const sud = idx(v, "suddenness", 4);
    const same = idx(v, "sameTune", 3);
    const climb = Math.round(v.n("climb"));
    const set = idx(v, "settled", 3);
    const DARK = "#3b4a7a";
    const BRIGHT = "#f2c14e";
    const UNEASY = "#7a5a8a";
    const [a, b] = [[BRIGHT, DARK], [BRIGHT, UNEASY], [BRIGHT, BRIGHT], [DARK, UNEASY], [DARK, BRIGHT]][dir];
    const width = [0.5, 0.2, 0.06, 0.01][sud];
    let out = bg(k);
    for (let i = 0; i < 40; i++) {
      const t = i / 40;
      const p = k.clamp((t - 0.5 + width / 2) / width, 0, 1);
      out += `<rect x="${r1(20 + t * 280)}" y="30" width="7.4" height="44" fill="${k.mix(a, b, p)}"/>`;
    }
    out += vline(k, 160, 24, 80, "#fff", "3 2", 1.5) + emo(k, 160, 18, ["💬", "👀", "🤝", "🎭", "🌫️"][trig], 13);
    /* the tune: same shape both sides when it is the same tune */
    const shapeA = [0, 2, 1, 3, 2];
    const shapeB = same === 2 ? shapeA : same === 1 ? [0, 2, 4, 1, 3] : [4, 1, 3, 0, 2];
    shapeA.forEach((n, i) => (out += note(k, 40 + i * 20, 66 - n * 7, S.ink)));
    shapeB.forEach((n, i) => (out += note(k, 190 + i * 20 + 0, 66 - n * 7 - Math.min(climb, 5) * 3 * (i / 4), S.ink)));
    for (let i = 0; i < climb; i++) out += k.arrow({ x1: 292, y1: 100 - i * 4, x2: 292, y2: 92 - i * 4, color: S.gold, w: 1.5 });
    out += k.label({ x: 290, y: 112, text: ["?", "~", "✓"][set], size: 12, color: ["#ff8a80", "#ccc", S.green][set], weight: 700 });
    out += k.label({ x: 60, y: 96, text: dir < 2 ? "bright" : dir === 2 ? "bright" : "dark", size: 9, color: "#ccc" }) + k.label({ x: 230, y: 96, text: ["dark", "uneasy", "bright", "uneasy", "bright"][dir], size: 9, color: "#ccc" });
    out += strip(k, [g.steps("direction", "Turn"), g.word("trigger", "Turned by"), g.steps("suddenness", "How sudden"), g.steps("sameTune", "Tune"), g.num("climb", "Climbs", " steps"), g.steps("settled", "Ends")]);
    return out + k.caption(`The music: ${v("direction")}, ${v("suddenness")}`);
  });

  /* ======================= leadInstrument ======================= */
  /* The instrument on a little stage, as big as it plays, close or far from an ear, with others behind it. */
  look("leadInstrument", (v, k, g) => {
    const pr = v.n("prominence");
    const ins = idx(v, "instrument", 8);
    const touch = idx(v, "touch", 4);
    const close = idx(v, "closeness", 4);
    const solo = idx(v, "solo", 3);
    const reg = idx(v, "register", 5);
    const ICON = ["🎹", "🎻", "🎺", "🎸", "🪈", "🎛️", "🎤", "🥁"];
    let out = bg(k) + `<rect x="0" y="96" width="320" height="24" fill="#2b2533"/>`;
    /* others behind */
    const others = [0, 3, 7][solo];
    for (let i = 0; i < others; i++) out += k.dot({ x: 40 + i * 14, y: 82 - (i % 2) * 8, r: 5, color: "#555a6a" });
    if (solo === 1) out += k.label({ x: 70, y: 66, text: "joins later", size: 8, color: "#888" });
    const x = k.lerp(110, 250, close / 3);
    const size = 14 + pr * 5 + close * 3;
    out += `<ellipse cx="${r1(x)}" cy="100" rx="${r1(size * 0.9)}" ry="6" fill="#fff4c8" opacity="${r1(0.08 + pr * 0.04)}"/>`;
    out += emo(k, x, 96 - size * 0.2, ICON[ins], size);
    out += ripples(k, x, 70, 1 + touch, S.ice, 6);
    out += ear(k, 296, 60, 1.4);
    /* the register as a pitch bar */
    out += `<rect x="12" y="14" width="8" height="60" rx="3" fill="#33323d"/>` + k.dot({ x: 16, y: 70 - reg * 13, r: 5, color: S.gold }) + k.label({ x: 26, y: 18, text: "high", size: 7, color: "#888", anchor: "start" }) + k.label({ x: 26, y: 74, text: "low", size: 7, color: "#888", anchor: "start" });
    out += strip(k, [g.num("prominence", "Forward", " of 5"), g.word("instrument", "Instrument"), g.steps("touch", "Touch"), g.steps("closeness", "Closeness"), g.steps("solo", "Joined"), g.steps("register", "Notes")]);
    return out + k.caption(`${v("instrument")} leading, ${v("touch")}, ${v("closeness")}`);
  });

  /* ======================= musicStyle ======================= */
  /* A record sleeve: the style's icon, its age, polish and how catchy, and how well it fits the world beside it. */
  look("musicStyle", (v, k, g) => {
    const fit = idx(v, "fit", 4);
    const st = idx(v, "style", 9);
    const era = idx(v, "era", 4);
    const pol = idx(v, "polish", 4);
    const blend = v.n("blendStyles");
    const catchy = v.n("catchy");
    const ICON = ["🎻", "🎷", "🎸", "🎛️", "🪕", "🎧", "🎤", "🎹", "🌍"];
    const sleeve = ["#7a5a3a", "#8a7a5a", "#4a6a8a", "#3a2a6a"][era];
    let out = bg(k);
    out += `<rect x="24" y="12" width="96" height="96" rx="${[0, 2, 6, 12][pol]}" fill="${sleeve}" stroke="${pol >= 2 ? "#fff" : "#000"}" stroke-width="${pol === 3 ? 3 : 1.5}"/>`;
    if (pol === 0) for (let i = 0; i < 6; i++) out += `<line x1="${r1(30 + k.rnd(i) * 80)}" y1="${r1(16 + k.rnd(i + 9) * 80)}" x2="${r1(36 + k.rnd(i + 4) * 80)}" y2="${r1(20 + k.rnd(i + 2) * 80)}" stroke="#000" opacity="0.4"/>`;
    out += emo(k, 72 - blend * 4, 72, ICON[st], 38);
    if (blend > 0) out += emo(k, 92, 50, ICON[(st + 3) % 9], 8 + blend * 4);
    /* catchy: notes floating out */
    for (let i = 0; i < Math.round(catchy); i++) out += note(k, 136 + i * 14, 40 - (i % 2) * 10, S.gold);
    /* the world it plays in, and how it fits */
    out += `<rect x="216" y="30" width="86" height="60" rx="4" fill="#2a3a2a" stroke="#555"/>` + emo(k, 259, 70, "🤠", 24);
    out += k.label({ x: 180, y: 72, text: ["✗", "?", "✓", "✓✓"][fit], size: 16, color: [S.red, S.orange, S.green, S.green][fit], weight: 900 });
    out += strip(k, [g.steps("fit", "Fits the world"), g.word("style", "Style"), g.steps("era", "Sound age"), g.steps("polish", "Polish"), g.num("blendStyles", "Mixing", " of 5"), g.num("catchy", "Catchy", " of 5")]);
    return out + k.caption(`${v("style")} music that ${["clashes on purpose", "is unexpected", "fits", "is just as expected"][fit]}`);
  });

  /* ======================= sourceToScore ======================= */
  /* Two lanes, "in the room" and "soundtrack": the music moves from one to the other across a crossing zone. */
  look("sourceToScore", (v, k, g) => {
    const cr = idx(v, "crossing", 3);
    const src = idx(v, "source", 5);
    const ct = v.n("crossTime");
    const full = v.n("fullness");
    const nt = idx(v, "noticed", 4);
    const back = idx(v, "backAgain", 3);
    const ICON = ["📻", "🎧", "🎸", "🎤", "🎁"];
    const mid = 0.5;
    const half = 0.02 + (ct / 20) * 0.22;
    const inRoom = (t) => {
      let p = k.clamp((t - (mid - half)) / (2 * half), 0, 1);
      if (back === 2) p = Math.abs(Math.sin(t * Math.PI * 3)) > 0.5 ? 1 - p : p;
      if (back === 1 && t > 0.85) p = 1 - p;
      return cr === 2 ? 1 - p : cr === 0 ? p : 1;
    };
    let out = bg(k) + lane(k, 50, 34, 262, 30, "soundtrack") + lane(k, 50, 80, 262, 30, "in the room");
    out += env(k, 50, 34, 262, 28, (t) => (1 - inRoom(t)) * (0.4 + full * 0.12), S.gold);
    out += env(k, 50, 80, 262, 28, (t) => inRoom(t) * 0.45, S.blue);
    out += `<rect x="${r1(50 + (mid - half) * 262)}" y="16" width="${r1(2 * half * 262)}" height="82" fill="#fff" opacity="0.06"/>`;
    out += emo(k, 22, 104, ICON[src], 14);
    out += k.label({ x: 160, y: 112, text: ["nobody notices", "we notice", "a character notices 👀", "turned off ✋"][nt], size: 9, color: "#ccc" });
    if (nt === 3) out += vline(k, 50 + 0.8 * 262, 16, 98, S.red, "", 3);
    out += strip(k, [g.steps("crossing", "Crosses"), g.word("source", "Plays from"), g.num("crossTime", "Crossing", " s"), g.num("fullness", "Grows fuller", " of 5"), g.steps("noticed", "Noticed"), g.steps("backAgain", "Back again")]);
    return out + k.caption(`Music ${v("crossing")}`);
  });

  /* ======================= characterTheme ======================= */
  /* The character's tune on a staff, returning as pins along the film; its mood colors the notes. */
  look("characterTheme", (v, k, g) => {
    const rec = v.n("recognizable");
    const who = idx(v, "belongsTo", 6);
    const ver = idx(v, "version", 5);
    const ret = Math.round(v.n("returns"));
    const trig = idx(v, "trigger", 4);
    const frag = idx(v, "fragment", 4);
    const WHO = ["🦸", "😈", "💑", "🏠", "💍", "💡"];
    const COL = [S.pink, S.ice, S.purple, S.gold, S.green][ver];
    const tune = [0, 3, 2, 4, 1, 3, 2, 0];
    const shown = [2, 4, 6, 8][frag];
    let out = bg(k) + staff(k, 50, 14, 200);
    tune.slice(0, shown).forEach((n, i) => (out += note(k, 62 + i * 24, 38 - n * 3 + ([0, 4, 6, -4, 0][ver]), COL, 0.9 + rec * 0.06)));
    out += emo(k, 24, 38, WHO[who], 22) + k.label({ x: 270, y: 30, text: ["tender", "sad", "dark", "heroic", "playful"][ver], size: 10, color: COL, anchor: "start", weight: 700 });
    /* glow by how recognizable */
    out += `<rect x="48" y="8" width="206" height="36" rx="6" fill="none" stroke="${COL}" stroke-width="${r1(0.5 + rec * 0.6)}" opacity="${r1(0.2 + rec * 0.15)}"/>`;
    /* returns along the film */
    out += lane(k, 50, 80, 262, 14, "film");
    for (let i = 0; i < ret; i++) {
      const x = 50 + ((i + 0.5) / ret) * 262;
      out += k.dot({ x, y: 80, r: 3.5, color: COL });
    }
    const TRIG = ["they appear", "they are mentioned", "they are missed", "about to arrive"];
    out += k.label({ x: 160, y: 106, text: `plays when ${TRIG[trig]}`, size: 9, color: "#ccc" }) + emo(k, 50 + 0.5 * 262 + [0, 0, 0, 18][trig], 100, ["🚶", "💬", "🕯️", "🚪"][trig], 11);
    out += strip(k, [g.num("recognizable", "Recognisable", " of 5"), g.word("belongsTo", "Belongs to"), g.word("version", "Played"), g.num("returns", "Returns", "x"), g.word("trigger", "Plays when"), g.steps("fragment", "How much")]);
    return out + k.caption(`${v("belongsTo")}'s tune, ${v("version")}, ${ret} times`);
  });

  /* ======================= humming ======================= */
  /* A person with notes floating from their mouth; someone in the doorway may hear, or join in. */
  look("humming", (v, k, g) => {
    const op = idx(v, "openness", 4);
    const form = idx(v, "form", 4);
    const skill = idx(v, "skill", 4);
    const known = idx(v, "known", 4);
    const caught = idx(v, "caught", 4);
    const mm = idx(v, "moodMatch", 3);
    let out = bg(k) + `<rect x="0" y="104" width="320" height="16" fill="#2b2533"/>`;
    out += k.person({ x: 110, y: 104, s: 0.95, color: S.blue, mood: [-0.6, 0, 0.6][mm] * (mm === 0 ? -1 : 1), look: 1 });
    /* the notes: more and bigger as it opens up, wobbly when off-key */
    const n = 2 + op * 2;
    for (let i = 0; i < n; i++) {
      const wob = (3 - skill) * 4 * (k.rnd(i + 1) - 0.5);
      out += note(k, 130 + i * 15, 40 - i * 2 + wob, form === 1 ? S.ice : S.gold, 0.7 + op * 0.12);
    }
    out += emo(k, 126, 26, ["🎶", "😗", "🎤", "📻"][form], 12);
    out += chip(k, 130, 16, ["made up", "lullaby", "a known song", "the theme"][known], S.gold, "start");
    if (mm === 0) out += k.label({ x: 86, y: 54, text: "😠", size: 11 });
    /* the listener */
    if (caught >= 1) out += `<rect x="252" y="40" width="34" height="64" fill="#3a3346" stroke="#555"/>` + k.person({ x: 269, y: 104, s: 0.8, color: S.orange, look: -1, mood: caught === 3 ? 0.7 : 0 });
    if (caught === 2) out += k.label({ x: 110, y: 30, text: "!", size: 18, color: S.red, weight: 900 });
    if (caught === 3) out += note(k, 240, 46, S.gold) + note(k, 228, 36, S.gold);
    out += strip(k, [g.steps("openness", "How open"), g.word("form", "How"), g.steps("skill", "Skill"), g.word("known", "Tune"), g.word("caught", "Heard"), g.steps("moodMatch", "Real mood")]);
    return out + k.caption(`${v("form")}, ${v("openness")}, ${v("skill")}`);
  });

  /* ======================= onScreenPerformance ======================= */
  /* A stage with performers, a crowd below, and a spotlight that grows with how much the scene stops for it. */
  look("onScreenPerformance", (v, k, g) => {
    const sp = idx(v, "spotlight", 4);
    const kind = idx(v, "kind", 5);
    const perf = Math.round(v.n("performers"));
    const q = idx(v, "quality", 4);
    const aud = idx(v, "audience", 4);
    const live = idx(v, "liveSound", 3);
    let out = bg(k) + `<rect x="40" y="62" width="240" height="10" fill="#4a3a2a"/>`;
    out += `<polygon points="160,0 ${r1(160 - 30 - sp * 25)},62 ${r1(160 + 30 + sp * 25)},62" fill="#fff4c8" opacity="${r1(0.05 + sp * 0.06)}"/>`;
    const shown = Math.min(perf, 12);
    for (let i = 0; i < shown; i++) out += k.person({ x: 160 + (i - (shown - 1) / 2) * Math.min(20, 200 / shown), y: 62, s: 0.5, color: S.orange, arms: q >= 2 ? 0.7 : -0.2, mood: [-0.7, -0.2, 0.4, 0.9][q] });
    if (perf > shown) out += k.label({ x: 270, y: 30, text: `+${perf - shown}`, size: 9, color: "#ccc" });
    out += emo(k, 26, 22, ["🎸", "🎤", "🎉", "🏫", "🎶"][kind], 16);
    /* crowd */
    for (let i = 0; i < 18; i++) {
      const up = aud === 3 ? 6 * k.rnd(i) : aud === 2 ? 3 * k.rnd(i) : 0;
      out += k.dot({ x: 30 + i * 15, y: 98 - up - (i % 2) * 3, r: 5, color: aud === 0 ? "#555" : "#c9b49a" });
      if (aud === 3 && i % 3 === 0) out += `<line x1="${30 + i * 15}" y1="${r1(92 - up)}" x2="${30 + i * 15}" y2="${r1(84 - up)}" stroke="#c9b49a" stroke-width="2"/>`;
    }
    if (aud === 0) out += k.label({ x: 160, y: 114, text: "chatting, not listening", size: 8, color: "#888" });
    out += k.wave({ x: 236, y: 18, w: 70, h: 14, amp: 0.8, cycles: 5, noise: [0.7, 0.3, 0][live], color: S.gold });
    out += strip(k, [g.steps("spotlight", "Spotlight"), g.word("kind", "Kind"), g.num("performers", "Performers", ""), g.steps("quality", "How good"), g.steps("audience", "Crowd"), g.steps("liveSound", "Sound")]);
    return out + k.caption(`${v("kind")}: ${v("quality")}, the crowd ${v("audience")}`);
  });

  /* ======================= tensionLoop ======================= */
  /* The same little block of notes repeated along a lane, growing as it goes, then breaking. */
  look("tensionLoop", (v, k, g) => {
    const ins = v.n("insistence");
    const made = idx(v, "madeOf", 5);
    const reps = Math.round(v.n("repeats"));
    const grows = idx(v, "grows", 5);
    const pitch = idx(v, "pitch", 4);
    const brk = idx(v, "breaks", 4);
    const shown = Math.min(reps, 32);
    const endX = brk === 3 ? 312 : 260;
    const w = (endX - 30) / shown;
    let out = bg(k) + lane(k, 30, 50, 282, 64, "") + emo(k, 14, 54, ["🎼", "〰️", "⏱️", "🥁", "❤️"][made], 12);
    const baseY = 70 - pitch * 10;
    for (let i = 0; i < shown; i++) {
      const p = i / Math.max(1, shown - 1);
      const louder = grows === 2 || grows === 4 ? p : 0;
      const layers = grows === 1 || grows === 4 ? 1 + Math.floor(p * 3) : 1;
      const squash = grows === 3 || grows === 4 ? 1 - p * 0.5 : 1;
      const x = 30 + i * w * (grows === 3 || grows === 4 ? 0.75 + 0.25 * squash : 1);
      for (let L = 0; L < layers; L++) out += `<rect x="${r1(x)}" y="${r1(baseY - L * 7 - louder * 6)}" width="${r1(Math.max(1.5, w * 0.7))}" height="${r1(4 + louder * 6 + ins * 0.6)}" fill="${k.mix(S.gold, S.red, ins / 5)}" opacity="0.9"/>`;
    }
    if (brk === 0) out += vline(k, endX + 6, 18, 84, S.red, "", 3);
    if (brk === 1) out += k.label({ x: endX + 26, y: 56, text: "✓", size: 16, color: S.green, weight: 900 });
    if (brk === 2) out += `<polygon points="${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => { const a = (i / 10) * Math.PI * 2; const r = i % 2 ? 9 : 18; return `${r1(endX + 28 + Math.cos(a) * r)},${r1(50 + Math.sin(a) * r)}`; }).join(" ")}" fill="${S.red}"/>`;
    if (brk === 3) out += k.arrow({ x1: 296, y1: 98, x2: 316, y2: 98, color: S.gold, w: 2 });
    out += k.label({ x: 30, y: 110, text: `${reps} times round`, size: 9, color: "#ccc", anchor: "start" });
    out += strip(k, [g.num("insistence", "Insistent", " of 5", S.red), g.word("madeOf", "Made of"), g.num("repeats", "Repeats", "x"), g.steps("grows", "Grows"), g.steps("pitch", "Pitch"), g.word("breaks", "Ends")]);
    return out + k.caption(`A repeat that ${v("grows") === "all of these" ? "grows every way" : v("grows")}, then ${v("breaks")}`);
  });

  /* ======================= bigHit ======================= */
  /* The loudness builds along a lane and lands on a marked moment; a burst shows how big. */
  look("bigHit", (v, k, g) => {
    const imp = v.n("impact");
    const tgt = idx(v, "target", 5);
    const bt = v.n("buildTime");
    const acc = idx(v, "accuracy", 4);
    const after = idx(v, "after", 4);
    const fakes = Math.round(v.n("fakeOuts"));
    const hitT = 0.62;
    const start = hitT - 0.05 - (bt / 60) * 0.55;
    const miss = [0.06, 0.03, 0.01, 0][acc];
    const hit = hitT + miss;
    const f = (t) => {
      if (t < start) return 0.15;
      if (t < hit) {
        let p = (t - start) / (hit - start);
        for (let j = 1; j <= fakes; j++) if (Math.abs(p - j / (fakes + 1)) < 0.05) p *= 0.3;
        return 0.15 + p * (0.3 + imp * 0.1);
      }
      return [0, 0.6, 0.6 - (t - hit) * 2, 0.5][after];
    };
    let out = bg(k) + lane(k, 30, 56, 282, 70, "");
    out += env(k, 30, 56, 282, 68, f, S.gold);
    out += vline(k, 30 + hitT * 282, 14, 98, "#fff", "3 2", 1.5) + emo(k, 30 + hitT * 282, 112, ["✂️", "👊", "💬", "🎭", "🔤"][tgt], 12);
    const bx = 30 + hit * 282;
    if (imp > 0) out += `<polygon points="${[...Array(16).keys()].map((i) => { const a = (i / 16) * Math.PI * 2; const r = (i % 2 ? 0.5 : 1) * (4 + imp * 4); return `${r1(bx + Math.cos(a) * r)},${r1(22 + Math.sin(a) * r)}`; }).join(" ")}" fill="${S.orange}"/>`;
    out += k.label({ x: 30 + start * 282, y: 108, text: `${fmt(bt)} s build`, size: 8, color: "#aaa" });
    out += strip(k, [g.num("impact", "Hit", " of 5"), g.word("target", "Lands on"), g.num("buildTime", "Build", " s"), g.steps("accuracy", "Timing"), g.word("after", "After"), g.num("fakeOuts", "Fake landings", "")]);
    return out + k.caption(`Builds ${fmt(bt)} s, lands on ${v("target")}`);
  });

  /* ======================= clashingNotes ======================= */
  /* Two lines of notes: smooth together when sweet, jagged and rubbing when they clash. */
  look("clashingNotes", (v, k, g) => {
    const cl = v.n("clash");
    const res = idx(v, "resolves", 4);
    const where = idx(v, "where", 4);
    const grows = idx(v, "grows", 4);
    const sweet = idx(v, "sweetOnTop", 3);
    const tim = idx(v, "timing", 3);
    const yBand = [86, 58, 30, 58][where];
    const bandH = where === 3 ? 80 : 26;
    const settleAt = [1.1, 0.85, 0.55, 0.15][res];
    const span = [[0, 1], [0.4, 0.6], [0.45, 0.75]][tim];
    const amount = (t) => {
      if (t < span[0] || t > span[1] || t > settleAt) return 0;
      const gr = [1 - t, 1, t, t > 0.5 ? 1 : 0.3][grows];
      return (cl / 5) * gr;
    };
    let out = bg(k) + `<rect x="20" y="${r1(yBand - bandH / 2)}" width="290" height="${bandH}" fill="${S.red}" opacity="0.07"/>`;
    const lineA = [];
    const lineB = [];
    for (let i = 0; i <= 60; i++) {
      const t = i / 60;
      const a = amount(t);
      lineA.push(`${r1(20 + t * 290)},${r1(yBand - 6 + Math.sin(t * 20) * 2)}`);
      lineB.push(`${r1(20 + t * 290)},${r1(yBand + 6 - a * 12 + (k.rnd(i) - 0.5) * a * 18)}`);
    }
    out += `<polyline points="${lineA.join(" ")}" fill="none" stroke="${S.green}" stroke-width="2.5"/>`;
    out += `<polyline points="${lineB.join(" ")}" fill="none" stroke="${k.mix(S.green, S.red, cl / 5)}" stroke-width="2.5"/>`;
    if (sweet > 0) for (let i = 0; i < 6; i++) out += note(k, 40 + i * 48, 14, S.pink, sweet === 2 ? 0.9 : 0.6);
    if (settleAt <= 1) out += vline(k, 20 + settleAt * 290, yBand - 18, yBand + 18, S.green, "2 2", 1.5);
    out += k.label({ x: 300, y: 112, text: cl >= 3 ? "😬" : cl >= 1 ? "🤨" : "😌", size: 14 });
    out += strip(k, [g.num("clash", "Clash", " of 5", S.red), g.steps("resolves", "Settles"), g.word("where", "Where"), g.steps("grows", "Grows"), g.steps("sweetOnTop", "Sweet on top"), g.word("timing", "When")]);
    return out + k.caption(`Notes clashing ${fmt(cl)} of 5, ${v("resolves")}`);
  });

  /* ======================= warpedMusic ======================= */
  /* A tape or music box with the tune bending as it plays: wobble, slowing, crackle and skips. */
  look("warpedMusic", (v, k, g) => {
    const wp = v.n("warp");
    const dmg = idx(v, "damage", 6);
    const src = idx(v, "source", 5);
    const sp = v.n("speed");
    const cr = v.n("crackle");
    const why = idx(v, "why", 5);
    const tint = [S.ice, S.purple, S.orange, S.red, S.grey][why];
    let out = bg(k);
    out += emo(k, 28, 40, ["🍼", "🎤", "🎼", "🎁", "⛪"][src], 22) + k.label({ x: 28, y: 60, text: ["lullaby", "pop song", "the theme", "music box", "hymn"][src], size: 8, color: "#aaa" });
    /* the tune as a bent wave */
    const pts = [];
    for (let i = 0; i <= 100; i++) {
      const t = i / 100;
      const cyc = 8 * (1 + sp / 100) * (dmg === 4 ? 1 - t * 0.6 : 1);
      let ph = t * cyc * Math.PI * 2;
      if (dmg === 5) ph = -ph;
      const wob = dmg === 1 ? Math.sin(t * 9) * wp * 1.5 : 0;
      let y = 44 + Math.sin(ph) * (14 - (dmg === 0 ? wp * 1.2 : 0)) + wob + (dmg === 2 ? (k.rnd(i) - 0.5) * wp * 3 : 0);
      if (dmg === 3 && Math.floor(t * 6) % 2 === 1 && t * 6 - Math.floor(t * 6) < 0.25) y = 44;
      pts.push(`${r1(60 + t * 250)},${r1(y)}`);
    }
    out += `<polyline points="${pts.join(" ")}" fill="none" stroke="${tint}" stroke-width="2.5"/>`;
    for (let i = 0; i < Math.round(cr * 8); i++) out += k.dot({ x: 60 + k.rnd(i + 11) * 250, y: 20 + k.rnd(i + 40) * 50, r: 0.9, color: "#ddd" });
    out += k.label({ x: 280, y: 16, text: ["🐢", "📼", "🎹", "💿", "🎁", "⏪"][dmg], size: 13 });
    out += k.meter({ x: 60, y: 86, w: 120, p: wp / 5, label: "warp", color: tint }) + k.label({ x: 240, y: 94, text: `${sp > 0 ? "+" : ""}${fmt(sp)}% speed`, size: 9, color: "#ccc" });
    out += k.label({ x: 160, y: 112, text: ["a dream", "a memory", "losing their grip", "something evil", "no reason given"][why], size: 9, color: tint });
    out += strip(k, [g.num("warp", "Warp", " of 5", tint), g.word("damage", "Damage"), g.word("source", "Source"), g.num("speed", "Speed", "%"), g.num("crackle", "Crackle", " of 5"), g.word("why", "Why")]);
    return out + k.caption(`${v("source")}, ${v("damage")}`);
  });

  /* ======================= musicSpotting ======================= */
  /* The whole film as a bar, with the music pieces laid along it. */
  look("musicSpotting", (v, k, g) => {
    const share = v.n("share") / 100;
    const cues = Math.round(v.n("cues"));
    const saved = v.n("saved");
    const first = idx(v, "firstIn", 4);
    const gap = v.n("longestGap");
    const spread = idx(v, "spread", 4);
    const startT = [0, 0.04, 0.2, 0.75][first];
    let out = bg(k) + k.label({ x: 20, y: 20, text: "the whole film", size: 9, color: "#aaa", anchor: "start" });
    out += `<rect x="20" y="30" width="280" height="30" rx="3" fill="#2e2d36" stroke="#555"/>`;
    const n = Math.max(0, cues);
    const shown = Math.min(n, 60);
    const each = shown ? (share * (1 - startT)) / shown : 0;
    const placeOf = (i) => {
      const u = (i + 0.5) / Math.max(1, shown);
      const q = [u, Math.floor(u * 4) / 4 + (u * 4 - Math.floor(u * 4)) * 0.4, Math.sqrt(u), u * u][spread];
      return startT + q * (1 - startT - each);
    };
    for (let i = 0; i < shown; i++) {
      const a = placeOf(i);
      const big = saved > 0 && i >= shown - Math.ceil(shown * 0.15) ? 1 + saved * 0.12 : 1;
      out += `<rect x="${r1(20 + a * 280)}" y="${r1(45 - 13 * big)}" width="${r1(Math.max(1.2, each * 280))}" height="${r1(26 * big)}" fill="${S.gold}" opacity="0.85"/>`;
    }
    out += k.label({ x: 20, y: 80, text: `${Math.round(share * 100)}% with music, ${cues} pieces`, size: 9, color: "#ddd", anchor: "start" });
    out += `<rect x="20" y="92" width="${r1(Math.max(2, (gap / 30) * 200))}" height="6" rx="3" fill="${S.blue}"/>` + k.label({ x: 228, y: 98, text: `${fmt(gap)} min silent`, size: 8, color: "#aaa", anchor: "start" });
    if (saved > 0) out += k.label({ x: 300, y: 80, text: "★".repeat(Math.round(saved)), size: 9, color: S.gold, anchor: "end" });
    out += strip(k, [g.num("share", "Music share", "%"), g.num("cues", "Pieces", ""), g.num("saved", "Saved", " of 5"), g.steps("firstIn", "First in"), g.num("longestGap", "Longest gap", " min"), g.word("spread", "Spread")]);
    return out + k.caption(`${Math.round(share * 100)}% of the film has music, ${v("spread")}`);
  });

  /* ======================= musicPointOfView ======================= */
  /* A calm room on one side; a thought bubble of music over one person, as different as the music is. */
  look("musicPointOfView", (v, k, g) => {
    const ins = v.n("inside");
    const whose = idx(v, "whose", 5);
    const gap = idx(v, "gap", 4);
    const sw = Math.round(v.n("switches"));
    const sh = idx(v, "shared", 3);
    const rev = idx(v, "revealed", 3);
    let out = bg(k) + `<rect x="0" y="100" width="320" height="20" fill="#2b2533"/>`;
    const xs = [70, 130, 190, 250];
    const who = [0, 1, 2, -1, -1][whose];
    xs.forEach((x, i) => (out += k.person({ x, y: 100, s: 0.7, color: i === who ? S.orange : S.blue, mood: i === who || sh === 2 || (sh === 1 && i === (who + 1) % 4) ? 0.5 - gap * 0.4 : 0.4 })));
    if (whose === 3) out += xs.map((x) => k.dot({ x, y: 40, r: 3, color: S.gold })).join("");
    const bx = who >= 0 ? xs[who] : 160;
    const r = 8 + ins * 4;
    out += `<ellipse cx="${bx}" cy="${r1(34 - ins)}" rx="${r1(r * 1.4)}" ry="${r1(r)}" fill="${k.mix(S.green, S.red, gap / 3)}" opacity="${r1(0.3 + ins * 0.1)}"/>`;
    out += k.wave({ x: bx - r, y: 34 - ins, w: 2 * r, h: r * 0.8, amp: 0.9, cycles: 2 + gap * 2, noise: gap * 0.15, color: "#fff" });
    for (let i = 0; i < sw; i++) out += k.arrow({ x1: 70 + i * 40, y1: 64, x2: 100 + i * 40, y2: 64, color: S.gold, w: 1.3 });
    out += k.label({ x: 300, y: 16, text: ["now", "partway", "at the end"][rev], size: 8, color: "#aaa", anchor: "end" }) + k.label({ x: 300, y: 28, text: rev === 0 ? "👁" : rev === 1 ? "❔" : "❓", size: 10, anchor: "end" });
    out += strip(k, [g.num("inside", "Inside one", " of 5"), g.word("whose", "Whose"), g.steps("gap", "Gap"), g.num("switches", "Switches", ""), g.steps("shared", "Shared"), g.steps("revealed", "We learn")]);
    return out + k.caption(`Music plays ${v("whose")}, ${v("gap")}`);
  });

  /* ======================= musicWarning ======================= */
  /* Warning notes along the timeline before the thing arrives, marked at its moment. */
  look("musicWarning", (v, k, g) => {
    const lead = v.n("lead");
    const cl = idx(v, "clarity", 4);
    const what = idx(v, "what", 5);
    const pay = idx(v, "payoff", 4);
    const n = Math.round(v.n("warnings"));
    const heard = idx(v, "heard", 3);
    const eventT = 0.85;
    const firstT = eventT - 0.05 - (lead / 60) * 0.75;
    let out = bg(k) + lane(k, 30, 52, 282, 40, "");
    for (let i = 0; i < n; i++) {
      const t = firstT + (i / Math.max(1, n)) * (eventT - 0.05 - firstT);
      out += note(k, 30 + t * 282, 58, k.mix("#666", S.red, cl / 3), 0.7 + cl * 0.15);
    }
    const ex = 30 + eventT * 282;
    if (pay === 0) out += k.label({ x: ex, y: 58, text: "🐈", size: 18 });
    else out += emo(k, ex, 60, ["🦈", "🕯️", "💘", "🌀", "😂"][what], 14 + (pay === 3 ? 10 : 0));
    if (pay === 1) out += k.label({ x: ex, y: 82, text: "later", size: 8, color: "#aaa" });
    out += k.arrow({ x1: 30 + firstT * 282, y1: 92, x2: ex, y2: 92, color: "#888", w: 1.5 }) + k.label({ x: 160, y: 108, text: `${fmt(lead)} s of warning`, size: 9, color: "#ccc" });
    out += k.person({ x: 290, y: 116, s: 0.5, color: S.blue, mood: heard === 2 ? -0.6 : 0.4, look: -1 }) + (heard ? k.label({ x: 278, y: 86, text: heard === 2 ? "!" : "?", size: 12, color: S.red, weight: 900 }) : "");
    out += strip(k, [g.num("lead", "Ahead by", " s"), g.steps("clarity", "Clear"), g.word("what", "Warns of"), g.word("payoff", "Comes true"), g.num("warnings", "Warnings", ""), g.steps("heard", "They hear")]);
    return out + k.caption(`Warns of ${v("what")} ${fmt(lead)} s ahead, ${v("payoff")}`);
  });

  /* ======================= wrongEraMusic ======================= */
  /* A timeline of eras: the story's time and the music's time, with the gap between them. */
  look("wrongEraMusic", (v, k, g) => {
    const gap = v.n("gap");
    const dir = idx(v, "direction", 4);
    const use = idx(v, "use", 4);
    const dress = idx(v, "dressedUp", 3);
    const norm = idx(v, "normal", 3);
    const often = idx(v, "howOften", 3);
    const storyX = 160;
    const sign = dir < 2 ? -1 : 1;
    const mx = storyX + sign * (10 + gap * 24);
    let out = bg(k) + `<line x1="20" y1="60" x2="300" y2="60" stroke="#555" stroke-width="3"/>`;
    ["long ago", "", "now", "", "future"].forEach((t, i) => (out += k.label({ x: 30 + i * 65, y: 76, text: t, size: 8, color: "#888" })));
    out += emo(k, storyX, 50, "🏰", 20) + k.label({ x: storyX, y: 12, text: "the story", size: 8, color: "#aaa" });
    out += emo(k, mx, 50, use === 3 ? "🎻" : "🎸", 18) + k.label({ x: mx, y: 24, text: "the music", size: 8, color: S.gold });
    out += k.arrow({ x1: storyX + sign * 14, y1: 34, x2: mx - sign * 10, y2: 34, color: S.gold, w: 1.5 });
    /* dressed up: a costume hat on the guitar */
    if (dress >= 1) out += `<rect x="${r1(mx - 8)}" y="${r1(30 - dress * 3)}" width="16" height="${r1(dress * 3)}" fill="${S.purple}"/>`;
    out += k.label({ x: 160, y: 94, text: ["as the soundtrack", "played in the story", "the characters sing it", "a cover in the old style"][use], size: 9, color: "#ddd" });
    out += k.label({ x: 30, y: 112, text: ["they notice 😮", "they barely notice", "totally normal 🙂"][norm], size: 9, color: "#ccc", anchor: "start" });
    for (let i = 0; i < [1, 3, 8][often]; i++) out += k.dot({ x: 210 + i * 11, y: 108, r: 3, color: S.gold });
    out += strip(k, [g.num("gap", "Time gap", " of 5"), g.steps("direction", "Older or newer"), g.word("use", "Used as"), g.steps("dressedUp", "Dressed up"), g.steps("normal", "Normal to them"), g.steps("howOften", "How often")]);
    return out + k.caption(`Music ${v("direction")} than the story, ${v("use")}`);
  });

  /* ======================= titleMusic ======================= */
  /* The film as a bar with the opening and closing titles at its ends and the title music on them. */
  look("titleMusic", (v, k, g) => {
    const wt = v.n("weight");
    const where = idx(v, "where", 4);
    const len = v.n("length");
    const tone = idx(v, "tone", 6);
    const words = idx(v, "words", 3);
    const tie = idx(v, "tieIn", 3);
    const COL = ["#3b4a7a", "#7a5a8a", "#5fae78", "#e8913a", "#d9789b", "#ffd166"][tone];
    const bw = 20 + (len / 300) * 70;
    let out = bg(k) + `<rect x="20" y="50" width="280" height="22" rx="3" fill="#2e2d36" stroke="#555"/>`;
    const open = where !== 1;
    const close = where !== 0;
    if (open) out += `<rect x="20" y="${r1(61 - 6 - wt * 3)}" width="${r1(bw)}" height="${r1(12 + wt * 6)}" fill="${COL}" opacity="0.9"/>` + k.label({ x: 20 + bw / 2, y: 40 - wt * 2, text: "OPENING", size: 8, color: "#fff", weight: 700 });
    if (close) out += `<rect x="${r1(300 - bw)}" y="${r1(61 - 6 - wt * 3)}" width="${r1(bw)}" height="${r1(12 + wt * 6)}" fill="${where === 3 ? COL : k.mix(COL, "#888888", 0.4)}" opacity="0.9"/>` + k.label({ x: 300 - bw / 2, y: 40 - wt * 2, text: "END CREDITS", size: 8, color: "#fff", weight: 700 });
    if (where === 3) out += `<path d="M${r1(20 + bw / 2)} 78 Q160 108 ${r1(300 - bw / 2)} 78" fill="none" stroke="${COL}" stroke-width="1.5" stroke-dasharray="3 2"/>`;
    for (let i = 0; i < [0, 2, 5][tie]; i++) out += note(k, 90 + i * 30, 64, COL, 0.7);
    out += emo(k, 300, 20, ["🎼", "🗣️", "🎤"][words], 14);
    out += k.label({ x: 20, y: 110, text: `${fmt(len)} s, ${["dark", "uneasy", "calm", "warm", "playful", "grand"][tone]}`, size: 9, color: "#ccc", anchor: "start" });
    out += strip(k, [g.num("weight", "How big", " of 5"), g.word("where", "Where"), g.num("length", "Length", " s"), g.word("tone", "Tone"), g.steps("words", "Words"), g.steps("tieIn", "Comes back")]);
    return out + k.caption(`${v("tone")} title music, ${v("where")}`);
  });

  /* ======================= soundsBecomeMusic ======================= */
  /* Everyday sounds as dots along a lane that line up on a beat grid as they become music. */
  look("soundsBecomeMusic", (v, k, g) => {
    const bl = v.n("blend");
    const snd = idx(v, "sounds", 6);
    const on = idx(v, "onBeat", 3);
    const cnt = Math.round(v.n("count"));
    const hand = idx(v, "handoff", 3);
    const mv = idx(v, "moveWith", 3);
    const ICON = ["👣", "⚙️", "🍳", "🌧️", "🗣️", "⏰"];
    let out = bg(k);
    for (let b = 0; b <= 16; b++) out += vline(k, 30 + b * 17, 14, 74, "#2e2e3a", "", 1);
    for (let r = 0; r < Math.min(cnt, 6); r++) {
      const y = 20 + r * 10;
      for (let b = 0; b < 16; b++) {
        if ((b + r) % (2 + (r % 3)) !== 0) continue;
        const jitter = ([1, 0.4, 0][on] * (1 - bl / 5) + 0.15 * (1 - bl / 5)) * (k.rnd(b * 7 + r) - 0.5) * 16;
        out += k.dot({ x: 30 + b * 17 + jitter, y, r: 2.6, color: k.mix(S.blue, S.gold, bl / 5) });
      }
    }
    out += emo(k, 14, 46, ICON[snd], 14);
    if (cnt > 6) out += k.label({ x: 310, y: 20, text: `+${cnt - 6}`, size: 8, color: "#aaa", anchor: "end" });
    if (hand >= 1) out += env(k, 30, 92, 272, 18, (t) => (hand === 2 ? t : 0.4), S.gold, 0.8);
    out += k.label({ x: 26, y: 96, text: "music", size: 8, color: "#888", anchor: "end" });
    out += k.person({ x: 296, y: 116, s: 0.45, color: S.orange, arms: [0, 0.4, 0.9][mv], lean: mv * 8 });
    out += strip(k, [g.num("blend", "Musical", " of 5"), g.word("sounds", "Sounds"), g.steps("onBeat", "On the beat"), g.num("count", "Kinds", ""), g.steps("handoff", "Music joins"), g.steps("moveWith", "They move")]);
    return out + k.caption(`${v("sounds")} becoming music, ${v("onBeat")}`);
  });

  /* ======================= foley ======================= */
  /* A person walking on a surface with the small sounds they make drawn as marks, sized by loudness. */
  look("foley", (v, k, g) => {
    const det = v.n("detail");
    const focus = idx(v, "focus", 5);
    const loud = idx(v, "loud", 4);
    const surf = idx(v, "surface", 6);
    const sync = idx(v, "sync", 3);
    const tex = idx(v, "texture", 4);
    const GROUND = ["#7a2a2a", "#8a6a3a", "#6a6a6a", "#9a9080", "#e8eef4", "#2a3a4a"];
    let out = bg(k) + `<rect x="0" y="96" width="320" height="24" fill="${GROUND[surf]}"/>`;
    if (surf === 3) for (let i = 0; i < 30; i++) out += k.dot({ x: k.rnd(i) * 320, y: 98 + k.rnd(i + 5) * 20, r: 1.3, color: "#666" });
    if (surf === 5) out += `<rect x="0" y="96" width="320" height="4" fill="#9fd3ff" opacity="0.4"/>`;
    out += k.person({ x: 150, y: 96, s: 0.9, color: S.blue, walk: 1, arms: 0.2 });
    /* the sounds: footsteps along the floor, cloth at the body, a cup at the hand, a hit */
    const marks = [[[60, 96], [100, 96], [140, 96], [180, 96], [220, 96]], [[150, 62], [142, 72]], [[172, 70]], [[200, 50]]];
    const which = focus === 4 ? [0, 1, 2, 3] : [focus];
    const sizeOf = 1 + loud * 0.6;
    const n = Math.round(det);
    which.forEach((w) =>
      marks[w].slice(0, Math.max(1, Math.ceil((marks[w].length * n) / 5))).forEach(([x, y], i) => {
        const off = [8, 3, 0][sync] * (k.rnd(i + w * 3) - 0.5);
        out += `<polygon points="${[0, 1, 2, 3, 4, 5, 6, 7].map((j) => { const a = (j / 8) * Math.PI * 2; const r = (j % 2 ? 3 : 6) * sizeOf * (tex === 3 ? 1.2 : 1); return `${r1(x + off + Math.cos(a) * r)},${r1(y - 8 + Math.sin(a) * r)}`; }).join(" ")}" fill="${[S.ice, S.gold, S.orange, S.green][tex]}" opacity="0.85"/>`;
      })
    );
    if (det === 0) out += k.label({ x: 160, y: 30, text: "(almost silent)", size: 9, color: "#888" });
    out += strip(k, [g.num("detail", "Detail", " of 5"), g.word("focus", "Focus"), g.steps("loud", "Loudness"), g.word("surface", "Surface"), g.steps("sync", "In sync"), g.steps("texture", "Texture")]);
    return out + k.caption(`${v("focus")}, ${v("loud")}, on ${v("surface")}`);
  });

  /* ======================= ambienceBed ======================= */
  /* A window on the place, with the background sound as a soft band under the whole scene. */
  look("ambienceBed", (v, k, g) => {
    const pr = v.n("presence");
    const place = idx(v, "place", 6);
    const alive = idx(v, "alive", 4);
    const reacts = idx(v, "reacts", 4);
    const tod = idx(v, "timeOfDay", 3);
    const steady = idx(v, "steady", 3);
    const SKY = ["#5a6a8a", "#4a7a5a", "#3a3346", "#6a5a4a", "#4a4a4a", "#3a6a8a"][place];
    let out = bg(k) + `<rect x="20" y="10" width="120" height="70" fill="${tod === 2 ? "#141826" : SKY}" stroke="#666"/>`;
    out += emo(k, 80, 56, ["🏙️", "🌳", "🛋️", "👥", "⚙️", "🌊"][place], 26);
    if (tod >= 1) out += emo(k, 124, 24, tod === 2 ? "🌙" : "☀️", tod === 2 ? 12 : 8);
    for (let i = 0; i < [1, 3, 6, 10][alive]; i++) out += emo(k, 160 + (i % 5) * 28, 24 + Math.floor(i / 5) * 22, ["🐦", "🚗", "💬", "🦗", "🔔"][i % 5], 9);
    /* the bed along the scene, dipping in the tense middle if it reacts */
    const dip = [0, 0.2, 0.8, 0.6][reacts];
    out += lane(k, 30, 100, 282, 22, "bed");
    out += env(k, 30, 100, 282, 20, (t) => (pr / 5) * (1 - dip * Math.exp(-Math.pow((t - 0.55) / 0.12, 2)) + (reacts === 3 ? 0.2 * Math.sin(t * 9) : 0)), S.blue);
    for (let c = 1; c < 4; c++) out += vline(k, 30 + c * 70.5, 88, 112, "#fff", "2 2", 1) + (steady === 0 ? `<rect x="${r1(30 + c * 70.5 - 3)}" y="89" width="6" height="${r1(4 + c * 3)}" fill="${S.red}" opacity="0.6"/>` : steady === 1 && c === 2 ? `<rect x="${r1(30 + c * 70.5 - 3)}" y="89" width="6" height="4" fill="${S.red}" opacity="0.6"/>` : "");
    if (reacts >= 2) out += k.label({ x: 30 + 0.55 * 282, y: 84, text: "tense", size: 8, color: S.red });
    out += strip(k, [g.num("presence", "Presence", " of 5", S.blue), g.word("place", "Place"), g.steps("alive", "Busy"), g.steps("reacts", "Reacts"), g.steps("timeOfDay", "Time of day"), g.steps("steady", "Over cuts")]);
    return out + k.caption(`The sound of ${v("place")}, ${v("alive")}`);
  });

  /* ======================= subjectiveSound ======================= */
  /* A head with the world's sounds around it; inside their ears the sound is muffled, ringing or focused. */
  look("subjectiveSound", (v, k, g) => {
    const how = v.n("how");
    const kind = idx(v, "kind", 6);
    const cause = idx(v, "cause", 6);
    const lasts = v.n("lasts");
    const back = idx(v, "comeBack", 4);
    const left = idx(v, "leftOver", 4);
    let out = bg(k) + k.face({ x: 160, y: 50, r: 22, mood: [-0.6, -0.8, 0.8, -0.2, -0.5, 0.3][cause], eyes: cause === 4 ? 0.1 : 0.8 });
    out += emo(k, 160, 14, ["💥", "😱", "💘", "🍷", "😵", "💭"][cause], 12);
    /* the world's sounds: fewer and fainter as it pulls inside */
    const outside = (1 - how / 5) * 0.5 + [0, 0.15, 0.3, 0.5][left];
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      out += k.dot({ x: 160 + Math.cos(a) * 60, y: 50 + Math.sin(a) * 34, r: 3 + outside * 4, color: `rgba(159,211,255,${r1(k.clamp(outside, 0.05, 1) * 100) / 100})` });
    }
    /* what they hear */
    if (kind === 0) out += `<rect x="186" y="38" width="20" height="24" rx="6" fill="#8a6a5a" opacity="${r1(0.3 + how * 0.12)}"/>`;
    if (kind === 1) out += k.wave({ x: 196, y: 30, w: 60, h: 10, amp: 0.3 + how * 0.14, cycles: 14, color: "#fff" });
    if (kind === 2) out += `<rect x="100" y="20" width="120" height="60" fill="#3a6aaa" opacity="${r1(0.1 + how * 0.06)}"/>`;
    if (kind === 3) out += k.ring({ x: 230, y: 50, r: 10, color: S.gold, w: 2 + how * 0.4 }) + k.arrow({ x1: 184, y1: 50, x2: 218, y2: 50, color: S.gold, w: 1.5 });
    if (kind === 4) out += emo(k, 210, 54, "❤️", 8 + how * 2);
    if (kind === 5) out += `<rect x="0" y="0" width="320" height="120" fill="#000" opacity="${r1(how * 0.08)}"/>`;
    /* the world coming back along a timeline */
    const L = 0.1 + (lasts / 60) * 0.6;
    out += lane(k, 30, 104, 282, 14, "world");
    out += env(k, 30, 104, 282, 12, (t) => (t < 0.1 ? 1 : t < 0.1 + L ? outside : back === 3 ? 0.5 : [1, Math.min(1, outside + (t - 0.1 - L) * 8), Math.min(1, outside + (t - 0.1 - L) * 2)][back]), S.blue);
    out += strip(k, [g.num("how", "Inside", " of 5"), g.word("kind", "Sound"), g.word("cause", "Cause"), g.num("lasts", "Lasts", " s"), g.steps("comeBack", "Comes back"), g.steps("leftOver", "Left over")]);
    return out + k.caption(`${v("kind")} after ${v("cause")}, ${fmt(lasts)} s`);
  });

  /* ======================= placeEcho ======================= */
  /* A room drawn at the size the echo suggests, with a sound bouncing off its walls and a ringing tail. */
  look("placeEcho", (v, k, g) => {
    const ec = v.n("echo");
    const size = idx(v, "size", 5);
    const on = idx(v, "on", 4);
    const tail = v.n("tail");
    const truth = idx(v, "truth", 3);
    const surf = idx(v, "surfaces", 3);
    const w = [40, 70, 110, 150, 180][size];
    const h = [40, 50, 66, 84, 90][size];
    const cx = 100;
    const wall = ["#8a6a8a", "#7a7a8a", "#c8d4e0"][surf];
    let out = bg(k) + `<rect x="${r1(cx - w / 2)}" y="${r1(100 - h)}" width="${r1(w)}" height="${r1(h)}" fill="none" stroke="${wall}" stroke-width="${surf === 0 ? 6 : 3}"${surf === 0 ? ' stroke-dasharray="4 2"' : ""}/>`;
    if (truth >= 1) out += `<rect x="${r1(cx - 20)}" y="70" width="40" height="30" fill="none" stroke="#888" stroke-dasharray="2 2"/>` + k.label({ x: cx, y: 112, text: truth === 2 ? "the real room is small" : "a little bigger", size: 8, color: "#aaa" });
    out += emo(k, cx, 92, ["🗣️", "👣", "🎵", "🎧"][on], 12);
    out += ripples(k, cx, 86, Math.round(ec), wall, Math.max(4, w / 14));
    /* the tail: a sound and its fading ring along a lane */
    out += lane(k, 210, 40, 100, 30, "");
    out += env(k, 210, 40, 100, 28, (t) => (t < 0.08 ? 1 : Math.max(0, 1 - (t - 0.08) / Math.max(0.02, tail / 8))) * (t < 0.08 ? 1 : 0.3 + ec * 0.14), S.ice);
    out += k.label({ x: 260, y: 70, text: `rings ${fmt(tail)} s`, size: 9, color: "#ccc" });
    out += strip(k, [g.num("echo", "Echo", " of 5", S.ice), g.steps("size", "Sounds like"), g.word("on", "On"), g.num("tail", "Ring", " s"), g.steps("truth", "True to place"), g.steps("surfaces", "Surfaces")]);
    return out + k.caption(`Echo ${fmt(ec)} of 5, like ${v("size")}`);
  });
})(typeof window !== "undefined" ? window.CuriosityWindows : require("./windows.js"));
