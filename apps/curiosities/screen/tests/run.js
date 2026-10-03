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

/* Freeze and Shape on a selected area: each one batch, one undo step; a locked lane comes in with lk: null. */
{
  const CL = w.CurioLanes;
  const Sc = w.CurioScale;
  E.reset(w.CurioSeeds.starter());
  const rr = E.state().rows;
  const o = Sc.domain("shotSize").options;
  const top = o.length - 1;
  const lanesA = [{ track: "camera", cur: "shotSize", lk: "camera|shotSize" }, { track: "master", cur: "emotion", lk: "master|emotion" }];
  const pt = (j, v, t, c) => ({ type: "setPoint", row: rr[j].id, track: t || "camera", curiosity: c || "shotSize", value: v });
  E.send({ type: "batch", commands: [pt(0, o[0]), pt(2, o[3]), pt(4, o[1]), pt(7, o[top])] });
  E.send({ type: "laneMode", track: "camera", curiosity: "shotSize", mode: "ramp" });
  const P = () => E.state().lanes["camera|shotSize"].points;
  const film = () => JSON.stringify([E.state().lanes, E.state().links]);
  const before = film();
  /* Freeze moments 2 to 6: moment 2 glides halfway from o[0] to o[3]. */
  const held = Sc.at("shotSize", (Sc.pos("shotSize", o[0]) + Sc.pos("shotSize", o[3])) / 2);
  const fz = CL.freezeAreaCommands(E.state(), lanesA, { i0: 0, i1: 1, j0: 1, j1: 5 });
  ok(fz.lanes === 1 && fz.nodes === 2 && E.send({ type: "batch", label: "Freeze", commands: fz.cmds }).ok, "Freeze makes one batch for the lanes with nodes (a lane with none is left alone)");
  ok(P()[rr[1].id] === held && P()[rr[5].id] === held && P()[rr[2].id] == null && P()[rr[4].id] == null && P()[rr[0].id] === o[0] && P()[rr[7].id] === o[top], "Freeze holds the first moment's setting at both ends and clears the nodes between (" + held + ")");
  ok([1, 2, 3, 4, 5].every((j) => E.value(rr[j].id, "camera", "shotSize") === held), "nothing drifts inside a frozen stretch");
  E.undo();
  ok(film() === before, "one undo takes Freeze back");
  ok(CL.freezeAreaCommands(E.state(), [{ track: "camera", cur: "shotSize", lk: null }], { i0: 0, i1: 0, j0: 1, j1: 5 }).nodes === 0, "Freeze leaves a locked lane alone");
  /* A join to a node Freeze clears is removed with it. */
  E.send(pt(3, "angry", "master", "emotion"));
  E.send(CL.linkCommand(E.state(), { row: rr[2].id, track: "camera", cur: "shotSize" }, { row: rr[3].id, track: "master", cur: "emotion" }));
  const nLinks = E.state().links.length;
  ok(E.send({ type: "batch", commands: CL.freezeAreaCommands(E.state(), lanesA.slice(0, 1), { i0: 0, i1: 0, j0: 1, j1: 5 }).cmds }).ok && E.state().links.length === nLinks - 1, "Freeze removes a join whose node it clears");
  E.undo();
  E.undo();
  E.undo();
  ok(film() === before, "back to the start");
  /* Shape: every preset over moments 1 to 7 (o[0] at moment 1 is the lowest; the lane glides up toward o[top] at moment 8, outside). */
  const ar = { i0: 0, i1: 1, j0: 0, j1: 6 };
  /* What plays at each moment, as a place on the scale (0 lowest, 1 highest). */
  const series = () => [0, 1, 2, 3, 4, 5, 6].map((j) => Sc.pos("shotSize", E.value(rr[j].id, "camera", "shotSize")));
  const nodesIn = () => [0, 1, 2, 3, 4, 5, 6].filter((j) => P()[rr[j].id] != null).length;
  let jumpNodes = 0;
  const lo = 0;
  const hiV = Math.max(...[0, 1, 2, 3, 4, 5, 6].map((j) => Sc.pos("shotSize", E.value(rr[j].id, "camera", "shotSize"))));
  ok(Object.keys(CL.PRESETS).join() === "easeIn,easeOut,riseFall,pulse,holdJump,build", "six shapes: Ease in, Ease out, Rise and fall, Pulse, Hold then jump, Build");
  const got = {};
  Object.keys(CL.PRESETS).forEach((k) => {
    const r = CL.shapeAreaCommands(E.state(), lanesA, ar, k);
    const sent = E.send({ type: "batch", label: "Shape", commands: r.cmds });
    got[k] = series();
    if (k === "holdJump") jumpNodes = nodesIn();
    ok(sent.ok && r.lanes === 1 && P()[rr[7].id] === o[top], CL.PRESETS[k][0] + " is one batch and leaves the nodes outside the selection alone");
    E.undo();
    ok(film() === before, "one undo takes " + CL.PRESETS[k][0] + " back");
  });
  const near = (a, b) => a != null && Math.abs(a - b) < 0.2;
  const ei = got.easeIn;
  ok(near(ei[0], lo) && near(ei[6], hiV) && ei.every((x, i) => !i || x >= ei[i - 1] - 1e-9) && ei[1] - ei[0] <= ei[6] - ei[5] + 1e-9, "Ease in rises from the lane's lowest to its highest, slowly first (" + ei.map((x) => x.toFixed(2)).join(" ") + ")");
  ok(near(got.easeOut[0], lo) && near(got.easeOut[6], hiV) && got.easeOut[1] - got.easeOut[0] > 0.1, "Ease out rises fast first");
  ok(near(got.riseFall[0], lo) && near(got.riseFall[6], lo) && near(got.riseFall[3], hiV), "Rise and fall peaks in the middle and comes back down (" + got.riseFall.map((x) => x.toFixed(2)).join(" ") + ", top " + hiV.toFixed(2) + ")");
  ok(near(got.pulse[0], lo) && near(got.pulse[6], lo) && near(got.pulse[3], hiV) && near(got.pulse[2], lo) && near(got.pulse[4], lo), "Pulse flashes high in the middle moment only");
  ok(jumpNodes === 3 && got.holdJump[5] === got.holdJump[0] && near(got.holdJump[6], hiV), "Hold then jump: flat, then the change on the last moment (nodes only where it bends)");
  ok(new Set(got.build.map((x) => x.toFixed(3))).size >= 3 && got.build.every((x, i, a) => !i || x >= a[i - 1] - 1e-9), "Build climbs in steps");
  /* A lane that falls over the selection eases downward instead. */
  E.send({ type: "batch", commands: [pt(0, o[top]), pt(2, o[top]), pt(4, o[1]), pt(6, o[0])] });
  const down = CL.shapeAreaCommands(E.state(), lanesA, ar, "easeIn");
  E.send({ type: "batch", commands: down.cmds });
  ok(P()[rr[0].id] === o[top] && P()[rr[6].id] === o[0], "Ease in on a falling lane goes from its highest down to its lowest");
  E.undo();
  E.undo();
  /* A lane that stays at one setting has nothing to shape; one moment is too short; a locked lane is skipped. */
  E.send({ type: "batch", commands: [pt(2, "angry", "master", "emotion"), pt(3, "angry", "master", "emotion")] });
  const flat = CL.shapeAreaCommands(E.state(), lanesA, ar, "pulse");
  ok(flat.lanes === 1 && flat.flat === 1, "a lane held at one setting is counted as flat and left alone");
  ok(!!CL.shapeAreaCommands(E.state(), lanesA, { i0: 0, i1: 1, j0: 3, j1: 3 }, "easeIn").error && !!CL.shapeAreaCommands(E.state(), lanesA, ar, "wobble").error, "one moment, or an unknown shape, gives a plain error");
  ok(CL.shapeAreaCommands(E.state(), [{ track: "camera", cur: "shotSize", lk: null }, null], ar, "easeIn").lanes === 0, "Shape leaves a locked lane alone");
  ok(CL.shapeAreaCommands(E.state(), lanesA, ar, "riseFall").cmds.filter((c) => c.type === "setPoint").every((c) => rr.some((r, j) => r.id === c.row && j >= 0 && j <= 6)), "Shape writes nodes on whole moments inside the selection only");
}

/* Suite clips: a selected area kept under a name, dropped in again at the playhead (one batch), as it is or as an analogy. */
{
  const CL = w.CurioLanes;
  const Sc = w.CurioScale;
  E.reset(w.CurioSeeds.starter());
  const rr = E.state().rows;
  const o = Sc.domain("shotSize").options;
  const lanesA = [{ track: "camera", cur: "shotSize", lk: "camera|shotSize" }, { track: null, cur: "notOnATrack", lk: null }, { track: "master", cur: "emotion", lk: "master|emotion" }];
  const pt = (j, v, t, c) => ({ type: "setPoint", row: rr[j].id, track: t || "camera", curiosity: c || "shotSize", value: v });
  E.send({ type: "batch", commands: [pt(1, o[1]), pt(3, o[3]), pt(2, "angry", "master", "emotion")] });
  E.send(CL.linkCommand(E.state(), { row: rr[1].id, track: "camera", cur: "shotSize" }, { row: rr[2].id, track: "master", cur: "emotion" }));
  const raw = CL.copyArea(E.state(), lanesA, { i0: 0, i1: 2, j0: 1, j1: 3 });
  const c = CL.suiteClip(raw, "  the slow reveal  ");
  ok(c && c.name === "the slow reveal" && c.span === 2 && c.lanes.length === 2 && c.curiosities.join() === "shotSize,emotion" && /^sc-/.test(c.id) && !isNaN(Date.parse(c.made)), "a suite clip keeps the selection's lanes under a trimmed name (a lane not on a track is left out)");
  ok(c.links.length === 1 && c.links[0].from.lane === 0 && c.links[0].to.lane === 1, "its join is kept and points at the right lanes after the empty lane is left out");
  ok(CL.suiteClip({ span: 1, lanes: [null] }, "x") === null && CL.suiteClip(raw, "").name === "Suite clip", "nothing to keep gives no clip; no name gives a plain one");
  ok(/^3 moments long · Shot size, /.test(CL.suiteClipSummary(c)) && !/shotSize/.test(CL.suiteClipSummary(c)), "the list shows how many moments long and the curiosities in plain labels (" + CL.suiteClipSummary(c) + ")");
  const mig = CL.migrateSuiteClips([c, null, { id: "x" }, c, JSON.parse(JSON.stringify(c))]);
  ok(mig.length === 1 && mig[0].id === c.id && CL.migrateSuiteClips("junk").length === 0, "saved clips load cleaned: broken and repeated ones are dropped");
  ok(CL.SUITE_KEY === "curiosities-suite-clips-v1" && Array.isArray(CL.suiteClips()), "suite clips are kept in curiosities-suite-clips-v1");
  /* Drop at moment 4 (the starter film has 8): one batch, values as saved, the join comes along. */
  const before = JSON.stringify([E.state().lanes, E.state().links]);
  const shown = [{ cur: "shotSize", track: "camera" }, { cur: "emotion", track: "master" }];
  const d = CL.dropSuiteClipCommands(E.state(), c, 4, { shown });
  const nl = E.state().links.length;
  ok(!d.error && d.start === 4 && !d.moved && d.lanes.join() === "shotSize,emotion" && d.hidden.length === 0 && E.send({ type: "batch", label: "Drop", commands: d.cmds }).ok, "dropping a suite clip is one batch onto the matching lanes");
  const P = () => E.state().lanes["camera|shotSize"].points;
  ok(P()[rr[4].id] === o[1] && P()[rr[6].id] === o[3] && E.state().lanes["master|emotion"].points[rr[5].id] === "angry" && E.state().links.length === nl + 1, "the nodes land in the same places from the playhead and the join comes along");
  E.undo();
  ok(JSON.stringify([E.state().lanes, E.state().links]) === before, "one undo takes the drop back");
  /* Too near the end: it moves earlier to fit; longer than the film: a plain error. */
  const end = CL.dropSuiteClipCommands(E.state(), c, rr.length - 1, { shown });
  ok(end.start === rr.length - 3 && end.moved, "dropped at the last moment, it starts earlier so it fits");
  ok(/moments long, and your film has only/.test(CL.dropSuiteClipCommands(E.state(), Object.assign({}, c, { span: rr.length + 2 }), 0, { shown }).error), "a clip longer than the film says so");
  /* A curiosity the timeline doesn't show still goes into the film (on its track); one not on any track is added. */
  const hid = CL.dropSuiteClipCommands(E.state(), c, 0, { shown: shown.slice(0, 1) });
  ok(hid.hidden.join() === "emotion" && hid.lanes.includes("emotion"), "a curiosity the timeline doesn't show is still dropped, and named");
  const fresh = Object.assign(JSON.parse(JSON.stringify(c)), { lanes: [Object.assign({}, c.lanes[0], { cur: "transitionKind", track: "camera", points: [{ at: 0, value: Sc.at("transitionKind", 0) }] })], links: [], curiosities: ["transitionKind"] });
  const add = CL.dropSuiteClipCommands(E.state(), fresh, 0, { shown });
  ok(!add.error && add.cmds.some((x) => x.type === "addCuriosity" && x.curiosity === "transitionKind") && add.hidden.join() === "transitionKind", "a curiosity not in the film yet is put on a track first (" + (add.error || add.cmds.map((x) => x.type).join(",")) + ")");
  /* Analogy: shot size starts from what the film plays at the playhead and keeps its moves, step for step. */
  E.send(pt(5, o[0]));
  const startHere = E.value(rr[5].id, "camera", "shotSize");
  const an = CL.dropSuiteClipCommands(E.state(), c, 5, { shown, analogy: true });
  const m = an.moves.find((x) => x.cur === "shotSize");
  const step = (v) => Math.round(Sc.pos("shotSize", v) * Sc.steps("shotSize"));
  ok(!an.error && m && m.to === startHere && m.steps === step(startHere) - step(o[1]), "as an analogy each lane starts from its own setting at the playhead (" + o[1] + " becomes " + m.to + ")");
  E.send({ type: "batch", commands: an.cmds });
  ok(step(P()[rr[7].id]) - step(P()[rr[5].id]) === step(o[3]) - step(o[1]), "and makes the same moves up its scale");
  const lnk = E.state().links[E.state().links.length - 1];
  ok(lnk.from.is === P()[rr[5].id], "the join's cause moves with its node");
  E.undo();
  const top = CL.analogyClip(c, [o[o.length - 1], null]);
  ok(top.moves[0].clamped && top.clip.lanes[0].points.every((p) => Sc.fix("shotSize", p.value) != null) && top.moves[1].kept && top.clip.lanes[1].points[0].value === c.lanes[1].points[0].value, "a move past the top of the scale stops there; a lane with no setting keeps the clip's values");
  /* A locked lane is skipped. */
  CL.tools().locks = Object.assign({}, CL.tools().locks, { "master|emotion": true });
  const lk = CL.dropSuiteClipCommands(E.state(), c, 0, { shown });
  ok(lk.locked.join() === "emotion" && lk.lanes.join() === "shotSize" && !lk.cmds.some((x) => x.curiosity === "emotion"), "a locked lane is skipped and named");
  delete CL.tools().locks["master|emotion"];
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

/* Dragging a selected area sideways: every node in it moves (or, with Alt, is copied) by whole moments, one batch. */
{
  const CL = w.CurioLanes;
  const Sc = w.CurioScale;
  E.reset(w.CurioSeeds.starter());
  const rr = E.state().rows;
  const o = Sc.domain("shotSize").options;
  const lanesA = [{ track: "camera", cur: "shotSize", lk: "camera|shotSize" }, { track: "master", cur: "emotion", lk: "master|emotion" }];
  const pt = (j, v, t, c) => ({ type: "setPoint", row: rr[j].id, track: t || "camera", curiosity: c || "shotSize", value: v });
  E.send({ type: "batch", commands: [pt(0, o[3]), pt(1, o[0]), pt(2, o[1]), pt(4, o[2]), pt(2, "angry", "master", "emotion"), pt(5, o[o.length - 1])] });
  E.send(CL.linkCommand(E.state(), { row: rr[1].id, track: "camera", cur: "shotSize" }, { row: rr[2].id, track: "master", cur: "emotion" }));
  E.send(pt(6, "melancholy", "master", "emotion"));
  E.send(CL.linkCommand(E.state(), { row: rr[2].id, track: "camera", cur: "shotSize" }, { row: rr[6].id, track: "master", cur: "emotion" }));
  const film = () => JSON.stringify([E.state().lanes, E.state().links]);
  const before = film();
  const P = () => E.state().lanes["camera|shotSize"].points;
  const M = () => E.state().lanes["master|emotion"].points;
  const ar = { i0: 0, i1: 1, j0: 1, j1: 2 };
  ok(CL.moveAreaCommands(E.state(), lanesA, ar, 0, false).cmds.length === 0, "a move of zero moments changes nothing");
  ok(!!CL.moveAreaCommands(E.state(), lanesA, ar, -2, false).error && !!CL.moveAreaCommands(E.state(), lanesA, ar, rr.length - 2, false).error, "the block cannot leave the film at either end");
  const mv = CL.moveAreaCommands(E.state(), lanesA, ar, 2, false);
  ok(mv.nodes === 3 && mv.replaced === 1 && mv.links === 1 && mv.area.j0 === 3 && mv.area.j1 === 4, "moving two moments later counts 3 nodes, 1 join inside and 1 node written over, and gives the moved area");
  ok(E.send({ type: "batch", label: "Move the selection", commands: mv.cmds }).ok, "the move is one batch");
  ok(P()[rr[3].id] === o[0] && P()[rr[4].id] === o[1] && M()[rr[4].id] === "angry" && P()[rr[1].id] == null && P()[rr[2].id] == null && M()[rr[2].id] == null, "every node in the area moved two moments later and left its old moment");
  ok(P()[rr[0].id] === o[3] && P()[rr[5].id] === o[o.length - 1] && M()[rr[6].id] === "melancholy", "nodes outside the area stay put (the one under the block was replaced)");
  const lk1 = E.state().links.find((l) => l.from.curiosity === "shotSize" && l.to.curiosity === "emotion" && l.scope.to === rr[4].id);
  const lk2 = E.state().links.find((l) => l.scope && l.scope.to === rr[6].id);
  ok(lk1 && lk1.scope.from === rr[3].id && lk1.within === 1, "a join inside the area moves with its nodes");
  ok(lk2 && lk2.scope.from === rr[4].id && lk2.within === 2, "a join to a node outside the area stretches");
  E.undo();
  ok(film() === before, "one undo brings back the exact film, the replaced node too");
  const cp = CL.moveAreaCommands(E.state(), lanesA, ar, 3, true);
  const nl = E.state().links.length;
  ok(E.send({ type: "batch", label: "Copy the selection", commands: cp.cmds }).ok && cp.nodes === 3, "Alt copies the area as one batch");
  ok(P()[rr[1].id] === o[0] && P()[rr[2].id] === o[1] && M()[rr[2].id] === "angry" && P()[rr[4].id] === o[0] && P()[rr[5].id] === o[1] && M()[rr[5].id] === "angry" && M()[rr[4].id] == null, "the originals stay and the copy lands three moments later, replacing what was there");
  ok(E.state().links.length === nl + 1 && E.state().links.some((l) => l.scope && l.scope.from === rr[4].id && l.scope.to === rr[5].id), "the join inside the area is copied with its nodes");
  E.undo();
  ok(film() === before, "one undo takes the copy back");
  /* Moving over its own old place: a one-moment shift overlaps the block with itself. */
  const ov = CL.moveAreaCommands(E.state(), lanesA, ar, -1, false);
  ok(E.send({ type: "batch", commands: ov.cmds }).ok && P()[rr[0].id] === o[0] && P()[rr[1].id] === o[1] && P()[rr[2].id] == null && M()[rr[1].id] === "angry" && E.state().lanes["camera|shotSize"].mode === JSON.parse(before)[0]["camera|shotSize"].mode, "a block can move onto its own old moments");
  E.undo();
  ok(film() === before, "and undo restores it");
}

/* Lane heads: Solo turns every other lane off as one batch and remembers what was on; pressing again restores it. */
{
  const CL = w.CurioLanes;
  E.reset(w.CurioSeeds.starter());
  const rr = E.state().rows;
  const pt = (t, c, v) => ({ type: "setPoint", row: rr[0].id, track: t, curiosity: c, value: v });
  E.send({ type: "batch", commands: [pt("camera", "shotSize", w.CurioScale.domain("shotSize").options[0]), pt("master", "emotion", "angry"), pt("master", "emotionIntensity", 3)] });
  E.send({ type: "laneMode", track: "master", curiosity: "emotionIntensity", on: false });
  const on = () => Object.fromEntries(Object.keys(E.state().lanes).sort().map((k) => [k, E.state().lanes[k].on]));
  const start = JSON.stringify(on());
  ok(!!CL.soloCommands(E.state(), "camera|nope", null).error, "a lane with no nodes cannot be soloed");
  const s1 = CL.soloCommands(E.state(), "camera|shotSize", null);
  ok(!s1.off && s1.cmds.length === 1 && s1.cmds[0].type === "laneMode" && s1.cmds[0].on === false && s1.cmds[0].curiosity === "emotion", "solo turns off only the lanes that were on (" + s1.cmds.length + " command)");
  ok(s1.solo.lk === "camera|shotSize" && s1.solo.was["master|emotionIntensity"] === false && s1.solo.was["master|emotion"] === true, "solo remembers each lane's on or off from before");
  ok(E.send({ type: "batch", commands: s1.cmds }).ok && CL.soloActive(E.state(), s1.solo), "after the batch the solo is in force");
  /* Soloing a lane that was off turns it on and the soloed one off, keeping the first 'before'. */
  const s2 = CL.soloCommands(E.state(), "master|emotionIntensity", s1.solo);
  E.send({ type: "batch", commands: s2.cmds });
  ok(on()["master|emotionIntensity"] === true && on()["camera|shotSize"] === false && s2.solo.was["master|emotionIntensity"] === false && CL.soloActive(E.state(), s2.solo), "soloing another lane moves the solo and keeps what was on at the start");
  const u = CL.soloCommands(E.state(), "master|emotionIntensity", s2.solo);
  E.send({ type: "batch", commands: u.cmds });
  ok(u.off && u.solo === null && JSON.stringify(on()) === start, "pressing Solo again restores exactly what was on before");
  /* The film changed in between: a lane removed while soloed is skipped on restore; a lane made since is left alone. */
  const s3 = CL.soloCommands(E.state(), "camera|shotSize", null);
  E.send({ type: "batch", commands: s3.cmds });
  E.send({ type: "clearLane", track: "master", curiosity: "emotion" });
  E.send(pt("camera", "angleHeight", w.CurioScale.at("angleHeight", 0.5)));
  const made = Object.keys(E.state().lanes).find((k) => !(k in s3.solo.was));
  ok(CL.soloActive(E.state(), s3.solo), "a lane made while soloed does not break the solo");
  const u3 = CL.soloCommands(E.state(), "camera|shotSize", s3.solo);
  ok(u3.off && u3.cmds.every((c) => c.curiosity !== "emotion") && (!!made && u3.cmds.every((c) => c.track + "|" + c.curiosity !== made)), "un-solo restores only lanes that still exist and were there before");
  ok(CL.soloActive(E.state(), { lk: "camera|shotSize", was: { "master|emotionIntensity": false, "camera|shotSize": true, "camera|gone": true } }), "soloActive ignores lanes that are gone");
  E.send({ type: "laneMode", track: "camera", curiosity: "shotSize", on: false });
  ok(!CL.soloActive(E.state(), s3.solo), "a soloed lane turned off is no longer a solo");
  ok(CL.isLocked(null) === false && typeof CL.tools().locks === "object", "lock is a view setting kept in the tools (by lane key)");
}

/* Auto markers (Mark the turns): where attention moves to another family, where the feeling changes, where a
   lane jumps by more than half its scale. Attention is stubbed: a stretch starts at beats 0, 2 and 4. */
{
  const CL = w.CurioLanes;
  const att = { read: () => ({ segments: [{ beat: 0, family: "camera" }, { beat: 2, family: "feeling" }, { beat: 4, family: "feeling" }] }) };
  const beats = [
    { values: { emotion: "joyful", shotSize: "wide" } },
    { values: { emotion: "joyful", shotSize: "wide" } },
    { values: { emotion: "anxious", shotSize: "wide" } },
    { values: { emotion: "anxious", shotSize: "extreme close-up" } },
    { values: { emotion: "anxious", shotSize: "extreme close-up" } },
  ];
  const rows = ["r0", "r1", "r2", "r3", "r4"];
  const pos = (c, v) => ({ wide: 0.1, "extreme close-up": 1 })[v];
  const turns = CL.turnMarkers(beats, rows, { attention: att, lanes: ["shotSize"], pos, label: () => "Shot size", familyLabel: (f) => ({ camera: "the camera", feeling: "faces" })[f] });
  ok(turns.length === 2 && turns.every((t) => t.auto === true), "turnMarkers finds two turns, each flagged auto (" + turns.map((t) => t.row).join(", ") + ")");
  const t2 = turns.find((t) => t.row === "r2");
  ok(t2 && t2.color === "purple" && /attention moves from the camera to faces/.test(t2.note) && /feeling turns from joyful to anxious/.test(t2.note), "an attention turn is purple and says where attention moves; the feeling change at the same moment joins its note (" + (t2 && t2.note) + ")");
  ok(!turns.some((t) => t.row === "r4"), "attention staying in the same family is not a turn");
  const t3 = turns.find((t) => t.row === "r3");
  ok(t3 && t3.color === "yellow" && t3.note === "shot size jumps from wide to extreme close-up", "a jump of more than half the scale is a yellow marker");
  const feel = CL.turnMarkers(beats, rows, {});
  ok(feel.length === 1 && feel[0].row === "r2" && feel[0].color === "red" && feel[0].note === "feeling turns from joyful to anxious", "without attention or lanes, a feeling change is a red marker");
  ok(CL.turnMarkers(beats, rows, { lanes: ["shotSize"], pos: () => 0.4 }).length === 1, "a small change is not a jump");
  /* Merging: a moment with your own marker keeps it; a second run replaces the old auto ones; clearing takes only auto. */
  const mine = [{ row: "r2", color: "blue", note: "the joke lands" }, { row: "r0", color: "green", note: "" }];
  let list = CL.mergeTurnMarkers(mine, turns);
  ok(list.length === 3 && list.find((m) => m.row === "r2").note === "the joke lands" && !list.find((m) => m.row === "r2").auto && list.find((m) => m.row === "r3").auto, "your own marker at the same moment is kept as it is, nothing appended");
  list = CL.mergeTurnMarkers(list, turns);
  ok(list.length === 3, "marking the turns again does not duplicate them");
  ok(CL.migrateMarkers(list).find((m) => m.row === "r3").auto === true && CL.migrateMarkers(JSON.parse(JSON.stringify(list))).filter((m) => m.auto).length === 1, "migrateMarkers keeps the auto flag through a save");
  const cleared = CL.clearAutoMarkers(list);
  ok(cleared.length === 2 && cleared.every((m) => !m.auto) && cleared.some((m) => m.note === "the joke lands"), "Clear auto markers takes off only the auto ones");
  ok(CL.TURN_COLORS.attention === "purple" && CL.TURN_COLORS.feeling === "red" && CL.TURN_COLORS.jump === "yellow", "the turn colors are purple, red and yellow");
}

/* Lane groups: a folding header per filmmaking category, in the order their first lane comes; folded groups' lanes
   are left out of the drawn lanes; foldDots says where a folded group's lanes have nodes. */
{
  const CL = w.CurioLanes;
  const lanes = [{ cur: "shotSize" }, { cur: "emotion" }, { cur: "angleHeight" }, { cur: "emotionIntensity" }].map((x) => Object.assign(x, { lk: "t|" + x.cur }));
  const real = CL.laneGroups(lanes, { folds: {} });
  ok(real.groups.length === new Set(lanes.map((l) => L.categoryOf(l.cur))).size && real.groups.every((g) => g.lanes.every((l) => L.categoryOf(l.cur) === g.id)) && real.groups[0].id === L.categoryOf("shotSize") && real.groups[0].label === L.CATEGORIES.find((c) => c.id === L.categoryOf("shotSize")).label, "lanes group by the same categories Details uses (" + real.groups.map((g) => g.label + " " + g.count).join(", ") + ")");
  ok(real.groups[0].lanes.map((l) => l.cur).join() === "shotSize,angleHeight" && real.visible.slice(0, 2).map((l) => l.cur).join() === "shotSize,angleHeight", "a group comes where its first lane did, and lanes keep their order inside it");
  const catOf = (c) => ({ a: "camera", b: "feeling", c: "camera", d: "comedy" })[c];
  const labelOf = (id) => id.toUpperCase();
  const ls = ["a", "b", "c", "d"].map((cur) => ({ cur }));
  const has = (ln) => ln.cur !== "c";
  let g = CL.laneGroups(ls, { catOf, labelOf, hasNodes: has, folds: {} });
  ok(g.groups.map((x) => `${x.label}:${x.count}/${x.withNodes}`).join() === "CAMERA:2/1,FEELING:1/1,COMEDY:1/1", "each group counts its lanes and how many have nodes");
  g = CL.laneGroups(ls, { catOf, labelOf, hasNodes: has, folds: { camera: true } });
  ok(g.groups[0].folded && !g.groups[1].folded && g.visible.map((l) => l.cur).join() === "b,d", "a folded group's lanes are not drawn (so an area can't take them in)");
  g = CL.laneGroups(ls, { catOf, labelOf, folds: { camera: true, feeling: true, comedy: true } });
  ok(g.visible.length === 0 && g.groups.every((x) => x.folded), "every group can be folded");
  ok(CL.laneGroups([{ cur: "a" }], { catOf, labelOf, folds: { camera: true } }).groups.length === 0 && CL.laneGroups([{ cur: "a" }], { catOf, folds: { camera: true } }).visible.length === 1, "one lane alone has no group header and is never folded away");
  const st = { rows: [{ id: "r0" }, { id: "r1" }, { id: "r2" }, { id: "r3" }], lanes: { "t|a": { points: { r1: "x", r3: "y" } }, "t|c": { points: { r1: "z", r2: "w" } } } };
  const dots = CL.foldDots(st, [{ lk: "t|a" }, { lk: "t|c" }, { lk: null }]);
  ok(JSON.stringify(dots) === JSON.stringify([{ j: 1, count: 2 }, { j: 2, count: 1 }, { j: 3, count: 1 }]), "a folded group shows a dot at every moment where any of its lanes has a node");
  ok(CL.tools().folds && typeof CL.tools().folds === "object" && CL.GROUP_H > 0, "folds are kept in the timeline's tools (a view setting)");
  const gt = CL.groupText({ label: "Camera", count: 5, withNodes: 4 });
  ok(gt.short === "5 · 4●" && gt.full === "Camera: 5 lanes, 4 with nodes" && CL.groupText({ label: "Comedy", count: 1, withNodes: 0 }).full === "Comedy: 1 lane, 0 with nodes", "a group header's count is short (" + gt.short + ") and its tooltip has the full wording (" + gt.full + ")");
}

/* Next and previous marker (⇧] and ⇧[): the nearest marker after or before the playhead's moment. */
{
  const CL = w.CurioLanes;
  const rows = ["r0", "r1", "r2", "r3", "r4", "r5"].map((id) => ({ id }));
  const mk = [{ row: "r4", color: "red", note: "" }, { row: "r1", color: "orange", note: "" }, { row: "gone", color: "blue", note: "" }];
  ok(CL.markerStep(mk, rows, 0, 1) === 1 && CL.markerStep(mk, rows, 1, 1) === 4 && CL.markerStep(mk, rows, 2, 1) === 4, "next marker finds the nearest marker after the playhead, in film order");
  ok(CL.markerStep(mk, rows, 5, -1) === 4 && CL.markerStep(mk, rows, 4, -1) === 1 && CL.markerStep(mk, rows, 3, -1) === 1, "previous marker finds the nearest marker before the playhead");
  ok(CL.markerStep(mk, rows, 4, 1) === -1 && CL.markerStep(mk, rows, 1, -1) === -1 && CL.markerStep([], rows, 2, 1) === -1, "there is no marker that way past the last or before the first, or when there are none");
  ok(CL.markerStep([{ row: "gone" }], rows, 0, 1) === -1, "a marker on a moment no longer in the film is skipped");
}

/* The Attention track (CapCut's waveform, for attention): what holds attention at each moment and how strongly
   the film pulls forward. Attention is stubbed: camera from beat 0 (push 5), feeling from beat 2 (push 2). */
{
  const CL = w.CurioLanes;
  const beats = [0, 1, 2, 3, 4].map((i) => ({ values: { emotion: i < 2 ? "joyful" : "anxious", shotSize: i === 4 ? "close-up" : "wide" } }));
  let asked = null;
  const att = { read: (b, o) => ((asked = { n: b.length, o }), { limit: 20, segments: [{ beat: 0, family: "camera", label: "Shot size", push: 5 }, { beat: 2, family: "feeling", label: "Emotion", push: 2 }] }) };
  const fam = (f) => ({ camera: "Camera", feeling: "Feeling" })[f];
  const t = CL.attentionTrack(beats, { attention: att, secondsPerBeat: 3, familyLabel: fam });
  ok(t.ok && t.source === "momentum" && t.moments.length === 5 && asked.n === 5 && asked.o.secondsPerBeat === 3, "attentionTrack reads the film through the momentum reading, one entry per moment");
  ok(t.moments.map((m) => m.family).join() === "camera,camera,feeling,feeling,feeling" && t.moments[3].label === "Feeling" && t.moments[0].curiosity === "Shot size", "each moment carries the family holding attention, its name and the curiosity");
  ok(t.moments[0].strength === 1 && Math.abs(t.moments[2].strength - 0.4) < 1e-9, "the strength is the push of what holds attention, out of 5 (" + t.moments.map((m) => m.strength.toFixed(2)).join(" ") + ")");
  ok(t.families.length === 2 && t.families[0].id === "camera" && t.families[0].color === (w.CurioMomentum && w.CurioMomentum.mark ? w.CurioMomentum.mark("camera").color : CL.ATT_COLORS.camera) && t.families[1].label === "Feeling", "the key lists each family once, in order, in Momentum's own color for it");
  /* A family holding attention past the limit wears its pull down, as the momentum reading does. */
  const long = CL.attentionTrack(beats, { attention: { read: () => ({ limit: 6, segments: [{ beat: 0, family: "camera", push: 5 }] }) }, secondsPerBeat: 3 });
  ok(long.moments[1].strength === 1 && long.moments[4].strength < long.moments[2].strength && long.moments[4].strength >= 0.2, "a family held past the limit pulls less and less (" + long.moments.map((m) => m.strength.toFixed(2)).join(" ") + ")");
  /* No push in the reading: the strength comes from how much changes between moments. */
  const ch = CL.attentionTrack(beats, { attention: { read: () => ({ segments: [{ beat: 0, family: "camera" }] }) } });
  ok(ch.source === "change" && ch.moments[0].strength === 0 && ch.moments[1].strength === 0 && ch.moments[2].strength === 0.5 && ch.moments[4].strength === 0.5, "without a push, the strength is the share of curiosities that changed (" + ch.moments.map((m) => m.strength).join(" ") + ")");
  const before = CL.attentionTrack(beats, { attention: { read: () => ({ segments: [{ beat: 2, family: "plot", push: 4 }] }) } });
  ok(before.moments[0].family === null && before.moments[0].strength === 0 && before.moments[2].family === "plot", "moments before anything holds attention have no block and no pull");
  const none = CL.attentionTrack(beats, {});
  ok(!none.ok && none.moments.length === 0 && /momentum code, which isn't loaded/.test(none.note), "without the momentum code there is nothing to draw, only a plain note");
  ok(CL.attentionTrack(beats, { attention: { read: () => { throw new Error("x"); } } }).moments.every((m) => m.family === null), "a reading that fails draws empty moments instead of breaking the timeline");
  ok(CL.attentionTrack(null, { attention: att }).moments.length === 0, "a film with no moments draws nothing");
}

/* Export (CapCut's Export button): the storyboard sheet and the settings list, built from plain data with no
   page. ui.js is loaded with a stand-in document that does nothing, so only its pure parts are used. */
{
  const saved = { document: w.document, setTimeout: w.setTimeout };
  w.document = { readyState: "complete", querySelector: () => null, getElementById: () => null, addEventListener: () => {} };
  w.setTimeout = () => 0;
  try {
    vm.runInContext(fs.readFileSync(path.join(__dirname, "..", "ui.js"), "utf8"), core.context || vm.createContext(w), { filename: "ui.js" });
  } catch (e) {
    ok(false, "ui.js loads with no page: " + e.message);
  }
  w.document = saved.document;
  w.setTimeout = saved.setTimeout;
  const X = w.CurioScreenExport;
  ok(!!X && typeof X.csv === "function" && typeof X.sheetHtml === "function", "the Export builders are exposed for tests (CurioScreenExport)");
  if (X) {
    const labels = { shotSize: "Shot size", emotion: "Feeling, inside", line: 'Says "hi"', empty: "Never set" };
    const moments = [
      { n: 1, clock: "00:00:00:00", note: 'the joke lands, "big"', values: { shotSize: "wide", emotion: "joyful", line: "a, b", empty: null } },
      { n: 2, clock: "00:00:00:03", note: "", values: { shotSize: "close-up", emotion: "joyful", line: "plain", empty: "" } },
      { n: 3, clock: "00:00:00:06", note: "<b>bold</b> & more", values: { shotSize: "close-up", emotion: "anxious", line: 'say "no"\nthen go' } },
    ];
    const text = (k, v) => (k === "shotSize" ? String(v).toUpperCase() : String(v));
    const out = X.csv(moments, { keys: ["emotion"], label: (k) => labels[k], text });
    const lines = out.replace(/^﻿/, "").split("\r\n");
    ok(out.charCodeAt(0) === 0xfeff && out.endsWith("\r\n") && lines.length === 5, "the CSV starts with a byte-order mark, has a header and one row per moment, CRLF line ends");
    ok(lines[0] === 'Moment,Time,Marker note,"Feeling, inside",Shot size,"Says ""hi"""', "the header row has plain labels, the given order first, commas and quotes quoted (" + lines[0] + ")");
    ok(!out.includes("Never set"), "a curiosity with no value anywhere gets no column");
    ok(lines[1] === '1,00:00:00:00,"the joke lands, ""big""",joyful,WIDE,"a, b"', "a row has the moment, its time, the marker note and plain value labels, quoted where needed (" + lines[1] + ")");
    ok(lines[3] === '3,00:00:00:06,<b>bold</b> & more,anxious,CLOSE-UP,"say ""no""\nthen go"', "a value with a line break stays in one quoted cell; the CSV is not HTML, so notes are kept as written");
    ok(X.csvCell(" x") === '" x"' && X.csvCell(3) === "3" && X.csvCell(null) === "", "cells: edge spaces quoted, numbers plain, empty for nothing");
    ok(X.csvCell("=SUM(A1)") === "'=SUM(A1)" && X.csvCell("@x") === "'@x" && X.csvCell("-2") === "-2" && X.csvCell("+cue") === "'+cue", "cells that would run as a spreadsheet formula start with ' (plain numbers stay as they are)");

    ok(X.changes(moments[0].values, moments[1].values, { keys: ["shotSize", "emotion", "line"], label: (k) => labels[k], text }) === 'Shot size: WIDE → CLOSE-UP · Says "hi": a, b → plain', "what changed since the moment before, in plain labels");
    ok(X.changes(moments[1].values, moments[1].values, { keys: ["shotSize"], label: (k) => k }) === "", "nothing changed: an empty line");
    ok(/and 1 more$/.test(X.changes({ a: 1, b: 1, c: 1, d: 1 }, { a: 2, b: 2, c: 2, d: 2 }, { keys: ["a", "b", "c", "d"], label: (k) => k })), "more than three changes: the rest are counted");

    const frame = w.CurioFrame.svg({ shotSize: "wide" }, { title: "t" });
    const vert = X.frameSvg(frame, "vertical", 1280);
    ok(vert.startsWith('<svg xmlns="http://www.w3.org/2000/svg" width="720" height="1280"') && vert.includes('viewBox="109.38 0 101.25 180"'), "a vertical frame crops the wide picture to 9:16, centered, long side 1280px");
    ok(X.frameSvg(frame, "wide").includes('viewBox="0 0 320 180"') && X.frameSvg(frame, "square").includes('viewBox="70 0 180 180"') && /viewBox="0 23\.\d+ 320 133\.\d+"/.test(X.frameSvg(frame, "cinema")), "wide, square and cinema frames keep the right part of the picture");

    const sm = moments.map((m, i) => Object.assign({}, m, { svg: X.frameSvg(frame, "square"), color: i === 2 ? "purple" : "red", changes: i === 2 ? "Feeling: joyful → anxious" : "", label: "" }));
    const sheet = X.sheetHtml({ title: "Curiomatic storyboard: <Mine>", moments: sm, shape: "square", perRow: 4, seconds: 3 });
    ok(/^<!doctype html>/.test(sheet) && (sheet.match(/<figure class="f">/g) || []).length === 3 && (sheet.match(/<svg /g) || []).length === 3, "the sheet is a page of its own with one frame per moment");
    ok(sheet.includes("Moment 3") && sheet.includes("00:00:00:06") && sheet.includes("Feeling: joyful → anxious") && sheet.includes("Where the film starts."), "each frame has its number, clock time and what changed");
    ok(sheet.includes("&lt;b&gt;bold&lt;/b&gt; &amp; more") && !sheet.includes("<b>bold</b>") && sheet.includes("the joke lands, &quot;big&quot;") && sheet.includes("&lt;Mine&gt;"), "marker notes and the title are escaped");
    ok(sheet.includes("background:#b197fc") && sheet.includes("--per:4") && /data-per="4" class="on"/.test(sheet) && sheet.includes("data-print") && sheet.includes("aspect-ratio: 180 / 180"), "the marker's color, 4 frames per row picked, a Print button, the square shape");
    ok(X.sheetHtml({ moments: sm, perRow: 7 }).includes("--per:3"), "frames per row is 2, 3 or 4 (3 otherwise)");
    ok(X.fileName("My Film: Take #2", "moment 3", "png") === "curiomatic-my-film-take-2-moment-3.png" && X.fileName("", "settings", "csv") === "curiomatic-settings.csv", "file names start with curiomatic- and use plain letters and dashes");
  }
}

/* The Player's guides (CapCut's guides over the picture): ui.js loaded with no page, only a stub document and
   a saved view, to check the guide list, the saved setting and where "Where attention is" glows. */
{
  const mk = (saved) => {
    const store = { "curiosities-screen-v1": saved == null ? null : JSON.stringify(saved) };
    const g = { CurioFrame: w.CurioFrame, document: { readyState: "loading", addEventListener() {} }, localStorage: { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => (store[k] = v) } };
    g.window = g;
    vm.runInContext(fs.readFileSync(path.join(__dirname, "..", "ui.js"), "utf8"), vm.createContext(g), { filename: "ui.js" });
    return g.CurioScreen.guides;
  };
  const G = mk({ guides: ["golden", "thirds", "nonsense"] });
  const list = G.list();
  ok(list.map((x) => x.id).join() === "thirds,center,safe,golden,attention", "the Guides menu offers thirds, center cross, safe areas, golden ratio and where attention is");
  ok(list.every((x) => x.tip && x.tip.startsWith(x.label + ":") && x.tip.length < 140 && !/\n/.test(x.tip)), "each guide has a one-line plain tooltip starting with its name");
  ok(G.on().join() === "thirds,golden", "saved guides load in menu order, unknown ones dropped");
  ok(mk({ guides: true }).on().join() === "thirds" && mk({ guides: false }).on().length === 0 && mk(null).on().length === 0, "an older save's single guides switch (⌘;) loads as the thirds guide");
  /* Compare ◐: what it can compare with, and the saved setting read back safely. */
  const C = (saved) => { const store = { "curiosities-screen-v1": saved == null ? null : JSON.stringify(saved) }; const g = { CurioFrame: w.CurioFrame, document: { readyState: "loading", addEventListener() {} }, localStorage: { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => (store[k] = v) } }; g.window = g; vm.runInContext(fs.readFileSync(path.join(__dirname, "..", "ui.js"), "utf8"), vm.createContext(g), { filename: "ui.js" }); return g.CurioScreen.compare; };
  ok(C(null).list().map((x) => x.id).join() === "insp,open" && C(null).list()[0].label === "The film I'm learning from" && C(null).list()[1].label === "When I opened the Screen", "Compare offers the film I'm learning from and when I opened the Screen, in plain words");
  ok(JSON.stringify(C(null).now()) === JSON.stringify({ on: false, split: 50, with: "insp" }), "Compare starts off, split in the middle, against the film I'm learning from");
  ok(JSON.stringify(C({ compare: { on: true, split: 140, with: "open" } }).now()) === JSON.stringify({ on: true, split: 100, with: "open" }) && C({ compare: { split: -3, with: "nonsense" } }).now().split === 0 && C({ compare: { with: "nonsense" } }).now().with === "insp" && C({ compare: "junk" }).now().split === 50, "a saved Compare setting is kept inside the frame and unknown choices fall back");
  const F = w.CurioFrame;
  /* The head frame.js actually draws: the first person's head circle. */
  const head = (vals, cast) => { const m = F.svg(vals, { cast }).match(/<circle data-cat="performance" cx="([\d.]+)" cy="([\d.]+)" r="([\d.]+)"/); return m && { x: +m[1], y: +m[2], r: +m[3] }; };
  const near = (s, h) => h && Math.abs(s.x - h.x) < 0.2 && Math.abs(s.y - h.y) < 0.2;
  const face = G.spot({ shotSize: "medium" }, "feeling", 1);
  ok(near(face, head({ shotSize: "medium" }, 1)) && face.family === "feeling", "attention on a feeling glows on the main character's face, exactly where frame.js draws it (" + face.x + "," + face.y + ")");
  ok(near(G.spot({ shotSize: "wide", angleHeight: "high" }, "plot", 3), head({ shotSize: "wide", angleHeight: "high" }, 3)), "it follows the shot size, the camera height and the cast");
  const left = G.spot({ shotSize: "medium", composition: "left third" }, "feeling", 1);
  ok(Math.abs(left.x - F.W * 0.36) < 0.2, "a single person framed left moves the glow left with them");
  const two = G.spot({ shotSize: "wide" }, "movement", 3);
  ok(two.x === F.W / 2 - 100 && two.y < F.H && two.ry > 20, "with several people the glow sits on the first in line, the main character");
  ok(G.spot({ shotSize: "insert", objectKind: "cup" }, "feeling", 2).what === "the object in the shot", "an insert shot glows on the object");
  const talk = G.spot({ shotSize: "medium", volume: 3, wordsAmount: 2 }, "voice", 2);
  ok(Math.abs(talk.x - F.W * 0.3) < 0.2 && talk.y === 28, "attention on what is said glows on the speech balloon");
  ok(G.spot({}, "music", 2).x < 60 && G.spot({ angleHeight: "eye" }, "light", 2).x > F.W / 2, "music glows on the notes, light on the window");
  const none = G.spot({ shotSize: "close" }, null, 1);
  ok(none.family === null && none.y >= 0 && none.y <= F.H && /eye goes first/.test(none.what), "with no attention reading it glows where the eye goes first, inside the frame");
}

/* Favorites and Recently used (CapCut's star and its Recently used list): ui.js with no page and a saved list. */
{
  const store = { "curiosities-screen-faves-v1": JSON.stringify({ faves: ["suite|nope", "curiosity|shotSize", "curiosity|shotSize", 7, "bogus", "wrong|x"], recent: Array.from({ length: 20 }, (_, i) => "curiosity|c" + i) }) };
  const g = { CurioFrame: w.CurioFrame, CurioLevels: w.CurioLevels, document: { readyState: "loading", addEventListener() {} }, localStorage: { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => (store[k] = v) } };
  g.window = g;
  vm.runInContext(fs.readFileSync(path.join(__dirname, "..", "ui.js"), "utf8"), vm.createContext(g), { filename: "ui.js" });
  const FV = g.CurioScreen.faves;
  ok(FV && FV.key === "curiosities-screen-faves-v1" && FV.max === 12, "Favorites are kept under curiosities-screen-faves-v1, with 12 recently used");
  const now = FV.now();
  ok(now.faves.join() === "suite|nope,curiosity|shotSize" && now.recent.length === 12 && now.recent[0] === "curiosity|c0", "a saved list loads with repeats, junk and unknown kinds dropped, and recently used cut to 12");
  ok(FV.items("faves").join() === "curiosity|shotSize", "an id the database no longer has is skipped quietly");
  let st = { faves: [], recent: [] };
  st = FV.toggle(st, "curiosity|shotSize");
  st = FV.toggle(st, "suite|a");
  ok(st.faves.join() === "curiosity|shotSize,suite|a", "starring keeps the order things were starred in");
  ok(FV.toggle(st, "curiosity|shotSize").faves.join() === "suite|a", "starring again takes it out");
  let r = { faves: [], recent: [] };
  for (let i = 0; i < 15; i++) r = FV.used(r, "curiosity|c" + i);
  r = FV.used(r, "curiosity|c5");
  ok(r.recent.length === 12 && r.recent[0] === "curiosity|c5" && r.recent[1] === "curiosity|c14" && new Set(r.recent).size === 12, "recently used is newest first, at most 12, with no repeats");
}

/* Film lines and Take from the film: the inspiration film picked in the Player, read per moment of My film. */
{
  const CL = w.CurioLanes;
  ok(typeof CL.filmLine === "function" && typeof CL.filmBeat === "function" && typeof CL.takeFromFilmCommands === "function", "the film line builders are on CurioLanes");
  ok([0, 1, 2, 3, 4, 5, 6, 7].every((j) => CL.filmBeat(j, 8, 8) === j), "films of the same length line up moment for moment");
  ok(CL.filmBeat(0, 8, 4) === 0 && CL.filmBeat(7, 8, 4) === 3 && CL.filmBeat(3, 8, 4) === 1 && CL.filmBeat(4, 8, 4) === 2, "a shorter film is stretched to My film's length, first and last moments meeting");
  ok(CL.filmBeat(0, 1, 5) === 0, "a one-moment film reads the first beat");
  /* Four beats: shot size set from beat 1 (in capitals, snapped onto the scale), intensity 2.4 (snapped to 2). */
  const insp = [{ values: { emotion: "joyful" } }, { values: { shotSize: "Close", emotionIntensity: 2.4 } }, { values: {} }, { values: { shotSize: "wide" } }];
  const sl = CL.filmLine(insp, 8, "shotSize");
  ok(sl.length === 8 && sl[0] === null && sl[1] === null && sl[2] === "close" && sl[3] === "close" && sl[5] === "close" && sl[6] === "wide" && sl[7] === "wide", "the line carries a setting forward, snapped to the scale, and is empty before the film sets it (" + sl.join(",") + ")");
  ok(CL.filmLine(insp, 8, "emotionIntensity")[7] === 2, "a number is snapped to the curiosity's steps");
  ok(CL.filmLine(insp, 8, "cameraMove").every((v) => v === null), "a curiosity the film never sets has no line");
  ok(CL.filmLine([], 8, "shotSize").every((v) => v === null) && CL.filmLine(null, 3, "shotSize").length === 3, "no film, no line");

  E.reset(w.CurioSeeds.starter());
  const rr = E.state().rows;
  E.send({ type: "batch", commands: [{ type: "setPoint", row: rr[0].id, track: "camera", curiosity: "shotSize", value: "insert" }, { type: "setPoint", row: rr[4].id, track: "camera", curiosity: "shotSize", value: "medium" }, { type: "setPoint", row: rr[3].id, track: "master", curiosity: "emotion", value: "angry" }] });
  const film = () => JSON.stringify([E.state().lanes, E.state().links]);
  const before = film();
  const lanesT = [{ track: "camera", cur: "shotSize", lk: "camera|shotSize" }, { track: "master", cur: "emotion", lk: null }, { track: "camera", cur: "cameraMove", lk: "camera|cameraMove" }, { track: "master", cur: "emotionIntensity", lk: "master|emotionIntensity" }];
  const ar = { i0: 0, i1: 3, j0: 1, j1: 5 };
  const tk = CL.takeFromFilmCommands(E.state(), lanesT, ar, insp);
  ok(tk.lanes === 2 && tk.empty === 1, "Take from the film writes the lanes the film sets, skips a locked lane and one it never sets (" + tk.lanes + " lanes, " + tk.empty + " empty)");
  ok(E.send({ type: "batch", label: "Take from the film", commands: tk.cmds }).ok, "Take from the film is one batch");
  const P = E.state().lanes["camera|shotSize"].points;
  ok(P[rr[1].id] == null && P[rr[2].id] === "close" && P[rr[5].id] === "close" && P[rr[4].id] === "close" && P[rr[0].id] === "insert" && P[rr[6].id] == null, "it writes the film's settings as nodes inside the selection only, keeping a moment the film has nothing for");
  ok(E.state().lanes["master|emotion"].points[rr[3].id] === "angry" && !E.state().lanes["master|emotion"].points[rr[1].id], "the locked lane is left alone");
  ok(E.state().lanes["master|emotionIntensity"].points[rr[2].id] === 2, "values land snapped to each curiosity's scale");
  E.undo();
  ok(film() === before, "one undo takes Take from the film back");
  const comp = [{ values: { composition: "center" } }];
  const off = CL.takeFromFilmCommands(E.state(), [{ track: null, cur: "composition", lk: null }], { i0: 0, i1: 0, j0: 2, j1: 3 }, comp);
  ok(off.cmds[0] && off.cmds[0].type === "addCuriosity" && off.cmds.length === 3 && E.send({ type: "batch", commands: off.cmds }).ok && E.value(rr[3].id, off.cmds[0].track, "composition") === "center", "a lane not on a track yet is put on one first");
  E.undo();
  ok(film() === before, "and one undo takes that back too");
}

console.log(fails ? fails + " failed" : "all passed");
process.exit(fails ? 1 : 0);
