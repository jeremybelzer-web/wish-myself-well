/* Sound: the live picture at the top of each sound curiosity's window (CuriosityWindows.look). Sound is drawn as
   shapes you can read without hearing it: lanes along a timeline (like an editor's tracks) with loudness as
   height, speakers and an ear for how close or where a sound is, and faces for what the sound does to a scene. */
(function (W) {
  const r1 = (n) => Math.round(n * 10) / 10;
  const idx = (v, id) => {
    const s = v.slider(id);
    return s && Array.isArray(s.scale) ? Math.max(0, s.scale.indexOf(v(id))) : 0;
  };
  /* The bottom caption: float noise trimmed, and the type shrunk (down to 7 px) so long settings still fit. */
  const cap = (k, t) => {
    let x = String(t).replace(/(\d+\.\d)\d+/g, "$1").replace(/[−-]0(?=[ %]|$)/g, "0").replace(/ · ( ·)+/g, " ·").replace(/ · $/, "");
    if (x.length > 78) x = x.slice(0, 77) + "…";
    const size = Math.round(k.clamp(300 / Math.max(1, x.length * 0.55), 7, 10) * 10) / 10;
    return `<rect x="0" y="162" width="320" height="18" fill="rgba(0,0,0,0.55)"/>` + k.label({ x: 160, y: 175, text: x, size, color: "#f4f4f4" });
  };
  const chip = (k, x, y, text, color, anchor) => {
    const w = String(text).length * 5.2 + 10;
    const x0 = anchor === "end" ? x - w : anchor === "middle" ? x - w / 2 : x;
    return `<rect x="${x0.toFixed(1)}" y="${y - 10}" width="${w.toFixed(1)}" height="14" rx="7" fill="rgba(0,0,0,0.6)" stroke="${color || "#666"}"/>` + k.label({ x: x0 + w / 2, y: y + 0.5, text, size: 8.5, color: color || "#ddd" });
  };
  /* dB to 0..1 height (-60 dB is nothing, +6 dB is full). */
  const db = (d, lo) => Math.max(0, Math.min(1, (d - (lo == null ? -60 : lo)) / (6 - (lo == null ? -60 : lo))));
  /* A loudness shape along a lane: f(t) gives 0..1 at each point; drawn as a filled wave around the lane's middle. */
  function env(k, o) {
    const x = o.x == null ? 50 : o.x;
    const w = o.w || 260;
    const y = o.y;
    const h = o.h || 26;
    const n = o.n || 90;
    const top = [];
    const bot = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const a = k.clamp(o.f(t), 0, 1);
      const wig = o.wiggle ? 0.55 + 0.45 * Math.abs(Math.sin(i * (o.freq || 1.7))) : 1;
      const hh = (a * h * wig) / 2;
      top.push(`${(x + t * w).toFixed(1)},${(y - hh).toFixed(1)}`);
      bot.unshift(`${(x + t * w).toFixed(1)},${(y + hh).toFixed(1)}`);
    }
    return `<polygon points="${top.concat(bot).join(" ")}" fill="${o.color || "#9fd3ff"}" opacity="${o.alpha == null ? 0.9 : o.alpha}"/>`;
  }
  const lane = (k, y, label, h) => `<rect x="50" y="${y - (h || 26) / 2}" width="262" height="${h || 26}" rx="3" fill="#202028"/>` + k.label({ x: 46, y: y + 3, text: label, size: 8, color: "#aaa", anchor: "end" });
  const block = (k, a, b, y, h, color, alpha) => `<rect x="${(50 + k.clamp(a, 0, 1) * 262).toFixed(1)}" y="${(y - h / 2).toFixed(1)}" width="${Math.max(1.5, (k.clamp(b, 0, 1) - k.clamp(a, 0, 1)) * 262).toFixed(1)}" height="${h.toFixed(1)}" rx="3" fill="${color}" opacity="${alpha == null ? 0.9 : alpha}"/>`;
  const vline = (k, t, y1, y2, color, dash) => `<line x1="${(50 + t * 262).toFixed(1)}" y1="${y1}" x2="${(50 + t * 262).toFixed(1)}" y2="${y2}" stroke="${color || "#fff"}" stroke-width="2"${dash ? ` stroke-dasharray="${dash}"` : ""}/>`;
  const notes = (k, x, y, n, color, s) => Array.from({ length: n }, (_, i) => `<g transform="translate(${(x + i * 12 * (s || 1)).toFixed(1)} ${(y - (i % 2) * 8 * (s || 1)).toFixed(1)}) scale(${s || 1})"><ellipse cx="0" cy="0" rx="4" ry="3" fill="${color || "#ffd166"}"/><line x1="3.5" y1="0" x2="3.5" y2="-12" stroke="${color || "#ffd166"}" stroke-width="1.5"/></g>`).join("");
  const ear = (k, x, y, s) => `<path d="M${x} ${y - 12 * s} q${10 * s} 0 ${10 * s} ${10 * s} q0 ${8 * s} ${-6 * s} ${12 * s} q${-4 * s} ${2 * s} ${-4 * s} ${6 * s}" fill="none" stroke="#f0c8a0" stroke-width="${3 * s}" stroke-linecap="round"/>`;
  const robot = (k, x, y, r) => `<rect x="${x - r}" y="${y - r}" width="${2 * r}" height="${2 * r}" rx="${r * 0.2}" fill="#9fb7c8" stroke="${k.INK}" stroke-width="1.5"/><rect x="${x - r * 0.55}" y="${y - r * 0.35}" width="${r * 0.35}" height="${r * 0.3}" fill="#5ff5ff"/><rect x="${x + r * 0.2}" y="${y - r * 0.35}" width="${r * 0.35}" height="${r * 0.3}" fill="#5ff5ff"/><line x1="${x}" y1="${y - r}" x2="${x}" y2="${y - r * 1.4}" stroke="${k.INK}" stroke-width="1.5"/><rect x="${x - r * 0.5}" y="${y + r * 0.35}" width="${r}" height="${r * 0.2}" fill="${k.INK}"/>`;

  /* ---------- voice-over ---------- */
  W.look("voiceover", (v, k) => {
    const amount = idx(v, "setting");
    const share = v.p("voShare");
    const voice = idx(v, "voice");
    const truth = idx(v, "truth");
    const close = v.p("closeness");
    const timing = idx(v, "voTiming");
    const lead = k.clamp(([-2, 0, 2][idx(v, "aheadOfPicture")] + v.n("voLead")) / 24, -0.5, 0.5);
    const lvl = db(v.n("voLevel"), -30);
    const wpm = v.n("wordsPerMinute");
    let s = k.bg("#16161c");
    /* The picture: what we see, and the voice saying something over it. */
    s += `<rect x="8" y="8" width="150" height="84" fill="#3a4a5a" stroke="#888"/>` + k.floor(74, "#4a5a3a").replace('width="320"', 'width="150"').replace('x="0"', 'x="8"').replace(/height="[\d.]+"/, 'height="18"');
    s += k.person({ x: 60, y: 86, s: 0.85, mood: truth === 2 ? -0.8 : 0.3, arms: truth === 2 ? -0.6 : 0.4, color: "#4a6fa5" });
    if (timing >= 2) s += k.person({ x: 115, y: 86, s: 0.75, arms: 0.8, color: "#a5524a", walk: 1 });
    const said = ["I was brave.", "I was mostly brave.", "I was brave."][truth];
    if (amount > 0) s += k.bubble({ x: 98, y: 24, text: said, w: 92, h: 20, size: 9, tail: -20 });
    if (truth === 2) s += `<path d="M84 44 l20 14 M104 44 l-20 14" stroke="#ff5252" stroke-width="3"/>`;
    if (truth === 1) s += k.label({ x: 140, y: 52, text: "?", size: 16, color: "#ffd166", weight: 700 });
    /* Who speaks, and how close the voice feels: the speaker moves up to the ear. */
    const vx = k.lerp(178, 262, close);
    s += ear(k, 290, 50, 1.6) + (voice === 0 ? k.face({ x: vx, y: 50, r: 14, mouth: amount ? 0.5 : 0 }) : voice === 1 ? k.mic({ x: vx, y: 52, s: 1.2 }) : robot(k, vx, 50, 13));
    if (amount > 0) s += k.speaker({ x: vx + 18, y: 50, s: 0.7, level: lvl });
    s += k.label({ x: 240, y: 86, text: v("closeness"), size: 8.5, color: "#ccc" });
    /* Lanes: picture events, dialogue, voice-over. */
    s += lane(k, 110, "picture", 14) + lane(k, 130, "lines", 14) + lane(k, 152, "voice-over", 22);
    const actions = [0.2, 0.55, 0.8];
    actions.forEach((a) => (s += `<rect x="${(50 + a * 262 - 6).toFixed(1)}" y="104" width="12" height="12" fill="#e57373"/>`));
    const lines = [[0.05, 0.15], [0.35, 0.48], [0.62, 0.72]];
    lines.forEach(([a, b]) => (s += block(k, a, b, 130, 10, "#7fd1ae")));
    /* Where the voice-over speaks: in the silences, between lines, over the action, over the dialogue. */
    const spots = [[[0.88, 0.98], [0.25, 0.32]], [[0.16, 0.34], [0.49, 0.61]], [[0.17, 0.25], [0.52, 0.6], [0.77, 0.85]], [[0.05, 0.15], [0.35, 0.48], [0.62, 0.72]]][timing];
    {
      /* With no voice-over, faint outlines show where it would go. */
      const scale = amount === 2 ? 1.6 : 1;
      const ga = amount === 0 ? 0.22 : 0.9;
      spots.forEach(([a, b]) => {
        const len = (b - a) * scale * (0.4 + share * 1.2);
        const a2 = k.clamp(a + lead, 0, 0.98);
        s += block(k, a2, a2 + len, 152, 6 + lvl * 14, "#ffd166", ga);
        const words = Math.max(1, Math.round((len * 262 * wpm) / 900));
        for (let i = 0; i < words; i++) s += `<rect x="${(50 + a2 * 262 + 2 + i * ((len * 262 - 4) / words)).toFixed(1)}" y="150" width="1.5" height="4" fill="#5a3a00"/>`;
      });
    }
    s += vline(k, 0.5 + lead, 100, 164, "#fff", "2 2");
    return s + cap(k, `${v("setting")} · ${v("voice")} · ${v("voTiming")} · ${v("voLevel")} dB · ${wpm} wpm`);
  });

  /* ---------- score cue ---------- */
  W.look("musicCue", (v, k) => {
    const on = idx(v, "setting");
    const lvl = (0.15 + 0.85 * db(v.n("level"), -30)) * [0.6, 0.6, 1][on];
    const start = idx(v, "cueStart");
    const len = v.n("cueLength") / 120;
    const build = idx(v, "build");
    const tells = idx(v, "tellsFeeling");
    const off = v.n("cueOffset") / 40;
    const swell = v.n("swellTime") / 120;
    const fadeOut = v.n("fadeOutTime") / 120;
    const moment = 0.3;
    const a = k.clamp(moment + off, 0, 1);
    const b = k.clamp(a + Math.max(0.03, len * 0.7), 0, 1);
    let s = k.bg("#16161c");
    /* The moment the cue belongs to: a line, a look, a cut, or nothing. */
    s += `<rect x="8" y="8" width="130" height="80" fill="#3a3a4a" stroke="#888"/>`;
    s += k.face({ x: 72, y: 48, r: 26, mood: [0, 0.2, 0.5, 0.9][tells] * (build === 0 ? -1 : 1), brows: tells * 0.3, eyes: 0.9, look: start === 1 ? 1 : 0, mouth: start === 0 ? 0.5 : 0 });
    if (start === 0) s += k.bubble({ x: 108, y: 20, text: "...", w: 30, h: 18, size: 10, tail: -10 });
    if (start === 2) s += `<line x1="128" y1="8" x2="128" y2="88" stroke="#fff" stroke-width="3"/>`;
    if (start === 3) s += k.label({ x: 120, y: 30, text: "!", size: 22, color: "#ffd166", weight: 700 });
    if (on > 0) s += notes(k, 160, 80, 1 + tells * 2, "#ffd166", 0.9);
    s += k.label({ x: 232, y: 32, text: ["holds back", "hints", "guides", "insists"][tells], size: 11, color: "#ffd166" });
    s += k.label({ x: 232, y: 50, text: ["no score", "under the scene", "featured"][on], size: 9, color: "#ccc" });
    /* The cue on its lane: how it builds, swells and fades. */
    s += lane(k, 128, "score", 50);
    s += env(k, {
        alpha: on ? 0.9 : 0.22,
        y: 128,
        h: 48,
        wiggle: true,
        f: (t) => {
          if (t < a || t > b + fadeOut * 0.6) return 0;
          const u = (t - a) / Math.max(0.01, b - a);
          const shape = [1 - u * 0.8, 0.7, 0.4 + u * 0.6, 0.2 + u * u * 0.8][build];
          const sw = Math.min(1, (t - a) / Math.max(0.005, swell * 0.6));
          const fo = t > b ? 1 - (t - b) / Math.max(0.005, fadeOut * 0.6) : 1;
          return Math.max(0.03, lvl * shape * sw * fo);
        },
        color: "#ffd166",
      });
    s += vline(k, moment, 100, 156, "#e57373") + k.label({ x: 50 + moment * 262, y: 98, text: "moment", size: 7.5, color: "#e57373" });
    return s + cap(k, `${v("setting")} · ${v("level")} dB · ${v("cueLength")} s · ${v("build")} · starts ${v("cueStart")}`);
  });

  /* ---------- sound against the cut ---------- */
  W.look("soundToCut", (v, k) => {
    const kind = idx(v, "setting");
    const lead = v.n("lead");
    const ov = v.n("overlap");
    const carrier = idx(v, "carrier");
    const jolt = idx(v, "jolt");
    const cut = 0.5;
    /* J-cut: the next shot's sound starts before the cut. L-cut: this shot's sound runs on after it. */
    const shift = (kind === 0 ? -1 : kind === 1 ? 1 : 0) * (0.06 + ov * 0.05) + lead * 0.03;
    let s = k.bg("#16161c");
    s += lane(k, 40, "picture", 40) + `<rect x="50" y="20" width="131" height="40" fill="#4a6fa5"/><rect x="181" y="20" width="131" height="40" fill="#a5524a"/>` + k.label({ x: 115, y: 44, text: "shot A", size: 10 }) + k.label({ x: 246, y: 44, text: "shot B", size: 10 });
    s += lane(k, 100, "sound", 40);
    const split = k.clamp(cut + shift, 0.05, 0.95);
    const xf = jolt === 0 ? 0.08 : jolt === 1 ? 0.03 : 0.002;
    s += env(k, { y: 100, h: 34, wiggle: true, freq: 1.3, color: "#7fb7ff", f: (t) => (t < split - xf ? 0.8 : t < split + xf ? 0.8 * (1 - (t - (split - xf)) / (2 * xf)) : 0) });
    s += env(k, { y: 100, h: 34, wiggle: true, freq: 2.1, color: "#ff9a8a", alpha: 0.85, f: (t) => (t > split + xf ? (jolt === 2 ? 1 : 0.8) : t > split - xf ? 0.8 * ((t - (split - xf)) / (2 * xf)) : 0) });
    if (jolt === 2) s += `<path d="M${50 + split * 262} 76 l-6 10 l8 4 l-6 10" stroke="#ffd166" stroke-width="2.5" fill="none"/>`;
    s += vline(k, cut, 16, 126, "#fff") + k.label({ x: 50 + cut * 262, y: 136, text: "cut", size: 8, color: "#fff" });
    if (Math.abs(split - cut) > 0.01) s += k.arrow({ x1: 50 + cut * 262, y1: 128, x2: 50 + split * 262, y2: 128, color: "#ffd166", w: 1.5 });
    const icons = ["room tone", "music", "a voice", "a sound effect"];
    s += chip(k, 50, 158, `carries ${icons[carrier]}`, "#ffd166") + chip(k, 312, 158, `${lead > 0 ? "+" : ""}${lead} beats · ${ov} s overlap`, "#ccc", "end");
    return s + cap(k, `${v("setting")} · ${v("jolt")} · ${v("carrier")}`);
  });

  /* ---------- music (all its parts) ---------- */
  W.look("music", (v, k) => {
    const pres = v.p("presence");
    const track = idx(v, "track");
    const src = v.p("source");
    const tempo = v.n("tempo");
    const energy = v.p("energy");
    const moodI = idx(v, "mood");
    const counter = v.p("counterpoint");
    const fam = idx(v, "familiarity");
    const vocals = idx(v, "vocals");
    const lyric = idx(v, "lyricFit");
    const sync = idx(v, "cutSync");
    const lvl = db(v.n("level"), -30);
    const entry = idx(v, "entry");
    const exit = idx(v, "exit");
    const era = idx(v, "era");
    const inst = idx(v, "instrumentation");
    const key = idx(v, "key");
    const theme = idx(v, "repeatTheme");
    const eo = v.n("entryOffset") / 60;
    const fi = v.n("fadeIn") / 90;
    const fo = v.n("fadeOut") / 90;
    const musicMood = (moodI - 3) / 3;
    const hue = [260, 220, 280, 200, 30, 50, 330][moodI];
    const col = k.hsl(hue, 60, 62);
    let s = k.bg("#16161c");
    /* The scene: its feeling, and whether the characters hear the music (a radio in the frame) or only we do. */
    s += `<rect x="8" y="8" width="132" height="74" fill="#2e3440" stroke="#888"/>`;
    const sceneMood = k.clamp(musicMood * (1 - 2 * counter), -1, 1);
    s += k.person({ x: 50, y: 76, s: 0.75, mood: sceneMood, color: "#4a6fa5", arms: energy > 0.6 ? 0.8 : 0 });
    s += k.person({ x: 96, y: 76, s: 0.7, mood: sceneMood, color: "#a5524a", look: src > 0.5 ? 1 : -1 });
    const radio = `<rect x="112" y="58" width="20" height="13" rx="2" fill="#7a5a3a" stroke="${k.INK}"/><circle cx="118" cy="64" r="3" fill="#333"/>`;
    s += src > 0.25 ? radio : "";
    const nN = Math.round(pres * 5);
    s += notes(k, k.lerp(160, 112, src), k.lerp(40, 50, src), nN, col, 0.8);
    if (vocals === 0) s += k.label({ x: 214, y: 26, text: `(no words; would ${["comment", "echo", "be unrelated", "contradict"][lyric]})`, size: 7.5, color: "#777" });
    if (vocals >= 1) s += k.bubble({ x: 214, y: 22, text: vocals === 1 ? "mmm" : vocals === 2 ? "la la (?)" : ["about us", "like this", "la la la", "not this"][lyric], w: 74, h: 20, size: 9, tail: -20 });
    /* What kind of music: era, size of the band, key, how known, the theme coming back. */
    s += k.label({ x: 230, y: 50, text: `track ${track + 1} · ${v("era")}`, size: 8.5, color: col });
    s += Array.from({ length: inst + 1 }, (_, i) => `<rect x="${200 + i * 13}" y="56" width="10" height="${8 + (i % 2) * 4}" rx="2" fill="${col}"/>`).join("") + k.label({ x: 290, y: 66, text: ["minor", "?", "major"][key], size: 9, color: key === 2 ? "#ffd166" : "#9fb7ff" });
    s += Array.from({ length: 3 }, (_, i) => `<path d="M${200 + i * 11} 82 l2.5 5 l5.5 .5 l-4 3.5 l1.2 5.5 l-5.2 -3 l-5.2 3 l1.2 -5.5 l-4 -3.5 l5.5 -.5 Z" fill="${i < fam ? "#ffd166" : "#444"}"/>`).join("");
    s += k.label({ x: 270, y: 94, text: `${tempo} bpm`, size: 8.5, color: "#ccc" });
    /* The music lane: level and energy as height, how it enters and leaves, fades, beats, cuts, theme marks. */
    s += lane(k, 136, "music", 50);
    const a = k.clamp(0.12 + eo, 0, 0.5);
    const b = 0.85;
    const inLen = [0, 0.12, 0.05 + fi * 0.3, 0.005, 0.002][entry] + (entry === 2 ? 0 : 0);
    const outLen = [0, 0.05 + fo * 0.3, 0.06, 0.002, 0.001][exit];
    const base = (0.12 + pres * 0.88) * (0.35 + lvl * 0.65);
    s += env(k, {
      y: 136,
      h: 48,
      wiggle: true,
      freq: 0.6 + energy * 2,
      color: col,
      f: (t) => {
        if (entry === 0 && t < a) return base;
        if (t < a) return 0;
        if (exit === 0 && t > b) return base;
        if (t > b + outLen) return exit === 2 ? base * 0.3 : 0;
        const up = inLen ? Math.min(1, (t - a) / inLen) : 1;
        const down = t > b ? (exit === 2 ? 1 - ((t - b) / Math.max(0.01, outLen)) * 0.7 : 1 - (t - b) / Math.max(0.01, outLen)) : 1;
        const slam = entry === 4 && t - a < 0.03 ? 1.25 : 1;
        return base * up * down * slam;
      },
    });
    /* Fade lengths: dashed ramps at the start and the end. */
    s += `<path d="M${(50 + a * 262).toFixed(1)} 160 L${(50 + (a + 0.01 + fi * 0.3) * 262).toFixed(1)} 112" stroke="#fff" stroke-dasharray="3 2" fill="none" opacity="0.7"/><path d="M${(50 + b * 262).toFixed(1)} 112 L${(50 + Math.min(1, b + 0.01 + fo * 0.3) * 262).toFixed(1)} 160" stroke="#fff" stroke-dasharray="3 2" fill="none" opacity="0.7"/>`;
    /* Beats: closer together as the tempo rises. Cuts: on the beat, or not. */
    const beat = 60 / tempo / 12;
    for (let t = a, i = 0; t < b; t += beat, i++) s += `<rect x="${(50 + t * 262).toFixed(1)}" y="160" width="1.5" height="4" fill="#ccc"/>`;
    const cuts = [0.27, 0.46, 0.63, 0.78];
    cuts.forEach((c, i) => {
      const snapped = a + Math.round((c - a) / beat) * beat;
      const t = sync === 0 ? c + 0.013 * (i % 2 ? 1 : -1) : sync === 1 ? (c + snapped) / 2 : snapped;
      s += vline(k, t, 108, 162, sync === 3 ? "#ffd166" : "#fff", "3 2");
    });
    for (let i = 0; i < theme; i++) s += `<path d="M${(50 + (0.25 + i * 0.22) * 262).toFixed(1)} 114 q6 -6 12 0 q6 6 12 0" fill="none" stroke="#ffd166" stroke-width="2"/>`;
    return s + cap(k, `${v("presence")} · ${v("mood")} · ${tempo} bpm · ${v("counterpoint")} · ${v("source")}`);
  });

  /* ---------- no music ---------- */
  W.look("noMusic", (v, k) => {
    const len = v.n("length") / 60;
    const fill = idx(v, "fill");
    const cutoff = idx(v, "cutoff");
    const contrast = idx(v, "contrast");
    const purpose = idx(v, "purpose");
    const quieter = v.p("quieterBy");
    const fl = db(v.n("fillLevel"), -80);
    const a = 0.3;
    const b = k.clamp(a + 0.05 + len * 0.55, 0, 0.95);
    const before = [0.25, 0.5, 0.8, 1][contrast];
    let s = k.bg("#16161c");
    s += lane(k, 70, "music", 70);
    if (cutoff > 0) s += env(k, { y: 70, h: 66, wiggle: true, color: "#ffd166", f: (t) => (t < a ? before * (cutoff === 1 ? Math.min(1, (a - t) / 0.12) : cutoff === 2 ? (t > a - 0.05 ? 0.35 : 1) : 1) : t > b ? 0.5 : 0) });
    else s += env(k, { y: 70, h: 66, wiggle: true, color: "#ffd166", f: (t) => (t > b ? 0.5 : 0) }) + k.label({ x: 50 + (a / 2) * 262, y: 74, text: "never there", size: 8, color: "#888" });
    /* What fills the gap: nothing, a flat hum, birds and wind, or loud real sounds. */
    const fillH = [0, 0.08, 0.35, 0.8][fill] * (0.3 + fl * 0.7);
    s += env(k, { y: 70, h: 66, wiggle: fill >= 2, freq: fill === 3 ? 0.4 : 2.5, color: "#9fd3ff", alpha: 0.8, f: (t) => (t >= a && t <= b ? Math.max(fill ? 0.02 : 0, fillH) : 0) });
    if (fill === 0) s += `<line x1="${(50 + a * 262).toFixed(1)}" y1="${(70 - fl * 30).toFixed(1)}" x2="${(50 + b * 262).toFixed(1)}" y2="${(70 - fl * 30).toFixed(1)}" stroke="#9fd3ff" stroke-dasharray="2 3" opacity="0.5"/>`;
    if (fill === 0 && b - a > 0.14) s += k.label({ x: 50 + ((a + b) / 2) * 262, y: 74, text: "silence", size: 9, color: "#9fd3ff" });
    /* How much quieter: a drop measured on the side. */
    const dropY = 40 + quieter * 60;
    s += `<line x1="18" y1="40" x2="18" y2="${dropY.toFixed(1)}" stroke="#ff8a80" stroke-width="3"/>` + k.arrow({ x1: 18, y1: 40, x2: 18, y2: dropY + 4, color: "#ff8a80" }) + k.label({ x: 30, y: 122, text: v.n("quieterBy") ? `−${v("quieterBy")} dB` : "no drop", size: 8.5, color: "#ff8a80", anchor: "start" });
    /* The gap's job: a face. */
    const moodFace = [{ mood: 0.4, eyes: 0.4 }, { mood: -0.3, brows: -0.6, look: 0.8 }, { mood: -0.2, brows: 0.6, eyes: 1 }, { mood: -0.6, mouth: 0.8, eyes: 1, brows: 1 }, { mood: 0, eyes: 0.6 }][purpose];
    s += k.face(Object.assign({ x: 160, y: 140, r: 18 }, moodFace)) + k.label({ x: 200, y: 144, text: v("purpose"), size: 10, color: "#ddd", anchor: "start" });
    s += k.label({ x: 50 + ((a + b) / 2) * 262, y: 24, text: `${v("length")} s without music`, size: 9, color: "#fff" });
    return s + cap(k, `${v("length")} s · ${v("fill")} · ${v("cutoff")} · ${v("contrast")}`);
  });

  /* ---------- sound design (the world's sounds around you) ---------- */
  W.look("soundDesign", (v, k) => {
    const dens = [0, 3, 6, 10, 16][idx(v, "density")];
    const real = idx(v, "realism");
    const focus = idx(v, "focusSound");
    const off = v.n("offscreen");
    const bridge = idx(v, "bridge");
    const sur = idx(v, "surround");
    const boost = v.p("focusBoost");
    let s = k.bg("#16161c");
    /* The screen in front, the listener in the middle; sounds around them, wider as the mix surrounds you.
       At most 10 marks are drawn so a busy mix still reads; the caption says how dense it really is. */
    s += `<rect x="100" y="10" width="120" height="54" fill="#2e3440" stroke="#888" stroke-width="2"/>` + k.label({ x: 104, y: 20, text: "screen", size: 7, color: "#888", anchor: "start" });
    s += k.face({ x: 160, y: 112, r: 14, eyes: 0.9 }) + ear(k, 174, 112, 0.6);
    const shown = Math.min(dens, real >= 2 ? 6 : 10);
    const spread = real >= 2 ? [1.3, 2.5, 2 * Math.PI][sur] : [0.9, 1.8, 2 * Math.PI][sur];
    const pts = [];
    for (let i = 0; i < shown; i++) {
      const isOff = i < Math.round((off / Math.max(1, dens)) * shown) || (off > 0 && i === 0);
      const ang = -Math.PI / 2 + (shown > 1 ? i / (shown - 1) - 0.5 : 0) * spread * (sur === 2 ? (shown - 1) / shown : 1);
      const rx = isOff ? 136 : 92;
      const ry = isOff ? 92 : 62;
      pts.push([k.clamp(160 + Math.cos(ang) * rx, 18, 302), k.clamp(112 + Math.sin(ang) * ry, 16, 128), isOff]);
    }
    const words = ["clink", "tap", "whirr", "creak", "drip", "hum"];
    const mid = Math.floor(shown / 2);
    pts.forEach(([x, y, isOff], i) => {
      const big = focus > 0 && i === mid;
      const sc = big ? Math.min(1.3, 0.75 + focus * 0.12 + boost * 0.3) : 0.6;
      s += real >= 2 ? k.text({ x, y: y + 4, text: real === 3 ? words[i % 6].toUpperCase() + "!" : words[i % 6], size: big ? 10 + focus + boost * 4 : 9, color: big ? "#ffd166" : isOff ? "#c8a0ff" : "#9fd3ff", weight: 700, outline: real === 3 ? "#000" : null, italic: real === 2 }) : k.speaker({ x, y, s: sc, level: real === 1 ? 1 : 0.6, color: big ? "#ffd166" : isOff ? "#c8a0ff" : "#9fd3ff" });
    });
    if (focus === 3 && shown) s += k.ring({ x: pts[mid][0], y: pts[mid][1], r: 16, color: "#ffd166", dash: "3 2" });
    /* A strip along the bottom: how busy, how loud the focus sound is, and the sound carried across a cut. */
    s += `<rect x="0" y="136" width="320" height="26" fill="#0e0e12"/>`;
    const epm = v.n("eventsPerMinute");
    s += Array.from({ length: Math.round(epm / 5) }, (_, i) => `<rect x="${6 + i * 3.2}" y="150" width="2" height="${6 + (i % 3) * 2}" fill="#9fd3ff"/>`).join("") + k.label({ x: 6, y: 146, text: `${epm} a minute`, size: 7.5, color: "#ccc", anchor: "start" });
    s += k.meter({ x: 118, y: 150, w: 84, p: boost, label: `focus +${v("focusBoost")} dB`, color: focus ? "#ffd166" : "#776a40" });
    const bl = (bridge ? (bridge === 1 ? 0.3 : 1) : 0) * (8 + v.p("bridgeSeconds") * 60);
    s += `<rect x="240" y="150" width="76" height="8" fill="#2e3440"/><line x1="278" y1="146" x2="278" y2="160" stroke="#fff" stroke-width="2"/>` + (bl ? `<rect x="${(278 - bl * 0.5).toFixed(1)}" y="151" width="${(bl * 0.5 + 10).toFixed(1)}" height="6" fill="#ffd166"/>` : `<rect x="${(278 - (8 + v.p("bridgeSeconds") * 60) * 0.5).toFixed(1)}" y="151" width="${((8 + v.p("bridgeSeconds") * 60) * 0.5 + 10).toFixed(1)}" height="6" fill="none" stroke="#ffd166" stroke-dasharray="2 2" opacity="0.4"/>`) + k.label({ x: 278, y: 145, text: "sound over the cut", size: 7.5, color: "#ccc" });
    return s + cap(k, `${v("density")} · ${v("realism")} · ${v("surround")} · ${off} off screen · +${v("focusBoost")} dB`);
  });

  /* ---------- music level and ducking under voices ---------- */
  W.look("musicLevel", (v, k) => {
    const lv = idx(v, "setting");
    const duck = v.n("duck") / 24;
    const fade = idx(v, "fade");
    const forI = idx(v, "duckFor");
    const fills = idx(v, "fillsGaps");
    const under = db(v.n("musicDb"), -40);
    const att = v.n("duckAttack") / 2;
    const rel = v.n("duckRelease") / 5;
    const base = [0, 0.3, 0.55, 0.8, 1][lv];
    let s = k.bg("#16161c");
    s += lane(k, 40, "voices", 34) + lane(k, 110, "music", 70);
    /* Voices: main lines (green) and other voices (blue), and a door slam (any sound). */
    const V = [[0.08, 0.2, 1], [0.3, 0.38, 0], [0.48, 0.62, 1], [0.74, 0.8, 2]];
    V.forEach(([a, b, kind]) => (s += block(k, a, b, 40, 18, kind === 1 ? "#7fd1ae" : kind === 0 ? "#7fb7ff" : "#ff9a8a")));
    s += k.label({ x: 50 + 0.77 * 262, y: 30, text: "slam", size: 7, color: "#ff9a8a" });
    const ducks = V.filter(([, , kind]) => (forI === 1 ? kind === 1 : forI === 2 ? kind <= 1 : forI === 3));
    const slope = [0.004, 0.02, 0.05][fade];
    const lvlAt = (t) => {
      if (lv === 4) return 1;
      let m = base;
      let inGap = true;
      ducks.forEach(([a, b]) => {
        const ra = Math.max(0.002, slope + att * 0.06);
        const rr = Math.max(0.002, slope + rel * 0.08);
        let d = 0;
        if (t >= a && t <= b) d = Math.min(1, (t - a + ra) / ra);
        else if (t < a && t > a - ra) d = 1 - (a - t) / ra;
        else if (t > b && t < b + rr) d = 1 - (t - b) / rr;
        if (d > 0) {
          inGap = false;
          const low = Math.min(base, under * base + (1 - duck) * base * 0.5);
          m = Math.min(m, base - (base - low) * d * Math.max(0.15, duck));
        }
      });
      if (inGap && fills) m = Math.min(1, m + fills * 0.18);
      return m;
    };
    s += env(k, { y: 110, h: 66, wiggle: true, color: "#ffd166", n: 160, f: lvlAt });
    s += chip(k, 50, 157, `ducks ${v("duck")} dB for ${v("duckFor")}`, "#ffd166") + chip(k, 312, 14, `dips in ${v("duckAttack")} s · back in ${v("duckRelease")} s`, "#ccc", "end");
    return s + cap(k, `${v("setting")} · ${v("musicDb")} dB under speech · ${v("fade")} · fills gaps: ${v("fillsGaps")}`);
  });

  /* ---------- music sting ---------- */
  W.look("musicSting", (v, k) => {
    const kind = idx(v, "setting");
    const lvl = (idx(v, "level") + 1) / 3;
    const timing = idx(v, "stingTiming");
    const often = [1, 2, 4, 7][idx(v, "howOften")];
    const tone = idx(v, "tone");
    const len = v.n("stingLength") / 10;
    const off = v.n("stingOffset") / 8;
    const sdb = db(v.n("stingDb"), -30);
    const spm = v.n("stingsPerMinute");
    let s = k.bg("#16161c");
    /* The beat it lands on: a face reacting, serious to silly. */
    s += `<rect x="8" y="8" width="120" height="78" fill="#2e3440" stroke="#888"/>` + k.face({ x: 68, y: 48, r: 24, mood: [-0.6, -0.2, 0.3, 0.9][tone], brows: [0.8, 0.5, -0.2, -0.6][tone], mouth: tone === 3 ? 0.7 : 0, eyes: 1 });
    const icon = ["", "↗", "!", "⟲", "wah-wah", "aah", "brrr"][kind];
    if (kind) s += k.text({ x: 214, y: 62, text: icon, size: 14 + lvl * 12 * (0.5 + sdb), color: "#ffd166", weight: 700, outline: "#000" });
    s += k.label({ x: 214, y: 22, text: kind ? v("setting") : "no sting", size: 10, color: "#ccc" });
    /* The lane: each sting a block at the moments, early or late, as long as it is. */
    s += lane(k, 124, "sting", 40);
    const moments = Array.from({ length: often }, (_, i) => 0.1 + (i + 0.5) * (0.8 / often));
    moments.forEach((m) => {
      s += vline(k, m, 100, 148, "#e57373", "2 2");
      const a = k.clamp(m + [-0.05, 0, 0.05][timing] + off, 0, 0.98);
      s += block(k, a, a + 0.01 + len * 0.18, 124, 6 + lvl * 14 * (0.4 + sdb), "#ffd166", kind ? 0.9 : 0.22);
    });
    s += k.label({ x: 50 + moments[0] * 262, y: 96, text: "moment", size: 7.5, color: "#e57373" });
    s += Array.from({ length: spm }, (_, i) => `<rect x="${50 + i * 6}" y="150" width="4" height="7" fill="#ffd166"/>`).join("") + k.label({ x: 50 + spm * 6 + 6, y: 157, text: `${spm} a minute`, size: 8, color: "#ccc", anchor: "start" });
    return s + cap(k, `${v("setting")} · ${v("level")} · ${v("stingTiming")} · ${v("howOften")} · ${v("tone")}`);
  });

  /* ---------- the four roles of the mix ---------- */
  W.look("soundRoles", (v, k) => {
    const lead = idx(v, "setting");
    const ids = ["dialogue", "music", "effects", "ambience"];
    const cols = ["#7fd1ae", "#ffd166", "#ff9a8a", "#9fb7ff"];
    const P = ids.map((id) => v.p(id));
    /* A room with four sound sources: two people talking, a radio playing music, a door that slams, rain at the
       window. Each one is drawn as loud as its level (bigger, brighter, more sound lines); the one that leads is
       ringed, and the rest step back. */
    const al = (i) => (0.25 + P[i] * 0.75) * (i === lead ? 1 : 0.8);
    let s = k.bg("#2a2530") + `<rect x="0" y="128" width="320" height="52" fill="#3a3028"/>`;
    /* Ambience: rain at the window, more streaks and a wider hiss the louder it is. */
    s += `<rect x="18" y="20" width="62" height="56" fill="#3b4a66" stroke="${k.INK}" stroke-width="2"/>`;
    s += `<g opacity="${r1(al(3))}">` + Array.from({ length: 2 + Math.round(P[3] * 16) }, (_, i) => `<line x1="${r1(22 + k.rnd(i + 4) * 54)}" y1="${r1(24 + k.rnd(i + 9) * 40)}" x2="${r1(19 + k.rnd(i + 4) * 54)}" y2="${r1(32 + k.rnd(i + 9) * 40)}" stroke="${cols[3]}" stroke-width="1.2"/>`).join("") + Array.from({ length: Math.round(P[3] * 3) }, (_, i) => `<path d="M${84 + i * 6} ${34 + i * 2} q4 14 0 28" fill="none" stroke="${cols[3]}" stroke-width="1.5"/>`).join("") + "</g>";
    /* Music: a radio on a shelf with notes floating up. */
    s += `<rect x="20" y="100" width="56" height="5" fill="#5a4030"/><g opacity="${r1(al(1))}"><rect x="30" y="84" width="36" height="16" rx="3" fill="#8a5a3a" stroke="${k.INK}"/><circle cx="40" cy="92" r="5" fill="#333"/><rect x="50" y="88" width="12" height="3" fill="#ddd"/>${notes(k, 34, 76, 1 + Math.round(P[1] * 4), cols[1], 0.6 + P[1] * 0.5)}</g>`;
    /* Dialogue: two people talking, bubbles as big as the level. */
    const bw = 30 + P[0] * 40;
    s += `<g opacity="${r1(0.5 + al(0) * 0.5)}">${k.person({ x: 135, y: 160, s: 0.95, color: "#4a6fa5", look: 1, mood: 0.3 })}${k.person({ x: 190, y: 160, s: 0.95, color: "#c0392b", look: -1, mood: 0.2 })}</g>`;
    if (P[0] > 0.02) s += `<g opacity="${r1(al(0))}">${k.bubble({ x: 150, y: 44, text: P[0] > 0.6 ? "Listen to me!" : "hi…", w: bw + 20, h: 14 + P[0] * 10, size: 7 + P[0] * 4, tail: -10 })}</g>`;
    /* Effects: a door at the right, slamming with a burst. */
    s += `<rect x="248" y="40" width="44" height="88" fill="#6a4a30" stroke="${k.INK}" stroke-width="2"/><circle cx="284" cy="86" r="2.5" fill="#ffd166"/>`;
    if (P[2] > 0.02) s += `<g opacity="${r1(al(2))}">` + Array.from({ length: 6 }, (_, i) => { const a = (i / 6) * Math.PI * 2; const r0 = 30; const r2 = 30 + P[2] * 20; return `<line x1="${r1(270 + Math.cos(a) * r0)}" y1="${r1(84 + Math.sin(a) * r0 * 1.4)}" x2="${r1(270 + Math.cos(a) * r2)}" y2="${r1(84 + Math.sin(a) * r2 * 1.4)}" stroke="${cols[2]}" stroke-width="2"/>`; }).join("") + k.text({ x: 270, y: 30, text: "BANG", size: 8 + P[2] * 8, color: cols[2], weight: 700, outline: "#000" }) + "</g>";
    /* The lead: a ring round the source that carries the scene. */
    const ring = [[162, 110, 46], [48, 84, 26], [270, 84, 34], [49, 48, 38]][lead];
    s += k.ring({ x: ring[0], y: ring[1], r: ring[2], color: cols[lead], w: 2, dash: "4 3" }) + chip(k, ring[0], Math.max(16, ring[1] - ring[2] - 2), `${ids[lead]} leads`, cols[lead], "middle");
    /* The four levels, small, along the floor. */
    s += ids.map((id, i) => `<rect x="${200 + i * 28}" y="${r1(156 - P[i] * 20)}" width="8" height="${r1(Math.max(1, P[i] * 20))}" fill="${cols[i]}" opacity="${i === lead ? 1 : 0.6}"/>`).join("");
    return s + cap(k, `${v("setting")} leads · dialogue ${v("dialogue")}% · music ${v("music")}% · fx ${v("effects")}% · ambience ${v("ambience")}%`);
  });

  /* ---------- where a sound sits around you ---------- */
  W.look("soundPlace", (v, k) => {
    const around = v.n("around");
    const height = v.n("height");
    const dist = Math.max(0.3, v.n("distance"));
    const onScr = idx(v, "onScreen");
    const moving = idx(v, "moving");
    const cx = 110;
    const cy = 96;
    const R = 14 + (Math.log(dist / 0.3) / Math.log(100 / 0.3)) * 50;
    const a = k.rad(around - 90);
    const sx = cx + Math.cos(a) * R;
    const sy = cy + Math.sin(a) * R;
    let s = k.bg("#16161c") + `<rect x="4" y="4" width="212" height="160" rx="6" fill="#1d1d22" stroke="#333"/>`;
    /* The screen's view in front of the listener: a wedge; the source is in it, at its edge, or outside. */
    s += k.beam({ x: cx, y: cy, dir: -90, len: 95, spread: 60, color: "#ffffff", alpha: 0.07 }) + k.label({ x: cx, y: 16, text: "on screen", size: 7.5, color: "#888" });
    s += k.ring({ x: cx, y: cy, r: R, color: "#444", dash: "3 3", w: 1 });
    s += k.face({ x: cx, y: cy, r: 10, eyes: 0.9 });
    /* Moving: a trail behind the source. */
    if (moving === 1) s += `<path d="M${sx - 14} ${sy + 6} q7 -4 14 -6" fill="none" stroke="#ffd166" stroke-dasharray="2 2"/>`;
    if (moving === 2) s += k.arrow({ x1: sx - 40, y1: sy + 10, x2: sx + 30, y2: sy - 8, color: "#ffd166", w: 1.5 });
    if (moving === 3) s += k.ring({ x: cx, y: cy, r: R, color: "#ffd166", w: 1.5 }) + k.arrow({ x1: cx + R * 0.7, y1: cy - R * 0.7, x2: cx + R, y2: cy - 2, color: "#ffd166", w: 1.5 });
    s += k.speaker({ x: sx, y: sy, s: 0.7, level: 1 - Math.min(1, R / 90), color: onScr === 0 ? "#ffd166" : onScr === 1 ? "#ffb070" : "#c8a0ff" });
    const ly = sy + 20 > 158 ? sy - 14 : sy + 20;
    const lx = k.clamp(sx, 44, 176);
    s += onScr === 2 ? k.label({ x: lx, y: ly, text: "unseen", size: 8, color: "#c8a0ff" }) : onScr === 1 ? k.label({ x: lx, y: ly, text: "just off the edge", size: 8, color: "#ffb070" }) : "";
    /* Side view: above or below. */
    const ha = k.rad(-height);
    s += `<rect x="224" y="4" width="92" height="160" rx="6" fill="#1d1d22" stroke="#333"/>` + k.label({ x: 270, y: 16, text: "from the side", size: 7.5, color: "#888" }) + k.face({ x: 250, y: 90, r: 9, eyes: 0.9, look: 1 });
    s += k.speaker({ x: 250 + Math.cos(ha) * 48, y: 90 + Math.sin(ha) * 48, s: 0.6, level: 0.7, color: "#ffd166" }) + `<line x1="232" y1="90" x2="312" y2="90" stroke="#444" stroke-dasharray="2 3"/>`;
    return s + cap(k, `${around}° around · ${height}° up · ${v("distance")} m · ${v("onScreen")} · ${v("moving")}`);
  });

  /* ---------- sound density ---------- */
  W.look("soundDensity", (v, k) => {
    const d = v.p("setting");
    const layers = v.n("layers");
    const air = v.p("air");
    const rumble = v.p("rumble");
    const clear = v.p("clarity");
    const gap = v.n("gapLength") / 10;
    let s = k.bg("#16161c");
    /* Each layer is a strip of sound; air and gaps cut holes in it; clarity keeps the layers apart. */
    const n = layers;
    const top = 14;
    const H = 116;
    const step = H / n;
    for (let i = 0; i < n; i++) {
      const y = top + step * (i + 0.5) * k.lerp(0.35, 1, clear) + (1 - clear) * 38;
      const col = clear > 0.3 ? k.hsl(i * 33, 55, 60) : "#9a9a9a";
      const holeEvery = 0.12 + (1 - d) * 0.15;
      const hole = 0.005 + air * 0.05 + gap * 0.06;
      s += env(k, { x: 20, w: 290, y, h: Math.max(6, step * 1.1 * (0.6 + d * 0.6)), wiggle: true, freq: 1 + i * 0.37, color: col, alpha: k.lerp(0.35, 0.85, clear), f: (t) => (((t + i * 0.037) % holeEvery) < hole ? 0 : 0.5 + d * 0.5) });
    }
    /* The low rumble underneath. */
    s += env(k, { x: 20, w: 290, y: 150, h: 24, wiggle: true, freq: 0.25, color: "#8a5aff", alpha: 0.85, f: () => 0.08 + rumble * 0.92 }) + k.label({ x: 316, y: 154, text: "rumble", size: 7.5, color: "#c8a0ff", anchor: "end" });
    return s + cap(k, `density ${v("setting")} · ${layers} layers · ${v("air")} air · ${v("clarity")} · gaps ${v("gapLength")} s`);
  });

  /* ---------- audio fade at a cut ---------- */
  W.look("audioFade", (v, k) => {
    const kind = idx(v, "setting");
    const len = v.n("length") / 5;
    const curve = idx(v, "curve");
    const off = v.n("offset") / 2;
    const depth = db(v.n("fadeDepth"), -60);
    const cut = 0.5 + off * 0.12;
    const w = 0.004 + len * 0.22;
    const shape = (u) => (curve === 0 ? u : curve === 1 ? u * u * (3 - 2 * u) : Math.pow(u, 4));
    let s = k.bg("#16161c");
    s += lane(k, 40, "picture", 30) + `<rect x="50" y="25" width="131" height="30" fill="#4a6fa5"/><rect x="181" y="25" width="131" height="30" fill="#a5524a"/>`;
    s += lane(k, 110, "sound", 80);
    const floor = depth;
    const outA = (t) => {
      if (kind === 2 || kind === 3 || kind === 4) {
        if (t < cut - w) return 1;
        if (t > cut) return kind === 4 ? 0 : floor;
        return 1 - (1 - floor) * shape((t - (cut - w)) / w);
      }
      return t < cut ? 1 : 0;
    };
    const inB = (t) => {
      if (kind === 1 || kind === 3 || kind === 4) {
        const st = kind === 4 ? cut - w : cut;
        if (t < st) return kind === 4 ? 0 : t < cut ? 0 : floor;
        if (t > st + w) return 1;
        return floor * (kind === 4 ? 0 : 1) + (1 - floor * (kind === 4 ? 0 : 1)) * shape((t - st) / w);
      }
      return t >= cut ? 1 : 0;
    };
    s += env(k, { y: 110, h: 74, wiggle: true, freq: 1.3, color: "#7fb7ff", n: 160, f: (t) => (t <= cut + (kind === 4 ? 0 : 0) || kind === 2 || kind === 3 ? outA(t) * (t <= cut || kind === 2 || kind === 3 ? 1 : 0) : 0) });
    s += env(k, { y: 110, h: 74, wiggle: true, freq: 2.1, color: "#ff9a8a", alpha: 0.75, n: 160, f: (t) => (t >= cut || kind === 4 ? inB(t) : 0) });
    s += vline(k, 0.5, 20, 154, "#fff") + k.label({ x: 50 + 0.5 * 262, y: 164, text: "cut", size: 8, color: "#fff" });
    if (off) s += k.arrow({ x1: 50 + 0.5 * 262, y1: 152, x2: 50 + cut * 262, y2: 152, color: "#ffd166", w: 1.5 });
    s += `<line x1="50" y1="${(110 - floor * 37).toFixed(1)}" x2="312" y2="${(110 - floor * 37).toFixed(1)}" stroke="#ffd166" stroke-dasharray="2 3" opacity="0.6"/>` + k.label({ x: 46, y: 80, text: `${v("fadeDepth")} dB`, size: 7.5, color: "#ffd166", anchor: "end" });
    return s + cap(k, `${v("setting")} · ${v("length")} s · ${v("curve")} · ${v("offset")} s from the cut`);
  });

  /* ---------- voice effect ---------- */
  W.look("voiceEffect", (v, k) => {
    const fx = idx(v, "setting");
    const str = v.p("effectStrength");
    const span = idx(v, "effectSpan");
    const wob = idx(v, "wobble");
    const pitch = v.n("pitchShift");
    const secs = v.n("effectSeconds") / 600;
    const rate = v.n("wobbleRate");
    const who = idx(v, "who");
    let s = k.bg("#16161c");
    /* Faces: the ones the effect is on wear its sign. */
    const faces = [[50, "one"], [120, "narr"], [190, "other"]];
    faces.forEach(([x], i) => {
      const on = who === 2 || (who === 0 && i === 0) || (who === 1 && i === 1);
      s += i === 1 ? k.mic({ x, y: 40, s: 1.1 }) : k.face({ x, y: 38, r: 18, mouth: 0.5, eyes: 0.9 });
      if (on && fx > 0) s += k.ring({ x, y: 38, r: 25, color: "#ffd166", w: 2 });
    });
    if (fx === 1) s += robot(k, 50, 38, 14);
    if (fx === 6) s += `<path d="M66 32 L94 20 L94 56 L66 44 Z" fill="#e6c35a" stroke="${k.INK}"/>`;
    if (fx === 7) s += [0, 1, 2].map((i) => k.ring({ x: 74 + i * 6, y: 20 - i * 8, r: 3 + i, color: "#9fd3ff", w: 1.5 })).join("");
    s += k.label({ x: 270, y: 34, text: v("setting"), size: 12, color: "#ffd166", weight: 700 }) + k.label({ x: 270, y: 50, text: `${pitch > 0 ? "+" : ""}${pitch} semitones`, size: 8.5, color: "#ccc" });
    /* The voice as a wave: its pitch is how tight the wave is; the effect bends it. */
    const base = 6 * Math.pow(2, pitch / 12) * ([1, 1, 1.8, 0.55, 1, 1, 1, 0.7][fx] * str + (1 - str));
    s += lane(k, 110, "voice", 56);
    const pts = [];
    for (let i = 0; i <= 200; i++) {
      const t = i / 200;
      const wobA = wob === 0 ? 0 : (wob === 1 ? 0.25 : 0.6) * Math.sin(t * Math.PI * 2 * (1 + rate * 1.5));
      let y = Math.sin(t * Math.PI * 2 * base * (1 + wobA * 0.3));
      if (fx === 1) y = Math.sign(y) * (0.3 + 0.7 * str) + y * (1 - str);
      if (fx === 5) y = Math.max(-1 + str * 0.6, Math.min(1 - str * 0.6, y));
      if (fx === 7) y *= 1 - str * 0.5 * (0.5 + 0.5 * Math.sin(t * 9));
      if (fx === 6) y *= 1 + str * 0.4;
      pts.push(`${(50 + t * 262).toFixed(1)},${(110 - y * 22).toFixed(1)}`);
    }
    s += `<polyline points="${pts.join(" ")}" fill="none" stroke="#9fd3ff" stroke-width="2"/>`;
    if (fx === 4) s += `<polyline points="${pts.join(" ")}" fill="none" stroke="#9fd3ff" stroke-width="1.5" opacity="${(0.15 + str * 0.4).toFixed(2)}" transform="translate(${8 + str * 10} 0)"/><polyline points="${pts.join(" ")}" fill="none" stroke="#9fd3ff" stroke-width="1" opacity="${(0.1 + str * 0.25).toFixed(2)}" transform="translate(${18 + str * 22} 0)"/>`;
    s += Array.from({ length: Math.round(v.n("wobbleRate") * 2) }, (_, i) => `<circle cx="${(54 + i * 13).toFixed(1)}" cy="80" r="2" fill="${wob ? "#ffd166" : "#666"}"/>`).join("") + k.label({ x: 312, y: 78, text: `${v("wobbleRate")} wobbles/s`, size: 7.5, color: "#aaa", anchor: "end" });
    /* How long it lasts: the span along the film, and the seconds. */
    const sp = [0.08, 0.2, 0.5, 1][span];
    s += `<rect x="50" y="148" width="262" height="8" rx="4" fill="#2e2e36"/><rect x="50" y="148" width="${(sp * 262).toFixed(1)}" height="8" rx="4" fill="#ffd166"/><rect x="50" y="160" width="${Math.max(1.5, secs * 262).toFixed(1)}" height="4" fill="#9fd3ff"/>` + k.label({ x: 46, y: 157, text: "lasts", size: 8, color: "#aaa", anchor: "end" });
    return s + cap(k, `${v("setting")} · ${v("effectStrength")}% · ${v("effectSpan")} · ${v("wobble")} · on ${v("who")}`);
  });

  /* ---------- sound hits ---------- */
  W.look("sfxHits", (v, k) => {
    const none = idx(v, "setting") === 0;
    const n = none ? 4 : [0, 2, 4, 7, 12][idx(v, "setting")];
    const kind = idx(v, "kind");
    const sync = idx(v, "sync");
    const size = idx(v, "hitSize");
    const cartoon = idx(v, "cartoony");
    const pm = v.n("perMinute");
    const off = v.n("hitOffset") / 0.5;
    const hdb = db(v.n("hitDb"), -30);
    const len = v.n("hitLength") / 5;
    const word = ["whoosh", "thud", "pop", "swish", "rise", "ding", "scratch"][kind];
    let s = k.bg("#16161c");
    s += lane(k, 92, "action", 16) + lane(k, 112, "cuts", 12) + lane(k, 140, "hits", 34);
    const acts = [0.1, 0.28, 0.43, 0.6, 0.77, 0.9];
    const cuts = [0.18, 0.37, 0.52, 0.7, 0.85];
    acts.forEach((a) => (s += `<rect x="${(50 + a * 262 - 4).toFixed(1)}" y="86" width="8" height="12" fill="#e57373"/>`));
    cuts.forEach((c) => (s += vline(k, c, 106, 118, "#fff")));
    for (let i = 0; i < n; i++) {
      const target = sync === 2 ? cuts[i % cuts.length] : acts[i % acts.length];
      const loose = sync === 0 ? (k.rnd(i + 3) - 0.5) * 0.08 : 0;
      const a = k.clamp(target + loose + off * 0.04 + Math.floor(i / 6) * 0.012, 0, 0.98);
      s += block(k, a, a + 0.006 + len * 0.12, 140, 4 + (size + 1) * 6 * (0.4 + hdb * 0.6), "#ffd166", none ? 0.22 : 0.9);
    }
    /* The big word: a real thud is small and plain, a cartoon one is big, tilted and outlined. */
    s += k.text({ alpha: none ? 0.25 : 1, x: 160, y: 50, text: cartoon === 2 ? word.toUpperCase() + "!" : word, size: 10 + size * 7 + cartoon * 3, color: cartoon ? "#ffd166" : "#ddd", weight: cartoon ? 800 : 400, outline: cartoon === 2 ? "#c0392b" : null, outlineW: 3, italic: cartoon >= 1 });
    if (none) s += k.label({ x: 160, y: 72, text: "no hits", size: 9, color: "#888" });
    if (cartoon === 2 && !none) s += [0, 1, 2, 3, 4, 5].map((i) => `<line x1="${160 + Math.cos(i) * 60}" y1="${44 + Math.sin(i) * 26}" x2="${160 + Math.cos(i) * 80}" y2="${44 + Math.sin(i) * 34}" stroke="#ffd166" stroke-width="2"/>`).join("");
    s += Array.from({ length: Math.round(pm / 2) }, (_, i) => `<rect x="${6 + i * 3.3}" y="10" width="2" height="7" fill="#ffd166"/>`).join("") + k.label({ x: 6, y: 28, text: `${pm} a minute`, size: 7.5, color: "#ccc", anchor: "start" });
    return s + cap(k, `${v("setting")} · ${v("kind")} · on ${v("sync")} · ${v("hitSize")} · ${v("hitOffset")} s`);
  });

  /* ---------- loudness ---------- */
  W.look("loudness", (v, k) => {
    const lv = v.p("setting");
    const peak = db(v.n("peak"), -24);
    const noise = v.p("noise");
    const swings = v.p("swings");
    const punch = v.p("punch");
    const avg = (v.n("averageLoud") + 40) / 35;
    const range = v.n("loudRange") / 30;
    /* Someone on a sofa watching a screen. Sound comes off the speaker as rings: more and stronger rings the
       louder the mix, uneven rings for wide swings, a burst for punch, red rings clipped flat at the peak line,
       and a fizz of hiss that clears as noise is taken out. The viewer leans in to hear, or covers their ears. */
    let s = k.bg("#1d1a24") + `<rect x="0" y="132" width="320" height="48" fill="#2c2620"/>`;
    s += `<rect x="16" y="40" width="70" height="48" rx="3" fill="#2e3a4e" stroke="#888" stroke-width="2"/><rect x="46" y="88" width="10" height="44" fill="#444"/>`;
    s += k.person({ x: 51, y: 84, s: 0.6, color: "#c0392b", arms: lv > 0.6 ? 0.8 : 0.2, mood: 0.4 });
    s += `<rect x="88" y="70" width="18" height="34" rx="3" fill="#333" stroke="#888"/><circle cx="97" cy="80" r="4" fill="#666"/><circle cx="97" cy="95" r="6" fill="#666"/>`;
    const loudness = k.clamp(0.25 + lv * 0.4 + avg * 0.35, 0, 1);
    const ceil = 0.45 + peak * 0.55;
    const n = 2 + Math.round(loudness * 6);
    const clipped = lv > 0.9 || loudness > ceil;
    for (let i = 0; i < n; i++) {
      const r = 14 + i * 16;
      const sw = 1 + Math.abs(Math.sin(i * 1.7)) * (swings * 3 + range * 3);
      const strong = (i % 2 ? 1 : 0.6) * loudness;
      const over = r / 140 > ceil;
      s += `<path d="M${r1(106 + r * 0.2)} ${r1(87 - r * 0.7)} A${r} ${r} 0 0 1 ${r1(106 + r * 0.2)} ${r1(87 + r * 0.7)}" fill="none" stroke="${over || (clipped && i > n - 3) ? "#ff5a5a" : "#9fd3ff"}" stroke-width="${r1(sw)}" opacity="${r1(0.3 + strong * 0.6)}"/>`;
    }
    /* The peak line: a ceiling the rings are not allowed past. */
    const px = 106 + ceil * 140;
    s += `<line x1="${r1(px)}" y1="24" x2="${r1(px)}" y2="130" stroke="#ff5252" stroke-dasharray="4 3"/>` + k.label({ x: px, y: 20, text: `peak ${v("peak")} dB`, size: 8, color: "#ff8a80" });
    if (punch > 0) s += k.text({ x: 140, y: 34, text: "BOOM", size: 8 + punch * 10, color: "#ffd166", weight: 700, outline: "#000" });
    /* Hiss: specks around the speaker, fewer as noise reduction rises. */
    s += Array.from({ length: Math.round((1 - noise) * 30) }, (_, i) => k.dot({ x: 92 + k.rnd(i + 3) * 60, y: 60 + k.rnd(i + 17) * 60, r: 0.9, color: "#ddd" })).join("");
    /* The viewer: leaning in for quiet, at ease for normal, ears covered when it is loud. */
    const loud = loudness > 0.75 || clipped;
    s += `<rect x="236" y="118" width="74" height="16" rx="5" fill="#5a3a4a"/><rect x="236" y="100" width="12" height="34" rx="4" fill="#5a3a4a"/>`;
    s += k.person({ x: 272, y: 150, s: 0.9, color: "#4a6fa5", look: -1, mood: loud ? -0.7 : loudness < 0.35 ? -0.2 : 0.3, arms: loud ? 1 : 0, lean: loudness < 0.35 ? -12 : 0 });
    if (loud) s += k.label({ x: 272, y: 52, text: "too loud!", size: 9, color: "#ff8a80", weight: 700 });
    else if (loudness < 0.35) s += k.label({ x: 272, y: 52, text: "what did they say?", size: 8, color: "#ccc" });
    s += chip(k, 10, 157, `${v("averageLoud")} LUFS average`, "#9fd3ff") + chip(k, 312, 157, `${v("loudRange")} dB range`, "#ffd166", "end");
    return s + cap(k, `${v("setting")} · ${v("swings")} swings · punch ${v("punch")} · noise −${v("noise")}%`);
  });

  /* ---------- translated voice ---------- */
  W.look("translatedVoice", (v, k) => {
    const tr = idx(v, "setting");
    const lang = idx(v, "language");
    const like = idx(v, "soundsLike");
    const subs = idx(v, "subtitles");
    const under = idx(v, "originalUnder");
    const lip = v.n("lipOffset") / 500;
    const odb = db(v.n("originalDb"), -60);
    const hello = ["Hello", "Hola", "Bonjour", "Marhaba", "Namaste", "Konnichiwa", "Ciao"][lang];
    let s = k.bg("#16161c");
    s += `<rect x="8" y="8" width="150" height="84" fill="#2e3440" stroke="#888"/>` + k.face({ x: 70, y: 46, r: 27, mouth: tr === 2 ? 0.6 : 0.3, eyes: 0.9 });
    s += k.bubble({ x: 210, y: 30, text: tr === 0 ? "Ahoj" : hello, w: 84, h: 24, size: 11, tail: -40 });
    if (subs > 0) s += `<rect x="20" y="76" width="126" height="13" fill="rgba(0,0,0,0.7)"/>` + k.label({ x: 83, y: 86, text: subs === 1 ? "(key line)" : "Hello, it's me.", size: 8.5, color: "#fff" });
    /* Lanes: mouth movement, the new voice, the original underneath. */
    s += lane(k, 108, "mouth", 14) + lane(k, 127, "voice", 18) + lane(k, 147, "original", 16);
    const words = [[0.1, 0.2], [0.28, 0.42], [0.5, 0.58], [0.66, 0.84]];
    const shift = tr === 2 ? lip * 0.05 : 0.02 + lip * 0.12;
    const voiceCol = [k.hsl(30, 60, 60), k.hsl(200, 45, 60), "#9fd3ff"][like];
    words.forEach(([a, b]) => {
      s += block(k, a, b, 108, 8, "#e57373");
      s += block(k, a + (tr ? shift : 0), b + (tr ? shift : 0), 127, 12, tr ? voiceCol : "#9fd3ff");
      s += block(k, a, b, 147, 2 + (tr ? [0, 0.4, 1][under] : 1) * odb * 12, "#9fd3ff", tr ? 0.35 + under * 0.25 : 0.9);
    });
    s += k.label({ x: 210, y: 64, text: tr ? `voice: ${v("soundsLike")}` : "original voice", size: 9, color: voiceCol });
    s += k.label({ x: 210, y: 80, text: `lips off ${v("lipOffset")} ms`, size: 8.5, color: "#ccc" });
    return s + cap(k, `${v("setting")} · into ${v("language")} · subtitles: ${v("subtitles")} · original ${v("originalUnder")}`);
  });

  /* ---------- voice cleanup ---------- */
  W.look("voiceCleanup", (v, k) => {
    const c = idx(v, "setting");
    const room = idx(v, "room");
    const hiss = 1 - v.p("hiss");
    const warm = v.p("warmth");
    const br = idx(v, "breaths");
    const echo = 1 - v.p("echoCut");
    const bcut = v.p("breathCut");
    const echoLeft = (c === 1 || c === 3 ? 0.4 : 1) * echo * [0, 0.5, 1][room];
    const enhance = c >= 2 ? 1 : 0;
    const col = k.mix("#9fd3ff", "#ffb070", warm);
    let s = k.bg("#16161c");
    s += lane(k, 80, "voice", 110);
    /* Spoken words with breaths between them; echo trails after each; hiss along the whole lane. */
    const words = [[0.04, 0.2], [0.3, 0.5], [0.6, 0.78], [0.86, 0.97]];
    const amp = (t) => {
      let a = 0;
      words.forEach(([x, y]) => {
        if (t >= x && t <= y) a = Math.max(a, 0.5 + enhance * 0.3 + warm * 0.15);
        else if (t > y && t < y + 0.08 && echoLeft) a = Math.max(a, (1 - (t - y) / 0.08) * 0.5 * echoLeft);
      });
      return a;
    };
    s += env(k, { y: 80, h: 104, n: 220, wiggle: true, freq: k.lerp(2.4, 0.9, warm), color: col, f: amp });
    if (br > 0) words.slice(0, 3).forEach(([, y]) => (s += env(k, { x: 50 + (y + 0.02) * 262, w: 14, y: 80, h: 104, n: 10, color: "#c8a0ff", alpha: 0.8, f: (t) => Math.sin(t * Math.PI) * (br === 1 ? 0.18 : 0.32) * (1 - bcut * 0.85) })));
    s += env(k, { y: 80, h: 104, n: 220, wiggle: true, freq: 5.3, color: "#dddddd", alpha: 0.35, f: () => 0.02 + hiss * 0.18 });
    s += `<rect x="50" y="150" width="262" height="8" rx="4" fill="#2e2e36"/><rect x="50" y="150" width="${(echoLeft * 262).toFixed(1)}" height="8" rx="4" fill="#9fb7ff"/>` + k.label({ x: 46, y: 157, text: "echo left", size: 8, color: "#aaa", anchor: "end" });
    s += k.label({ x: 312, y: 22, text: `breaths −${v("breathCut")} dB · ${v("warmth")}`, size: 8.5, color: "#c8a0ff", anchor: "end" });
    return s + cap(k, `${v("setting")} · room ${v("room")} · hiss −${v("hiss")}% · echo −${v("echoCut")}% · ${v("breaths")}`);
  });

  /* ---------- dot grids ---------- */
  const pad = (id, x, y, xLabel, yLabel) => W.add(id, { window: { faces: [{ face: "pad", x, y, xLabel, yLabel }] } });
  pad("voiceover", "voLead", "voLevel", "Seconds ahead of the picture", "Loudness against the scene");
  pad("musicCue", "cueOffset", "level", "Starts before or after", "Level");
  pad("soundToCut", "lead", "overlap", "Lead or lag", "Seconds of overlap");
  pad("noMusic", "length", "quieterBy", "How long without music", "How much quieter");
  pad("musicSting", "stingOffset", "stingDb", "Before or after the moment", "Sting level");
  pad("audioFade", "offset", "length", "Before or after the cut", "Length");
  pad("sfxHits", "hitOffset", "hitDb", "Before or after the action", "Hit level");
  pad("translatedVoice", "lipOffset", "originalDb", "Lips off by", "Original voice level");
  pad("voiceCleanup", "hiss", "echoCut", "Hiss taken out", "Echo taken out");
  pad("soundDesign", "eventsPerMinute", "focusBoost", "Sounds per minute", "Singled-out sound louder by");
  pad("voiceEffect", "pitchShift", "effectStrength", "Pitch shift", "How strong the effect");
})(typeof window !== "undefined" ? window.CuriosityWindows : require("./windows.js"));
