/* Studio: Camera. A working virtual camera after Maya's Camera Attribute Editor and the Arnold camera:
   focal length, film back, film fit, safe frames, depth of field and motion blur, with real optics.
   Every setting reads back as curiosities (lensLength, depthOfField, motionBlur, aspect, shotSize,
   composition, angleHeight, dutch). The ones the board draws go to the board as a strand. */

(function () {
  if (!window.CuriosityStudio) return;

  const KEY = "curiosities-studio-camera-v1";
  const PERSON = 1.75; /* metres, the person the shot size is measured against */
  const FPS = 24;

  /* Film backs in millimetres (width x height). Maya calls this the camera aperture. */
  const GATES = {
    s35: { label: "Super 35 (24.89 x 18.66)", w: 24.89, h: 18.66 },
    ff: { label: "Full frame (36 x 24)", w: 36, h: 24 },
    m16: { label: "16 mm (10.26 x 7.49)", w: 10.26, h: 7.49 },
    academy: { label: "Academy 35 (21.95 x 16.0)", w: 21.95, h: 16.0 },
    imax: { label: "IMAX 70 (70.41 x 52.63)", w: 70.41, h: 52.63 },
    phone: { label: "Phone (6.17 x 4.55)", w: 6.17, h: 4.55 },
    comic: { label: "Comic panel square (24 x 24)", w: 24, h: 24 },
  };
  const ASPECTS = { "1.33": 4 / 3, "1.85": 1.85, "2.39": 2.39, "1.0": 1, "9:16": 9 / 16 };
  const FITS = ["fill", "horizontal", "vertical", "overscan"];
  const HEIGHTS = { floor: 0.15, low: 0.6, eye: 1.6, high: 2.6, overhead: 6 };
  const PLACES = { "left third": -1 / 6, center: 0, "right third": 1 / 6 };
  const FF_DIAG = Math.hypot(36, 24);

  const DEFAULTS = {
    focal: 35,
    gate: "s35",
    fit: "fill",
    aspect: "1.85",
    distance: 3,
    fstop: 2.8,
    focus: 3,
    focusFollows: true,
    shutter: 180,
    height: "eye",
    dutch: 0,
    place: "left third",
    smear: false,
    safeAction: true,
    safeTitle: false,
    thirds: true,
    mask: true,
  };

  /* Teaching presets. Plain notes, no titles. */
  const PRESETS = [
    { name: "Wide and deep: 18 mm f/11", note: "Short lens, small stop. Near and far both hold; the room feels big and the background reads.", set: { focal: 18, fstop: 11, distance: 2.5, focus: 2.5, height: "eye" } },
    { name: "Normal eye: 40 mm f/4", note: "Close to how the eye judges space on a Super 35 gate. A neutral starting point.", set: { focal: 40, fstop: 4, distance: 3, focus: 3, height: "eye" } },
    { name: "Portrait compression: 85 mm f/1.8", note: "Longer lens, wide stop. The face is sharp, the room melts away and features flatten pleasingly.", set: { focal: 85, fstop: 1.8, distance: 2.2, focus: 2.2, height: "eye" } },
    { name: "Telephoto stack: 200 mm f/4", note: "Stand far back with a long lens. Background figures pile up behind the subject and look closer than they are.", set: { focal: 200, fstop: 4, distance: 15, focus: 15, height: "eye" } },
    { name: "Low hero: 24 mm f/5.6", note: "Camera near the knees, short lens. The subject towers; verticals lean in.", set: { focal: 24, fstop: 5.6, distance: 1.8, focus: 1.8, height: "low" } },
    { name: "Dolly zoom start: 24 mm at 1.5 m", note: "Close and wide. Press the dolly zoom to travel back while the lens lengthens.", set: { focal: 24, fstop: 4, distance: 1.5, focus: 1.5, height: "eye" } },
    { name: "Dolly zoom end: 96 mm at 6 m", note: "Same subject size as the start, four times the distance, four times the focal length. The background grows.", set: { focal: 96, fstop: 4, distance: 6, focus: 6, height: "eye" } },
    { name: "Comic panel: square, 35 mm", note: "A square gate and frame, like a single comic panel. Thirds become a three by three grid.", set: { gate: "comic", aspect: "1.0", fit: "fill", focal: 35, fstop: 8, distance: 3, focus: 3 } },
  ];

  function clamp(v, a, b) {
    return Math.max(a, Math.min(b, v));
  }
  function deg(r) {
    return (r * 180) / Math.PI;
  }
  function fmtM(m) {
    if (!isFinite(m)) return "infinity";
    return m < 10 ? m.toFixed(2) + " m" : m.toFixed(1) + " m";
  }

  /* All the optics in one place. Distances in metres, sensor sizes in millimetres. */
  function optics(s) {
    const g = GATES[s.gate] || GATES.s35;
    const ar = ASPECTS[s.aspect] || 1.85;
    const gateAr = g.w / g.h;
    let fit = s.fit;
    if (fit === "fill") fit = ar > gateAr ? "horizontal" : "vertical";
    else if (fit === "overscan") fit = ar > gateAr ? "vertical" : "horizontal";
    /* Frame actually recorded, on the film back. Horizontal fit keeps the gate width, vertical keeps its height. */
    const fw = fit === "horizontal" ? g.w : g.h * ar;
    const fh = fit === "horizontal" ? g.w / ar : g.h;
    const f = s.focal;
    const hAov = 2 * Math.atan(fw / (2 * f));
    const vAov = 2 * Math.atan(fh / (2 * f));
    const coc = Math.hypot(g.w, g.h) / 1500; /* circle of confusion scaled to the gate */
    const N = s.fstop;
    const fM = f / 1000;
    const cM = coc / 1000;
    const H = (fM * fM) / (N * cM) + fM; /* hyperfocal, metres */
    const sFocus = Math.max(s.focus, fM * 1.01);
    const near = (sFocus * (H - fM)) / (H + sFocus - 2 * fM);
    const far = sFocus < H ? (sFocus * (H - fM)) / (H - sFocus) : Infinity;
    const total = far - near;
    const frameH = (s.distance * fh) / f; /* metres of the subject plane the frame height covers */
    const ratio = frameH / PERSON;
    const shotSize = ratio >= 1.2 ? "wide" : ratio >= 0.5 ? "medium" : ratio >= 0.17 ? "close" : "insert";
    const exposure = s.shutter / 360 / FPS;
    const crop = FF_DIAG / Math.hypot(g.w, g.h);
    return { g, ar, fit, fw, fh, f, hAov, vAov, coc, N, H, near, far, total, frameH, ratio, shotSize, exposure, crop, sFocus };
  }

  /* Blur circle on the film back (mm) for something at distance x when focused at s. */
  function blurMm(o, x) {
    const fM = o.f / 1000;
    const s = o.sFocus;
    const b = ((fM * fM) / (o.N * (s - fM))) * (Math.abs(x - s) / x);
    return b * 1000;
  }

  function curiosities(s, o) {
    const eq = o.f * o.crop;
    const dofWord = !isFinite(o.far) || o.total > s.distance * 1.5 ? "deep" : o.total < s.distance * 0.15 ? "shallow" : "medium";
    const blurWord = s.shutter <= 90 ? "none" : s.shutter <= 200 ? "light" : "heavy";
    return [
      { id: "lensLength", value: eq < 35 ? "wide" : eq <= 70 ? "normal" : "long", note: `${Math.round(s.focal)} mm (${Math.round(eq)} mm full-frame equivalent)` },
      { id: "depthOfField", value: dofWord, note: `f/${s.fstop}` },
      { id: "motionBlur", value: blurWord, note: `shutter ${s.shutter}°` },
      { id: "aspect", value: ["1.33", "1.85", "2.39"].indexOf(s.aspect) >= 0 ? s.aspect : "custom", note: s.aspect },
      { id: "shotSize", value: o.shotSize, note: `${Math.round(o.ratio * 100)}% of a person tall`, board: true },
      { id: "composition", value: s.place, note: "" },
      { id: "angleHeight", value: s.height, note: `${HEIGHTS[s.height]} m`, board: true },
      { id: "dutch", value: Math.abs(s.dutch) >= 1 ? "tilted" : "level", note: `${s.dutch}°`, board: true },
    ];
  }

  function injectStyle() {
    if (document.getElementById("studio-camera")) return;
    const st = document.createElement("style");
    st.id = "studio-camera";
    st.textContent = `
      .cam-tool .cam-row { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; margin: 0 0 12px; }
      .cam-tool .cam-row label { font-family: var(--mono); font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; display: inline-flex; gap: 4px; align-items: center; }
      .cam-tool button { font-family: var(--mono); font-size: 11px; border: 1px solid var(--ink); background: var(--panel); padding: 4px 8px; cursor: pointer; }
      .cam-tool button.primary { background: var(--ink); color: var(--paper); }
      .cam-tool .cam-val { font-family: var(--mono); font-size: 11px; text-transform: none; letter-spacing: 0; color: var(--saffron); }
      .cam-tool .cam-presets { display: grid; gap: 4px; margin: 0 0 12px; }
      .cam-tool .cam-presets button { text-align: left; }
      .cam-tool .cam-note { min-height: 2.6em; margin: 0 0 12px; }
      .cam-tool .cam-views { display: grid; gap: 10px; min-width: 0; }
      .cam-tool .cam-views canvas { max-width: 100%; }
      .cam-tool table.trace { width: 100%; border-collapse: collapse; }
      .cam-tool table.trace td { padding: 3px 6px; border-bottom: 1px solid var(--line); vertical-align: top; }
      .cam-tool table.trace td:last-child { font-family: var(--mono); font-size: 12px; text-align: right; white-space: nowrap; }
      .cam-tool .chip small { opacity: 0.65; }
      .cam-tool .cam-controls { min-width: 0; }
      .cam-tool.studio-grid { grid-template-columns: minmax(220px, 300px) minmax(0, 1fr); }
      @media (max-width: 760px) {
        .cam-tool.studio-grid { grid-template-columns: minmax(0, 1fr); }
        .cam-tool table.trace td:last-child { white-space: normal; }
      }
    `;
    document.head.appendChild(st);
  }

  function draw(el, api) {
    injectStyle();
    const esc = api.esc;
    const box = api.store(KEY);
    const s = Object.assign({}, DEFAULTS, box.get({}) || {});
    let anim = null;
    let lastNote = "Pick a preset, or move a control. The viewfinder and the plan redraw with real optics.";

    const range = (key, label, min, max, step, unit) => `<label class="field">${esc(label)} <span class="cam-val" data-val="${key}"></span>
        <input type="range" data-k="${key}" min="${min}" max="${max}" step="${step}" value="${esc(s[key])}" aria-label="${esc(label)}${unit ? " in " + unit : ""}"></label>`;
    const select = (key, label, opts) => `<label class="field">${esc(label)}
        <select data-k="${key}">${opts.map(([v, t]) => `<option value="${esc(v)}"${String(s[key]) === String(v) ? " selected" : ""}>${esc(t)}</option>`).join("")}</select></label>`;
    const check = (key, label) => `<label><input type="checkbox" data-k="${key}"${s[key] ? " checked" : ""}> ${esc(label)}</label>`;

    el.innerHTML = `<div class="studio-grid cam-tool">
      <div class="cam-controls">
        <p class="group-label">Lens presets</p>
        <div class="cam-presets">${PRESETS.map((p, i) => `<button type="button" data-preset="${i}">${esc(p.name)}</button>`).join("")}</div>
        <p class="cap cam-note" id="cam-note"></p>
        ${range("focal", "Focal length", 12, 300, 1, "mm")}
        ${select("gate", "Film back / gate", Object.entries(GATES).map(([k, g]) => [k, g.label]))}
        ${select("fit", "Film fit", FITS.map((f) => [f, f]))}
        ${select("aspect", "Aspect ratio", Object.keys(ASPECTS).map((a) => [a, a]))}
        ${range("distance", "Subject distance", 0.5, 20, 0.1, "m")}
        ${range("fstop", "F-stop", 1.4, 22, 0.1, "")}
        ${range("focus", "Focus distance", 0.3, 40, 0.1, "m")}
        <div class="cam-row">${check("focusFollows", "Focus follows subject")}</div>
        ${range("shutter", "Shutter angle", 45, 360, 5, "degrees")}
        ${select("height", "Camera height", Object.keys(HEIGHTS).map((h) => [h, `${h} (${HEIGHTS[h]} m)`]))}
        ${range("dutch", "Dutch tilt", -45, 45, 1, "degrees")}
        ${select("place", "Subject placement", Object.keys(PLACES).map((p) => [p, p]))}
        <p class="group-label">Overlays</p>
        <div class="cam-row">${check("safeAction", "Safe action")}${check("safeTitle", "Safe title")}${check("thirds", "Thirds")}${check("mask", "Gate mask")}${check("smear", "Motion smear")}</div>
        <div class="cam-row">
          <button type="button" id="cam-dolly">Dolly zoom</button>
          <button type="button" id="cam-rack">Rack focus to subject</button>
          <button type="button" id="cam-reset">Reset</button>
        </div>
      </div>
      <div class="cam-views">
        <canvas id="cam-view" width="720" height="420" aria-label="Viewfinder"></canvas>
        <canvas id="cam-plan" width="720" height="220" aria-label="Top-down plan"></canvas>
        <p class="cap">Plan: camera at left, view cone from the horizontal angle of view, shaded band is acceptable focus. Gold person is the subject, grey the background figure, square the foreground object.</p>
        <table class="trace"><tbody id="cam-read"></tbody></table>
        <p class="group-label">Curiosities this setup produces</p>
        <div id="cam-chips"></div>
        <div class="cam-row">
          <button type="button" class="primary" id="cam-send">Send to board</button>
          <button type="button" id="cam-keep">Keep on Shelf</button>
          <span class="cap" id="cam-send-note"></span>
        </div>
      </div>
    </div>`;

    const view = el.querySelector("#cam-view");
    const plan = el.querySelector("#cam-plan");

    function save() {
      box.set(s);
    }

    function syncInputs() {
      el.querySelectorAll("[data-k]").forEach((inp) => {
        const k = inp.dataset.k;
        if (inp.type === "checkbox") inp.checked = !!s[k];
        else if (String(inp.value) !== String(s[k])) inp.value = s[k];
      });
    }

    function render() {
      const o = optics(s);
      const vals = {
        focal: `${Math.round(s.focal)} mm`,
        distance: fmtM(s.distance),
        fstop: `f/${Number(s.fstop).toFixed(1)}`,
        focus: s.focusFollows ? `${fmtM(s.focus)} (follows)` : fmtM(s.focus),
        shutter: `${s.shutter}°`,
        dutch: `${s.dutch}°`,
      };
      el.querySelectorAll("[data-val]").forEach((n) => (n.textContent = vals[n.dataset.val] || ""));
      el.querySelector("#cam-note").textContent = lastNote;
      el.querySelector(`[data-k="focus"]`).disabled = !!s.focusFollows;

      const rows = [
        ["Recorded frame on film back", `${o.fw.toFixed(2)} x ${o.fh.toFixed(2)} mm (${o.fit} fit)`],
        ["Horizontal angle of view", `${deg(o.hAov).toFixed(1)}°`],
        ["Vertical angle of view", `${deg(o.vAov).toFixed(1)}°`],
        ["Full-frame equivalent", `${Math.round(s.focal * o.crop)} mm (crop ${o.crop.toFixed(2)})`],
        ["Frame height at subject", `${o.frameH.toFixed(2)} m (${Math.round(o.ratio * 100)}% of 1.75 m)`],
        ["Shot size", o.shotSize],
        ["Circle of confusion", `${(o.coc * 1000).toFixed(1)} µm`],
        ["Hyperfocal distance", fmtM(o.H)],
        ["Near limit of focus", fmtM(o.near)],
        ["Far limit of focus", fmtM(o.far)],
        ["Depth of field", isFinite(o.total) ? fmtM(o.total) : "to infinity"],
        ["Exposure at 24 fps", `1/${Math.round(1 / o.exposure)} s (${(o.exposure * 1000).toFixed(1)} ms)`],
      ];
      el.querySelector("#cam-read").innerHTML = rows.map(([a, b]) => `<tr><td>${esc(a)}</td><td>${esc(b)}</td></tr>`).join("");
      el.querySelector("#cam-chips").innerHTML = curiosities(s, o)
        .map((c) => `<span class="chip${c.board ? " lit" : ""}" title="${c.board ? "The board draws this one" : "Kept on the Shelf or in a study"}">${esc(c.id)}: ${esc(c.value)}${c.note ? ` <small>${esc(c.note)}</small>` : ""}</span>`)
        .join("");
      drawView(o);
      drawPlan(o);
    }

    /* The three things in the scene, in world metres. X is across, Z is away from the lens. */
    function sceneObjects(o) {
      const d = s.distance;
      const sx = PLACES[s.place] || 0;
      const subjX = (sx * o.fw * d) / o.f; /* lateral offset that lands on the chosen third */
      const side = sx > 0 ? -1 : 1;
      const bgZ = d * 2.5 + 3;
      const fgZ = Math.max(0.35, d * 0.4);
      return [
        { kind: "person", tone: "bg", x: subjX + side * Math.max(0.8, (o.fw * bgZ) / o.f / 4), z: bgZ, h: 1.7 },
        { kind: "person", tone: "subject", x: subjX, z: d, h: PERSON },
        { kind: "object", tone: "fg", x: subjX + side * Math.max(0.35, (o.fw * fgZ) / o.f / 3), z: fgZ, y0: 0.75, h: 0.35, w: 0.22 },
      ];
    }

    function drawView(o) {
      const ctx = view.getContext("2d");
      const W = view.width;
      const Hc = view.height;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.filter = "none";
      ctx.fillStyle = "#1c1712";
      ctx.fillRect(0, 0, W, Hc);

      /* Fit both the gate and the recorded frame inside the canvas. */
      const spanW = Math.max(o.fw, o.g.w);
      const spanH = Math.max(o.fh, o.g.h);
      const k = Math.min((W - 24) / spanW, (Hc - 24) / spanH); /* px per mm */
      const cx = W / 2;
      const cy = Hc / 2;
      const frW = o.fw * k;
      const frH = o.fh * k;
      const fx = cx - frW / 2;
      const fy = cy - frH / 2;
      const gW = o.g.w * k;
      const gH = o.g.h * k;

      /* Camera aims at the subject: the body centre for a wide frame, the eyes for a tight one. */
      const camH = HEIGHTS[s.height] || 1.6;
      const aimY = clamp(PERSON - o.frameH * 0.42, 0.9, 1.62);
      const pitch = Math.atan2(aimY - camH, s.distance);
      const sp = Math.sin(pitch);
      const cp = Math.cos(pitch);
      function proj(X, Y, Z) {
        const dy = Y - camH;
        const zc = dy * sp + Z * cp;
        const yc = dy * cp - Z * sp;
        if (zc <= 0.05) return null;
        return [cx + ((o.f * X) / zc) * k, cy - ((o.f * yc) / zc) * k, zc];
      }

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate((s.dutch * Math.PI) / 180);
      ctx.translate(-cx, -cy);
      /* Sky and floor split at the horizon (a point at infinity sits at -f tan(pitch)). */
      const horizon = cy + o.f * Math.tan(pitch) * k;
      const big = Math.hypot(W, Hc);
      ctx.fillStyle = "#e9dcc6";
      ctx.fillRect(cx - big, cy - big, big * 2, big * 2);
      ctx.fillStyle = "#cdb48f";
      ctx.fillRect(cx - big, horizon, big * 2, big * 2);
      ctx.strokeStyle = "rgba(28,23,18,0.35)";
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(cx - big, horizon);
      ctx.lineTo(cx + big, horizon);
      ctx.stroke();
      ctx.setLineDash([]);
      /* Floor lines every metre, to read perspective. */
      ctx.strokeStyle = "rgba(28,23,18,0.12)";
      for (let z = 1; z <= 40; z += z < 10 ? 1 : 5) {
        const a = proj(-30, 0, z);
        const b = proj(30, 0, z);
        if (!a || !b) continue;
        ctx.beginPath();
        ctx.moveTo(a[0], a[1]);
        ctx.lineTo(b[0], b[1]);
        ctx.stroke();
      }

      const objs = sceneObjects(o).sort((a, b) => b.z - a.z);
      const smearM = s.smear ? 1.5 * o.exposure : 0; /* subject crossing at 1.5 m/s */
      objs.forEach((ob) => {
        const blurPx = clamp((blurMm(o, ob.z) * k) / 2, 0, 40);
        ctx.filter = blurPx > 0.3 ? `blur(${blurPx.toFixed(1)}px)` : "none";
        const passes = ob.tone === "subject" && smearM > 0 ? 6 : 1;
        for (let p = 0; p < passes; p++) {
          const dx = passes > 1 ? (p / (passes - 1) - 0.5) * smearM : 0;
          ctx.globalAlpha = passes > 1 ? 0.3 : 1;
          if (ob.kind === "person") drawPerson(ctx, proj, ob.x + dx, ob.z, ob.h, ob.tone);
          else drawObject(ctx, proj, ob);
        }
        ctx.globalAlpha = 1;
      });
      ctx.filter = "none";
      ctx.restore();

      /* Gate mask: darken outside the recorded frame. Gate outline dashed, as in Maya's film gate. */
      ctx.fillStyle = s.mask ? "rgba(20,16,12,0.92)" : "rgba(20,16,12,0.25)";
      ctx.beginPath();
      ctx.rect(0, 0, W, Hc);
      ctx.rect(fx, fy, frW, frH);
      ctx.fill("evenodd");
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.strokeRect(fx, fy, frW, frH);
      ctx.lineWidth = 1;
      ctx.strokeStyle = "#c45c26";
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(cx - gW / 2, cy - gH / 2, gW, gH);
      ctx.setLineDash([]);

      if (s.thirds) {
        ctx.strokeStyle = "rgba(255,255,255,0.7)";
        ctx.beginPath();
        for (let i = 1; i < 3; i++) {
          ctx.moveTo(fx + (frW * i) / 3, fy);
          ctx.lineTo(fx + (frW * i) / 3, fy + frH);
          ctx.moveTo(fx, fy + (frH * i) / 3);
          ctx.lineTo(fx + frW, fy + (frH * i) / 3);
        }
        ctx.stroke();
      }
      function safe(frac, color, label) {
        const w = frW * frac;
        const h = frH * frac;
        ctx.strokeStyle = color;
        ctx.strokeRect(cx - w / 2, cy - h / 2, w, h);
        ctx.fillStyle = color;
        ctx.font = "10px ui-monospace, monospace";
        ctx.fillText(label, cx - w / 2 + 4, cy - h / 2 + 12);
      }
      if (s.safeAction) safe(0.9, "#7fd1a8", "SAFE ACTION");
      if (s.safeTitle) safe(0.8, "#f2c14e", "SAFE TITLE");

      ctx.fillStyle = "#fff";
      ctx.font = "11px ui-monospace, monospace";
      ctx.fillText(`${Math.round(s.focal)}mm  f/${Number(s.fstop).toFixed(1)}  ${s.shutter}°  ${s.aspect}  ${o.shotSize.toUpperCase()}`, 8, Hc - 8);
    }

    function drawPerson(ctx, proj, X, Z, h, tone) {
      const feet = proj(X, 0, Z);
      const head = proj(X, h, Z);
      if (!feet || !head) return;
      const zc = feet[2];
      const pxPerM = Math.abs(feet[1] - head[1]) / h || 1;
      const sc = (o) => o * pxPerM;
      const x = feet[0];
      const top = head[1];
      const fill = tone === "subject" ? "#b8892d" : "#6f665c";
      ctx.fillStyle = fill;
      /* head */
      ctx.beginPath();
      ctx.ellipse(x, top + sc(0.12), sc(0.09), sc(0.12), 0, 0, Math.PI * 2);
      ctx.fill();
      /* torso */
      ctx.beginPath();
      ctx.moveTo(x - sc(0.22), top + sc(0.3));
      ctx.lineTo(x + sc(0.22), top + sc(0.3));
      ctx.lineTo(x + sc(0.17), top + sc(0.9));
      ctx.lineTo(x - sc(0.17), top + sc(0.9));
      ctx.closePath();
      ctx.fill();
      /* legs */
      ctx.fillRect(x - sc(0.16), top + sc(0.88), sc(0.13), feet[1] - top - sc(0.88));
      ctx.fillRect(x + sc(0.03), top + sc(0.88), sc(0.13), feet[1] - top - sc(0.88));
      /* arms */
      ctx.fillRect(x - sc(0.3), top + sc(0.32), sc(0.08), sc(0.55));
      ctx.fillRect(x + sc(0.22), top + sc(0.32), sc(0.08), sc(0.55));
      if (tone === "subject") {
        ctx.fillStyle = "#1c1712";
        ctx.beginPath();
        ctx.arc(x + sc(0.035), top + sc(0.1), Math.max(1, sc(0.012)), 0, Math.PI * 2);
        ctx.arc(x - sc(0.035), top + sc(0.1), Math.max(1, sc(0.012)), 0, Math.PI * 2);
        ctx.fill();
      }
      return zc;
    }

    function drawObject(ctx, proj, ob) {
      const a = proj(ob.x - ob.w / 2, ob.y0 + ob.h, ob.z);
      const b = proj(ob.x + ob.w / 2, ob.y0, ob.z);
      const stem = proj(ob.x, 0, ob.z);
      if (!a || !b) return;
      ctx.fillStyle = "#3d5a6c";
      ctx.fillRect(a[0], a[1], b[0] - a[0], b[1] - a[1]);
      if (stem) {
        ctx.fillStyle = "#2a2520";
        const w = Math.max(2, (b[0] - a[0]) * 0.15);
        ctx.fillRect((a[0] + b[0]) / 2 - w / 2, b[1], w, stem[1] - b[1]);
      }
    }

    function drawPlan(o) {
      const ctx = plan.getContext("2d");
      const W = plan.width;
      const H = plan.height;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = "#fffaf2";
      ctx.fillRect(0, 0, W, H);
      const objs = sceneObjects(o);
      const maxZ = Math.max(...objs.map((x) => x.z), s.focus) * 1.08 + 0.5;
      const m = (W - 40) / maxZ; /* px per metre */
      const ox = 24;
      const oy = H / 2;
      const P = (x, z) => [ox + z * m, oy + x * m];
      /* in-focus band */
      const nearZ = clamp(o.near, 0, maxZ);
      const farZ = isFinite(o.far) ? clamp(o.far, 0, maxZ) : maxZ;
      ctx.fillStyle = "rgba(184,137,45,0.22)";
      ctx.fillRect(ox + nearZ * m, 0, (farZ - nearZ) * m, H);
      ctx.strokeStyle = "rgba(184,137,45,0.9)";
      ctx.beginPath();
      ctx.moveTo(ox + s.focus * m, 0);
      ctx.lineTo(ox + s.focus * m, H);
      ctx.stroke();
      /* metre ticks */
      ctx.fillStyle = "#3a3229";
      ctx.font = "10px ui-monospace, monospace";
      const step = maxZ > 20 ? 5 : maxZ > 8 ? 2 : 1;
      for (let z = step; z < maxZ; z += step) {
        ctx.fillRect(ox + z * m, H - 6, 1, 6);
        ctx.fillText(`${z}m`, ox + z * m + 2, H - 8);
      }
      /* view cone */
      const half = o.hAov / 2;
      const reach = maxZ * 1.5;
      ctx.fillStyle = "rgba(196,92,38,0.12)";
      ctx.strokeStyle = "#c45c26";
      ctx.beginPath();
      ctx.moveTo(ox, oy);
      ctx.lineTo(...P(-Math.tan(half) * reach, reach));
      ctx.lineTo(...P(Math.tan(half) * reach, reach));
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      /* camera */
      ctx.fillStyle = "#1c1712";
      ctx.fillRect(ox - 16, oy - 7, 16, 14);
      /* things */
      objs.forEach((ob) => {
        const [px, py] = P(ob.x, ob.z);
        ctx.fillStyle = ob.tone === "subject" ? "#b8892d" : ob.tone === "bg" ? "#6f665c" : "#3d5a6c";
        ctx.beginPath();
        if (ob.kind === "person") ctx.arc(px, py, Math.max(3, 0.25 * m), 0, Math.PI * 2);
        else ctx.rect(px - Math.max(2, 0.11 * m), py - Math.max(2, 0.11 * m), Math.max(4, 0.22 * m), Math.max(4, 0.22 * m));
        ctx.fill();
      });
      ctx.fillStyle = "#1c1712";
      ctx.fillText(`AOV ${deg(o.hAov).toFixed(1)}°   focus ${fmtM(s.focus)}   sharp ${fmtM(o.near)} to ${fmtM(o.far)}`, 8, 14);
    }

    function update() {
      if (s.focusFollows) s.focus = s.distance;
      save();
      render();
    }

    el.querySelectorAll("[data-k]").forEach((inp) => {
      const ev = inp.tagName === "SELECT" || inp.type === "checkbox" ? "change" : "input";
      inp.addEventListener(ev, () => {
        const k = inp.dataset.k;
        if (inp.type === "checkbox") s[k] = inp.checked;
        else if (inp.type === "range") s[k] = Number(inp.value);
        else s[k] = inp.value;
        update();
      });
    });

    el.querySelectorAll("[data-preset]").forEach((b) =>
      b.addEventListener("click", () => {
        const p = PRESETS[Number(b.dataset.preset)];
        Object.assign(s, p.set);
        lastNote = p.note;
        if (s.focusFollows) s.focus = s.distance;
        syncInputs();
        update();
      })
    );

    el.querySelector("#cam-rack").addEventListener("click", () => {
      s.focusFollows = false;
      const from = s.focus;
      const to = s.distance;
      const t0 = performance.now();
      lastNote = "Rack focus: the sharp band slides to the subject. Watch the foreground and background trade blur.";
      cancelAnimationFrame(anim);
      const step = (t) => {
        const u = clamp((t - t0) / 900, 0, 1);
        s.focus = Math.round((from + (to - from) * (1 - Math.cos(u * Math.PI)) / 2) * 100) / 100;
        syncInputs();
        save();
        render();
        if (u < 1 && view.isConnected) anim = requestAnimationFrame(step);
      };
      anim = requestAnimationFrame(step);
    });

    /* Dolly zoom: frame height at the subject is distance x gate height / focal, so keep
       focal / distance constant while the camera travels. The background grows or shrinks. */
    el.querySelector("#cam-dolly").addEventListener("click", () => {
      cancelAnimationFrame(anim);
      const d0 = s.distance;
      const f0 = s.focal;
      const ratio = f0 / d0;
      const dMaxByLens = 300 / ratio;
      const dMinByLens = 12 / ratio;
      let d1 = d0 < 4 ? d0 * 4 : d0 / 4;
      d1 = clamp(d1, Math.max(0.5, dMinByLens), Math.min(20, dMaxByLens));
      if (Math.abs(d1 - d0) < 0.2) d1 = clamp(d0 < 4 ? Math.min(20, dMaxByLens) : Math.max(0.5, dMinByLens), 0.5, 20);
      lastNote = `Dolly zoom: ${d0.toFixed(1)} m to ${d1.toFixed(1)} m while the lens goes ${Math.round(f0)} mm to ${Math.round(d1 * ratio)} mm. The subject holds its size; the room changes around it.`;
      const t0 = performance.now();
      const step = (t) => {
        const u = clamp((t - t0) / 3000, 0, 1);
        const e = (1 - Math.cos(u * Math.PI)) / 2;
        s.distance = Math.round((d0 + (d1 - d0) * e) * 100) / 100;
        s.focal = clamp(s.distance * ratio, 12, 300);
        s.focus = s.focusFollows ? s.distance : s.focus;
        syncInputs();
        save();
        render();
        if (u < 1 && view.isConnected) anim = requestAnimationFrame(step);
        else s.focal = Math.round(s.focal);
      };
      anim = requestAnimationFrame(step);
    });

    el.querySelector("#cam-reset").addEventListener("click", () => {
      cancelAnimationFrame(anim);
      Object.keys(s).forEach((k) => delete s[k]);
      Object.assign(s, DEFAULTS);
      lastNote = "Back to a 35 mm lens on Super 35 at 1.85.";
      syncInputs();
      update();
    });

    /* Only shotSize, angleHeight and dutch are drawn by the board, so only those go. */
    el.querySelector("#cam-send").addEventListener("click", () => {
      const o = optics(s);
      const values = {};
      curiosities(s, o)
        .filter((c) => c.board)
        .forEach((c) => (values[c.id] = [c.value, c.value, c.value, c.value]));
      if (!api.board) {
        el.querySelector("#cam-send-note").textContent = "The board is not loaded.";
        return;
      }
      api.toBoard("Camera", values);
    });

    /* The Shelf keeps the whole setup, one beat: every curiosity it produces. */
    el.querySelector("#cam-keep").addEventListener("click", () => {
      const values = {};
      curiosities(s, optics(s)).forEach((c) => (values[c.id] = [c.value]));
      api.toShelf("Camera setup", values);
    });

    if (s.focusFollows) s.focus = s.distance;
    el.querySelector("#cam-send-note").textContent = "Sends shot size, angle height and dutch (the lit chips) to every panel.";
    render();
  }

  window.CuriosityStudio.register({
    id: "camera",
    label: "Camera",
    order: 20,
    maya: "Camera Attribute Editor: focal length, film back, film fit, safe frames, depth of field, motion blur (Maya cameras and Arnold camera)",
    draw,
  });
})();
