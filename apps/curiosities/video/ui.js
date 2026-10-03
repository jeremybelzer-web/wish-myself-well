/* video/ui.js: the Video window. Bring in two clips, take the inspiration apart into curiosities (each one a
   lane with a node wherever it changes), put those lanes on My film, and apply them, one by one or all at once,
   to your clip, then check that the change really happened and save the result.

   Opens from Library, "Take a clip apart", and from an "Import a video" button on the Screen's bar.
   window.CurioVideoUI = { open(), close(), state() }
   Settings (which curiosities to apply, how much, same speed or stretched) are kept under
   localStorage curiosities-video-v1. The clips themselves stay on your computer: nothing is uploaded or saved. */
(function () {
  const V = () => window.CurioVideo;
  const C = () => window.CurioClip;
  const KEY = "curiosities-video-v1";
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const prefs = load();
  const slot = { a: { clip: null, d: null, busy: null }, b: { clip: null, d: null, busy: null } };
  let page = null,
    show = "a",
    result = null,
    lines = null,
    checks = null,
    playing = false,
    saved = null,
    note = "";

  function load() {
    let p = {};
    try {
      p = JSON.parse(localStorage.getItem(KEY) || "{}") || {};
    } catch (e) {}
    const on = {};
    (V() ? V().GROUPS : []).forEach((g) => (on[g.id] = p.on && typeof p.on[g.id] === "number" ? Math.max(0, Math.min(1, p.on[g.id])) : g.off ? 0 : 1));
    return { mode: p.mode === "stretch" ? "stretch" : "same", on, title: typeof p.title === "string" ? p.title.slice(0, 120) : "", ai: p.ai !== false };
  }
  function keep() {
    try {
      localStorage.setItem(KEY, JSON.stringify(prefs));
    } catch (e) {}
  }
  const label = (id) => (window.CurioScale ? window.CurioScale.label(id) : id);
  const fmt = (t) => {
    const m = Math.floor(t / 60),
      s = t - m * 60;
    return (m ? m + ":" + (s < 10 ? "0" : "") + s.toFixed(1) : s.toFixed(1)) + "s";
  };

  /* ---------- drawing ---------- */
  function draw() {
    if (!page) return;
    const a = slot.a,
      b = slot.b;
    page.innerHTML = `
      <header class="vd-bar">
        <strong class="vd-title">Take a clip apart</strong>
        <span class="vd-k">Bring in two clips. The first is the inspiration: it is taken apart into curiosities, each with a node wherever it changes. Then its curiosities are applied to your clip, at the same rate.</span>
        <button type="button" data-act="close" class="vd-close">Back to the app</button>
      </header>
      <div class="vd-main">
        <section class="vd-clips">
          ${clipCard("a", "1. Inspiration clip", "The clip to take apart.")}
          <div class="vd-swap"><button type="button" data-act="swap" ${a.clip || b.clip ? "" : "disabled"} title="Make your clip the inspiration and the inspiration your clip">⇄ Swap</button></div>
          ${clipCard("b", "2. Your clip", "The clip the curiosities are applied to.")}
        </section>
        ${aiSection()}
        ${note ? `<p class="vd-note" role="status">${esc(note)}</p>` : ""}
        ${a.d || b.d ? lanesSection() : ""}
        ${a.d && b.d ? applySection() : a.d ? `<p class="vd-k vd-pad">Bring in your clip (box 2) to apply these curiosities to it.</p>` : ""}
      </div>`;
    page.querySelectorAll("video[data-slot]").forEach((v) => {
      const s = slot[v.dataset.slot];
      if (s.clip && v.src !== s.clip.url) v.src = s.clip.url;
    });
    if (result) {
      const cv = page.querySelector("canvas.vd-out");
      if (cv && saved && saved.frame) cv.getContext("2d").putImageData(saved.frame, 0, 0);
    }
  }
  function clipCard(k, title, sub) {
    const s = slot[k];
    const inner = s.clip
      ? `<video data-slot="${k}" controls playsinline muted preload="auto"></video>
         <p class="vd-name">${esc(s.clip.name)} <span class="vd-k">${fmt(s.clip.duration)} · ${s.clip.width}×${s.clip.height}</span></p>
         ${s.busy ? `<div class="vd-prog"><i style="width:${Math.round(s.busy.p * 100)}%"></i></div><p class="vd-k">${esc(s.busy.what)}…</p>` : s.d ? `<p class="vd-k">Taken apart: ${Object.keys(s.d.nodes).length} curiosities, ${Object.values(s.d.nodes).reduce((n, x) => n + x.length, 0)} nodes.</p>` : ""}
         <label class="vd-file">Use another clip<input type="file" accept="video/*" data-file="${k}"></label>`
      : `<label class="vd-drop" data-drop="${k}"><strong>Drop a video here</strong><span>or click to choose one (.mp4, .mov, .webm)</span><input type="file" accept="video/*" data-file="${k}"></label>`;
    return `<article class="vd-card" data-drop="${k}"><header><strong>${esc(title)}</strong><span class="vd-k">${esc(sub)}</span></header>${inner}</article>`;
  }
  /* AI cut-outs: on by default, free in the browser; a stronger server AI with the user's own key. */
  function aiSection() {
    const AI = window.CurioAI,
      M = window.CurioMask;
    if (!AI || !M) return "";
    const list = AI.providers("cutout");
    const pick = AI.chosen("cutout") || "mediapipe";
    const st = !prefs.ai ? "off" : M.ready() ? "ready" : M.failed() ? "couldn't load: " + M.failed() : "loads when you bring in a clip";
    const fal = list.find((x) => x.company === "fal");
    const hasKey = !!AI.key("fal");
    return `<section class="vd-ai">
      <header><strong>AI cut-outs</strong><span class="vd-k">Finds the people in every frame and splits them into hair, face, skin and clothes, with the rest as the set, so one element can change on its own (${esc(st)}).</span></header>
      <div class="vd-ai-row">
        <label><input type="checkbox" data-ai-on ${prefs.ai ? "checked" : ""}> Do it automatically when a clip comes in</label>
        <label>Which AI <select data-ai-pick>${list.map((x) => `<option value="${esc(x.id)}" ${x.id === pick ? "selected" : ""}>${esc(x.label)}</option>`).join("")}</select></label>
        ${slot.b.clip && M.ready() ? `<button type="button" data-act="ai-preview" title="Tints what the AI found on the frame showing in your clip's box">Show what it found</button>` : ""}
      </div>
      ${
        fal
          ? `<div class="vd-ai-row"><label>fal.ai key <input type="password" data-ai-key="fal" autocomplete="off" placeholder="${hasKey ? "saved in this browser" : "paste your own key"}"></label>
        <button type="button" data-act="ai-key-save">Keep it in this browser</button>${hasKey ? `<button type="button" data-act="ai-key-clear">Remove it</button>` : ""}
        <span class="vd-k">Your key stays in this browser and is sent only to fal.ai. It is never saved in a project file. Cost: ${esc(fal.cost({ seconds: slot.b.clip ? slot.b.clip.duration : 30 }))}.</span></div>`
          : ""
      }
    </section>`;
  }
  /* The elements over time: how much of the frame the people fill, where they are, the colors of their clothes
     and hair (color strips). */
  function elementLanes(d, which) {
    const E = d.elements;
    if (!E) return "";
    const W = 1000,
      n = E.times.length;
    const x = (i) => (E.times[i] / d.duration) * W;
    const line = (arr, k) => arr.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${(20 - Math.max(0, Math.min(1, v * k)) * 18).toFixed(1)}`).join(" ");
    const hex = (r, g, b) => `rgb(${Math.round(r * 255)},${Math.round(g * 255)},${Math.round(b * 255)})`;
    const strip = (part) => {
      const P = E.parts[part];
      const v = P.vr ? "v" : "";
      return E.times.map((t, i) => (P.area[i] < 0.003 ? "" : `<rect x="${x(i)}" y="2" width="${Math.max(1, W / n + 1)}" height="18" style="fill:${hex(P[v + "r"][i], P[v + "g"][i], P[v + "b"][i])}"/>`)).join("");
    };
    const row = (name, small, svg) => `<div class="vd-lane"><button type="button" class="vd-lname" data-seekto="${which}">${esc(name)}<small>AI cut-out</small></button><svg class="vd-strip" viewBox="0 0 ${W} 22" preserveAspectRatio="none" data-strip="${which}">${svg}<line class="vd-head" x1="0" x2="0" y1="0" y2="22"/></svg></div>`;
    return `<div class="vd-group"><h4>Elements (AI cut-outs)</h4>
      ${row("People: how much of the frame", "", `<path d="${line(E.parts.person.area, 1.6)}" class="vd-line"/>`)}
      ${row("People: left to right", "", `<path d="${line(E.parts.person.cx, 1)}" class="vd-line"/>`)}
      ${row("Clothes color", "", strip("clothes"))}
      ${row("Hair color", "", strip("hair"))}
      ${row("The set's color", "", strip("background"))}
    </div>`;
  }
  /* Each curiosity as a lane across the clip: blocks of one value, a node (diamond) where it changes. */
  function lanesSection() {
    const d = (show === "b" ? slot.b.d : slot.a.d) || slot.a.d || slot.b.d;
    const which = d === slot.b.d ? "b" : "a";
    const groups = {};
    V().LIST.forEach((c) => d.nodes[c.id] && (groups[c.group] = groups[c.group] || []).push(c));
    const W = 1000;
    const lane = (c) => {
      const nodes = d.nodes[c.id];
      const est = d.how[c.id].how === "estimated";
      const opts = (window.CurioScale && window.CurioScale.domain(c.id)) || { kind: "range" };
      const pos = (v) => {
        const p = window.CurioScale ? window.CurioScale.pos(c.id, v) : 0.5;
        return p == null ? 0.5 : p;
      };
      const blocks = nodes
        .map((n, i) => {
          const end = i + 1 < nodes.length ? nodes[i + 1].t : d.duration;
          const x = (n.t / d.duration) * W,
            w = Math.max(1, ((end - n.t) / d.duration) * W);
          const p = pos(n.value);
          const fill = `hsl(${Math.round(220 - p * 200)} 55% ${est ? 74 : 62}%)`;
          const txt = w > 46 ? `<text x="${x + 4}" y="15">${esc(String(n.value).slice(0, Math.floor(w / 7)))}</text>` : "";
          return `<g><title>${esc(label(c.id))}: ${esc(n.value)} from ${fmt(n.t)}</title><rect x="${x}" y="2" width="${w}" height="18" style="fill:${fill}"/>${txt}${i ? `<path class="vd-node" d="M${x} 1 l4 5 l-4 5 l-4 -5z"/>` : ""}</g>`;
        })
        .join("");
      return `<div class="vd-lane"><button type="button" class="vd-lname" data-seekto="${which}" title="${esc(d.how[c.id].from)}">${esc(label(c.id))}<small class="${est ? "est" : ""}">${est ? "a guess" : "measured"} · ${nodes.length - 1} change${nodes.length === 2 ? "" : "s"}</small></button><svg class="vd-strip" viewBox="0 0 ${W} 22" preserveAspectRatio="none" data-strip="${which}">${blocks}<line class="vd-head" x1="0" x2="0" y1="0" y2="22"/></svg></div>`;
    };
    return `<section class="vd-lanes">
      <header><div class="vd-seg" role="group" aria-label="Which clip">${slot.a.d ? `<button type="button" data-show="a" class="${which === "a" ? "on" : ""}">Inspiration</button>` : ""}${slot.b.d ? `<button type="button" data-show="b" class="${which === "b" ? "on" : ""}">Your clip</button>` : ""}</div>
        <strong>What is inside "${esc(d.title)}"</strong>
        <button type="button" data-act="to-film" data-which="${which}" title="One automation lane per curiosity on My film, with a node wherever it changes">Put these on my film's automation lanes</button></header>
      <ul class="vd-sum">${d.summary.map((s) => `<li>${esc(s)}</li>`).join("")}${d.cuts.length ? `<li>Cuts at ${d.cuts.map(fmt).join(", ")}.</li>` : ""}</ul>
      <p class="vd-k">Each lane runs across the whole clip, left to right. A diamond is a node: the moment that curiosity changes. "Measured" lanes are read straight from the picture and sound; "a guess" lanes are worked out from the others. Click a lane to play the clip from there.</p>
      <div class="vd-time"><span>0s</span><span>${fmt(d.duration / 2)}</span><span>${fmt(d.duration)}</span></div>
      ${elementLanes(d, which)}
      ${Object.keys(groups)
        .map((g) => `<div class="vd-group"><h4>${esc(g)}</h4>${groups[g].map(lane).join("")}</div>`)
        .join("")}
    </section>`;
  }
  function applySection() {
    const A = slot.a.d,
      B = slot.b.d;
    const title = prefs.title || B.title;
    const rows = V()
      .GROUPS.map((g) => {
        const amt = prefs.on[g.id] || 0;
        const ck = checks && checks[g.id];
        const missing = g.needs === "elements" && !(A.elements && B.elements);
        return `<div class="vd-apply-row${amt && !missing ? "" : " off"}">
          <label><input type="checkbox" data-on="${g.id}" ${amt ? "checked" : ""} ${missing ? "disabled" : ""}> <strong>${esc(g.label)}</strong>${missing ? ` <small class="vd-k">needs AI cut-outs of both clips</small>` : ""}</label>
          <input type="range" min="0" max="100" step="5" value="${Math.round(amt * 100)}" data-amt="${g.id}" aria-label="How much of ${esc(g.label)}" ${amt ? "" : "disabled"}><output>${Math.round(amt * 100)}%</output>
          <span class="vd-k">${esc(g.plain)}</span>
          <span class="vd-check">${ck ? checkText(ck) : ""}</span>
        </div>`;
      })
      .join("");
    const p = currentPlan();
    const dlg = prefs.on.dialogue
      ? `<div class="vd-dialogue"><label>Topic of the new lines (the clip's title) <input type="text" data-title value="${esc(title)}" maxlength="120"></label>
         ${p.lines.length ? `<ol>${p.lines.slice(0, 40).map((l) => `<li><span class="vd-k">${fmt(l.start)}–${fmt(l.end)} · ${l.syll} syllables (inspiration: ${l.want})</span> ${esc(l.text)}</li>`).join("")}</ol>${p.lines.length > 40 ? `<p class="vd-k">and ${p.lines.length - 40} more</p>` : ""}` : `<p class="vd-k">Nobody talks in the inspiration, so there are no lines to fit.</p>`}
         <p class="vd-k">Each line is as long as one sentence of the inspiration: the same number of syllables in the same seconds, with the same pauses between. Play it speaks them in your browser's voice and shows them as subtitles; a saved video keeps the subtitles (browsers can't record their own voice yet).</p></div>`
      : "";
    return `<section class="vd-apply">
      <header><strong>Apply "${esc(A.title)}" to "${esc(B.title)}"</strong>
        <label>Timing <select data-mode><option value="same" ${prefs.mode === "same" ? "selected" : ""}>Same speed as the inspiration (repeats if your clip is longer)</option><option value="stretch" ${prefs.mode === "stretch" ? "selected" : ""}>Stretch the inspiration over your whole clip</option></select></label>
        <span class="vd-seg"><button type="button" data-all="1">All on</button><button type="button" data-all="0">All off</button></span></header>
      <div class="vd-apply-list">${rows}</div>
      ${dlg}
      <div class="vd-player">
        <figure><figcaption>Your clip, as it is</figcaption><video data-slot="b" muted playsinline preload="auto"></video></figure>
        <figure><figcaption>With the inspiration's curiosities</figcaption><canvas class="vd-out" width="${outSize(slot.b.clip).w}" height="${outSize(slot.b.clip).h}"></canvas></figure>
      </div>
      <div class="vd-actions">
        <button type="button" data-act="play" ${playing ? "disabled" : ""}>▶ Play it</button>
        <button type="button" data-act="stop" ${playing ? "" : "disabled"}>Stop</button>
        <button type="button" data-act="check" ${playing ? "disabled" : ""} title="Draws the changed clip frame by frame, measures it again, and compares it with the inspiration">Check that it worked</button>
        <button type="button" data-act="save" ${playing ? "disabled" : ""}>Save as a video</button>
        ${saved && saved.url ? `<a href="${saved.url}" download="${esc(saved.name)}">Download ${esc(saved.name)}</a>` : ""}
      </div>
      <p class="vd-k">"Check that it worked" scores each curiosity: how closely your clip now rises and falls with the inspiration over time (1.00 is in step, 0 is unrelated), before and after.</p>
    </section>`;
  }
  function checkText(ck) {
    if (ck.feature === "cuts") return `cuts: inspiration ${ck.inspiration}, yours ${ck.before} → ${ck.after}`;
    if (ck.feature === "speech") return `talk ${Math.round(ck.after.talkShare * 100)}% of the time (inspiration ${Math.round(ck.inspiration.talkShare * 100)}%) · lines at ${ck.planned.sylPerSec.toFixed(1)} syllables a second (inspiration ${ck.inspiration.sylPerSec.toFixed(1)})`;
    const good = ck.corrAfter > ck.corrBefore + 0.1;
    return `<b class="${good ? "good" : "flat"}">in step ${ck.corrBefore.toFixed(2)} → ${ck.corrAfter.toFixed(2)}</b>`;
  }
  function outSize(clip) {
    const w = clip ? Math.min(960, clip.width) : 640;
    return { w, h: clip ? Math.round((w * clip.height) / clip.width / 2) * 2 : 360 };
  }
  function currentPlan() {
    return V().plan(slot.a.d, slot.b.d, { mode: prefs.mode, on: prefs.on, title: prefs.title || slot.b.d.title, lines });
  }

  /* ---------- actions ---------- */
  async function bring(k, file) {
    if (!file) return;
    C().stop();
    playing = false;
    try {
      const clip = await C().open(file);
      slot[k] = { clip, d: null, busy: { p: 0, what: "Opening" } };
      checks = null;
      lines = null;
      result = null;
      if (k === "b") prefs.title = "";
      note = "";
      draw();
      slot[k].d = await C().dissect(clip, {
        elements: prefs.ai,
        onProgress: (p, what) => {
          slot[k].busy = { p, what };
          const bar = page && page.querySelector(`[data-drop="${k}"] .vd-prog i`);
          if (bar) bar.style.width = Math.round(p * 100) + "%";
          else draw();
        },
      });
      slot[k].busy = null;
      if (k === "a" || !slot.a.d) show = k;
      if (!slot[k].d.raw.db) note = `"${clip.name}": this browser couldn't read the sound, so loudness and talking are left out for it.`;
    } catch (e) {
      slot[k] = { clip: null, d: null, busy: null };
      note = e.message || String(e);
    }
    draw();
  }
  function toFilm(which) {
    const d = slot[which].d;
    const E = window.CurioEngine;
    if (!d || !E) return say("The engine isn't loaded, so there is no film to put lanes on.");
    /* An empty film starts from the clip: one moment per stretch of the clip. */
    let st = E.state();
    const pre = [];
    if (!st.rows.length && window.CurioTracks) {
      const film = { name: d.title, rows: d.moments.map((m, i) => ({ id: "v" + (i + 1), label: m.label })), tracks: window.CurioTracks.forCast(["Person on screen"]) };
      pre.push({ type: "importFilm", film });
      st = Object.assign({}, st, { rows: film.rows, tracks: film.tracks, lanes: {} });
    }
    const cmds = pre.concat(V().engineCommands(d, st));
    if (!cmds.length) return say("My film has no moments yet. Add some first.");
    const r = E.send({ type: "batch", label: `Lanes from "${d.title}"`, commands: cmds });
    if (!r.ok) return say(r.error);
    try {
      E.send({ type: "addRef", ref: V().toRef(d) });
    } catch (e) {}
    const n = cmds.filter((c) => c.type === "setPoint").length;
    const lanesN = new Set(cmds.filter((c) => c.type === "setPoint").map((c) => c.curiosity)).size;
    say(`Put ${lanesN} lanes on My film with ${n} nodes, stretched over its ${E.state().rows.length} moments (one undo step). Open the Screen or Library, Engine to see them.`);
  }
  function say(t) {
    note = t;
    draw();
  }
  async function play(record) {
    if (!slot.a.d || !slot.b.d) return;
    const cv = page.querySelector("canvas.vd-out");
    const orig = page.querySelector(".vd-player video");
    playing = true;
    saved = record ? null : saved;
    page.querySelectorAll(".vd-actions button").forEach((b) => (b.disabled = b.dataset.act !== "stop"));
    const p = currentPlan();
    if (orig) {
      orig.currentTime = 0;
      orig.play().catch(() => {});
    }
    let blob = null;
    try {
      blob = await C().render(p, slot.b.clip, {
        canvas: cv,
        overlay: slot.a.clip,
        record,
        speak: true,
        onFrame: (t, a) => {
          if (orig && Math.abs(orig.currentTime - a.src) > 0.3) orig.currentTime = a.src;
        },
      });
    } catch (e) {
      note = "Playing stopped: " + (e.message || e);
    }
    if (orig) orig.pause();
    playing = false;
    try {
      saved = { frame: cv.getContext("2d").getImageData(0, 0, cv.width, cv.height) };
    } catch (e) {
      saved = null;
    }
    result = true;
    if (blob) {
      const name = (slot.b.d.title + " with " + slot.a.d.title).replace(/[^\w .-]+/g, "").slice(0, 80) + (blob.type.includes("mp4") ? ".mp4" : ".webm");
      saved = Object.assign(saved || {}, { url: URL.createObjectURL(blob), name });
      note = `Saved: ${name} (${(blob.size / 1e6).toFixed(1)} MB). Use the Download link.`;
    }
    draw();
  }
  async function check() {
    const p = currentPlan();
    playing = true;
    note = "Checking: drawing your clip with the changes, frame by frame, and measuring it again…";
    draw();
    try {
      const { after } = await C().check(p, slot.b.clip, {
        overlay: slot.a.clip,
        onProgress: (x) => {
          const n = page.querySelector(".vd-note");
          if (n) n.textContent = `Checking: ${Math.round(x * 100)}%`;
        },
      });
      checks = {};
      V().GROUPS.forEach((g) => {
        if (!prefs.on[g.id]) return;
        const s = V().score(p, g.id, slot.b.d, after);
        if (g.id === "dialogue") {
          const syl = p.lines.reduce((n, l) => n + l.syll, 0),
            secs = p.lines.reduce((n, l) => n + (l.end - l.start), 0);
          s.after = { talkShare: secs / Math.max(0.1, p.duration) };
          s.planned = { sylPerSec: syl / Math.max(0.1, secs) };
        }
        checks[g.id] = s;
      });
      note = "Checked. Each curiosity shows how in step your clip is with the inspiration, before → after.";
    } catch (e) {
      note = "The check stopped: " + (e.message || e);
    }
    playing = false;
    draw();
  }

  /* ---------- events ---------- */
  function wire(el) {
    el.addEventListener("click", (e) => {
      const t = e.target.closest("button,[data-seekto]");
      if (!t) return;
      const act = t.dataset.act;
      if (act === "close") return close();
      if (act === "swap") {
        C().stop();
        [slot.a, slot.b] = [slot.b, slot.a];
        checks = null;
        lines = null;
        prefs.title = "";
        show = "a";
        note = "Swapped: your clip is now the inspiration.";
        return draw();
      }
      if (act === "to-film") return toFilm(t.dataset.which);
      if (act === "play") return play(false);
      if (act === "save") return play(true);
      if (act === "stop") return C().stop();
      if (act === "check") return check();
      if (act === "ai-key-save") {
        const inp = page.querySelector('[data-ai-key="fal"]');
        if (inp && inp.value.trim()) window.CurioAI.setKey("fal", inp.value.trim());
        return say(window.CurioAI.key("fal") ? "Your fal.ai key is kept in this browser only." : "Paste a key first.");
      }
      if (act === "ai-key-clear") {
        window.CurioAI.setKey("fal", "");
        return say("Removed your fal.ai key from this browser.");
      }
      if (act === "ai-preview") return aiPreview();
      if (t.dataset.show) {
        show = t.dataset.show;
        return draw();
      }
      if (t.dataset.all != null) {
        V().GROUPS.forEach((g) => (prefs.on[g.id] = t.dataset.all === "1" ? (g.off ? prefs.on[g.id] : 1) : 0));
        keep();
        checks = null;
        return draw();
      }
    });
    el.addEventListener("change", (e) => {
      const t = e.target;
      if (t.dataset.file) return bring(t.dataset.file, t.files && t.files[0]);
      if (t.dataset.aiOn != null) {
        prefs.ai = t.checked;
        keep();
        if (prefs.ai) window.CurioMask.load().then(draw);
        return draw();
      }
      if (t.dataset.aiPick != null) {
        window.CurioAI.choose("cutout", t.value);
        const pk = window.CurioAI.use("cutout");
        return say(pk && pk.id === t.value ? "" : "That AI needs its key first; the free browser AI is used until then.");
      }
      if (t.dataset.on) {
        prefs.on[t.dataset.on] = t.checked ? 1 : 0;
        checks = null;
      } else if (t.dataset.amt) {
        prefs.on[t.dataset.amt] = Number(t.value) / 100;
        checks = null;
      } else if (t.dataset.mode != null) {
        prefs.mode = t.value === "stretch" ? "stretch" : "same";
        checks = null;
      } else if (t.dataset.title != null) {
        prefs.title = t.value.slice(0, 120);
        lines = null;
      } else return;
      keep();
      draw();
    });
    el.addEventListener("input", (e) => {
      if (e.target.dataset.amt) {
        const o = e.target.nextElementSibling;
        if (o) o.textContent = e.target.value + "%";
      }
    });
    /* Drop a file on either box. */
    el.addEventListener("dragover", (e) => {
      const box = e.target.closest("[data-drop]");
      if (!box) return;
      e.preventDefault();
      box.classList.add("over");
    });
    el.addEventListener("dragleave", (e) => {
      const box = e.target.closest("[data-drop]");
      if (box) box.classList.remove("over");
    });
    el.addEventListener("drop", (e) => {
      const box = e.target.closest("[data-drop]");
      if (!box) return;
      e.preventDefault();
      const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (f) bring(box.dataset.drop, f);
    });
    /* A lane's name plays the clip from its first change; the playhead follows the clip. */
    el.addEventListener(
      "timeupdate",
      (e) => {
        const v = e.target;
        if (!v.dataset || !v.dataset.slot) return;
        const d = slot[v.dataset.slot].d;
        if (!d) return;
        el.querySelectorAll(`svg[data-strip="${v.dataset.slot}"] .vd-head`).forEach((l) => {
          const x = (v.currentTime / d.duration) * 1000;
          l.setAttribute("x1", x);
          l.setAttribute("x2", x);
        });
      },
      true
    );
    el.addEventListener("click", (e) => {
      const s = e.target.closest("svg[data-strip]");
      if (!s) return;
      const k = s.dataset.strip,
        d = slot[k].d;
      const v = el.querySelector(`.vd-clips video[data-slot="${k}"]`);
      if (!d || !v) return;
      const r = s.getBoundingClientRect();
      v.currentTime = ((e.clientX - r.left) / r.width) * d.duration;
    });
  }
  /* Tint what the AI found on the frame showing in your clip's box, in the output canvas. */
  function aiPreview() {
    const v = page && page.querySelector('.vd-clips video[data-slot="b"]'),
      cv = page && page.querySelector("canvas.vd-out");
    if (!v || !cv || !window.CurioMask.ready()) return;
    note = "Red: hair. Green: skin. Yellow: faces. Blue: clothes. Pink: glasses and hats. The rest is the set.";
    saved = null;
    draw();
    const cv2 = page.querySelector("canvas.vd-out");
    const x = cv2.getContext("2d", { willReadFrequently: true });
    x.drawImage(v, 0, 0, cv2.width, cv2.height);
    window.CurioMask.preview(x, cv2.width, cv2.height);
    saved = { frame: x.getImageData(0, 0, cv2.width, cv2.height) };
    result = true;
  }
  function open() {
    if (!page) {
      page = document.createElement("div");
      page.className = "vd-page";
      document.body.appendChild(page);
      wire(page);
    }
    page.hidden = false;
    document.documentElement.classList.add("vd-open");
    draw();
    /* The AI cut-out loads in the background so it is ready when a clip comes in. */
    if (prefs.ai && window.CurioMask && !window.CurioMask.ready())
      window.CurioMask.load().then(() => {
        if (page && !page.hidden && !slot.a.busy && !slot.b.busy) draw();
      });
  }
  function close() {
    C().stop();
    if (page) page.hidden = true;
    document.documentElement.classList.remove("vd-open");
  }
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && page && !page.hidden) close();
  });

  /* Library item, and a button on the Screen's bar whenever the Screen draws it. */
  function addMenuItem() {
    const menu = document.getElementById("lib-menu");
    if (!menu || menu.querySelector("[data-video]")) return;
    const b = document.createElement("button");
    b.type = "button";
    b.dataset.video = "1";
    b.innerHTML = "Take a clip apart<small>import a video, find its curiosities, apply them to another clip</small>";
    b.addEventListener("click", () => {
      menu.hidden = true;
      const lib = document.getElementById("lib-btn");
      if (lib) lib.setAttribute("aria-expanded", "false");
      open();
    });
    menu.appendChild(b);
  }
  function addScreenButton() {
    document.querySelectorAll(".sc-bar").forEach((bar) => {
      if (bar.querySelector("[data-video-open]")) return;
      const b = document.createElement("button");
      b.type = "button";
      b.dataset.videoOpen = "1";
      b.textContent = "Import a video";
      b.title = "Take a video clip apart into curiosities and apply them to another clip";
      b.addEventListener("click", open);
      const close = bar.querySelector(".sc-close");
      bar.insertBefore(b, close || null);
    });
  }
  addMenuItem();
  addScreenButton();
  let queued = false;
  if (window.MutationObserver)
    new MutationObserver(() => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        addScreenButton();
      });
    }).observe(document.body, { childList: true, subtree: true });

  window.CurioVideoUI = { open, close, bring, state: () => ({ a: slot.a.d, b: slot.b.d, prefs: JSON.parse(JSON.stringify(prefs)), checks }) };
})();
