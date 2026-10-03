/* engine/analyze.js: pull curiosities out of a reference work, so you can carry one from a film, script or
   comic you love into your own (Jeremy's words #4: the film is the light, the app is the prism). Part of the
   engine core (no page).

   Only values are kept. The text you paste is read once and dropped: a reference holds row labels like
   "Scene 3 (exterior, night)" and one value per row for each curiosity, never lines, names or descriptions
   (the app's rule for studies: counts and ids only).

   window.CurioAnalyze
   - script(text, name?) -> a reference from a screenplay. Rows are its scenes (a heading starts with INT.,
     EXT., INT/EXT or I/E), or, when it has fewer than three, its beats (two speeches each). Per row:
       intExt, timeOfDay           from the scene heading
       wordsAmount, movementAmount how much is said and how much is done (0 to 5, against the busiest row)
       volume                      loudness of the lines: ! marks, words in capitals, (shouting), (whispers)
       emotion, emotionIntensity   from a small word list of feelings, and how charged the punctuation is
       peopleCount                 how many people speak
       cutRate, angleCount         how often the speaker changes, and how many speakers to cover
   - shotList(text, name?) -> a reference from a shot list (CSV or tab separated, one shot per line). Columns
     are found by their headings: size, angle, move or movement, rig or support, duration or length (seconds),
     lens. Per row: shotSize, angleHeight, cameraMove, cameraCarry, lensLength, cutRate (from duration).
   - scenes(list) -> one reference from the app's reference scenes (SCENES), one row per line of dialogue.
   - detect(text) -> "script" or "shotList".
   Each returns { name, kind, rows, lanes: { curiosityId: [value per row] }, notes } for the engine's addRef. */
(function () {
  const root = typeof window !== "undefined" ? window : globalThis;
  const S = () => root.CurioScale;

  const FEELINGS = {
    joyful: ["laugh", "laughs", "laughing", "smile", "smiles", "grin", "grins", "happy", "delighted", "joy", "cheer", "cheers", "glad", "yay"],
    loving: ["love", "loves", "hug", "hugs", "kiss", "kisses", "tender", "gently", "darling", "sweetheart", "holds hands", "embrace"],
    curious: ["wonder", "wonders", "curious", "why", "what if", "studies", "peers", "examines", "notices", "huh"],
    melancholy: ["sad", "sigh", "sighs", "alone", "quiet", "tears", "cries", "crying", "miss", "lonely", "grief", "empty", "sorry"],
    anxious: ["nervous", "worried", "hesitates", "fidgets", "glances", "waits", "late", "hurry", "sweat", "sweats", "paces"],
    fearful: ["afraid", "scared", "fear", "terrified", "screams", "hides", "dark", "trembles", "run", "runs", "gasps"],
    angry: ["angry", "furious", "shouts", "yells", "slams", "punches", "hate", "damn", "rage", "glares", "storms"],
    triumphant: ["wins", "won", "victory", "finally", "yes!", "champion", "raises", "triumph", "proud"],
    absurd: ["absurd", "ridiculous", "somehow", "inexplicably", "a duck", "a chicken", "banana", "pratfall", "trips"],
    dreamlike: ["dream", "dreams", "float", "floats", "drift", "drifts", "haze", "slow motion", "unreal", "echo", "fades"],
  };
  const words = (s) => (String(s).toLowerCase().match(/[a-z'!]+(?: [a-z]+)?/g) || []);
  function feeling(text) {
    const lower = " " + String(text).toLowerCase().replace(/[^a-z!' ]+/g, " ") + " ";
    let best = null;
    let top = 0;
    Object.keys(FEELINGS).forEach((f) => {
      let n = 0;
      FEELINGS[f].forEach((w) => {
        let i = lower.indexOf(" " + w + " ");
        while (i >= 0) {
          n++;
          i = lower.indexOf(" " + w + " ", i + 1);
        }
      });
      if (n > top) {
        top = n;
        best = f;
      }
    });
    return best;
  }
  function loudness(lines) {
    if (!lines.length) return null;
    let score = 0;
    lines.forEach((l) => {
      score += (l.text.match(/!/g) || []).length * 0.6;
      score += (l.text.match(/\b[A-Z]{3,}\b/g) || []).length * 0.5;
      if (/\((shout|yell|scream|loud)/i.test(l.paren || "")) score += 2;
      if (/\((whisper|quiet|soft|under (his|her|their) breath)/i.test(l.paren || "")) score -= 2;
    });
    return Math.max(1, Math.min(5, Math.round(3 + score / lines.length)));
  }
  function charge(text) {
    const marks = (String(text).match(/[!?]|—|--|\.\.\./g) || []).length;
    const len = Math.max(1, String(text).length / 200);
    return Math.max(0, Math.min(5, Math.round(marks / len)));
  }
  /* Scale a list of counts to 0..5 against its busiest row. */
  function grade(list) {
    const top = Math.max(1, ...list);
    return list.map((n) => Math.round((n / top) * 5));
  }

  const HEADING = /^\s*(INT\.?\/EXT\.?|EXT\.?\/INT\.?|I\/E\.?|INT\.|EXT\.|INT |EXT )/i;
  const CUE = /^\s*([A-Z][A-Z0-9 .'\-]{1,30})(\s*\((V\.O\.|O\.S\.|O\.C\.|CONT'D|CONT’D)\))?\s*$/;
  const TRANSITION = /^\s*([A-Z ]+TO:|FADE (IN|OUT)[.:]?|CUT TO BLACK\.?)\s*$/;

  /* A screenplay as scenes, each with its speeches (who, paren, text) and its action text. */
  function parseScript(text) {
    const lines = String(text || "").replace(/\r/g, "").split("\n");
    const scenes = [];
    let scene = null;
    let speech = null;
    const open = (heading) => {
      scene = { heading: heading || "", speeches: [], action: "" };
      scenes.push(scene);
    };
    for (let i = 0; i < lines.length; i++) {
      const raw = lines[i];
      const line = raw.trim();
      if (!line) {
        speech = null;
        continue;
      }
      if (HEADING.test(line)) {
        open(line);
        speech = null;
        continue;
      }
      if (!scene) open("");
      if (TRANSITION.test(line)) continue;
      const next = (lines[i + 1] || "").trim();
      const cue = line.match(CUE);
      const nextCaps = /^[A-Z0-9 .'\-!?]+$/.test(next) && !next.startsWith("(");
      if (cue && next && !HEADING.test(next) && !nextCaps) {
        speech = { who: cue[1].trim(), paren: "", text: "" };
        scene.speeches.push(speech);
        continue;
      }
      if (speech) {
        if (/^\(.*\)$/.test(line)) speech.paren += line + " ";
        else speech.text += (speech.text ? " " : "") + line;
        continue;
      }
      scene.action += line + " ";
    }
    return scenes.filter((s) => s.speeches.length || s.action.trim());
  }
  function headingFacts(h) {
    const out = {};
    if (/^\s*(INT\.?\/EXT|EXT\.?\/INT|I\/E)/i.test(h)) out.intExt = null;
    else if (/^\s*INT/i.test(h)) out.intExt = "interior";
    else if (/^\s*EXT/i.test(h)) out.intExt = "exterior";
    const t = String(h).toLowerCase();
    out.timeOfDay = /\b(dawn|sunrise|early morning)\b/.test(t) ? "dawn" : /\b(dusk|sunset|evening|twilight|magic hour)\b/.test(t) ? "dusk" : /\b(night|midnight|late)\b/.test(t) ? "night" : /\b(day|morning|afternoon|noon|continuous)\b/.test(t) ? "day" : null;
    return out;
  }
  /* Rows from units: each unit is { heading, speeches, action }. */
  function rowsFrom(units, labelOf) {
    const said = units.map((u) => u.speeches.reduce((n, s) => n + words(s.text).length, 0));
    const done = units.map((u) => words(u.action).length);
    const lanes = { intExt: [], timeOfDay: [], wordsAmount: grade(said), movementAmount: grade(done), volume: [], emotion: [], emotionIntensity: [], peopleCount: [], cutRate: [], angleCount: [] };
    units.forEach((u) => {
      const h = headingFacts(u.heading);
      lanes.intExt.push(h.intExt || null);
      lanes.timeOfDay.push(h.timeOfDay || null);
      lanes.volume.push(loudness(u.speeches));
      const all = u.action + " " + u.speeches.map((s) => s.paren + " " + s.text).join(" ");
      lanes.emotion.push(feeling(all));
      lanes.emotionIntensity.push(charge(all));
      const who = new Set(u.speeches.map((s) => s.who.replace(/\s*\(.*$/, "")));
      lanes.peopleCount.push(who.size ? Math.min(8, who.size) : null);
      let switches = 0;
      for (let i = 1; i < u.speeches.length; i++) if (u.speeches[i].who !== u.speeches[i - 1].who) switches++;
      const rate = u.speeches.length > 1 ? switches / (u.speeches.length - 1) : 0;
      const pace = u.speeches.length ? rate * Math.min(1, u.speeches.length / 6) : 0;
      lanes.cutRate.push(u.speeches.length < 2 ? (words(u.action).length > 60 ? "medium" : "slow") : pace > 0.66 ? "fast" : pace > 0.3 ? "medium" : "slow");
      lanes.angleCount.push(Math.max(1, Math.min(8, who.size + (words(u.action).length > 40 ? 2 : 1))));
    });
    /* Fill gaps (a scene with no feeling words keeps the one before it). */
    Object.keys(lanes).forEach((k) => {
      let last = null;
      lanes[k] = lanes[k].map((v) => (v == null ? last : (last = v)));
      if (lanes[k].every((v) => v == null)) delete lanes[k];
    });
    return { rows: units.map(labelOf), lanes };
  }
  function script(text, name) {
    const scenes = parseScript(text);
    let units = scenes;
    let label = (u, i) => {
      const h = headingFacts(u.heading);
      const bits = [h.intExt, h.timeOfDay].filter(Boolean).join(", ");
      return "Scene " + (i + 1) + (bits ? " (" + bits + ")" : "");
    };
    let notes = scenes.length + " scenes";
    if (scenes.length < 3) {
      units = [];
      scenes.forEach((s) => {
        for (let i = 0; i < Math.max(1, s.speeches.length); i += 2) units.push({ heading: s.heading, speeches: s.speeches.slice(i, i + 2), action: i === 0 ? s.action : "" });
      });
      label = (u, i) => "Beat " + (i + 1);
      notes = units.length + " beats (fewer than three scene headings, so each row is two speeches)";
    }
    units = units.slice(0, 200);
    const out = rowsFrom(units, label);
    return { name: String(name || "A script").slice(0, 80), kind: "script", rows: out.rows, lanes: out.lanes, notes };
  }

  /* ---------- shot lists ---------- */
  function splitRow(line, sep) {
    if (sep === "\t") return line.split("\t").map((s) => s.trim());
    const out = [];
    let cur = "";
    let q = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') q = !q;
      else if (ch === "," && !q) {
        out.push(cur.trim());
        cur = "";
      } else cur += ch;
    }
    out.push(cur.trim());
    return out;
  }
  const PICK = {
    shotSize: [/\b(ecu|extreme close|insert|detail)\b/i, "insert", /\b(cu|close|mcu|medium close)\b/i, "close", /\b(ms|mid|medium|cowboy|mws|two.?shot)\b/i, "medium", /\b(ws|wide|ls|long shot|establishing|full|els|extreme wide)\b/i, "wide"],
    angleHeight: [/\b(birds?.?eye|overhead|top.?down)\b/i, "overhead", /\b(worms?.?eye|floor|ground)\b/i, "floor", /\b(low)\b/i, "low", /\b(high)\b/i, "high", /\b(eye|neutral|straight)\b/i, "eye"],
    cameraMove: [/\b(push|dolly in)\b/i, "push in", /\b(pull|dolly out)\b/i, "pull out", /\b(track|truck|follow|dolly)\b/i, "track", /\b(crane|jib|boom)\b/i, "crane", /\b(zoom)\b/i, "zoom", /\b(orbit|arc)\b/i, "orbit", /\b(pan)\b/i, "pan", /\b(tilt)\b/i, "tilt", /\b(static|none|locked|still)\b/i, "none"],
    cameraCarry: [/\b(handheld|hand.held|shoulder)\b/i, "handheld", /\b(steadicam|gimbal|dolly|slider|smooth|crane)\b/i, "smooth", /\b(tripod|sticks|locked|static)\b/i, "locked"],
    lensLength: [/\b(1[0-9]|2[0-9]|3[0-4])\s*mm\b|\bwide\b/i, "wide", /\b(3[5-9]|4[0-9]|5[0-9]|6[0-9])\s*mm\b|\bnormal\b/i, "normal", /\b([7-9][0-9]|[1-9][0-9]{2})\s*mm\b|\b(long|tele)\b/i, "long"],
  };
  function pick(id, cell) {
    const p = PICK[id];
    for (let i = 0; i < p.length; i += 2) if (p[i].test(cell)) return p[i + 1];
    return null;
  }
  const COLS = {
    shotSize: /size|framing|shot type|^shot$/i,
    angleHeight: /angle|height/i,
    cameraMove: /move|movement|motion/i,
    cameraCarry: /rig|support|carry|mount|equipment/i,
    lensLength: /lens|focal/i,
    duration: /dur|length|time|sec/i,
    scene: /^scene|^sc\b/i,
  };
  function shotList(text, name) {
    const lines = String(text || "").replace(/\r/g, "").split("\n").filter((l) => l.trim());
    if (lines.length < 2) return { name: String(name || "A shot list").slice(0, 80), kind: "shot list", rows: [], lanes: {}, notes: "No shots found." };
    const sep = lines[0].includes("\t") ? "\t" : ",";
    const head = splitRow(lines[0], sep);
    const col = {};
    Object.keys(COLS).forEach((k) => {
      const i = head.findIndex((h) => COLS[k].test(h));
      if (i >= 0 && !Object.values(col).includes(i)) col[k] = i;
    });
    const shots = lines.slice(1, 201).map((l) => splitRow(l, sep));
    const lanes = {};
    ["shotSize", "angleHeight", "cameraMove", "cameraCarry", "lensLength"].forEach((id) => {
      /* A column named for it, or any cell in the row that says it ("WS, low, handheld"). */
      lanes[id] = shots.map((cells) => (col[id] != null ? pick(id, cells[col[id]] || "") : null) || pick(id, cells.join(" ")));
    });
    if (col.duration != null)
      lanes.cutRate = shots.map((cells) => {
        const s = parseFloat(String(cells[col.duration] || "").replace(/[^0-9.:]/g, "").replace(/^(\d+):(\d+)$/, (m, a, b) => String(Number(a) * 60 + Number(b))));
        return isFinite(s) && s > 0 ? (s < 2.5 ? "fast" : s <= 6 ? "medium" : "slow") : null;
      });
    Object.keys(lanes).forEach((k) => {
      let last = null;
      lanes[k] = lanes[k].map((v) => (v == null ? last : (last = v)));
      if (lanes[k].every((v) => v == null)) delete lanes[k];
    });
    return { name: String(name || "A shot list").slice(0, 80), kind: "shot list", rows: shots.map((_, i) => "Shot " + (i + 1)), lanes, notes: shots.length + " shots; columns found: " + (Object.keys(col).join(", ") || "none, read from the words in each row") };
  }

  function scenes(list) {
    const units = [];
    (list || []).forEach((sc) => (sc.lines || []).forEach((l) => units.push({ heading: sc.slug || "", speeches: l.text && l.text !== "—" ? [{ who: l.who, paren: "", text: l.text }] : [], action: l.text === "—" ? "silence" : "" })));
    const out = rowsFrom(units.slice(0, 200), (u, i) => "Line " + (i + 1));
    return { name: "The app's reference scenes", kind: "script", rows: out.rows, lanes: out.lanes, notes: units.length + " lines" };
  }

  function detect(text) {
    const first = String(text || "").split("\n").find((l) => l.trim()) || "";
    return (first.includes(",") || first.includes("\t")) && /shot|size|angle|move|lens|dur/i.test(first) ? "shotList" : "script";
  }

  root.CurioAnalyze = { script, shotList, scenes, detect, parseScript, FEELINGS };
})();
