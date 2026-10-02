/* Studio · Start here: the way in. Sharani's six areas first (Animation, Lighting, Shading,
   Dynamics, Fur, Bifrost) with the tools in each, then Chain, which links them, then the other
   tools. A path picker gives each audience a short lesson through the tools, with tick boxes.
   Counts come from window.MAYA_MANUAL. State is localStorage key curiosities-studio-start-v1. */

(function () {
  if (!window.CuriosityStudio) return;

  const KEY = "curiosities-studio-start-v1";

  const AREAS = [
    { name: "Animation", note: "Keys, timing, bodies and faces through beats.", tools: ["curves", "motion", "rig", "face", "remix"] },
    { name: "Lighting", note: "Arnold lights, exposure and the look of the room.", tools: ["light"] },
    { name: "Shading", note: "Surfaces: gloss, wetness, toon ink.", tools: ["shading"] },
    { name: "Dynamics", note: "Wind, cloth, impacts and things that break.", tools: ["dynamics"] },
    { name: "Fur", note: "Hair and fur that lag, clump and move in wind.", tools: ["fur"] },
    { name: "Bifrost", note: "Fire, water and smoke as curiosities.", tools: ["bifrost"] },
  ];
  const LINK = { name: "Chain", note: "Links the areas: when one curiosity happens, another follows. Rain makes things wet.", tools: ["chain"] };
  const OTHER = { name: "More tools", note: "Camera, edit, performance and output.", tools: ["camera", "sequencer", "live", "crowd", "passes", "print", "manual"] };

  const PATHS = {
    Beginner: [
      ["motion", "Motion: make the ball hop on twos and feel the difference from ones."],
      ["camera", "Camera: swap a wide lens for a long one and watch the people flatten."],
      ["light", "Light & look: pick a preset, then send it to the board."],
      ["curves", "Curves: add three keys to move speed and press Play."],
      ["sequencer", "Shots: play the edit and read its cut rate."],
    ],
    Intermediate: [
      ["curves", "Curves: try each tangent type on one key and compare the holds."],
      ["rig", "Rig & pose: pose a body, then keep the pose on the Shelf."],
      ["face", "Face: blend two shapes and lip-sync one line."],
      ["sequencer", "Shots: split a shot at the playhead and add an insert on Track 2."],
      ["passes", "Passes: break one shot into light and shadow passes."],
    ],
    Advanced: [
      ["curves", "Curves: drive move speed from volume with Set Driven Key."],
      ["curves", "Curves: slow the whole performance with a Time Warp curve."],
      ["dynamics", "Dynamics: raise the wind until the cloth flutters, then add an impact."],
      ["bifrost", "Bifrost: build a fire and watch colour temperature warm."],
      ["chain", "Chain: follow one change through every area it touches."],
      ["sequencer", "Shots: playblast the edit to a video."],
    ],
    Remixer: [
      ["remix", "Remix: swap the Camera slice of one clip with another suite."],
      ["remix", "Remix: keep the Bodies, change the Mood, and compare."],
      ["crowd", "Crowd: scatter a crowd and remix how it moves."],
      ["curves", "Curves: turn a remixed rhythm into keys and set them all to stepped."],
      ["print", "Print: lay the remix out as a strip or a zine page."],
    ],
    Performer: [
      ["live", "Live: map a pad to camera carry, record a take, keep it on the Shelf."],
      ["live", "Live: bind a key or MIDI note to fire a suite mid-take."],
      ["curves", "Curves: record the mouse into keys while the playhead runs."],
      ["sequencer", "Shots: load a sound and press C to cut live."],
      ["live", "Live: send your take to the board and watch the panels."],
    ],
    Student: [
      ["manual", "Manual: find three topics marked built and open each tool."],
      ["chain", "Chain: turn off the rain rule and see what stops getting wet."],
      ["light", "Light & look: change one light and name what the scene's mood does."],
      ["fur", "Fur & hair: stop the character and watch the fur settle."],
      ["shading", "Shading: compare a mirror gloss with a matte one under the same light."],
    ],
  };

  let api = null;
  let root = null;

  function esc(s) {
    return api.esc(s);
  }

  function label(id) {
    try {
      return window.CuriosityStudio.label(id) || "";
    } catch (e) {
      return "";
    }
  }

  function load() {
    const s = api.store(KEY).get(null) || {};
    return { path: PATHS[s.path] ? s.path : "Beginner", done: s.done && typeof s.done === "object" ? s.done : {} };
  }

  function counts() {
    const m = window.MAYA_MANUAL;
    const t = m && Array.isArray(m.topics) ? m.topics : [];
    return {
      topics: t.length,
      major: t.filter((x) => x.weight === "major").length,
      built: t.filter((x) => x.built === "yes").length,
      partly: t.filter((x) => x.built === "partly").length,
    };
  }

  function toolLinks(ids) {
    return ids
      .map((id) => {
        const l = label(id);
        return l ? `<button type="button" class="st-open" data-open="${esc(id)}">Open ${esc(l)}</button>` : "";
      })
      .join("");
  }

  function card(a, cls) {
    const links = toolLinks(a.tools);
    return `<div class="st-card ${cls || ""}"><h3>${esc(a.name)}</h3><p class="cap">${esc(a.note)}</p>${links ? `<div class="st-links">${links}</div>` : `<p class="cap">Coming soon.</p>`}</div>`;
  }

  function render() {
    const s = load();
    const c = counts();
    const steps = PATHS[s.path];
    const doneN = steps.filter((_, i) => s.done[s.path + ":" + i]).length;
    root.innerHTML = `<div class="st">
      <p class="cap">Every tool here sets curiosities, so anything you build can go to the board, the Shelf or a study. Start with an area, or pick a path below.</p>
      ${c.topics ? `<div class="st-counts"><span class="chip">${c.topics} manual topics</span><span class="chip">${c.major} major</span><span class="chip lit">${c.built} built</span><span class="chip">${c.partly} partly built</span></div>` : ""}
      <div class="g">Sharani’s six areas</div>
      <div class="st-cards">${AREAS.map((a) => card(a)).join("")}</div>
      ${card(LINK, "st-link")}
      <div class="g">More tools</div>
      ${card(OTHER, "st-other")}
      <div class="g">Pick a path</div>
      <nav class="subtabs st-paths">${Object.keys(PATHS)
        .map((p) => `<button type="button" data-path="${esc(p)}" class="${p === s.path ? "on" : ""}">${esc(p)}</button>`)
        .join("")}</nav>
      <p class="cap">${esc(s.path)}: ${doneN} of ${steps.length} done.</p>
      <ol class="st-steps">${steps
        .map(([id, task], i) => {
          const k = s.path + ":" + i;
          const l = label(id);
          return `<li class="${s.done[k] ? "done" : ""}"><label><input type="checkbox" data-step="${esc(k)}"${s.done[k] ? " checked" : ""}> <span>${esc(task)}</span></label>${l ? `<button type="button" class="st-open" data-open="${esc(id)}">Open</button>` : ""}</li>`;
        })
        .join("")}</ol>
      ${doneN ? `<div class="bar-actions"><button type="button" id="st-reset">Clear ticks for this path</button></div>` : ""}
    </div>`;
    root.querySelectorAll("[data-open]").forEach((b) => b.addEventListener("click", () => window.CuriosityStudio.open(b.dataset.open)));
    root.querySelectorAll("[data-path]").forEach((b) =>
      b.addEventListener("click", () => {
        api.store(KEY).set(Object.assign(load(), { path: b.dataset.path }));
        render();
      })
    );
    root.querySelectorAll("[data-step]").forEach((b) =>
      b.addEventListener("change", () => {
        const st = load();
        if (b.checked) st.done[b.dataset.step] = true;
        else delete st.done[b.dataset.step];
        api.store(KEY).set(st);
        render();
      })
    );
    const r = root.querySelector("#st-reset");
    if (r)
      r.addEventListener("click", () => {
        const st = load();
        Object.keys(st.done).forEach((k) => k.startsWith(st.path + ":") && delete st.done[k]);
        api.store(KEY).set(st);
        render();
      });
  }

  function injectStyle() {
    if (document.getElementById("studio-start")) return;
    const st = document.createElement("style");
    st.id = "studio-start";
    st.textContent = `
.st, .st * { box-sizing: border-box; }
.st { max-width: 100%; overflow-wrap: anywhere; }
.st .g { font-family: var(--mono); font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--saffron); margin: 16px 0 6px; }
.st-counts { margin: 8px 0 0; }
.st-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 210px), 1fr)); gap: 8px; }
.st-card { border: 2px solid var(--ink); background: white; padding: 8px 10px; min-width: 0; }
.st-card h3 { font-family: var(--serif); font-weight: 500; font-size: 17px; margin: 0 0 2px; }
.st-card .cap { margin: 0 0 6px; }
.st-link { margin-top: 8px; border-color: var(--saffron); background: #fff3e6; }
.st-links { display: flex; flex-wrap: wrap; gap: 4px; }
.st-open { font-family: var(--mono); font-size: 11px; border: 1px solid var(--ink); background: var(--panel); padding: 3px 6px; cursor: pointer; }
.st-open:hover { background: var(--ink); color: var(--paper); }
.st-paths { margin: 4px 0 8px; }
.st-steps { padding-left: 22px; margin: 6px 0; }
.st-steps li { margin: 0 0 6px; display: flex; flex-wrap: wrap; gap: 6px; align-items: baseline; justify-content: space-between; }
.st-steps li label { flex: 1 1 220px; font-size: 14px; cursor: pointer; }
.st-steps li.done span { text-decoration: line-through; color: #7a6f63; }
`;
    document.head.appendChild(st);
  }

  window.CuriosityStudio.register({
    id: "start",
    label: "Start here",
    order: 1,
    maya: "",
    draw(el, studioApi) {
      api = studioApi;
      root = el;
      injectStyle();
      render();
    },
  });
})();
