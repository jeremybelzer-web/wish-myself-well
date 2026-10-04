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

/* Templates (CapCut's Templates, curiosity-centric): a stretch kept with a name and a note, used anywhere as one
   batch, stretched to a selected area, shared as a .json file. */
{
  const CL = w.CurioLanes;
  const Sc = w.CurioScale;
  E.reset(w.CurioSeeds.starter());
  const rr = E.state().rows;
  const o = Sc.domain("shotSize").options;
  const lanesA = [{ track: "camera", cur: "shotSize", lk: "camera|shotSize" }, { track: "master", cur: "emotion", lk: "master|emotion" }];
  const pt = (j, v, t, c) => ({ type: "setPoint", row: rr[j].id, track: t || "camera", curiosity: c || "shotSize", value: v });
  E.send({ type: "batch", commands: [pt(0, o[0]), pt(1, o[1]), pt(2, o[3]), pt(1, "angry", "master", "emotion")] });
  const raw = CL.copyArea(E.state(), lanesA, { i0: 0, i1: 1, j0: 0, j1: 2 });
  const t = CL.template(raw, "  slow-burn reveal ", "  hold wide, then push in  ");
  ok(t && t.name === "slow-burn reveal" && t.note === "hold wide, then push in" && t.span === 2 && /^tp-/.test(t.id) && t.curiosities.join() === "shotSize,emotion", "a template keeps the stretch's lanes with a trimmed name and note");
  ok(t.lanes[0].points.map((p) => p.at + ":" + p.value).join() === `0:${o[0]},1:${o[1]},2:${o[3]}`, "its nodes are kept relative to the stretch's start (area copy's format)");
  ok(CL.template({ span: 1, lanes: [null] }, "x") === null && CL.template(raw, "", null).name === "Template" && CL.template(raw, "a", null).note === "", "nothing to keep gives no template; no name or note gives plain ones");
  ok(/^3 moments · Shot size and /.test(CL.templateSummary(t)), "a card says how many moments and which curiosities (" + CL.templateSummary(t) + ")");
  const pic = CL.templatePreview(t, 120, 48);
  ok(/^<svg/.test(pic) && (pic.match(/<polyline/g) || []).length === 2 && /data-tpl-lane="shotSize"/.test(pic), "the preview is a small SVG with one polyline per lane");
  ok(CL.TEMPLATE_KEY === "curiosities-screen-templates-v1" && CL.migrateTemplates([t, null, { id: "x" }, t]).length === 1 && CL.migrateTemplates("junk").length === 0, "templates are kept in curiosities-screen-templates-v1, cleaned when read");
  /* Use at moment 4: one batch, the same shapes shifted. */
  const before = JSON.stringify([E.state().lanes, E.state().links]);
  const shown = [{ cur: "shotSize", track: "camera" }, { cur: "emotion", track: "master" }];
  const u = CL.useTemplateCommands(E.state(), t, 4, { shown });
  ok(!u.error && u.start === 4 && u.span === 2 && E.send({ type: "batch", label: "Use", commands: u.cmds }).ok, "using a template is one batch");
  const P = () => E.state().lanes["camera|shotSize"].points;
  ok(P()[rr[4].id] === o[0] && P()[rr[5].id] === o[1] && P()[rr[6].id] === o[3], "its nodes land in the same shape, shifted to start at moment 5");
  E.undo();
  ok(JSON.stringify([E.state().lanes, E.state().links]) === before, "one undo takes it back");
  /* Stretch to a 5-moment area: the same maths as Stretch ×2. */
  const s = CL.stretchTemplate(t, 4);
  ok(s.span === 4 && s.lanes[0].points.map((p) => p.at).join() === "0,2,4" && s.lanes[0].points[2].value === o[3], "stretching to five moments spreads the nodes out (0, 2, 4)");
  const q = CL.stretchTemplate(t, 1);
  ok(q.lanes[0].points.map((p) => p.at).join() === "0,1" && q.lanes[0].points[1].value === o[3], "squeezing to two moments keeps the later node where two land together");
  const one = CL.stretchTemplate(Object.assign(JSON.parse(JSON.stringify(t)), { span: 0, lanes: [{ cur: "shotSize", track: "camera", mode: "ramp", points: [{ at: 0, value: o[2] }] }], links: [] }), 3);
  ok(one.lanes[0].points.map((p) => p.at + ":" + p.value).join() === `0:${o[2]},3:${o[2]}`, "a one-moment template stretched is held over the area");
  const us = CL.useTemplateCommands(E.state(), t, 2, { shown, span: 4 });
  E.send({ type: "batch", commands: us.cmds });
  ok(us.span === 4 && P()[rr[2].id] === o[0] && P()[rr[4].id] === o[1] && P()[rr[6].id] === o[3], "used with a span, it fills the selected area");
  E.undo();
  /* A locked lane is skipped; a curiosity not in the film is put on a track. */
  CL.tools().locks = Object.assign({}, CL.tools().locks, { "master|emotion": true });
  const lk = CL.useTemplateCommands(E.state(), t, 0, { shown });
  ok(lk.locked.join() === "emotion" && !lk.cmds.some((x) => x.curiosity === "emotion"), "a locked lane is skipped and named");
  CL.tools().locks["camera|shotSize"] = true;
  ok(/template/.test(CL.useTemplateCommands(E.state(), t, 0, { shown }).error || ""), "with every lane locked it says so, in template words");
  delete CL.tools().locks["master|emotion"];
  delete CL.tools().locks["camera|shotSize"];
  const fresh = CL.template({ span: 1, lanes: [{ cur: "transitionKind", track: null, points: [{ at: 0, value: Sc.at("transitionKind", 0) }, { at: 1, value: Sc.at("transitionKind", 1) }] }], links: [] }, "new lane");
  const add = CL.useTemplateCommands(E.state(), fresh, 0, { shown });
  ok(!add.error && add.cmds.some((x) => x.type === "addCuriosity" && x.curiosity === "transitionKind"), "a curiosity not in the film yet is put on a track first");
  /* Export and Import: a round trip, duplicates skipped, a clashing id renamed, unknown curiosities left out. */
  const text = CL.exportTemplates([t, fresh]);
  const file = JSON.parse(text);
  ok(file.format === "curiomatic-templates" && file.version === 1 && file.templates.length === 2, "export writes a curiomatic-templates file");
  const back = CL.importTemplates(text, []);
  ok(!back.error && back.added.length === 2 && JSON.stringify(back.list[0].lanes) === JSON.stringify(t.lanes) && back.list[0].note === t.note, "importing it brings both back exactly");
  const again = CL.importTemplates(text, back.list);
  ok(again.added.length === 0 && again.skipped === 2, "importing the same file twice skips what is already here");
  const other = JSON.parse(JSON.stringify(t));
  other.lanes[0].points[0].value = o[2];
  const clash = CL.importTemplates([other], [t]);
  ok(clash.added.length === 1 && clash.added[0].id !== t.id && clash.list.length === 2, "a different template with a taken id gets a new id");
  const odd = CL.importTemplates({ templates: [Object.assign(JSON.parse(JSON.stringify(t)), { id: "odd", lanes: t.lanes.concat([{ cur: "notARealCuriosity", points: [{ at: 0, value: 1 }] }]) })] }, []);
  ok(odd.dropped === 1 && odd.added[0].curiosities.join() === "shotSize,emotion", "lanes of curiosities this app doesn't know are left out and counted");
  ok(!!CL.importTemplates("not json", []).error && !!CL.importTemplates({ nothing: 1 }, []).error, "a file that isn't JSON or has no templates gives a plain error");
}

/* A template used as an analogy: each lane's shape lands on a cousin curiosity (Shot size → Lens length), every
   value keeping its place on its scale, as one batch; locked lanes skipped, missing lanes added. */
{
  const CL = w.CurioLanes;
  const Sc = w.CurioScale;
  E.reset(w.CurioSeeds.starter());
  const rr = E.state().rows;
  const o = Sc.domain("shotSize").options;
  const lanesA = [{ track: "camera", cur: "shotSize", lk: "camera|shotSize" }, { track: "master", cur: "emotion", lk: "master|emotion" }];
  const pt = (j, v, t, c) => ({ type: "setPoint", row: rr[j].id, track: t || "camera", curiosity: c || "shotSize", value: v });
  E.send({ type: "batch", commands: [pt(0, o[0]), pt(1, o[1]), pt(2, o[3]), pt(1, "angry", "master", "emotion")] });
  E.send(CL.linkCommand(E.state(), { row: rr[1].id, track: "camera", cur: "shotSize" }, { row: rr[1].id, track: "master", cur: "emotion" }));
  const t = CL.template(CL.copyArea(E.state(), lanesA, { i0: 0, i1: 1, j0: 0, j1: 2 }), "slow-burn reveal", "");
  const cs = CL.analogyCandidates("shotSize");
  ok(cs.length > 1 && cs[0].cur === "lensLength" && cs[0].label === "Lens length" && !cs.some((c) => c.cur === "shotSize"), "Shot size's closest cousin is Lens length (" + cs.map((c) => c.cur).join(", ") + ")");
  ok(CL.analogyCandidates("shotSize", { avoid: ["lensLength"] })[0].cur !== "lensLength" && CL.analogyCandidates("notARealCuriosity").length === 0, "a cousin to avoid is left out; an unknown curiosity has none");
  ok(CL.analogyCandidates("emotion").every((c) => Sc.known(c.cur) && (Sc.domain(c.cur).kind === "range" || Sc.domain(c.cur).options.length > 1)), "every cousin has a scale or a range for values to keep their place on");
  const plan = CL.templateAnalogy(t);
  const p0 = plan.pairs[0];
  ok(plan.pairs.length === 2 && p0.from === "shotSize" && p0.to === "lensLength" && p0.fromLabel === "Shot size" && p0.toLabel === "Lens length", "the plan maps Shot size → Lens length");
  ok(!plan.pairs.some((p) => t.curiosities.includes(p.to)) && plan.pairs[0].to !== plan.pairs[1].to && !plan.clash && plan.left.length === 0, "no lane lands on a curiosity the template already has, or on another lane's cousin");
  const placeOk = p0.values.every((v) => v.to === Sc.at("lensLength", Sc.pos("shotSize", v.from)));
  ok(p0.values.length === 3 && placeOk && p0.values[0].to === "wide" && p0.values[2].to === "long", "each value keeps its place on the scale (" + p0.values.map((v) => v.from + "→" + v.to).join(", ") + ")");
  ok(plan.clip.curiosities.join() === "lensLength," + plan.pairs[1].to && plan.clip.links.length === 1 && plan.clip.links[0].from.is === Sc.at("lensLength", Sc.pos("shotSize", o[1])), "the moved template's join follows its nodes, its cause moved onto the new scale");
  /* Picks: a different cousin, or leave a lane out; two lanes on one cousin is a clash. */
  const pk = CL.templateAnalogy(t, { picks: { shotSize: "angleHeight", emotion: "" } });
  ok(pk.pairs[0].to === "angleHeight" && pk.left.join() === "emotion" && pk.clip.lanes.length === 1, "a picked cousin is used, and a lane can be left out");
  ok(CL.templateAnalogy(t, { picks: { shotSize: "angleHeight", emotion: "angleHeight" } }).clash === "angleHeight", "two lanes on one cousin is a clash, with no clip");
  ok(CL.templateAnalogy(t, { picks: { shotSize: "", emotion: "" } }).clip === null && /no close cousin/.test(CL.useTemplateCommands(E.state(), t, 0, { analogy: { shotSize: "", emotion: "" } }).error), "nothing left to write says so plainly");
  /* Use it at moment 4: one batch, Lens length gets Shot size's shape, Shot size is left as it was. */
  const shown = [{ cur: "shotSize", track: "camera" }, { cur: "emotion", track: "master" }, { cur: "lensLength", track: "camera" }];
  const before = JSON.stringify([E.state().lanes, E.state().links]);
  const shotBefore = JSON.stringify(E.state().lanes["camera|shotSize"].points);
  const u = CL.useTemplateCommands(E.state(), t, 4, { shown, analogy: true });
  ok(!u.error && u.start === 4 && u.lanes.includes("lensLength") && !u.lanes.includes("shotSize") && u.pairs.length === 2 && E.send({ type: "batch", label: "Use as an analogy", commands: u.cmds }).ok, "using it as an analogy is one batch onto the cousins");
  const LP = E.state().lanes["camera|lensLength"].points;
  ok(LP[rr[4].id] === "wide" && LP[rr[5].id] === Sc.at("lensLength", Sc.pos("shotSize", o[1])) && LP[rr[6].id] === "long", "Lens length takes Shot size's shape, shifted to start at moment 5");
  ok(JSON.stringify(E.state().lanes["camera|shotSize"].points) === shotBefore, "Shot size itself is not touched");
  E.undo();
  ok(JSON.stringify([E.state().lanes, E.state().links]) === before, "one undo takes it back");
  /* A locked cousin lane is skipped; a cousin not in the film yet is put on a track. */
  CL.tools().locks = Object.assign({}, CL.tools().locks, { "camera|lensLength": true });
  const lk = CL.useTemplateCommands(E.state(), t, 0, { shown, analogy: true });
  ok(lk.locked.join() === "lensLength" && !lk.cmds.some((x) => x.curiosity === "lensLength"), "a locked lane is skipped and named");
  delete CL.tools().locks["camera|lensLength"];
  const fresh = CL.template({ span: 1, lanes: [{ cur: "transitionKind", track: null, points: [{ at: 0, value: Sc.at("transitionKind", 0) }, { at: 1, value: Sc.at("transitionKind", 1) }] }], links: [] }, "new lane");
  const fp = CL.templateAnalogy(fresh).pairs[0];
  const add = CL.useTemplateCommands(E.state(), fresh, 0, { shown, analogy: true });
  ok(fp.to && !E.state().tracks.some((x) => x.curiosities.includes(fp.to)) && !add.error && add.cmds.some((x) => x.type === "addCuriosity" && x.curiosity === fp.to), "a cousin not in the film yet is put on a track first (" + fp.to + ")");
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

/* Words on the frame (CurioScreenText, CapCut's Text tab for a storyboard): the items, their moments, spots,
   styles and sizes, the SVG the Export draws, the CSV's Text column, and the timeline's Text row packing. */
{
  const T = w.CurioScreenText;
  const X = w.CurioScreenExport;
  ok(!!T && typeof T.add === "function" && typeof T.svg === "function", "the text helpers are exposed for tests (CurioScreenText)");
  if (T) {
    ok(T.STYLES.map((s) => s[1]).join() === "Title,Lower third,Sign / Insert,Sound effect,Thought" && T.STYLES.every((s) => s[2].length > 20 && s[2].length < 120 && !s[2].includes("\n")), "five styles, each with a one-line tooltip in plain words");
    ok(T.STYLES.find((s) => s[0] === "lower")[2] === "Lower third: a name and job in the bottom corner, like the news.", "Lower third says what it is like the news does");
    ok(T.SPOTS.length === 9 && T.SPOTS.map((s) => s[0]).join() === "tl,tc,tr,ml,mc,mr,bl,bc,br" && T.SIZES.map((s) => s[1]).join() === "S,M,L", "a 9-spot grid and three sizes");
    let d = T.add({ items: [] }, { id: "t1", from: 3 });
    ok(JSON.stringify(d.items[0]) === JSON.stringify({ id: "t1", words: "Title", sub: "", from: 3, to: 3, spot: "bc", size: "m", style: "title", fade: false }), "a new text is a Title on one moment, bottom centre, medium, no fade");
    ok(T.nextId(d) === "t2" && T.nextId({ items: [] }) === "t1", "each new text gets an id no other has");
    d = T.add(d, { id: "t2", from: 2, to: 5, style: "sfx" });
    ok(d.items[1].words === "POW!" && d.items[1].spot === "mc", "a Sound effect starts as POW! in the middle");
    ok(T.at(d, 3).map((t) => t.id).join() === "t1,t2" && T.at(d, 2).map((t) => t.id).join() === "t2" && T.at(d, 6).length === 0, "a text shows only on its own moments");
    let u = T.update(d, "t1", { style: "lower" });
    ok(u.items[0].style === "lower" && u.items[0].spot === "bl" && u.items[0].words === "Name" && u.items[0].sub === "Job", "changing the style moves an untouched text to the style's own place and example words");
    u = T.update(T.update(d, "t1", { words: "Ana", spot: "tr" }), "t1", { style: "lower" });
    ok(u.items[0].words === "Ana" && u.items[0].spot === "tr", "but words you wrote and a place you picked stay");
    u = T.update(d, "t2", { from: 7 });
    ok(u.items[1].from === 7 && u.items[1].to === 7, "a first moment past the last pulls the last along");
    u = T.update(d, "t2", { to: 1 });
    ok(u.items[1].from === 1 && u.items[1].to === 1, "a last moment before the first pulls the first along");
    ok(T.remove(d, "t1").items.map((t) => t.id).join() === "t2" && T.update(d, "nope", { words: "x" }).items.length === 2, "a text can be removed; changing one that isn't there changes nothing");
    const c = T.clean({ items: [{ id: "a", from: 5, to: 2, spot: "zz", size: "huge", style: "comic", words: "line\nbreak" }, { id: "a", from: 1 }, { id: "b" }, { id: "bad id!", from: 1 }, null, { id: "c", from: "2", fade: 1 }] });
    ok(c.items.length === 2 && c.items[0].from === 2 && c.items[0].to === 5 && c.items[0].spot === "bc" && c.items[0].size === "m" && c.items[0].style === "title" && c.items[0].words === "line break" && c.items[1].from === 2 && c.items[1].fade === true, "a broken saved list is cleaned quietly (moments in order, unknown values back to their defaults, repeats and broken items dropped)");
    ok(T.clean("x").items.length === 0 && T.clean({ items: Array.from({ length: 90 }, (_, i) => ({ id: "t" + i, from: 1 })) }).items.length === T.MAX, "no list, no items; at most " + T.MAX + " texts");
    ok(T.spotAt(0.1, 0.1) === "tl" && T.spotAt(0.5, 0.5) === "mc" && T.spotAt(0.9, 0.95) === "br" && T.spotAt(0.4, 0.8) === "bc", "a point on the frame falls in one of the 9 spots");
    ok(T.wrap("one two three four five six", 9, 2).length === 2 && /…$/.test(T.wrap("one two three four five six", 9, 2)[1]) && T.wrap("short", 20, 3).join() === "short" && T.wrap("abcdefghijklmnop", 6, 3).join("|") === "abcdef|ghijkl|mnop", "long words wrap onto at most a few lines, the rest ending in …");
    const lower = T.make({ id: "t9", from: 1, style: "lower", words: 'Ana & "Bo"', sub: "<director>" });
    const svg = T.svg([lower, d.items[1]], { x: 0, y: 0, w: 320, h: 180 });
    ok(/^<g class="cf-texts">/.test(svg) && svg.includes('data-style="lower"') && svg.includes('data-style="sfx"') && svg.includes("Ana &amp; &quot;Bo&quot;") && svg.includes("&lt;director&gt;") && !svg.includes("<director>"), "the Export draws each text as SVG, its words escaped");
    ok(/rotate\(-8 /.test(svg) && svg.includes('fill="#ffd43b"') && svg.includes('fill="#22d3ee"'), "a Sound effect is drawn tilted and yellow like a comic; a Lower third has its colored edge");
    const xs = (s) => [...s.matchAll(/<rect x="([\d.]+)" y="([\d.]+)" width="([\d.]+)" height="([\d.]+)"/g)].map((m) => m.slice(1).map(Number));
    const box = { x: 109.38, y: 0, w: 101.25, h: 180 };
    const inside = xs(T.svg([lower], box)).every(([x, y, wd, h]) => x >= box.x - 0.1 && x + wd <= box.x + box.w + 0.1 && y >= 0 && y + h <= 180);
    ok(inside, "in a vertical frame the words stay inside the part of the picture that shows");
    const big = xs(T.svg([Object.assign({}, lower, { size: "l" })], { x: 0, y: 0, w: 320, h: 180 }))[0];
    const small = xs(T.svg([Object.assign({}, lower, { size: "s" })], { x: 0, y: 0, w: 320, h: 180 }))[0];
    ok(big[3] > small[3] * 1.6, "L draws bigger than S (" + big[3] + " to " + small[3] + " tall)");
    const two = xs(T.svg([Object.assign({}, lower, { id: "x1", spot: "bl" }), Object.assign({}, lower, { id: "x2", spot: "bl" })], { x: 0, y: 0, w: 320, h: 180 }));
    ok(two.length === 4 && two[0][1] + two[0][3] <= two[2][1] + 0.01, "two texts in one spot stack, never on top of each other");
    const lifted = xs(T.svg([lower], { x: 0, y: 0, w: 320, h: 180 }, { lift: 40 }))[0];
    const plain = xs(T.svg([lower], { x: 0, y: 0, w: 320, h: 180 }))[0];
    ok(Math.abs(plain[1] - lifted[1] - 40) < 0.2, "the bottom row can be lifted clear of a caption");
    ok(T.svg([], { x: 0, y: 0, w: 320, h: 180 }) === "", "no texts, nothing drawn");
    ok(T.csvText([lower, d.items[1]]) === 'Lower third: Ana & "Bo" (<director>) · Sound effect: POW!' && T.label(lower) === 'Lower third “Ana & "Bo"”' && T.spanText({ from: 2, to: 2 }) === "moment 2" && T.spanText({ from: 2, to: 5 }) === "moments 2 to 5", "plain words for the Settings list, the undo list and the status line");
  }
  if (X) {
    const ms = [
      { n: 1, clock: "a", note: "", values: { shotSize: "wide" }, text: "" },
      { n: 2, clock: "b", note: "", values: { shotSize: "close" }, text: "Title: The end" },
    ];
    const lines = X.csv(ms, { keys: [], label: (k) => k }).replace(/^﻿/, "").trim().split("\r\n");
    ok(lines[0] === "Moment,Time,Marker note,Text,shotSize" && lines[1] === "1,a,,,wide" && lines[2] === "2,b,,Title: The end,close", "the Settings list has a Text column once any moment has words on the frame (" + lines[0] + ")");
    ok(X.csv([ms[0]], { keys: [], label: (k) => k }).split("\r\n")[0].indexOf("Text") < 0, "and none when no moment has any");
    const sheet = X.sheetHtml({ moments: ms.map((m) => Object.assign({}, m, { svg: "<svg></svg>", changes: "" })), shape: "wide" });
    ok((sheet.match(/<p class="tx">On the frame: Title: The end<\/p>/g) || []).length === 1, "the storyboard sheet names the words under the frame that has them");
  }
  const L2 = w.CurioLanes;
  const pk = L2.textRows([{ id: "a", j0: 0, j1: 3 }, { id: "b", j0: 2, j1: 4 }, { id: "c", j0: 4, j1: 5 }, { id: "d", j0: 6, j1: 6 }]);
  ok(pk.count === 2 && pk.rowOf.a === 0 && pk.rowOf.b === 1 && pk.rowOf.c === 0 && pk.rowOf.d === 0, "the timeline's Text row puts overlapping bars on their own sub-rows, and reuses a row once it is free");
  ok(L2.textRows([]).count === 0, "no texts, no rows");
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
  /* Captions: the saved setting read back safely, and what the caption says for a moment. */
  const Cap = (saved) => { const store = { "curiosities-screen-v1": saved == null ? null : JSON.stringify(saved) }; const g = { CurioFrame: w.CurioFrame, document: { readyState: "loading", addEventListener() {} }, localStorage: { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => (store[k] = v) } }; g.window = g; vm.runInContext(fs.readFileSync(path.join(__dirname, "..", "ui.js"), "utf8"), vm.createContext(g), { filename: "ui.js" }); return g.CurioScreen.captions; };
  const K = Cap(null);
  ok(K.list().map((x) => x.label).join("|") === "My notes only|My notes and what changes", "Captions offer my notes only, or my notes and what changes, in plain words");
  ok(JSON.stringify(K.now()) === JSON.stringify({ on: false, mode: "notes" }) && JSON.stringify(Cap({ captions: { on: true, mode: "changes" } }).now()) === JSON.stringify({ on: true, mode: "changes" }) && Cap({ captions: { on: 1, mode: "nonsense" } }).now().mode === "notes" && Cap({ captions: "junk" }).now().on === false, "Captions start off with my notes only, and a saved setting is read back safely");
  const lab = (k) => ({ shotSize: "Shot size", emotion: "Emotion", volume: "Volume" })[k] || k;
  const prev = { shotSize: "wide", emotion: "calm", volume: 2 };
  const cur = { shotSize: "close", emotion: "anxious", volume: 3 };
  ok(JSON.stringify(K.caption({ marker: { note: "  the joke lands ", color: "blue" }, prev, cur, mode: "changes", label: lab })) === JSON.stringify({ kind: "note", text: "the joke lands", color: "blue" }), "a marker's note is the caption, even when what changes is asked for");
  ok(K.caption({ marker: { note: "Attention moves", auto: true }, mode: "notes" }).kind === "auto", "a note from Mark the turns is a caption too, marked as auto");
  ok(K.caption({ marker: { note: "" }, prev, cur, mode: "notes", label: lab }).kind === "" && K.caption({ prev, cur, mode: "notes", label: lab }).kind === "", "with my notes only, a moment with no note has no caption");
  const hint = K.caption({ marker: { note: "" }, prev, cur, mode: "changes", label: lab, size: (k) => ({ shotSize: 0.5, emotion: 0.9, volume: 0.1 })[k] });
  ok(hint.kind === "hint" && hint.text === "Emotion: calm → anxious · Shot size: wide → close and 1 more", "with what changes, a moment with no note shows its two biggest changes, biggest first (" + hint.text + ")");
  ok(K.caption({ prev, cur: Object.assign({}, prev), mode: "changes", label: lab }).kind === "" && K.caption({ prev: null, cur, mode: "changes", label: lab }).kind === "", "nothing changed, or the first moment: no caption");
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

/* A Details row's ⋯ menu (CurioScreenApply): all through the film, the selected stretch, reset, clear. */
{
  const A = w.CurioScreenApply;
  const E = w.CurioEngine;
  ok(!!A && ["allFilm", "stretch", "reset", "clear"].every((k) => typeof A[k] === "function"), "the ⋯ menu's command builders are exposed for tests (CurioScreenApply)");
  if (A) {
    E.reset(w.CurioSeeds.starter());
    const rr = E.state().rows;
    const n = rr.length;
    const lk = "camera|shotSize";
    E.send({ type: "batch", commands: [{ type: "setPoint", row: rr[1].id, track: "camera", curiosity: "shotSize", value: "wide" }, { type: "setPoint", row: rr[3].id, track: "camera", curiosity: "shotSize", value: "close" }, { type: "setPoint", row: rr[5].id, track: "camera", curiosity: "shotSize", value: "insert" }] });
    const film = () => JSON.stringify(E.state().lanes);
    const before = film();
    const pts = () => Object.keys(E.state().lanes[lk] ? E.state().lanes[lk].points : {}).map((id) => rr.findIndex((r) => r.id === id)).sort((a, b) => a - b);

    const all = A.allFilm(E.state(), "camera", "shotSize", "medium");
    ok(all.removed === 3 && E.send({ type: "batch", commands: all.cmds }).ok, "Use this all through the film is one batch that takes the other nodes off (" + all.removed + ")");
    const ln = E.state().lanes[lk];
    ok(pts().join() === "0" && ln.points[rr[0].id] === "medium" && ln.mode === "hold", "it leaves one node at the first moment and the lane jumps (holds)");
    ok(rr.every((r) => E.value(r.id, "camera", "shotSize") === "medium"), "so the setting is the same at every moment");
    E.undo();
    ok(film() === before, "one undo takes it back");

    const add = A.allFilm(E.state(), "camera", "composition", "center", true);
    ok(add.cmds[0].type === "addCuriosity" && E.send({ type: "batch", commands: add.cmds }).ok && E.value(rr[n - 1].id, "camera", "composition") === "center", "a curiosity not on a track yet is put on one first");
    E.undo();
    ok(film() === before, "and one undo takes that back too");

    const sk = A.stretch(E.state(), "camera", "shotSize", "medium", 4, 2);
    ok(sk.from === 2 && sk.to === 4 && sk.removed === 1 && E.send({ type: "batch", commands: sk.cmds }).ok, "Use this in the selected stretch is one batch (either end first)");
    ok(pts().join() === "1,2,4,5" && [2, 3, 4].every((j) => E.value(rr[j].id, "camera", "shotSize") === "medium"), "it holds the setting from the start to the end of the stretch, inner nodes off, the rest kept (" + pts().join() + ")");
    E.undo();
    ok(film() === before, "one undo takes the stretch back");
    const one = A.stretch(E.state(), "camera", "shotSize", "close", 2, 2);
    ok(one.cmds.length === 1 && one.cmds[0].type === "setPoint", "a stretch of one moment is one node");
    ok(!!A.stretch(E.state(), "camera", "shotSize", null, 1, 3).error, "no setting to use is refused in plain words");

    const rs = A.reset(E.state(), "camera", "shotSize", "wide");
    ok(rs.removed === 3 && rs.cmds[0].type === "setPoint" && rs.cmds[0].row === rr[0].id && rs.cmds[0].value === "wide", "Reset keeps the start as it plays now (a node at moment 1 when it had none) and takes the later nodes off");
    ok(E.send({ type: "batch", commands: rs.cmds }).ok && pts().join() === "0" && rr.every((r) => E.value(r.id, "camera", "shotSize") === "wide"), "after Reset the lane stays as the scene starts");
    E.undo();
    ok(film() === before, "one undo takes Reset back");
    E.send({ type: "batch", commands: [{ type: "clearLane", track: "camera", curiosity: "shotSize" }, { type: "setPoint", row: rr[0].id, track: "camera", curiosity: "shotSize", value: "close" }] });
    ok(/nothing to reset/.test(A.reset(E.state(), "camera", "shotSize", "close").error || ""), "Reset with nothing after the first moment says there is nothing to reset");
    E.undo();

    const cl = A.clear(E.state(), "camera", "shotSize");
    ok(cl.removed === 3 && cl.cmds.length === 1 && cl.cmds[0].type === "clearLane" && E.send({ type: "batch", commands: cl.cmds }).ok && !E.state().lanes[lk], "Clear this lane takes every node off with clearLane");
    E.undo();
    ok(film() === before, "one undo brings the lane back");
    ok(/nothing to clear/.test(A.clear(E.state(), "camera", "cameraMove").error || ""), "clearing a lane with no nodes says there is nothing to clear");
  }
}

/* Look ▾ (CurioScreenLook): copy a whole moment's look, paste it onto another moment or over a stretch. */
{
  const K = w.CurioScreenLook;
  const E = w.CurioEngine;
  const S = w.CurioScale;
  ok(!!K && ["copy", "paste", "clean"].every((k) => typeof K[k] === "function"), "the look's command builders are exposed for tests (CurioScreenLook)");
  if (K) {
    E.reset(w.CurioSeeds.starter());
    const rr = E.state().rows;
    const locks = {};
    const h = (st) => ({
      value: (rid, t, c) => E.value(rid, t, c),
      trackOf: (c) => (st.tracks.find((t) => t.curiosities.includes(c)) || {}).id || null,
      trackFor: (c) => w.CurioLanes.trackFor(c, st),
      locked: (lk) => !!locks[lk],
      fix: (c, v) => S.fix(c, v),
      start: (c) => S.start(c),
      known: (c) => S.known(c),
      limit: E.LIMIT.perTrack,
    });
    /* The film's lanes in a fixed order (an undo can put a lane's points back in another order). */
    const film = () => { const l = E.state().lanes; return JSON.stringify(Object.keys(l).sort().map((k) => [k, l[k].on, l[k].mode, Object.keys(l[k].points).sort().map((r) => [r, l[k].points[r]])])); };
    const plays = (j) => { const st = E.state(); const out = {}; st.tracks.forEach((t) => t.curiosities.forEach((c) => c in out || (out[c] = String(S.fix(c, E.value(st.rows[j].id, t.id, c)))))); return out; };
    E.send({ type: "batch", commands: [{ type: "setPoint", row: rr[2].id, track: "camera", curiosity: "shotSize", value: "close" }, { type: "setPoint", row: rr[6].id, track: "camera", curiosity: "shotSize", value: "wide" }, { type: "setPoint", row: rr[4].id, track: "camera", curiosity: "shotSize", value: "medium" }] });
    const before = film();
    const curs = [...new Set([].concat(...E.state().tracks.map((t) => t.curiosities)))].filter((c) => S.known(c));
    const lk = K.copy(E.state(), 2, h(E.state()));
    ok(!lk.error && lk.from === 2 && lk.row === rr[2].id && lk.count === Object.keys(lk.values).length && lk.count === curs.length, "Copy takes a setting for every curiosity on a track at that moment (" + lk.count + ")");
    ok(lk.values.shotSize === "close" && Object.keys(lk.values).every((c) => String(lk.values[c]) === plays(2)[c]), "the copied settings are what the moment plays, after the engine's rewrite");
    ok(film() === before, "copying changes nothing in the film");
    ok(!!K.copy(E.state(), 99, h(E.state())).error, "copying a moment that is not there is refused in plain words");

    const p = K.paste(E.state(), lk, 5, 5, h(E.state()));
    ok(!p.error && p.changed.length + p.matched.length === lk.count && p.changed.length > 0 && p.locked.length === 0, "Paste sorts every setting into changed or already matched (" + p.changed.length + " changed, " + p.matched.length + " matched)");
    ok(p.cmds.every((c) => c.type === "setPoint" && c.row === rr[5].id) && p.cmds.length === p.changed.length, "one moment gets one node per setting that differs, at that moment only");
    ok(E.send({ type: "batch", commands: p.cmds }).ok, "the paste is one batch");
    ok(Object.keys(lk.values).every((c) => plays(5)[c] === String(lk.values[c])), "afterwards moment 6 plays moment 3's look");
    ok(K.paste(E.state(), lk, 5, 5, h(E.state())).changed.length === 0, "pasting again changes nothing: every setting already matches");
    E.undo();
    ok(film() === before, "one undo takes the paste back");

    locks["camera|shotSize"] = true;
    const pl = K.paste(E.state(), lk, 5, 5, h(E.state()));
    ok(pl.locked.join() === "shotSize" && !pl.cmds.some((c) => c.curiosity === "shotSize"), "a locked lane is skipped and named");
    delete locks["camera|shotSize"];

    const ps = K.paste(E.state(), lk, 6, 3, h(E.state()));
    ok(ps.from === 3 && ps.to === 6 && E.send({ type: "batch", commands: ps.cmds }).ok, "a stretch is one batch (either end first)");
    const ln = E.state().lanes["camera|shotSize"];
    ok(ln.points[rr[3].id] === "close" && ln.points[rr[6].id] === "close" && ln.points[rr[4].id] == null && ln.points[rr[2].id] === "close", "over a stretch a lane gets a node at the start and the end, the nodes between taken off, the rest kept");
    ok([3, 4, 5, 6].every((j) => Object.keys(lk.values).every((c) => plays(j)[c] === String(lk.values[c]))), "so every moment of the stretch plays the look");
    E.undo();
    ok(film() === before, "one undo takes the stretch back");

    const extra = { values: Object.assign({ composition: "right third" }, lk.values), from: 2 };
    const pa = K.paste(E.state(), extra, 1, 1, h(E.state()));
    ok(pa.added.join() === "composition" && pa.cmds[0].type === "addCuriosity" && pa.cmds[0].curiosity === "composition" && E.send({ type: "batch", commands: pa.cmds }).ok, "a curiosity not on a track yet is put on one first (" + pa.added.join() + ")");
    E.undo();
    ok(film() === before, "and one undo takes that back too");
    ok(!!K.paste(E.state(), null, 1, 1, h(E.state())).error, "pasting with nothing copied is refused in plain words");

    const c = K.clean(JSON.parse(JSON.stringify(lk)));
    ok(c && c.count === lk.count && c.from === 2 && c.values.shotSize === "close", "the copied look comes back from storage as it went in");
    ok(K.clean(null) === null && K.clean({ values: [] }) === null && K.clean({ values: { a: {} } }) === null && K.clean("x") === null, "a broken stored look is dropped quietly");
  }
}

/* Graded lanes ("eyeline.speaking") in the pickers, and one lane per track when several tracks carry the same
   curiosity (one per character): paste, suite clips and templates, a moment's look, and lane names keep each
   track's own lane. */
{
  const CL = w.CurioLanes;
  const E = w.CurioEngine;
  const S = w.CurioScale;
  ok(["laneParts", "partTrack", "lkName"].every((k) => typeof CL[k] === "function"), "the graded-lane helpers are exposed (laneParts, partTrack, lkName)");
  /* A stand-in database: eyeline's bare lane is only off or on; its graded setting and Speaking now are graded. */
  const rows = {
    eyeline: { id: "eyeline", label: "Eyelines", main: "setting", sliders: [{ id: "setting", label: "Eyelines", scale: ["no one meets", "glances"] }, { id: "hold", label: "How long", range: { min: 0, max: 5 } }, { id: "speaking", label: "Speaking now", scale: ["listening", "speaking"] }] },
    shotSize: { id: "shotSize", label: "Shot size", main: "setting", sliders: [{ id: "setting", scale: ["wide", "close"] }, { id: "who", label: "Who it frames", scale: ["whoever is shown", "the first character"] }, { id: "headroom", label: "Headroom", scale: ["a", "b"] }] },
    focus: { id: "focus", label: "Focus", sliders: [{ id: "speed", label: "Speed", scale: ["x", "y"] }, { id: "pull", label: "Focus pull", scale: ["x", "y"], lane: true, track: "camera" }] },
  };
  const fake = (have) => ({ row: (id) => rows[id] || null, known: (k) => have.includes(k), auto: (id) => (id === "eyeline" ? { kind: "choice", options: ["off", "on"] } : { kind: "choice", options: ["a", "b"] }) });
  const all = ["eyeline.setting", "eyeline.speaking", "eyeline.hold", "shotSize.who", "shotSize.headroom", "focus.speed", "focus.pull"];
  const ey = CL.laneParts("eyeline", fake(all));
  ok(ey.parts.map((p) => p.key).join() === "eyeline.setting,eyeline.speaking" && ey.bareSecond && ey.parts[0].main && ey.parts[0].label === "Eyelines" && ey.parts[1].label === "Eyelines: Speaking now", "an off-or-on curiosity offers its graded setting first (its bare lane second), then its staging lanes, with plain names; other sliders are not offered");
  ok(ey.parts.every((p) => p.track === "character"), "Eyelines' graded lanes go on character tracks, one per character");
  const ey2 = CL.laneParts("eyeline", fake(["eyeline.setting"]));
  ok(ey2.parts.map((p) => p.key).join() === "eyeline.setting" && ey2.bareSecond, "a graded lane the database does not grade in this build is not offered (no Speaking now without it)");
  const ss = CL.laneParts("shotSize", fake(all));
  ok(ss.parts.map((p) => p.key).join() === "shotSize.who" && !ss.bareSecond && ss.parts[0].track === "camera", "a graded curiosity keeps its bare lane first and offers Who it frames, on the camera track");
  const fo = CL.laneParts("focus", fake(all));
  ok(fo.parts.map((p) => p.key).join() === "focus.pull" && fo.parts[0].track === "camera", "a slider the database marks lane: true is offered too, on the track it names");
  ok(CL.laneParts("nothing", fake(all)).parts.length === 0 && CL.laneParts("eyeline.speaking", fake(all)).parts.length === 0, "nothing is offered for an unknown curiosity or a lane key");
  ok(CL.partTrack("eyeline.speaking", fake(all)) === "character" && CL.partTrack("shotSize.who", fake(all)) === "camera" && CL.partTrack("shotSize", fake(all)) === "", "partTrack says which kind of track a graded lane goes on");
  /* The real database in this build: Eyelines' graded setting is there; the rest only once the 3D staging lanes are. */
  const real = CL.laneParts("eyeline");
  ok(real.parts.some((p) => p.key === "eyeline.setting") && real.parts.every((p) => S.known(p.key)), "with the real database, Eyelines offers its graded setting (" + real.parts.map((p) => p.key).join(", ") + ")");

  /* Two tracks carrying the same curiosity. */
  E.reset(w.CurioSeeds.starter());
  let st = E.state();
  const two = st.tracks.filter((t) => t.kind === "character" && t.curiosities.includes("characterPath"));
  ok(two.length === 2, "the starter film has characterPath on both character tracks");
  const [A, B] = two.map((t) => t.id);
  const rr = st.rows;
  ok(CL.lkName(A + "|characterPath") === S.label("characterPath") + " · " + two[0].label && CL.lkName("camera|shotSize") === S.label("shotSize"), "a lane's name carries its track only when several tracks carry the curiosity (" + CL.lkName(B + "|characterPath") + ")");
  const gv = S.domain("characterPath").options;
  E.send({ type: "batch", commands: [{ type: "setPoint", row: rr[0].id, track: A, curiosity: "characterPath", value: gv[0] }, { type: "setPoint", row: rr[1].id, track: A, curiosity: "characterPath", value: gv[1] }, { type: "setPoint", row: rr[0].id, track: B, curiosity: "characterPath", value: gv[gv.length - 1] }] });
  st = E.state();
  const lanes = [A, B].map((t) => ({ cur: "characterPath", track: t, lk: t + "|characterPath" }));
  const c = CL.copyArea(st, lanes, { i0: 0, i1: 1, j0: 0, j1: 1 });
  ok(c.lanes.length === 2 && c.lanes[0].track === A && c.lanes[1].track === B, "copying an area keeps each track's lane");
  const pc = CL.pasteAreaCommands(st, c, [{ cur: "characterPath", track: A }, { cur: "characterPath", track: B }], 4);
  const onA = pc.cmds.filter((x) => x.type === "setPoint" && x.track === A);
  const onB = pc.cmds.filter((x) => x.type === "setPoint" && x.track === B);
  ok(onA.length >= 2 && onB.length >= 1 && onA.some((x) => x.value === gv[1]) && onB.every((x) => x.row !== rr[5].id || x.value === E.value(rr[1].id, B, "characterPath")), "pasting onto two tracks with the same curiosity writes each track's own lane (not both onto the first)");
  ok(E.send({ type: "batch", commands: pc.cmds }).ok && E.state().lanes[B + "|characterPath"].points[rr[4].id] === gv[gv.length - 1] && E.state().lanes[A + "|characterPath"].points[rr[4].id] === gv[0], "after the paste each track plays its own copy");
  E.undo();
  st = E.state();
  const clip = CL.suiteClip(CL.copyArea(st, lanes.slice(1), { i0: 0, i1: 0, j0: 0, j1: 1 }), "B only");
  const tg = CL.suiteClipTargets(st, clip, lanes);
  ok(tg.targets.length === 1 && tg.targets[0].track === B, "a suite clip or template from the second track lands on the second track's row, not the first one with that curiosity");

  /* A moment's look with two tracks of the same curiosity. */
  const K = w.CurioScreenLook;
  const h = (perTrack) => ({ value: (rid, t, cc) => E.value(rid, t, cc), trackOf: (cc) => (st.tracks.find((t) => t.curiosities.includes(cc)) || {}).id || null, trackFor: (cc) => CL.trackFor(cc, st), locked: () => false, fix: (cc, v) => S.fix(cc, v), start: (cc) => S.start(cc), known: (cc) => S.known(cc), limit: E.LIMIT.perTrack, perTrack });
  const lk = K.copy(st, 0, h(true));
  ok(lk.byTrack && lk.byTrack[A + "|characterPath"] === gv[0] && lk.byTrack[B + "|characterPath"] === gv[gv.length - 1] && lk.values.characterPath === gv[0], "copying a moment's look keeps each track's own setting of a shared curiosity");
  E.send({ type: "setPoint", row: rr[2].id, track: B, curiosity: "characterPath", value: gv[1] });
  st = E.state();
  const p = K.paste(st, lk, 3, 3, h(true));
  const gB = p.cmds.find((x) => x.curiosity === "characterPath" && x.track === B);
  const gA = p.cmds.find((x) => x.curiosity === "characterPath" && x.track === A);
  ok(gA && gA.value === gv[0] && gB && gB.value === gv[gv.length - 1] && p.changed.filter((x) => x === "characterPath").length === 1, "pasting it gives each track its own setting back, counted once");
  ok(K.clean(JSON.parse(JSON.stringify(lk))).byTrack[B + "|characterPath"] === gv[gv.length - 1] && !K.clean({ values: { a: 1 }, byTrack: { "x|b": 2 } }).byTrack, "the per-track settings come back from storage, and stray ones are dropped");
}

/* History ▾ (CurioScreenHistory): the undo and redo lists turned into the rows the menu draws. */
{
  const H = w.CurioScreenHistory;
  ok(!!H && typeof H.rows === "function" && typeof H.plain === "function", "History's rows builder is exposed for tests (CurioScreenHistory)");
  if (H) {
    ok(H.plain("Engine: Set a node") === "Set a node" && H.plain("Change the board") === "Change the board" && H.plain("") === "Change" && H.plain(null) === "Change", "a step's plain name drops the engine's prefix");
    const r = H.rows({ undo: ["A", "Engine: B", "C"], redo: ["D", "E"] });
    ok(r.undo.map((x) => x.label).join() === "C,B,A" && r.undo.map((x) => x.steps).join() === "0,1,2", "undo steps are newest first, each with how many undos go back to just after it");
    ok(r.redo.map((x) => x.label).join() === "E,D" && r.redo.map((x) => x.steps).join() === "2,1", "redo steps are furthest first (the next one sits next to Now), each with how many redos reach it");
    ok(r.earlier === 0 && r.later === 0 && r.all === 3, "nothing is hidden when the lists are short");
    const many = Array.from({ length: 45 }, (_, i) => "Step " + (i + 1));
    const m = H.rows({ undo: many, redo: many.slice(0, 33) });
    ok(m.undo.length === 30 && m.undo[0].label === "Step 45" && m.undo[29].label === "Step 16" && m.earlier === 15 && m.all === 45, "at most the last 30 undo steps, with how many earlier ones are not shown");
    ok(m.redo.length === 30 && m.redo[29].steps === 1 && m.later === 3, "and at most the next 30 redo steps");
    ok(H.rows({ undo: many }, 5).undo.length === 5 && H.rows({ undo: many }, 5).earlier === 40, "the limit can be set");
    const e = H.rows(null);
    ok(!e.undo.length && !e.redo.length && e.all === 0 && H.rows({ undo: "x" }).undo.length === 0, "no history (or a broken one) gives empty lists");
  }
}

/* Transitions between moments (CurioScreenTransitions): Cut, Fade, Wipe, Push, Zoom and Match on the joins of My
   film, kept per join by the number of the moment it leads into; and Export lists them. */
{
  const T = w.CurioScreenTransitions;
  ok(!!T && typeof T.set === "function" && typeof T.blend === "function", "the transition helpers are exposed for tests (CurioScreenTransitions)");
  if (T) {
    ok(T.KINDS.map((k) => k[0]).join() === "cut,fade,wipe,push,zoom,match", "six transitions: Cut, Fade, Wipe, Push, Zoom and Match");
    ok(T.KINDS.every(([id, label, tip]) => tip.startsWith(label + ": ") && tip.length < 100 && !/dissolve|keyframe|interpolat/i.test(tip)), "each has a one-line tooltip in plain words");
    ok(T.KINDS.find((k) => k[0] === "fade")[2] === "Fade: the picture melts into the next one.", "Fade's tooltip: the picture melts into the next one");
    const empty = T.clean(null);
    ok(JSON.stringify(empty) === '{"joins":{}}' && T.at(empty, 3).kind === "cut" && T.at(empty, 3).len === 0.5, "with nothing saved every join is a Cut (the default)");
    const a = T.set(empty, 3, "fade", 0.25);
    ok(T.at(a, 3).kind === "fade" && T.at(a, 3).len === 0.25 && T.at(a, 4).kind === "cut" && JSON.stringify(empty) === '{"joins":{}}', "setting the join into moment 3 changes only that join, on a copy");
    const b = T.set(a, 3, "push");
    ok(T.at(b, 3).kind === "push" && T.at(b, 3).len === 0.25, "picking another kind keeps the join's length");
    ok(!T.set(b, 3, "cut").joins["3"], "Cut takes the join off (cuts are not kept)");
    ok(!Object.keys(T.set(empty, 1, "fade").joins).length && !Object.keys(T.set(empty, 3, "spin").joins).length, "moment 1 has no join before it, and an unknown kind is refused");
    const all = T.all(b, 5, "zoom", 0.75);
    ok(Object.keys(all.joins).join() === "2,3,4,5" && Object.values(all.joins).every((t) => t.kind === "zoom" && t.len === 0.75), "Use on every join gives every join of a 5-moment film the same kind and length");
    ok(!Object.keys(T.all(all, 5, "cut").joins).length, "Use on every join with Cut clears them all");
    const dirty = T.clean({ joins: { 2: { kind: "wipe", len: 7 }, x: { kind: "fade" }, 0: { kind: "fade" }, 4: { kind: "nope" }, 5: "fade", 6: { kind: "cut" } } });
    ok(JSON.stringify(dirty) === '{"joins":{"2":{"kind":"wipe","len":1}}}', "a broken save is cleaned quietly (lengths kept between a tenth and a whole moment)");
    ok(T.label({ kind: "fade", len: 0.5 }) === "Fade, half a moment" && T.label({ kind: "cut" }) === "Cut" && T.label({ kind: "match", len: 1 }) === "Match, a whole moment", "plain labels for each choice");
    const ls = T.list(T.set(T.set(empty, 2, "wipe", 1), 4, "fade"), 4);
    ok(ls.length === 2 && ls[0].into === 2 && ls[0].text === "Wipe, a whole moment" && ls[1].into === 4 && ls[1].text === "Fade, half a moment", "the list for Export: every join that isn't a Cut, in order");
    /* Styles at the middle of the transition. */
    ok(T.style("fade", 0.5).old.opacity === "0.5" && T.style("fade", 0).old.opacity === "1" && T.style("fade", 1).old.opacity === "0", "Fade: the picture going out melts from fully there to gone");
    ok(T.style("wipe", 0.5).old.clipPath === "inset(0px 0px 0px 50%)", "Wipe: halfway, the left half shows the new picture");
    ok(T.style("push", 0.5).old.transform === "translateX(-50%)" && T.style("push", 0.5).cur.transform === "translateX(50%)", "Push: halfway, both pictures share the frame side by side");
    ok(/^scale\(1\.3\)$/.test(T.style("zoom", 0.5).old.transform) && T.style("zoom", 0.5).old.opacity === "0.5", "Zoom: the picture going out grows and fades");
    ok(!Object.keys(T.style("cut", 0.5).old).length && !Object.keys(T.style("match", 0.5).old).length, "Cut and Match move nothing with CSS");
    /* Match: only the settings that change move, by their place on the scale. */
    const dom = (k) => (k === "shotSize" ? { kind: "choice", options: ["extreme wide", "wide", "medium", "close", "extreme close"] } : k === "level" ? { kind: "range", min: 0, max: 10, step: 1 } : null);
    const from = { shotSize: "extreme wide", level: 0, mood: "calm", same: "x" };
    const to = { shotSize: "extreme close", level: 10, mood: "angry", same: "x" };
    const mid = T.blend(from, to, 0.5, dom);
    ok(mid.shotSize === "medium" && mid.level === 5 && mid.same === "x" && mid.mood === "angry", "Match halfway: a shot moves to the middle of its scale, a number halfway, the rest switch at the middle (" + JSON.stringify(mid) + ")");
    ok(JSON.stringify(T.blend(from, to, 0, dom)) === JSON.stringify(from) && JSON.stringify(T.blend(from, to, 1, dom)) === JSON.stringify(to), "Match starts at the moment before and ends at the new one");
    ok(T.blend(from, to, 0.25, dom).shotSize === "wide" && T.blend({ a: 1 }, { b: 2 }, 0.2).a === 1, "Match a quarter in, and settings only one side has");
  }
  const X = w.CurioScreenExport;
  if (X) {
    const ms = [
      { n: 1, clock: "0", note: "", values: { shotSize: "wide" } },
      { n: 2, clock: "3", note: "", values: { shotSize: "close" }, transition: "Fade, half a moment" },
      { n: 3, clock: "6", note: "", values: { shotSize: "close" } },
    ];
    const lines = X.csv(ms, { keys: [], label: (k) => k }).replace(/^﻿/, "").split("\r\n");
    ok(lines[0] === "Moment,Time,Marker note,Transition in,shotSize" && lines[1] === "1,0,,,wide" && lines[2] === "2,3,,\"Fade, half a moment\",close" && lines[3] === "3,6,,Cut,close", "the settings list has a Transition in column once a join has one (" + lines.slice(0, 4).join(" | ") + ")");
    ok(!X.csv([ms[0], ms[2]], { keys: [], label: (k) => k }).includes("Transition in"), "and none when every join is a cut");
    const sheet = X.sheetHtml({ moments: ms.map((m) => Object.assign({ svg: "<svg></svg>" }, m)) });
    ok(sheet.includes("Comes in with: Fade, half a moment") && (sheet.match(/class="tr"/g) || []).length === 1, "the storyboard sheet says how each moment comes in, where it isn't a cut");
  }
}

/* Ripple (CurioScreenRipple): add a copy of a moment, duplicate a stretch, take moments out; nodes, joins, the
   moment's own material, transitions, words, markers and the play range all move together, nothing jumps. */
{
  const R = w.CurioScreenRipple;
  const E = w.CurioEngine;
  const Sc = w.CurioScale;
  ok(!!R && ["insert", "remove", "joins", "texts", "markers", "range", "laneValues"].every((k) => typeof R[k] === "function"), "the ripple helpers are exposed for tests (CurioScreenRipple)");
  if (R) {
    const h = (locked) => ({ S: Sc, locked: (lk) => (locked || []).includes(lk), maxRows: E.LIMIT.rows, maxLinks: E.LIMIT.links });
    /* What every cell of the film plays, moment by moment (the engine's result after links and pins). */
    const plays = () => {
      const st = E.state();
      return st.rows.map((r) => st.tracks.map((t) => t.curiosities.map((c) => String(E.value(r.id, t.id, c))).join(",")).join(";"));
    };
    E.reset(w.CurioSeeds.starter());
    let rr = E.state().rows;
    const lo = Sc.at("emotionIntensity", 0);
    const hi = Sc.at("emotionIntensity", 1);
    E.send({ type: "batch", commands: [
      { type: "setPoint", row: rr[1].id, track: "master", curiosity: "emotionIntensity", value: lo },
      { type: "setPoint", row: rr[6].id, track: "master", curiosity: "emotionIntensity", value: hi },
      { type: "setPoint", row: rr[2].id, track: "camera", curiosity: "shotSize", value: "close" },
      { type: "setPoint", row: rr[4].id, track: "camera", curiosity: "shotSize", value: "wide" },
      { type: "laneMode", track: "camera", curiosity: "shotSize", mode: "hold" },
      { type: "edit", row: rr[3].id, track: "char1", curiosity: "volume", value: Sc.fix("volume", Sc.at("volume", 1)) },
    ] });
    const join = w.CurioLanes.linkCommand(E.state(), { row: rr[1].id, track: "master", cur: "emotionIntensity" }, { row: rr[4].id, track: "camera", cur: "shotSize" });
    ok(E.send(join).ok, "ripple setup: a glide, a held lane, a pin and a join across moments 2 to 5");
    const drift0 = E.drift().length;

    /* Add a moment here: a copy of moment 4 (in the middle of the glide, and the pinned moment) after it. */
    let before = plays();
    let st = E.state();
    const add = R.insert(st, 3, 3, h());
    ok(!add.error && add.k === 1 && add.ids.length === 1 && add.cmds[0].type === "addRow" && add.cmds[0].at === 4, "Add a moment here plans one new moment right after the playhead's");
    ok(E.send({ type: "batch", label: "Add a moment after moment 4", commands: add.cmds }).ok, "the engine takes it as one batch");
    st = E.state();
    let after = plays();
    ok(st.rows.length === 9 && st.rows[4].id === add.ids[0] && st.rows[4].label === "Copy of moment 4", "the film is one moment longer and the copy sits at moment 5, the id the plan expected");
    ok(JSON.stringify(after) === JSON.stringify(before.slice(0, 4).concat([before[3]], before.slice(4))), "nothing jumps: the copy plays exactly what moment 4 plays, and every other moment plays what it did");
    ok(st.lanes["master|emotionIntensity"].points[rr[6].id] === hi && st.lanes["camera|shotSize"].points[rr[4].id] === "wide", "the nodes after it slid along with their moments (they are kept by moment)");
    ok(st.edits[add.ids[0] + "|char1|volume"] && st.edits[add.ids[0] + "|char1|volume"].v === st.edits[rr[3].id + "|char1|volume"].v, "the copy keeps moment 4's pin (hand edit)");
    const lnk = st.links.find((l) => l.scope && l.scope.from === rr[1].id);
    ok(lnk && lnk.within === 4, "the join across it now spans one more moment (within 3 → " + (lnk && lnk.within) + ")");
    ok(E.drift().length === drift0, "the ripple leaves nothing the engine would change on a reload");
    E.undo();
    ok(JSON.stringify(plays()) === JSON.stringify(before) && E.state().rows.length === 8, "one undo takes it back");

    /* Duplicate moments 2 to 5: the join inside is copied, the copies play the same. */
    before = plays();
    st = E.state();
    const dup = R.insert(st, 1, 4, h());
    ok(!dup.error && dup.k === 4 && dup.links === 1, "Duplicate moments 2 to 5 plans 4 copies and a copy of the join inside them");
    ok(E.send({ type: "batch", commands: dup.cmds }).ok, "duplicating is one batch");
    st = E.state();
    after = plays();
    ok(st.rows.length === 12 && JSON.stringify(after) === JSON.stringify(before.slice(0, 5).concat(before.slice(1, 5), before.slice(5))), "the copies (moments 6 to 9) play what moments 2 to 5 play, and the rest is unchanged");
    const copied = st.links.find((l) => l.scope && l.scope.from === dup.ids[0]);
    ok(copied && copied.scope.to === dup.ids[3] && copied.within === 3, "the copied join links the copies' nodes, with the same gap");
    E.undo();

    /* Take out moments 3 to 4: the join from 2 to 5 spans the gap, the nodes there go, the rest keeps playing. */
    before = plays();
    st = E.state();
    const del = R.remove(st, 2, 3, h());
    ok(!del.error && del.k === 2 && del.nodes === 1 && del.cmds.filter((c) => c.type === "removeRow").length === 2, "Take out moments 3 to 4 plans two moments out, and the one node on them");
    ok(E.send({ type: "batch", commands: del.cmds }).ok, "taking out is one batch");
    st = E.state();
    after = plays();
    ok(st.rows.length === 6 && JSON.stringify(after) === JSON.stringify(before.slice(0, 2).concat(before.slice(4))), "every moment left plays what it played before: the glide keeps its shape around the gap (nodes put in where it would have changed)");
    const kept = st.links.find((l) => l.scope && l.scope.from === rr[1].id);
    ok(kept && kept.within === 1 && kept.scope.to === rr[4].id, "the join across the gap now spans 2 fewer moments");
    E.undo();
    const del2 = R.remove(E.state(), 4, 4, h());
    ok(del2.links === 1 && del2.cmds[0].type === "removeLink", "taking out a moment with a joined node takes the join too (it would otherwise become a rule for the whole lane)");
    ok(R.remove(E.state(), 0, 7, h()).error && R.insert(E.state(), 0, 60, h()).error && R.insert(E.state(), 3, 2, h()).error, "the last moment can't go, a film can't grow past its limit, and a backwards stretch is refused");

    /* Locked lanes: nothing is added to or taken off them; their nodes still slide along with their moments. */
    const lockShot = h(["camera|shotSize"]);
    const ref = R.remove(E.state(), 2, 3, lockShot);
    ok(!!ref.error && ref.locked === "camera|shotSize" && /locked/.test(ref.error), "taking out a moment with a node on a locked lane is refused, with a plain reason");
    const insL = R.insert(E.state(), 2, 2, lockShot);
    ok(!insL.error && !insL.cmds.some((c) => c.type === "setPoint" && c.curiosity === "shotSize") && !insL.cmds.some((c) => c.type === "addLink"), "a copy of a moment gets no node (and no join) on a locked lane");
    ok(R.remove(E.state(), 5, 5, lockShot).ok !== false && !R.remove(E.state(), 5, 5, lockShot).error, "a moment with no node on the locked lane can still be taken out");

    /* The Screen's own things. */
    const J = { 2: { kind: "fade" }, 3: { kind: "wipe" }, 4: { kind: "push" }, 5: { kind: "zoom" }, 6: { kind: "match" } };
    ok(JSON.stringify(Object.keys(R.joins(J, { kind: "insert", a: 2, b: 2 }))) === '["2","3","5","6","7"]' && R.joins(J, { kind: "insert", a: 2, b: 2 })["5"].kind === "push", "transitions: a copy of moment 3 comes in on a cut, and the joins after it move one later");
    const jd = R.joins(J, { kind: "insert", a: 1, b: 3 });
    ok(jd["3"].kind === "wipe" && jd["4"].kind === "push" && !jd["5"] && jd["6"].kind === "wipe" && jd["7"].kind === "push" && jd["8"].kind === "zoom" && jd["9"].kind === "match", "transitions: duplicating moments 2 to 4 copies the joins inside the stretch onto the copies");
    const jr = R.joins(J, { kind: "delete", a: 2, b: 3 });
    ok(JSON.stringify(jr) === JSON.stringify({ 2: { kind: "fade" }, 3: { kind: "zoom" }, 4: { kind: "match" } }), "transitions: taking out moments 3 and 4 drops their joins; moment 5 keeps the way it comes in");
    ok(!Object.keys(R.joins({ 3: { kind: "fade" } }, { kind: "delete", a: 0, b: 1 })).length, "transitions: a join that would lead into moment 1 goes");
    const T = [{ id: "t1", from: 1, to: 3 }, { id: "t2", from: 4, to: 5 }, { id: "t3", from: 1, to: 2 }, { id: "t4", from: 3, to: 3 }];
    const ti = R.texts(T, { kind: "insert", a: 2, b: 2 }).items;
    ok(ti[0].to === 4 && ti[1].from === 5 && ti[1].to === 6 && ti[2].to === 2 && ti[3].from === 3 && ti[3].to === 4 && ti.length === 4, "words: over the playhead's moment they run on over the copy; after it they slide along");
    const tdup = R.texts([{ id: "t1", from: 2, to: 3 }, { id: "t2", from: 3, to: 6 }, { id: "t3", from: 5, to: 5 }], { kind: "insert", a: 1, b: 3 });
    ok(tdup.copied === 1 && tdup.items.find((t) => t.id === "t4" && t.from === 5 && t.to === 6) && tdup.items[1].to === 9 && tdup.items[2].from === 8, "words: duplicating moments 2 to 4 copies words wholly inside the stretch onto the copies");
    const tdel = R.texts([{ id: "t1", from: 1, to: 5 }, { id: "t2", from: 2, to: 3 }, { id: "t3", from: 3, to: 6 }, { id: "t4", from: 4, to: 4 }], { kind: "delete", a: 1, b: 2 });
    ok(tdel.gone === 1 && JSON.stringify(tdel.items.map((t) => [t.id, t.from, t.to])) === JSON.stringify([["t1", 1, 3], ["t3", 2, 4], ["t4", 2, 2]]), "words: taking out moments 2 and 3 shortens words over them and drops words wholly inside");
    ok(R.markers([{ row: "r3" }, { row: "r5" }], ["r3"]).length === 1 && R.markers([{ row: "r3" }], []).length === 1, "markers ride along by moment; one on a moment taken out goes");
    ok(JSON.stringify(R.range([1, 4], { kind: "insert", a: 4, b: 4 })) === "[1,5]" && JSON.stringify(R.range([5, 7], { kind: "insert", a: 2, b: 3 })) === "[7,9]" && JSON.stringify(R.range([1, 6], { kind: "delete", a: 2, b: 3 })) === "[1,4]" && R.range([2, 3], { kind: "delete", a: 2, b: 3 }) === null, "the play range grows, slides or shrinks with them");
    ok(JSON.stringify(R.freshIds({ next: 3, rows: [{ id: "r4" }], tracks: [], links: [{ id: "r3" }] }, 2)) === '["r5","r6"]', "new moment ids are worked out the engine's way (skipping ids in use)");
  }
}

/* Quick find (⌘K): the matcher, the grouping and the recent picks, from ui.js with no page. */
{
  const g = { CurioFrame: w.CurioFrame, CurioLevels: w.CurioLevels, document: { readyState: "loading", addEventListener() {} }, localStorage: { getItem: () => null, setItem() {} } };
  g.window = g;
  vm.runInContext(fs.readFileSync(path.join(__dirname, "..", "ui.js"), "utf8"), vm.createContext(g), { filename: "ui.js" });
  const Q = g.CurioScreenFind;
  ok(!!Q && typeof Q.score === "function" && typeof Q.rank === "function" && Q.KEY === "curiosities-screen-find-v1" && Q.MAX === 8, "Quick find's matcher is exposed for tests (CurioScreenFind), its recent picks kept under curiosities-screen-find-v1, 8 of them");
  if (Q) {
    ok(Q.norm("  Compare ◐: Turn ON ") === "compare turn on" && Q.norm("Café") === "cafe" && Q.norm(null) === "", "words are matched in plain lower case, accents and signs left out");
    ok(Q.score("shot", "Shot size") > Q.score("shot", "Snapshot") && Q.score("shot", "Snapshot") > 0, "a word that starts a word beats one found inside a word");
    ok(Q.score("size", "Shot size") > Q.score("size", "Resize") && Q.score("shot", "Shot size") > Q.score("size", "Shot size"), "the first word counts most, then any word start, then letters inside");
    ok(Q.score("size shot", "Shot size") > 0 && Q.score("sh si", "Shot size") > 0, "words can be typed in any order, and partly");
    ok(Q.score("shot zoom", "Shot size") === 0 && Q.score("xyz", "Shot size") === 0, "every word typed must be found, or it is no match");
    ok(Q.score("shotsize", "Shot size") > 0, "letters run together still find the label");
    ok(Q.score("wide", "Shot size", "How much of the scene is in the frame: wide to close") > 0 && Q.score("wide", "Shot size", "") === 0 && Q.score("shot", "Shot size", "") > Q.score("wide", "Shot size", "wide to close"), "the plain description is searched too, below the label");
    ok(Q.score("shot size", "Shot size") > Q.score("shot size", "Shot size change") && Q.score("moment 12", "Moment 12") > Q.score("moment 1", "Moment 12") && Q.score("moment 12", "Moment 1") === 0, "the exact label first, then labels that start with what was typed; moment 12 is not moment 1");
    const items = [
      { id: "cur:a", group: "cur", label: "Snapshot", words: "" },
      { id: "cur:b", group: "cur", label: "Shot size", words: "how big" },
      { id: "act:c", group: "act", label: "Export a storyboard sheet", words: "print every shot" },
      { id: "moment:r5", group: "moment", label: "Moment 5: the shot lands", words: "marker red" },
      { id: "suite:d", group: "suite", label: "Handheld hunt", words: "" },
    ];
    const r = Q.rank("shot", items);
    ok(r.map((x) => x.group).join() === "cur,moment,act" && r[0].items.map((x) => x.id).join() === "cur:b,cur:a", "results come in groups, best group first, each best first, groups with nothing left out (" + r.map((x) => x.group + ":" + x.items.map((i) => i.id).join("/")).join(" ") + ")");
    ok(Q.rank("shot", items, { cur: 1 })[0].items.length === 1 && Q.rank("shot", items, { cur: 1 })[0].more === 1, "each group shows at most its limit, and says how many more there are");
    ok(Q.rank("joke", [{ id: "moment:r1", group: "moment", label: "Moment 2: the joke lands", words: "marker" }])[0].items[0].id === "moment:r1" && Q.rank("red", items)[0].group === "moment", "a marker is found by its note, or by its color");
    const notes = [{ id: "cur:k", group: "cur", label: "Kind of joke", words: "" }, { id: "moment:r5", group: "moment", label: "Moment 5: the joke lands", words: "marker", boost: 1.5 }];
    ok(Q.rank("joke", notes)[0].group === "moment" && Q.rank("kind", notes).length === 1 && Q.rank("kind", notes)[0].group === "cur", "your own marker note comes before a curiosity that matches the same word, but a boost never makes a match");
    ok(Q.rank("zzz", items).length === 0, "nothing found: no groups");
    ok(Q.GROUPS.map((x) => x[1]).join() === "Curiosities,Suites,Actions,Moments and markers", "the groups are Curiosities, Suites, Actions, and Moments and markers");
    let rec = [];
    for (let i = 0; i < 10; i++) rec = Q.remember(rec, "act:a" + i);
    ok(rec.length === 8 && rec[0] === "act:a9" && rec[7] === "act:a2", "the last 8 picks are kept, newest first");
    rec = Q.remember(rec, "act:a5");
    ok(rec[0] === "act:a5" && rec.filter((x) => x === "act:a5").length === 1 && rec.length === 8, "picking one again moves it to the top, with no repeats");
    ok(Q.clean(["cur:x", "cur:x", 3, null, "bogus", "nope:x", "cur:", "moment:r1"]).join() === "cur:x,moment:r1" && Q.clean("x").length === 0, "a broken saved list is cleaned quietly");
    const ev = (o) => Object.assign({ key: "k", code: "KeyK", ctrlKey: false, metaKey: false, altKey: false, shiftKey: false }, o);
    ok(Q.isKey(ev({ metaKey: true })) && Q.isKey(ev({ ctrlKey: true })) && Q.isKey(ev({ ctrlKey: true, key: "K" })), "⌘K on a Mac and Ctrl+K on Windows open it");
    ok(!Q.isKey(ev({})) && !Q.isKey(ev({ ctrlKey: true, shiftKey: true })) && !Q.isKey(ev({ altKey: true, shiftKey: true })) && !Q.isKey(ev({ ctrlKey: true, altKey: true })) && !Q.isKey(ev({ ctrlKey: true, key: "j", code: "KeyJ" })), "plain K (stop playing), ⇧⌥K (add a keyframe) and other keys do not");
  }
}


/* Panels you can resize and fold away, and undo for the Screen's view (CurioScreenPanels): the pure part. */
{
  const P = w.CurioScreenPanels;
  ok(!!P && ["clean", "settle", "templates", "borders", "grows", "sizesLabel", "winsLabel", "viewLabel"].every((k) => typeof P[k] === "function"), "the panel helpers are exposed for tests (CurioScreenPanels)");
  if (P) {
    ok(JSON.stringify(P.clean(null)) === '{"shut":{}}' && JSON.stringify(P.clean({ lib: 300.4, insp: "x", tl: -5, bogus: 3, shut: { insp: true, ov: true, tl: "yes" } })) === '{"shut":{"insp":true},"lib":300,"tl":0}', "a saved sizes object is cleaned: numbers only, folds only for panels that fold, nothing else kept");
    ok(JSON.stringify(P.settle(150, 200, 600, true)) === '{"size":200,"shut":false}' && JSON.stringify(P.settle(90, 200, 600, true)) === '{"size":0,"shut":true}' && JSON.stringify(P.settle(90, 200, 600, false)) === '{"size":200,"shut":false}' && P.settle(900, 200, 600, true).size === 600, "a drag stops at the smallest size, folds the panel past half of it, and stops at the biggest");
    ok(P.templates({}, "center", "screen").cols === null && P.templates({}, "center", "screen").rows === null, "with no sizes set the stylesheet's own sizes are kept");
    const t1 = P.templates({ lib: 320, insp: 300, tl: 260 }, "center", "screen");
    ok(t1.cols === "320px minmax(0, 1.35fr) 300px" && t1.rows === "minmax(0, 1fr) 260px", "set sizes go on the grid, the Player taking what is left: " + t1.cols + " / " + t1.rows);
    ok(P.templates({ lib: 320, insp: 300 }, "right", "screen").cols === "320px 300px minmax(0, 1.2fr)", "with the Player on the right, the library and Details are the first two columns");
    ok(P.templates({ lib: 320, shut: { lib: true } }, "center", "screen").cols === "0px minmax(0, 1.35fr) minmax(280px, 0.8fr)", "a folded panel's column is 0px and the other keeps its usual share");
    ok(P.templates({ insp: 300, tl: 200 }, "center", "arrange", null, false).cols === "minmax(0, 1fr) 300px" && P.templates({ insp: 300, tl: 200 }, "center", "arrange", null, false).rows === null && P.templates({ tl: 200 }, "center", "arrange", null, true).rows === "minmax(0, 1fr) 200px", "Arrange: Details beside the timeline, and the timeline under the Player only when the viewers show");
    ok(P.templates({ lib: 900 }, "center", "screen", (k, v) => Math.min(v, 500)).cols.startsWith("500px"), "sizes are fitted to the window (the Player keeps its room)");
    ok(P.borders("center", "screen").map((b) => b.id + ":" + b.edge).join() === "lib:right,insp:left,tl:top" && P.borders("right", "screen").find((b) => b.id === "insp").edge === "right" && P.borders("center", "arrange", { player: true, dock: true }).map((b) => b.id).join() === "insp,tl,dock", "each layout has its borders, on the right edges");
    ok(P.grows("right") === 1 && P.grows("left") === -1 && P.grows("top") === -1, "dragging toward a panel's far side makes it bigger");
    ok(P.sizesLabel({}, { lib: 300, shut: {} }) === "Resize the library" && P.sizesLabel({ insp: 300 }, { insp: 300, shut: { insp: true } }) === "Collapse Details" && P.sizesLabel({ tl: 200, shut: { tl: true } }, { tl: 200 }) === "Bring back the timeline" && P.sizesLabel({ side: 120 }, {}) === "Reset the size of the library's group list" && P.sizesLabel({ lib: 1, insp: 2 }, {}) === "Reset the panel sizes", "panel steps have plain names (Resize the library, Collapse Details, Bring back the timeline...)");
    ok(P.sizesLabel({}, { lib: 400, insp: 300 }, "insp") === "Resize Details", "the border you dragged names the step, even when the other column's width is kept with it");
    const nm = (id) => ({ shotSize: "Shot size", emotion: "Feeling" })[id] || id;
    const wA = [{ id: "shotSize", x: 10, y: 10, w: null, h: null }];
    ok(P.winsLabel([], wA, nm) === "Open the Shot size window" && P.winsLabel(wA, [], nm) === "Close the Shot size window" && P.winsLabel(wA, [{ id: "shotSize", x: 40, y: 10, w: null, h: null }], nm) === "Move the Shot size window" && P.winsLabel(wA, [{ id: "shotSize", x: 10, y: 10, w: 400, h: 300 }], nm) === "Resize the Shot size window", "window steps: Open, Close, Move and Resize the Shot size window");
    const V = (d) => P.viewLabel(d, { win: nm, layout: (x) => ({ right: "Player on the right" })[x] || x, guide: (x) => ({ thirds: "thirds" })[x] || x, cat: (x) => ({ camera: "Camera" })[x] || x });
    ok(V({ prefs: { layout: ["center", "right"] } }) === "Layout: Player on the right" && V({ prefs: { arrange: ["side", "stack"] } }) === "Stack the viewers" && V({ prefs: { insp: [[{}], [{}, {}]] } }) === "Add an inspiration film" && V({ prefs: { insp: [[{}, {}], []] } }) === "Show only my film in the Player", "the Player's layout steps: the layout menu, Side or Stack, 1 2 3 windows");
    ok(V({ prefs: { compare: [{ on: false }, { on: true }] } }) === "Turn Compare on" && V({ prefs: { compare: [{ on: true, split: 50 }, { on: true, split: 70 }] } }) === "Move the Compare line" && V({ prefs: { captions: [{ on: true }, { on: false }] } }) === "Turn captions off" && V({ prefs: { guides: [[], ["thirds"]] } }) === "Show the thirds guide" && V({ prefs: { overview: [true, false] } }) === "Collapse the whole film strip", "Compare, captions, guides and the whole film strip have plain names");
    ok(V({ tools: { zoom: [1, 1.5] } }) === "Zoom in on the timeline" && V({ tools: { laneH: [50, 80] } }) === "Make the lanes taller" && V({ tools: { folds: [{}, { camera: true }] } }) === "Fold the Camera lanes" && V({ tools: { markers: [[], [{ row: "r1" }]] } }) === "Add a marker" && V({ tools: { magnet: [false, true] } }) === "Turn the magnet on" && V({ tools: { tool: ["select", "split"] } }) === "Use the Split tool" && V({ tools: { locks: [{}, { "t|c": true }] } }) === "Lock a lane", "the timeline's view steps: zoom, lane height, folds, markers, toolbar toggles, locks");
    ok(V({ wins: [[], wA] }) === "Open the Shot size window" && V({ prefs: { ghost: [false, true], lens: ["highlight", "off"] } }) === "Lens: off (and 1 more change)" && V({}) === "Change the view", "one gesture that changed two things says so; nothing named falls back to Change the view");
  }
}
console.log(fails ? fails + " failed" : "all passed");
process.exit(fails ? 1 : 0);
