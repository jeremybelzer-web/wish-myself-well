/* Study view. A study is a trace of a film, an episode, or a game:
   beat → which curiosities are on → which suites contain them → which proximities fired.
   Counts and curiosity ids only. A note is a pointer, not a transcript.
   The Shelf keeps one curiosity, or one suite, across a span of beats, so it can be
   applied to the board panel by panel. That is the music app's Essence Shelf. */

(function () {
  const KEY = "curiosities-studies-v1";
  const NOTE_MAX = 120;
  const recordable = CURIOSITIES.filter((c) => c.kind === "select" || c.kind === "range" || c.kind === "tag");
  const TAG_MAX = 24;
  const byId = Object.fromEntries(CURIOSITIES.map((c) => [c.id, c]));
  const root = document.getElementById("study");
  const store = load();
  const view = { tab: "trace", studyId: store.studies[0] ? store.studies[0].id : "", picked: new Set(), editing: "", suite: "", lens: ["cameraCarry", "shotSize"], cross: ["emotion", "angleHeight"], openGroups: new Set(["Camera", "Scene memory"]), msg: "" };

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function uid(p) {
    return p + "-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  function load() {
    let saved = null;
    try {
      saved = JSON.parse(localStorage.getItem(KEY));
    } catch (e) {}
    if (saved && Array.isArray(saved.studies)) {
      /* Refresh the shipped example when it predates the scene-memory curiosities. */
      const i = saved.studies.findIndex((x) => x.id === "example-glass");
      if (i >= 0 && !saved.studies[i].beats.some((b) => b.values.emotion != null)) saved.studies[i] = example();
      return { studies: saved.studies, shelf: saved.shelf || [], proximities: saved.proximities || [] };
    }
    return { studies: [example()], shelf: [], proximities: [] };
  }

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(store));
    } catch (e) {}
  }

  /* Our own board scene, traced by hand, so the views are not empty on first open. */
  function example() {
    const b = (at, values) => ({ id: uid("b"), at, note: "", values });
    return {
      id: "example-glass",
      title: "Example: The crystal is quiet (our board)",
      kind: "episode",
      camera: "authored",
      beats: [
        b("0:00", { emotion: "curious", angleHeight: "eye", vocalTone: "flat", timePerCharacter: "Nessa", moveTemper: 2, cutRate: "slow", shotSize: "wide", cameraCarry: "locked", cameraMove: "none", characterPath: "cross", characterToLens: "across", angleFamily: "coverage", volume: 3, gesture: 1 }),
        b("0:06", { emotion: "curious", angleHeight: "eye", vocalTone: "rising", timePerCharacter: "Subject", moveTemper: 2, cutRate: "slow", shotSize: "medium", cameraCarry: "locked", cameraMove: "none", characterPath: "approach", volume: 3, gesture: 1 }),
        b("0:11", { emotion: "anxious", angleHeight: "high", vocalTone: "flat", timePerCharacter: "Ida", moveTemper: 2, cutRate: "medium", shotSize: "medium", cameraCarry: "smooth", cameraMove: "push in", characterPath: "approach", volume: 3, gesture: 2 }),
        b("0:15", { emotion: "loving", angleHeight: "eye", vocalTone: "whispered", timePerCharacter: "Nessa", moveTemper: 1, cutRate: "slow", shotSize: "close", cameraCarry: "smooth", cameraMove: "push in", volume: 1, breath: "breath then speak", angleFamily: "coverage", gesture: 1 }),
        b("0:21", { emotion: "loving", angleHeight: "high", timePerCharacter: "Nessa", moveTemper: 1, cutRate: "slow", shotSize: "insert", objectEnter: "enters", objectPath: "lift", moveFollows: "object", cameraCarry: "smooth", cameraMove: "push in", volume: 1 }),
        b("0:24", { emotion: "angry", angleHeight: "low", vocalTone: "shouted", timePerCharacter: "Riven", moveTemper: 4, cutRate: "fast", shotSize: "medium", cameraCarry: "handheld", cameraMove: "track", angleFamily: "handheld", volume: 4, gesture: 2 }),
        b("0:28", { emotion: "angry", angleHeight: "low", vocalTone: "breaking", timePerCharacter: "Petra", moveTemper: 5, cutRate: "fast", shotSize: "close", cameraCarry: "handheld", cameraMove: "track", volume: 4, gesture: 4 }),
        b("0:33", { emotion: "melancholy", angleHeight: "high", vocalTone: "falling", timePerCharacter: "Nessa", moveTemper: 1, cutRate: "slow", shotSize: "wide", cameraCarry: "locked", cameraMove: "none", characterPath: "still", volume: 2, gesture: 0 }),
      ],
    };
  }

  function current() {
    return store.studies.find((s) => s.id === view.studyId) || null;
  }

  /* Suites are measured by degree (window.CuriositySuites, app.js): a beat shows a share of a suite's lenses. */
  const CS = () => window.CuriositySuites;
  function allSuites() {
    if (CS()) CS().sync();
    return SUITES;
  }

  function allProximities() {
    return PROXIMITIES.concat(store.proximities);
  }

  function same(a, b) {
    return a != null && b != null && String(a) === String(b);
  }

  /* A suite as a proximity's cause or effect counts as present when at least half its members match. */
  function suiteOn(suite, beat) {
    return !!CS() && CS().present(suite, beat.values);
  }
  /* How much of a suite a beat shows: {on, total, share}, or null for a lens suite. */
  function suiteMatch(suite, beat) {
    return CS() ? CS().match(suite, beat.values) : null;
  }
  /* The trace's suites cell: the suites this beat shows any of, by share, most first. */
  function suitesCell(beat) {
    if (!CS()) return `<span class="cap">—</span>`;
    const rows = allSuites()
      .filter((x) => CS().fixed(x))
      .map((x) => ({ x, m: suiteMatch(x, beat) }))
      .filter((r) => r.m.share > 0)
      .sort((a, b) => b.m.share - a.m.share || b.m.on.length - a.m.on.length);
    const shown = rows.slice(0, 5).map((r) => CS().html(r.x, r.m)).join("");
    const more = rows.length > 5 ? `<span class="cap">and ${rows.length - 5} more with less</span>` : "";
    return shown ? shown + more : `<span class="cap">—</span>`;
  }

  function condText(c) {
    if (!c) return "";
    if (c.suite) return "suite " + ((SUITES.find((s) => s.id === c.suite) || {}).label || c.suite);
    const label = (byId[c.curiosity] || { label: c.curiosity }).label.toLowerCase();
    if (c.change) return label + " " + c.change;
    return label + " is " + c.is;
  }

  /* Does cond hold at beat j? A change compares beat j with the beat before it. */
  function holds(cond, beats, j) {
    const beat = beats[j];
    if (!beat) return false;
    if (cond.suite) {
      const s = SUITES.find((x) => x.id === cond.suite);
      return !!s && suiteOn(s, beat);
    }
    const v = beat.values[cond.curiosity];
    if (cond.change) {
      const prev = j > 0 ? beats[j - 1].values[cond.curiosity] : null;
      if (v == null || prev == null) return false;
      if (cond.change === "changes") return !same(v, prev);
      return cond.change === "rises" ? Number(v) > Number(prev) : Number(v) < Number(prev);
    }
    return same(v, cond.is);
  }

  /* x held at beat i. Does y hold at i (for a value) or any of the next `within` beats? */
  function measure(p, beats) {
    let n = 0;
    let h = 0;
    const at = [];
    beats.forEach((_, i) => {
      if (!holds(p.x, beats, i)) return;
      n++;
      for (let j = i; j <= i + p.within && j < beats.length; j++) {
        if (holds(p.y, beats, j)) {
          h++;
          at.push(i);
          break;
        }
      }
    });
    return { n, h, at };
  }

  function chips(values, lit) {
    return Object.entries(values)
      .map(([id, v]) => `<span class="chip ${lit && lit.includes(id) ? "lit" : ""}">${esc((byId[id] || { label: id }).label)}: ${esc(v)}</span>`)
      .join("");
  }

  function say(msg) {
    view.msg = msg;
  }

  function render() {
    const s = current();
    const tabs = [
      ["trace", "Trace"],
      ["curiosity", "Curiosity"],
      ["suite", "Suite"],
      ["proximity", "Proximity"],
      ["shelf", "Shelf (" + store.shelf.length + ")"],
    ];
    root.innerHTML = `
      <h2>Study a work</h2>
      <p class="cap">Name a scene, a timecode, or a played minute. Each beat stores which curiosities are on. No scripts, lyrics, level dialogue, or shot lists that recreate the work.</p>
      <div class="study-bar">
        <label class="field">Study
          <select id="st-pick">${store.studies.map((x) => `<option value="${esc(x.id)}" ${x.id === view.studyId ? "selected" : ""}>${esc(x.title)}</option>`).join("")}</select>
        </label>
        <details class="new-study"><summary>New study</summary>
          <label class="field">Title <input id="st-title" maxlength="80" placeholder="A film, an episode, or a game level" /></label>
          <label class="field">Kind <select id="st-kind"><option>film</option><option>episode</option><option>game</option></select></label>
          <label class="field">Camera <select id="st-camera"><option value="authored">authored</option><option value="player">the player’s</option></select></label>
          <button type="button" data-act="new-study">Start the study</button>
        </details>
        <span class="bar-actions">
          <button type="button" data-act="export">Export</button>
          <label class="file-btn">Import <input type="file" id="st-import" accept="application/json" /></label>
          ${s ? `<button type="button" data-act="delete-study">Delete study</button>` : ""}
        </span>
      </div>
      ${view.msg ? `<p class="applied">${esc(view.msg)}</p>` : ""}
      <nav class="subtabs">${tabs.map(([k, l]) => `<button type="button" data-sub="${k}" class="${view.tab === k ? "on" : ""}">${esc(l)}</button>`).join("")}</nav>
      <div class="study-body">${body(s)}</div>`;
    view.msg = "";
  }

  function body(s) {
    if (view.tab === "curiosity") return curiosityTab();
    if (view.tab === "suite") return suiteTab();
    if (view.tab === "proximity") return proximityTab();
    if (view.tab === "shelf") return shelfTab();
    if (!s) return `<p>No study yet. Start one above.</p>`;
    return traceTab(s);
  }

  function traceTab(s) {
    const fired = {};
    allProximities().forEach((p) => measure(p, s.beats).at.forEach((i) => (fired[i] = (fired[i] || []).concat(p))));
    const rows = s.beats
      .map((beat, i) => {
        const prox = (fired[i] || []).map((p) => `${condText(p.x)} → ${condText(p.y)}`);
        const editing = view.editing === beat.id;
        return `<tr class="${view.picked.has(beat.id) ? "picked" : ""}">
          <td><input type="checkbox" data-pick="${esc(beat.id)}" ${view.picked.has(beat.id) ? "checked" : ""} aria-label="Pick beat ${i + 1}" /></td>
          <td class="mono">${i + 1}</td>
          <td class="mono">${esc(beat.at)}</td>
          <td>${chips(beat.values)}${beat.note ? `<p class="cap">${esc(beat.note)}</p>` : ""}</td>
          <td>${suitesCell(beat)}</td>
          <td class="cap">${prox.map(esc).join("<br>") || "—"}</td>
          <td><button type="button" data-edit="${esc(beat.id)}">${editing ? "Close" : "Edit"}</button></td>
        </tr>${editing ? `<tr class="editor"><td colspan="7">${editor(beat)}</td></tr>` : ""}`;
      })
      .join("");
    const picked = s.beats.filter((b) => view.picked.has(b.id));
    const keepFrom = recordable.filter((c) => picked.some((b) => b.values[c.id] != null));
    return `
      <p class="cap">${esc(s.kind)}${s.kind === "game" ? " · camera: " + esc(s.camera === "player" ? "the player’s" : "authored") : ""} · ${s.beats.length} beats</p>
      <div class="scroll"><table class="trace">
        <thead><tr><th></th><th>Beat</th><th>At</th><th>Curiosities on</th><th>Suites, by share</th><th>Proximities that held from here</th><th></th></tr></thead>
        <tbody>${rows || `<tr><td colspan="7" class="cap">No beats yet.</td></tr>`}</tbody>
      </table></div>
      <p class="row-actions">
        <button type="button" data-act="add-beat">Add a beat</button>
        <button type="button" data-act="add-from-board">Add a beat from the board</button>
      </p>
      <div class="keep">
        <p class="g">Keep to the Shelf</p>
        ${
          picked.length
            ? `<p class="cap">${picked.length} beat${picked.length === 1 ? "" : "s"} picked. Keep one curiosity across them, or a whole suite.</p>
          <label class="field">Keep
            <select id="keep-what">
              <optgroup label="One curiosity">${keepFrom.map((c) => `<option value="c:${c.id}">${esc(c.label)}</option>`).join("")}</optgroup>
              <optgroup label="A suite">${allSuites().map((x) => `<option value="s:${x.id}">${esc(x.label)}</option>`).join("")}</optgroup>
            </select>
          </label>
          <button type="button" data-act="keep">Keep</button> <button type="button" data-act="unpick">Clear picks</button>`
            : `<p class="cap">Tick beats in the trace to keep a span.</p>`
        }
      </div>`;
  }

  function editor(beat) {
    const groups = [];
    recordable.forEach((c) => {
      if (!groups.includes(c.group)) groups.push(c.group);
    });
    const field = (c) => {
        const v = beat.values[c.id];
        if (c.kind === "tag")
          return `<label class="field">${esc(c.label)}
            <input data-val="${c.id}" value="${esc(v == null ? "" : v)}" maxlength="${TAG_MAX}" placeholder="a word" />
          </label>`;
        const opts =
          c.kind === "range"
            ? Array.from({ length: c.max - c.min + 1 }, (_, k) => String(c.min + k))
            : c.options;
        return `<label class="field">${esc(c.label)}
          <select data-val="${c.id}"><option value="">—</option>${opts.map((o) => `<option ${same(v, o) ? "selected" : ""}>${esc(o)}</option>`).join("")}</select>
        </label>`;
    };
    const fields = groups
      .map((g) => {
        const items = recordable.filter((c) => c.group === g);
        const set = items.filter((c) => beat.values[c.id] != null).length;
        const open = set || view.openGroups.has(g) ? "open" : "";
        return `<details class="beat-group" data-group="${esc(g)}" ${open}><summary>${esc(g)}${set ? ` · ${set}` : ""}</summary><div class="beat-grid">${items.map(field).join("")}</div></details>`;
      })
      .join("");
    return `<div class="beat-edit" data-beat="${esc(beat.id)}">
      <label class="field">At <input data-at value="${esc(beat.at)}" maxlength="24" placeholder="0:42, or a scene name" /></label>
      <label class="field">Note <input data-note value="${esc(beat.note)}" maxlength="${NOTE_MAX}" placeholder="A pointer, not a transcript" /></label>
      ${fields}
      <button type="button" data-act="delete-beat" data-beat="${esc(beat.id)}">Delete beat</button>
    </div>`;
  }

  function curiosityTab() {
    const opts = (picked) =>
      groupedOptions((c) => `<option value="${c.id}" ${c.id === picked ? "selected" : ""}>${esc(c.label)}</option>`);
    const lensChips = view.lens
      .map((id) => `<button type="button" class="chip-btn on" data-lens="${id}" title="Remove">${esc(byId[id].label)} ×</button>`)
      .join("");
    const blocks = view.lens
      .map((id) => {
        const c = byId[id];
        const rows = store.studies
          .map((s) => {
            const cells = s.beats.map((b) => `<td class="${b.values[id] == null ? "off" : ""}">${esc(b.values[id] == null ? "" : b.values[id])}</td>`).join("");
            const counts = {};
            let n = 0;
            s.beats.forEach((b) => {
              if (b.values[id] == null) return;
              counts[b.values[id]] = (counts[b.values[id]] || 0) + 1;
              n++;
            });
            const tally = Object.entries(counts)
              .map(([v, k]) => `${v} ×${k} (${Math.round((100 * k) / n)}%)`)
              .join(", ");
            return `<tr><th>${esc(s.title)}</th>${cells}<td class="cap">${esc(tally || "not recorded")}</td></tr>`;
          })
          .join("");
        return `<p class="g">${esc(c.label)}</p>${c.view ? `<p class="cap">${esc(c.view)}</p>` : ""}<div class="scroll"><table class="lane"><tbody>${rows}</tbody></table></div>`;
      })
      .join("");
    return `<p class="cap">Look at every study through one curiosity, beat by beat. Add more to see them side by side, the way a suite does.</p>
      <div class="lens-bar"><label class="field">Add a view <select id="lens-add"><option value="">Pick a curiosity</option>${opts("")}</select></label></div>
      <div class="lineage">${lensChips}</div>${blocks || `<p class="cap">Nothing picked.</p>`}
      ${crossView(opts)}`;
  }

  /* Two curiosities against each other, counted over every beat that records both.
     Emotion against angle height is the angle-by-emotion view. */
  function crossView(opts) {
    const [a, b] = view.cross;
    const ca = byId[a];
    const cb = byId[b];
    const counts = {};
    const rowsSeen = [];
    const colsSeen = [];
    store.studies.forEach((s) =>
      s.beats.forEach((beat) => {
        const va = beat.values[a];
        const vb = beat.values[b];
        if (va == null || vb == null) return;
        if (!rowsSeen.includes(String(va))) rowsSeen.push(String(va));
        if (!colsSeen.includes(String(vb))) colsSeen.push(String(vb));
        const k = va + "|" + vb;
        counts[k] = (counts[k] || 0) + 1;
      })
    );
    const expected = a === "emotion" ? (emo) => (EMOTION_MAP[emo] || {})[b] : () => null;
    const table = rowsSeen.length
      ? `<div class="scroll"><table class="trace cross"><thead><tr><th>${esc(ca.label)} × ${esc(cb.label)}</th>${colsSeen.map((v) => `<th>${esc(v)}</th>`).join("")}${a === "emotion" ? "<th>Film grammar says</th>" : ""}</tr></thead><tbody>${rowsSeen
          .map(
            (r) =>
              `<tr><th>${esc(r)}</th>${colsSeen.map((c) => `<td class="mono ${same(expected(r), c) ? "expect" : ""}">${counts[r + "|" + c] || ""}</td>`).join("")}${a === "emotion" ? `<td class="cap">${esc(expected(r) == null ? "—" : expected(r))}</td>` : ""}</tr>`
          )
          .join("")}</tbody></table></div>`
      : `<p class="cap">No beat records both yet.</p>`;
    return `<p class="g">Cross two curiosities</p>
      <p class="cap">How often each pair shows up together. With emotion first, the highlighted cell is the emotion map's default, so you can see where a film follows it or breaks it.</p>
      <div class="prox-form"><label class="field">Rows <select id="cross-a">${opts(a)}</select></label><label class="field">Columns <select id="cross-b">${opts(b)}</select></label></div>
      ${table}`;
  }

  function groupedOptions(fn) {
    const groups = [];
    recordable.forEach((c) => {
      if (!groups.includes(c.group)) groups.push(c.group);
    });
    return groups.map((g) => `<optgroup label="${esc(g)}">${recordable.filter((c) => c.group === g).map(fn).join("")}</optgroup>`).join("");
  }

  function suiteTab() {
    const KINDS = [
      ["", "Suites"],
      ["genre", "Genres"],
      ["emotion", "Angle by emotion"],
      ["lens", "Lens suites"],
    ];
    const allBeats = [].concat(...store.studies.map((s) => s.beats));
    const row = (x) => {
        const lens = !CS() || !CS().fixed(x);
        const m = lens ? null : CS().across(x, allBeats.map((b) => b.values));
        const members = lens ? `${(x.lenses || []).map((id) => `<span class="chip">${esc((byId[id] || { label: id }).label)}</span>`).join("")}` : chips(x.set, view.suite === x.id ? Object.keys(x.set) : null);
        const share = lens
          ? `<span class="cap">a group of lenses, no values to match</span>`
          : `<span class="suite-share"><span class="suite-n">${esc(CS().pct(m.mean))} on average, best ${esc(CS().pct(m.peak))}</span>${CS().bar(m.mean)}</span>`;
        return `<tr class="${view.suite === x.id ? "picked" : ""}">
          <td><button type="button" class="link" data-suite="${x.id}">${esc(x.label)}</button><br><span class="cap">${esc(x.note)}</span></td>
          <td>${members}</td>
          <td>${share}</td>
          <td>${lens ? "" : `<button type="button" data-play="${x.id}">Play on the board</button>`}</td>
        </tr>`;
    };
    const list = KINDS.map(
      ([kind, title]) => `<tr class="kind-row"><th colspan="4">${esc(title)}</th></tr>` + allSuites().filter((x) => (x.kind || "") === kind).map(row).join("")
    ).join("");
    let lanes = "";
    const sel = allSuites().find((x) => x.id === view.suite);
    if (sel && CS() && !CS().fixed(sel)) {
      /* A lens suite: each lens's value, beat by beat, side by side. */
      lanes =
        `<p class="g">${esc(sel.label)}, beat by beat</p>` +
        store.studies
          .map((s) => {
            const rows = (sel.lenses || [])
              .map((id) => `<tr><th>${esc((byId[id] || { label: id }).label)}</th>${s.beats.map((b) => `<td class="${b.values[id] == null ? "off" : ""}">${b.values[id] == null ? "—" : esc(b.values[id])}</td>`).join("")}</tr>`)
              .join("");
            return `<p class="cap">${esc(s.title)}</p><div class="scroll"><table class="lane"><tbody>${rows}</tbody></table></div>`;
          })
          .join("") +
        `<p class="cap">A lens suite names no values to match. It is a set of lenses you look through together, so here they are side by side.</p>`;
    } else if (sel) {
      lanes =
        `<p class="g">${esc(sel.label)}, beat by beat</p>` +
        store.studies
          .map((s) => {
            const cells = s.beats
              .map((b) => {
                const m = suiteMatch(sel, b);
                const a = (0.1 + m.share * 0.9).toFixed(2);
                return `<td class="${m.on.length ? "" : "off"}" style="${m.on.length ? `background:rgba(196, 92, 38, ${a});color:${m.share > 0.55 ? "white" : "inherit"}` : ""}" title="${esc(m.on.map((id) => (byId[id] || { label: id }).label).join(", "))}">${m.on.length} of ${m.total}<br>${esc(CS().pct(m.share))}</td>`;
              })
              .join("");
            return `<div class="scroll"><table class="lane"><tbody><tr><th>${esc(s.title)}</th>${cells}</tr></tbody></table></div>`;
          })
          .join("") +
        `<p class="cap">Each cell shows how many of the suite’s lenses that beat shows, and the share. The darker the cell, the more of the suite is there.</p>`;
    }
    return `<p class="cap">A suite is a group of lenses you look through together. A beat matches it by degree: the share of its lenses that beat shows. Pick one to light its lenses and see the share beat by beat. Match is the average share across all studies, and the best beat.</p>
      ${lanes}
      <div class="scroll"><table class="trace"><thead><tr><th>Suite</th><th>Lenses in it</th><th>Match</th><th></th></tr></thead><tbody>${list}</tbody></table></div>`;
  }

  function proximityTab() {
    const studies = store.studies;
    const rows = allProximities()
      .map((p) => {
        let tn = 0;
        let th = 0;
        const per = studies
          .map((s) => {
            const m = measure(p, s.beats);
            tn += m.n;
            th += m.h;
            return `<td class="mono">${m.n ? `${m.h}/${m.n}` : "—"}</td>`;
          })
          .join("");
        const mine = store.proximities.includes(p);
        return `<tr><td>When ${esc(condText(p.x))}, ${esc(condText(p.y))} within ${p.within} beat${p.within === 1 ? "" : "s"}${mine ? "" : ` <span class="cap">seed</span>`}</td>
          ${per}<td class="mono"><strong>${tn ? `${th}/${tn}` : "—"}</strong></td>
          <td>${mine ? `<button type="button" data-delprox="${esc(p.id)}">Remove</button>` : ""}</td></tr>`;
      })
      .join("");
    const curOpts = groupedOptions((c) => `<option value="${c.id}">${esc(c.label)}</option>`);
    const suiteOpts = SUITES.map((x) => `<option value="s:${x.id}">Suite: ${esc(x.label)}</option>`).join("");
    return `<p class="cap">When X happens, does Y follow within N beats? Each cell is held / times X happened, in that study. Proximities are measured, so they can be wrong for the next work.</p>
      <div class="scroll"><table class="trace"><thead><tr><th>Proximity</th>${studies.map((s) => `<th>${esc(s.title)}</th>`).join("")}<th>All</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>
      <div class="keep">
        <p class="g">Add a proximity</p>
        <div class="prox-form">
          <label class="field">When <select id="px-x">${suiteOpts}${curOpts}</select></label>
          <label class="field">is <select id="px-xv"></select></label>
          <label class="field">then <select id="px-y">${suiteOpts}${curOpts}</select></label>
          <label class="field">is <select id="px-yv"></select></label>
          <label class="field">within <input id="px-n" type="number" min="0" max="16" value="2" /></label>
          <button type="button" data-act="add-prox">Add</button>
        </div>
      </div>`;
  }

  function valueOptions(sel, withChange) {
    const out = document.getElementById(sel);
    const src = document.getElementById(sel.replace("v", ""));
    if (!out || !src) return;
    if (src.value.startsWith("s:")) {
      out.innerHTML = `<option value="">fires</option>`;
      return;
    }
    const c = byId[src.value];
    const opts = c.kind === "range" ? Array.from({ length: c.max - c.min + 1 }, (_, k) => String(c.min + k)) : c.options || [];
    out.innerHTML =
      opts.map((o) => `<option value="is:${esc(o)}">${esc(o)}</option>`).join("") +
      `<option value="change:changes">changes</option>` +
      (c.kind === "range" ? `<option value="change:rises">rises</option><option value="change:drops">drops</option>` : "");
  }

  function shelfTab() {
    if (!store.shelf.length) return `<p class="cap">The Shelf is empty. In a trace, tick a span of beats and keep a curiosity or a suite.</p>`;
    const rows = store.shelf
      .map((k) => {
        const lanes = Object.entries(k.values)
          .map(([id, vals]) => `<div><span class="cap">${esc((byId[id] || { label: id }).label)}</span> ${vals.map((v) => `<span class="cell ${v == null ? "off" : ""}">${esc(v == null ? "·" : v)}</span>`).join("")}</div>`)
          .join("");
        return `<tr><td><strong>${esc(k.name)}</strong><br><span class="cap">${esc(k.kind)} · from ${esc(k.from)} · ${k.beats} beat${k.beats === 1 ? "" : "s"}</span></td>
          <td>${lanes}</td>
          <td><button type="button" data-apply="${esc(k.id)}">Apply to the board</button> <button type="button" data-delshelf="${esc(k.id)}">Remove</button></td></tr>`;
      })
      .join("");
    return `<p class="cap">Each strand is one curiosity, or one suite, lifted from a span of beats. Apply it and the board takes those values panel by panel, cycling if the strip is longer. Any control you touch by hand wins back.</p>
      <div class="scroll"><table class="trace"><thead><tr><th>Strand</th><th>Values by beat</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>`;
  }

  function keep() {
    const s = current();
    const what = document.getElementById("keep-what");
    if (!s || !what) return;
    const beats = s.beats.filter((b) => view.picked.has(b.id));
    const [kind, ref] = what.value.split(":");
    let ids;
    let name;
    if (kind === "c") {
      ids = [ref];
      name = byId[ref].label;
    } else {
      const suite = SUITES.find((x) => x.id === ref);
      ids = CS() ? CS().members(suite) : Object.keys(suite.set);
      name = suite.label;
    }
    const values = {};
    ids.forEach((id) => (values[id] = beats.map((b) => (b.values[id] == null ? null : b.values[id]))));
    Object.keys(values).forEach((id) => {
      if (values[id].every((v) => v == null)) delete values[id];
    });
    if (!Object.keys(values).length) {
      say("Those beats don’t record any of that. Nothing kept.");
      return;
    }
    store.shelf.push({ id: uid("k"), kind: kind === "c" ? "curiosity" : "suite", ref, name: name + " · " + s.title, from: s.title, beats: beats.length, values });
    view.picked.clear();
    save();
    say(`Kept ${name} across ${beats.length} beat${beats.length === 1 ? "" : "s"}. It is on the Shelf.`);
  }

  function goBoard() {
    const b = document.querySelector('.tabs button[data-tab="board"]');
    if (b) b.click();
  }

  function exportStudies() {
    const blob = new Blob([JSON.stringify({ format: "curiosities-studies-v1", ...store }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "curiosities-studies.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  function importStudies(file) {
    const r = new FileReader();
    r.onload = () => {
      try {
        const data = JSON.parse(r.result);
        if (!Array.isArray(data.studies)) throw new Error("no studies");
        const have = new Set(store.studies.map((s) => s.id));
        data.studies.forEach((s) => {
          if (!have.has(s.id) && Array.isArray(s.beats)) store.studies.push(s);
        });
        (data.shelf || []).forEach((k) => store.shelf.push(k));
        (data.proximities || []).forEach((p) => store.proximities.push(p));
        save();
        say(`Imported ${data.studies.length} stud${data.studies.length === 1 ? "y" : "ies"}.`);
      } catch (e) {
        say("That file is not a studies export.");
      }
      draw();
    };
    r.readAsText(file);
  }

  root.addEventListener("click", (e) => {
    const t = e.target;
    const s = current();
    if (t.dataset.sub) {
      view.tab = t.dataset.sub;
    } else if (t.dataset.pick) {
      if (t.checked) view.picked.add(t.dataset.pick);
      else view.picked.delete(t.dataset.pick);
    } else if (t.dataset.edit) {
      view.editing = view.editing === t.dataset.edit ? "" : t.dataset.edit;
    } else if (t.dataset.lens) {
      const i = view.lens.indexOf(t.dataset.lens);
      if (i >= 0) view.lens.splice(i, 1);
      else view.lens.push(t.dataset.lens);
    } else if (t.dataset.suite) {
      view.suite = view.suite === t.dataset.suite ? "" : t.dataset.suite;
    } else if (t.dataset.play) {
      window.CuriosityBoard.playSuite(t.dataset.play);
      goBoard();
      return;
    } else if (t.dataset.apply) {
      const k = store.shelf.find((x) => x.id === t.dataset.apply);
      if (k) {
        window.CuriosityBoard.apply(k.name, k.values);
        goBoard();
      }
      return;
    } else if (t.dataset.delshelf) {
      store.shelf = store.shelf.filter((x) => x.id !== t.dataset.delshelf);
      save();
    } else if (t.dataset.delprox) {
      store.proximities = store.proximities.filter((x) => x.id !== t.dataset.delprox);
      save();
    } else if (t.dataset.act) {
      const act = t.dataset.act;
      if (act === "new-study") {
        const title = document.getElementById("st-title").value.trim();
        if (!title) {
          say("Give the study a title first.");
        } else {
          const st = { id: uid("s"), title, kind: document.getElementById("st-kind").value, camera: document.getElementById("st-camera").value, beats: [] };
          store.studies.push(st);
          view.studyId = st.id;
          view.tab = "trace";
          save();
        }
      } else if (act === "delete-study" && s) {
        if (!confirm(`Delete “${s.title}”? Its beats go too. Shelf strands stay.`)) return;
        store.studies = store.studies.filter((x) => x !== s);
        view.studyId = store.studies[0] ? store.studies[0].id : "";
        save();
      } else if (act === "add-beat" && s) {
        const b = { id: uid("b"), at: "", note: "", values: {} };
        s.beats.push(b);
        view.editing = b.id;
        save();
      } else if (act === "add-from-board" && s) {
        const b = { id: uid("b"), at: "", note: "from the board", values: window.CuriosityBoard.values() };
        s.beats.push(b);
        save();
      } else if (act === "delete-beat" && s) {
        s.beats = s.beats.filter((b) => b.id !== t.dataset.beat);
        view.picked.delete(t.dataset.beat);
        save();
      } else if (act === "keep") {
        keep();
      } else if (act === "unpick") {
        view.picked.clear();
      } else if (act === "export") {
        exportStudies();
        return;
      } else if (act === "add-prox") {
        const read = (sel, val) => {
          const a = document.getElementById(sel).value;
          if (a.startsWith("s:")) return { suite: a.slice(2) };
          const v = document.getElementById(val).value;
          const [k, x] = [v.slice(0, v.indexOf(":")), v.slice(v.indexOf(":") + 1)];
          if (k === "change") return { curiosity: a, change: x };
          return { curiosity: a, is: byId[a].kind === "range" ? Number(x) : x };
        };
        const within = Math.max(0, Math.min(16, Number(document.getElementById("px-n").value) || 0));
        store.proximities.push({ id: uid("p"), x: read("px-x", "px-xv"), y: read("px-y", "px-yv"), within });
        save();
      } else {
        return;
      }
    } else {
      return;
    }
    draw();
  });

  root.addEventListener(
    "toggle",
    (e) => {
      const g = e.target.dataset && e.target.dataset.group;
      if (!g) return;
      if (e.target.open) view.openGroups.add(g);
      else view.openGroups.delete(g);
    },
    true
  );

  root.addEventListener("change", (e) => {
    const t = e.target;
    const s = current();
    if (t.id === "lens-add" && t.value) {
      if (!view.lens.includes(t.value)) view.lens.push(t.value);
      draw();
    } else if (t.id === "cross-a" || t.id === "cross-b") {
      view.cross[t.id === "cross-a" ? 0 : 1] = t.value;
      draw();
    } else if (t.id === "st-pick") {
      view.studyId = t.value;
      view.picked.clear();
      view.editing = "";
      draw();
    } else if (t.id === "st-import" && t.files[0]) {
      importStudies(t.files[0]);
    } else if (t.id === "px-x") {
      valueOptions("px-xv", false);
    } else if (t.id === "px-y") {
      valueOptions("px-yv", true);
    } else if (t.dataset.val && s) {
      const beat = s.beats.find((b) => b.id === t.closest("[data-beat]").dataset.beat);
      const c = byId[t.dataset.val];
      const val = c.kind === "tag" ? t.value.trim().slice(0, TAG_MAX) : t.value;
      if (val === "") delete beat.values[c.id];
      else beat.values[c.id] = c.kind === "range" ? Number(val) : val;
      save();
      draw();
    } else if ((t.hasAttribute("data-at") || t.hasAttribute("data-note")) && s) {
      const beat = s.beats.find((b) => b.id === t.closest("[data-beat]").dataset.beat);
      if (t.hasAttribute("data-at")) beat.at = t.value.slice(0, 24);
      else beat.note = t.value.slice(0, NOTE_MAX);
      save();
      draw();
    }
  });

  function draw() {
    render();
    if (view.tab === "proximity") {
      valueOptions("px-xv", false);
      valueOptions("px-yv", true);
    }
  }

  window.CuriosityStudy = {
    draw,
    /* A Studio tool keeps what it made: values are {curiosityId: [one value per beat]}. */
    keep(name, values, beats) {
      const clean = {};
      Object.entries(values || {}).forEach(([id, vals]) => {
        const list = (Array.isArray(vals) ? vals : [vals]).map((v) => (v == null || v === "" ? null : v));
        if (list.some((v) => v != null)) clean[id] = list;
      });
      const ids = Object.keys(clean);
      if (!ids.length) return null;
      const n = Number(beats) || Math.max(...ids.map((id) => clean[id].length));
      const k = { id: uid("k"), kind: ids.length === 1 ? "curiosity" : "suite", ref: ids.length === 1 ? ids[0] : "studio", name: String(name || "Studio") + " · Studio", from: "Studio", beats: n, values: clean };
      store.shelf.push(k);
      save();
      return k;
    },
    studies() {
      return store.studies;
    },
  };
})();
