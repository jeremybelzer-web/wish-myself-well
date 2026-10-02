/* Play: the Flip Book. Each panel of the strip is cut into three flaps, like a kids' flip book:
   Camera, Bodies and Mood. Flipping a flap swaps in a slice from somewhere else: a beat from a
   study, a suite, or the emotion map. Everything else in the panel stays. A suite that fires in a
   panel scores, a proximity that holds from panel to panel scores more, and a goal card asks for
   one suite in one panel. Slices only: a flap never carries a whole beat. */

(function () {
  const root = document.getElementById("play");
  const BEST_KEY = "curiosities-flipbook-best-v1";
  const PANELS = 4;
  const FLAPS = [
    { id: "camera", label: "Camera" },
    { id: "bodies", label: "Bodies" },
    { id: "mood", label: "Mood" },
  ];
  const byId = Object.fromEntries(CURIOSITIES.map((c) => [c.id, c]));

  function flapOf(id) {
    const c = byId[id];
    if (!c) return "mood";
    if (c.group === "Camera" || c.group === "Camera move") return "camera";
    if (["Motion", "Body", "People", "Animation"].includes(c.group)) return "bodies";
    return "mood";
  }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function split(values) {
    const out = { camera: {}, bodies: {}, mood: {} };
    Object.entries(values).forEach(([id, v]) => {
      if (v != null && v !== "") out[flapOf(id)][id] = v;
    });
    return out;
  }

  /* A deck per flap. Card 0 is the board as it stands. */
  function buildDecks() {
    const decks = { camera: [], bodies: [], mood: [] };
    const seen = new Set();
    const add = (flap, values, from, kind) => {
      if (!Object.keys(values).length) return;
      const key = flap + JSON.stringify(Object.entries(values).sort());
      if (seen.has(key)) return;
      seen.add(key);
      decks[flap].push({ values, from, kind });
    };
    const board = split(window.CuriosityBoard.values());
    FLAPS.forEach((f) => add(f.id, board[f.id], "the board", "board"));
    const studies = window.CuriosityStudy ? window.CuriosityStudy.studies() : [];
    studies.forEach((s) =>
      s.beats.forEach((b, i) => {
        const parts = split(b.values);
        FLAPS.forEach((f) => {
          if (Object.keys(parts[f.id]).length >= 2) add(f.id, parts[f.id], `${s.title}, beat ${i + 1}`, "study");
        });
      })
    );
    SUITES.forEach((x) => {
      const parts = split(x.set);
      FLAPS.forEach((f) => add(f.id, parts[f.id], x.label, x.kind || "suite"));
    });
    return decks;
  }

  const game = { decks: null, at: [], score: 0, flips: 0, goal: null, done: 0, flash: "", best: loadBest(), last: null };

  function loadBest() {
    try {
      return Number(localStorage.getItem(BEST_KEY)) || 0;
    } catch (e) {
      return 0;
    }
  }

  function saveBest() {
    try {
      localStorage.setItem(BEST_KEY, String(game.best));
    } catch (e) {}
  }

  function reset() {
    game.decks = buildDecks();
    game.at = Array.from({ length: PANELS }, () => ({ camera: 0, bodies: 0, mood: 0 }));
    game.score = 0;
    game.flips = 0;
    game.done = 0;
    game.flash = "";
    game.goal = newGoal();
    game.last = null;
  }

  function panelValues(i) {
    const v = Object.assign({}, window.CuriosityBoard.values());
    FLAPS.forEach((f) => Object.assign(v, game.decks[f.id][game.at[i][f.id]].values));
    return v;
  }

  function same(a, b) {
    return a != null && b != null && String(a) === String(b);
  }

  function fires(suite, v) {
    return Object.entries(suite.set).every(([id, x]) => same(v[id], x));
  }

  /* A goal is a suite in a panel. Only suites every flap can reach. */
  function reachable(suite) {
    const parts = split(suite.set);
    return FLAPS.every((f) => {
      const want = parts[f.id];
      if (!Object.keys(want).length) return true;
      return game.decks[f.id].some((c) => Object.entries(want).every(([id, x]) => same(c.values[id], x)));
    });
  }

  function newGoal() {
    const pool = SUITES.filter(reachable);
    if (!pool.length) return null;
    const suite = pool[Math.floor(Math.random() * pool.length)];
    return { suite, panel: Math.floor(Math.random() * PANELS) };
  }

  function condHolds(cond, beats, j) {
    const v = beats[j];
    if (!v) return false;
    if (cond.suite) {
      const s = SUITES.find((x) => x.id === cond.suite);
      return !!s && fires(s, v);
    }
    if (cond.change) {
      if (j === 0) return false;
      const a = v[cond.curiosity];
      const b = beats[j - 1][cond.curiosity];
      if (a == null || b == null) return false;
      if (cond.change === "changes") return !same(a, b);
      return cond.change === "rises" ? Number(a) > Number(b) : Number(a) < Number(b);
    }
    return same(v[cond.curiosity], cond.is);
  }

  function tally() {
    const beats = Array.from({ length: PANELS }, (_, i) => panelValues(i));
    const suites = beats.map((v) => SUITES.filter((s) => fires(s, v)));
    const prox = [];
    PROXIMITIES.forEach((p) => {
      beats.forEach((_, i) => {
        if (!condHolds(p.x, beats, i)) return;
        for (let j = i; j <= i + p.within && j < beats.length; j++) {
          if (condHolds(p.y, beats, j)) {
            prox.push({ p, from: i, to: j });
            break;
          }
        }
      });
    });
    const points = suites.reduce((a, s) => a + s.length * 10, 0) + prox.length * 15;
    return { beats, suites, prox, points };
  }

  function flip(i, flap, dir) {
    const deck = game.decks[flap];
    game.at[i][flap] = (game.at[i][flap] + dir + deck.length) % deck.length;
    game.flips++;
    game.last = { i, flap };
    settle();
  }

  function shuffleAll() {
    game.at = game.at.map(() => {
      const o = {};
      FLAPS.forEach((f) => (o[f.id] = Math.floor(Math.random() * game.decks[f.id].length)));
      return o;
    });
    game.flips += PANELS;
    game.last = null;
    settle();
  }

  /* Score is the strip's points now, plus 50 for every goal met along the way. */
  function settle() {
    const t = tally();
    game.flash = "";
    if (game.goal && t.suites[game.goal.panel].includes(game.goal.suite)) {
      game.done++;
      game.flash = `Goal! ${game.goal.suite.label} fires in panel ${game.goal.panel + 1}. +50`;
      game.goal = newGoal();
    }
    game.score = t.points + game.done * 50;
    if (game.score > game.best) {
      game.best = game.score;
      saveBest();
    }
    draw();
  }

  function sendToBoard() {
    const t = tally();
    const values = {};
    t.beats.forEach((v, i) => {
      FLAPS.forEach((f) => {
        Object.entries(game.decks[f.id][game.at[i][f.id]].values).forEach(([id, x]) => {
          if (!values[id]) values[id] = Array(PANELS).fill(null);
          values[id][i] = x;
        });
      });
    });
    window.CuriosityBoard.apply("Flip book", values);
    const b = document.querySelector('.tabs button[data-tab="board"]');
    if (b) b.click();
  }

  function draw() {
    if (!game.decks) reset();
    const t = tally();
    const sc = window.CuriosityBoard.scene();
    const panels = t.beats
      .map((v, i) => {
        const line = sc.lines[i % sc.lines.length];
        const flaps = FLAPS.map((f) => {
          const card = game.decks[f.id][game.at[i][f.id]];
          const hot = game.last && game.last.i === i && game.last.flap === f.id;
          const vals = Object.entries(card.values)
            .slice(0, 4)
            .map(([id, x]) => `${(byId[id] || { label: id }).label.toLowerCase()} ${x}`)
            .join(" · ");
          return `<div class="flap ${hot ? "flipped" : ""}">
            <button type="button" class="flip-btn" data-flip="${i}:${f.id}:-1" aria-label="Flip ${f.label} back in panel ${i + 1}">‹</button>
            <div class="flap-face"><span class="flap-name">${esc(f.label)}</span><span class="flap-from">${esc(card.from)}</span><span class="flap-vals">${esc(vals)}</span></div>
            <button type="button" class="flip-btn" data-flip="${i}:${f.id}:1" aria-label="Flip ${f.label} in panel ${i + 1}">›</button>
          </div>`;
        }).join("");
        const goalHere = game.goal && game.goal.panel === i;
        return `<div class="flip-col ${goalHere ? "goal-col" : ""}">
          ${window.CuriosityBoard.panel(line, i, PANELS, v)}
          <div class="flaps">${flaps}</div>
          <div class="fires">${t.suites[i].map((s) => `<span class="chip suite">${esc(s.label)}</span>`).join("") || `<span class="cap">No suite fires yet.</span>`}</div>
        </div>`;
      })
      .join("");
    const goal = game.goal
      ? `Make <strong>${esc(game.goal.suite.label)}</strong> fire in panel ${game.goal.panel + 1}. It needs ${Object.entries(game.goal.suite.set)
          .map(([id, x]) => `${(byId[id] || { label: id }).label.toLowerCase()} ${x}`)
          .map(esc)
          .join(", ")}.`
      : "No goal can be reached with these decks.";
    root.innerHTML = `
      <h2>Flip Book</h2>
      <p class="cap">Each panel has three flaps: Camera, Bodies and Mood. Flip one and only that slice changes, borrowed from a study, a suite or the emotion map. A suite that fires in a panel is 10 points. A proximity that holds across the panels is 15. A goal is 50.</p>
      <div class="scoreboard">
        <span><strong>${game.score}</strong> points</span>
        <span>${game.flips} flips</span>
        <span>${game.done} goal${game.done === 1 ? "" : "s"}</span>
        <span class="cap">best ${game.best}</span>
      </div>
      <p class="goal-card">${goal}</p>
      ${game.flash ? `<p class="applied flash">${esc(game.flash)}</p>` : ""}
      <div class="flipbook">${panels}</div>
      <p class="g">Proximities holding</p>
      <p class="cap">${t.prox.length ? t.prox.map((x) => esc(`When ${x.p.when}, ${x.p.then}: panel ${x.from + 1} to ${x.to + 1}`)).join("<br>") : "None yet. Change something between neighboring panels."}</p>
      <p class="row-actions">
        <button type="button" data-act="shuffle">Shuffle every flap</button>
        <button type="button" data-act="goal">New goal</button>
        <button type="button" data-act="reset">Start over</button>
        <button type="button" data-act="board">Send to the board</button>
      </p>`;
  }

  root.addEventListener("click", (e) => {
    const t = e.target.closest("button");
    if (!t) return;
    if (t.dataset.flip) {
      const [i, flap, dir] = t.dataset.flip.split(":");
      flip(Number(i), flap, Number(dir));
    } else if (t.dataset.act === "shuffle") shuffleAll();
    else if (t.dataset.act === "goal") {
      game.goal = newGoal();
      draw();
    } else if (t.dataset.act === "reset") {
      reset();
      draw();
    } else if (t.dataset.act === "board") sendToBoard();
  });

  window.CuriosityPlay = { draw };
})();
