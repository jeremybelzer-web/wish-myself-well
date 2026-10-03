/* momentum/cuesheet.js: the cue sheet. Animators plan timing on an exposure sheet, a table that runs down the
   page one frame at a time. The cue sheet does the same for momentum: one row per moment of a film, with its
   time, its frames at 24, 25 or 30 frames a second, what holds attention there, the cue that moved it there, how
   long it has held so far against the limit, and a short note for the animator. It exports a spreadsheet file
   (CSV), a JSON file for Maya, and a small Python script that puts one marker in Maya per change of attention.

   The core is pure and works in Node with no page:

   window.CurioCueSheet
   - cueRows(reading, opts) -> one row per moment:
       { index, at, clock, startFrame, endFrame, frames, fps, family, familyLabel, letter, color, curiosity,
         label, change ("start", "move", "shift" or ""), cue, cueLabel, quiet, held, status {cls, icon, text},
         limitFrame, note }
       reading: CurioAttention.read(...)
       opts:    { fps: 24 | 25 | 30, secondsPerBeat (3), beats (the film's beats, for their own times),
                  limit (seconds, default the reading's), startFrame (the first frame, 1 as in Maya) }
       A moment that lasts secondsPerBeat seconds is secondsPerBeat x fps frames.
   - toCsv(rows) -> the table as CSV text (quotes doubled, a cell that starts with = + - @ gets a ' first)
   - toMayaJson(rows, meta) -> JSON text in the format "curiomatic-momentum-cues" version 1 (see README.md)
   - mayaPython(rows, meta) -> a Python script for Maya's Script Editor: one Time Slider bookmark per change of
       attention (cmds.timeSliderBookmark, else Maya's own bookmark module), or, if neither works, a locator named momentum_cue_0001 and so on, its visibility keyed on
       from that frame, when bookmarks are not there. It only adds things: it never deletes or moves anything.
   - pyStr(text) -> text as a Python string literal (ASCII only, every quote and backslash escaped)
   - fileName(title, ext) -> a plain file name
   - addTab() puts the "Cue sheet" tab in the Momentum window (CurioMomentumUI.addTab, after: "end"). */
(function () {
  const root = typeof window !== "undefined" ? window : globalThis;
  const M = () => root.CurioMomentum;

  const FPS = [24, 25, 30];
  const KEY = "curiosities-momentum-cuesheet-v1";
  /* The same family colors as ui.js: eight have their own, the others share gray. */
  const COLORS = { feeling: "#2a78d6", plot: "#eb6834", voice: "#1baf7a", comedy: "#eda100", movement: "#e87ba4", music: "#008300", camera: "#4a3aa7", place: "#e34948" };
  const OTHER = "#a8a39a";
  const LETTERS = { camera: "Ca", movement: "Mo", voice: "V", feeling: "F", comedy: "Co", wardrobe: "W", place: "S", light: "Li", music: "Mu", plot: "P", mind: "T", effects: "E", cut: "Cu" };
  const colorOf = (f) => COLORS[f] || OTHER;
  const round = (n, d) => Math.round(n * Math.pow(10, d || 0)) / Math.pow(10, d || 0);
  const esc = (s) =>
    String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  const famLabel = (f) => (f ? ((M() && M().family(f)) || { label: f }).label : "");
  /* The cue's short name: "Visual", "Audio", "Thought", "Movement", "Plot". */
  const cueLabel = (c) => (c ? String(((M() && M().CUES.find((x) => x.id === c)) || { label: c }).label).replace(/\s*cue$/i, "") : "");
  const clock = (s) => {
    s = Math.max(0, Math.round(s || 0));
    const m = Math.floor(s / 60);
    return m + ":" + String(s % 60).padStart(2, "0");
  };
  const fpsOf = (f) => (FPS.includes(Number(f)) ? Number(f) : 24);
  const secs = (n) => `${round(n, 1)} second${round(n, 1) === 1 ? "" : "s"}`;

  /* The status of a hold against the limit, as the meter says it: icon plus words, never color alone. */
  function statusOf(held, lim) {
    const r = held / (lim || 20);
    if (r < 0.75) return { cls: "good", icon: "●", text: "Fresh" };
    if (r <= 1) return { cls: "warn", icon: "▲", text: "Getting long" };
    return { cls: "crit", icon: "■", text: "Too long" };
  }
  function parseAt(at) {
    if (typeof at === "number" && isFinite(at)) return at;
    if (typeof at !== "string") return null;
    const t = at.trim();
    if (!/^\d{1,3}(:\d{1,2}){0,2}(\.\d+)?$/.test(t)) return null;
    return t.split(":").reduce((s, p) => s * 60 + Number(p), 0);
  }
  /* When each moment starts: the film's own times when its beats are given, else spread from the reading. */
  function beatTimes(reading, opts, step) {
    const n = reading.beats || 0;
    const raw = Array.isArray(opts.beats) ? opts.beats.filter((b) => b && b.values && typeof b.values === "object") : null;
    const times = new Array(n).fill(0);
    if (raw && raw.length === n) {
      let t = 0;
      raw.forEach((b, i) => {
        const s = parseAt(b.at);
        t = s != null && s >= t ? s : i === 0 ? 0 : t + step;
        times[i] = t;
      });
      return times;
    }
    const segs = reading.segments || [];
    const end = segs.length ? segs[segs.length - 1].to : n * step;
    for (let k = 0; k < segs.length; k++) {
      const s = segs[k];
      const nb = k + 1 < segs.length ? segs[k + 1].beat : n;
      const nt = k + 1 < segs.length ? segs[k + 1].from : end;
      for (let j = s.beat; j < nb; j++) times[j] = s.from + ((j - s.beat) * (nt - s.from)) / Math.max(1, nb - s.beat);
    }
    const first = segs.length ? segs[0].beat : n;
    for (let j = 0; j < first; j++) times[j] = j * step;
    return times;
  }

  /* ---------------------------------------------------------------- the rows */
  function cueRows(reading, options) {
    const opts = options || {};
    const r = reading || { segments: [], beats: 0, stats: {} };
    const fps = fpsOf(opts.fps);
    const step = Number(opts.secondsPerBeat) > 0 ? Number(opts.secondsPerBeat) : 3;
    const first = Number.isFinite(Number(opts.startFrame)) && opts.startFrame != null ? Math.round(Number(opts.startFrame)) : 1;
    const limit = Number(opts.limit) > 0 ? Number(opts.limit) : Number(r.limit) > 0 ? Number(r.limit) : 20;
    const n = r.beats || 0;
    const segs = r.segments || [];
    const times = beatTimes(r, opts, step);
    const end = segs.length ? Math.max(segs[segs.length - 1].to, times[n - 1] || 0) : n ? times[n - 1] + step : 0;
    const frameAt = (t) => first + Math.round(t * fps);
    const runs = (r.stats && r.stats.familyRuns) || (root.CurioAttention ? root.CurioAttention.familyRuns(segs) : []);
    const runOf = (s) => runs.find((x) => x.from <= s.from + 1e-9 && s.to <= x.to + 1e-9) || { from: s.from, family: s.family };
    const rows = [];
    let k = -1;
    for (let j = 0; j < n; j++) {
      while (k + 1 < segs.length && segs[k + 1].beat <= j) k++;
      const at = times[j];
      const to = j + 1 < n ? times[j + 1] : end;
      const startFrame = frameAt(at);
      const endFrame = Math.max(startFrame, frameAt(to) - 1);
      const row = { index: j + 1, at: round(at, 2), clock: clock(at), startFrame, endFrame, frames: endFrame - startFrame + 1, fps };
      if (k < 0) {
        Object.assign(row, { family: "", familyLabel: "", letter: "", color: "", curiosity: "", label: "", change: "", cue: "", cueLabel: "", quiet: false, held: 0, status: { cls: "good", icon: "●", text: "Nothing yet" }, limitFrame: null });
        row.note = "Nothing holds attention yet. Give the audience something new to look at or listen to.";
        rows.push(row);
        continue;
      }
      const s = segs[k];
      const run = runOf(s);
      const held = round(Math.max(0, to - run.from), 1);
      const change = s.beat !== j ? "" : k === 0 ? "start" : segs[k - 1].family !== s.family ? "move" : "shift";
      const limitFrame = frameAt(run.from + limit);
      Object.assign(row, {
        family: s.family,
        familyLabel: famLabel(s.family),
        letter: LETTERS[s.family] || String(s.family || "?")[0].toUpperCase(),
        color: colorOf(s.family),
        curiosity: s.curiosity,
        label: s.label,
        change,
        cue: change ? s.cue : "",
        cueLabel: change ? cueLabel(s.cue) : "",
        quiet: !!(change && s.quiet),
        held,
        status: statusOf(held, limit),
        limitFrame,
      });
      row.note = noteFor(row, change ? segs[k - 1] : null);
      rows.push(row);
    }
    return rows;
  }

  /* The animator's note: one short line, from the numbers only. */
  function noteFor(row, before) {
    const fam = row.familyLabel;
    const how = row.quiet ? `a quiet ${row.cueLabel.toLowerCase()} cue (something stops)` : `${aOrAn(row.cueLabel.toLowerCase())} cue`;
    if (row.change === "start") return `Start: ${row.label} takes attention first, with ${how}, on frame ${row.startFrame}.`;
    if (row.change === "move") return `Change: ${how} moves attention from ${famLabel(before && before.family)} to ${fam} on frame ${row.startFrame}.`;
    if (row.change === "shift") return `Change: attention stays with ${fam} but moves to ${row.label} on frame ${row.startFrame}.`;
    if (row.status.text === "Too long") return `Too long: ${fam} has held attention past the limit since frame ${row.limitFrame}. Change something here.`;
    if (row.status.text === "Getting long") return `Hold: attention is getting long on ${fam}; plan a change by frame ${row.limitFrame}.`;
    return `Hold: ${fam} is still fresh after ${secs(row.held)}; it gets too long at frame ${row.limitFrame}.`;
  }
  function aOrAn(w) {
    return (/^[aeiou]/i.test(String(w)) ? "an " : "a ") + w;
  }

  /* ---------------------------------------------------------------- exports */
  const COLUMNS = [
    ["Moment", (r) => r.index],
    ["Time", (r) => r.clock],
    ["Seconds", (r) => r.at],
    ["Start frame", (r) => r.startFrame],
    ["End frame", (r) => r.endFrame],
    ["Frames", (r) => r.frames],
    ["Frames a second", (r) => r.fps],
    ["Family", (r) => r.familyLabel],
    ["Letter", (r) => r.letter],
    ["What holds attention", (r) => r.label],
    ["Curiosity id", (r) => r.curiosity],
    ["Cue", (r) => (r.cueLabel ? r.cueLabel + (r.quiet ? " (quiet)" : "") : "")],
    ["Held so far (seconds)", (r) => r.held],
    ["Status", (r) => r.status.text],
    ["Animator's note", (r) => r.note],
  ];
  function csvCell(v) {
    if (v == null) return "";
    if (typeof v === "number") return String(v);
    let s = String(v);
    /* A spreadsheet would run a cell that starts with = + - @ as a formula: a ' first keeps it text. */
    if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
    return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }
  function toCsv(rows) {
    const lines = [COLUMNS.map((c) => csvCell(c[0])).join(",")];
    (rows || []).forEach((r) => lines.push(COLUMNS.map((c) => csvCell(c[1](r))).join(",")));
    return lines.join("\r\n") + "\r\n";
  }
  function changesOf(rows) {
    return (rows || []).filter((r) => r.change);
  }
  function toMayaJson(rows, meta) {
    const m = meta || {};
    const list = rows || [];
    const fps = list.length ? list[0].fps : fpsOf(m.fps);
    const out = {
      format: "curiomatic-momentum-cues",
      version: 1,
      film: m.title || "",
      fps,
      startFrame: list.length ? list[0].startFrame : 1,
      endFrame: list.length ? list[list.length - 1].endFrame : 0,
      limitSeconds: m.limit == null ? null : m.limit,
      moments: list.map((r) => ({ moment: r.index, startFrame: r.startFrame, endFrame: r.endFrame, family: r.family || null, curiosity: r.curiosity || null, label: r.label || null, change: r.change || null, cue: r.cue || null, quiet: !!r.quiet, heldSeconds: r.held, status: r.status.text, note: r.note })),
      cues: changesOf(list).map((r, i) => ({ name: markerName(i), frame: r.startFrame, family: r.family, curiosity: r.curiosity, label: r.label, cue: r.cue, quiet: !!r.quiet, color: r.color })),
    };
    return JSON.stringify(out, null, 2) + "\n";
  }
  const markerName = (i) => "momentum_cue_" + String(i + 1).padStart(4, "0");

  /* A Python string literal, ASCII only: safe for any label, quotes and backslashes included. */
  function pyStr(text) {
    let out = '"';
    for (const ch of String(text == null ? "" : text)) {
      const c = ch.codePointAt(0);
      if (ch === "\\") out += "\\\\";
      else if (ch === '"') out += '\\"';
      else if (ch === "\n") out += "\\n";
      else if (ch === "\r") out += "\\r";
      else if (ch === "\t") out += "\\t";
      else if (c < 0x20 || c === 0x7f) out += "\\x" + c.toString(16).padStart(2, "0");
      else if (c < 0x7f) out += ch;
      else if (c <= 0xffff) out += "\\u" + c.toString(16).padStart(4, "0");
      else out += "\\U" + c.toString(16).padStart(8, "0");
    }
    return out + '"';
  }
  const rgb = (hex) => {
    const h = String(hex || OTHER).replace("#", "");
    return [0, 2, 4].map((i) => round(parseInt(h.slice(i, i + 2), 16) / 255, 3));
  };
  /* The Maya script. Read-only toward what is already in the scene: it adds bookmarks or locators, nothing else. */
  function mayaPython(rows, meta) {
    const m = meta || {};
    const list = rows || [];
    const fps = list.length ? list[0].fps : fpsOf(m.fps);
    const cues = changesOf(list);
    const lines = cues.map((r, i) => {
      const next = cues[i + 1];
      const until = next ? next.startFrame - 1 : list[list.length - 1].endFrame;
      const note = `${r.familyLabel}: ${r.label} (${r.cueLabel.toLowerCase()} cue${r.quiet ? ", quiet" : ""})`;
      return `    (${pyStr(markerName(i))}, ${r.startFrame}, ${Math.max(r.startFrame, until)}, ${pyStr(note)}, (${rgb(r.color).join(", ")})),`;
    });
    return [
      `# Curiomatic momentum cues: ${pyStr(m.title || "film").slice(1, -1)}, ${fps} frames a second, ${cues.length} changes of attention.`,
      "# Paste into Maya's Script Editor (Python tab) and run. Set the scene to the same frames a second first.",
      "# It only adds: one Time Slider bookmark per change (Maya 2023 and later), else one locator per change",
      "# named momentum_cue_0001 and so on, visible from its frame. Nothing in the scene is deleted or moved.",
      "import maya.cmds as cmds",
      "",
      "CUES = [",
      ...lines,
      "]",
      "",
      "def _bookmark(name, start, end, note, color):",
      '    if hasattr(cmds, "timeSliderBookmark"):',
      "        return cmds.timeSliderBookmark(name=note, time=(start, end + 1), color=color)",
      "    from maya.plugin.timeSliderBookmark.timeSliderBookmark import createBookmark",
      "    return createBookmark(name=note, start=start, stop=end, color=color)",
      "",
      "def _locator(name, start, end, note, color):",
      "    loc = cmds.spaceLocator(name=name)[0]",
      '    cmds.addAttr(loc, longName="momentumNote", dataType="string")',
      '    cmds.setAttr(loc + ".momentumNote", note, type="string")',
      '    cmds.setKeyframe(loc, attribute="visibility", time=start, value=1, outTangentType="step")',
      "    if start > 1:",
      '        cmds.setKeyframe(loc, attribute="visibility", time=start - 1, value=0, outTangentType="step")',
      "",
      "try:",
      '    cmds.loadPlugin("timeSliderBookmark", quiet=True)',
      "except Exception:",
      "    pass",
      "use_bookmarks = True",
      "made = []",
      "for cue in CUES:",
      "    if use_bookmarks:",
      "        try:",
      "            _bookmark(*cue)",
      '            made.append("bookmark")',
      "            continue",
      "        except Exception:",
      "            use_bookmarks = False",
      "    _locator(*cue)",
      '    made.append("locator")',
      'print("Momentum cues: %d bookmarks, %d locators." % (made.count("bookmark"), made.count("locator")))',
      "",
    ].join("\n");
  }
  function fileName(title, ext) {
    const base =
      String(title || "film")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 60) || "film";
    return `${base}-cue-sheet.${ext || "csv"}`;
  }
  const titleOf = (label) =>
    String(label || "film")
      .replace(/\s*\((follows|made-up)[^)]*\)\s*$/i, "")
      .replace(/^Model scene:\s*/i, "")
      .trim() || "film";

  /* ---------------------------------------------------------------- the tab */
  function loadPrefs() {
    try {
      const p = JSON.parse(root.localStorage.getItem(KEY) || "{}");
      return { fps: fpsOf(p.fps), onlyChanges: !!p.onlyChanges };
    } catch (e) {
      return { fps: 24, onlyChanges: false };
    }
  }
  function savePrefs(p) {
    try {
      root.localStorage.setItem(KEY, JSON.stringify(p));
    } catch (e) {}
  }
  let last = null;
  function mountTab(el, ctx) {
    const prefs = loadPrefs();
    const sources = ctx.sources();
    let src = ctx.source();
    if (!sources.some((s) => s.id === src)) src = (sources.find((s) => s.id.startsWith("study:")) || sources[0] || { id: "" }).id;
    const label = (sources.find((s) => s.id === src) || {}).label;
    const step = ctx.secondsPerBeat();
    const reading = ctx.readSource(src);
    const rows = cueRows(reading, { fps: prefs.fps, secondsPerBeat: step, beats: ctx.beatsOf(src), limit: ctx.limit() });
    const title = titleOf(label);
    last = { rows, title, limit: ctx.limit() };
    const picker = ctx.sourcePicker("data-cs-source").replace(/<option value="([^"]*)"( selected)?>/g, (m0, v) => `<option value="${v}"${v === src ? " selected" : ""}>`);
    const changes = changesOf(rows).length;
    const own = /^study:/.test(src);
    const shown = prefs.onlyChanges ? rows.filter((r) => r.change) : rows;
    el.innerHTML = `<div class="mcs">
      <p class="mcs-lede">A film is a run of still pictures shown fast, one after another. A <b>frame</b> is one still picture, and ${prefs.fps} of them make one second. Animators plan timing on an exposure sheet, a table that runs down the page frame by frame. This cue sheet does the same for momentum: one row per moment, with the frames it covers, what holds attention there and the cue that moved it, so you can plan each change of attention on an exact frame.</p>
      <div class="mo-controls mcs-bar">
        <label>Film ${picker}</label>
        <label>Frames a second <select data-cs-fps>${FPS.map((f) => `<option value="${f}"${f === prefs.fps ? " selected" : ""}>${f}${f === 24 ? " (film)" : f === 25 ? " (Europe TV)" : " (US TV)"}</option>`).join("")}</select></label>
        <label class="mcs-check"><input type="checkbox" data-cs-only${prefs.onlyChanges ? " checked" : ""}> Only the moments where attention moves</label>
      </div>
      <p class="mcs-sum">${rows.length ? `${rows.length} moment${rows.length === 1 ? "" : "s"}, frames ${rows[0].startFrame} to ${rows[rows.length - 1].endFrame} at ${prefs.fps} frames a second, with ${changes} change${changes === 1 ? "" : "s"} of attention. ${own ? "This film keeps its own times, so moments can differ in length." : `Each moment lasts ${round(step, 2)} seconds (Seconds per panel), so ${round(step * prefs.fps, 1)} frames.`} The limit is ${ctx.limit()} seconds on one kind of curiosity.` : "This film has no moments to put on a cue sheet yet. Pick another film above."}</p>
      <div class="mo-controls mcs-bar">
        <button type="button" data-cs="csv">Download the sheet (CSV)</button>
        <button type="button" data-cs="json">Download for Maya (JSON)</button>
        <button type="button" data-cs="py">Copy for Maya</button>
      </div>
      <p class="mcs-help">"Copy for Maya" copies a short Python script. In Maya, open Windows, General Editors, Script Editor, paste it into a Python tab and run it: it adds one named marker on the time slider for each change of attention, and changes nothing else.</p>
      <div class="mcs-said mo-flash" role="status" hidden></div>
      ${
        rows.length
          ? `<div class="mcs-wrap"><table class="mcs-table">
        <thead><tr><th scope="col">Time</th><th scope="col">Frames</th><th scope="col">What holds attention</th><th scope="col">Cue that moved it here</th><th scope="col">Held so far</th><th scope="col">Animator's note</th></tr></thead>
        <tbody>${shown.map(rowHtml).join("")}</tbody></table></div>`
          : ""
      }
    </div>`;
    const pick = el.querySelector("[data-cs-source]");
    if (pick)
      pick.addEventListener("change", () => {
        ctx.setSource(pick.value);
        ctx.refresh();
      });
    el.querySelector("[data-cs-fps]").addEventListener("change", (e) => {
      savePrefs(Object.assign(loadPrefs(), { fps: fpsOf(e.target.value) }));
      mountTab(el, ctx);
    });
    el.querySelector("[data-cs-only]").addEventListener("change", (e) => {
      savePrefs(Object.assign(loadPrefs(), { onlyChanges: e.target.checked }));
      mountTab(el, ctx);
    });
    el.querySelectorAll("[data-cs]").forEach((b) => b.addEventListener("click", () => act(b.dataset.cs, el)));
  }
  function rowHtml(r) {
    const what = r.family ? `<span class="mo-fam"><i style="background:${r.color}"></i><b class="mcs-letter">${esc(r.letter)}</b> ${esc(r.familyLabel)}</span><span class="mcs-label">${esc(r.label)}</span>` : `<span class="mcs-none">Nothing yet</span>`;
    const cue = r.cueLabel ? `${esc(r.cueLabel)}${r.quiet ? " (quiet: something stops)" : ""}` : `<span class="mcs-none" aria-label="Attention stayed">&nbsp;</span>`;
    return `<tr class="${r.change ? "mcs-moved" : "mcs-hold"}">
      <td data-h="Time">${r.clock}</td>
      <td data-h="Frames">${r.startFrame} to ${r.endFrame} <small>(${r.frames} frames)</small></td>
      <td data-h="What holds attention">${what}</td>
      <td data-h="Cue">${cue}</td>
      <td data-h="Held so far">${round(r.held, 1)} s <span class="mo-status mo-${r.status.cls}">${r.status.icon} ${esc(r.status.text)}</span></td>
      <td data-h="Note" class="mcs-note">${esc(r.note)}</td></tr>`;
  }
  function say(el, text) {
    const f = el.querySelector(".mcs-said");
    if (!f) return;
    f.textContent = text;
    f.hidden = false;
  }
  function download(el, text, name, type) {
    try {
      const url = URL.createObjectURL(new Blob([text], { type }));
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      return true;
    } catch (e) {
      say(el, "The download did not start: " + e.message);
      return false;
    }
  }
  function act(what, el) {
    if (!last) return;
    const meta = { title: last.title, limit: last.limit };
    if (what === "csv") {
      const name = fileName(last.title, "csv");
      if (download(el, "﻿" + toCsv(last.rows), name, "text/csv")) say(el, `Saved ${name}. It opens in any spreadsheet, such as Excel, Numbers or Google Sheets.`);
    } else if (what === "json") {
      const name = fileName(last.title, "json");
      if (download(el, toMayaJson(last.rows, meta), name, "application/json")) say(el, `Saved ${name}: the frames, families, cues and curiosity ids, for a Maya script to read.`);
    } else if (what === "py") copyText(mayaPython(last.rows, meta), el);
  }
  function copyText(text, el) {
    const done = "Copied the Maya script. In Maya's Script Editor, paste it into a Python tab and run it.";
    const fallback = () => {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      (el.closest("dialog") || document.body).appendChild(ta);
      ta.select();
      let ok = false;
      try {
        ok = document.execCommand("copy");
      } catch (e) {}
      ta.remove();
      if (ok) return say(el, done);
      say(el, "This browser would not copy on its own. The script is below, selected: copy it with your keyboard.");
      el.querySelectorAll(".mcs-copybox").forEach((b) => b.remove());
      const box = document.createElement("textarea");
      box.className = "mcs-copybox";
      box.value = text;
      box.rows = 10;
      el.querySelector(".mcs-said").after(box);
      box.focus();
      box.select();
    };
    if (typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(() => say(el, done), fallback);
    else fallback();
  }

  function addTab() {
    const U = root.CurioMomentumUI;
    if (!U || typeof U.addTab !== "function") return false;
    return U.addTab({ id: "cuesheet", label: "Cue sheet", after: "end", mount: mountTab });
  }

  const api = { cueRows, toCsv, toMayaJson, mayaPython, pyStr, fileName, titleOf, statusOf, FPS, COLUMNS, addTab };
  root.CurioCueSheet = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (typeof document !== "undefined" && root.CurioMomentumUI) addTab();
})();
