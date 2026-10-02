(function () {
  const live = CURIOSITIES.filter((c) => c.live);
  const state = load();
  const sceneSelect = { id: state.sceneId || "glass" };

  const controls = document.getElementById("controls");
  const board = document.getElementById("board");
  const catalog = document.getElementById("catalog");
  const ref = document.getElementById("ref");
  const study = document.getElementById("study");
  const play = document.getElementById("play");

  document.getElementById("tabs").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-tab]");
    if (!b) return;
    document.querySelectorAll(".tabs button").forEach((x) => x.classList.toggle("on", x === b));
    const tab = b.dataset.tab;
    board.classList.toggle("hidden", tab !== "board");
    controls.classList.toggle("hidden", tab !== "board");
    catalog.classList.toggle("hidden", tab !== "catalog");
    ref.classList.toggle("hidden", tab !== "reference");
    study.classList.toggle("hidden", tab !== "study");
    if (tab === "study" && window.CuriosityStudy) window.CuriosityStudy.draw();
    play.classList.toggle("hidden", tab !== "play");
    if (tab === "play" && window.CuriosityPlay) window.CuriosityPlay.draw();
    const studio = document.getElementById("studio");
    studio.classList.toggle("hidden", tab !== "studio");
    if (tab === "studio" && window.CuriosityStudio) window.CuriosityStudio.draw();
    const automate = document.getElementById("automate");
    automate.classList.toggle("hidden", tab !== "automate");
    if (tab === "automate" && window.CuriosityAutomate) window.CuriosityAutomate.draw();
    const games = document.getElementById("games");
    games.classList.toggle("hidden", tab !== "games");
    if (tab === "games" && window.CuriosityGames) window.CuriosityGames.draw();
  });

  function load() {
    let saved = {};
    try {
      const raw = localStorage.getItem("curiosities-board-v2");
      if (raw) saved = JSON.parse(raw);
    } catch (e) {}
    const base = { sceneId: saved.sceneId || "glass", suite: saved.suite || "", applied: saved.applied || null };
    live.forEach((c) => {
      base[c.id] = saved[c.id] != null ? saved[c.id] : c.value;
    });
    return base;
  }

  function save() {
    localStorage.setItem("curiosities-board-v2", JSON.stringify(state));
  }

  function esc(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function scene() {
    return SCENES.find((s) => s.id === state.sceneId) || SCENES[0];
  }

  function drawControls() {
    const groups = [];
    live.forEach((c) => {
      if (!groups.includes(c.group)) groups.push(c.group);
    });
    const sceneField = `
      <label class="field">Scene
        <select id="scene">
          ${SCENES.map((s) => `<option value="${s.id}" ${s.id === state.sceneId ? "selected" : ""}>${esc(s.title)}</option>`).join("")}
        </select>
      </label>
      <label class="field">Suite
        <select id="suite">
          <option value="">Custom</option>
          ${[["", "Suites"], ["genre", "Genres"], ["emotion", "Angle by emotion"]]
            .map(
              ([k, title]) =>
                `<optgroup label="${title}">${SUITES.filter((s) => (s.kind || "") === k)
                  .map((s) => `<option value="${s.id}" ${s.id === state.suite ? "selected" : ""}>${esc(s.label)}</option>`)
                  .join("")}</optgroup>`
            )
            .join("")}
        </select>
      </label>`;
    const fields = groups
      .map((g) => {
        const items = live
          .filter((c) => c.group === g)
          .map((c) => {
            if (c.kind === "range") {
              return `<label class="field">${esc(c.label)} <span id="read-${c.id}">${esc(state[c.id])}</span>
                <input type="range" min="${c.min}" max="${c.max}" value="${state[c.id]}" data-id="${c.id}" />
              </label>`;
            }
            return `<label class="field">${esc(c.label)}
              <select data-id="${c.id}">
                ${c.options.map((o) => `<option ${o === state[c.id] ? "selected" : ""}>${esc(o)}</option>`).join("")}
              </select>
            </label>`;
          })
          .join("");
        return `<p class="group-label">${esc(g)}</p>${items}`;
      })
      .join("");
    controls.innerHTML = `<h2>Play the scene</h2>${sceneField}${fields}`;
    controls.onchange = onChange;
    controls.oninput = onChange;
  }

  function onChange(e) {
    const t = e.target;
    if (t.id === "scene") {
      state.sceneId = t.value;
    } else if (t.id === "suite") {
      state.suite = t.value;
      const suite = SUITES.find((s) => s.id === t.value);
      if (suite) {
        Object.assign(state, suite.set);
        Object.keys(suite.set).forEach(unapply);
      }
      drawControls();
    } else if (t.dataset.id) {
      state[t.dataset.id] = t.type === "range" ? Number(t.value) : t.value;
      unapply(t.dataset.id);
      const read = document.getElementById("read-" + t.dataset.id);
      if (read) read.textContent = state[t.dataset.id];
    }
    save();
    drawBoard();
  }

  /* A control you touch by hand wins over a strand applied from the Shelf. */
  function unapply(id) {
    if (!state.applied || !(id in state.applied.values)) return;
    delete state.applied.values[id];
    if (!Object.keys(state.applied.values).length) state.applied = null;
  }

  function volumeSize(i, st) {
    const base = Number(st.volume) || 3;
    let n = base;
    if (st.dynamicRange === "wide") {
      const flip =
        st.rangeChanges === "every line" ? i % 2 === 1 : st.rangeChanges === "every other" ? Math.floor(i / 2) % 2 === 1 : false;
      n = flip ? Math.max(1, base - 2) : Math.min(5, base + 1);
    }
    return 13 + n * 2;
  }

  function angleLabel(i, st) {
    if (st.shotSize) return st.shotSize;
    const family = st.angleFamily;
    const names = {
      coverage: ["wide", "medium", "close", "insert", "over-shoulder", "wide", "close", "high"],
      oner: ["oner"],
      montage: ["detail", "face", "room", "hand", "door", "sky", "feet", "face"],
      handheld: ["hunting", "too close", "correcting", "hunting", "low", "face", "shoulder", "wide"],
    };
    const list = names[family] || names.coverage;
    if (family === "oner" || st.angleChange === "locked") return list[0];
    return list[i % list.length];
  }

  function shotWord(i, st) {
    if (st.shotSize) return st.shotSize;
    const label = angleLabel(i, st);
    if (label.indexOf("close") >= 0) return "close";
    if (label === "insert" || label === "detail" || label === "hand") return "insert";
    if (label === "wide" || label === "room") return "wide";
    return "medium";
  }

  function stageSvg(i, count, st) {
    const t = count <= 1 ? 0 : i / (count - 1);
    const carry = st.cameraCarry || "smooth";
    const speed = Number(st.moveSpeed) || 2;
    const move = st.cameraMove || "none";
    let cam = "";
    if (carry === "locked" || move === "none") {
      cam = `<rect x="8" y="8" width="184" height="74" fill="none" stroke="#1c1712" stroke-width="1.5"/>`;
    } else if (carry === "handheld") {
      const pts = [];
      for (let k = 0; k <= 8; k++) {
        const x = 16 + k * 20;
        const y = 28 + Math.sin(k * 1.7 + i) * (3 + speed) + (k % 2 ? 5 : -4);
        pts.push(x + "," + y.toFixed(1));
      }
      cam = `<polyline points="${pts.join(" ")}" fill="none" stroke="#c45c26" stroke-width="2"/>`;
    } else {
      const y1 = move === "crane" ? 68 : 46;
      const y2 = move === "crane" || move === "tilt" ? 18 : move === "push in" ? 40 : 46;
      const x2 = move === "push in" ? 110 : move === "pull out" ? 48 : move === "orbit" ? 100 : 180;
      cam = `<path d="M16,${y1} C80,${y1} 120,${y2} ${x2},${y2}" fill="none" stroke="#1c1712" stroke-width="2"/>`;
    }
    const n = Math.min(4, Math.max(1, Number(st.peopleCount) || 1));
    const bodies = [];
    for (let p = 0; p < n; p++) {
      if (st.whoMoves === "neither") {
        bodies.push(`<circle cx="${40 + p * 28}" cy="58" r="5" fill="#1c1712"/>`);
        continue;
      }
      let x = 40 + p * 28;
      let y = 58;
      const path = st.characterPath;
      if (path === "cross") x = 18 + t * 130 + p * 10;
      if (path === "approach") {
        x = 78 + p * 16;
        y = 72 - t * 40;
      }
      if (path === "retreat") {
        x = 78 + p * 16;
        y = 28 + t * 40;
      }
      if (path === "circle") {
        const a = t * Math.PI * 2 + p * 0.8;
        x = 100 + Math.cos(a) * (28 + speed * 3);
        y = 48 + Math.sin(a) * 18;
      }
      if (st.characterToLens === "toward" && path === "still") y = 68 - t * 24;
      if (st.characterToLens === "away" && path === "still") y = 36 + t * 20;
      const enter = st.bodyEnter;
      if (enter === "enters") x = 8 + t * (x - 8);
      if (enter === "leaves") x = x + t * (190 - x);
      const r = Math.min(10, 4 + Number(st.characterSpeed || 1));
      bodies.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="#1c1712"/>`);
    }
    let ox = 28;
    let oy = 70;
    const op = st.objectPath;
    const os = Number(st.objectSpeed) || 1;
    if (op === "slide" || op === "pass") ox = 16 + t * (20 + os * 28);
    if (op === "lift") oy = 70 - t * (8 + os * 8);
    if (op === "drop") oy = 24 + t * (8 + os * 8);
    if (op === "open") ox = 28 + t * 16;
    if (st.objectEnter === "enters") ox = -10 + t * (ox + 10);
    if (st.objectEnter === "leaves") ox = ox + t * 40;
    const obj =
      op === "still" && st.objectEnter === "stays"
        ? `<rect x="24" y="68" width="14" height="10" fill="none" stroke="#b8892d" stroke-width="2"/>`
        : `<rect x="${ox.toFixed(1)}" y="${oy.toFixed(1)}" width="14" height="10" fill="#b8892d"/>`;
    /* Angle height moves the horizon: a low camera sees it low, a high one sees it high. Dutch tilts the stage. */
    const horizonY = { low: 80, eye: 50, high: 24, floor: 86, overhead: null }[st.angleHeight];
    const horizon = st.angleHeight
      ? horizonY == null
        ? `<path d="M0,30 H200 M0,60 H200 M66,0 V90 M133,0 V90" stroke="#1c1712" stroke-opacity="0.12" fill="none"/>`
        : `<line x1="0" y1="${horizonY}" x2="200" y2="${horizonY}" stroke="#1c1712" stroke-opacity="0.25" stroke-dasharray="3 3"/>`
      : "";
    const tilt = st.dutch === "tilted" ? ` transform="rotate(-8 100 45)"` : "";
    return `<svg class="stage ${esc(carry)}" viewBox="0 0 200 90" role="img" aria-label="Camera ${esc(carry)}, people ${esc(st.characterPath)}, object ${esc(op)}"><g${tilt}>${horizon}${cam}${bodies.join("")}${obj}</g></svg>`;
  }

  /* A strand applied from the Shelf sets one value per panel, cycled when the strip is longer. */
  function panelState(i) {
    if (!state.applied) return state;
    const st = Object.assign({}, state);
    Object.entries(state.applied.values).forEach(([id, vals]) => {
      const v = vals.length ? vals[i % vals.length] : null;
      if (v != null && v !== "") st[id] = v;
    });
    return st;
  }

  /* One comic panel. The Play tab draws its flip book with this too. */
  function panelHtml(line, i, count, st, people) {
    const bits = [];
    if (st.breath === "breath then speak" && line.text !== "—") bits.push("Breath.");
    if (st.eating === "eat then speak" && line.text !== "—") bits.push("Chews. Then:");
    if (st.eating === "speak while eating" && line.text !== "—") bits.push("Mouth full.");
    const motion =
      st.envMotion === "still"
        ? ""
        : st.envMotion === "wind"
          ? "The air moves."
          : st.envMotion === "crowd"
            ? "People pass behind."
            : st.envMotion === "water"
              ? "Water in the frame."
              : "The room is going somewhere.";
    const temp = st.temperature === "mild" ? "" : st.temperature === "cold" ? "Cold." : "Hot.";
    const cut =
      st.angleChange === "on the action"
        ? "Cut on the action."
        : st.angleChange === "both"
          ? "Cut on the line and the action."
          : st.angleChange === "locked"
            ? "Angle held."
            : "Cut on the line.";
    const exit =
      i === count - 1 && st.exit === "leave"
        ? "They take the bag. No body."
        : i === count - 1 && st.exit === "die"
          ? "The hour ends them."
          : "";
    const moveLine = [st.cameraCarry, st.cameraMove, "follows " + st.moveFollows].join(" · ");
    const quiet = shotWord(i, st) === "close" ? Math.max(11, volumeSize(i, st) - 4) : volumeSize(i, st);
    return `<figure class="panel ${esc(st.lighting)} ${esc(st.temperature)}">
      <header><span>SC ${String(i + 1).padStart(2, "0")}${st.emotion ? " · " + esc(st.emotion) : ""}</span><span>${esc([st.angleHeight && st.angleHeight !== "eye" ? st.angleHeight : "", angleLabel(i, st)].filter(Boolean).join(" "))}</span></header>
      ${stageSvg(i, count, st)}
      <p class="cap">${esc([moveLine, st.characterPath, st.objectKind + " " + st.objectPath, temp, motion, cut, bits.join(" "), people.join(", "), exit].filter(Boolean).join(" "))}</p>
      <p class="balloon" style="font-size:${quiet}px"><strong>${esc(line.who)}</strong> ${esc(line.text)}</p>
    </figure>`;
  }

  function appliedNote() {
    if (!state.applied) return "";
    const ids = Object.keys(state.applied.values)
      .map((id) => (CURIOSITIES.find((c) => c.id === id) || { label: id }).label)
      .join(", ");
    return `<p class="applied">From the Shelf: <strong>${esc(state.applied.label)}</strong>. Panel by panel: ${esc(ids)}.
      <button type="button" id="clear-applied">Clear</button></p>`;
  }

  function drawBoard() {
    const s = scene();
    const count = Math.max(1, Number(state.angleCount) || 1);
    const people = s.people.slice(0, Number(state.peopleCount) || 1);
    const lines = s.lines.slice(0, count);
    while (lines.length < count) lines.push(s.lines[lines.length % s.lines.length]);
    const panels = lines.map((line, i) => panelHtml(line, i, lines.length, panelState(i), people)).join("");
    const fired = PROXIMITIES.filter((p) => p.test && lines.some((_, i) => p.test(panelState(i), shotWord(i, panelState(i)))))
      .map((p) => `When ${p.when}, ${p.then} within ${p.within} beat${p.within === 1 ? "" : "s"}.`)
      .join(" ");
    const chips = live
      .map(
        (c) =>
          `<button type="button" data-focus="${c.id}">${esc(c.label)}: ${esc(state[c.id])}</button>`
      )
      .join("");
    board.innerHTML = `
      <h2>${esc(s.title)}</h2>
      <p class="cap">${esc(s.slug)}. ${esc(s.action)} Mains in the hour: ${esc(state.mains)}. Groups: ${esc(state.groups)}.</p>
      ${appliedNote()}
      <div class="strip">${panels}</div>
      <p class="prox">${fired ? esc(fired) : "No seed proximity is firing. Change the carry, the path, or whether an object enters."}</p>
      <div class="lineage" id="lineage">${chips}</div>
      <p class="cap">The chips are the combination that made this board. Change one and the strip changes. That is the same device as opening a song or a shot to see which ideas parented it.</p>`;
    const clear = document.getElementById("clear-applied");
    if (clear)
      clear.onclick = () => {
        state.applied = null;
        save();
        drawBoard();
      };
    document.getElementById("lineage").onclick = (e) => {
      const b = e.target.closest("button[data-focus]");
      if (!b) return;
      const el = controls.querySelector(`[data-id="${b.dataset.focus}"]`);
      if (el) el.focus();
    };
  }

  /* Jeremy's test for every curiosity, from the music app: can it be extracted, applied,
     expanded, automated, and what game and gizmo would make changing it fun.
     The first four are measured from this folder. Game and gizmo are design cells. */
  const NOTES_KEY = "curiosities-catalog-notes-v1";
  /* Not a control, but a Shelf strand can set it per panel. */
  const BOARD_ALSO_PLAYS = ["shotSize"];

  function loadNotes() {
    try {
      return JSON.parse(localStorage.getItem(NOTES_KEY)) || {};
    } catch (e) {
      return {};
    }
  }

  function measured(c) {
    const recordable = c.kind === "select" || c.kind === "range" || c.kind === "tag";
    return {
      extract: recordable ? "yes" : "not yet",
      apply: c.live || BOARD_ALSO_PLAYS.includes(c.id) ? "yes" : "not yet",
      expand: c.live || BOARD_ALSO_PLAYS.includes(c.id) ? "swap" : "not yet",
      automate: "not yet",
    };
  }

  const catView = { tab: "curiosities", q: "", group: "" };

  function drawCatalog() {
    const tabs = [
      ["curiosities", `Curiosities (${CURIOSITIES.length})`],
      ["suites", `Suites (${SUITES.length})`],
      ["proximities", `Proximities (${PROXIMITIES.length + LIBRARY.proximities.length})`],
      ["moves", `Development moves (${LIBRARY.moves.length})`],
    ];
    catalog.innerHTML = `<h2>The Curiosities library</h2>
      <p class="cap">Everything in the filmmaking catalog, in the three categories: curiosities, suites and proximities, plus the development moves that change a motif.</p>
      <nav class="subtabs">${tabs.map(([k, l]) => `<button type="button" data-cat="${k}" class="${catView.tab === k ? "on" : ""}">${esc(l)}</button>`).join("")}</nav>
      <div id="cat-body"></div>`;
    drawCatalogBody();
    catalog.onclick = (e) => {
      const b = e.target.closest("button[data-cat]");
      if (!b) return;
      catView.tab = b.dataset.cat;
      drawCatalog();
    };
    catalog.oninput = (e) => {
      const t = e.target;
      if (t.id === "cat-q") {
        catView.q = t.value;
        drawCatalogRows();
        return;
      }
      if (!t.dataset.note) return;
      const all = loadNotes();
      all[t.dataset.note] = Object.assign({}, all[t.dataset.note], { [t.dataset.col]: t.value });
      try {
        localStorage.setItem(NOTES_KEY, JSON.stringify(all));
      } catch (err) {}
    };
    catalog.onchange = (e) => {
      if (e.target.id !== "cat-group") return;
      catView.group = e.target.value;
      drawCatalogRows();
    };
  }

  function drawCatalogBody() {
    const body = document.getElementById("cat-body");
    if (catView.tab === "curiosities") {
      const groups = [];
      CURIOSITIES.forEach((c) => {
        if (!groups.includes(c.group)) groups.push(c.group);
      });
      body.innerHTML = `<p class="cap">Extract: a study can record it. Apply: the board can play it. Expand: a Shelf strand can swap it in, panel by panel; variations come later. Automate: no lanes yet. Game and gizmo are yours and Sharani’s to fill in; they save in this browser.</p>
        <div class="prox-form">
          <label class="field">Search <input id="cat-q" value="${esc(catView.q)}" placeholder="camera, emotion, rain…" /></label>
          <label class="field">Group <select id="cat-group"><option value="">All groups</option>${groups.map((g) => `<option ${g === catView.group ? "selected" : ""}>${esc(g)}</option>`).join("")}</select></label>
        </div>
        <div id="cat-rows"></div>`;
      drawCatalogRows();
      return;
    }
    if (catView.tab === "suites") {
      const kinds = [
        ["", "Suites"],
        ["genre", "Genres"],
        ["emotion", "Angle by emotion"],
      ];
      body.innerHTML =
        `<p class="cap">A suite is a named group of curiosities that change together. Play one from the Board’s Suite menu, or count where it fires in Study.</p>` +
        kinds
          .map(
            ([k, title]) => `<p class="g">${esc(title)}</p><div class="scroll"><table class="trace"><tbody>${SUITES.filter((x) => (x.kind || "") === k)
              .map((x) => `<tr><td><strong>${esc(x.label)}</strong><br><span class="cap">${esc(x.note)}</span></td><td>${Object.entries(x.set).map(([id, v]) => `<span class="chip">${esc(labelOf(id))}: ${esc(v)}</span>`).join("")}</td></tr>`)
              .join("")}</tbody></table></div>`
          )
          .join("");
      return;
    }
    if (catView.tab === "proximities") {
      const counted = PROXIMITIES.map(
        (p) => `<tr><td>When ${esc(p.when)}, ${esc(p.then)}</td><td class="mono">${p.within}</td><td class="cap">counted in Study</td></tr>`
      ).join("");
      const text = LIBRARY.proximities.map(
        (p) => `<tr><td>When ${esc(p.when)}, ${esc(p.then)}</td><td class="mono">${p.within}</td><td class="cap">${esc(p.source)}${p.source === "suite" ? "" : " · a guess until counted"}</td></tr>`
      ).join("");
      body.innerHTML = `<p class="cap">When X happens, Y follows within N beats. The first table can be counted in Study today. The second is the catalog’s full list; every row is a guess until we count it in works we curate.</p>
        <p class="g">Countable now</p><div class="scroll"><table class="trace"><thead><tr><th>Proximity</th><th>Within</th><th></th></tr></thead><tbody>${counted}</tbody></table></div>
        <p class="g">The catalog’s list</p><div class="scroll"><table class="trace"><thead><tr><th>Proximity</th><th>Within</th><th>Source</th></tr></thead><tbody>${text}</tbody></table></div>`;
      return;
    }
    body.innerHTML = `<p class="cap">The Bach and Beethoven moves, treated as curiosities too. Run through “A is to B as C is to D”, a move read from a curated work is applied to our motif. Not playable yet.</p>
      <div class="scroll"><table class="trace"><tbody>${LIBRARY.moves.map((m) => `<tr><td><strong>${esc(m.label)}</strong></td><td>${esc(m.does)}</td><td class="cap">${esc(m.source)}</td></tr>`).join("")}</tbody></table></div>`;
  }

  function labelOf(id) {
    return (CURIOSITIES.find((c) => c.id === id) || { label: id }).label;
  }

  function drawCatalogRows() {
    const out = document.getElementById("cat-rows");
    if (!out) return;
    const notes = loadNotes();
    const q = catView.q.trim().toLowerCase();
    const shown = CURIOSITIES.filter(
      (c) =>
        (!catView.group || c.group === catView.group) &&
        (!q || [c.id, c.label, c.note, c.view, c.group].filter(Boolean).join(" ").toLowerCase().includes(q))
    );
    const groups = [];
    shown.forEach((c) => {
      if (!groups.includes(c.group)) groups.push(c.group);
    });
    const cell = (v) => `<td class="m ${v === "yes" ? "yes" : v === "swap" ? "part" : "no"}">${esc(v)}</td>`;
    const values = (c) =>
      c.kind === "range" ? `${c.min} to ${c.max}` : c.kind === "select" ? c.options.join(", ") : c.kind === "tag" ? "a word" : "";
    out.innerHTML =
      `<p class="cap">${shown.length} of ${CURIOSITIES.length}.</p>` +
      groups
        .map((g) => {
          const rows = shown
            .filter((c) => c.group === g)
            .map((c) => {
              const m = measured(c);
              const n = notes[c.id] || {};
              return `<tr><td><strong>${esc(c.label)}</strong> <span class="mono cap">${esc(c.id)}</span><br><span class="cap">${esc(c.view || c.note)}</span><br><span class="cap">${esc(values(c))}${c.source ? " · " + esc(c.source) : ""}</span></td>
                ${cell(m.extract)}${cell(m.apply)}${cell(m.expand)}${cell(m.automate)}
                <td><input class="note" data-note="${c.id}" data-col="game" value="${esc(n.game || "")}" placeholder="game" aria-label="Game for ${esc(c.label)}" /></td>
                <td><input class="note" data-note="${c.id}" data-col="gizmo" value="${esc(n.gizmo || "")}" placeholder="gizmo" aria-label="Gizmo for ${esc(c.label)}" /></td></tr>`;
            })
            .join("");
          return `<p class="g">${esc(g)}</p>
            <div class="scroll"><table class="six"><thead><tr><th>Curiosity</th><th>Extract</th><th>Apply</th><th>Expand</th><th>Automate</th><th>Game</th><th>Gizmo</th></tr></thead><tbody>${rows}</tbody></table></div>`;
        })
        .join("");
  }

  function drawRef() {
    const rows = REFERENCE.other.hours
      .map((h) => `<tr><td>${esc(h.id)}</td><td>${esc(h.measure)}</td></tr>`)
      .join("");
    const ledger = REFERENCE.ours.ledger
      .map((p) => `<tr><td>${esc(p.name)}</td><td>${esc(p.status)}</td><td>${esc(p.hours)}</td></tr>`)
      .join("");
    ref.innerHTML = `
      <h2>How often, and with whom</h2>
      <p><strong>${esc(REFERENCE.ours.name)}.</strong> ${esc(REFERENCE.ours.mains)} ${esc(REFERENCE.ours.groups)} ${esc(REFERENCE.ours.exits)} ${esc(REFERENCE.ours.season)}</p>
      <table><thead><tr><th>Person</th><th>Exit</th><th>Where they are</th></tr></thead><tbody>${ledger}</tbody></table>
      <h2>${esc(REFERENCE.other.name)}</h2>
      <p>${esc(REFERENCE.other.exits)} ${esc(REFERENCE.other.groups)} ${esc(REFERENCE.other.mains)}</p>
      <table><thead><tr><th>Hour, as a measurement</th><th>What the shape does</th></tr></thead><tbody>${rows}</tbody></table>
      <p>These rows measure companies and exits. They do not retell the hours.</p>`;
  }

  /* The study view reads the board and applies Shelf strands to it through this. */
  window.CuriosityBoard = {
    scene() {
      return scene();
    },
    panel(line, i, count, values) {
      return panelHtml(line, i, count, Object.assign({}, state, values), scene().people.slice(0, Number(state.peopleCount) || 1));
    },
    values() {
      const out = {};
      live.forEach((c) => (out[c.id] = state[c.id]));
      return out;
    },
    apply(label, values) {
      state.applied = { label, values };
      save();
      drawBoard();
    },
    playSuite(id) {
      const suite = SUITES.find((s) => s.id === id);
      if (!suite) return;
      state.suite = id;
      Object.assign(state, suite.set);
      Object.keys(suite.set).forEach(unapply);
      save();
      drawControls();
      drawBoard();
    },
  };

  drawControls();
  drawBoard();
  drawCatalog();
  drawRef();
})();
