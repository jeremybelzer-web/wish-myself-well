/* The Screen's core in Node, with no page: node apps/curiosities/screen/tests/run.js
   Loads the app's core and the engine core (engine/tests/load.js), then screen/levels.js, screen/frame.js and
   screen/lanes.js, and checks the four levels, the categories, the frame and the node groups. */
const path = require("path");
const fs = require("fs");
const vm = require("vm");
const load = require(path.join(__dirname, "..", "..", "engine", "tests", "load.js"));
const core = load();
const w = core.window;
["levels.js", "frame.js", "lanes.js"].forEach((f) => {
  const code = fs.readFileSync(path.join(__dirname, "..", f), "utf8");
  vm.runInContext(code, core.context || vm.createContext(w), { filename: f });
});
let fails = 0;
const ok = (c, m) => {
  console.log((c ? "ok   " : "FAIL ") + m);
  if (!c) fails++;
};
const L = w.CurioLevels;
const DB = w.CuriosityDB;
ok(!!L && !!w.CurioFrame && !!w.CurioLanes, "the Screen core loads with no page");

/* Every workspace in the database belongs to exactly one category. */
const ws = DB.data.workspaces.map((x) => x.id);
const inCats = [].concat(...L.CATEGORIES.map((c) => c.workspaces));
ok(ws.every((id) => inCats.filter((x) => x === id).length === 1), "every workspace sits in exactly one of the " + L.CATEGORIES.length + " categories");
ok(L.CATEGORIES.every((c) => [1, 2, 3].includes(c.windows)), "every category opens with one, two or three windows");
const total = L.CATEGORIES.reduce((a, c) => a + L.curiosities(c.id).length, 0);
ok(total === DB.data.curiosities.length, "the categories hold every curiosity once (" + total + ")");

/* The four levels resolve to curiosities to look at. */
for (const lv of ["curiosity", "suite", "proximity", "proximitySuite"]) {
  const items = L.items(lv);
  const bad = items.filter((it) => !L.resolve(lv, it.id).curiosities.length);
  ok(items.length > 0 && bad.length <= items.length * 0.05, `${lv}: ${items.length} items, ${bad.length} resolve to nothing`);
}
const scenes = DB.data.scenes;
let fired = 0;
L.items("proximity").forEach((p) => scenes.forEach((s) => (fired += L.fires("proximity", p.id, s.beats).length)));
ok(fired > 0, "proximities are found firing in the model scenes (" + fired + ")");
ok(L.fires("curiosity", "shotSize", scenes[0].beats).length > 1, "a curiosity is found where it changes");
ok(L.control({ scale: ["off", "on"] }) === "toggle" && L.control({ scale: ["a", "b", "c"], unordered: true }) === "choice" && L.control({ range: { min: 0, max: 5 } }) === "knob" && L.control({ range: { min: 0, max: 100 } }) === "slider", "each slider gets a fitting control");

/* The frame. */
const svg = w.CurioFrame.svg(scenes[0].beats[0].values, { highlight: ["camera"], labels: [["Shot size", "wide"]] });
ok(/^<svg[\s\S]*<\/svg>$/.test(svg) && svg.includes('opacity="0.18"') && svg.includes("Shot size"), "a frame draws, dims other categories and writes the overlay");
const only = w.CurioFrame.svg(scenes[0].beats[0].values, { highlight: ["sound"], only: true });
ok(only.includes('display="none"'), "Lens only hides the other categories");

/* Node groups: join two nodes, move one, copy and paste. */
const E = w.CurioEngine;
E.reset(w.CurioSeeds.starter());
const st = E.state();
const r = st.rows;
E.send({ type: "batch", commands: [{ type: "setPoint", row: r[1].id, track: "camera", curiosity: "shotSize", value: "close" }, { type: "setPoint", row: r[3].id, track: "master", curiosity: "emotion", value: "angry" }] });
const link = w.CurioLanes.linkCommand(E.state(), { row: r[3].id, track: "master", cur: "emotion" }, { row: r[1].id, track: "camera", cur: "shotSize" });
ok(link.from.curiosity === "shotSize" && link.within === 2 && link.scope.from === r[1].id, "a join always leads from the earlier node");
ok(E.send(link).ok, "the engine takes the join as a link");
const key = r[1].id + "@camera|shotSize";
ok(w.CurioLanes.group(key).nodes.length === 2, "the two nodes are one group");
const sh = w.CurioLanes.shiftCommands(E.state(), key, 2, false);
ok(E.send({ type: "batch", commands: sh.cmds }).ok, "moving the group is one step");
const after = E.state();
ok(after.lanes["camera|shotSize"].points[r[3].id] === "close" && after.lanes["master|emotion"].points[r[5].id] === "angry" && after.links[after.links.length - 1].scope.from === r[3].id, "both nodes and the line moved together");
ok(E.send({ type: "batch", commands: w.CurioLanes.shiftCommands(E.state(), key, 9, false).cmds || [] }).ok === false || !!w.CurioLanes.shiftCommands(E.state(), r[3].id + "@camera|shotSize", 9, false).error, "a move off the end of the film is refused");
const cp = w.CurioLanes.copyGroup(r[3].id + "@camera|shotSize");
ok(cp.ok && cp.nodes === 2 && cp.links === 1, "copy takes the pair");
const n0 = E.state().links.length;
const pa = w.CurioLanes.paste(0);
ok(pa.ok && E.state().links.length === n0 + 1 && E.state().lanes["camera|shotSize"].points[r[0].id] === "close", "paste puts the pair and its line at another moment");
E.undo();
ok(E.state().links.length === n0, "undo takes the paste back");

console.log(fails ? fails + " failed" : "all passed");
process.exit(fails ? 1 : 0);
