/* video/ui.js: the Video window. Bring in two clips, take the inspiration apart into curiosities (each one a
   lane with a node wherever it changes), put those lanes on My film, and apply them, one by one or all at once,
   to your clip, then check that the change really happened and save the result.

   Opens from Library, "Take a clip apart", and from an "Import a video" button on the Screen's bar.
   window.CurioVideoUI = { open(), close(), state() }
   Settings (which curiosities to apply, how much, which sections of the list are open, same speed or stretched) are kept under
   localStorage curiosities-video-v1. The clips themselves stay on your computer: nothing is uploaded or saved. */
(function () {
  const V = () => window.CurioVideo;
  const C = () => window.CurioClip;
  const KEY = "curiosities-video-v1";
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const prefs = load();
  if (window.CurioDetail) window.CurioDetail.configure({ on: prefs.detail });
  if (window.CurioWiden) window.CurioWiden.configure({ on: prefs.wider });
  const slot = { a: { clip: null, d: null, busy: null }, b: { clip: null, d: null, busy: null } };
  let page = null,
    paidOpen = false,
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
    return { mode: p.mode === "stretch" ? "stretch" : "same", on, title: typeof p.title === "string" ? p.title.slice(0, 120) : "", ai: p.ai !== false, tilt: p.tilt === true, detail: p.detail !== false, wider: p.wider !== false, open: openOf(p.open), pool: Array.isArray(p.pool) ? p.pool.slice(0, 200).map((x) => String(x).slice(0, 160)) : [] };
  }
  /* Which sections of the switch list are open: { sectionId: true or false }. */
  function openOf(o) {
    const r = {};
    if (o && typeof o === "object") Object.keys(o).slice(0, 20).forEach((k) => typeof o[k] === "boolean" && (r[String(k).slice(0, 20)] = o[k]));
    return r;
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
         ${s.busy ? `<div class="vd-prog"><i style="width:${Math.round(s.busy.p * 100)}%"></i></div><p class="vd-k">${esc(s.busy.what)}…</p>` : s.d ? `<p class="vd-k">Taken apart: ${V().lanesOf(s.d).length} curiosities, ${V().lanesOf(s.d).reduce((n, c) => n + c.nodes.length, 0)} nodes.</p>` : ""}
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
    const st = !prefs.ai ? "off" : M.ready() ? "ready" : M.failed() ? "the free AI couldn't download, maybe you're offline; everything else still works" : "loads when you bring in a clip";
    const fal = list.find((x) => x.company === "fal");
    const hasKey = !!AI.key("fal");
    return `<section class="vd-ai">
      <header><strong>AI cut-outs</strong><span class="vd-k">Finds the people in every frame and splits them into hair, face, skin and clothes, with the rest as the set, so one element can change on its own (${esc(st)}).</span></header>
      <div class="vd-ai-row">
        <label><input type="checkbox" data-ai-on ${prefs.ai ? "checked" : ""}> Do it automatically when a clip comes in</label>
        <label title="Face swaps run on the paid tier. On for your own clips; anyone else shown must agree first."><input type="checkbox" data-ai-face ${AI.faceSwap().own ? "checked" : ""}> Face swap on my own clips</label>
        ${slot.b.clip && AI.faceSwap().own ? `<label><input type="checkbox" data-ai-agree ${AI.agreed(slot.b.clip.name) ? "checked" : ""}> Everyone in "${esc(slot.b.clip.name)}" agreed (or it's only me)</label>` : ""}
        <label>Which AI <select data-ai-pick>${list.map((x) => `<option value="${esc(x.id)}" ${x.id === pick ? "selected" : ""}>${esc(x.label)}</option>`).join("")}</select></label>
        ${slot.b.clip && M.ready() ? `<button type="button" data-act="ai-preview" title="Tints what the AI found on the frame showing in your clip's box">Show what it found</button>` : ""}
        ${slot.b.clip && M.ready() && window.CurioRig && window.CurioRig.fromCutout ? `<button type="button" data-act="ai-puppet" title="Cuts the people out of the frame showing in your clip's box and opens them as a rigged flat puppet">Make a puppet</button>` : ""}
      </div>
      ${
        fal
          ? `<details class="vd-ai-paid"${hasKey || paidOpen ? " open" : ""}><summary>Paid tier (opt in): stronger AI for final versions</summary>
        <p class="vd-k">Everything above is free and needs no key. Turn this on only if you want a stronger paid AI. You pay fal.ai directly with your own key.</p>
        <div class="vd-ai-row"><label>fal.ai key <input type="password" data-ai-key="fal" autocomplete="off" placeholder="${hasKey ? "saved in this browser" : "paste your own key"}"></label>
        <button type="button" data-act="ai-key-save">Keep it in this browser</button>${hasKey ? `<button type="button" data-act="ai-key-clear">Remove it</button>` : ""}
        <span class="vd-k">Your key stays in this browser and is sent only to fal.ai. It is never saved in a project file. Cost: ${esc(fal.cost({ seconds: Math.min(5, slot.b.clip ? slot.b.clip.duration : 5) }))}.</span></div>
        <div class="vd-ai-row"><label>Stop any job over $<input type="number" min="0.05" max="100" step="0.05" data-ai-cap="job" value="${AI.caps().job}"></label>
        <label>Stop for the day after $<input type="number" min="0.1" max="100" step="0.5" data-ai-cap="day" value="${AI.caps().day}"></label>
        ${hasKey && slot.b.clip && widenPaid() ? `<div class="vd-ai-row"><button type="button" data-act="ai-widen" title="Makes the frame showing in your clip's box wider, with AI painting the new edges (the free fill does this on every frame)">Paint wider edges with AI</button><span class="vd-k">One still frame, ${esc(widenPaid().cost({ frames: 1 }))}.</span></div>` : ""}
        <span class="vd-k">Spent today in this browser: $${AI.spent().dollars.toFixed(2)}. Every paid job shows its price first and keeps to short clips (5 seconds or less).</span></div></details>`
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
    const row = (name, small, svg) => `<div class="vd-lane"><button type="button" class="vd-lname" data-seekto="${which}" data-at="0">${esc(name)}<small>AI cut-out</small></button><svg class="vd-strip" viewBox="0 0 ${W} 22" preserveAspectRatio="none" data-strip="${which}">${svg}<line class="vd-head" x1="0" x2="0" y1="0" y2="22"/></svg></div>`;
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
    V()
      .lanesOf(d)
      .forEach((c) => (groups[c.group] = groups[c.group] || []).push(c));
    const W = 1000;
    const lane = (c) => {
      const nodes = c.nodes;
      const est = c.how === "estimated";
      const name = c.name || label(c.id);
      const shown = (v) => (c.unit ? v + " " + c.unit : String(v));
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
          const txt = w > 46 ? `<text x="${x + 4}" y="15">${esc(shown(n.value).slice(0, Math.floor(w / 7)))}</text>` : "";
          return `<g><title>${esc(name)}: ${esc(shown(n.value))} from ${fmt(n.t)}</title><rect x="${x}" y="2" width="${w}" height="18" style="fill:${fill}"/>${txt}${i ? `<path class="vd-node" d="M${x} 1 l4 5 l-4 5 l-4 -5z"/>` : ""}</g>`;
        })
        .join("");
      return `<div class="vd-lane"><button type="button" class="vd-lname" data-seekto="${which}" data-at="${nodes.length > 1 ? nodes[1].t : 0}" data-lane="${esc(c.id)}" title="${esc(c.from)}">${esc(name)}<small class="${est ? "est" : ""}">${est ? "a guess" : "measured"} · ${nodes.length - 1} change${nodes.length === 2 ? "" : "s"}</small></button><svg class="vd-strip" viewBox="0 0 ${W} 22" preserveAspectRatio="none" data-strip="${which}">${blocks}<line class="vd-head" x1="0" x2="0" y1="0" y2="22"/></svg></div>`;
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
  /* The switches in a few plain sections, each folding open and shut (which are open is kept in prefs.open).
     A switch from a file this list doesn't know yet lands in "More". */
  const SECTIONS = [
    { id: "light", label: "Light and color", ids: ["light", "contrast", "color", "warmth", "relight"] },
    { id: "camera", label: "Camera", ids: ["shake", "move", "size", "framing", "angle"] },
    { id: "people", label: "People and the set", ids: ["wardrobe", "hair", "figure", "set"] },
    { id: "look", label: "Look of the picture", ids: ["palette", "grain", "shape", "overlay"] },
    { id: "rhythm", label: "Rhythm and motion", ids: ["cuts", "speed", "rhythm", "burst", "shutter"] },
    { id: "sound", label: "Sound and words", ids: ["loud", "dialogue", "music"] },
  ];
  /* One plain line per switch (the long story is under "More"). */
  const SHORT = {
    light: "Gets lighter and darker when the inspiration does.",
    contrast: "Makes the darks and lights further apart or closer, like the inspiration.",
    color: "Makes colors stronger or paler, like the inspiration.",
    warmth: "Tints the picture orange or blue, like the inspiration.",
    relight: "Lights your people from the same side as the inspiration's.",
    shake: "Shakes like the inspiration's camera, or holds as still.",
    move: "Slides and pushes in the way the inspiration's camera moves.",
    size: "Moves in closer when the inspiration is closer.",
    framing: "A virtual camera places your person in the frame where the inspiration's person is.",
    angle: "Looks a little more down or up at your people, like the inspiration's camera height.",
    wardrobe: "Changes only the clothes to the inspiration's clothes colors.",
    hair: "Changes only the hair to the inspiration's hair color.",
    figure: "Makes your people as big, and as far left or right, as the inspiration's.",
    set: "Puts your people in the inspiration's place.",
    palette: "Gives your clip the inspiration's color grade.",
    grain: "Makes your picture as soft or sharp, and as grainy, as the inspiration.",
    shape: "Black bars and dark edges like the inspiration's picture.",
    overlay: "Lays the inspiration's shapes, logos and text on top of your clip.",
    cuts: "Cuts where the inspiration cuts.",
    speed: "Speeds up where the inspiration moves more, slows where it moves less.",
    rhythm: "Cuts and punches in on the inspiration's beat.",
    burst: "Freezes on each beat, then rushes to catch up.",
    shutter: "Smears and stutters movement the way the inspiration does.",
    loud: "Gets louder and quieter with the inspiration.",
    dialogue: "Writes new lines timed like the inspiration's talking.",
    music: "Plays the inspiration's sound under yours.",
  };
  /* One-click recipes: what they list goes on (an amount you already set is kept), everything else goes off. */
  const RECIPES = [
    { id: "look", label: "Just the look", plain: "light, color, grade, grain", ids: ["light", "contrast", "color", "warmth", "palette", "grain"] },
    { id: "camera", label: "Its camera", plain: "shake, moves, how close", ids: ["shake", "move", "size", "framing"] },
    { id: "rhythm", label: "Its rhythm", plain: "beat, speed, music", ids: ["rhythm", "speed", "music"] },
    { id: "all", label: "Everything", plain: "all but the three big swaps", ids: null, skip: ["overlay", "set", "burst"] },
  ];
  const recipeIds = (r) => (r.ids ? r.ids.filter((id) => V().GROUPS.some((g) => g.id === id)) : V().GROUPS.map((g) => g.id).filter((id) => !r.skip.includes(id)));
  function useRecipe(id) {
    const r = RECIPES.find((x) => x.id === id);
    if (!r) return;
    const want = recipeIds(r);
    V().GROUPS.forEach((g) => (prefs.on[g.id] = want.includes(g.id) ? prefs.on[g.id] || 1 : 0));
    /* the sections it turned something on in fold open */
    sectionsOf().forEach((s) => {
      if (s.groups.some((g) => want.includes(g.id))) prefs.open[s.id] = true;
    });
  }
  function sectionsOf() {
    const all = V().GROUPS;
    const known = new Set(SECTIONS.reduce((a, s) => a.concat(s.ids), []));
    const list = SECTIONS.map((s) => ({ id: s.id, label: s.label, groups: s.ids.map((id) => all.find((g) => g.id === id)).filter(Boolean) }));
    const rest = all.filter((g) => !known.has(g.id));
    if (rest.length) list.push({ id: "more", label: "More", groups: rest });
    return list.filter((s) => s.groups.length);
  }
  const missingOf = (g, A, B) => !!(g.needs && !(A[g.needs] && B[g.needs]));
  const needText = (g) => (g.needs === "looks" || g.needs === "shutter" ? "needs both clips brought in again" : "needs the AI cut-outs of both clips");
  function applyRow(g, A, B) {
    const amt = prefs.on[g.id] || 0;
    const ck = checks && checks[g.id];
    const missing = missingOf(g, A, B);
    const short = SHORT[g.id] || g.plain.split(/(?<=\.) /)[0];
    return `<div class="vd-apply-row${amt && !missing ? "" : " off"}" data-row="${g.id}">
          <label class="vd-sw"><input type="checkbox" data-on="${g.id}" ${amt ? "checked" : ""} ${missing ? "disabled" : ""}><span><strong>${esc(g.label)}</strong><small>${esc(short)}</small>${missing ? `<em class="vd-need">${needText(g)}</em>` : ""}</span></label>
          <div class="vd-amt"><input type="range" min="0" max="100" step="5" value="${Math.round(amt * 100)}" data-amt="${g.id}" aria-label="How much of ${esc(g.label)}" ${amt && !missing ? "" : "disabled"}><output>${Math.round(amt * 100)}%</output></div>
          ${ck ? `<span class="vd-check">${checkText(ck)}</span>` : ""}
          ${g.id === "framing" && amt && !missing ? `<label class="vd-sub"><input type="checkbox" data-tilt ${prefs.tilt ? "checked" : ""}> Dutch tilt too <small>(roll the frame like the inspiration's horizon)</small></label>` : ""}
          <details class="vd-more"><summary>More</summary><p>${esc(g.plain)}</p></details>
        </div>`;
  }
  function applySection() {
    const A = slot.a.d,
      B = slot.b.d;
    const title = prefs.title || B.title;
    const onIds = V().GROUPS.filter((g) => prefs.on[g.id] > 0).map((g) => g.id);
    const same = (ids) => ids.length === onIds.length && ids.every((id) => onIds.includes(id));
    const recipes = RECIPES.map((r) => {
      const hit = onIds.length && same(recipeIds(r));
      return `<button type="button" data-recipe="${r.id}" class="${hit ? "on" : ""}" aria-pressed="${hit ? "true" : "false"}"><strong>${esc(r.label)}</strong><small>${esc(r.plain)}</small></button>`;
    }).join("");
    const rows = sectionsOf()
      .map((s) => {
        const on = s.groups.filter((g) => prefs.on[g.id] > 0 && !missingOf(g, A, B));
        const cant = s.groups.filter((g) => missingOf(g, A, B)).length;
        const open = prefs.open[s.id] != null ? prefs.open[s.id] : s.id === "light";
        return `<details class="vd-sec" data-sec="${s.id}"${open ? " open" : ""}>
          <summary><strong>${esc(s.label)}</strong><span class="vd-count${on.length ? " some" : ""}">${on.length} of ${s.groups.length} on</span><span class="vd-which">${on.length ? esc(on.map((g) => g.label).join(", ")) : cant ? `${cant} need${cant === 1 ? "s" : ""} the AI cut-outs or both clips` : "all off"}</span></summary>
          <div class="vd-sec-body">${s.groups.map((g) => applyRow(g, A, B)).join("")}${s.id === "camera" ? `<label class="vd-sub vd-detail" title="When your clip is zoomed in, its compression blocks are softened and its edges sharpened, without halos"><input type="checkbox" data-detail ${prefs.detail ? "checked" : ""}> Sharper zooms <small>(cleans and sharpens any zoomed-in picture)</small></label><label class="vd-sub vd-wider" title="When the inspiration's shot is wider than yours, your picture shrinks into the middle and the new edges are filled in, up to 25% wider"><input type="checkbox" data-wider ${prefs.wider ? "checked" : ""}> Wider shots <small>(fills in new edges when the inspiration is wider)</small></label>` : ""}</div>
        </details>`;
      })
      .join("");
    const p = currentPlan();
    const dlg = prefs.on.dialogue
      ? `<div class="vd-dialogue"><label>Topic of the new lines (the clip's title) <input type="text" data-title value="${esc(title)}" maxlength="120"></label>
         <label>Or write your own lines, one per line (they are fitted to the inspiration's sentences instead) <textarea data-pool rows="3">${esc((prefs.pool || []).join("\n"))}</textarea></label>
         ${p.lines.length ? `<ol>${p.lines.slice(0, 40).map((l) => `<li><span class="vd-k">${fmt(l.start)}–${fmt(l.end)} · ${l.syll} syllables (inspiration: ${l.want})</span> ${esc(l.text)}</li>`).join("")}</ol>${p.lines.length > 40 ? `<p class="vd-k">and ${p.lines.length - 40} more</p>` : ""}` : `<p class="vd-k">Nobody talks in the inspiration, so there are no lines to fit.</p>`}
         <p class="vd-k">Each line is as long as one sentence of the inspiration: the same number of syllables in the same seconds, with the same pauses between. Play it speaks them in your browser's voice and shows them as subtitles; a saved video keeps the subtitles (browsers can't record their own voice yet).</p></div>`
      : "";
    return `<section class="vd-apply">
      <header><strong>Apply "${esc(A.title)}" to "${esc(B.title)}"</strong>
        <label>Timing <select data-mode><option value="same" ${prefs.mode === "same" ? "selected" : ""}>Same speed as the inspiration (repeats if your clip is longer)</option><option value="stretch" ${prefs.mode === "stretch" ? "selected" : ""}>Stretch the inspiration over your whole clip</option></select></label>
      </header>
      <div class="vd-recipes" role="group" aria-label="Quick picks">${recipes}<span class="vd-seg"><button type="button" data-all="1" title="The switches that are on when you start">The usual</button><button type="button" data-all="0">All off</button></span></div>
      <p class="vd-k">Or open a section and pick switches one by one. The slider sets how much.</p>
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
    if (ck.note) return esc(ck.note);
    if (ck.feature === "shutter") return `<b class="${ck.gapAfter < ck.gapBefore * 0.7 ? "good" : "flat"}">${esc(ck.text)}</b>`;
    /* looks: how far from the inspiration's look, before and after (0 = the same) */
    if (/^lk:/.test(ck.feature)) return `<b class="${ck.gapAfter < ck.gapBefore * 0.7 ? "good" : "flat"}">off by ${ck.gapBefore.toFixed(3)} → ${ck.gapAfter.toFixed(3)}</b>`;
    const good = ck.corrAfter > ck.corrBefore + 0.1;
    return `<b class="${good ? "good" : "flat"}">in step ${ck.corrBefore.toFixed(2)} → ${ck.corrAfter.toFixed(2)}</b>`;
  }
  function outSize(clip) {
    const w = clip ? Math.min(960, clip.width) : 640;
    return { w, h: clip ? Math.round((w * clip.height) / clip.width / 2) * 2 : 360 };
  }
  function currentPlan() {
    return V().plan(slot.a.d, slot.b.d, { mode: prefs.mode, on: prefs.on, title: prefs.title || slot.b.d.title, lines, pool: prefs.pool, framing: { tilt: prefs.tilt }, wider: prefs.wider });
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
    let ref = null;
    try {
      ref = { type: "addRef", ref: V().toRef(d) };
    } catch (e) {}
    /* The reference rides in the same batch, so one undo takes it all back. */
    let r = E.send({ type: "batch", label: `Lanes from "${d.title}"`, commands: ref ? cmds.concat(ref) : cmds });
    if (!r.ok && ref) r = E.send({ type: "batch", label: `Lanes from "${d.title}"`, commands: cmds });
    if (!r.ok) return say(r.error);
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
    /* The paid-tier box stays open across redraws once opened. */
    el.addEventListener(
      "toggle",
      (e) => {
        if (e.target.classList && e.target.classList.contains("vd-ai-paid")) paidOpen = e.target.open;
        /* a section of switches remembers whether it is open (no redraw: the page already shows it) */
        if (e.target.dataset && e.target.dataset.sec && prefs.open[e.target.dataset.sec] !== e.target.open) {
          prefs.open[e.target.dataset.sec] = e.target.open;
          keep();
        }
      },
      true
    );
    el.addEventListener("click", (e) => {
      const t = e.target.closest("button,[data-seekto]");
      if (!t) return;
      if (t.dataset.seekto) return seekPlay(t.dataset.seekto, +t.dataset.at || 0);
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
      if (act === "ai-puppet") return aiPuppet();
      if (act === "ai-widen") return aiWiden();
      if (t.dataset.show) {
        show = t.dataset.show;
        return draw();
      }
      if (t.dataset.recipe) {
        useRecipe(t.dataset.recipe);
        keep();
        checks = null;
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
      if (t.dataset.aiCap) {
        window.CurioAI.setCaps({ [t.dataset.aiCap]: t.value });
        const c = window.CurioAI.caps();
        return say(`Paid AI stops at $${c.job.toFixed(2)} a job and $${c.day.toFixed(2)} a day.`);
      }
      if (t.dataset.aiFace != null) {
        window.CurioAI.setFaceSwap({ own: t.checked });
        return draw();
      }
      if (t.dataset.aiAgree != null && slot.b.clip) {
        window.CurioAI.agree(slot.b.clip.name, t.checked);
        return say(t.checked ? "Noted: everyone shown agreed, so faces in this clip can be swapped." : "Faces in this clip won't be swapped until everyone shown agrees.");
      }
      if (t.dataset.aiOn != null) {
        prefs.ai = t.checked;
        keep();
        if (prefs.ai) window.CurioMask.load().then(() => scanMissing().then(draw));
        return draw();
      }
      if (t.dataset.aiPick != null) {
        window.CurioAI.choose("cutout", t.value);
        return say(t.value === "mediapipe" ? "" : "That AI isn't wired into playback yet, so the free browser AI is still used for now.");
      }
      if (t.dataset.on) {
        prefs.on[t.dataset.on] = t.checked ? 1 : 0;
        checks = null;
      } else if (t.dataset.amt) {
        prefs.on[t.dataset.amt] = Number(t.value) / 100;
        checks = null;
      } else if (t.dataset.tilt != null) {
        prefs.tilt = t.checked;
        checks = null;
      } else if (t.dataset.wider != null) {
        prefs.wider = t.checked;
        if (window.CurioWiden) window.CurioWiden.configure({ on: prefs.wider });
        checks = null;
      } else if (t.dataset.detail != null) {
        prefs.detail = t.checked;
        if (window.CurioDetail) window.CurioDetail.configure({ on: prefs.detail });
      } else if (t.dataset.mode != null) {
        prefs.mode = t.value === "stretch" ? "stretch" : "same";
        checks = null;
      } else if (t.dataset.pool != null) {
        prefs.pool = t.value.split("\n").map((x) => x.trim()).filter(Boolean).slice(0, 200);
        lines = null;
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
      seekPlay(k, ((e.clientX - r.left) / r.width) * d.duration);
    });
  }
  /* Click a lane: the clip plays from there (a lane's name plays from its first change). */
  function seekPlay(k, at) {
    const v = page && page.querySelector(`.vd-clips video[data-slot="${k}"]`);
    if (!v) return;
    v.currentTime = Math.max(0, Math.min(at, (v.duration || at) - 0.05));
    const p = v.play();
    if (p && p.catch) p.catch(() => {});
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
  /* The people in the frame showing now, cut out, opened as a rigged flat puppet (Maya's rig, CurioRig). */
  async function aiPuppet() {
    const v = page && page.querySelector('.vd-clips video[data-slot="b"]');
    if (!v || !v.videoWidth || !window.CurioMask.ready() || !(window.CurioRig && window.CurioRig.fromCutout)) return;
    const W = Math.min(640, v.videoWidth),
      H = Math.round((W * v.videoHeight) / v.videoWidth);
    const c = window.CurioMask.cutoutCanvas(v, W, H);
    if (!c) return say("The AI found no people in this frame.");
    try {
      await window.CurioRig.fromCutout(c, (slot.b.clip && slot.b.clip.name) || "Cut-out");
      say("Opened the people in this frame as a puppet.");
    } catch (e) {
      say("Couldn't make the puppet: " + ((e && e.message) || "the rig didn't open") + ".");
    }
  }
  /* The paid wider frame: the frame showing in your clip's box, made wider with AI-painted edges (as wide as the
     plan wants there, or the widest the free fill goes), shown in the output box. Under the price caps. */
  const widenPaid = () => window.CurioAI && window.CurioAI.providers("picture").find((x) => x.id === "fal-outpaint");
  async function aiWiden() {
    const v = page && page.querySelector('.vd-clips video[data-slot="b"]'),
      P = widenPaid();
    if (!v || !v.videoWidth || !P) return;
    const W = Math.min(1024, v.videoWidth),
      H = Math.round((W * v.videoHeight) / v.videoWidth);
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    c.getContext("2d").drawImage(v, 0, 0, W, H);
    let s = window.CurioWiden ? window.CurioWiden.MIN : 0.8;
    try {
      const a = slot.a.d && slot.b.d ? V().at(currentPlan(), v.currentTime) : null;
      if (a && a.widen < 1) s = a.widen;
    } catch (e) {}
    say("Painting wider edges with AI (" + P.cost({ frames: 1 }) + ")...");
    try {
      const out = await P.widenFrame(c.toDataURL("image/jpeg", 0.9), s, { width: W, height: H });
      if (!out.imageUrl) return say("The AI sent no picture back.");
      const img = new Image();
      img.crossOrigin = "anonymous";
      await new Promise((ok, bad) => {
        img.onload = ok;
        img.onerror = bad;
        img.src = out.imageUrl;
      });
      note = "Wider with AI-painted edges (one still frame). The free fill does this on every frame as it plays.";
      saved = null;
      draw();
      const cv = page.querySelector("canvas.vd-out");
      const x = cv.getContext("2d", { willReadFrequently: true });
      x.drawImage(img, 0, 0, cv.width, cv.height);
      try {
        saved = { frame: x.getImageData(0, 0, cv.width, cv.height) };
      } catch (e) {}
      result = true;
    } catch (e) {
      say("Couldn't paint wider edges: " + ((e && e.message) || "the AI didn't answer") + ".");
    }
  }
  /* Clips brought in while the AI was off get their cut-outs now. */
  async function scanMissing() {
    for (const k of ["a", "b"]) {
      const s = slot[k];
      if (!s.clip || !s.d || s.d.elements || s.busy) continue;
      s.busy = { p: 0, what: "Finding the people and their clothes (AI)" };
      draw();
      try {
        const el = await window.CurioMask.scan(s.clip, { onProgress: (p) => (s.busy = { p, what: "Finding the people and their clothes (AI)" }) });
        if (el) s.d.elements = el;
      } catch (e) {}
      s.busy = null;
      checks = null;
    }
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
    if (e.key === "Escape" && page && !page.hidden && !e.defaultPrevented && !document.querySelector("dialog[open]")) close();
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
