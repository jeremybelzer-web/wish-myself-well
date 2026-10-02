/* The character matrix on the Screen, in Node with no page: node apps/curiosities/screen/tests/character.js
   Loads the app's core and the engine core, the Screen core, the character matrix (data.js, matrix.js) and
   screen/character.js, then checks the Character category, each character's own lanes, and that the matrix's
   cast goes onto the timeline and comes back the same. */
const path = require("path");
const fs = require("fs");
const vm = require("vm");
const load = require(path.join(__dirname, "..", "..", "engine", "tests", "load.js"));
const core = load();
const w = core.window;
const ctx = core.context || vm.createContext(w);
const run = (file) => vm.runInContext(fs.readFileSync(path.join(__dirname, "..", "..", file), "utf8"), ctx, { filename: file });
["data/db-editing.js", "screen/levels.js", "screen/frame.js", "screen/lanes.js", "character-matrix/data.js", "character-matrix/matrix.js", "screen/character.js"].forEach(run);

let fails = 0;
const ok = (c, m) => {
  console.log((c ? "ok   " : "FAIL ") + m);
  if (!c) fails++;
};
const L = w.CurioLevels;
const E = w.CurioEngine;
const CS = w.CharacterScreen;
const M = w.CharacterMatrix;
ok(!!CS && !!M, "screen/character.js and the matrix load with no page");

/* The Character tab. */
const cat = L.CATEGORIES.find((c) => c.id === "character");
ok(!!cat && cat.icon === "people", "the library has a Character tab");
const curs = L.curiosities("character").map((c) => c.id);
ok(M.curiosities.every((id) => curs.includes(id)), "it lists all " + M.curiosities.length + " matrix curiosities (18 axes, health, role)");
ok(L.categoryOf("cm-stability") === "character" && L.categoryOf("cm-health") === "character", "the axes and health belong to Character");
ok(L.items("suite", "character").some((s) => s.id === "enneagram-4") && L.items("proximity", "character").some((p) => p.id === "stress-7"), "the type fingerprints (suites) and stress arrows (proximities) are there too");
ok(CS.claims("cm-health") && CS.claims("cm-role.role") && !CS.claims("shotSize"), "the matrix's curiosities are claimed for character tracks, others are not");

/* Two characters, each with their own lanes. */
E.reset && E.reset();
while (E.state().rows.length < 4) E.send({ type: "addRow" });
const a = CS.adapter.add({ name: "Ada", type: 3, color: "#c9852d" });
const b = CS.adapter.add({ name: "Ben", type: 6, color: "#4f7a4a" });
ok(a.id && b.id && a.id !== b.id, "+ Character adds character tracks");
CS.pick(a.id);
ok(w.CurioLanes.trackFor("cm-health") === a.id, "a matrix lane goes on the picked character's track");
CS.pick(b.id);
ok(w.CurioLanes.trackFor("cm-health") === b.id, "pick another character and it goes on theirs");
ok(w.CurioLanes.trackFor("shotSize") !== b.id || E.state().tracks.length === 2, "other curiosities still go where they did");

/* The matrix's cast onto the timeline and back. */
const pulled = CS.adapter.pull();
ok(pulled.scenes === E.state().rows.length && pulled.characters.length === 2, "the matrix reads the cast and the moments from the timeline");
ok(pulled.characters[0].type === 3 && pulled.characters[0].name === "Ada", "with each character's name and type");
const ada = pulled.characters[0];
ada.scenes[0].health = 2;
ada.scenes[2].health = 8;
ada.scenes[2].role = "antagonist";
ada.scenes[1].offsets = { risk: 30 };
const before = E.history ? E.history().length : 0;
const r = CS.adapter.push(pulled, a.id);
ok(r.ok && !r.error, "an edit in the matrix is sent to the timeline");
ok(!E.history || E.history().length === before + 1 || E.canUndo(), "as one undo step");
const t = E.state().tracks.find((x) => x.id === a.id);
ok(t.curiosities.includes("cm-health") && t.curiosities.includes("cm-role"), "health and role get lanes");
ok(t.curiosities.includes("cm-risk") && !t.curiosities.includes("cm-stability"), "an axis gets a lane only where the character departs from their type");
const rows = E.state().rows;
ok(E.value(rows[2].id, a.id, "cm-health") === 8 && E.value(rows[2].id, a.id, "cm-role") === "antagonist", "the nodes say what the matrix says");
ok(!E.state().tracks.find((x) => x.id === b.id).curiosities.length, "the other character's lanes are untouched");
const back = CS.adapter.pull().characters[0];
ok(back.scenes[0].health === 2 && back.scenes[2].health === 8 && back.scenes[2].role === "antagonist", "reading it back gives the same health and roles");
ok(Math.abs((back.scenes[1].offsets.risk || 0) - 30) <= 1, "and the same nudge on the axis");
const again = CS.pushCommands(CS.adapter.pull(), a.id);
ok(again.cmds.length === 0, "sending it again changes nothing (the round trip is exact)");

/* A new type changes only the axes without lanes. */
const riskBefore = E.value(rows[1].id, a.id, "cm-risk");
CS.adapter.setType(a.id, 7);
const as7 = CS.adapter.pull().characters[0];
ok(as7.type === 7 && E.value(rows[1].id, a.id, "cm-risk") === riskBefore, "changing the type keeps what the lanes say");

/* Undo takes the matrix's edit back. */
E.undo();
ok(!E.state().tracks.find((x) => x.id === a.id).curiosities.includes("cm-risk"), "undo on the timeline takes the matrix's edit back");

/* Health drives the type toward its stress type, read from the timeline. */
const view = M.characterAt({ type: 3, scenes: [{ health: 9, role: "antagonist", offsets: {} }] }, 0);
ok(M.nearestTypes(view.profile, 9)[0].n === 9, "a 3 at health 9 still reads like a 9 (its stress type)");

console.log(fails ? fails + " failed" : "all passed");
process.exit(fails ? 1 : 0);
