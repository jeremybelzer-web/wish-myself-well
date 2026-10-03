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

console.log(fails ? fails + " failed" : "all passed");
process.exit(fails ? 1 : 0);
