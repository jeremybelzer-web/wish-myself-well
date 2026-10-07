/* Relationship map checks with no browser: the archive's ids, every tie resolves, the snapshot is current.
   node apps/curiosities/relations/tests/run.js */
const path = require("path");
const { spawnSync } = require("child_process");
const A = require("../archive.js");
const G = require("../graph.js");
const DB = require("../../data/load-db.js");

let fails = 0;
const ok = (cond, msg) => {
  console.log((cond ? "ok   " : "FAIL ") + msg);
  if (!cond) fails++;
};

const all = [...A.emotions, ...A.movements, ...A.traits, ...A.figures];
const ids = all.map((x) => x.id);
ok(new Set(ids).size === ids.length, "archive ids are unique");
ok(A.emotions.every((e) => /^em-/.test(e.id)) && A.movements.every((m) => /^mv-/.test(m.id)) && A.traits.every((t) => /^tr-/.test(t.id)) && A.figures.every((f) => /^fig-/.test(f.id)), "archive ids carry their prefixes");
ok(A.movements.every((m) => A.groups.includes(m.group)), "every movement is in a listed body group");
ok(A.movements.every((m) => m.emotions.length >= 1), "every movement shows at least one feeling");
ok(A.movements.filter((m) => m.still).length >= 10, "the archive keeps lacks of movement (stillness) too");
const g = G.build(G.fromDB(DB), A);
ok(g.missing.length === 0, "every tie names something that exists" + (g.missing.length ? ": " + g.missing.slice(0, 5).join(", ") : ""));
const lonely = A.emotions.filter((e) => A.movements.filter((m) => m.emotions.includes(e.id)).length < 2);
ok(!lonely.length, "every feeling has at least two movements" + (lonely.length ? ": " + lonely.map((e) => e.id).join(", ") : ""));
ok(g.nodes.length === DB.data.curiosities.length + all.length - A.emotions.filter((e) => e.db).length, "every curiosity and archive item is one node (" + g.nodes.length + ")");
const sus = new Set(g.links("tr-suspicious-authority").map((l) => l.id));
ok(["fig-authority", "em-suspicion", "mv-constricted", "mv-darting-eyes", "mv-shallow-breath"].every((id) => sus.has(id)), "Suspicious of authority ties to authority figures, suspicion and its movements");
ok(g.links("em-shame").length > 0 && g.real("em-shame") === "shame", "a feeling the database has is that curiosity, not a copy");
const leads = g.edges.filter((e) => e.type === "leads").length;
ok(leads > 900, "proximities become lines (" + leads + ")");
const r = spawnSync(process.execPath, [path.join(__dirname, "..", "tools", "make-snapshot.js"), "--check"], { encoding: "utf8" });
ok(r.status === 0, (r.stdout || "").trim());
console.log(fails ? fails + " failed" : "all relationship map checks passed");
process.exit(fails ? 1 : 0);
