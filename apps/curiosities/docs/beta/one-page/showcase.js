/* docs/beta/one-page/showcase.js: a sample film, so the one-page app link opens with every panel showing real
   content instead of empty states (Jeremy, 2026-10-02: "a finished mock up of the app as it is").

   Runs once, and only while the browser holds no real work yet (no automation, no renamed film, no
   storyboard scenes). It never touches saved work, and everything it adds can be undone, changed or cleared.
     before the app loads: Screen settings (two inspiration films, three windows, lanes on the timeline,
       two markers, a curiosity taken from each inspiration film);
     after the app loads: one batch in the engine (the film's name, its moments and characters, and
       automation on six lanes), then the film printed to the Storyboard as a flip book.
   Built into the page by showcase-bundle.js. */
(function () {
  const FLAG = "curiosities-showcase-v1";
  /* Untouched: no showcase yet, no automation or renamed film in the engine, no storyboard scenes. A browser
     that only opened the app (the Screen starts a plain film by itself) still counts as untouched. */
  const read = (k) => {
    try {
      return JSON.parse(localStorage.getItem(k));
    } catch (e) {
      return null;
    }
  };
  try {
    if (localStorage.getItem(FLAG)) return;
    const eng = read("curiosities-engine-v1");
    const st = eng && (eng.state || eng);
    if (st && ((st.lanes && Object.keys(st.lanes).length) || (st.name && st.name !== "My film"))) return;
    const sb = read("curiosities-storyboard-v1");
    if (sb && Array.isArray(sb.scenes) && sb.scenes.length) return;
    localStorage.setItem(FLAG, "pending");
    const prefs = read("curiosities-screen-v1") || {};
    localStorage.setItem(
      "curiosities-screen-v1",
      JSON.stringify(
        Object.assign(prefs, {
          view: "screen",
          insp: [
            { id: "v1", film: "model-kitchen-disaster", takes: { comedyDevice: 1 } },
            { id: "v2", film: "model-diner-standoff", takes: { cutRate: 1 } },
          ],
          sel: { level: "curiosity", id: "emotion" },
          cat: "performance",
          lanes: ["emotionIntensity", "shotSize", "volume", "angleHeight"],
        })
      )
    );
    const tools = read("curiosities-screen-tools-v1") || {};
    if (!Array.isArray(tools.markers) || !tools.markers.length) tools.markers = ["r3", "r6"];
    localStorage.setItem("curiosities-screen-tools-v1", JSON.stringify(tools));
  } catch (e) {
    return;
  }

  /* The sample film: a short comedy scene in eight moments. */
  const MOMENTS = [
    "June walks into the bakery with the order slip",
    "Ray brings out the cake",
    "June reads the cake: the wrong name",
    "Ray insists it is right",
    "They argue, louder and louder",
    "The cake slides off the counter",
    "Both stare at the floor",
    "They laugh, and June buys two forks",
  ];
  const EMOTION = ["curious", "curious", "absurd", "anxious", "angry", "fearful", "melancholy", "joyful"];
  /* Each lane as positions on its own scale, 0 (low end) to 1 (high end), one per moment. */
  const LANES = [
    ["master", "emotionIntensity", [0.25, 0.3, 0.5, 0.65, 0.9, 1, 0.35, 0.7]],
    ["camera", "shotSize", [1, 0.65, 0.2, 0.5, 0.3, 0, 1, 0.6]],
    ["camera", "angleHeight", [0.5, 0.5, 0.3, 0.7, 0.5, 1, 0.9, 0.5]],
    ["char1", "volume", [0.3, 0.3, 0.6, 0.7, 1, 0.6, 0, 0.8]],
    ["char2", "volume", [0.2, 0.5, 0.4, 0.9, 1, 0.5, 0, 0.8]],
  ];

  function fill() {
    const E = window.CurioEngine;
    const S = window.CurioScale;
    if (!E || !S) return true;
    const st = E.state();
    if (!st.rows.length) return false;
    const has = (t, c) => st.tracks.some((x) => x.id === t && x.curiosities.includes(c));
    const cmds = [{ type: "rename", name: "The Wrong Cake (sample film)" }];
    st.rows.forEach((r, i) => MOMENTS[i] && cmds.push({ type: "renameRow", row: r.id, label: MOMENTS[i] }));
    [["char1", "June"], ["char2", "Ray"]].forEach(([t, label]) => st.tracks.some((x) => x.id === t) && cmds.push({ type: "renameTrack", track: t, label }));
    if (has("master", "emotion")) st.rows.forEach((r, i) => EMOTION[i] && cmds.push({ type: "setPoint", row: r.id, track: "master", curiosity: "emotion", value: EMOTION[i] }));
    LANES.forEach(([t, c, ps]) => has(t, c) && st.rows.forEach((r, i) => ps[i] != null && cmds.push({ type: "setPoint", row: r.id, track: t, curiosity: c, value: S.at(c, ps[i]) })));
    const r = E.send({ type: "batch", label: "Load the sample film", commands: cmds });
    if (r.ok && has("char2", "volume")) E.send({ type: "laneMode", track: "char2", curiosity: "volume", mode: "hold" });
    try {
      if (window.CurioHost && window.CuriosityStoryboard) window.CurioHost.storyboard(window.CuriosityStoryboard).print(E.state(), E.result());
    } catch (e) {}
    try {
      localStorage.setItem(FLAG, "done");
    } catch (e) {}
    return true;
  }
  let tries = 0;
  function wait() {
    if (fill() || ++tries > 50) return;
    setTimeout(wait, 100);
  }
  window.addEventListener("load", () => setTimeout(wait, 50));
})();
