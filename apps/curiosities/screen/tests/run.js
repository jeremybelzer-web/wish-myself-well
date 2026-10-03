/* The Screen's core in Node, with no page: node apps/curiosities/screen/tests/run.js
   Loads the app's core and the engine core (engine/tests/load.js), then screen/levels.js, screen/frame.js and
   screen/lanes.js, and checks the four levels, the categories, the frame and the node groups. */
const path = require("path");
const fs = require("fs");
const vm = require("vm");
const load = require(path.join(__dirname, "..", "..", "engine", "tests", "load.js"));
const core = load();
const w = core.window;
["../data/db-editing.js", "levels.js", "frame.js", "lanes.js"].forEach((f) => {
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
const total = L.CATEGORIES.reduce((a, c) => a + L.curiosities(c.id).filter((x) => L.categoryOf(x.id) === c.id).length, 0);
ok(total === DB.data.curiosities.length, "the categories hold every curiosity once in its home category (" + total + ")");
ok(L.curiosities("feeling").some((x) => x.id === "moodEffect") && L.curiosities("text").some((x) => x.id === "moodEffect"), "Mood stickers on faces show under Text and under Feeling");
ok(L.items("proximity", "feeling").filter((p) => /^face-/.test(p.id)).length === 8 && L.items("proximitySuite", "feeling").some((p) => p.id === "mood-moves-the-feeling"), "Body Mood effects feed the Emotion curiosities, both ways");

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

/* The editing curiosities from Final Cut Pro and CapCut (data/db-editing.js). */
const edit = DB.data.curiosities.filter((c) => c.source === "Final Cut Pro and CapCut");
ok(edit.length >= 30 && edit.every((c) => c.momentum && c.sliders.length >= 4), "the editing curiosities load, each with a momentum note and its sliders (" + edit.length + ")");
ok(["transitions", "grade", "text", "speed"].every((id) => L.curiosities(id).length >= 3), "the new CapCut categories (Transitions, Filters, Text, Speed) have curiosities");
ok(DB.check().length === 0, "the database check finds no problems with them" + (DB.check().length ? ": " + DB.check().slice(0, 6).join("; ") : ""));
const adv = DB.data.curiosities.filter((c) => (c.tags || []).includes("advanced"));
ok(adv.length >= 8 && adv.every((c) => c.source === "Final Cut Pro" && c.momentum), "Final Cut Pro's own curiosities load, tagged advanced (" + adv.length + ")");
ok(["suites", "proximities"].every((k) => DB.data[k].some((x) => (x.tags || []).includes("advanced"))), "an advanced suite and advanced proximities load");
const ed = w.CurioFrame.svg({ transitionKind: "wipe", filterLook: "night", onScreenText: "title card", clipSpeed: "fast" }, { highlight: ["transitions"] });
ok(["transitions", "grade", "text", "speed"].every((c) => ed.includes(`data-cat="${c}"`)) && /data-cat="grade" opacity="0.18"/.test(ed), "the frame draws transitions, filters, text and speed, and dims them by category");

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

/* CapCut's linkage (~) off: a node moves alone and its line stretches. The magnet (P): later nodes come along. */
const k3 = r[3].id + "@camera|shotSize";
const solo = w.CurioLanes.shiftCommands(E.state(), k3, -1, false, { solo: true });
ok(E.send({ type: "batch", commands: solo.cmds }).ok, "a node can move alone with linkage off");
const s2 = E.state();
const ln2 = s2.links.find((l) => l.to.curiosity === "emotion" && l.scope);
ok(s2.lanes["camera|shotSize"].points[r[2].id] === "close" && s2.lanes["master|emotion"].points[r[5].id] === "angry" && ln2.scope.from === r[2].id && ln2.scope.to === r[5].id && ln2.within === 3, "its partner stays put and the line stretches");
E.undo();
E.send({ type: "setPoint", row: r[6].id, track: "camera", curiosity: "shotSize", value: "wide" });
const rip = w.CurioLanes.shiftCommands(E.state(), k3, 1, false, { solo: true, ripple: true });
ok(E.send({ type: "batch", commands: rip.cmds }).ok, "the magnet moves later nodes too");
const s3 = E.state().lanes["camera|shotSize"].points;
ok(s3[r[4].id] === "close" && s3[r[7].id] === "wide" && s3[r[6].id] == null, "every later node in the lane slid along by the same amount");
E.undo();
/* Linkage settings (CapCut's box of kinds): with the emotion curiosity's kind unticked, its node stays behind and its line stretches. */
const emoCat = w.CurioLevels.categoryOf("emotion");
const noFeel = (k) => w.CurioLevels.categoryOf(k.slice(k.indexOf("|") + 1)) !== emoCat;
ok(w.CurioLanes.group(k3, E.state(), noFeel).nodes.length === 1 && w.CurioLanes.group(k3, E.state()).nodes.length === 2, "linkage settings leave unticked kinds out of the group");
const kinded = w.CurioLanes.shiftCommands(E.state(), k3, 1, false, { allow: noFeel });
ok(E.send({ type: "batch", commands: kinded.cmds }).ok && E.state().lanes["master|emotion"].points[r[5].id] === "angry" && E.state().lanes["camera|shotSize"].points[r[4].id] === "close", "the grabbed node moves and the unticked partner stays put");
E.undo();
const cpk = w.CurioLanes.copyGroup(k3, { allow: noFeel });
ok(cpk.ok && cpk.nodes === 1 && cpk.links === 0, "copy leaves unticked kinds behind too");
ok(typeof w.CurioLanes.tools === "function" && w.CurioLanes.tools().linkage === true, "linkage starts on, as in CapCut");

/* The area tools: Reverse, Flip, Stretch and Squeeze, each one batch. */
{
  const CL = w.CurioLanes;
  const Sc = w.CurioScale;
  E.reset(w.CurioSeeds.starter());
  const rr = E.state().rows;
  const opts = Sc.domain("shotSize").options;
  const lanesA = [{ track: "camera", cur: "shotSize", lk: "camera|shotSize" }, { track: "master", cur: "emotion", lk: "master|emotion" }];
  const pt = (j, v, t, c) => ({ type: "setPoint", row: rr[j].id, track: t || "camera", curiosity: c || "shotSize", value: v });
  E.send({ type: "batch", commands: [pt(1, opts[0]), pt(2, opts[1]), pt(4, opts[2]), pt(6, opts[opts.length - 1])] });
  const P = () => E.state().lanes["camera|shotSize"].points;
  const ar = { i0: 0, i1: 1, j0: 1, j1: 4 };
  const rev = CL.reverseAreaCommands(E.state(), lanesA, ar);
  ok(rev.nodes === 3 && E.send({ type: "batch", label: "Reverse", commands: rev.cmds }).ok, "Reverse makes one batch for the area's nodes");
  ok(P()[rr[4].id] === opts[0] && P()[rr[3].id] === opts[1] && P()[rr[1].id] === opts[2] && P()[rr[2].id] == null && P()[rr[6].id] === opts[opts.length - 1], "Reverse mirrors the nodes in time inside the area and leaves the rest alone");
  E.undo();
  ok(P()[rr[1].id] === opts[0] && P()[rr[4].id] === opts[2], "one undo takes Reverse back");
  const fl = CL.flipAreaCommands(E.state(), lanesA, ar);
  ok(E.send({ type: "batch", commands: fl.cmds }).ok && P()[rr[1].id] === opts[opts.length - 1] && P()[rr[2].id] === opts[opts.length - 2] && P()[rr[6].id] === opts[opts.length - 1], "Flip mirrors each node's setting on its own scale (low becomes high)");
  ok(Math.abs(Sc.pos("shotSize", P()[rr[4].id]) - (1 - Sc.pos("shotSize", opts[2]))) < 1e-9, "Flip turns position p into 1 - p");
  E.undo();
  const stt = CL.stretchAreaCommands(E.state(), lanesA, ar, 2);
  ok(E.send({ type: "batch", commands: stt.cmds }).ok && P()[rr[1].id] === opts[0] && P()[rr[3].id] === opts[1] && P()[rr[7].id] === opts[2] && P()[rr[6].id] == null && P()[rr[2].id] == null, "Stretch ×2 spreads the nodes from the area's first moment, replacing what was in the way");
  ok(stt.area.j0 === 1 && stt.area.j1 === 7, "Stretch gives back the stretched area");
  E.undo();
  const sq = CL.stretchAreaCommands(E.state(), lanesA, ar, 0.5);
  /* (2-1)*.5 rounds to 1 -> moment 2 and (4-1)*.5 rounds to 2 -> moment 3; moment 1 stays. */
  ok(E.send({ type: "batch", commands: sq.cmds }).ok && P()[rr[1].id] === opts[0] && P()[rr[2].id] === opts[1] && P()[rr[3].id] === opts[2] && P()[rr[4].id] == null && sq.area.j1 === 3, "Squeeze ½ pulls the nodes together");
  E.undo();
  const last = rr.length - 1;
  E.send({ type: "batch", commands: [pt(last - 1, opts[1]), pt(last, opts[2])] });
  const end = CL.stretchAreaCommands(E.state(), lanesA, { i0: 0, i1: 0, j0: last - 2, j1: last }, 2);
  ok(E.send({ type: "batch", commands: end.cmds }).ok && P()[rr[last].id] === opts[2] && end.nodes === 1, "Stretch clamps at the film's end and keeps the later node when two land together");
  E.undo();
  /* A join follows its nodes when they are reversed. */
  E.send(pt(3, "angry", "master", "emotion"));
  E.send(CL.linkCommand(E.state(), { row: rr[2].id, track: "camera", cur: "shotSize" }, { row: rr[3].id, track: "master", cur: "emotion" }));
  const lid = E.state().links[E.state().links.length - 1].id;
  ok(E.send({ type: "batch", commands: CL.reverseAreaCommands(E.state(), lanesA, ar).cmds }).ok, "Reverse with a join is one step");
  const lj = E.state().links.find((l) => l.id === lid);
  ok(lj && lj.scope.from === rr[3].id && lj.scope.to === rr[2].id && E.state().lanes["master|emotion"].points[rr[2].id] === "angry", "the join moves with its reversed nodes");
}

/* Markers: an old save (a plain list of row ids) becomes markers with a color and a note. */
{
  const mm = w.CurioLanes.migrateMarkers;
  const old = mm(["r3", "r6", "r3"]);
  ok(old.length === 2 && old.every((m) => m.color === "orange" && m.note === "") && old[0].row === "r3" && old[1].row === "r6", "an old list of row ids becomes orange markers with no note, duplicates dropped");
  const mixed = mm([{ row: "r1", color: "blue", note: "  the joke lands  " }, { row: "r2", color: "pink" }, "r4", null, { color: "red" }, { row: "r1", color: "red" }]);
  ok(mixed.length === 3 && mixed[0].color === "blue" && mixed[0].note === "the joke lands" && mixed[1].color === "orange" && mixed[2].row === "r4", "new markers keep their color and trimmed note; unknown colors turn orange; broken entries are dropped");
  ok(mm([{ row: "r1", note: "x".repeat(200) }])[0].note.length === 80 && mm(null).length === 0 && mm("r1").length === 0, "notes are cut to 80 letters; nothing saved means no markers");
  ok(w.CurioLanes.MARK_COLORS.length === 6 && w.CurioLanes.MARK_COLORS.every((c) => /^#[0-9a-f]{6}$/.test(c[2])), "six marker colors, like CapCut's");
  ok(Array.isArray(w.CurioLanes.tools().markers), "the tools keep markers as a list");
}

console.log(fails ? fails + " failed" : "all passed");
process.exit(fails ? 1 : 0);
