/* Study view. A study is a trace of a film, an episode, or a game:
   beat → which curiosities are on → which suites contain them → which proximities fired.
   Counts and curiosity ids only. A note is a pointer, not a transcript.
   The Shelf keeps one curiosity, or one suite, across a span of beats, so it can be
   applied to the board panel by panel. That is the music app's Essence Shelf. */

(function () {
  const KEY = "curiosities-studies-v1";
  const NOTE_MAX = 120;
  const recordable = CURIOSITIES.filter((c) => c.kind === "select" || c.kind === "range");
  const byId = Object.fromEntries(CURIOSITIES.map((c) => [c.id, c]));
  const root = document.getElementById("study");
  const store = load();
  const view = { tab: "trace", studyId: store.studies[0] ? store.studies[0].id : "", picked: new Set(), editing: "", suite: "", lens: ["cameraCarry", "shotSize"], msg: "" };

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
        b("0:00", { shotSize: "wide", cameraCarry: "locked", cameraMove: "none", characterPath: "cross", characterToLens: "across", angleFamily: "coverage", volume: 3, gesture: 1 }),
        b("0:06", { shotSize: "medium", cameraCarry: "locked", cameraMove: "none", characterPath: "approach", volume: 3, gesture: 1 }),
        b("0:11", { shotSize: "medium", cameraCarry: "smooth", cameraMove: "push in", characterPath: "approach", volume: 3, gesture: 2 }),
        b("0:15", { shotSize: "close", cameraCarry: "smooth", cameraMove: "push in", volume: 1, breath: "breath then speak", angleFamily: "coverage", gesture: 1 }),
        b("0:21", { shotSize: "insert", objectEnter: "enters", objectPath: "lift", moveFollows: "object", cameraCarry: "smooth", cameraMove: "push in", volume: 1 }),
        b("0:24", { shotSize: "medium", cameraCarry: "handheld", cameraMove: "track", angleFamily: "handheld", volume: 4, gesture: 2 }),
        b("0:28", { shotSize: "close", cameraCarry: "handheld", cameraMove: "track", volume: 4, gesture: 4 }),
        b("0:33", { shotSize: "wide", cameraCarry: "locked", cameraMove: "none", characterPath: "still", volume: 2, gesture: 0 }),
      ],
    };
  }

  function current() {
    return store.studies.find((s) => s.id === view.studyId) || null;
  }

  function allSuites() {
    return SUITES;
  }

  function allProximities() {
    return PROXIMITIES.concat(store.proximities);
  }

  function same(a, b) {
    return a != null && b != null && String(a) === String(b);
  }

  function suiteOn(suite, beat) {
    return Object.entries(suite.set).every(([id, v]) => same(beat.values[id], v));
  }

  function condText(c) {
    if (!c) return "";
    if (c.suite) return "suite " + ((SUITES.find((s) => s.id === c.suite) || {}).label || c.suite);
    const label = (byId[c.curiosity] || { label: c.curiosity }).label.toLowerCase();
    if (c.change) return label + " " + c.change;
    return label + " is " + c.is;
  }

  /* Does cond hold at beat j, measured against the beat where x held (i)? */
  function holds(cond, beats, j, i) {
    const beat = beats[j];
    if (!beat) return false;
    if (cond.suite) {
      const s = SUITES.find((x) => x.id === cond.suite);
      return !!s && suiteOn(s, beat);
    }
    const v = beat.values[cond.curiosity];
    if (cond.change) {
      if (i == null || j === i) return false;
      const base = Number(beats[i].values[cond.curiosity]);
      if (v == null || Number.isNaN(base)) return false;
      return cond.change === "rises" ? Number(v) > base : Number(v) < base;
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
        if (holds(p.y, beats, j, i)) {
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
        const suites = allSuites().filter((x) => suiteOn(x, beat));
        const prox = (fired[i] || []).map((p) => `${condText(p.x)} → ${condText(p.y)}`);
        const editing = view.editing === beat.id;
        return `<tr class="${view.picked.has(beat.id) ? "picked" : ""}">
          <td><input type="checkbox" data-pick="${esc(beat.id)}" ${view.picked.has(beat.id) ? "checked" : ""} aria-label="Pick beat ${i + 1}" /></td>
          <td class="mono">${i + 1}</td>
          <td class="mono">${esc(beat.at)}</td>
          <td>${chips(beat.values)}${beat.note ? `<p class="cap">${esc(beat.note)}</p>` : ""}</td>
          <td>${suites.map((x) => `<span class="chip suite">${esc(x.label)}</span>`).join("") || `<span class="cap">—</span>`}</td>
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
        <thead><tr><th></th><th>Beat</th><th>At</th><th>Curiosities on</th><th>Suites</th><th>Proximities that held from here</th><th></th></tr></thead>
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
    const fields = recordable
      .map((c) => {
        const v = beat.values[c.id];
        const opts =
          c.kind === "range"
            ? Array.from({ length: c.max - c.min + 1 }, (_, k) => String(c.min + k))
            : c.options;
        return `<label class="field">${esc(c.label)}
          <select data-val="${c.id}"><option value="">—</option>${opts.map((o) => `<option ${same(v, o) ? "selected" : ""}>${esc(o)}</option>`).join("")}</select>
        </label>`;
      })
      .join("");
    return `<div class="beat-edit" data-beat="${esc(beat.id)}">
      <label class="field">At <input data-at value="${esc(beat.at)}" maxlength="24" placeholder="0:42, or a scene name" /></label>
      <label class="field">Note <input data-note value="${esc(beat.note)}" maxlength="${NOTE_MAX}" placeholder="A pointer, not a transcript" /></label>
      <div class="beat-grid">${fields}</div>
      <button type="button" data-act="delete-beat" data-beat="${esc(beat.id)}">Delete beat</button>
    </div>`;
  }

  function curiosityTab() {
    const toggles = recordable
      .map((c) => `<button type="button" class="chip-btn ${view.lens.includes(c.id) ? "on" : ""}" data-lens="${c.id}">${esc(c.label)}</button>`)
      .join("");
    const blocks = view.lens
      .map((id) => {
        const c = byId[id];
        const rows = store.studies
          .map((s) => {
            const cells = s.beats.map((b) => `<td class="${b.values[id] == null ? "off" : ""}">${esc(b.values[id] == null ? "" : b.values[id])}</td>`).join("");
            const counts = {};
            s.beats.forEach((b) => {
              if (b.values[id] != null) counts[b.values[id]] = (counts[b.values[id]] || 0) + 1;
            });
            const tally = Object.entries(counts)
              .map(([v, n]) => `${v} ×${n}`)
              .join(", ");
            return `<tr><th>${esc(s.title)}</th>${cells}<td class="cap">${esc(tally || "not recorded")}</td></tr>`;
          })
          .join("");
        return `<p class="g">${esc(c.label)}</p><div class="scroll"><table class="lane"><tbody>${rows}</tbody></table></div>`;
      })
      .join("");
    return `<p class="cap">Pick one curiosity to follow it through every study, beat by beat. Pick several to see them side by side.</p>
      <div class="lineage">${toggles}</div>${blocks || `<p class="cap">Nothing picked.</p>`}`;
  }

  function suiteTab() {
    const list = allSuites()
      .map((x) => {
        const counts = store.studies.map((s) => s.beats.filter((b) => suiteOn(x, b)).length);
        const total = counts.reduce((a, b) => a + b, 0);
        return `<tr class="${view.suite === x.id ? "picked" : ""}">
          <td><button type="button" class="link" data-suite="${x.id}">${esc(x.label)}</button><br><span class="cap">${esc(x.note)}</span></td>
          <td>${chips(x.set, view.suite === x.id ? Object.keys(x.set) : null)}</td>
          <td class="mono">${total}</td>
          <td><button type="button" data-play="${x.id}">Play on the board</button></td>
        </tr>`;
      })
      .join("");
    let lanes = "";
    const sel = allSuites().find((x) => x.id === view.suite);
    if (sel) {
      lanes =
        `<p class="g">${esc(sel.label)}, beat by beat</p>` +
        store.studies
          .map((s) => {
            const cells = s.beats
              .map((b) => {
                const on = Object.keys(sel.set).filter((id) => same(b.values[id], sel.set[id]));
                const full = on.length === Object.keys(sel.set).length;
                return `<td class="${full ? "full" : on.length ? "part" : "off"}" title="${esc(on.join(", "))}">${on.length}/${Object.keys(sel.set).length}</td>`;
              })
              .join("");
            return `<div class="scroll"><table class="lane"><tbody><tr><th>${esc(s.title)}</th>${cells}</tr></tbody></table></div>`;
          })
          .join("") +
        `<p class="cap">Each cell counts how many of the suite’s curiosities are on in that beat. A full cell is the suite firing.</p>`;
    }
    return `<p class="cap">A suite is a group of curiosities that fire together. Pick one to light its curiosities and see where it fires. Total counts the beats across all studies.</p>
      <div class="scroll"><table class="trace"><thead><tr><th>Suite</th><th>Curiosities in it</th><th>Beats</th><th></th></tr></thead><tbody>${list}</tbody></table></div>${lanes}`;
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
    const curOpts = recordable.map((c) => `<option value="${c.id}">${esc(c.label)}</option>`).join("");
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
    const opts = c.kind === "range" ? Array.from({ length: c.max - c.min + 1 }, (_, k) => String(c.min + k)) : c.options;
    out.innerHTML =
      opts.map((o) => `<option value="is:${esc(o)}">${esc(o)}</option>`).join("") +
      (withChange && c.kind === "range" ? `<option value="change:rises">rises</option><option value="change:drops">drops</option>` : "");
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
      ids = Object.keys(suite.set);
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
          return k === "change" ? { curiosity: a, change: x } : { curiosity: a, is: x };
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

  root.addEventListener("change", (e) => {
    const t = e.target;
    const s = current();
    if (t.id === "st-pick") {
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
      if (t.value === "") delete beat.values[c.id];
      else beat.values[c.id] = c.kind === "range" ? Number(t.value) : t.value;
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

  window.CuriosityStudy = { draw };
})();
