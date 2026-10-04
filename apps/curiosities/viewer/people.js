/* People: how each character feels and who they are, panel by panel (Jeremy's notes, 2026-10-04 20:16Z).

   A "People" tab in the Viewer. For the character you pick:
   - An emotion wheel (Plutchik's eight feelings around a circle, mild in the middle, intense at the rim, the
     blends between neighbours named). It tilts into 3D, where the feeling rises with its intensity like
     Plutchik's cone, and the character's emotional roadmap through the film is drawn as a line over it.
   - Their Enneagram type and how healthy they are (1 liberated to 9 collapsed), from the Character matrix
     (character-matrix/data.js, PRs #6 and #31).
   - Their place in the chaos matrix: orderly or chaotic (and why), a force for change or one that keeps
     things as they are.
   Every value is automatable: setting it in a panel puts a ◆ key there (like CapCut's keyframes) and the
   panels after hold it until the next key. Changing someone's Enneagram type partway through the film shows
   Jeremy's warning first.
   A roadmap under it shows every character's feeling through every panel, plus the film's own (the
   strongest feeling in each panel). Click a square to go to that panel.

   Data: panel.people = { [objectId]: { emo: {a: degrees round the wheel, joy = 0, clockwise; r: 0 calm .. 1
   intense}, type: 1..9, health: 1..9, chaos: 0 orderly .. 100 chaotic, change: 0 keeps things as they are ..
   100 force for change, why: text } } — only what was set in that panel (keys).
   API: window.CurioPeople { at(i, who) -> resolved values, emotionName({a, r}), EMOTIONS, WARNING }. */
(function () {
  "use strict";
  if (window.CurioPeople) return;
  const V = () => window.CurioViewer;
  const M = () => window.CHARACTER_MATRIX_DATA || null;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const esc = (v) =>
    String(v == null ? "" : v)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  /* Jeremy's words, 2026-10-04 20:16Z */
  const WARNING = "The audience will experience this user as having undergone a massive change in personality if this is changed. Like a near death experience or brain damage, or disease of the mind.";

  /* Plutchik's wheel: eight feelings, each mild / itself / intense, and the blend between each pair of neighbours */
  const EMOTIONS = [
    { id: "joy", mild: "serenity", mid: "joy", strong: "ecstasy", color: "#f5d142" },
    { id: "trust", mild: "acceptance", mid: "trust", strong: "admiration", color: "#8fd16a" },
    { id: "fear", mild: "apprehension", mid: "fear", strong: "terror", color: "#2f9e5b" },
    { id: "surprise", mild: "distraction", mid: "surprise", strong: "amazement", color: "#3bb8c9" },
    { id: "sadness", mild: "pensiveness", mid: "sadness", strong: "grief", color: "#3d6fd6" },
    { id: "disgust", mild: "boredom", mid: "disgust", strong: "loathing", color: "#9b59c9" },
    { id: "anger", mild: "annoyance", mid: "anger", strong: "rage", color: "#e04848" },
    { id: "anticipation", mild: "interest", mid: "anticipation", strong: "vigilance", color: "#f08c32" },
  ];
  /* blend k sits between feeling k and feeling k+1 */
  const BLENDS = ["love", "submission", "awe", "disapproval", "remorse", "contempt", "aggressiveness", "optimism"];
  const mix = (a, b, t) => {
    const p = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
    const x = p(a);
    const y = p(b);
    return "#" + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, "0")).join("");
  };
  function emotionOf(e) {
    const r = clamp(+(e && e.r) || 0, 0, 1);
    const a = ((((e && +e.a) || 0) % 360) + 360) % 360;
    if (r < 0.12) return { name: "calm", color: "#9b9ba3", r, a, k: -1 };
    const k = Math.round(a / 45) % 8;
    let off = a - k * 45;
    if (off > 180) off -= 360;
    if (off < -180) off += 360;
    const band = r < 0.4 ? 0 : r < 0.75 ? 1 : 2;
    if (Math.abs(off) <= 12) {
      const E = EMOTIONS[k];
      return { name: [E.mild, E.mid, E.strong][band], family: E.id, color: E.color, r, a, k };
    }
    const j = off > 0 ? k : (k + 7) % 8;
    const word = BLENDS[j];
    return { name: (band === 0 ? "a little " : band === 2 ? "deep " : "") + word, family: word, color: mix(EMOTIONS[j].color, EMOTIONS[(j + 1) % 8].color, 0.5), r, a, k: j, blend: true };
  }

  const FIELDS = ["emo", "type", "health", "chaos", "change", "why"];
  const LABEL = { emo: "Feeling", type: "Enneagram type", health: "Health", chaos: "Orderly or chaotic", change: "Force for change", why: "Why" };

  /* ---------- reading values: the last key at or before the panel ---------- */
  function film() {
    return V().live().film;
  }
  function people() {
    return film().objects.filter((o) => o.kind === "person");
  }
  function keyAt(i, who, field) {
    const P = film().panels;
    for (let k = Math.min(i, P.length - 1); k >= 0; k--) {
      const q = P[k].people && P[k].people[who];
      if (q && q[field] !== undefined && q[field] !== null && q[field] !== "") return { v: q[field], at: k };
    }
    return null;
  }
  function typeOf(n) {
    const D = M();
    return D && D.TYPES ? D.TYPES.find((t) => t.n === +n) : null;
  }
  /* where a type sits in the chaos matrix by default: its own temperament (orderly..chaotic) and stability
     (stabilizer..catalyst), pushed by health the way the Character matrix does it */
  function typeDefaults(type, health) {
    const D = M();
    const T = typeOf(type);
    if (!D || !T) return { chaos: 50, change: 50 };
    const ax = (id) => D.AXES.findIndex((x) => x.id === id);
    let chaos = T.profile[ax("temperament")];
    let change = T.profile[ax("stability")];
    if (health >= 7) chaos += ((D.HEALTH_PUSH.unhealthy.temperament || 0) * (health - 6)) / 3;
    if (health <= 3) chaos -= (10 * (4 - health)) / 3;
    return { chaos: Math.round(clamp(chaos, 0, 100)), change: Math.round(clamp(change, 0, 100)) };
  }
  function at(i, who) {
    const g = (f) => keyAt(i, who, f);
    const type = g("type");
    const health = g("health");
    const t = type ? +type.v : null;
    const h = health ? +health.v : 5;
    const d = typeDefaults(t, h);
    const chaos = g("chaos");
    const change = g("change");
    const emo = g("emo");
    const why = g("why");
    return {
      emo: emo ? emo.v : { a: 0, r: 0 },
      type: t,
      health: h,
      chaos: chaos ? +chaos.v : d.chaos,
      change: change ? +change.v : d.change,
      why: why ? why.v : "",
      from: { emo: emo && emo.at, type: type && type.at, health: health && health.at, chaos: chaos && chaos.at, change: change && change.at, why: why && why.at },
    };
  }
  /* the first panel where this character's type is set, and whether it later becomes something else */
  function typeChanges(who) {
    const P = film().panels;
    const out = [];
    let last = null;
    P.forEach((p, i) => {
      const q = p.people && p.people[who];
      if (q && q.type) {
        if (last != null && +q.type !== last) out.push(i);
        last = +q.type;
      }
    });
    return out;
  }

  /* ---------- the sample film gets a starting cast so the tab isn't empty ---------- */
  function seed() {
    const f = film();
    if (f._peopleSeeded || !/^The napkin/.test(f.title || "")) return;
    if (f.panels.some((p) => p.people)) return;
    const ids = f.objects.map((o) => o.id);
    if (!ids.includes("biju") || !ids.includes("passenger")) return;
    const byId = (id) => f.panels.find((p) => p.id === id);
    const put = (pid, who, v) => {
      const p = byId(pid);
      if (!p) return;
      p.people = p.people || {};
      p.people[who] = Object.assign(p.people[who] || {}, v);
    };
    put("p1", "biju", { type: 9, health: 3, emo: { a: 0, r: 0.3 }, chaos: 22, change: 30, why: "Biju keeps his small world steady: the same route, the same mango. He changes things only by staying calm while everyone else falls apart." });
    put("p3", "biju", { emo: { a: 0, r: 0.55 } });
    put("p8", "biju", { emo: { a: 45, r: 0.35 } });
    put("p12", "biju", { emo: { a: 315, r: 0.6 }, change: 72 });
    put("p13", "biju", { emo: { a: 22.5, r: 0.7 } });
    put("p1", "passenger", { type: 6, health: 5, emo: { a: 315, r: 0.35 }, chaos: 58, change: 45, why: "Rushed and worried; losing the phone throws every careful plan into chaos, and the panic is what pushes the scene along." });
    put("p6", "passenger", { emo: { a: 90, r: 0.8 }, health: 7 });
    put("p7", "passenger", { emo: { a: 180, r: 0.9 }, health: 8 });
    put("p8", "passenger", { emo: { a: 270, r: 0.45 } });
    put("p12", "passenger", { emo: { a: 135, r: 0.6 } });
    put("p13", "passenger", { emo: { a: 0, r: 0.5 }, health: 5 });
    f._peopleSeeded = true;
  }

  /* ---------- the tab ---------- */
  let body = null;
  let who = null;
  let tilt = false;
  let pending = null; /* a type change waiting on the warning */
  function cur() {
    return V().live().cur;
  }
  function pick() {
    const ps = people();
    if (!ps.length) return null;
    const sel = film().sel;
    if (!who || !ps.some((o) => o.id === who)) who = ps.some((o) => o.id === sel) ? sel : ps[0].id;
    return who;
  }
  function keyMark(i, field, from) {
    const on = from === i;
    return `<button type="button" class="cvp-key${on ? " on" : ""}" data-pk="${field}" title="${on ? "Set in this panel (◆). Click to take this panel's change out, so it holds what came before." : from != null ? "Held from panel " + (from + 1) + ". Click to set it in this panel." : "Not set yet. Click to set it in this panel."}">${on ? "◆" : "◇"}</button>`;
  }
  function render(el) {
    if (el) body = el;
    if (!body || !body.isConnected) return;
    seed();
    const ps = people();
    const w = pick();
    const i = cur();
    if (!w) {
      body.innerHTML = `<p class="cv-help">There are no people in this scene yet. Add a person under <b>Add a shape</b>, then come back to give them feelings and a personality.</p>`;
      return;
    }
    const v = at(i, w);
    const E = emotionOf(v.emo);
    const D = M();
    const T = typeOf(v.type);
    const L = D && D.LEVELS ? D.LEVELS.find((x) => x.level === Math.round(v.health)) : null;
    const band = L ? L.band : v.health <= 3 ? "healthy" : v.health <= 6 ? "average" : "unhealthy";
    const changes = typeChanges(w);
    const name = (ps.find((o) => o.id === w) || {}).name || w;
    body.innerHTML = `
      <p class="cv-help">How <b>${esc(name)}</b> feels and who they are in <b>panel ${i + 1}</b>. Setting anything puts a ◆ in this panel; the panels after hold it until the next ◆, so every one of these can change through the film.</p>
      <div class="cvp-who">${ps.map((o) => `<button type="button" data-pwho="${esc(o.id)}" class="${o.id === w ? "on" : ""}"><i style="background:${esc(o.color || "#888")}"></i>${esc(o.name)}</button>`).join("")}</div>
      <h3>Feeling ${keyMark(i, "emo", v.from.emo)}<em class="cvp-emo" style="color:${E.color}">${esc(E.name)}</em></h3>
      <div class="cvp-wheelbox">
        <canvas class="cvp-wheel" aria-label="Emotion wheel. Click or drag: around the circle picks the feeling, out from the middle makes it stronger."></canvas>
        <div class="cvp-row"><button type="button" data-pa="tilt">${tilt ? "Flat (easier to pick)" : "Tilt into 3D"}</button><span class="cvp-small">Middle: calm. Rim: as strong as it gets. Between two colors: the blend of both.</span></div>
      </div>
      <h3>Enneagram ${keyMark(i, "type", v.from.type)}</h3>
      ${
        D
          ? `<label class="cv-field"><span><b>Type</b></span><select data-pf="type"><option value=""${v.type ? "" : " selected"}>Not set</option>${D.TYPES.map((t) => `<option value="${t.n}"${t.n === v.type ? " selected" : ""}>${t.n} · ${esc(t.name)}</option>`).join("")}</select></label>`
          : `<p class="cvp-small">The Enneagram types did not load.</p>`
      }
      ${
        pending
          ? `<div class="cvp-warn" role="alert"><b>⚠ Warning</b><p>${esc(WARNING)}</p><div class="cvp-row"><button type="button" class="cv-primary" data-pa="typeok">Change to ${esc((typeOf(pending.type) || {}).name || "Not set")} anyway</button><button type="button" data-pa="typeno">Keep ${esc(T ? T.name : "it")}</button></div></div>`
          : changes.includes(i)
          ? `<div class="cvp-warn"><b>⚠ ${esc(name)}'s personality changes here</b><p>${esc(WARNING)}</p></div>`
          : ""
      }
      ${T ? `<p class="cvp-small"><b>Wants</b> ${esc(T.desire)}. <b>Fears</b> ${esc(T.fear)}. <b>Drives the story by</b> ${esc(T.engine.replace(/\.$/, "").toLowerCase())}.</p>` : ""}
      <label class="cv-field"><span><b>Emotional health</b> ${keyMark(i, "health", v.from.health)}<em>${Math.round(v.health)} · ${esc(L ? L.label : band)}</em></span><input type="range" data-pf="health" min="1" max="9" step="1" value="${Math.round(v.health)}" /><span class="cv-ends"><span>healthy, at their best</span><span>unhealthy, at their worst</span></span></label>
      ${T ? `<p class="cvp-small">${esc(T[band])}</p>` : ""}
      <h3>Chaos matrix ${keyMark(i, "chaos", v.from.chaos)}</h3>
      <canvas class="cvp-chaos" aria-label="Chaos matrix. Left to right: orderly to chaotic. Bottom to top: keeps things as they are to a force for change. Click or drag to place them."></canvas>
      <p class="cvp-small cvp-place">${esc(placeWords(v.chaos, v.change))}</p>
      <label class="cv-field"><span><b>Why</b> ${keyMark(i, "why", v.from.why)}</span><textarea data-pf="why" rows="3" placeholder="Why are they chaotic or orderly? Why do they change things, or keep them as they are?${T ? " (A " + esc(T.name) + " is driven by: " + esc(T.engine) + ")" : ""}">${esc(v.why)}</textarea></label>
      <h3>Emotional roadmap</h3>
      <canvas class="cvp-road" aria-label="Every character's feeling in every panel, and the film's. Click a square to go to that panel."></canvas>
      <p class="cvp-small">Each square is a panel: its color is the feeling, brighter is stronger. ◆ marks a change set there, ⚠ a change of personality. The top row is the film: the strongest feeling in each panel.</p>`;
    wheel();
    chaos();
    road();
  }
  function placeWords(c, ch) {
    const o = c < 40 ? "orderly" : c > 60 ? "chaotic" : "between order and chaos";
    const f = ch > 60 ? "a force for change" : ch < 40 ? "keeps things as they are" : "neither pushes change nor stops it";
    const q = c < 50 ? (ch >= 50 ? "Calm reformer" : "Anchor") : ch >= 50 ? "Wildfire" : "Storm in a teacup";
    return `${q}: ${o}, and ${f}.`;
  }

  /* canvases are drawn at their on-screen size (sharp text at any panel width); sizes below are screen pixels */
  function fit(cv, ratio) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = Math.max(200, cv.clientWidth || 300);
    const H = Math.round(W * ratio);
    if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) {
      cv.width = Math.round(W * dpr);
      cv.height = Math.round(H * dpr);
    }
    cv.style.height = H + "px";
    const g = cv.getContext("2d");
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    cv._W = W;
    cv._H = H;
    return g;
  }

  /* ---------- the emotion wheel, flat or tilted into Plutchik's cone ---------- */
  const TILT = 0.9; /* radians the 3D wheel leans back */
  const RISE = 0.35; /* how far the rim rises above the calm middle, in wheel radii */
  function wheelGeo(cv) {
    const W = cv._W;
    const H = cv._H;
    /* in 3D the rim (the strongest feelings) rises, like Plutchik's cone seen from above its open end */
    const R = tilt ? W * 0.36 : Math.min(W, H) * 0.4;
    const cx = W / 2;
    const cy = tilt ? W * 0.46 : H / 2;
    /* a point on the wheel: x, y in -1..1 (y down), h up (0..1) */
    const pt = (x, y, h) => (tilt ? [cx + x * R, cy + y * R * Math.cos(TILT) - (h || 0) * R * RISE] : [cx + x * R, cy + y * R]);
    const back = (X, Y) => [(X - cx) / R, (Y - cy) / (R * (tilt ? Math.cos(TILT) : 1))];
    return { W, H, R, cx, cy, pt, back };
  }
  const polar = (a, r) => [Math.sin((a * Math.PI) / 180) * r, -Math.cos((a * Math.PI) / 180) * r];
  function wheel() {
    const cv = body && body.querySelector(".cvp-wheel");
    if (!cv) return;
    const g = fit(cv, tilt ? 0.78 : 1);
    const G = wheelGeo(cv);
    g.clearRect(0, 0, G.W, G.H);
    const fs = Math.max(10, Math.min(13, G.R / 11));
    /* rings of petals: mild inside, intense outside, blends in the gaps */
    const rings = [
      [0.12, 0.4, 0.45],
      [0.4, 0.75, 0.75],
      [0.75, 1, 1],
    ];
    /* in 3D the far side of the bowl is drawn first, so the near side covers it */
    const order = [0, 1, 2, 3, 4, 5, 6, 7].sort((x, y) => (tilt ? -Math.cos(((x * 45 + 10) * Math.PI) / 180) + Math.cos(((y * 45 + 10) * Math.PI) / 180) : 0));
    for (const k of order) {
      rings.forEach(([r0, r1, sat], b) => {
        const seg = (a0, a1, col, alpha) => {
          g.beginPath();
          const n = 8;
          for (let s = 0; s <= n; s++) {
            const p = G.pt(...polar(a0 + ((a1 - a0) * s) / n, r1), tilt ? r1 : 0);
            s ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]);
          }
          for (let s = n; s >= 0; s--) {
            const p = G.pt(...polar(a0 + ((a1 - a0) * s) / n, r0), tilt ? r0 : 0);
            g.lineTo(p[0], p[1]);
          }
          g.closePath();
          g.globalAlpha = alpha;
          g.fillStyle = col;
          g.fill();
          g.globalAlpha = 1;
          g.strokeStyle = "rgba(15,15,16,0.7)";
          g.lineWidth = 1;
          g.stroke();
        };
        seg(k * 45 - 12, k * 45 + 12, EMOTIONS[k].color, 0.35 + sat * 0.6);
        seg(k * 45 + 12, k * 45 + 33, mix(EMOTIONS[k].color, EMOTIONS[(k + 1) % 8].color, 0.5), 0.2 + sat * 0.45);
      });
    }
    /* names: the feeling itself in the middle ring, the strong one at the rim, blends just outside */
    g.textAlign = "center";
    g.textBaseline = "middle";
    for (let k = 0; k < 8; k++) {
      const E = EMOTIONS[k];
      g.font = `600 ${fs}px system-ui, sans-serif`;
      g.fillStyle = "#101013";
      let p = G.pt(...polar(k * 45, 0.575), tilt ? 0.575 : 0);
      g.fillText(E.mid, p[0], p[1]);
      g.font = `${fs - 2}px system-ui, sans-serif`;
      p = G.pt(...polar(k * 45, 0.875), tilt ? 0.875 : 0);
      g.fillText(E.strong, p[0], p[1]);
      if (!tilt) {
        p = G.pt(...polar(k * 45, 0.26), 0);
        g.fillText(E.mild, p[0], p[1]);
      }
      g.fillStyle = "#c9c9d1";
      g.font = `${fs - 3}px system-ui, sans-serif`;
      p = G.pt(...polar(k * 45 + 22.5, 1.1), tilt ? 1 : 0);
      g.fillText(BLENDS[k], p[0], p[1]);
    }
    const p0 = G.pt(0, 0, 0);
    g.fillStyle = "#9b9ba3";
    g.font = "11px system-ui, sans-serif";
    g.fillText("calm", p0[0], p0[1]);
    /* the roadmap through the film: this character's feeling panel by panel, joined in order */
    const w = pick();
    const P = film().panels;
    const i = cur();
    const pts = P.map((p, k) => {
      const e = at(k, w).emo;
      const r = clamp(+e.r || 0, 0, 1);
      const [x, y] = polar(+e.a || 0, r);
      return G.pt(x, y, tilt ? r : 0);
    });
    g.strokeStyle = "rgba(255,255,255,0.55)";
    g.lineWidth = 1.5;
    g.setLineDash([4, 4]);
    g.beginPath();
    pts.forEach((p, k) => (k ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])));
    g.stroke();
    g.setLineDash([]);
    pts.forEach((p, k) => {
      if (k === i) return;
      g.fillStyle = "rgba(255,255,255,0.7)";
      g.beginPath();
      g.arc(p[0], p[1], 3, 0, Math.PI * 2);
      g.fill();
    });
    /* this panel: a big dot (on a stalk in 3D) */
    const e = at(i, w).emo;
    const r = clamp(+e.r || 0, 0, 1);
    const [x, y] = polar(+e.a || 0, r);
    const top = G.pt(x, y, tilt ? r : 0);
    if (tilt) {
      const foot = G.pt(x, y, 0);
      g.strokeStyle = "#fff";
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(foot[0], foot[1]);
      g.lineTo(top[0], top[1]);
      g.stroke();
    }
    g.fillStyle = emotionOf(e).color;
    g.strokeStyle = "#fff";
    g.lineWidth = 3;
    g.beginPath();
    g.arc(top[0], top[1], 9, 0, Math.PI * 2);
    g.fill();
    g.stroke();
    g.fillStyle = "#fff";
    g.font = "700 11px system-ui, sans-serif";
    g.fillText(String(i + 1), top[0], top[1] - 17);
  }

  /* ---------- the chaos matrix ---------- */
  function chaosGeo(cv) {
    const W = cv._W;
    const H = cv._H;
    const l = 6;
    const r = W - 6;
    const t = 20;
    const b = H - 36;
    return { W, H, l, r, t, b, X: (c) => l + ((r - l) * c) / 100, Y: (ch) => b - ((b - t) * ch) / 100, back: (x, y) => [((x - l) / (r - l)) * 100, ((b - y) / (b - t)) * 100] };
  }
  function chaos() {
    const cv = body && body.querySelector(".cvp-chaos");
    if (!cv) return;
    const g = fit(cv, 0.78);
    const G = chaosGeo(cv);
    g.clearRect(0, 0, G.W, G.H);
    const q = [
      ["Calm reformer", 0, 50, "#1d3b2c"],
      ["Wildfire", 50, 50, "#4a1f1f"],
      ["Anchor", 0, 0, "#1d2a3f"],
      ["Storm in a teacup", 50, 0, "#3d2f17"],
    ];
    q.forEach(([name, c, ch, col]) => {
      g.fillStyle = col;
      g.fillRect(G.X(c), G.Y(ch + 50), G.X(c + 50) - G.X(c), G.Y(ch) - G.Y(ch + 50));
      g.fillStyle = "rgba(236,236,238,0.55)";
      g.font = "600 13px system-ui, sans-serif";
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.fillText(name, G.X(c + 25), G.Y(ch + 25));
    });
    g.strokeStyle = "#3a3a42";
    g.strokeRect(G.l, G.t, G.r - G.l, G.b - G.t);
    g.fillStyle = "#9b9ba3";
    g.font = "11px system-ui, sans-serif";
    g.textAlign = "left";
    g.fillText("orderly", G.l, G.b + 14);
    g.textAlign = "right";
    g.fillText("chaotic", G.r, G.b + 14);
    g.textAlign = "left";
    g.fillText("↑ a force for change", G.l, G.t - 9);
    g.fillText("↓ keeps things as they are", G.l, G.b + 29);
    /* their path through the film, and where they are now */
    const w = pick();
    const P = film().panels;
    const i = cur();
    const pts = P.map((p, k) => {
      const v = at(k, w);
      return [G.X(v.chaos), G.Y(v.change)];
    });
    g.strokeStyle = "rgba(255,255,255,0.45)";
    g.setLineDash([4, 4]);
    g.beginPath();
    pts.forEach((p, k) => (k ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])));
    g.stroke();
    g.setLineDash([]);
    const me = pts[i];
    g.fillStyle = "#22d3ee";
    g.strokeStyle = "#fff";
    g.lineWidth = 3;
    g.beginPath();
    g.arc(me[0], me[1], 9, 0, Math.PI * 2);
    g.fill();
    g.stroke();
  }

  /* ---------- the roadmap: every character, every panel ---------- */
  function roadGeo(cv) {
    const P = film().panels;
    const left = 76;
    const cw = (cv._W - left - 4) / P.length;
    return { left, cw, top: 22, rh: 26 };
  }
  function road() {
    const cv = body && body.querySelector(".cvp-road");
    if (!cv) return;
    const P = film().panels;
    const ps = people();
    const g = fit(cv, (22 + (ps.length + 1) * 26 + 4) / Math.max(200, cv.clientWidth || 300));
    const G = roadGeo(cv);
    const i = cur();
    g.clearRect(0, 0, cv._W, cv._H);
    g.font = "11px system-ui, sans-serif";
    g.textBaseline = "middle";
    g.fillStyle = "#9b9ba3";
    g.textAlign = "center";
    P.forEach((p, k) => g.fillText(String(k + 1), G.left + G.cw * (k + 0.5), 10));
    const rows = [{ id: "_film", name: "The film" }].concat(ps);
    rows.forEach((o, n) => {
      const y = G.top + n * G.rh;
      g.textAlign = "left";
      g.fillStyle = o.id === who ? "#22d3ee" : "#c9c9d1";
      g.font = (n === 0 ? "700 " : "") + "12px system-ui, sans-serif";
      g.fillText(o.name.length > 13 ? o.name.slice(0, 12) + "…" : o.name, 4, y + G.rh / 2);
      const changes = n ? typeChanges(o.id) : [];
      P.forEach((p, k) => {
        let e;
        if (n === 0) {
          /* the film: the strongest feeling anyone has in this panel */
          e = ps.map((q) => at(k, q.id).emo).sort((a, b) => (+b.r || 0) - (+a.r || 0))[0] || { a: 0, r: 0 };
        } else e = at(k, o.id).emo;
        const E = emotionOf(e);
        const x = G.left + G.cw * k;
        g.globalAlpha = 0.25 + 0.75 * E.r;
        g.fillStyle = E.color;
        g.fillRect(x + 1, y + 2, G.cw - 2, G.rh - 4);
        g.globalAlpha = 1;
        if (G.cw > 44) {
          g.fillStyle = E.r > 0.5 ? "#101013" : "#ececee";
          g.font = "10px system-ui, sans-serif";
          g.textAlign = "center";
          const nm = E.name.replace(/^(a little|deep) /, "");
          g.fillText(nm.length > 9 ? nm.slice(0, 8) + "…" : nm, x + G.cw / 2, y + G.rh / 2);
        }
        const key = n && p.people && p.people[o.id];
        if (key) {
          g.fillStyle = "#fff";
          g.font = "8px system-ui, sans-serif";
          g.textAlign = "left";
          g.fillText("◆", x + 3, y + 8);
        }
        if (changes.includes(k)) {
          g.fillStyle = "#ffcc33";
          g.font = "11px system-ui, sans-serif";
          g.textAlign = "right";
          g.fillText("⚠", x + G.cw - 2, y + 9);
        }
      });
    });
    g.strokeStyle = "#fff";
    g.lineWidth = 2;
    g.strokeRect(G.left + G.cw * i + 0.5, G.top, G.cw - 1, rows.length * G.rh);
  }

  /* ---------- edits ---------- */
  function setKey(field, value) {
    const L = V().live();
    const w = pick();
    V().edit("people-" + field);
    const p = L.panel;
    p.people = p.people || {};
    p.people[w] = p.people[w] || {};
    p.people[w][field] = value;
    V().changed(false);
  }
  function clearKey(field) {
    const L = V().live();
    const w = pick();
    const q = L.panel.people && L.panel.people[w];
    if (!q || q[field] === undefined) return;
    V().edit("people-" + field);
    delete q[field];
    if (!Object.keys(q).length) delete L.panel.people[w];
    if (!Object.keys(L.panel.people).length) delete L.panel.people;
    V().changed(false);
  }
  function onClick(e) {
    const t = e.target;
    if (!t.closest || !t.closest(".cvp-body")) return;
    const b = t.closest("button");
    if (!b) return;
    if (b.dataset.pwho) {
      who = b.dataset.pwho;
      pending = null;
      return render();
    }
    if (b.dataset.pa === "tilt") {
      tilt = !tilt;
      return render();
    }
    if (b.dataset.pa === "typeok" && pending) {
      setKey("type", pending.type || "");
      pending = null;
      return render();
    }
    if (b.dataset.pa === "typeno") {
      pending = null;
      return render();
    }
    if (b.dataset.pk) {
      const f = b.dataset.pk;
      const i = cur();
      const v = at(i, pick());
      if (v.from[f] === i) clearKey(f);
      else setKey(f, f === "emo" ? Object.assign({}, v.emo) : v[f]);
      return render();
    }
  }
  function onChange(e) {
    const el = e.target;
    if (!el.closest || !el.closest(".cvp-body") || !el.dataset.pf) return;
    const f = el.dataset.pf;
    if (f === "health" && e.type === "input") {
      const em = el.closest(".cv-field").querySelector("em");
      const D = M();
      const L = D && D.LEVELS.find((x) => x.level === +el.value);
      if (em) em.textContent = el.value + " · " + (L ? L.label : "");
      return;
    }
    if (e.type !== "change") return;
    if (f === "type") {
      const i = cur();
      const w = pick();
      const now = at(i, w).type;
      const nv = el.value ? +el.value : null;
      /* a type set earlier in the film that would become something else here: warn first */
      const before = i > 0 ? at(i - 1, w).type : null;
      const later = film().panels.slice(i + 1).some((p) => p.people && p.people[w] && p.people[w].type && +p.people[w].type !== nv);
      if (nv !== now && ((before != null && before !== nv) || (now != null && later))) {
        pending = { type: nv };
        return render();
      }
      setKey("type", nv || "");
      return render();
    }
    if (f === "health") setKey("health", +el.value);
    if (f === "why") setKey("why", el.value);
    render();
  }
  /* dragging on the wheel and the matrix */
  let drag = null;
  function pointAt(cv, e) {
    const r = cv.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * cv._W, ((e.clientY - r.top) / r.height) * cv._H];
  }
  function fromWheel(cv, e) {
    const G = wheelGeo(cv);
    const [x, y] = G.back(...pointAt(cv, e));
    const r = clamp(Math.hypot(x, y), 0, 1);
    let a = (Math.atan2(x, -y) * 180) / Math.PI;
    if (a < 0) a += 360;
    return { a: Math.round(a * 2) / 2, r: Math.round(r * 100) / 100 };
  }
  function fromChaos(cv, e) {
    const G = chaosGeo(cv);
    const [c, ch] = G.back(...pointAt(cv, e));
    return [Math.round(clamp(c, 0, 100)), Math.round(clamp(ch, 0, 100))];
  }
  function apply(e) {
    const p = V().live().panel;
    const w = pick();
    p.people = p.people || {};
    p.people[w] = p.people[w] || {};
    if (drag.kind === "wheel") p.people[w].emo = fromWheel(drag.cv, e);
    else [p.people[w].chaos, p.people[w].change] = fromChaos(drag.cv, e);
    V().changed(false);
    if (drag.kind === "wheel") {
      wheel();
      const em = body.querySelector(".cvp-emo");
      const E = emotionOf(p.people[w].emo);
      if (em) (em.textContent = E.name), (em.style.color = E.color);
    } else {
      chaos();
      const pl = body.querySelector(".cvp-place");
      if (pl) pl.textContent = placeWords(p.people[w].chaos, p.people[w].change);
    }
    road();
  }
  function onDown(e) {
    const cv = e.target.closest && e.target.closest(".cvp-wheel, .cvp-chaos, .cvp-road");
    if (!cv) return;
    e.preventDefault();
    if (cv.classList.contains("cvp-road")) {
      const G = roadGeo(cv);
      const [x, y] = pointAt(cv, e);
      const k = Math.floor((x - G.left) / G.cw);
      const n = Math.floor((y - G.top) / G.rh);
      const ps = people();
      if (n >= 1 && n <= ps.length) who = ps[n - 1].id;
      if (k >= 0 && k < film().panels.length) V().select(k);
      return render();
    }
    V().edit(cv.classList.contains("cvp-wheel") ? "people-emo" : "people-chaos");
    drag = { cv, kind: cv.classList.contains("cvp-wheel") ? "wheel" : "chaos" };
    try {
      cv.setPointerCapture(e.pointerId);
    } catch (err) {}
    apply(e);
  }
  function onMove(e) {
    if (drag) apply(e);
  }
  function onUp() {
    if (!drag) return;
    drag = null;
    render();
  }

  const CSS = `
.cvp-body h3 { display: flex; align-items: center; gap: 6px; margin: 14px 0 6px; }
.cvp-body h3 em { font-style: normal; font-weight: 700; margin-left: auto; text-transform: none; letter-spacing: 0; font-size: 13px; }
.cvp-who { display: flex; flex-wrap: wrap; gap: 4px; }
.cvp-who button i { display: inline-block; width: 9px; height: 9px; border-radius: 50%; margin-right: 5px; vertical-align: 0; }
.cv-root .cvp-who button.on { background: var(--c-accent); color: var(--c-ink); font-weight: 700; }
.cvp-wheel, .cvp-chaos, .cvp-road { width: 100%; height: auto; display: block; touch-action: none; cursor: crosshair; }
.cvp-road { cursor: pointer; }
.cvp-row { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; margin: 4px 0; }
.cvp-small { font-size: 11.5px; color: var(--c-dim); line-height: 1.45; margin: 4px 0; }
.cvp-small b { color: var(--c-text); }
.cv-root .cvp-key { background: transparent; padding: 0 4px; color: var(--c-dim); font-size: 13px; }
.cv-root .cvp-key.on { color: var(--c-accent); }
.cvp-warn { border: 1px solid #ffcc33; background: #3a2e0c; color: #ffe9a6; border-radius: 8px; padding: 8px 10px; margin: 6px 0; font-size: 12px; }
.cvp-warn p { margin: 4px 0; }
`;
  function wire() {
    const v = V();
    if (!v || !v.addTab) return setTimeout(wire, 300);
    const st = document.createElement("style");
    st.textContent = CSS;
    document.head.appendChild(st);
    v.addTab({
      id: "people",
      label: "People",
      render: (el) => {
        const d = document.createElement("div");
        d.className = "cvp-body";
        el.appendChild(d);
        pending = null;
        render(d);
      },
    });
    /* moving to another panel redraws the tab when it shows */
    v.onChange && v.onChange(() => body && body.isConnected && !drag && render());
    document.addEventListener("click", onClick);
    document.addEventListener("input", onChange);
    document.addEventListener("change", onChange);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", wire);
  else setTimeout(wire, 0);

  window.CurioPeople = { at, emotionName: (e) => emotionOf(e).name, emotionOf, EMOTIONS, BLENDS, WARNING, typeChanges };
})();
