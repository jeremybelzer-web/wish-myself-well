/* Studio · Shots: Maya's Camera Sequencer for storyboards and edits.
   A shot track of clips, each one a camera (shot size, angle height, move, carry) held for a
   number of frames over one or more scene lines. Two tracks: the top track wins where shots
   overlap, as in Maya's sequencer. Play draws the ubershot as board panels in real time.
   The edit is measured as curiosities: cutRate, shotDuration per shot, angleChange, and the
   shot-size rhythm. A sound file can play under it, and C drops a cut marker while it plays.
   State is localStorage key curiosities-studio-sequencer-v1. Audio is never stored or uploaded. */

(function () {
  if (!window.CuriosityStudio) return;

  const KEY = "curiosities-studio-sequencer-v1";
  const RATES = [
    [24, "24 fps (film)"],
    [25, "25 fps (PAL)"],
    [30, "30 fps (NTSC)"],
    [12, "12 fps (animation on twos)"],
  ];
  const optionsOf = (id, fallback) => {
    const c = typeof CURIOSITIES !== "undefined" ? CURIOSITIES.find((x) => x.id === id) : null;
    return c && c.options ? c.options.slice() : fallback;
  };
  const SIZES = optionsOf("shotSize", ["wide", "medium", "close", "insert"]);
  const HEIGHTS = optionsOf("angleHeight", ["eye", "low", "high", "overhead", "floor"]);
  const MOVES = optionsOf("cameraMove", ["none", "pan", "tilt", "push in", "pull out", "track", "crane", "zoom", "orbit"]);
  const CARRIES = optionsOf("cameraCarry", ["locked", "smooth", "handheld"]);
  const SIZE_COLOR = { wide: "#3f6e8c", medium: "#b8892d", close: "#c45c26", insert: "#6b4f8a" };

  /* Kept across tab switches: the player and the loaded sound. */
  const player = { on: false, raf: 0, t0: 0, f0: 0, frame: 0 };
  const sound = { audio: null, url: "", name: "", peaks: null, duration: 0, note: "" };
  let st = null;
  let api = null;
  let host = null;
  let uid = 1;

  /* ---------- state ---------- */

  function sceneNow() {
    const b = window.CuriosityBoard;
    const s = b && b.scene ? b.scene() : null;
    return s && s.lines && s.lines.length ? s : { id: "none", title: "No scene", lines: [{ who: "—", text: "—" }], people: [] };
  }

  function newId() {
    return "s" + Date.now().toString(36) + (uid++).toString(36);
  }

  function defaultSequence(fps) {
    const s = sceneNow();
    const sizeCycle = ["wide", "medium", "close", "medium", "close", "insert", "close", "wide"];
    const heightCycle = ["eye", "eye", "low", "eye", "high", "eye", "eye", "high"];
    const moveCycle = ["track", "none", "push in", "none", "pan", "none", "push in", "pull out"];
    const carryCycle = ["smooth", "locked", "smooth", "locked", "handheld", "locked", "smooth", "smooth"];
    const shots = s.lines.map((line, i) => {
      const words = String(line.text || "").split(/\s+/).filter(Boolean).length;
      const secs = Math.max(1.5, Math.min(8, 1 + words / 2.6));
      return {
        id: newId(),
        name: "SH" + String((i + 1) * 10).padStart(3, "0"),
        track: 0,
        start: 0,
        dur: Math.round(secs * fps),
        lines: [i],
        shotSize: sizeCycle[i % sizeCycle.length],
        angleHeight: heightCycle[i % heightCycle.length],
        cameraMove: moveCycle[i % moveCycle.length],
        cameraCarry: carryCycle[i % carryCycle.length],
      };
    });
    /* One insert on the top track, overriding the middle of the second shot. */
    if (shots.length > 1) {
      const host0 = shots[0].dur + Math.round(shots[1].dur * 0.4);
      shots.push({
        id: newId(),
        name: "INS015",
        track: 1,
        start: host0,
        dur: Math.max(6, Math.round(fps * 0.75)),
        lines: [1],
        shotSize: "insert",
        angleHeight: "high",
        cameraMove: "none",
        cameraCarry: "locked",
      });
    }
    return { v: 1, sceneId: s.id, fps, loop: true, shots, cuts: [], sel: shots[0] ? shots[0].id : null, frame: 0 };
  }

  function load() {
    const saved = api.store(KEY).get(null);
    if (saved && Array.isArray(saved.shots) && saved.fps) {
      saved.cuts = Array.isArray(saved.cuts) ? saved.cuts : [];
      saved.shots.forEach((x) => {
        x.lines = Array.isArray(x.lines) ? x.lines : [0];
        x.dur = Math.max(1, Math.round(Number(x.dur) || 1));
        x.start = Math.max(0, Math.round(Number(x.start) || 0));
        x.track = x.track === 1 ? 1 : 0;
      });
      return saved;
    }
    return defaultSequence(24);
  }

  function save() {
    st.frame = Math.round(player.frame);
    api.store(KEY).set(st);
  }

  /* ---------- timing ---------- */

  /* Track 1 (bottom) ripples: each clip starts where the last ended. Track 2 sits where it is put. */
  function timed() {
    let at = 0;
    return st.shots.map((x, order) => {
      let s;
      if (x.track === 0) {
        s = at;
        at += x.dur;
      } else s = x.start;
      return { shot: x, order, s, e: s + x.dur };
    });
  }

  function totalFrames(t) {
    t = t || timed();
    return Math.max(1, ...t.map((x) => x.e));
  }

  function activeAt(f, t) {
    t = t || timed();
    const top = t.filter((x) => x.shot.track === 1 && f >= x.s && f < x.e);
    if (top.length) return top[top.length - 1];
    return t.find((x) => x.shot.track === 0 && f >= x.s && f < x.e) || null;
  }

  /* The edit as seen: consecutive intervals with one winning shot. */
  function segments(t) {
    t = t || timed();
    const total = totalFrames(t);
    const marks = new Set([0, total]);
    t.forEach((x) => {
      marks.add(x.s);
      marks.add(x.e);
    });
    const pts = [...marks].filter((m) => m >= 0 && m <= total).sort((a, b) => a - b);
    const out = [];
    for (let k = 0; k < pts.length - 1; k++) {
      const a = pts[k];
      const b = pts[k + 1];
      if (b <= a) continue;
      const w = activeAt(a, t);
      const prev = out[out.length - 1];
      const id = w ? w.shot.id : null;
      if (prev && prev.id === id) prev.e = b;
      else out.push({ id, shot: w ? w.shot : null, s: a, e: b });
    }
    return out;
  }

  function timecode(f, fps) {
    f = Math.max(0, Math.floor(f));
    const ff = f % fps;
    const secs = Math.floor(f / fps);
    const p = (n) => String(n).padStart(2, "0");
    return `${p(Math.floor(secs / 3600))}:${p(Math.floor(secs / 60) % 60)}:${p(secs % 60)}:${p(ff)}`;
  }

  /* ---------- measured curiosities ---------- */

  function measure() {
    const t = timed();
    const segs = segments(t).filter((x) => x.shot);
    const total = totalFrames(t);
    const secs = total / st.fps;
    const cuts = Math.max(0, segs.length - 1);
    const perMin = secs > 0 ? (cuts / secs) * 60 : 0;
    const asl = segs.length ? secs / segs.length : 0;
    const rateWord = perMin < 8 ? "slow" : perMin <= 20 ? "medium" : "fast";
    let onLine = 0;
    let onAction = 0;
    for (let k = 1; k < segs.length; k++) {
      const a = segs[k - 1].shot.lines.join(",");
      const b = segs[k].shot.lines.join(",");
      if (a !== b) onLine++;
      else onAction++;
    }
    const change = !cuts ? "locked" : onLine && onAction ? "both" : onLine ? "on the line" : "on the action";
    return { t, segs, total, secs, cuts, perMin, asl, rateWord, change, onLine, onAction };
  }

  function holdWord(sec) {
    return sec < 2 ? "short" : sec <= 6 ? "medium" : "long";
  }

  /* ---------- drawing ---------- */

  function injectStyle() {
    if (document.getElementById("studio-sequencer")) return;
    const css = document.createElement("style");
    css.id = "studio-sequencer";
    css.textContent = `
.sq-root { min-width: 0; max-width: 100%; overflow-x: hidden; }
.sq-root .studio-grid > * { min-width: 0; }
.sq-root input:not([type=file]), .sq-root select { width: 100%; box-sizing: border-box; max-width: 100%; }
.sq-root .sq-bar select { width: auto; }
.sq-root input[type=file] { max-width: 100%; }
.sq-root .panel { max-width: 100%; box-sizing: border-box; }
.sq-bar { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin: 0 0 10px; }
.sq-bar button, .sq-bar select { font-family: var(--mono); font-size: 11px; }
.sq-bar button.on { background: var(--ink); color: var(--paper); }
.sq-tc { font-family: var(--mono); font-size: 18px; letter-spacing: 0.04em; background: var(--ink); color: var(--paper); padding: 4px 8px; }
.sq-tc small { font-size: 11px; opacity: 0.75; margin-left: 6px; }
.sq-scroll { overflow-x: auto; border: 2px solid var(--ink); background: var(--panel); touch-action: pan-x; }
.sq-inner { position: relative; min-width: 100%; }
.sq-ruler { position: relative; height: 22px; border-bottom: 1px solid var(--ink); cursor: ew-resize; background: #efe5d3; touch-action: none; }
.sq-tick { position: absolute; top: 0; bottom: 0; border-left: 1px solid rgba(28,23,18,0.35); font-family: var(--mono); font-size: 9px; padding-left: 2px; pointer-events: none; }
.sq-lane { position: relative; height: 44px; border-bottom: 1px dashed var(--line); }
.sq-lane.sound { height: 40px; background: #fbf6ec; }
.sq-lane-name { position: absolute; left: 4px; top: 2px; font-family: var(--mono); font-size: 9px; text-transform: uppercase; letter-spacing: 0.06em; opacity: 0.55; pointer-events: none; z-index: 0; }
.sq-clip { position: absolute; top: 12px; bottom: 4px; border: 1px solid var(--ink); color: white; font-family: var(--mono); font-size: 10px; overflow: hidden; white-space: nowrap; padding: 2px 8px; box-sizing: border-box; cursor: grab; touch-action: none; z-index: 1; user-select: none; }
.sq-clip.sel { outline: 3px solid var(--ink); outline-offset: 1px; z-index: 2; }
.sq-clip.live { box-shadow: inset 0 -4px 0 #fff; }
.sq-clip.dragging { opacity: 0.75; cursor: grabbing; z-index: 3; }
.sq-clip .sq-h { position: absolute; top: 0; bottom: 0; width: 8px; background: rgba(255,255,255,0.35); cursor: ew-resize; }
.sq-clip .sq-h.l { left: 0; } .sq-clip .sq-h.r { right: 0; }
.sq-head { position: absolute; top: 0; bottom: 0; width: 0; border-left: 2px solid var(--saffron); pointer-events: none; z-index: 4; }
.sq-cut { position: absolute; top: 0; bottom: 0; width: 0; border-left: 2px dotted #c00; pointer-events: none; }
.sq-wave { position: absolute; left: 0; top: 0; height: 100%; }
.sq-lane.sound canvas.sq-wave { border: 0; background: transparent; width: auto; }
.sq-preview { position: relative; }
.sq-preview .panel { margin: 0; }
.sq-shotname { position: absolute; right: 6px; bottom: 6px; font-family: var(--mono); font-size: 10px; background: var(--ink); color: var(--paper); padding: 2px 5px; }
.sq-strip { display: flex; height: 16px; border: 1px solid var(--ink); margin: 6px 0; }
.sq-strip span { display: block; height: 100%; }
.sq-legend .chip i { display: inline-block; width: 8px; height: 8px; margin-right: 4px; vertical-align: middle; }
.sq-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: 8px; margin: 8px 0; }
.sq-stats div { border: 1px solid var(--line); background: white; padding: 6px 8px; }
.sq-stats b { display: block; font-family: var(--serif); font-size: 20px; font-weight: 500; }
.sq-stats span { font-family: var(--mono); font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; }
.sq-lines { display: flex; flex-wrap: wrap; gap: 4px; }
.sq-lines button { font-family: var(--mono); font-size: 10px; }
.sq-lines button.on { background: var(--ink); color: var(--paper); }
.sq-tablewrap { overflow-x: auto; max-width: 100%; }
.sq-two { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.studio-body svg.sq-bars { border: 1px solid var(--line); background: white; }
.sq-note { font-family: var(--mono); font-size: 11px; color: var(--saffron); }
`;
    document.head.appendChild(css);
  }

  function selected() {
    return st.shots.find((x) => x.id === st.sel) || null;
  }

  function sel(name, label, opts, value) {
    return `<label class="field">${label}
      <select data-k="${name}">${opts.map((o) => `<option ${o === value ? "selected" : ""}>${api.esc(o)}</option>`).join("")}</select></label>`;
  }

  function inspectorHtml(t) {
    const x = selected();
    if (!x) return `<p class="cap">Pick a shot on the track to set its camera.</p>`;
    const esc = api.esc;
    const tt = t.find((y) => y.shot === x);
    const lines = sceneNow().lines;
    return `<h3>Shot</h3>
      <label class="field">Name <input data-k="name" value="${esc(x.name)}" maxlength="24"></label>
      ${sel("shotSize", "Shot size", SIZES, x.shotSize)}
      ${sel("angleHeight", "Angle height", HEIGHTS, x.angleHeight)}
      ${sel("cameraMove", "Camera move", MOVES, x.cameraMove)}
      ${sel("cameraCarry", "Camera carry", CARRIES, x.cameraCarry)}
      <div class="sq-two">
        <label class="field">Start frame <input type="number" min="0" data-k="start" value="${tt.s}" ${x.track === 0 ? 'disabled title="Track 1 ripples; drag to reorder"' : ""}></label>
        <label class="field">End frame <input type="number" min="1" data-k="end" value="${tt.e}"></label>
      </div>
      <label class="field">Track
        <select data-k="track"><option value="0" ${x.track === 0 ? "selected" : ""}>Track 1 (ripple)</option><option value="1" ${x.track === 1 ? "selected" : ""}>Track 2 (overrides)</option></select></label>
      <p class="cap">Lines this shot covers</p>
      <div class="sq-lines">${lines
        .map((l, i) => `<button type="button" data-line="${i}" class="${x.lines.includes(i) ? "on" : ""}" title="${esc(l.text)}">${i + 1} ${esc(l.who)}</button>`)
        .join("")}</div>`;
  }

  function barsSvg(m) {
    const segs = m.segs;
    if (!segs.length) return "";
    const max = Math.max(...segs.map((x) => x.e - x.s));
    const w = 300;
    const h = 90;
    const bw = w / segs.length;
    const bars = segs
      .map((x, k) => {
        const bh = Math.max(2, ((x.e - x.s) / max) * (h - 16));
        const sec = ((x.e - x.s) / st.fps).toFixed(1);
        return `<rect x="${(k * bw + 1).toFixed(1)}" y="${(h - bh).toFixed(1)}" width="${Math.max(1, bw - 2).toFixed(1)}" height="${bh.toFixed(1)}" fill="${SIZE_COLOR[x.shot.shotSize] || "#777"}"><title>${api.esc(x.shot.name)} ${sec}s</title></rect>`;
      })
      .join("");
    return `<svg class="sq-bars" viewBox="0 0 ${w} ${h}" width="100%" role="img" aria-label="Hold length of each shot in the edit">${bars}
      <text x="2" y="10" font-size="9" font-family="monospace">longest ${(max / st.fps).toFixed(1)}s</text></svg>`;
  }

  function measuresHtml(m) {
    const esc = api.esc;
    const strip = m.segs
      .map((x) => `<span title="${esc(x.shot.name)} ${esc(x.shot.shotSize)}" style="flex:${x.e - x.s};background:${SIZE_COLOR[x.shot.shotSize] || "#777"}"></span>`)
      .join("");
    const rows = m.segs
      .map((x, k) => {
        const sec = (x.e - x.s) / st.fps;
        return `<tr><td>${k + 1}</td><td>${esc(x.shot.name)}</td><td>${esc(x.shot.shotSize)}</td><td>${esc(x.shot.angleHeight)}</td><td>${esc(x.shot.cameraMove)} · ${esc(x.shot.cameraCarry)}</td><td class="mono">${sec.toFixed(2)}s</td><td><span class="chip">shotDuration ${holdWord(sec)}</span></td><td>${x.shot.lines.map((i) => i + 1).join(", ")}</td></tr>`;
      })
      .join("");
    return `<h3>Measured from the edit</h3>
      <div class="sq-stats">
        <div><b>${m.perMin.toFixed(1)}</b><span>cutRate · cuts/min · ${m.rateWord}</span></div>
        <div><b>${m.asl.toFixed(2)}s</b><span>average shot length</span></div>
        <div><b>${m.cuts}</b><span>cuts in ${m.secs.toFixed(1)}s</span></div>
        <div><b>${esc(m.change)}</b><span>angleChange · ${m.onLine} on a line, ${m.onAction} inside one</span></div>
      </div>
      <p class="cap">Shot-size rhythm</p>
      <div class="sq-strip">${strip}</div>
      <p class="sq-legend">${SIZES.map((s) => `<span class="chip"><i style="background:${SIZE_COLOR[s] || "#777"}"></i>${esc(s)}</span>`).join("")}</p>
      <p class="cap">Hold lengths (shotDuration bars)</p>
      ${barsSvg(m)}
      <div class="scroll sq-tablewrap"><table class="trace"><thead><tr><th>#</th><th>Shot</th><th>Size</th><th>Height</th><th>Move</th><th>Hold</th><th>Curiosity</th><th>Lines</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  }

  function draw(el, a) {
    api = a;
    host = el;
    el.classList.add("sq-root");
    injectStyle();
    if (!st) {
      st = load();
      player.frame = Number(st.frame) || 0;
    }
    render();
  }

  function render() {
    if (!host) return;
    const esc = api.esc;
    const m = measure();
    const scene = sceneNow();
    const stale = st.sceneId !== scene.id;
    const total = m.total;
    if (player.frame > total) player.frame = 0;
    const pxPerSec = 46;
    const widthPx = Math.ceil((total / st.fps) * pxPerSec);
    host.innerHTML = `
      <div class="sq-bar">
        <button type="button" id="sq-play">${player.on ? "Pause" : "Play"}</button>
        <button type="button" id="sq-stop">Stop</button>
        <button type="button" id="sq-loop" class="${st.loop ? "on" : ""}">Loop</button>
        <span class="sq-tc" id="sq-tc">${timecode(player.frame, st.fps)}<small id="sq-secs">${(player.frame / st.fps).toFixed(2)}s</small></span>
        <select id="sq-fps" aria-label="Frame rate">${RATES.map(([r, l]) => `<option value="${r}" ${r === st.fps ? "selected" : ""}>${l}</option>`).join("")}</select>
      </div>
      <div class="sq-bar">
        <button type="button" id="sq-add">Add shot</button>
        <button type="button" id="sq-dup">Duplicate</button>
        <button type="button" id="sq-split">Split at playhead</button>
        <button type="button" id="sq-del">Delete</button>
        <button type="button" id="sq-reset">Rebuild from scene</button>
        <button type="button" id="sq-board">Send to board</button>
      </div>
      ${stale ? `<p class="sq-note">This edit was built for another scene. Lines are matched by number. Rebuild to start from “${esc(scene.title || scene.id)}”.</p>` : ""}
      <div class="sq-scroll" id="sq-scroll">
        <div class="sq-inner" id="sq-inner" style="width:max(100%, ${widthPx}px)">
          <div class="sq-ruler" id="sq-ruler">${rulerTicks(total)}</div>
          <div class="sq-lane" data-track="1"><span class="sq-lane-name">Track 2 · overrides</span></div>
          <div class="sq-lane" data-track="0"><span class="sq-lane-name">Track 1 · ripple</span></div>
          <div class="sq-lane sound" id="sq-sound"><span class="sq-lane-name">Sound${sound.name ? " · " + esc(sound.name) : ""}</span></div>
          <div class="sq-head" id="sq-head"></div>
        </div>
      </div>
      <div class="sq-bar">
        <label class="field" style="margin:0">Sound file (stays on this device)<input type="file" id="sq-file" accept="audio/*"></label>
        <button type="button" id="sq-cut">Cut marker (C)</button>
        <button type="button" id="sq-tocuts">Split shots at markers</button>
        <button type="button" id="sq-clearcuts">Clear markers</button>
        <span class="cap">${sound.note ? esc(sound.note) : sound.audio ? "Plays in sync. Press C while playing to cut live." : "No sound loaded. Play runs on the clock; C still drops markers."} ${st.cuts.length} marker${st.cuts.length === 1 ? "" : "s"}.</span>
      </div>
      <div class="studio-grid">
        <div id="sq-insp">${inspectorHtml(m.t)}</div>
        <div>
          <div class="sq-preview" id="sq-preview"></div>
          <p class="cap">Ubershot: the winning shot at the playhead, drawn as a board panel. Click or drag the ruler to scrub. Drag a clip to reorder, drag its edges to trim; Track 1 ripples.</p>
          ${measuresHtml(m)}
        </div>
      </div>`;
    layoutClips(total);
    drawSoundLane(total);
    wire(total);
    lastPreview = "";
    tick(true);
  }

  function rulerTicks(total) {
    const secs = total / st.fps;
    const step = secs > 120 ? 10 : secs > 40 ? 5 : 1;
    let out = "";
    for (let s = 0; s <= secs; s += step) {
      out += `<span class="sq-tick" style="left:${((s * st.fps) / total) * 100}%">${s}s</span>`;
    }
    return out;
  }

  function layoutClips(total, t) {
    t = t || timed();
    const lanes = {
      0: host.querySelector('.sq-lane[data-track="0"]'),
      1: host.querySelector('.sq-lane[data-track="1"]'),
    };
    const old = {};
    host.querySelectorAll(".sq-clip").forEach((n) => (old[n.dataset.id] = n));
    t.forEach((x) => {
      const d = old[x.shot.id] || document.createElement("div");
      delete old[x.shot.id];
      d.classList.toggle("sel", x.shot.id === st.sel);
      d.classList.add("sq-clip");
      d.dataset.id = x.shot.id;
      d.style.left = (x.s / total) * 100 + "%";
      d.style.width = (x.shot.dur / total) * 100 + "%";
      d.style.background = SIZE_COLOR[x.shot.shotSize] || "#777";
      d.title = `${x.shot.name}: ${x.shot.shotSize}, ${x.shot.angleHeight}, ${x.shot.cameraMove}, ${x.shot.cameraCarry} · ${x.s}–${x.e}`;
      d.innerHTML = `<span class="sq-h l" data-edge="l"></span>${api.esc(x.shot.name)} ${api.esc(x.shot.shotSize)}<span class="sq-h r" data-edge="r"></span>`;
      if (d.parentNode !== lanes[x.shot.track]) lanes[x.shot.track].appendChild(d);
    });
    Object.values(old).forEach((n) => n.remove());
  }

  function drawSoundLane(total) {
    const lane = host.querySelector("#sq-sound");
    if (!lane) return;
    lane.querySelectorAll(".sq-cut, canvas").forEach((n) => n.remove());
    if (sound.peaks && sound.duration) {
      const frac = Math.min(1, (sound.duration * st.fps) / total);
      const c = document.createElement("canvas");
      c.className = "sq-wave";
      c.width = Math.max(50, Math.round(800 * frac));
      c.height = 40;
      c.style.width = frac * 100 + "%";
      const g = c.getContext("2d");
      const shown = Math.min(sound.duration, total / st.fps) / sound.duration;
      const n = Math.max(1, Math.floor(sound.peaks.length * shown));
      g.fillStyle = "rgba(28,23,18,0.55)";
      for (let x = 0; x < c.width; x++) {
        const p = sound.peaks[Math.floor((x / c.width) * n)] || 0;
        const hgt = Math.max(1, p * 36);
        g.fillRect(x, 20 - hgt / 2, 1, hgt);
      }
      lane.appendChild(c);
    }
    st.cuts.forEach((f) => {
      const d = document.createElement("div");
      d.className = "sq-cut";
      d.style.left = (f / total) * 100 + "%";
      lane.appendChild(d);
    });
  }

  /* ---------- playback ---------- */

  let lastPreview = "";

  function tick(force) {
    const sec = document.getElementById("studio");
    if (!host || !host.isConnected || (sec && sec.classList.contains("hidden"))) {
      stopPlay(true);
      return;
    }
    const t = timed();
    const total = totalFrames(t);
    const tc = host.querySelector("#sq-tc");
    if (tc) tc.innerHTML = `${timecode(player.frame, st.fps)}<small id="sq-secs">${(player.frame / st.fps).toFixed(2)}s</small>`;
    const head = host.querySelector("#sq-head");
    if (head) head.style.left = (Math.min(player.frame, total) / total) * 100 + "%";
    const w = activeAt(Math.min(Math.floor(player.frame), total - 1), t);
    const key = w ? w.shot.id + JSON.stringify(w.shot) : "none";
    if (force || key !== lastPreview) {
      lastPreview = key;
      host.querySelectorAll(".sq-clip.live").forEach((n) => n.classList.remove("live"));
      if (w) {
        const c = host.querySelector(`.sq-clip[data-id="${w.shot.id}"]`);
        if (c) c.classList.add("live");
      }
      const pv = host.querySelector("#sq-preview");
      if (pv) pv.innerHTML = previewHtml(w);
    }
  }

  function previewHtml(w) {
    const b = window.CuriosityBoard;
    if (!w) return `<p class="cap">No shot at the playhead.</p>`;
    const lines = sceneNow().lines;
    const li = (w.shot.lines[0] || 0) % lines.length;
    const values = { shotSize: w.shot.shotSize, angleHeight: w.shot.angleHeight, cameraMove: w.shot.cameraMove, cameraCarry: w.shot.cameraCarry };
    let html = "";
    try {
      html = b && b.panel ? b.panel(lines[li], li, lines.length, values) : "";
    } catch (e) {
      html = `<p class="cap">The board could not draw this panel.</p>`;
    }
    return html + `<span class="sq-shotname">${api.esc(w.shot.name)} · T${w.shot.track + 1}</span>`;
  }

  function loop(now) {
    if (!player.on) return;
    const total = totalFrames();
    const a = sound.audio;
    if (a && !a.paused && a.currentTime < a.duration) player.frame = a.currentTime * st.fps;
    else player.frame = player.f0 + ((now - player.t0) / 1000) * st.fps;
    if (player.frame >= total) {
      if (st.loop) {
        seek(0);
      } else {
        player.frame = total;
        stopPlay(true);
        tick(false);
        return;
      }
    }
    tick(false);
    player.raf = requestAnimationFrame(loop);
  }

  function seek(f) {
    player.frame = Math.max(0, f);
    player.f0 = player.frame;
    player.t0 = performance.now();
    if (sound.audio) {
      try {
        sound.audio.currentTime = Math.min(sound.audio.duration || 0, player.frame / st.fps);
      } catch (e) {}
    }
  }

  function startPlay() {
    if (player.frame >= totalFrames() - 1) player.frame = 0;
    player.on = true;
    seek(player.frame);
    if (sound.audio) {
      const p = sound.audio.play();
      if (p && p.catch) p.catch(() => {});
    }
    cancelAnimationFrame(player.raf);
    player.raf = requestAnimationFrame(loop);
    const b = host && host.querySelector("#sq-play");
    if (b) b.textContent = "Pause";
  }

  function stopPlay(saveIt) {
    player.on = false;
    cancelAnimationFrame(player.raf);
    if (sound.audio) sound.audio.pause();
    const b = host && host.querySelector("#sq-play");
    if (b) b.textContent = "Play";
    if (saveIt && st) save();
  }

  function addCut() {
    const f = Math.round(player.frame);
    if (!st.cuts.includes(f)) st.cuts.push(f);
    st.cuts.sort((a, b) => a - b);
    save();
    drawSoundLane(totalFrames());
  }

  document.addEventListener("keydown", (e) => {
    if (!host || !host.isConnected) return;
    const tag = (e.target && e.target.tagName) || "";
    if (/INPUT|SELECT|TEXTAREA/.test(tag)) return;
    if ((e.key === "c" || e.key === "C") && !e.metaKey && !e.ctrlKey) {
      addCut();
      e.preventDefault();
    } else if (e.key === " ") {
      e.preventDefault();
      player.on ? stopPlay(true) : startPlay();
    }
  });

  /* ---------- editing ---------- */

  function splitShot(x, f, t) {
    const tt = t.find((y) => y.shot === x);
    if (!tt || f <= tt.s || f >= tt.e) return false;
    const b = Object.assign({}, x, { id: newId(), name: x.name + "b", lines: x.lines.slice(), dur: tt.e - f, start: f });
    x.dur = f - tt.s;
    st.shots.splice(st.shots.indexOf(x) + 1, 0, b);
    return true;
  }

  function changeFps(next) {
    const k = next / st.fps;
    st.shots.forEach((x) => {
      x.dur = Math.max(1, Math.round(x.dur * k));
      x.start = Math.round(x.start * k);
    });
    st.cuts = st.cuts.map((f) => Math.round(f * k));
    player.frame = player.frame * k;
    st.fps = next;
  }

  function commit() {
    save();
    render();
  }

  function wire(total) {
    const $ = (s) => host.querySelector(s);
    $("#sq-play").onclick = () => (player.on ? stopPlay(true) : startPlay());
    $("#sq-stop").onclick = () => {
      stopPlay(true);
      seek(0);
      tick(true);
    };
    $("#sq-loop").onclick = (e) => {
      st.loop = !st.loop;
      e.target.classList.toggle("on", st.loop);
      save();
    };
    $("#sq-fps").onchange = (e) => {
      changeFps(Number(e.target.value));
      seek(player.frame);
      commit();
    };
    $("#sq-add").onclick = () => {
      const lines = sceneNow().lines;
      const n = st.shots.filter((x) => x.track === 0).length;
      const cur = selected();
      const shot = {
        id: newId(),
        name: "SH" + String((st.shots.length + 1) * 10).padStart(3, "0"),
        track: cur ? cur.track : 0,
        start: Math.round(player.frame),
        dur: st.fps * 2,
        lines: [n % lines.length],
        shotSize: SIZES[n % SIZES.length],
        angleHeight: HEIGHTS[0],
        cameraMove: MOVES[0],
        cameraCarry: CARRIES[0],
      };
      const at = cur ? st.shots.indexOf(cur) + 1 : st.shots.length;
      st.shots.splice(at, 0, shot);
      st.sel = shot.id;
      commit();
    };
    $("#sq-dup").onclick = () => {
      const x = selected();
      if (!x) return;
      const t = timed();
      const tt = t.find((y) => y.shot === x);
      const d = Object.assign({}, x, { id: newId(), name: x.name + "c", lines: x.lines.slice(), start: tt.e });
      st.shots.splice(st.shots.indexOf(x) + 1, 0, d);
      st.sel = d.id;
      commit();
    };
    $("#sq-split").onclick = () => {
      const t = timed();
      const f = Math.round(player.frame);
      const x = selected();
      const covers = x && t.find((y) => y.shot === x && f > y.s && f < y.e);
      const target = covers ? x : (activeAt(f, t) || {}).shot;
      if (target && splitShot(target, f, t)) commit();
    };
    $("#sq-del").onclick = () => {
      const x = selected();
      if (!x || st.shots.length <= 1) return;
      const i = st.shots.indexOf(x);
      st.shots.splice(i, 1);
      st.sel = (st.shots[i] || st.shots[i - 1] || {}).id || null;
      commit();
    };
    $("#sq-reset").onclick = () => {
      stopPlay(false);
      const keep = { fps: st.fps, loop: st.loop, cuts: st.cuts };
      st = Object.assign(defaultSequence(st.fps), { loop: keep.loop, cuts: keep.cuts });
      player.frame = 0;
      commit();
    };
    $("#sq-board").onclick = () => {
      const b = window.CuriosityBoard;
      const vals = b && b.values ? b.values() : {};
      const n = Math.max(1, Number(vals.angleCount) || 4);
      const segs = segments().filter((x) => x.shot);
      if (!segs.length) return;
      const pick = Array.from({ length: n }, (_, i) => segs[i % segs.length].shot);
      stopPlay(true);
      api.toBoard("Shots", {
        shotSize: pick.map((x) => x.shotSize),
        angleHeight: pick.map((x) => x.angleHeight),
        cameraMove: pick.map((x) => x.cameraMove),
        cameraCarry: pick.map((x) => x.cameraCarry),
        angleChange: [measure().change],
      });
    };
    $("#sq-cut").onclick = addCut;
    $("#sq-clearcuts").onclick = () => {
      st.cuts = [];
      commit();
    };
    $("#sq-tocuts").onclick = () => {
      st.cuts.forEach((f) => {
        const t = timed();
        const x = t.find((y) => y.shot.track === 0 && f > y.s && f < y.e);
        if (x) splitShot(x.shot, f, t);
      });
      commit();
    };
    $("#sq-file").onchange = (e) => loadSound(e.target.files && e.target.files[0]);

    /* Inspector */
    const insp = $("#sq-insp");
    insp.querySelectorAll("[data-k]").forEach((inp) =>
      inp.addEventListener("change", () => {
        const x = selected();
        if (!x) return;
        const k = inp.dataset.k;
        const t = timed();
        const tt = t.find((y) => y.shot === x);
        if (k === "name") x.name = inp.value.trim() || x.name;
        else if (k === "track") {
          x.track = Number(inp.value) === 1 ? 1 : 0;
          x.start = tt.s;
        } else if (k === "start") x.start = Math.max(0, Math.round(Number(inp.value) || 0));
        else if (k === "end") x.dur = Math.max(1, Math.round(Number(inp.value) || 0) - tt.s);
        else x[k] = inp.value;
        commit();
      })
    );
    insp.querySelectorAll("button[data-line]").forEach((btn) =>
      btn.addEventListener("click", () => {
        const x = selected();
        const i = Number(btn.dataset.line);
        if (!x) return;
        if (x.lines.includes(i)) {
          if (x.lines.length > 1) x.lines = x.lines.filter((v) => v !== i);
        } else x.lines = x.lines.concat(i).sort((a, b) => a - b);
        commit();
      })
    );

    /* Ruler scrub */
    const inner = $("#sq-inner");
    const ruler = $("#sq-ruler");
    const frameAt = (clientX, tot) => {
      const r = inner.getBoundingClientRect();
      return Math.max(0, Math.min(tot, ((clientX - r.left) / r.width) * tot));
    };
    ruler.addEventListener("pointerdown", (e) => {
      ruler.setPointerCapture(e.pointerId);
      seek(Math.round(frameAt(e.clientX, total)));
      tick(false);
      const move = (ev) => {
        seek(Math.round(frameAt(ev.clientX, total)));
        tick(false);
      };
      const up = () => {
        ruler.removeEventListener("pointermove", move);
        ruler.removeEventListener("pointerup", up);
        ruler.removeEventListener("pointercancel", up);
        if (!player.on) save();
      };
      ruler.addEventListener("pointermove", move);
      ruler.addEventListener("pointerup", up);
      ruler.addEventListener("pointercancel", up);
    });

    /* Clips: drag to reorder or move, edges to trim. */
    inner.addEventListener("pointerdown", (e) => {
      const clip = e.target.closest && e.target.closest(".sq-clip");
      if (!clip) return;
      e.preventDefault();
      const x = st.shots.find((s) => s.id === clip.dataset.id);
      if (!x) return;
      const edge = e.target.dataset.edge || "";
      const t0 = timed();
      const tt = t0.find((y) => y.shot === x);
      const start = { x: e.clientX, dur: x.dur, s: tt.s, e: tt.e };
      const r = inner.getBoundingClientRect();
      const perPx = total / r.width;
      let moved = false;
      clip.setPointerCapture(e.pointerId);
      clip.classList.add("dragging");
      if (st.sel !== x.id) {
        st.sel = x.id;
        host.querySelectorAll(".sq-clip.sel").forEach((n) => n.classList.remove("sel"));
        clip.classList.add("sel");
      }
      const move = (ev) => {
        const df = Math.round((ev.clientX - start.x) * perPx);
        if (Math.abs(ev.clientX - start.x) > 3 || Math.abs(ev.clientY - e.clientY) > 6) moved = true;
        if (!moved) return;
        if (edge === "r") {
          x.dur = Math.max(1, start.dur + df);
          layoutClips(total);
        } else if (edge === "l") {
          if (x.track === 1) {
            const ns = Math.max(0, Math.min(start.e - 1, start.s + df));
            x.start = ns;
            x.dur = start.e - ns;
          } else x.dur = Math.max(1, start.dur - df);
          layoutClips(total);
        } else {
          clip.style.transform = `translate(${ev.clientX - start.x}px, ${ev.clientY - e.clientY}px)`;
        }
      };
      const up = (ev) => {
        clip.removeEventListener("pointermove", move);
        clip.removeEventListener("pointerup", up);
        clip.removeEventListener("pointercancel", up);
        if (moved && !edge) {
          const lane = laneAt(ev.clientY);
          const track = lane == null ? x.track : lane;
          const df = Math.round((ev.clientX - start.x) * perPx);
          if (track === 1) {
            x.track = 1;
            x.start = Math.max(0, start.s + df);
          } else {
            /* Drop into Track 1 by the clip's new centre. */
            const centre = start.s + df + x.dur / 2;
            st.shots.splice(st.shots.indexOf(x), 1);
            x.track = 0;
            const rest = timed().filter((y) => y.shot.track === 0);
            const after = rest.find((y) => centre < (y.s + y.e) / 2);
            const idx = after ? st.shots.indexOf(after.shot) : st.shots.length;
            st.shots.splice(idx, 0, x);
          }
        }
        commit();
      };
      clip.addEventListener("pointermove", move);
      clip.addEventListener("pointerup", up);
      clip.addEventListener("pointercancel", up);
    });
  }

  function laneAt(y) {
    let hit = null;
    host.querySelectorAll(".sq-lane[data-track]").forEach((l) => {
      const r = l.getBoundingClientRect();
      if (y >= r.top && y <= r.bottom) hit = Number(l.dataset.track);
    });
    return hit;
  }

  /* ---------- sound ---------- */

  function loadSound(file) {
    if (!file) return;
    stopPlay(false);
    if (sound.url) URL.revokeObjectURL(sound.url);
    sound.url = URL.createObjectURL(file);
    sound.audio = new Audio(sound.url);
    sound.name = file.name;
    sound.peaks = null;
    sound.duration = 0;
    sound.note = "Reading the sound…";
    sound.audio.addEventListener("loadedmetadata", () => {
      if (!sound.duration) sound.duration = sound.audio.duration || 0;
    });
    sound.audio.addEventListener("error", () => {
      sound.note = "This browser cannot play that file.";
      sound.audio = null;
      render();
    });
    render();
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC || !file.arrayBuffer) {
      sound.note = "No Web Audio here: the sound plays, but without a waveform.";
      render();
      return;
    }
    file
      .arrayBuffer()
      .then((buf) => {
        const ctx = new AC();
        return new Promise((res, rej) => {
          const p = ctx.decodeAudioData(buf, res, rej);
          if (p && p.then) p.then(res, rej);
        }).finally(() => ctx.close && ctx.close());
      })
      .then((ab) => {
        const data = ab.getChannelData(0);
        const n = 1600;
        const step = Math.max(1, Math.floor(data.length / n));
        const peaks = [];
        let max = 0;
        for (let i = 0; i < n; i++) {
          let p = 0;
          const from = i * step;
          for (let j = from; j < from + step && j < data.length; j += 4) p = Math.max(p, Math.abs(data[j]));
          peaks.push(p);
          max = Math.max(max, p);
        }
        sound.peaks = peaks.map((p) => (max ? p / max : 0));
        sound.duration = ab.duration;
        sound.note = "";
        render();
      })
      .catch(() => {
        sound.note = "Could not decode a waveform; the sound still plays if the browser can.";
        render();
      });
  }

  CuriosityStudio.register({
    id: "sequencer",
    label: "Shots",
    order: 25,
    maya: "Camera Sequencer (shots, ubershot, sequence time), Time Slider and frame rate, Playblast, sound on the timeline",
    draw,
  });
})();
