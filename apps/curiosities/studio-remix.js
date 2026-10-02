/* Remix: a Maya Time Editor for curiosities. Clips are strands taken from a study (a span of
   beats, one curiosity group or all), from a suite held for N beats, or from the board as it
   stands. Tracks stack like animation layers: the lowest track is the base, a higher track
   overrides only the curiosities it carries, with a weight (numbers blend, choices switch above
   0.5), mute and solo. Clips move, trim, loop, retime (0.25x to 4x with an ease curve), reverse,
   and crossfade where two clips overlap on one track. "A is to B as C is to D" swaps one
   curiosity group in a clip for the same slice from another source: one slice, never a whole work. */

(function () {
  if (!window.CuriosityStudio) return;
  const KEY = "curiosities-studio-remix-v1";
  const BW = 30; /* pixels per beat on the timeline */
  const SPEEDS = [0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4];
  const RAMPS = ["constant", "ease in", "ease out"];
  const HUES = [18, 200, 140, 280, 45, 330, 100, 240];
  let timer = null;

  const CATS = typeof CURIOSITIES !== "undefined" ? CURIOSITIES : [];
  const SUITE_LIST = typeof SUITES !== "undefined" ? SUITES : [];
  const groupOf = (id) => (CATS.find((c) => c.id === id) || {}).group || "Other";
  const labelOf = (id) => (CATS.find((c) => c.id === id) || {}).label || id;
  const GROUPS = Array.from(new Set(CATS.map((c) => c.group)));
  const LIVE = new Set(CATS.filter((c) => c.live).map((c) => c.id));
  const uid = () => "r" + Math.random().toString(36).slice(2, 9);

  function css() {
    if (document.getElementById("studio-remix")) return;
    const st = document.createElement("style");
    st.id = "studio-remix";
    st.textContent = `
      .rx-grid > div { min-width: 0; }
      .rx-time { overflow-x: auto; border: 2px solid var(--ink); background: var(--paper); position: relative; }
      .rx-row { display: flex; align-items: stretch; border-bottom: 1px solid color-mix(in srgb, var(--ink) 25%, transparent); min-height: 38px; }
      .rx-head { flex: 0 0 168px; position: sticky; left: 0; z-index: 3; background: var(--paper); border-right: 2px solid var(--ink); padding: 4px 6px; font-size: 12px; display: flex; flex-direction: column; gap: 2px; }
      .rx-head input[type=range] { width: 100%; }
      .rx-head .rx-flags { display: flex; gap: 8px; font-family: var(--mono); font-size: 11px; }
      .rx-lane { position: relative; flex: 0 0 auto; }
      .rx-ruler .rx-lane span { position: absolute; top: 0; height: 100%; width: ${BW}px; text-align: center; font-family: var(--mono); font-size: 10px; line-height: 26px; cursor: pointer; border-left: 1px solid color-mix(in srgb, var(--ink) 15%, transparent); }
      .rx-ruler .rx-lane span.on { background: var(--ink); color: var(--paper); }
      .rx-clip { position: absolute; top: 4px; bottom: 4px; border: 2px solid var(--ink); font-size: 11px; padding: 1px 4px; overflow: hidden; white-space: nowrap; cursor: grab; touch-action: none; color: #1c1712; }
      .rx-clip.sel { outline: 3px solid var(--ink); outline-offset: 1px; z-index: 2; }
      .rx-clip i { position: absolute; top: 0; bottom: 0; border-left: 1px dashed #1c1712; }
      .rx-xf { position: absolute; top: 0; bottom: 0; background: repeating-linear-gradient(45deg, transparent 0 4px, rgba(28,23,18,.35) 4px 6px); pointer-events: none; z-index: 1; }
      .rx-ph { position: absolute; top: 0; bottom: 0; width: 2px; background: #c0392b; pointer-events: none; z-index: 4; }
      .rx-muted { opacity: .45; }
      .rx-panel figure { margin: 0; }
      .rx-trace td.ph, .rx-trace th.ph { background: var(--ink); color: var(--paper); }
      .rx-trace td.blend { font-style: italic; }
      .rx-ops { display: flex; flex-wrap: wrap; gap: 6px 10px; align-items: end; }
      .rx-ops label.field { min-width: 90px; }
    `;
    document.head.appendChild(st);
  }

  function num(v) {
    if (typeof v === "number") return v;
    if (typeof v === "string" && v.trim() !== "" && !isNaN(v)) return Number(v);
    return null;
  }
  function round(v) {
    return Math.round(v * 100) / 100;
  }

  /* ---------- sources ---------- */
  function studies() {
    try {
      return (window.CuriosityStudy && window.CuriosityStudy.studies()) || [];
    } catch (e) {
      return [];
    }
  }
  function boardValues() {
    try {
      return (window.CuriosityBoard && window.CuriosityBoard.values()) || {};
    } catch (e) {
      return {};
    }
  }
  const inGroup = (id, group) => group === "all" || groupOf(id) === group;

  /* Returns {label, values:{id:[..]}, n} or null. */
  function takeStrand(src, group, from, to, hold) {
    const [kind, ref] = src.split(":");
    const values = {};
    let n = 0, label = "";
    if (kind === "study") {
      const s = studies().find((x) => x.id === ref);
      if (!s || !s.beats.length) return null;
      const a = Math.max(0, Math.min(from, s.beats.length - 1));
      const b = Math.max(a, Math.min(to, s.beats.length - 1));
      const beats = s.beats.slice(a, b + 1);
      n = beats.length;
      beats.forEach((bt) => Object.keys(bt.values || {}).forEach((id) => inGroup(id, group) && (values[id] = values[id] || [])));
      Object.keys(values).forEach((id) => (values[id] = beats.map((bt) => (bt.values[id] == null ? null : bt.values[id]))));
      label = `${s.title.replace(/^Example:\s*/, "").replace(/\s*\(.*$/, "").slice(0, 22).trim()} ${a + 1}–${b + 1}`;
    } else if (kind === "suite") {
      const s = SUITE_LIST.find((x) => x.id === ref);
      if (!s) return null;
      n = Math.max(1, hold);
      Object.entries(s.set).forEach(([id, v]) => inGroup(id, group) && (values[id] = Array(n).fill(v)));
      label = s.label;
    } else {
      n = Math.max(1, hold);
      Object.entries(boardValues()).forEach(([id, v]) => v != null && inGroup(id, group) && (values[id] = Array(n).fill(v)));
      label = "Board";
    }
    if (!Object.keys(values).length) return null;
    if (group !== "all") label += " · " + group;
    return { label, values, n };
  }

  /* ---------- clip timing ---------- */
  const srcLen = (c) => Math.max(1, c.n - c.trimIn - c.trimOut);
  const passLen = (c) => Math.max(1, Math.round(srcLen(c) / c.speed));
  const clipLen = (c) => passLen(c) * Math.max(1, c.loop);
  const clipEnd = (c) => c.start + clipLen(c);

  function ease(u, ramp) {
    if (ramp === "ease in") return u * u;
    if (ramp === "ease out") return 1 - (1 - u) * (1 - u);
    return u;
  }
  /* The source index a clip plays at timeline beat b, or -1. */
  function srcIndex(c, b) {
    const t = b - c.start;
    if (t < 0 || t >= clipLen(c)) return -1;
    const p = passLen(c);
    const u = ease((t % p) / p, c.ramp);
    let k = Math.min(srcLen(c) - 1, Math.floor(u * srcLen(c) + 1e-9));
    if (c.reverse) k = srcLen(c) - 1 - k;
    return c.trimIn + k;
  }
  function clipAt(c, b) {
    const i = srcIndex(c, b);
    if (i < 0) return null;
    const out = {};
    Object.entries(c.values).forEach(([id, vals]) => vals[i] != null && (out[id] = vals[i]));
    return out;
  }

  /* One track's values at beat b, crossfading overlapping clips. Returns {vals, blended:Set}. */
  function trackAt(track, b) {
    const on = track.clips.filter((c) => b >= c.start && b < clipEnd(c)).sort((x, y) => x.start - y.start);
    const vals = {}, blended = new Set();
    on.forEach((c, k) => {
      const v = clipAt(c, b) || {};
      const prev = k > 0 ? on[k - 1] : null;
      Object.entries(v).forEach(([id, val]) => {
        if (prev && vals[id] != null) {
          const span = Math.max(1, Math.min(clipEnd(prev), clipEnd(c)) - c.start);
          const w = (b - c.start + 0.5) / span;
          const a = num(vals[id]), z = num(val);
          vals[id] = a != null && z != null ? round(a + (z - a) * w) : w < 0.5 ? vals[id] : val;
          blended.add(id);
        } else vals[id] = val;
      });
    });
    return { vals, blended };
  }

  /* Stack the tracks bottom to top, like animation layers. */
  function resultAt(s, b) {
    const solo = s.tracks.some((t) => t.solo);
    const out = {}, blended = new Set(), from = {};
    s.tracks.forEach((t, ti) => {
      if (t.mute || (solo && !t.solo) || t.weight <= 0) return;
      const r = trackAt(t, b);
      Object.entries(r.vals).forEach(([id, v]) => {
        if (out[id] == null) {
          out[id] = v;
          from[id] = ti;
          if (r.blended.has(id)) blended.add(id);
          return;
        }
        const a = num(out[id]), z = num(v);
        if (a != null && z != null) {
          out[id] = round(a + (z - a) * t.weight);
          if (t.weight < 1) blended.add(id);
          from[id] = ti;
        } else if (t.weight > 0.5) {
          out[id] = v;
          from[id] = ti;
        }
      });
    });
    return { out, blended, from };
  }
  const totalLen = (s) => Math.max(8, ...s.tracks.flatMap((t) => t.clips.map(clipEnd)));

  /* ---------- state ---------- */
  function newClip(strand, start) {
    return { id: uid(), label: strand.label, values: strand.values, n: strand.n, start, trimIn: 0, trimOut: 0, loop: 1, speed: 1, ramp: "constant", reverse: false };
  }
  function seed(s) {
    s.tracks = [
      { id: uid(), name: "Base", weight: 1, mute: false, solo: false, clips: [] },
      { id: uid(), name: "Layer 1", weight: 1, mute: false, solo: false, clips: [] },
    ];
    const st = studies()[0];
    const base = st ? takeStrand("study:" + st.id, "all", 0, 7, 4) : takeStrand("suite:coverage", "all", 0, 0, 6);
    if (base) s.tracks[0].clips.push(newClip(base, 0));
    const lay = takeStrand("suite:aggressive-camera", "all", 0, 0, 3) || takeStrand("board", "Camera", 0, 0, 3);
    if (lay) s.tracks[1].clips.push(newClip(lay, 3));
    s.sel = base ? s.tracks[0].clips[0].id : null;
  }

  function findClip(s, id) {
    for (const t of s.tracks) {
      const c = t.clips.find((x) => x.id === id);
      if (c) return { t, c };
    }
    return null;
  }

  function sourceOptions(v) {
    const st = studies().map((x) => `<option value="study:${api_esc(x.id)}" ${v === "study:" + x.id ? "selected" : ""}>Study: ${api_esc(x.title)} (${x.beats.length})</option>`);
    const su = SUITE_LIST.map((x) => `<option value="suite:${api_esc(x.id)}" ${v === "suite:" + x.id ? "selected" : ""}>Suite: ${api_esc(x.label)}</option>`);
    return [`<option value="board" ${v === "board" ? "selected" : ""}>The board as it stands</option>`].concat(st, su).join("");
  }
  let api_esc = (x) => x;
  const groupOptions = (v, noAll) => (noAll ? [] : ["all"]).concat(GROUPS).map((g) => `<option ${g === v ? "selected" : ""} value="${api_esc(g)}">${api_esc(g === "all" ? "All curiosities" : g)}</option>`).join("");

  function draw(el, api) {
    css();
    const esc = (api_esc = api.esc);
    const store = api.store(KEY);
    const s = Object.assign({ tracks: [], sel: null, ph: 0, add: { src: "board", group: "all", from: 1, to: 8, hold: 4, track: 0 }, swap: { src: "board", group: "Camera" }, rate: 700 }, store.get({}));
    if (!s.tracks.length) seed(s);
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
    const save = () => store.set(s);
    const redraw = () => {
      save();
      draw(el, api);
    };
    const len = totalLen(s);
    s.ph = Math.min(s.ph, len - 1);
    const selected = findClip(s, s.sel);
    const sc = (window.CuriosityBoard && window.CuriosityBoard.scene()) || { lines: [{ who: "", text: "—" }] };

    const ruler = `<div class="rx-row rx-ruler"><div class="rx-head"><strong>Beats</strong><span class="cap">${len} in all</span></div>
      <div class="rx-lane" style="width:${len * BW}px">${Array.from({ length: len }, (_, b) => `<span data-ph="${b}" class="${b === s.ph ? "on" : ""}" style="left:${b * BW}px">${b + 1}</span>`).join("")}</div></div>`;
    const lanes = s.tracks
      .map((t, ti) => {
        const xf = [];
        const sorted = t.clips.slice().sort((a, b) => a.start - b.start);
        sorted.forEach((c, k) => {
          const p = sorted[k - 1];
          if (p && c.start < clipEnd(p)) xf.push(`<div class="rx-xf" title="Crossfade" style="left:${c.start * BW}px;width:${(Math.min(clipEnd(p), clipEnd(c)) - c.start) * BW}px"></div>`);
        });
        const clips = t.clips
          .map((c) => {
            const h = HUES[(t.clips.indexOf(c) + ti * 3) % HUES.length];
            const ticks = Array.from({ length: Math.max(0, c.loop - 1) }, (_, i) => `<i style="left:${(i + 1) * passLen(c) * BW}px"></i>`).join("");
            const tags = [c.speed !== 1 ? c.speed + "x" : "", c.ramp !== "constant" ? c.ramp : "", c.reverse ? "reversed" : "", c.loop > 1 ? "×" + c.loop : ""].filter(Boolean).join(" ");
            return `<div class="rx-clip ${c.id === s.sel ? "sel" : ""}" data-clip="${c.id}" title="${esc(c.label + " · " + Object.keys(c.values).join(", "))}"
              style="left:${c.start * BW}px;width:${clipLen(c) * BW - 2}px;background:hsl(${h} 55% 78%)">${ticks}${esc(c.label)}${tags ? " · " + esc(tags) : ""}</div>`;
          })
          .join("");
        return `<div class="rx-row ${t.mute ? "rx-muted" : ""}"><div class="rx-head">
            <input data-tname="${ti}" value="${esc(t.name)}" aria-label="Track name" style="font:inherit;border:0;background:transparent;font-weight:700">
            <label class="cap">Weight ${t.weight.toFixed(2)}<input type="range" min="0" max="1" step="0.05" data-tw="${ti}" value="${t.weight}"></label>
            <span class="rx-flags"><label><input type="checkbox" data-tm="${ti}" ${t.mute ? "checked" : ""}> mute</label><label><input type="checkbox" data-ts="${ti}" ${t.solo ? "checked" : ""}> solo</label>${ti > 0 ? `<button type="button" data-tdel="${ti}" title="Remove track">×</button>` : ""}</span>
          </div><div class="rx-lane" data-lane="${ti}" style="width:${len * BW}px">${xf.join("")}${clips}</div></div>`;
      })
      .reverse() /* top track drawn on top, like the Time Editor */
      .join("");

    const res = Array.from({ length: len }, (_, b) => resultAt(s, b));
    const ids = Array.from(new Set(res.flatMap((r) => Object.keys(r.out)))).sort((a, b) => GROUPS.indexOf(groupOf(a)) - GROUPS.indexOf(groupOf(b)));
    const trace = `<div class="scroll"><table class="trace rx-trace"><thead><tr><th>Curiosity</th>${res.map((_, b) => `<th class="${b === s.ph ? "ph" : ""}">${b + 1}</th>`).join("")}</tr></thead>
      <tbody>${ids
        .map((id) => `<tr><td title="${esc(groupOf(id))}">${esc(labelOf(id))}${LIVE.has(id) ? "" : ' <span class="cap">·</span>'}</td>${res
          .map((r, b) => `<td class="${[b === s.ph ? "ph" : "", r.blended.has(id) ? "blend" : "", r.out[id] == null ? "off" : ""].join(" ")}" title="${r.from[id] != null ? "from " + esc(s.tracks[r.from[id]].name) : ""}">${esc(r.out[id] == null ? "" : r.out[id])}</td>`)
          .join("")}</tr>`)
        .join("") || `<tr><td class="cap">No clips yet.</td></tr>`}</tbody></table></div>
      <p class="cap">Italic values are blended (a crossfade, or a track weight under 1). A dot marks a curiosity the board cannot draw; it still keeps on the Shelf.</p>`;

    const line = sc.lines[s.ph % sc.lines.length];
    let panel = "";
    try {
      panel = window.CuriosityBoard ? window.CuriosityBoard.panel(line, s.ph, len, res[s.ph].out) : "";
    } catch (e) {
      panel = `<p class="cap">The board could not draw this beat.</p>`;
    }

    const add = s.add;
    const isStudy = add.src.startsWith("study:");
    const c = selected && selected.c;
    const ops = c
      ? `<h3>Clip: ${esc(c.label)}</h3>
        <p class="cap">${esc(Object.keys(c.values).map(labelOf).join(", "))} · ${c.n} source beat${c.n === 1 ? "" : "s"} · on ${esc(selected.t.name)}</p>
        <div class="rx-ops">
          <label class="field">Start beat<input type="number" min="1" data-c="start" value="${c.start + 1}"></label>
          <label class="field">Trim front<input type="number" min="0" max="${c.n - 1}" data-c="trimIn" value="${c.trimIn}"></label>
          <label class="field">Trim end<input type="number" min="0" max="${c.n - 1}" data-c="trimOut" value="${c.trimOut}"></label>
          <label class="field">Loop<input type="number" min="1" max="16" data-c="loop" value="${c.loop}"></label>
          <label class="field">Speed<select data-c="speed">${SPEEDS.map((v) => `<option value="${v}" ${v === c.speed ? "selected" : ""}>${v}x</option>`).join("")}</select></label>
          <label class="field">Speed curve<select data-c="ramp">${RAMPS.map((v) => `<option ${v === c.ramp ? "selected" : ""}>${v}</option>`).join("")}</select></label>
          <label class="field"><span><input type="checkbox" data-c="reverse" ${c.reverse ? "checked" : ""}> Reverse</span></label>
          <label class="field">Track<select data-c="track">${s.tracks.map((t, i) => `<option value="${i}" ${t === selected.t ? "selected" : ""}>${esc(t.name)}</option>`).join("")}</select></label>
        </div>
        <div class="bar-actions"><button type="button" data-act="left">◀ 1 beat</button><button type="button" data-act="right">1 beat ▶</button><button type="button" data-act="dup">Duplicate</button><button type="button" data-act="del">Delete clip</button></div>
        <h3>A is to B as C is to D</h3>
        <p class="cap">Keep this clip, but take its ${esc(s.swap.group)} slice from somewhere else. One slice swaps; the rest of the clip stays.</p>
        <div class="rx-ops">
          <label class="field">Slice<select data-sw="group">${groupOptions(s.swap.group, true)}</select></label>
          <label class="field">From<select data-sw="src">${sourceOptions(s.swap.src)}</select></label>
          <button type="button" data-act="swap">Swap the slice</button>
        </div>`
      : `<p class="cap">Click a clip to edit it.</p>`;

    el.innerHTML = `<div class="studio-grid rx-grid">
      <div>
        <h3>Add a clip</h3>
        <label class="field">Source<select data-a="src">${sourceOptions(add.src)}</select></label>
        <label class="field">Curiosities<select data-a="group">${groupOptions(add.group)}</select></label>
        ${isStudy
          ? `<div class="study-bar"><label class="field">From beat<input type="number" min="1" data-a="from" value="${add.from}"></label><label class="field">To beat<input type="number" min="1" data-a="to" value="${add.to}"></label></div>`
          : `<label class="field">Hold for ${add.hold} beats<input type="range" min="1" max="16" data-a="hold" value="${add.hold}"></label>`}
        <label class="field">On track<select data-a="track">${s.tracks.map((t, i) => `<option value="${i}" ${i === add.track ? "selected" : ""}>${esc(t.name)}</option>`).join("")}</select></label>
        <div class="bar-actions"><button type="button" data-act="add">Add at playhead</button><button type="button" data-act="addtrack">+ Track</button></div>
        ${studies().length ? "" : `<p class="cap">No studies yet. Suites and the board still work as sources.</p>`}
        <p class="cap">Lower tracks are the base. A higher track overrides only the curiosities it carries. Weight blends numbers and, above 0.5, switches choices. Overlap two clips on one track to crossfade.</p>
        ${ops}
      </div>
      <div>
        <div class="bar-actions"><button type="button" data-act="play">Play</button><button type="button" data-act="stop">Stop</button>
          <label class="field" style="display:inline-flex">Beat length<select data-act-rate>${[350, 700, 1200].map((v) => `<option value="${v}" ${v === s.rate ? "selected" : ""}>${v} ms</option>`).join("")}</select></label>
          <button type="button" data-act="board">Send to board</button><button type="button" data-act="shelf">Keep on Shelf</button><button type="button" data-act="reset">Start over</button></div>
        <div class="rx-time" id="rx-time">${ruler}${lanes}<div class="rx-ph" id="rx-ph" style="left:${168 + 2 + s.ph * BW + BW / 2}px"></div></div>
        <p class="cap"><span id="rx-at">Beat ${s.ph + 1} of ${len}.</span> Drag a clip to move it. Click the ruler to move the playhead.</p>
        <div class="rx-panel" id="rx-panel" style="max-width:420px">${panel}</div>
        <h3>Result, beat by curiosity</h3>
        ${trace}
      </div></div>`;

    /* ---------- wiring ---------- */
    const q = (sel) => el.querySelectorAll(sel);
    q("[data-ph]").forEach((x) => x.addEventListener("click", () => ((s.ph = Number(x.dataset.ph)), redraw())));
    q("[data-tname]").forEach((x) => x.addEventListener("change", () => ((s.tracks[x.dataset.tname].name = x.value.slice(0, 24) || "Track"), redraw())));
    q("[data-tw]").forEach((x) => x.addEventListener("change", () => ((s.tracks[x.dataset.tw].weight = Number(x.value)), redraw())));
    q("[data-tm]").forEach((x) => x.addEventListener("change", () => ((s.tracks[x.dataset.tm].mute = x.checked), redraw())));
    q("[data-ts]").forEach((x) => x.addEventListener("change", () => ((s.tracks[x.dataset.ts].solo = x.checked), redraw())));
    q("[data-tdel]").forEach((x) => x.addEventListener("click", () => (s.tracks.splice(Number(x.dataset.tdel), 1), (s.add.track = 0), redraw())));
    q("[data-a]").forEach((x) =>
      x.addEventListener("change", () => {
        const k = x.dataset.a;
        s.add[k] = ["from", "to", "hold", "track"].includes(k) ? Number(x.value) : x.value;
        redraw();
      })
    );
    q("[data-sw]").forEach((x) => x.addEventListener("change", () => ((s.swap[x.dataset.sw] = x.value), redraw())));
    const rate = el.querySelector("[data-act-rate]");
    rate.addEventListener("change", () => ((s.rate = Number(rate.value)), redraw()));
    q("[data-c]").forEach((x) =>
      x.addEventListener("change", () => {
        const k = x.dataset.c;
        if (k === "reverse") c.reverse = x.checked;
        else if (k === "ramp") c.ramp = x.value;
        else if (k === "speed") c.speed = Number(x.value);
        else if (k === "track") {
          selected.t.clips.splice(selected.t.clips.indexOf(c), 1);
          s.tracks[Number(x.value)].clips.push(c);
        } else {
          let v = Math.round(Number(x.value) || 0);
          if (k === "start") v = Math.max(0, v - 1);
          if (k === "loop") v = Math.max(1, Math.min(16, v));
          if (k === "trimIn") v = Math.max(0, Math.min(c.n - 1 - c.trimOut, v));
          if (k === "trimOut") v = Math.max(0, Math.min(c.n - 1 - c.trimIn, v));
          c[k] = v;
        }
        redraw();
      })
    );

    /* Drag clips along their lane; a click without movement selects. */
    q("[data-clip]").forEach((x) =>
      x.addEventListener("pointerdown", (e) => {
        const f = findClip(s, x.dataset.clip);
        if (!f) return;
        const x0 = e.clientX, start0 = f.c.start;
        let moved = false;
        x.setPointerCapture(e.pointerId);
        const mv = (ev) => {
          const d = Math.round((ev.clientX - x0) / BW);
          if (d !== 0) moved = true;
          f.c.start = Math.max(0, start0 + d);
          x.style.left = f.c.start * BW + "px";
        };
        const up = () => {
          x.removeEventListener("pointermove", mv);
          x.removeEventListener("pointerup", up);
          s.sel = f.c.id;
          redraw();
        };
        x.addEventListener("pointermove", mv);
        x.addEventListener("pointerup", up);
      })
    );

    const act = (name, fn) => {
      const b = el.querySelector(`[data-act="${name}"]`);
      if (b) b.addEventListener("click", fn);
    };
    act("add", () => {
      const strand = takeStrand(add.src, add.group, (add.from || 1) - 1, (add.to || 1) - 1, add.hold);
      if (!strand) {
        alert("That source has nothing in that group.");
        return;
      }
      const cl = newClip(strand, s.ph);
      (s.tracks[add.track] || s.tracks[0]).clips.push(cl);
      s.sel = cl.id;
      redraw();
    });
    act("addtrack", () => {
      if (s.tracks.length < 6) s.tracks.push({ id: uid(), name: "Layer " + s.tracks.length, weight: 1, mute: false, solo: false, clips: [] });
      redraw();
    });
    act("left", () => ((c.start = Math.max(0, c.start - 1)), redraw()));
    act("right", () => ((c.start += 1), redraw()));
    act("dup", () => {
      const d = JSON.parse(JSON.stringify(c));
      d.id = uid();
      d.start = clipEnd(c);
      selected.t.clips.push(d);
      s.sel = d.id;
      redraw();
    });
    act("del", () => {
      selected.t.clips.splice(selected.t.clips.indexOf(c), 1);
      s.sel = null;
      redraw();
    });
    act("swap", () => {
      const other = takeStrand(s.swap.src, s.swap.group, 0, 999, c.n);
      if (!other) {
        alert("That source has no " + s.swap.group + " values.");
        return;
      }
      Object.keys(c.values).forEach((id) => inGroup(id, s.swap.group) && delete c.values[id]);
      Object.entries(other.values).forEach(([id, vals]) => (c.values[id] = Array.from({ length: c.n }, (_, i) => vals[Math.floor((i * vals.length) / c.n)])));
      c.label = c.label.replace(/ ← .*$/, "") + " ← " + other.label.split(" · ")[0] + " " + s.swap.group;
      redraw();
    });
    act("reset", () => {
      if (!confirm("Clear every track and clip?")) return;
      s.tracks = [];
      s.ph = 0;
      redraw();
    });
    act("board", () => {
      const bv = boardValues();
      const count = Math.max(1, Number(bv.angleCount) || 4);
      const out = {};
      for (let i = 0; i < count; i++) {
        const r = res[Math.min(len - 1, Math.floor((i * len) / count))].out;
        Object.entries(r).forEach(([id, v]) => {
          if (!LIVE.has(id) || id === "angleCount") return;
          (out[id] = out[id] || Array(count).fill(null))[i] = v;
        });
      }
      if (!Object.keys(out).length) {
        alert("Nothing the board can draw.");
        return;
      }
      api.toBoard("Remix", out);
    });
    act("shelf", () => {
      const out = {};
      ids.forEach((id) => (out[id] = res.map((r) => (r.out[id] == null ? null : r.out[id]))));
      if (api.toShelf) api.toShelf("Remix", out);
    });
    act("stop", () => {
      if (timer) clearInterval(timer);
      timer = null;
    });
    act("play", () => {
      if (timer) clearInterval(timer);
      const pv = el.querySelector("#rx-panel"), ph = el.querySelector("#rx-ph");
      let b = s.ph >= len - 1 ? 0 : s.ph;
      const show = () => {
        if (!pv.isConnected) {
          clearInterval(timer);
          timer = null;
          return;
        }
        s.ph = b;
        const at = el.querySelector("#rx-at");
        if (at) at.textContent = `Beat ${b + 1} of ${len}.`;
        ph.style.left = 168 + 2 + b * BW + BW / 2 + "px";
        q("[data-ph]").forEach((x) => x.classList.toggle("on", Number(x.dataset.ph) === b));
        q(".rx-trace .ph").forEach((x) => x.classList.remove("ph"));
        q(`.rx-trace tr`).forEach((tr) => tr.children[b + 1] && tr.children[b + 1].classList.add("ph"));
        try {
          pv.innerHTML = window.CuriosityBoard ? window.CuriosityBoard.panel(sc.lines[b % sc.lines.length], b, len, res[b].out) : "";
        } catch (e) {}
        b++;
        if (b >= len) {
          clearInterval(timer);
          timer = null;
          save();
        }
      };
      show();
      timer = setInterval(show, s.rate);
    });
    save();
  }

  window.CuriosityStudio.register({ id: "remix", label: "Remix", order: 32, maya: "Time Editor (clips, tracks, retime, loop, blend, crossfade), animation layers, Retime tool", draw });
})();
