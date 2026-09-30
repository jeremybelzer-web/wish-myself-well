(function () {
  const live = CURIOSITIES.filter((c) => c.live);
  const state = load();
  const sceneSelect = { id: state.sceneId || "glass" };

  const controls = document.getElementById("controls");
  const board = document.getElementById("board");
  const catalog = document.getElementById("catalog");
  const ref = document.getElementById("ref");

  document.getElementById("tabs").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-tab]");
    if (!b) return;
    document.querySelectorAll(".tabs button").forEach((x) => x.classList.toggle("on", x === b));
    const tab = b.dataset.tab;
    board.classList.toggle("hidden", tab !== "board");
    controls.classList.toggle("hidden", tab !== "board");
    catalog.classList.toggle("hidden", tab !== "catalog");
    ref.classList.toggle("hidden", tab !== "reference");
  });

  function load() {
    try {
      const raw = localStorage.getItem("curiosities-board-v1");
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    const base = { sceneId: "glass" };
    live.forEach((c) => {
      base[c.id] = c.value;
    });
    return base;
  }

  function save() {
    localStorage.setItem("curiosities-board-v1", JSON.stringify(state));
  }

  function esc(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
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
    } else if (t.dataset.id) {
      state[t.dataset.id] = t.type === "range" ? Number(t.value) : t.value;
      const read = document.getElementById("read-" + t.dataset.id);
      if (read) read.textContent = state[t.dataset.id];
    }
    save();
    drawBoard();
  }

  function volumeSize(i) {
    const base = Number(state.volume) || 3;
    let n = base;
    if (state.dynamicRange === "wide") {
      const flip =
        state.rangeChanges === "every line" ? i % 2 === 1 : state.rangeChanges === "every other" ? Math.floor(i / 2) % 2 === 1 : false;
      n = flip ? Math.max(1, base - 2) : Math.min(5, base + 1);
    }
    return 13 + n * 2;
  }

  function angleLabel(i) {
    const family = state.angleFamily;
    const names = {
      coverage: ["wide", "medium", "close", "insert", "over-shoulder", "wide", "close", "high"],
      oner: ["oner"],
      montage: ["detail", "face", "room", "hand", "door", "sky", "feet", "face"],
      handheld: ["hunting", "too close", "correcting", "hunting", "low", "face", "shoulder", "wide"],
    };
    const list = names[family] || names.coverage;
    if (family === "oner" || state.angleChange === "locked") return list[0];
    return list[i % list.length];
  }

  function drawBoard() {
    const s = scene();
    const count = Math.max(1, Number(state.angleCount) || 1);
    const people = s.people.slice(0, Number(state.peopleCount) || 1);
    const lines = s.lines.slice(0, count);
    while (lines.length < count) lines.push(s.lines[lines.length % s.lines.length]);
    const panels = lines
      .map((line, i) => {
        const bits = [];
        if (state.breath === "breath then speak" && line.text !== "—") bits.push("Breath.");
        if (state.eating === "eat then speak" && line.text !== "—") bits.push("Chews. Then:");
        if (state.eating === "speak while eating" && line.text !== "—") bits.push("Mouth full.");
        const motion =
          state.envMotion === "still"
            ? ""
            : state.envMotion === "wind"
              ? "The air moves."
              : state.envMotion === "crowd"
                ? "People pass behind."
                : state.envMotion === "water"
                  ? "Water in the frame."
                  : "The room is going somewhere.";
        const temp = state.temperature === "mild" ? "" : state.temperature === "cold" ? "Cold." : "Hot.";
        const cut =
          state.angleChange === "on the action"
            ? "Cut on the action."
            : state.angleChange === "both"
              ? "Cut on the line and the action."
              : state.angleChange === "locked"
                ? "Angle held."
                : "Cut on the line.";
        const exit =
          i === lines.length - 1 && state.exit === "leave"
            ? "They take the bag. No body."
            : i === lines.length - 1 && state.exit === "die"
              ? "The hour ends them."
              : "";
        return `<figure class="panel ${esc(state.lighting)} ${esc(state.temperature)}">
          <header><span>SC ${String(i + 1).padStart(2, "0")}</span><span>${esc(angleLabel(i))}</span></header>
          <p class="cap">${esc([temp, motion, cut, bits.join(" "), people.join(", "), exit].filter(Boolean).join(" "))}</p>
          <p class="balloon" style="font-size:${volumeSize(i)}px"><strong>${esc(line.who)}</strong> ${esc(line.text)}</p>
        </figure>`;
      })
      .join("");
    const chips = live
      .map(
        (c) =>
          `<button type="button" data-focus="${c.id}">${esc(c.label)}: ${esc(state[c.id])}</button>`
      )
      .join("");
    board.innerHTML = `
      <h2>${esc(s.title)}</h2>
      <p class="cap">${esc(s.slug)}. ${esc(s.action)} Mains in the hour: ${esc(state.mains)}. Groups: ${esc(state.groups)}.</p>
      <div class="strip">${panels}</div>
      <div class="lineage" id="lineage">${chips}</div>
      <p class="cap">The chips are the combination that made this board. Change one and the strip changes. That is the same device as opening a song or a shot to see which ideas parented it.</p>`;
    document.getElementById("lineage").onclick = (e) => {
      const b = e.target.closest("button[data-focus]");
      if (!b) return;
      const el = controls.querySelector(`[data-id="${b.dataset.focus}"]`);
      if (el) el.focus();
    };
  }

  function drawCatalog() {
    const groups = [];
    CURIOSITIES.forEach((c) => {
      if (!groups.includes(c.group)) groups.push(c.group);
    });
    catalog.innerHTML =
      `<h2>Every curiosity on the list</h2><p>${CURIOSITIES.length} so far. A render can change these. The list is supposed to grow.</p>` +
      groups
        .map((g) => {
          const items = CURIOSITIES.filter((c) => c.group === g)
            .map((c) => `<li><strong>${esc(c.label)}</strong> — ${esc(c.note)}</li>`)
            .join("");
          return `<p class="g">${esc(g)}</p><ul>${items}</ul>`;
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

  drawControls();
  drawBoard();
  drawCatalog();
  drawRef();
})();
