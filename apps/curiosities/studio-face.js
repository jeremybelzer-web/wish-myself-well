/* Face: Maya blend shapes, a pose library and lip sync on one drawn face.
   Each slider is a blend shape target weight (0 to 1). Brows and smile are split left and right,
   like Maya's split blend shapes, so one side can lift alone (a sly look). Poses are saved sets of
   weights, like a Pose Library. Every target can also be keyed per beat (a small curve beside each
   slider) and Play eases between keys. Eye darts (saccades that snap in about 2 frames) and blinks
   (about 6 frames) are timed events on the beat strip, and the eyeline says where the character
   looks. A line of text becomes mouth shapes per second, the way animators break down dialogue.
   Curiosities: faceIntensity, lipSync, poseRate, gazeShift, blink, eyeline. */

(function () {
  if (!window.CuriosityStudio) return;
  const KEY = "curiosities-studio-face-v1";
  const FPS = 24;
  const TARGETS = [
    ["browUpL", "Brow up, left"],
    ["browUpR", "Brow up, right"],
    ["browKnit", "Brows knit"],
    ["eyeWide", "Eyes wide"],
    ["eyeSquint", "Eyes squint"],
    ["smileL", "Smile, left"],
    ["smileR", "Smile, right"],
    ["frown", "Frown"],
    ["jawOpen", "Jaw open"],
    ["lipsPress", "Lips press"],
    ["sneer", "Sneer"],
  ];
  const SPLIT = { browUp: ["browUpL", "browUpR"], smile: ["smileL", "smileR"] };
  /* Poses are written with whole brows and smile; expand() splits them into left and right. */
  const POSES = {
    neutral: {},
    joy: { smile: 0.9, eyeSquint: 0.4, browUp: 0.3 },
    sorrow: { frown: 0.7, browUp: 0.6, browKnit: 0.5, eyeSquint: 0.2 },
    anger: { browKnit: 1, frown: 0.4, lipsPress: 0.7, eyeSquint: 0.3 },
    fear: { browUp: 0.9, browKnit: 0.5, eyeWide: 1, jawOpen: 0.3, frown: 0.3 },
    surprise: { browUp: 1, eyeWide: 0.9, jawOpen: 0.7 },
    disgust: { sneer: 1, browKnit: 0.5, eyeSquint: 0.5, frown: 0.3 },
    contempt: { sneer: 0.5, smileL: 0.35, browUpR: 0.2 },
    sly: { smileL: 0.7, browUpL: 0.6, eyeSquint: 0.35, lipsPress: 0.2 },
    deadpan: { lipsPress: 0.3, eyeSquint: 0.15 },
  };
  function expand(p) {
    const out = {};
    Object.entries(p || {}).forEach(([k, v]) => (SPLIT[k] ? SPLIT[k].forEach((x) => (out[x] = v)) : (out[k] = v)));
    return out;
  }
  const EYELINES = {
    "at the other person": { dx: -5, dy: 0, lid: 0 },
    "at the lens": { dx: 0, dy: 0, lid: 0 },
    away: { dx: 5, dy: -3, lid: 0 },
    down: { dx: -1, dy: 4, lid: 0.3 },
  };
  /* Mouth shapes: [jaw open, width, rounded] */
  const VISEMES = { rest: [0.05, 0.5, 0], A: [0.9, 0.6, 0], E: [0.45, 0.85, 0], I: [0.3, 0.8, 0], O: [0.7, 0.3, 0.9], U: [0.3, 0.2, 1], MBP: [0, 0.45, 0], FV: [0.15, 0.55, 0], L: [0.4, 0.5, 0], WQ: [0.25, 0.2, 1] };
  function visemeOf(ch) {
    ch = ch.toLowerCase();
    if ("a".includes(ch)) return "A";
    if ("e".includes(ch)) return "E";
    if ("iy".includes(ch)) return "I";
    if ("o".includes(ch)) return "O";
    if ("u".includes(ch)) return "U";
    if ("mbp".includes(ch)) return "MBP";
    if ("fv".includes(ch)) return "FV";
    if ("ltdn".includes(ch)) return "L";
    if ("wq".includes(ch)) return "WQ";
    if (/[a-z]/.test(ch)) return "E";
    return "rest";
  }
  let anim = null;
  let offAuto = null;
  let liveAnim = null;
  const AUTO_IDS = ["faceIntensity", "gazeShift", "blink", "eyeline", "emotion"];
  /* emotion words from the catalog, each read as a pose */
  const EMOTION_POSE = { loving: "joy", joyful: "joy", curious: "surprise", melancholy: "sorrow", anxious: "fear", fearful: "fear", angry: "anger", triumphant: "joy", absurd: "sly", dreamlike: "deadpan" };
  function eyelineWord(v) {
    if (EYELINES[v]) return v;
    if (v === "on" || v === "yes") return "at the lens";
    if (v === "off" || v === "no") return "away";
    const n = Number(v);
    if (!isNaN(n)) return Object.keys(EYELINES)[Math.max(0, Math.min(3, Math.round(n)))];
    return null;
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }
  const smooth = (t) => t * t * (3 - 2 * t);

  function css() {
    if (document.getElementById("studio-face")) return;
    const st = document.createElement("style");
    st.id = "studio-face";
    st.textContent = `.fc-t{display:grid;grid-template-columns:1fr 84px;gap:2px 8px;align-items:center}.fc-t label.field{margin:0}.fc-t svg{width:84px;height:22px;display:block}
      .fc-strip{width:100%;height:auto;display:block;border:2px solid var(--ink);background:#fff}
      .fc-beats td,.fc-beats th{text-align:center;padding:2px 4px}.fc-beats select{max-width:120px}.fc-beats th.on,.fc-beats td.on{background:var(--ink);color:var(--paper)}
      .fc-prox li{font-size:13px}.fc-prox .ok{color:#2e7d32}.fc-prox .no{color:#a33}.auto-badge{font-family:var(--mono);font-size:10px;background:var(--ink);color:var(--paper);padding:0 4px;margin-left:4px;text-transform:none}#fc-chips .chip[data-auto]{cursor:pointer}#fc-chips .chip.auto-on{background:var(--ink);color:var(--paper)}`;
    document.head.appendChild(st);
  }

  /* opts: { mouth: viseme triple, blink: 0..1 lid closure, eye: {dx, dy}, lid: 0..1 extra droop } */
  function faceSvg(w, opts) {
    opts = opts || {};
    const g = (k) => w[k] || 0;
    const bk = g("browKnit") * 8;
    const ew = 1 + g("eyeWide") * 0.5 - g("eyeSquint") * 0.55;
    const close = Math.max(opts.blink || 0, opts.lid || 0);
    const eyeH = Math.max(0.6, 9 * ew * (1 - close * 0.93));
    const eye = opts.eye || { dx: 0, dy: 0 };
    const mouth = opts.mouth;
    const jaw = mouth ? mouth[0] : g("jawOpen");
    const smileAvg = (g("smileL") + g("smileR")) / 2;
    const width = mouth ? mouth[1] : 0.5 + smileAvg * 0.3 - g("lipsPress") * 0.1;
    const round = mouth ? mouth[2] : 0;
    const mw = 22 + width * 28 - round * 12;
    const mh = 2 + jaw * 26 - g("lipsPress") * 2;
    const sneer = g("sneer") * 6;
    /* screen-left is the character's right; L targets drive the screen-right side */
    const yL = 170 - (g("smileR") - g("frown")) * 9;
    const yR = 170 - (g("smileL") - g("frown")) * 9 - sneer;
    const mid = 170 + (smileAvg - g("frown")) * 14 - sneer;
    const brow = (x, dir, up) => {
      const bu = up * 10;
      return `<path d="M${x - 16} ${72 - bu + (dir * bk) / 2} Q ${x} ${64 - bu - bk / 2} ${x + 16} ${72 - bu - (dir * bk) / 2}" stroke="#1c1712" stroke-width="4" fill="none" stroke-linecap="round"/>`;
    };
    const pupil = (cx) => (close > 0.85 ? "" : `<circle cx="${cx + eye.dx}" cy="${97 + eye.dy}" r="${Math.min(5, eyeH)}" fill="#1c1712"/>`);
    return `<svg class="view" viewBox="0 0 240 240" role="img" aria-label="Face">
      <ellipse cx="120" cy="120" rx="82" ry="98" fill="#f3d6b8" stroke="#1c1712" stroke-width="3"/>
      ${brow(88, -1, g("browUpR"))}${brow(152, 1, g("browUpL"))}
      <ellipse cx="88" cy="96" rx="13" ry="${eyeH}" fill="#fff" stroke="#1c1712" stroke-width="2"/>
      <ellipse cx="152" cy="96" rx="13" ry="${eyeH}" fill="#fff" stroke="#1c1712" stroke-width="2"/>
      ${pupil(88)}${pupil(152)}
      <path d="M120 105 L112 140 Q120 ${145 - sneer} 128 140" stroke="#1c1712" stroke-width="2" fill="none"/>
      <path d="M${120 - mw / 2} ${yL} Q 120 ${mid} ${120 + mw / 2} ${yR}
               Q 120 ${mid + mh * 1.6} ${120 - mw / 2} ${yL} Z" fill="#7a2a1c" stroke="#1c1712" stroke-width="2.5" stroke-linejoin="round"/>
    </svg>`;
  }

  function intensityOf(w) {
    const total = Object.values(w).reduce((a, b) => a + Math.abs(b), 0);
    return Math.min(5, Math.round(total * 1.6));
  }
  function asymmetryOf(w) {
    return Math.min(5, Math.round((Math.abs((w.browUpL || 0) - (w.browUpR || 0)) + Math.abs((w.smileL || 0) - (w.smileR || 0))) * 4));
  }

  function nearestPose(w) {
    let best = "neutral", bd = Infinity;
    Object.entries(POSES).forEach(([name, p]) => {
      const e = expand(p);
      let d = 0;
      TARGETS.forEach(([k]) => (d += Math.pow((w[k] || 0) - (e[k] || 0), 2)));
      if (d < bd) {
        bd = d;
        best = name;
      }
    });
    return best;
  }

  /* ---------- beats: pose, keyed targets, eyeline, darts, blink ---------- */
  function weightAt(s, k, i) {
    const kv = s.keys[k] && s.keys[k][i];
    if (kv != null) return kv;
    return expand(POSES[s.beats[i]] || {})[k] || 0;
  }
  function beatWeights(s, i) {
    const w = {};
    TARGETS.forEach(([k]) => (w[k] = weightAt(s, k, i)));
    return w;
  }
  /* A small repeatable random per beat, so darts land the same way each play. */
  function rnd(seed) {
    const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  }
  /* Saccade times (0..1 of the beat) and their small offsets around the eyeline. */
  function darts(s, i) {
    const n = Number(s.gaze[i]) || 0;
    return Array.from({ length: n }, (_, j) => ({ t: (j + 0.3 + rnd(i * 13 + j) * 0.5) / (n + 0.4), dx: (rnd(i * 7 + j * 3 + 1) - 0.5) * 7, dy: (rnd(i * 5 + j * 11 + 2) - 0.5) * 4 }));
  }
  const BLINK_AT = 0.68;

  function stripSvg(s, cur) {
    const n = s.beats.length, bw = 600 / n;
    const cells = s.beats
      .map((p, i) => {
        const x = i * bw;
        const ticks = darts(s, i).map((d) => `<line x1="${(x + d.t * bw).toFixed(1)}" x2="${(x + d.t * bw).toFixed(1)}" y1="30" y2="44" stroke="#2a6f97" stroke-width="2"/>`).join("");
        const blink = s.blinks[i] ? `<rect x="${(x + BLINK_AT * bw).toFixed(1)}" y="48" width="${Math.max(3, (bw * 250) / s.beatMs).toFixed(1)}" height="10" fill="#c45c26"/>` : "";
        return `<rect x="${x}" y="0" width="${bw}" height="64" fill="${i === cur ? "rgba(28,23,18,0.08)" : "none"}" stroke="rgba(28,23,18,0.3)"/>
          <text x="${x + 4}" y="12" font-size="10">${i + 1} ${p}</text><text x="${x + 4}" y="25" font-size="9" fill="#555">${s.eyelines[i]}</text>${ticks}${blink}`;
      })
      .join("");
    return `<svg class="fc-strip" viewBox="0 0 600 64" role="img" aria-label="Beat strip with eye darts and blinks">${cells}<line id="fc-ph" x1="0" x2="0" y1="0" y2="64" stroke="#c0392b" stroke-width="2" opacity="0"/></svg>`;
  }

  function sparkline(s, k, cur) {
    const n = s.beats.length;
    const xs = (i) => (n === 1 ? 42 : 4 + (i * 76) / (n - 1));
    const ys = (v) => 19 - v * 16;
    const pts = s.beats.map((_, i) => `${xs(i).toFixed(1)},${ys(weightAt(s, k, i)).toFixed(1)}`).join(" ");
    const dots = s.beats
      .map((_, i) => {
        const keyed = s.keys[k] && s.keys[k][i] != null;
        return `<circle cx="${xs(i).toFixed(1)}" cy="${ys(weightAt(s, k, i)).toFixed(1)}" r="${i === cur ? 3 : 2}" fill="${keyed ? "#c45c26" : "#fff"}" stroke="#1c1712"/>`;
      })
      .join("");
    return `<svg viewBox="0 0 84 22" aria-label="Curve of ${k} per beat"><polyline points="${pts}" fill="none" stroke="#1c1712" stroke-width="1"/>${dots}</svg>`;
  }

  /* Proximities computed over the beats. */
  function proximities(s) {
    const n = s.beats.length;
    const ints = s.beats.map((_, i) => intensityOf(beatWeights(s, i)));
    const out = [];
    let x = 0, held = 0;
    for (let i = 1; i < n; i++)
      if (Math.abs(ints[i] - ints[i - 1]) >= 2) {
        x++;
        if (s.blinks[i] || s.blinks[i + 1]) held++;
      }
    out.push({ text: "When the expression changes a lot, a blink follows within 1 beat", x, held });
    let ax = 0, ah = 0;
    s.beats.forEach((_, i) => {
      if (s.eyelines[i] === "away" || s.eyelines[i] === "down") {
        ax++;
        if ((Number(s.gaze[i]) || 0) >= 2 || (Number(s.gaze[i + 1]) || 0) >= 2) ah++;
      }
    });
    out.push({ text: "When the eyes go away or down, eye darts (2 or more) follow within 1 beat", x: ax, held: ah });
    let lx = 0, lh = 0;
    s.beats.forEach((_, i) => {
      if (s.eyelines[i] === "at the lens") {
        lx++;
        if ((Number(s.gaze[i]) || 0) <= 1) lh++;
      }
    });
    out.push({ text: "When the character looks into the lens, the eyes hold still (0 to 1 darts) on that beat", x: lx, held: lh });
    return out;
  }

  function chipsHtml(s, w, live) {
    const run = (id) => window.CurioAuto && window.CurioAuto.running().includes("c:" + id);
    const chip = (id, v) => `<span class="chip${run(id) ? " auto-on" : ""}" data-auto="c:${id}" title="Click to automate ${id}">${id} ${String(v).replace(/</g, "&lt;")}${run(id) ? " · automated" : ""}</span>`;
    const cur = s.cur;
    const L = live || {};
    return [
      chip("faceIntensity", L.faceIntensity != null ? L.faceIntensity : intensityOf(w)),
      `<span class="chip">reads as ${nearestPose(w)}</span>`,
      chip("eyeline", s.eyelines[cur]),
      chip("gazeShift", Number(s.gaze[cur]) || 0),
      chip("blink", s.blinks[cur] ? "yes" : "no"),
      chip("emotion", L.emotion ? L.emotion + " → " + (EMOTION_POSE[L.emotion] || s.b) : "→ " + s.b),
      asymmetryOf(w) ? `<span class="chip">split ${asymmetryOf(w)}</span>` : "",
    ].join(" ");
  }

  function normalize(s) {
    const n = s.beats.length;
    const fill = (arr, v) => {
      arr = Array.isArray(arr) ? arr.slice(0, n) : [];
      while (arr.length < n) arr.push(v);
      return arr;
    };
    s.gaze = fill(s.gaze, 2);
    s.blinks = fill(s.blinks, false);
    s.eyelines = fill(s.eyelines, "at the other person");
    s.keys = s.keys || {};
    TARGETS.forEach(([k]) => (s.keys[k] = fill(s.keys[k], null)));
    Object.keys(s.keys).forEach((k) => !TARGETS.find((t) => t[0] === k) && delete s.keys[k]);
    s.cur = Math.min(Math.max(0, s.cur || 0), n - 1);
    /* old saves had whole browUp and smile weights */
    s.w = Object.assign(expand(s.w || {}), {});
    delete s.w.look;
  }

  function draw(el, api) {
    css();
    const esc = api.esc;
    const st = api.store(KEY);
    const s = Object.assign(
      { w: {}, a: "joy", b: "sorrow", mix: 0, line: "Mama, put the cup back on the shelf.", rate: 10, beats: ["neutral", "surprise", "fear", "deadpan"], gaze: [1, 3, 5, 0], blinks: [false, true, false, true], eyelines: ["at the other person", "away", "down", "at the lens"], keys: {}, cur: 0, beatMs: 1200, link: true },
      st.get({})
    );
    normalize(s);
    if (anim) cancelAnimationFrame(anim);
    const saveDraw = () => {
      st.set(s);
      draw(el, api);
    };
    const cur = s.cur;
    const wCur = beatWeights(s, cur);
    s.w = wCur;
    const poseOpts = (v) => Object.keys(POSES).map((p) => `<option ${p === v ? "selected" : ""}>${p}</option>`).join("");
    const visemes = s.line.split("").map(visemeOf).filter((v, i, arr) => v !== arr[i - 1]);
    const seconds = visemes.length / s.rate;
    const el0 = EYELINES[s.eyelines[cur]] || EYELINES["at the lens"];
    const prox = proximities(s);
    el.innerHTML = `<div class="studio-grid">
      <div>
        <p class="cap">Blend shape targets, keyed on beat ${cur + 1}. The curve beside each slider is that target across the beats; orange dots are keys, white dots come from the beat's pose.</p>
        <label class="field"><span><input type="checkbox" data-s="link" ${s.link ? "checked" : ""}> Link left and right (turn off for a split, sly look)</span></label>
        <div class="fc-t">${TARGETS.map(([k, l]) => `<label class="field">${esc(l)} ${(wCur[k] || 0).toFixed(2)}<input type="range" min="0" max="1" step="0.05" data-w="${k}" value="${wCur[k] || 0}"></label>${sparkline(s, k, cur)}`).join("")}</div>
        <div class="bar-actions"><button type="button" data-act="zero">Zero this beat</button> <button type="button" data-act="unkey">Clear keys on this beat</button></div>
      </div>
      <div>
        <div id="face-view" style="max-width:320px">${faceSvg(wCur, { eye: el0, lid: el0.lid })}</div>
        <p id="fc-chips">${chipsHtml(s, wCur, null)}</p>
        <p class="cap">Click a chip to automate it, or open Automate. Emotion picks the To pose of the In-between; faceIntensity moves its blend.</p>
        <h3>Beat strip</h3>
        <p class="cap">Blue ticks are eye darts: each one snaps in about 2 frames at ${FPS} fps. Orange bars are blinks, about 6 frames. Click a beat to key it.</p>
        ${stripSvg(s, cur)}
        <div class="scroll"><table class="trace fc-beats"><thead><tr><th></th>${s.beats.map((_, i) => `<th class="${i === cur ? "on" : ""}"><button type="button" data-cur="${i}">${i + 1}</button></th>`).join("")}</tr></thead><tbody>
          <tr><th>Pose</th>${s.beats.map((p, i) => `<td class="${i === cur ? "on" : ""}"><select data-beat="${i}">${poseOpts(p)}</select></td>`).join("")}</tr>
          <tr><th>Eyeline</th>${s.eyelines.map((v, i) => `<td class="${i === cur ? "on" : ""}"><select data-eye="${i}">${Object.keys(EYELINES).map((e) => `<option ${e === v ? "selected" : ""}>${e}</option>`).join("")}</select></td>`).join("")}</tr>
          <tr><th>Eye darts</th>${s.gaze.map((v, i) => `<td class="${i === cur ? "on" : ""}"><select data-gaze="${i}">${[0, 1, 2, 3, 4, 5, 6, 7, 8].map((n) => `<option ${n === Number(v) ? "selected" : ""}>${n}</option>`).join("")}</select></td>`).join("")}</tr>
          <tr><th>Blink</th>${s.blinks.map((v, i) => `<td class="${i === cur ? "on" : ""}"><input type="checkbox" data-blink="${i}" ${v ? "checked" : ""} aria-label="Blink on beat ${i + 1}"></td>`).join("")}</tr>
        </tbody></table></div>
        <div class="bar-actions"><button type="button" data-act="addbeat">+ beat</button> <button type="button" data-act="rmbeat">− beat</button>
          <label class="field" style="display:inline-flex">Beat length<select data-s="beatMs">${[800, 1200, 1800, 2500].map((v) => `<option value="${v}" ${v === s.beatMs ? "selected" : ""}>${v / 1000} s</option>`).join("")}</select></label>
          <button type="button" data-act="playbeats">Play</button> <button type="button" data-act="keepbeats">Keep on Shelf</button></div>
        <p class="cap" id="fc-now"></p>
        <ul class="fc-prox">${prox.map((p) => `<li class="${p.x ? (p.held === p.x ? "ok" : "no") : ""}">${esc(p.text)}: ${p.x ? (p.held === p.x ? "holds" : "doesn't hold") + ` (${p.held} of ${p.x})` : "never happens here"}</li>`).join("")}</ul>
        <h3>Pose library</h3>
        <p class="cap">Sets the pose of beat ${cur + 1} and clears its keys.</p>
        <p>${Object.keys(POSES).map((p) => `<button type="button" data-pose="${p}">${p}</button>`).join(" ")}</p>
        <h3>In-between</h3>
        <div class="study-bar"><label class="field">From<select data-s="a">${poseOpts(s.a)}</select></label><label class="field">To<select data-s="b">${poseOpts(s.b)}</select></label>
        <label class="field">Blend ${Math.round(s.mix * 100)}%<input type="range" min="0" max="1" step="0.05" data-s="mix" value="${s.mix}"></label></div>
        <p class="cap">Moving the blend keys every target on beat ${cur + 1}.</p>
        <h3>Lip sync</h3>
        <label class="field">A line to speak<input data-s="line" value="${esc(s.line)}" maxlength="120"></label>
        <label class="field">Mouth shapes per second: ${s.rate}<input type="range" min="4" max="14" data-s="rate" value="${s.rate}"></label>
        <p class="mono">${visemes.map(esc).join(" · ")}</p>
        <p class="cap">${visemes.length} mouth shapes over ${seconds.toFixed(1)} s. Animators often hold fewer shapes than letters; fewer per second reads as more stylized.</p>
        <div class="bar-actions"><button type="button" data-act="speak">Speak it</button></div>
      </div></div>`;
    const view = el.querySelector("#face-view");

    /* ---------- automation: CurioAuto drives the face live ---------- */
    const live = { driven: new Set(), last: 0, darts: [], nextDart: 0, eye: { dx: el0.dx, dy: el0.dy }, from: { dx: el0.dx, dy: el0.dy }, dartAt: 0, blinkAt: -1, prevBlink: false };
    const liveWeights = () => {
      if (live.driven.has("faceIntensity") || live.driven.has("emotion")) {
        const A = expand(POSES[s.a] || {}), B = expand(POSES[s.b] || {});
        const w = {};
        TARGETS.forEach(([k]) => (w[k] = lerp(A[k] || 0, B[k] || 0, s.mix)));
        return w;
      }
      return beatWeights(s, cur);
    };
    const wireChips = () =>
      el.querySelectorAll("#fc-chips [data-auto]").forEach((c) =>
        c.addEventListener("click", () => {
          const A = window.CurioAuto;
          if (!A) return;
          if (A.running().includes(c.dataset.auto)) A.stop(c.dataset.auto);
          else A.start(c.dataset.auto);
        })
      );
    const refreshChips = (lv) => {
      const c = el.querySelector("#fc-chips");
      if (c) c.innerHTML = chipsHtml(s, liveWeights(), lv);
      wireChips();
    };
    const ctlFor = (id) =>
      ({ faceIntensity: `[data-s="mix"]`, emotion: `[data-s="b"]`, gazeShift: `[data-gaze="${cur}"]`, blink: `[data-blink="${cur}"]`, eyeline: `[data-eye="${cur}"]` })[id];
    const badge = (id, on) => {
      const ctl = el.querySelector(ctlFor(id));
      if (!ctl) return;
      const host = ctl.closest("label") || ctl.parentElement;
      let b = host.querySelector(".auto-badge");
      if (on && !b) {
        b = document.createElement("span");
        b.className = "auto-badge";
        b.textContent = "automated";
        host.appendChild(b);
      } else if (!on && b) b.remove();
    };
    const liveLoop = (t) => {
      if (!view.isConnected || document.getElementById("studio").classList.contains("hidden")) return (liveAnim = null);
      if (t - live.last > 400) {
        /* automation stopped: back to the still face of this beat */
        liveAnim = null;
        live.driven.forEach((id) => badge(id, false));
        live.driven = new Set();
        view.innerHTML = faceSvg(beatWeights(s, cur), { eye: el0, lid: el0.lid });
        refreshChips(null);
        return;
      }
      const frame = 1000 / FPS;
      const base = EYELINES[s.eyelines[cur]] || EYELINES["at the lens"];
      const n = Number(s.gaze[cur]) || 0;
      if (t >= live.nextDart) {
        live.from = { dx: live.eye.dx, dy: live.eye.dy };
        live.to = { dx: base.dx + (n ? (Math.random() - 0.5) * 7 : 0), dy: base.dy + (n ? (Math.random() - 0.5) * 4 : 0) };
        live.dartAt = t;
        live.nextDart = t + (n ? s.beatMs / n : 400) * (0.7 + Math.random() * 0.6);
      }
      const u = Math.min(1, (t - live.dartAt) / (2 * frame));
      const to = live.to || base;
      live.eye = { dx: lerp(live.from.dx, to.dx, u), dy: lerp(live.from.dy, to.dy, u) };
      let blink = 0;
      if (live.blinkAt >= 0) {
        const bu = (t - live.blinkAt) / (6 * frame);
        if (bu <= 1) blink = 1 - Math.abs(2 * bu - 1);
        else live.blinkAt = -1;
      }
      view.innerHTML = faceSvg(liveWeights(), { eye: live.eye, lid: base.lid, blink });
      liveAnim = requestAnimationFrame(liveLoop);
    };
    if (offAuto) offAuto();
    offAuto = null;
    if (liveAnim) cancelAnimationFrame(liveAnim);
    liveAnim = null;
    if (window.CurioAuto)
      offAuto = window.CurioAuto.on((type, d) => {
        if (!el.isConnected || !view.isConnected) {
          if (offAuto) offAuto();
          offAuto = null;
          return;
        }
        if (type === "change") return refreshChips(null);
        if (type !== "tick" || !d || !d.panels || !d.panels[0]) return;
        const v = d.panels[0];
        const now = new Set(AUTO_IDS.filter((id) => d.ms["c:" + id] != null));
        if (!now.size) return;
        live.last = performance.now();
        let changed = false;
        const lv = {};
        if (now.has("emotion")) {
          lv.emotion = v.emotion;
          const pose = EMOTION_POSE[v.emotion];
          if (pose && s.b !== pose) {
            s.b = pose;
            const c = el.querySelector('[data-s="b"]');
            if (c) c.value = pose;
            changed = true;
          }
        }
        if (now.has("faceIntensity")) {
          const fi = Math.max(0, Math.min(5, Math.round(Number(v.faceIntensity)) || 0));
          lv.faceIntensity = fi;
          /* intensity 0 is a neutral face: the blend runs from neutral to the To pose */
          if (s.a !== "neutral") {
            s.a = "neutral";
            const ca = el.querySelector('[data-s="a"]');
            if (ca) ca.value = "neutral";
            changed = true;
          }
          if (s.mix !== fi / 5) {
            s.mix = fi / 5;
            const c = el.querySelector('[data-s="mix"]');
            if (c) {
              c.value = s.mix;
              if (c.parentElement.firstChild.nodeType === 3) c.parentElement.firstChild.textContent = `Blend ${Math.round(s.mix * 100)}%`;
            }
            changed = true;
          }
        }
        if (now.has("gazeShift")) {
          const g = Math.max(0, Math.min(8, Math.round(Number(v.gazeShift)) || 0));
          if (Number(s.gaze[cur]) !== g) {
            s.gaze[cur] = g;
            const c = el.querySelector(`[data-gaze="${cur}"]`);
            if (c) c.value = String(g);
            live.nextDart = 0;
            changed = true;
          }
        }
        if (now.has("blink")) {
          const on = v.blink === "yes" || v.blink === true || v.blink === "on";
          if (on && !live.prevBlink) live.blinkAt = performance.now();
          live.prevBlink = on;
          if (!!s.blinks[cur] !== on) {
            s.blinks[cur] = on;
            const c = el.querySelector(`[data-blink="${cur}"]`);
            if (c) c.checked = on;
            changed = true;
          }
        }
        if (now.has("eyeline")) {
          const word = eyelineWord(v.eyeline);
          if (word && s.eyelines[cur] !== word) {
            s.eyelines[cur] = word;
            const c = el.querySelector(`[data-eye="${cur}"]`);
            if (c) c.value = word;
            live.nextDart = 0;
            changed = true;
          }
        }
        AUTO_IDS.forEach((id) => now.has(id) !== live.driven.has(id) && badge(id, now.has(id)));
        const setChanged = now.size !== live.driven.size || [...now].some((x) => !live.driven.has(x));
        live.driven = now;
        if (changed) st.set(s);
        if (changed || setChanged) refreshChips(lv);
        if (!liveAnim) liveAnim = requestAnimationFrame(liveLoop);
      });
    wireChips();
    const setKey = (k, v) => {
      s.keys[k][cur] = v;
      if (s.link) {
        const pair = Object.values(SPLIT).find((p) => p.includes(k));
        if (pair) pair.forEach((x) => (s.keys[x][cur] = v));
      }
    };
    el.querySelectorAll("[data-w]").forEach((x) => {
      x.addEventListener("input", () => {
        setKey(x.dataset.w, Number(x.value));
        view.innerHTML = faceSvg(beatWeights(s, cur), { eye: el0, lid: el0.lid });
      });
      x.addEventListener("change", saveDraw);
    });
    el.querySelectorAll("[data-pose]").forEach((b) =>
      b.addEventListener("click", () => {
        s.beats[cur] = b.dataset.pose;
        TARGETS.forEach(([k]) => (s.keys[k][cur] = null));
        saveDraw();
      })
    );
    el.querySelectorAll("[data-cur]").forEach((b) => b.addEventListener("click", () => ((s.cur = Number(b.dataset.cur)), saveDraw())));
    el.querySelectorAll("[data-s]").forEach((x) =>
      x.addEventListener("change", () => {
        const k = x.dataset.s;
        s[k] = x.type === "checkbox" ? x.checked : x.type === "range" || k === "beatMs" ? Number(x.value) : x.value;
        if (k === "mix" || k === "a" || k === "b") {
          const A = expand(POSES[s.a]), B = expand(POSES[s.b]);
          TARGETS.forEach(([t]) => (s.keys[t][cur] = Math.round(lerp(A[t] || 0, B[t] || 0, s.mix) * 100) / 100));
        }
        saveDraw();
      })
    );
    el.querySelectorAll("[data-beat]").forEach((x) => x.addEventListener("change", () => ((s.beats[Number(x.dataset.beat)] = x.value), saveDraw())));
    el.querySelectorAll("[data-eye]").forEach((x) => x.addEventListener("change", () => ((s.eyelines[Number(x.dataset.eye)] = x.value), saveDraw())));
    el.querySelectorAll("[data-gaze]").forEach((x) => x.addEventListener("change", () => ((s.gaze[Number(x.dataset.gaze)] = Number(x.value)), saveDraw())));
    el.querySelectorAll("[data-blink]").forEach((x) => x.addEventListener("change", () => ((s.blinks[Number(x.dataset.blink)] = x.checked), saveDraw())));
    el.querySelector('[data-act="zero"]').addEventListener("click", () => {
      TARGETS.forEach(([k]) => (s.keys[k][cur] = 0));
      saveDraw();
    });
    el.querySelector('[data-act="unkey"]').addEventListener("click", () => {
      TARGETS.forEach(([k]) => (s.keys[k][cur] = null));
      saveDraw();
    });
    el.querySelector('[data-act="addbeat"]').addEventListener("click", () => {
      if (s.beats.length < 8) {
        s.beats.push("neutral");
        s.gaze.push(1);
        s.blinks.push(false);
        s.eyelines.push(s.eyelines[s.eyelines.length - 1] || "at the lens");
        TARGETS.forEach(([k]) => s.keys[k].push(null));
      }
      saveDraw();
    });
    el.querySelector('[data-act="rmbeat"]').addEventListener("click", () => {
      if (s.beats.length > 1) {
        s.beats.pop();
        s.gaze.pop();
        s.blinks.pop();
        s.eyelines.pop();
        TARGETS.forEach(([k]) => s.keys[k].pop());
      }
      saveDraw();
    });
    el.querySelector('[data-act="speak"]').addEventListener("click", () => {
      const t0 = performance.now();
      const step = (now) => {
        if (!view.isConnected) return;
        const i = Math.floor(((now - t0) / 1000) * s.rate);
        if (i >= visemes.length) {
          view.innerHTML = faceSvg(wCur, { eye: el0, lid: el0.lid });
          return;
        }
        view.innerHTML = faceSvg(wCur, { mouth: VISEMES[visemes[i]], eye: el0, lid: el0.lid });
        anim = requestAnimationFrame(step);
      };
      anim = requestAnimationFrame(step);
    });
    el.querySelector('[data-act="keepbeats"]').addEventListener("click", () => {
      if (!api.toShelf) return;
      api.toShelf("Face per beat", {
        faceIntensity: s.beats.map((_, i) => intensityOf(beatWeights(s, i))),
        gazeShift: s.gaze.map((v) => Number(v) || 0),
        blink: s.blinks.map((v) => (v ? "yes" : "no")),
        eyeline: s.eyelines.slice(),
      });
    });

    /* Play: ease between beat keys, snap saccades in 2 frames, blink over 6 frames. */
    el.querySelector('[data-act="playbeats"]').addEventListener("click", () => {
      const t0 = performance.now();
      const per = s.beatMs;
      const frame = 1000 / FPS;
      const ph = el.querySelector("#fc-ph");
      const now = el.querySelector("#fc-now");
      const n = s.beats.length;
      const eyeAt = (i, into) => {
        const base = EYELINES[s.eyelines[i]] || EYELINES["at the lens"];
        const prevBase = i > 0 ? EYELINES[s.eyelines[i - 1]] || base : base;
        /* a change of eyeline is itself a saccade at the start of the beat */
        let from = { dx: prevBase.dx, dy: prevBase.dy }, to = { dx: base.dx, dy: base.dy }, t0e = 0;
        darts(s, i).forEach((d) => {
          if (into >= d.t * per) {
            from = { dx: to.dx, dy: to.dy };
            to = { dx: base.dx + d.dx, dy: base.dy + d.dy };
            t0e = d.t * per;
          }
        });
        const u = Math.min(1, (into - t0e) / (2 * frame));
        return { dx: lerp(from.dx, to.dx, u), dy: lerp(from.dy, to.dy, u), lid: base.lid };
      };
      const step = (t) => {
        if (!view.isConnected || document.getElementById("studio").classList.contains("hidden")) return;
        const e = t - t0;
        const i = Math.floor(e / per);
        if (i >= n) {
          view.innerHTML = faceSvg(wCur, { eye: el0, lid: el0.lid });
          if (ph) ph.setAttribute("opacity", "0");
          if (now) now.textContent = "";
          return;
        }
        const into = e - i * per;
        const a = beatWeights(s, Math.max(0, i - 1)), b = beatWeights(s, i);
        const k = smooth(Math.min(1, into / Math.min(300, per * 0.4)));
        const w = {};
        TARGETS.forEach(([t2]) => (w[t2] = lerp(a[t2] || 0, b[t2] || 0, k)));
        const eye = eyeAt(i, into);
        let blink = 0;
        if (s.blinks[i]) {
          const u = (into - BLINK_AT * per) / (6 * frame);
          if (u >= 0 && u <= 1) blink = 1 - Math.abs(2 * u - 1);
        }
        view.innerHTML = faceSvg(w, { eye, lid: eye.lid, blink });
        if (ph) {
          const x = (e / (per * n)) * 600;
          ph.setAttribute("x1", x);
          ph.setAttribute("x2", x);
          ph.setAttribute("opacity", "1");
        }
        if (now) now.textContent = `Beat ${i + 1} · frame ${Math.floor(into / frame) + 1} · ${s.eyelines[i]}${blink > 0 ? " · blink" : ""}`;
        anim = requestAnimationFrame(step);
      };
      anim = requestAnimationFrame(step);
    });
  }

  window.CuriosityStudio.register({ id: "face", label: "Face", order: 38, maya: "Blend Shapes (Shape Editor, split left/right targets), Pose Library, keyed weights per beat, eye darts and blinks, lip sync breakdown", draw });
})();
