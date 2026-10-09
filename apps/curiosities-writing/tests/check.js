/* node apps/curiosities-writing/tests/check.js
   Loads Curiomatic's database, tags every curiosity, and checks the writing app is in step with it. */
const assert = require("assert");
const DB = require("../../curiosities/data/load-db.js");
const filmCount = DB.data.curiosities.length;
require("../../curiosities/data/writing/db-writing-language.js");
require("../../curiosities/data/writing/db-writing-ladder.js");
require("../../curiosities/data/writing/db-writing-movement.js");
require("../../curiosities/data/writing/db-writing-blocks.js");
const Lanes = require("../lanes.js");
const { sync } = require("../tools/sync-scripts.js");

const counts = Lanes.tagAll(DB);
const untagged = DB.data.curiosities.filter((r) => !r.lanes.length || r.lanes.some((t) => !Lanes.TABS.includes(t)));
assert.strictEqual(untagged.length, 0, "untagged: " + untagged.map((r) => r.id).join(", "));

const known = new Set(DB.data.workspaces.map((w) => w.id));
const unmapped = [...known].filter((w) => !Lanes.WORKSPACE[w]);
assert.strictEqual(unmapped.length, 0, "workspaces with no default tags: " + unmapped.join(", "));
Object.keys(Lanes.OVERRIDES).forEach((id) => assert.ok(DB.get("curiosity", id), "override for a missing curiosity: " + id));

/* The handoff's shared ids (section 8) must be there, same ids. */
["listenerPlace", "projection", "glimpseOfALife", "typeTalk", "storyOrder", "plantedThing", "selfTalk", "healingArc"]
  .forEach((id) => assert.ok(DB.get("curiosity", id), "missing shared curiosity: " + id));

const problems = DB.check();
assert.deepStrictEqual(problems, [], "database check: " + problems.slice(0, 10).join("; "));
const own = DB.data.curiosities.length - filmCount;

assert.ok(sync(false), "index.html script tags are out of step with data/files.json: run tools/sync-scripts.js");

console.log(`OK. ${counts.total} curiosities tagged (${own} writing-only): Visual ${counts.Visual}, Writing ${counts.Writing}, Audio ${counts.Audio}`);
