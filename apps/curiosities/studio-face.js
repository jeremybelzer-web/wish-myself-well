/* Face: Maya blend shapes, a pose library and lip sync on one drawn face.
   Each slider is a blend shape target weight (0 to 1). Poses are saved sets of weights, like a
   Pose Library. A line of text becomes mouth shapes per second, the way animators break down
   dialogue. Curiosities: faceIntensity, lipSync, poseRate, gazeShift, blink. */

(function () {
  if (!window.CuriosityStudio) return;
  const KEY = "curiosities-studio-face-v1";
  const TARGETS = [
    ["browUp", "Brows up"],
    ["browKnit", "Brows knit"],
    ["eyeWide", "Eyes wide"],
    ["eyeSquint", "Eyes squint"],
    ["smile", "Smile"],
    ["frown", "Frown"],
    ["jawOpen", "Jaw open"],
    ["lipsPress", "Lips press"],
    ["sneer", "Sneer"],
    ["look", "Look left to right"],
  ];
  const POSES = {
    neutral: {},
    joy: { smile: 0.9, eyeSquint: 0.4, browUp: 0.3 },
    sorrow: { frown: 0.7, browUp: 0.6, browKnit: 0.5, eyeSquint: 0.2 },
    anger: { browKnit: 1, frown: 0.4, lipsPress: 0.7, eyeSquint: 0.3 },
    fear: { browUp: 0.9, browKnit: 0.5, eyeWide: 1, jawOpen: 0.3, frown: 0.3 },
    surprise: { browUp: 1, eyeWide: 0.9, jawOpen: 0.7 },
    disgust: { sneer: 1, browKnit: 0.5, eyeSquint: 0.5, frown: 0.3 },
    contempt: { sneer: 0.5, smile: 0.25, look: 0.25 },
    deadpan: { lipsPress: 0.3, eyeSquint: 0.15 },
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

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function faceSvg(w, mouth, blink) {
    const g = (k) => w[k] || 0;
    const bu = g("browUp") * 10, bk = g("browKnit") * 8, ew = 1 + g("eyeWide") * 0.5 - g("eyeSquint") * 0.55;
    const eyeH = Math.max(0.6, 9 * ew * (blink ? 0.08 : 1));
    const look = (g("look") - 0.5) * 2 * 5;
    const jaw = mouth ? mouth[0] : g("jawOpen");
    const width = mouth ? mouth[1] : 0.5 + g("smile") * 0.3 - g("lipsPress") * 0.1;
    const round = mouth ? mouth[2] : 0;
    const curve = (g("smile") - g("frown")) * 14;
    const mw = 22 + width * 28 - round * 12;
    const mh = 2 + jaw * 26 - g("lipsPress") * 2;
    const sneer = g("sneer") * 6;
    const brow = (x, dir) => `<path d="M${x - 16} ${72 - bu + (dir * bk) / 2} Q ${x} ${64 - bu - bk / 2} ${x + 16} ${72 - bu - (dir * bk) / 2}" stroke="#1c1712" stroke-width="4" fill="none" stroke-linecap="round"/>`;
    return `<svg class="view" viewBox="0 0 240 240" role="img" aria-label="Face">
      <ellipse cx="120" cy="120" rx="82" ry="98" fill="#f3d6b8" stroke="#1c1712" stroke-width="3"/>
      ${brow(88, -1)}${brow(152, 1)}
      <ellipse cx="88" cy="96" rx="13" ry="${eyeH}" fill="#fff" stroke="#1c1712" stroke-width="2"/>
      <ellipse cx="152" cy="96" rx="13" ry="${eyeH}" fill="#fff" stroke="#1c1712" stroke-width="2"/>
      ${blink ? "" : `<circle cx="${88 + look}" cy="97" r="${Math.min(5, eyeH)}" fill="#1c1712"/><circle cx="${152 + look}" cy="97" r="${Math.min(5, eyeH)}" fill="#1c1712"/>`}
      <path d="M120 105 L112 140 Q120 ${145 - sneer} 128 140" stroke="#1c1712" stroke-width="2" fill="none"/>
      <path d="M${120 - mw / 2} ${170 - curve / 2} Q 120 ${170 + curve - sneer} ${120 + mw / 2} ${170 - curve / 2 - sneer}
               Q 120 ${170 + curve + mh * 1.6} ${120 - mw / 2} ${170 - curve / 2} Z" fill="#7a2a1c" stroke="#1c1712" stroke-width="2.5" stroke-linejoin="round"/>
    </svg>`;
  }

  function intensityOf(w) {
    const total = Object.values(w).reduce((a, b) => a + Math.abs(b), 0);
    return Math.min(5, Math.round(total * 1.6));
  }

  function nearestPose(w) {
    let best = "neutral", bd = Infinity;
    Object.entries(POSES).forEach(([name, p]) => {
      let d = 0;
      TARGETS.forEach(([k]) => (d += Math.pow((w[k] || 0) - (p[k] || 0), 2)));
      if (d < bd) {
        bd = d;
        best = name;
      }
    });
    return best;
  }

  function draw(el, api) {
    const esc = api.esc;
    const st = api.store(KEY);
    const s = Object.assign({ w: {}, a: "joy", b: "sorrow", mix: 0, line: "Mama, put the cup back on the shelf.", rate: 10, beats: ["neutral", "surprise", "fear", "deadpan"] }, st.get({}));
    if (anim) cancelAnimationFrame(anim);
    const saveDraw = () => {
      st.set(s);
      draw(el, api);
    };
    const poseOpts = (v) => Object.keys(POSES).map((p) => `<option ${p === v ? "selected" : ""}>${p}</option>`).join("");
    const visemes = s.line.split("").map(visemeOf).filter((v, i, arr) => v !== arr[i - 1]);
    const seconds = visemes.length / s.rate;
    el.innerHTML = `<div class="studio-grid">
      <div>
        <p class="cap">Blend shape targets</p>
        ${TARGETS.map(([k, l]) => `<label class="field">${esc(l)} ${(s.w[k] || 0).toFixed(2)}<input type="range" min="0" max="1" step="0.05" data-w="${k}" value="${s.w[k] || 0}"></label>`).join("")}
        <div class="bar-actions"><button type="button" data-act="zero">Zero all</button></div>
      </div>
      <div>
        <div id="face-view" style="max-width:320px">${faceSvg(s.w)}</div>
        <p><span class="chip">faceIntensity ${intensityOf(s.w)}</span> <span class="chip">reads as ${esc(nearestPose(s.w))}</span></p>
        <h3>Pose library</h3>
        <p>${Object.keys(POSES).map((p) => `<button type="button" data-pose="${p}">${p}</button>`).join(" ")}</p>
        <h3>In-between</h3>
        <div class="study-bar"><label class="field">From<select data-s="a">${poseOpts(s.a)}</select></label><label class="field">To<select data-s="b">${poseOpts(s.b)}</select></label>
        <label class="field">Blend ${Math.round(s.mix * 100)}%<input type="range" min="0" max="1" step="0.05" data-s="mix" value="${s.mix}"></label></div>
        <h3>Lip sync</h3>
        <label class="field">A line to speak<input data-s="line" value="${esc(s.line)}" maxlength="120"></label>
        <label class="field">Mouth shapes per second: ${s.rate}<input type="range" min="4" max="14" data-s="rate" value="${s.rate}"></label>
        <p class="mono">${visemes.map(esc).join(" · ")}</p>
        <p class="cap">${visemes.length} mouth shapes over ${seconds.toFixed(1)} s. Animators often hold fewer shapes than letters; fewer per second reads as more stylized.</p>
        <div class="bar-actions"><button type="button" data-act="speak">Speak it</button></div>
        <h3>Expression per beat</h3>
        <p class="cap">One held pose per beat, the poseRate and faceIntensity curiosities. Play steps through them with a blink between.</p>
        <p>${s.beats.map((p, i) => `<select data-beat="${i}">${poseOpts(p)}</select>`).join(" ")} <button type="button" data-act="addbeat">+ beat</button> <button type="button" data-act="playbeats">Play</button></p>
        <p>${s.beats.map((p) => `<span class="chip">${esc(p)} ${intensityOf(POSES[p])}</span>`).join(" ")}</p>
      </div></div>`;
    const view = el.querySelector("#face-view");
    el.querySelectorAll("[data-w]").forEach((x) =>
      x.addEventListener("input", () => {
        s.w[x.dataset.w] = Number(x.value);
        st.set(s);
        view.innerHTML = faceSvg(s.w);
        x.parentElement.firstChild.textContent = TARGETS.find((t) => t[0] === x.dataset.w)[1] + " " + Number(x.value).toFixed(2);
      })
    );
    el.querySelectorAll("[data-w]").forEach((x) => x.addEventListener("change", saveDraw));
    el.querySelectorAll("[data-pose]").forEach((b) =>
      b.addEventListener("click", () => {
        s.w = Object.assign({}, POSES[b.dataset.pose]);
        saveDraw();
      })
    );
    el.querySelectorAll("[data-s]").forEach((x) =>
      x.addEventListener("change", () => {
        const k = x.dataset.s;
        s[k] = x.type === "range" ? Number(x.value) : x.value;
        if (k === "mix" || k === "a" || k === "b") {
          const w = {};
          TARGETS.forEach(([t]) => (w[t] = lerp(POSES[s.a][t] || 0, POSES[s.b][t] || 0, s.mix)));
          s.w = w;
        }
        saveDraw();
      })
    );
    el.querySelectorAll("[data-beat]").forEach((x) =>
      x.addEventListener("change", () => {
        s.beats[Number(x.dataset.beat)] = x.value;
        saveDraw();
      })
    );
    el.querySelector('[data-act="zero"]').addEventListener("click", () => {
      s.w = {};
      saveDraw();
    });
    el.querySelector('[data-act="addbeat"]').addEventListener("click", () => {
      if (s.beats.length < 8) s.beats.push("neutral");
      saveDraw();
    });
    el.querySelector('[data-act="speak"]').addEventListener("click", () => {
      const t0 = performance.now();
      const step = (now) => {
        if (!view.isConnected) return;
        const i = Math.floor(((now - t0) / 1000) * s.rate);
        if (i >= visemes.length) {
          view.innerHTML = faceSvg(s.w);
          return;
        }
        view.innerHTML = faceSvg(s.w, VISEMES[visemes[i]]);
        anim = requestAnimationFrame(step);
      };
      anim = requestAnimationFrame(step);
    });
    el.querySelector('[data-act="playbeats"]').addEventListener("click", () => {
      const t0 = performance.now();
      const per = 900;
      const step = (now) => {
        if (!view.isConnected) return;
        const e = now - t0;
        const i = Math.floor(e / per);
        if (i >= s.beats.length) {
          view.innerHTML = faceSvg(s.w);
          return;
        }
        const into = e - i * per;
        const prev = POSES[s.beats[Math.max(0, i - 1)]];
        const next = POSES[s.beats[i]];
        const t = Math.min(1, into / 220);
        const w = {};
        TARGETS.forEach(([k]) => (w[k] = lerp(prev[k] || 0, next[k] || 0, t * t * (3 - 2 * t))));
        view.innerHTML = faceSvg(w, null, into > 700 && into < 780);
        anim = requestAnimationFrame(step);
      };
      anim = requestAnimationFrame(step);
    });
  }

  window.CuriosityStudio.register({ id: "face", label: "Face", order: 38, maya: "Blend Shapes (Shape Editor), Pose Library, lip sync breakdown", draw });
})();
