/* look for the lines, movement-with-lines, character-motion and camera-motion curiosities in data/db-depth-acting.js
   (depth thread, acting): the live picture at the top of each window. Same house style as look-heart-comedy.js and
   look-depth-sound.js: a picture on top (y 0 to 120) that shows the acting as people, words and paths you can read
   at a glance (words as blocks in a speech line, people seen from the side or from above, the camera's path as a
   dashed line), a strip of small labelled gauges below it, and a caption. Colors: gold = the words, blue = the
   person acting, pink = the other person, red = trouble, green = calm, grey = the camera. Every own setting moves
   something of its own. */
(function (W) {
  const S = { bg: "#15151c", lane: "#22222b", gold: "#ffd166", red: "#e4572e", blue: "#6fa8dc", green: "#5fae78", purple: "#9b6bb5", grey: "#8a8a96", pink: "#d9789b", paper: "#f4f1ea", ink: "#1c1712", ice: "#9fd3ff", orange: "#e8913a", floor: "#2a2630" };
  const r1 = (n) => Math.round(n * 10) / 10;
  const fmt = (n) => String(Math.round(n * 100) / 100);

  /* ---------- small drawing helpers ---------- */
  const emo = (k, x, y, e, size) => k.label({ x, y, text: e, size: size || 16 });
  /* A row of words as rounded blocks: n blocks from x, each w wide, at y. alpha may be a function of the index. */
  const words = (k, x, y, n, w, color, alpha, dash) =>
    Array.from({ length: Math.max(0, Math.round(n)) }, (_, i) => {
      const a = typeof alpha === "function" ? alpha(i) : alpha == null ? 1 : alpha;
      return `<rect x="${r1(x + i * (w + 4))}" y="${r1(y - 5)}" width="${r1(w)}" height="10" rx="4" fill="${dash ? "none" : color}" stroke="${color}" stroke-width="1.2"${dash ? ` stroke-dasharray="3 2"` : ""} opacity="${r1(k.clamp(a, 0, 1) * 100) / 100}"/>`;
    }).join("");
  /* A person seen from above: a head circle with a nose line pointing the way they face (0 = right, 90 = down). */
  const topP = (k, x, y, dir, color, r) => {
    const rr = r || 9;
    const a = (dir * Math.PI) / 180;
    return `<circle cx="${r1(x)}" cy="${r1(y)}" r="${rr}" fill="${color || S.blue}" stroke="${S.ink}" stroke-width="1.5"/><line x1="${r1(x)}" y1="${r1(y)}" x2="${r1(x + Math.cos(a) * rr * 1.7)}" y2="${r1(y + Math.sin(a) * rr * 1.7)}" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>`;
  };
  /* The camera seen from above, as a small box with a cone. */
  const topCam = (k, x, y, dir) => k.beam({ x, y, dir, len: 34, spread: 40, color: "#cfd3dc", alpha: 0.18 }) + k.cam({ x, y, dir, s: 0.55, color: "#cfd3dc" });
  const vline = (k, x, y1, y2, color, dash, w) => `<line x1="${r1(x)}" y1="${r1(y1)}" x2="${r1(x)}" y2="${r1(y2)}" stroke="${color || "#fff"}" stroke-width="${w || 2}"${dash ? ` stroke-dasharray="${dash}"` : ""}/>`;
  const line = (k, x1, y1, x2, y2, color, w, dash) => `<line x1="${r1(x1)}" y1="${r1(y1)}" x2="${r1(x2)}" y2="${r1(y2)}" stroke="${color || "#fff"}" stroke-width="${w || 2}"${dash ? ` stroke-dasharray="${dash}"` : ""} stroke-linecap="round"/>`;
  const poly = (pts, color, w, dash) => `<polyline points="${pts.map((p) => `${r1(p[0])},${r1(p[1])}`).join(" ")}" fill="none" stroke="${color}" stroke-width="${w || 2}"${dash ? ` stroke-dasharray="${dash}"` : ""} stroke-linejoin="round" stroke-linecap="round"/>`;
  /* A small seconds bar with its label. */
  const secBar = (k, x, y, w, p, color, text) => `<rect x="${x}" y="${y}" width="${w}" height="6" rx="3" fill="#33323d"/><rect x="${x}" y="${y}" width="${r1(Math.max(2, w * k.clamp(p, 0, 1)))}" height="6" rx="3" fill="${color || S.gold}"/>` + (text ? k.label({ x: x + w / 2, y: y - 3, text, size: 8, color: "#aaa" }) : "");
  const floor = (k, y) => `<rect x="0" y="${y}" width="320" height="${120 - y}" fill="${S.floor}"/>`;

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
  const cap = (t) => String(t).charAt(0).toUpperCase() + String(t).slice(1);

  /* ======================= cutOff ======================= */
  /* One speaker's words run along a line until a red cut; the rest hang as ghost words. The other voice starts
     before the cut by the overlap. Dots up top count how often it happens. */
  look("cutOff", (v, k, g) => {
    const late = idx(v, "howLate", 4);
    const by = idx(v, "cutBy", 4);
    const ov = v.n("overlapSec");
    const count = Math.round(v.n("count"));
    const rude = idx(v, "rude", 4);
    const fin = idx(v, "finished", 4);
    const said = [1, 4, 6, 7][late];
    const x0 = 56;
    const cutX = x0 + said * 24 - 2;
    let out = bg(k) + k.person({ x: 30, y: 112, s: 0.75, color: S.blue, mood: -0.1 * rude }) + k.person({ x: 296, y: 112, s: 0.75, color: S.pink, mood: rude > 1 ? -0.4 : 0.2 });
    out += words(k, x0, 40, said, 20, S.gold) + words(k, cutX + 4, 40, 8 - said, 20, S.gold, [0.12, 0.35, 0.55, 0.8][fin], true);
    if (late === 3) out += k.ring({ x: cutX + 16, y: 40, r: 11, color: S.gold, w: 1.2, dash: "2 2" });
    const cutCol = k.mix("#5fae78", "#e4572e", rude / 3);
    out += poly([[cutX, 24], [cutX + 4, 30], [cutX - 3, 36], [cutX + 4, 44], [cutX - 3, 50], [cutX, 56]], cutCol, 3);
    /* the other voice, starting before the cut by the overlap */
    const ox = Math.min(cutX, 196) - ov * 22;
    out += words(k, ox, 70, 3, 18, S.pink, 0.9);
    if (ov > 0) out += `<rect x="${r1(ox)}" y="62" width="${r1(ov * 22)}" height="16" fill="${S.red}" opacity="0.25"/>`;
    out += emo(k, Math.min(cutX, 250), 100, ["🗣️", "💥", "⚡", "📞"][by], 16);
    for (let i = 0; i < count; i++) out += k.dot({ x: 200 + i * 10, y: 12, r: 3, color: cutCol });
    out += k.label({ x: 196, y: 15, text: "cuts", size: 8, color: "#aaa", anchor: "end" });
    out += strip(k, [g.steps("howLate", "Cut at"), g.word("cutBy", "Cut by"), g.num("overlapSec", "Overlap", " s"), g.num("count", "Times", ""), g.steps("rude", "Rude"), g.word("finished", "Finished")]);
    return out + k.caption(`Cut off ${v("howLate")}, by ${v("cutBy")}`);
  });

  /* ======================= throwaway ======================= */
  /* The line floats off the speaker small and faint the lighter it is said, with its true weight hanging under it,
     the task in their hands, and the listener catching it or not. */
  look("throwaway", (v, k, g) => {
    const light = v.n("lightness");
    const wt = idx(v, "weight", 4);
    const busy = idx(v, "busy", 5);
    const eyes = idx(v, "eyes", 4);
    const heard = idx(v, "heard", 4);
    const after = v.n("beatAfter");
    let out = bg(k) + floor(k, 108);
    out += k.person({ x: 70, y: 112, s: 0.9, color: S.blue, look: [0.8, -0.8, 0.2, 0][eyes], lean: busy === 2 ? -8 : 0, eyes: eyes === 3 ? 0.4 : 0.8 });
    out += emo(k, 92, 92, ["", "🍝", "🚪", "🔧", "📱"][busy], 14);
    const size = 22 - light * 3;
    out += `<rect x="96" y="${r1(30 - size / 2)}" width="${r1(70 + size * 2)}" height="${r1(size + 6)}" rx="8" fill="${S.gold}" opacity="${r1((1 - light * 0.13) * 100) / 100}"/>`;
    out += k.label({ x: 131 + size, y: 30 + size * 0.3, text: "the line", size: r1(Math.max(6, (size + 6) * 0.55)), color: S.ink, weight: 700 });
    /* the true weight hanging under it */
    const wh = 6 + wt * 6;
    out += line(k, 131 + size, 34 + size / 2, 131 + size, 56, "#888", 1.5) + `<rect x="${r1(131 + size - wh / 2)}" y="56" width="${r1(wh)}" height="${r1(wh)}" rx="2" fill="${S.red}"/>`;
    out += k.person({ x: 262, y: 112, s: 0.9, color: S.pink, mood: [0, -0.2, -0.5, -0.8][heard], eyes: [0.6, 0.8, 1, 1][heard] });
    out += k.arrow({ x1: 200, y1: 30, x2: 200 + heard * 16, y2: 40, color: heard ? S.gold : "#555", w: 2 });
    if (heard === 0) out += k.label({ x: 250, y: 30, text: "missed", size: 9, color: "#888" });
    out += k.pie({ x: 300, y: 18, r: 10, p: after / 6, color: S.ice }) + k.label({ x: 300, y: 38, text: `${fmt(after)} s quiet`, size: 8, color: "#aaa" });
    out += strip(k, [g.num("lightness", "Lightly", "/5"), g.steps("weight", "Weight"), g.word("busy", "Doing"), g.word("eyes", "Eyes"), g.steps("heard", "Heard"), g.num("beatAfter", "Silence", " s")]);
    return out + k.caption(`A line that ${["matters a little", "matters", "matters a lot", "changes everything"][wt]}, said ${light >= 3 ? "lightly" : "straight"}`);
  });

  /* ======================= buildingSpeech ======================= */
  /* The force of the speech over its length, shaped by how it grows, with the peak marked and the crowd below. */
  look("buildingSpeech", (v, k, g) => {
    const build = v.n("build");
    const len = v.n("length");
    const peak = idx(v, "peak", 4);
    const shape = idx(v, "shape", 4);
    const lis = idx(v, "listeners", 4);
    const reac = idx(v, "reaction", 4);
    const pk = [0.3, 0.55, 0.85, 1][peak];
    const base = 0.5 - build * 0.08;
    const f = (t) => {
      const u = t <= pk ? t / pk : 1 - (t - pk) / Math.max(0.05, 1 - pk);
      const grow = [u, u + 0.12 * Math.sin(u * 14), Math.pow(u, 3), u > 0.9 ? 1 : 0.15 * u][shape];
      return k.clamp(base + (1 - base) * k.clamp(grow, 0, 1) * (build / 5) + (build === 0 ? 0 : 0), 0, 1);
    };
    const w = 120 + (len / 300) * 170;
    const pts = Array.from({ length: 61 }, (_, i) => f(i / 60));
    let out = bg(k) + `<rect x="20" y="14" width="${r1(w)}" height="56" rx="3" fill="${S.lane}"/>` + k.graph({ x: 20, y: 14, w, h: 56, points: pts, color: S.gold });
    out += vline(k, 20 + pk * w, 10, 74, S.red, "3 2", 1.5) + k.label({ x: 20 + pk * w, y: 9, text: "peak", size: 8, color: S.red });
    out += k.label({ x: 20 + w, y: 82, text: `${fmt(len)} s`, size: 8, color: "#aaa", anchor: "end" });
    const n = [1, 4, 10, 22][lis];
    for (let i = 0; i < n; i++) out += k.dot({ x: 40 + (i % 11) * 14, y: 96 + Math.floor(i / 11) * 9, r: 3.5, color: reac === 3 ? S.orange : "#6a6a7a" });
    out += emo(k, 280, 100, ["😐", "🤫", "👏", "🎉"][reac], 20);
    out += strip(k, [g.num("build", "Builds", "/5"), g.num("length", "Length", " s"), g.steps("peak", "Peak"), g.word("shape", "Shape"), g.steps("listeners", "To"), g.steps("reaction", "Lands")]);
    return out + k.caption(`A speech that builds ${fmt(build)}/5, peaking ${v("peak")}`);
  });

  /* ======================= trailingOff ======================= */
  /* Each sentence is a row of words that fades out before the end; the gap is filled by a look, a sigh or the
     other person. */
  look("trailingOff", (v, k, g) => {
    const un = idx(v, "unsaid", 4);
    const why = idx(v, "why", 5);
    const fade = idx(v, "fadeVoice", 3);
    const fill = idx(v, "filler", 5);
    const times = Math.round(v.n("times"));
    const said = 8 - [1, 3, 5, 7][un];
    const fadeN = [0.6, 2, 4][fade];
    const rows = Math.min(times, 4);
    let out = bg(k);
    for (let r = 0; r < rows; r++) {
      const y = 24 + r * 20;
      out += words(k, 30, y, said, 20, S.gold, (i) => (i < said - fadeN ? 1 : Math.max(0.12, 1 - (i - (said - fadeN) + 1) / (fadeN + 1))));
      out += words(k, 30 + said * 24, y, 8 - said, 20, "#555", 0.5, true);
    }
    if (times > 4) out += k.label({ x: 30, y: 108, text: `+${times - 4} more`, size: 9, color: "#aaa", anchor: "start" });
    out += emo(k, 262, 40, ["💔", "🤝", "😬", "👀", "🌫️"][why], 20);
    out += emo(k, 262, 86, ["", "👁️", "✋", "😮‍💨", "💬"][fill], 18) + k.label({ x: 262, y: 104, text: ["nothing", "a look", "a gesture", "a sigh", "they finish it"][fill], size: 8, color: "#aaa" });
    out += strip(k, [g.steps("unsaid", "Unsaid"), g.word("why", "Why"), g.steps("fadeVoice", "Fade"), g.word("filler", "Filled by"), g.num("times", "Times", "")]);
    return out + k.caption(`Trails off: ${v("unsaid")} left unsaid`);
  });

  /* ======================= talkingToSelf ======================= */
  /* One person talking to a mirror, an object or no one, the bubble as big as the voice, ghosts of the people who
     might hear, and a door that opens when they get caught. */
  look("talkingToSelf", (v, k, g) => {
    const loud = idx(v, "loudness", 4);
    const kind = idx(v, "kind", 5);
    const alone = idx(v, "alone", 4);
    const caught = idx(v, "caught", 4);
    const to = idx(v, "toWhat", 5);
    const secs = v.n("seconds");
    let out = bg(k) + floor(k, 106);
    out += k.person({ x: 120, y: 112, s: 0.95, color: S.blue, mood: kind === 1 ? -0.5 : kind === 0 ? 0.5 : 0, look: 0.6 });
    const bw = 30 + loud * 22;
    out += `<rect x="${r1(140)}" y="${r1(30 - loud * 4)}" width="${r1(bw)}" height="${r1(16 + loud * 5)}" rx="9" fill="none" stroke="${S.gold}" stroke-width="${1 + loud}"${loud === 0 ? ` stroke-dasharray="3 3"` : ""}/>`;
    out += emo(k, 150 + bw / 2, 38, ["💪", "😤", "📝", "🧩", "🕯️"][kind], 13);
    out += emo(k, 226, 92, ["", "🪞", "🧸", "🐕", "🖼️"][to], 20);
    /* the people who might hear: faint ghosts that fade as they believe they are more alone */
    const ghost = [0.9, 0.6, 0.3, 0][alone];
    out += k.person({ x: 34, y: 112, s: 0.7, color: "#777", alpha: ghost });
    /* the door, opening when they are caught */
    const open = [0, 0.4, 1, 1][caught];
    out += `<rect x="280" y="40" width="32" height="68" fill="#3a2f25" stroke="${S.ink}"/>` + `<rect x="${r1(280 + open * 4)}" y="40" width="${r1(32 - open * 24)}" height="68" fill="#6b5240" stroke="${S.ink}"/>`;
    if (caught >= 2) out += emo(k, 296, 70, caught === 2 ? "😳" : "💬", 14);
    out += secBar(k, 20, 14, 100, secs / 60, S.gold, `${fmt(secs)} s of talk`);
    out += strip(k, [g.steps("loudness", "Loud"), g.word("kind", "Kind"), g.steps("alone", "Alone"), g.word("caught", "Caught"), g.word("toWhat", "To"), g.num("seconds", "Length", " s")]);
    return out + k.caption(cap(`${v("loudness")}: ${v("kind")}`));
  });

  /* ======================= oneSidedCall ======================= */
  /* The person on the phone and their face, a line out to the other side (faint or blank when hidden), and a
     timeline of their lines with the listening gaps between. */
  look("oneSidedCall", (v, k, g) => {
    const hid = idx(v, "hidden", 3);
    const news = idx(v, "news", 5);
    const pauses = v.n("pauses");
    const fs = v.n("faceShows");
    const others = Math.round(v.n("others"));
    const end = idx(v, "ending", 5);
    const mood = [0.3, 1, -1, -0.8, -0.3][news] * (fs / 5);
    let out = bg(k);
    out += k.face({ x: 60, y: 46, r: 28, mood, eyes: news === 3 ? 1 : 0.8, mouth: fs > 3 && news >= 2 ? 0.5 : 0 });
    out += emo(k, 94, 50, "📞", 16) + emo(k, 60, 8 + 4, ["☕", "🎉", "💔", "⚠️", "🤫"][news], 11);
    out += line(k, 104, 46, 200, 46, end === 3 ? S.red : "#888", 1.5, end === 3 ? "2 6" : "4 3");
    const other = [1, 0.35, 0][hid];
    out += `<rect x="204" y="30" width="80" height="32" rx="6" fill="${S.lane}" stroke="#555"/>` + words(k, 210, 46, 3, 20, S.pink, other);
    if (hid === 2) out += k.label({ x: 244, y: 50, text: "?", size: 14, color: "#888", weight: 700 });
    /* the timeline: their lines with listening gaps between */
    let x = 20;
    for (let i = 0; i < 4 && x < 290; i++) {
      out += `<rect x="${r1(x)}" y="86" width="22" height="8" rx="3" fill="${S.gold}"/>`;
      x += 24 + pauses * 6;
    }
    out += k.label({ x: 300, y: 93, text: ["👋", "📴", "📵", "✂️", "…"][end], size: 12 });
    for (let i = 0; i < others; i++) out += k.dot({ x: 140 + i * 12, y: 108, r: 4, color: "#6a6a7a" });
    out += strip(k, [g.steps("hidden", "Hidden"), g.word("news", "News"), g.num("pauses", "Pauses", " s"), g.num("faceShows", "Face", "/5"), g.num("others", "Watching", ""), g.word("ending", "Ends")]);
    return out + k.caption(`A call with ${v("news")}: we hear ${v("hidden")}`);
  });

  /* ======================= backTurned ======================= */
  /* From above: the speaker turns away from the other person by the angle; the camera at the bottom sees, or does
     not see, the face. A little timeline shows when the turn comes. */
  look("backTurned", (v, k, g) => {
    const ang = v.n("turnedAway");
    const when = idx(v, "when", 3);
    const why = idx(v, "why", 5);
    const seen = idx(v, "faceSeen", 3);
    const back = idx(v, "turnBack", 4);
    const hold = v.n("hold");
    let out = bg(k) + `<rect x="60" y="10" width="200" height="90" rx="6" fill="${S.floor}"/>`;
    out += topP(k, 220, 50, 180, S.pink) + topP(k, 130, 50, ang, S.blue, 10);
    out += k.ring({ x: 130, y: 50, r: 22, color: "#555", w: 1, dash: "2 3" });
    if (back > 0) out += k.arrow({ x1: 130 + Math.cos((ang * Math.PI) / 180) * 26, y1: 50 + Math.sin((ang * Math.PI) / 180) * 26, x2: 156, y2: 50 - back * 3, color: S.green, w: 1.5 });
    out += emo(k, 130, 26, ["😞", "😠", "😢", "🙄", "🤔"][why], 13);
    const fa = (ang * Math.PI) / 180;
    out += seen === 2 ? topCam(k, 130 + Math.cos(fa) * 44, 50 + Math.sin(fa) * 44, (ang + 180) % 360) : topCam(k, [130, 250][seen], 104, -90);
    out += k.label({ x: 290, y: 30, text: ["no one", "they see", "only us"][seen], size: 8, color: "#aaa" });
    /* timeline: the line, and the turn before, on or after it */
    out += `<rect x="16" y="20" width="36" height="6" rx="3" fill="${S.gold}"/>` + k.dot({ x: [12, 34, 56][when], y: 34, r: 3.5, color: S.blue });
    out += secBar(k, 16, 80, 36, hold / 20, S.blue, `${fmt(hold)} s`);
    out += strip(k, [g.num("turnedAway", "Turned", "°"), g.steps("when", "When"), g.word("why", "Why"), g.word("faceSeen", "Face seen by"), g.word("turnBack", "Turns back"), g.num("hold", "Held", " s")]);
    return out + k.caption(`Turned ${fmt(ang)}° away, ${v("when")}`);
  });

  /* ======================= ownHabit ======================= */
  /* The person with their habit glowing at the hands, ticks for each time it shows, and who catches it. */
  look("ownHabit", (v, k, g) => {
    const show = v.n("showing");
    const habit = idx(v, "habit", 6);
    const trig = idx(v, "triggeredBy", 5);
    const times = Math.round(v.n("times"));
    const noticed = idx(v, "noticed", 4);
    const stops = idx(v, "stops", 4);
    let out = bg(k) + floor(k, 106);
    out += k.person({ x: 110, y: 112, s: 1, color: S.blue, mood: trig === 4 ? -0.4 : 0, arms: 0.3 });
    out += k.ring({ x: 128, y: 70, r: 6 + show * 3, color: S.gold, w: 1 + show * 0.4 }) + emo(k, 128, 75, ["💍", "💇", "👆", "😮‍💨", "⚡", "😬"][habit], 14);
    out += emo(k, 110, 18, ["😰", "🤥", "🥱", "🤔", "😔"][trig], 14);
    for (let i = 0; i < times; i++) out += `<rect x="${r1(170 + (i % 6) * 9)}" y="${r1(18 + Math.floor(i / 6) * 12)}" width="5" height="9" rx="1" fill="${S.gold}"/>`;
    /* who notices: an eye for us, a second person for a character, and a copy of the habit */
    if (noticed >= 1) out += emo(k, 300, 20, "👁️", 14);
    if (noticed >= 2) out += k.person({ x: 250, y: 112, s: 0.8, color: S.pink, look: -0.7 });
    if (noticed === 3) out += k.ring({ x: 264, y: 76, r: 8, color: S.gold, w: 1.2 });
    out += k.label({ x: 200, y: 100, text: ["never stops", "stops when calm", "stops when told", "stops at the end"][stops], size: 8, color: stops ? S.green : "#aaa" });
    out += strip(k, [g.num("showing", "Shows", "/5"), g.word("habit", "Habit"), g.word("triggeredBy", "Set off by"), g.num("times", "Times", ""), g.steps("noticed", "Noticed"), g.word("stops", "Stops")]);
    return out + k.caption(`${cap(v("habit"))} when ${v("triggeredBy") === "nerves" ? "nervous" : v("triggeredBy")}`);
  });

  /* ======================= mirroring ======================= */
  /* Two people facing each other, leaning alike as much as they match; under them, two rows of moves where the
     copy comes later by the lag. */
  look("mirroring", (v, k, g) => {
    const m = v.n("match");
    const leader = idx(v, "leader", 3);
    const lag = v.n("lag");
    const what = idx(v, "what", 5);
    const aware = idx(v, "aware", 4);
    const brk = idx(v, "breaks", 4);
    const lean = 12;
    let out = bg(k) + floor(k, 84);
    out += k.person({ x: 110, y: 82, s: 0.8, color: S.blue, lean, arms: what === 1 ? 0.2 : 0, look: 0.8 });
    out += k.person({ x: 210, y: 82, s: 0.8, color: S.pink, lean: -lean * (m / 5) + 10 * (1 - m / 5), arms: what === 1 && m > 2 ? 0.2 : -0.4, look: -0.8 });
    out += emo(k, 160, 18, ["↗️", "🙅", "🥤", "👋", "🗣️"][what], 14);
    if (leader === 0) out += k.arrow({ x1: 130, y1: 30, x2: 190, y2: 30, color: S.gold, w: 1.5 });
    if (leader === 1) out += k.arrow({ x1: 130, y1: 26, x2: 190, y2: 26, color: S.gold, w: 1.5 }) + k.arrow({ x1: 190, y1: 34, x2: 130, y2: 34, color: S.gold, w: 1.5 });
    if (leader === 2) out += vline(k, 160, 24, 38, S.gold, "", 2);
    out += emo(k, 290, 22, ["", "💡", "💡💡", "🎭"][aware], 12);
    /* the moves timeline: the copy row shifted by the lag */
    for (let i = 0; i < 4; i++) {
      const x = 20 + i * 70;
      out += `<rect x="${x}" y="94" width="24" height="7" rx="2" fill="${S.blue}"/>`;
      const fadeOut = brk === 1 ? 1 - i * 0.25 : brk === 2 && i === 3 ? 0 : 1;
      out += `<rect x="${r1(x + lag * 8)}" y="106" width="24" height="7" rx="2" fill="${S.pink}" opacity="${r1(fadeOut * (0.3 + 0.14 * m) * 100) / 100}"/>`;
    }
    if (brk === 3) out += emo(k, 300, 104, "😂", 12);
    out += strip(k, [g.num("match", "Match", "/5"), g.word("leader", "Leads"), g.num("lag", "Lag", " s"), g.word("what", "Copied"), g.word("aware", "Aware"), g.word("breaks", "Ends")]);
    return out + k.caption(`Copying each other ${fmt(m)}/5, ${fmt(lag)} s behind`);
  });

  /* ======================= wordlessAnswer ======================= */
  /* A question in a bubble, and the answer as a highlighted part of the other person's body, with motion marks as big
     as the answer and a pause clock before it. */
  look("wordlessAnswer", (v, k, g) => {
    const size = idx(v, "bodySize", 4);
    const ans = idx(v, "answer", 5);
    const delay = v.n("delay");
    const clear = idx(v, "clear", 3);
    const asker = idx(v, "asker", 4);
    const part = idx(v, "part", 5);
    const px = 210 + (size === 3 ? 50 : 0);
    let out = bg(k) + floor(k, 106);
    out += k.person({ x: 80, y: 112, s: 0.9, color: S.pink, look: 0.8, mood: [0, -0.4, 0.4, -0.6][asker] });
    out += `<rect x="70" y="14" width="40" height="18" rx="8" fill="${S.paper}"/>` + k.label({ x: 90, y: 27, text: "?", size: 12, color: S.ink, weight: 700 });
    out += k.person({ x: px, y: 112, s: 0.9, color: S.blue, look: size === 3 ? 1 : -0.6, walk: size === 3 ? 1 : 0 });
    /* the part that answers: eyes, head, shoulders, hands, feet */
    const py = [36, 34, 52, 70, 108][part];
    out += k.ring({ x: px + (part === 3 ? 14 : 0), y: py, r: 6 + size * 2, color: S.gold, w: 1.6 });
    for (let i = 0; i < size; i++) out += line(k, px + 18 + i * 6, py - 6, px + 18 + i * 6, py + 6, S.gold, 1.2);
    out += emo(k, px, 14, ["👍", "👎", "🤷", "❓", "🤐"][ans], 14).replace("<text", `<text opacity="${[0.35, 0.7, 1][clear]}"`);
    out += k.pie({ x: 160, y: 30, r: 10, p: delay / 8, color: S.ice }) + k.label({ x: 160, y: 52, text: `${fmt(delay)} s`, size: 8, color: "#aaa" });
    out += emo(k, 40, 30, ["🙈", "❌", "✅", "🗣️"][asker], 12);
    out += strip(k, [g.steps("bodySize", "Size"), g.word("answer", "Means"), g.num("delay", "Pause", " s"), g.steps("clear", "Clear"), g.word("asker", "Asker"), g.word("part", "Part")]);
    return out + k.caption(`Answers "${v("answer")}" with ${v("part")}`);
  });

  /* ======================= pacing ======================= */
  /* From above: the laps drawn as a zig-zag in a small room, as long as each lap, in the pacing color, with the
     thing that stops them at the end. */
  look("pacing", (v, k, g) => {
    const sp = idx(v, "paceSpeed", 4);
    const lapM = v.n("lapLength");
    const laps = Math.round(v.n("laps"));
    const why = idx(v, "why", 5);
    const stop = idx(v, "stopsOn", 5);
    const oth = idx(v, "others", 4);
    const len = 20 + lapM * 18;
    const col = k.mix("#5fae78", "#e4572e", sp / 3);
    let out = bg(k) + `<rect x="16" y="8" width="230" height="104" rx="4" fill="${S.floor}"/>`;
    const pts = [];
    for (let i = 0; i <= laps; i++) pts.push([36 + (i % 2 ? len : 0), 20 + (i * 84) / Math.max(1, laps)]);
    out += poly(pts, col, 1 + sp * 0.7, sp === 3 ? "" : "4 3");
    const last = pts[pts.length - 1];
    out += topP(k, last[0], last[1], laps % 2 ? 0 : 180, S.blue, 7);
    out += emo(k, 280, 30, ["😟", "😠", "⏳", "🤔", "📝"][why], 18);
    out += emo(k, 280, 70, ["…", "💡", "🔔", "🚪", "🪑"][stop], 16);
    if (oth > 0) out += topP(k, 226, 100, oth === 2 ? 180 : 200, S.pink, 7);
    if (oth === 3) out += poly([[200, 96], [226, 96]], S.pink, 2, "3 2");
    out += strip(k, [g.steps("paceSpeed", "Speed"), g.num("lapLength", "Lap", " m"), g.num("laps", "Laps", ""), g.word("why", "Why"), g.word("stopsOn", "Stops on"), g.word("others", "Others")]);
    return out + k.caption(`Pacing ${v("paceSpeed")}, ${fmt(laps)} laps of ${fmt(lapM)} m`);
  });

  /* ======================= bigEntrance ======================= */
  /* A door in the middle with the newcomer in it, glowing with the size of the entrance; heads in the room turn
     toward them; a clock for the wait and a bar for the pause in the doorway. */
  look("bigEntrance", (v, k, g) => {
    const size = v.n("entranceSize");
    const heads = idx(v, "heads", 4);
    const first = idx(v, "firstSeen", 5);
    const wait = v.n("wait");
    const pause = v.n("doorPause");
    const room = idx(v, "roomChange", 4);
    let out = bg(k) + floor(k, 100);
    out += `<rect x="140" y="26" width="40" height="74" fill="#0c0c10" stroke="#6b5240" stroke-width="3"/>`;
    out += k.ring({ x: 160, y: 62, r: 8 + size * 6, color: S.gold, w: 1 + size * 0.3 });
    out += k.person({ x: 160, y: 100, s: 0.8, color: first === 3 ? "#111" : S.blue, alpha: first === 0 ? 1 : 0.55 });
    out += emo(k, 160, 18, ["🧍", "👞", "🔙", "👤", "✋"][first], 12);
    const n = 6;
    const turned = [0, 1, 3, 6][heads];
    for (let i = 0; i < n; i++) {
      const x = i < 3 ? 30 + i * 32 : 210 + (i - 3) * 32;
      out += k.person({ x, y: 116, s: 0.55, color: "#6a6a7a", look: i < turned ? (x < 160 ? 1 : -1) : x < 160 ? -1 : 1 });
    }
    out += k.pie({ x: 24, y: 22, r: 10, p: wait / 30, color: S.ice }) + k.label({ x: 24, y: 44, text: `${fmt(wait)} s wait`, size: 8, color: "#aaa" });
    out += secBar(k, 250, 18, 56, pause / 5, S.gold, `${fmt(pause)} s in door`);
    out += emo(k, 290, 50, ["🗣️", "🤫", "⏸️", "🎵"][room], 14);
    out += strip(k, [g.num("entranceSize", "Size", "/5"), g.steps("heads", "Heads turn"), g.word("firstSeen", "First seen"), g.num("wait", "Wait", " s"), g.num("doorPause", "Door pause", " s"), g.word("roomChange", "Room")]);
    return out + k.caption(`An entrance of ${fmt(size)}/5: ${v("heads")} turn`);
  });

  /* ======================= walkOut ======================= */
  /* A room with a door on the right: footprints out as final as the exit, the door as hard as it is shut, a bubble
     for the last word, and the camera on whoever we stay with. */
  look("walkOut", (v, k, g) => {
    const fin = idx(v, "finality", 3);
    const last = idx(v, "lastWord", 4);
    const atDoor = idx(v, "atDoor", 4);
    const door = idx(v, "door", 4);
    const stay = idx(v, "stayWith", 3);
    const hold = v.n("holdAfter");
    let out = bg(k) + floor(k, 100);
    out += k.person({ x: 70, y: 106, s: 0.8, color: S.pink, mood: -0.3, look: 0.8 });
    const px = [200, 240, 262][fin];
    out += k.person({ x: px, y: 106, s: 0.8, color: S.blue, walk: 0.8, look: atDoor >= 2 ? -0.8 : 0.8 });
    for (let i = 0; i < 2 + fin * 2; i++) out += k.dot({ x: 110 + i * 22, y: 112, r: 2, color: "#777" });
    /* the door: none, open, closed, slammed */
    if (door > 0) out += `<rect x="276" y="30" width="34" height="70" fill="${door === 1 ? "#0c0c10" : "#6b5240"}" stroke="${S.ink}" stroke-width="2"/>`;
    if (door === 3) out += [0, 1, 2].map((i) => line(k, 268 - i * 4, 40 + i * 20, 262 - i * 4, 44 + i * 20, S.red, 2)).join("");
    if (atDoor === 1) out += k.label({ x: 262, y: 26, text: "beat", size: 8, color: "#aaa" });
    if (atDoor >= 2) out += k.arrow({ x1: px - 4, y1: 30, x2: px - 30, y2: 30, color: S.gold, w: 1.5 });
    if (atDoor === 3) out += k.label({ x: px - 40, y: 22, text: "back in", size: 8, color: S.gold });
    if (last === 1 || last === 3) out += `<rect x="${px - 16}" y="10" width="32" height="12" rx="5" fill="${S.gold}"/>`;
    if (last === 2 || last === 3) out += `<rect x="54" y="10" width="32" height="12" rx="5" fill="${S.gold}"/>`;
    out += k.cam({ x: [px, 70, 292][stay], y: 112 - 0, dir: -90, s: 0.5 });
    out += secBar(k, 110, 28, 80, hold / 15, S.ice, `${fmt(hold)} s after`);
    out += strip(k, [g.steps("finality", "Final"), g.word("lastWord", "Last word"), g.word("atDoor", "At the door"), g.steps("door", "Door"), g.word("stayWith", "Stay with"), g.num("holdAfter", "Hold", " s")]);
    return out + k.caption(`Walks out: ${v("finality")}, door ${v("door")}`);
  });

  /* ======================= faceOff ======================= */
  /* Two people from the side, as close as they end up, one taller by the height gap, footprints for the steps,
     shiver marks when they cannot hold still, and an arrow for whoever backs down. */
  look("faceOff", (v, k, g) => {
    const close = idx(v, "closeness", 4);
    const steps = Math.round(v.n("steps"));
    const who = idx(v, "whoSteps", 3);
    const hold = v.n("hold");
    const bd = idx(v, "backsDown", 4);
    const ht = idx(v, "height", 3);
    const gap = [200, 120, 60, 26][close];
    const ax = 160 - gap / 2;
    const bx = 160 + gap / 2;
    let out = bg(k) + floor(k, 104);
    out += k.person({ x: ax, y: 108, s: 0.85, color: S.blue, look: 1, mood: -0.5 }) + k.person({ x: bx, y: 108, s: 0.85 + ht * 0.15, color: S.pink, look: -1, mood: -0.5 });
    for (let i = 0; i < steps; i++) {
      const side = who === 0 ? 0 : who === 1 ? i % 2 : i % 2;
      const x = side ? bx + 8 + Math.floor(i / 2) * 9 : ax - 8 - (who === 0 ? i : Math.floor(i / 2)) * 9;
      out += k.dot({ x, y: 114, r: 2, color: "#888" });
    }
    if (who === 2) out += k.arrow({ x1: ax - 30, y1: 20, x2: ax - 8, y2: 20, color: S.gold, w: 1.5 }) + k.arrow({ x1: bx + 30, y1: 20, x2: bx + 8, y2: 20, color: S.gold, w: 1.5 });
    else out += k.arrow({ x1: ax - 30, y1: 20, x2: ax - 8, y2: 20, color: S.gold, w: 1.5 });
    for (let i = 0; i < 5 - hold; i++) out += line(k, ax - 16 - i * 3, 50, ax - 16 - i * 3, 58, "#aaa", 1);
    if (bd === 1) out += k.arrow({ x1: ax, y1: 36, x2: ax - 30, y2: 36, color: S.red, w: 2 });
    if (bd === 2) out += k.arrow({ x1: bx, y1: 36, x2: bx + 30, y2: 36, color: S.red, w: 2 });
    if (bd === 3) out += k.person({ x: 160, y: 108, s: 0.6, color: S.green });
    out += strip(k, [g.steps("closeness", "Ends"), g.num("steps", "Steps", ""), g.word("whoSteps", "Who steps"), g.num("hold", "Hold", "/5"), g.word("backsDown", "Backs down"), g.steps("height", "Height")]);
    return out + k.caption(`Squaring off, ending ${v("closeness")}`);
  });

  /* ======================= standSit ======================= */
  /* A table with a person sinking down or springing up, motion marks as quick as the move, a line marker for when
     it comes, and others following. */
  look("standSit", (v, k, g) => {
    const dir = idx(v, "direction", 5);
    const tim = idx(v, "timing", 3);
    const sp = idx(v, "speed", 3);
    const mean = idx(v, "meaning", 5);
    const fol = idx(v, "follow", 3);
    const gapH = v.n("heightGap");
    const yy = [120, 114, 108, 104, 98][dir];
    let out = bg(k) + floor(k, 104) + `<rect x="120" y="80" width="90" height="8" fill="#6b5240"/>`;
    out += `<rect x="70" y="84" width="22" height="20" fill="#4a3a2c"/>`;
    out += k.person({ x: 80, y: yy, s: 0.8, color: S.blue, arms: dir === 4 ? 0.6 : 0 });
    for (let i = 0; i < sp + 1; i++) out += line(k, 56 - i * 5, 50, 56 - i * 5, 64, S.gold, 1.2);
    out += k.arrow({ x1: 100, y1: 60, x2: 100, y2: 60 + (2 - dir) * 8 + (dir === 2 ? 1 : 0), color: S.gold, w: 2 });
    const others = [0, 1, 3][fol];
    for (let i = 0; i < 3; i++) out += k.person({ x: 230 + i * 28, y: i < others ? 100 : 116, s: 0.6, color: "#6a6a7a" });
    out += emo(k, 165, 30, ["👑", "🏳️", "🛋️", "🚪", "🙇"][mean], 16);
    out += `<rect x="130" y="56" width="40" height="6" rx="3" fill="${S.gold}"/>` + k.dot({ x: [124, 150, 176][tim], y: 70, r: 3.5, color: S.blue });
    out += line(k, 300, 24, 300, 24 + gapH * 12, S.ice, 3) + k.label({ x: 300, y: 18, text: "gap", size: 8, color: "#aaa" });
    out += strip(k, [g.steps("direction", "Which way"), g.steps("timing", "When"), g.steps("speed", "Speed"), g.word("meaning", "Means"), g.steps("follow", "Others"), g.num("heightGap", "Gap", "/5")]);
    return out + k.caption(cap(`${v("direction")} ${v("timing")}`));
  });

  /* ======================= pushInFace ======================= */
  /* Nested frames from the starting framing to the ending one around a face, with the push arrow, a row of dots as
     slow or quick as the move, and what the face is doing. */
  look("pushInFace", (v, k, g) => {
    const amt = v.n("pushAmount");
    const sp = idx(v, "speed", 4);
    const st = idx(v, "startSize", 4);
    const en = idx(v, "endSize", 3);
    const secs = v.n("seconds");
    const dur = idx(v, "during", 4);
    const size = (i) => [110, 80, 58, 40, 24][i];
    const sw = size(st);
    const ew = size(Math.max(st, en + 2)) * (1 - amt * 0.04) + size(en + 2) * amt * 0.04;
    let out = bg(k) + k.face({ x: 110, y: 60, r: 18, mood: dur === 2 ? -0.2 : 0, mouth: dur === 1 ? 0.4 : 0, eyes: dur === 2 ? 1 : 0.8 });
    out += k.frame({ x: 110 - sw * 0.8, y: 60 - sw / 2, w: sw * 1.6, h: sw, color: "#888", dash: "4 3" });
    out += k.frame({ x: 110 - ew * 0.8, y: 60 - ew / 2, w: ew * 1.6, h: ew, color: S.gold });
    out += k.arrow({ x1: 260, y1: 60, x2: 260 - amt * 14, y2: 60, color: S.gold, w: 2.5 }) + k.cam({ x: 280, y: 60, dir: 180, s: 0.7 });
    const n = [10, 7, 5, 3][sp];
    for (let i = 0; i < n; i++) out += k.dot({ x: 200 + i * (60 / n), y: 90, r: 2, color: S.ice });
    out += secBar(k, 200, 104, 90, secs / 40, S.gold, `${fmt(secs)} s`);
    out += emo(k, 300, 24, ["👂", "🗣️", "💡", "🤐"][dur], 14);
    out += strip(k, [g.num("pushAmount", "Push", "/5"), g.steps("speed", "Speed"), g.steps("startSize", "From"), g.steps("endSize", "To"), g.num("seconds", "Length", " s"), g.word("during", "While")]);
    return out + k.caption(`Pushing in ${fmt(amt)}/5 while they ${v("during")}`);
  });

  /* ======================= circlingCamera ======================= */
  /* From above: the people in the middle, the camera's arc as far around as the sweep, as near as the distance,
     with arrows for which way and how fast. */
  look("circlingCamera", (v, k, g) => {
    const sweep = v.n("sweep");
    const sp = idx(v, "speed", 4);
    const mid = idx(v, "inMiddle", 3);
    const mom = idx(v, "moment", 5);
    const dist = idx(v, "distance", 3);
    const way = idx(v, "way", 3);
    const cx = 130;
    const cy = 60;
    const R = [52, 44, 34][dist];
    let out = bg(k);
    const ppl = [[[0, 0]], [[-7, 0], [7, 0]], [[-9, -6], [9, -6], [0, 9]]][mid];
    ppl.forEach(([dx, dy], i) => (out += topP(k, cx + dx, cy + dy, mid === 1 ? (i ? 180 : 0) : 90, i ? S.pink : S.blue, 6)));
    const sgn = way === 1 ? -1 : 1;
    const pts = Array.from({ length: 41 }, (_, i) => {
      const a = (90 + sgn * sweep * (i / 40)) * (Math.PI / 180);
      return [cx + Math.cos(a) * R, cy + Math.sin(a) * R];
    });
    out += poly(pts, S.grey, 1 + sp * 0.6, sp === 0 ? "2 4" : "");
    const endA = (90 + sgn * sweep) * (Math.PI / 180);
    out += topCam(k, cx + Math.cos(endA) * R, cy + Math.sin(endA) * R, (90 + sgn * sweep + 180) % 360);
    if (way === 2) out += k.arrow({ x1: pts[10][0], y1: pts[10][1], x2: pts[4][0], y2: pts[4][1], color: S.gold, w: 1.5 });
    out += emo(k, 260, 40, ["💋", "🥊", "🤗", "💃", "🙊"][mom], 22);
    out += k.label({ x: 260, y: 80, text: `${fmt(sweep)}°`, size: 14, color: S.gold, weight: 700 });
    out += strip(k, [g.num("sweep", "Around", "°"), g.steps("speed", "Speed"), g.word("inMiddle", "Middle"), g.word("moment", "Moment"), g.steps("distance", "Distance"), g.word("way", "Way")]);
    return out + k.caption(`Circling ${fmt(sweep)}° around ${v("inMiddle")}`);
  });

  /* ======================= panReveal ======================= */
  /* A wide strip of the place: the frame starts on the left and turns to the thing revealed; the wider the turn,
     the further it travels; a whip leaves blur lines. */
  look("panReveal", (v, k, g) => {
    const sur = v.n("surprise");
    const sp = idx(v, "turnSpeed", 4);
    const rev = idx(v, "revealed", 5);
    const ang = v.n("angle");
    const knows = idx(v, "knows", 3);
    const hold = v.n("holdOn");
    const span = 60 + (ang / 180) * 200;
    let out = bg(k) + `<rect x="10" y="20" width="300" height="60" fill="#22303a"/>`;
    out += k.frame({ x: 14, y: 24, w: 70, h: 52, color: "#888", dash: "4 3" });
    out += k.person({ x: 48, y: 74, s: 0.55, color: S.blue, look: knows === 1 ? 0 : 0.8 });
    if (knows !== 1) out += k.label({ x: 48, y: 30, text: knows === 0 ? "?" : "??", size: 10, color: S.gold, weight: 700 });
    const fx = Math.min(236, 14 + span);
    out += k.frame({ x: fx, y: 24, w: 70, h: 52, color: S.gold });
    out += emo(k, fx + 35, 58, ["🧍", "🏚️", "🏔️", "❔", "⚠️"][rev], 20);
    out += k.arrow({ x1: 86, y1: 92, x2: fx - 4, y2: 92, color: S.gold, w: 2 });
    for (let i = 0; i < sp * 2; i++) out += line(k, 100 + i * 14, 40 + (i % 3) * 10, 112 + i * 14, 40 + (i % 3) * 10, "#bbb", 1);
    for (let i = 0; i < Math.round(sur); i++) out += k.label({ x: fx + 8 + i * 12, y: 16, text: "!", size: 12, color: S.red, weight: 700 });
    out += secBar(k, 20, 106, 120, hold / 10, S.gold, "");
    out += k.label({ x: 146, y: 112, text: `held ${fmt(hold)} s`, size: 8, color: "#aaa", anchor: "start" });
    out += strip(k, [g.num("surprise", "Surprise", "/5"), g.steps("turnSpeed", "Turn"), g.word("revealed", "Reveals"), g.num("angle", "Angle", "°"), g.word("knows", "Knows"), g.num("holdOn", "Hold", " s")]);
    return out + k.caption(`Turns ${fmt(ang)}° to reveal ${v("revealed")}`);
  });

  /* ======================= wanderingCamera ======================= */
  /* From above: two people talking at a table, and the camera's dashed path drifting away to something else, as far
     as its independence; sound rings show how much of the talk we still hear. */
  look("wanderingCamera", (v, k, g) => {
    const ind = v.n("independence");
    const to = idx(v, "driftTo", 5);
    const sp = idx(v, "speed", 3);
    const hear = idx(v, "stillHear", 3);
    const ret = idx(v, "returns", 3);
    const mean = idx(v, "meaning", 4);
    let out = bg(k) + `<rect x="10" y="10" width="300" height="100" rx="4" fill="${S.floor}"/>`;
    out += `<rect x="46" y="48" width="30" height="24" rx="4" fill="#6b5240"/>` + topP(k, 38, 60, 0, S.blue, 7) + topP(k, 84, 60, 180, S.pink, 7);
    for (let i = 0; i < hear + 1; i++) out += k.ring({ x: 61, y: 60, r: 18 + i * 8, color: S.ice, w: 1 });
    const tx = 100 + ind * 36;
    const ty = 60 - ind * 6;
    out += poly([[61, 96], [80, 90], [tx - 20, ty + 26], [tx, ty + 18]], S.grey, 1 + sp, "4 3");
    out += topCam(k, tx, ty + 18, -90);
    out += emo(k, tx, ty, ["🔪", "🪟", "🚪", "🧍", "🌫️"][to], 16);
    if (ret > 0) out += k.arrow({ x1: tx - 10, y1: ty + 30, x2: 90 - ret * 6, y2: 84, color: S.green, w: 1.5 });
    out += k.label({ x: 300, y: 104, text: ["…", "a feeling", "a clue", "a warning"][mean], size: 9, color: [ "#aaa", S.purple, S.gold, S.red][mean], anchor: "end", weight: 700 });
    out += strip(k, [g.num("independence", "Own way", "/5"), g.word("driftTo", "Drifts to"), g.steps("speed", "Speed"), g.steps("stillHear", "We hear"), g.word("returns", "Returns"), g.steps("meaning", "Means")]);
    return out + k.caption(`The camera drifts to ${v("driftTo")}`);
  });

  /* ======================= dollyZoom ======================= */
  /* A person who stays the same size while the room's lines bend: rushing in narrows the walls, stretching away
     spreads them, as much as the warp. */
  look("dollyZoom", (v, k, g) => {
    const warp = v.n("warp");
    const way = idx(v, "way", 2);
    const secs = v.n("seconds");
    const on = idx(v, "on", 5);
    const size = idx(v, "size", 3);
    const snd = idx(v, "sound", 4);
    const cx = 160;
    const cy = 56;
    const vp = way === 0 ? 1 + warp * 0.15 : 1 - warp * 0.12;
    let out = bg(k) + `<rect x="0" y="0" width="320" height="120" fill="#1d2230"/>`;
    /* the room's lines toward a vanishing point; the box at the back grows or shrinks with the warp */
    const bw = 60 * vp;
    const bh = 40 * vp;
    [[0, 0], [320, 0], [0, 120], [320, 120]].forEach(([x, y]) => (out += line(k, x, y, cx + (x ? bw : -bw), cy + (y ? bh : -bh), "#566", 1.5)));
    out += `<rect x="${r1(cx - bw)}" y="${r1(cy - bh)}" width="${r1(bw * 2)}" height="${r1(bh * 2)}" fill="none" stroke="#7a8a9a" stroke-width="1.5"/>`;
    const s = [0.8, 1.3, 2][size];
    out += k.person({ x: cx, y: [114, 140, 180][size], s, color: S.blue, mood: on === 3 ? 0.6 : -0.5, eyes: 1 });
    for (let i = 0; i < 2; i++) out += k.arrow({ x1: i ? 300 : 20, y1: 20, x2: i ? 300 - (way ? -1 : 1) * 14 * (warp / 5 + 0.3) : 20 + (way ? -1 : 1) * 14 * (warp / 5 + 0.3), y2: 20, color: S.gold, w: 2 });
    out += emo(k, 30, 100, ["😱", "💡", "😨", "😍", "🏢"][on], 16);
    out += emo(k, 290, 100, ["🔈", "🔇", "〰️", "💓"][snd], 14);
    out += secBar(k, 120, 6, 80, secs / 8, S.gold, "");
    out += strip(k, [g.num("warp", "Bend", "/5"), g.word("way", "Background"), g.num("seconds", "Length", " s"), g.word("on", "On"), g.steps("size", "Person"), g.word("sound", "Sound")]);
    return out + k.caption(`The room ${v("way")} on ${v("on")}`);
  });
})(typeof window !== "undefined" ? window.CuriosityWindows : require("./windows.js"));
