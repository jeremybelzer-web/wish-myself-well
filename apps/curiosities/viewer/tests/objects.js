/* The object catalog with no page: node apps/curiosities/viewer/tests/objects.js
   Loads viewer/objects.js in a fake window and checks the catalog: enough items, unique ids, worlds,
   places and types from the lists, parts made only of the listed shapes with numeric sizes, #rrggbb
   colors, and that search finds things by synonym and by filter. */
const path = require("path");
global.window = {};
require(path.join(__dirname, "..", "objects.js"));
const O = window.CurioObjects;

let fails = 0;
const ok = (cond, msg) => {
  console.log((cond ? "ok   " : "FAIL ") + msg);
  if (!cond) fails++;
};
const SHAPES = ["box", "ball", "cone", "cyl", "wedge", "quad", "flat"];
const SIZES = { box: 3, ball: 0, cone: 2, cyl: 2, wedge: 3, quad: 2, flat: 2 };
const KEYS = new Set([...SHAPES, "at", "color", "glow", "glass", "rx", "ry", "rz", "pivot"]);
const COLOR = /^#[0-9a-f]{6}$/i;
const num = (v) => typeof v === "number" && isFinite(v);
const nums = (a, n) => Array.isArray(a) && a.length === n && a.every(num);

ok(O && Array.isArray(O.items), "window.CurioObjects has items");
ok(JSON.stringify(O.WORLDS) === JSON.stringify(["Household", "City", "Country", "Water", "Sky"]), "WORLDS are the five worlds");
ok(O.TYPES.length === 8 && O.TYPES.includes("Signs & street"), "TYPES has the eight types");
ok(O.WORLDS.every((w) => Array.isArray(O.PLACES[w]) && O.PLACES[w].length), "every world has places");
ok(O.items.length >= 180, `at least 180 items (${O.items.length})`);

const ids = new Set();
const bad = { id: [], world: [], place: [], type: [], color: [], parts: [], fields: [] };
for (const it of O.items) {
  if (ids.has(it.id) || !it.id) bad.id.push(it.id);
  ids.add(it.id);
  if (!O.WORLDS.includes(it.world)) bad.world.push(it.id);
  if (!Array.isArray(it.places) || !it.places.length || !it.places.every((p) => (O.PLACES[it.world] || []).includes(p))) bad.place.push(it.id);
  if (!O.TYPES.includes(it.type)) bad.type.push(it.id);
  if (!COLOR.test(it.color)) bad.color.push(it.id);
  if (!it.name || !it.tags || !num(it.look) || !num(it.ring) || (it.fly != null && !num(it.fly))) bad.fields.push(it.id);
  if (it.person) {
    const p = it.person;
    if (it.type !== "People" || ![p.color, p.pants, p.skin, p.hair].every((c) => COLOR.test(c))) bad.parts.push(it.id + " (person)");
    continue;
  }
  let parts;
  try {
    parts = it.parts({ color: it.color });
  } catch (e) {
    bad.parts.push(it.id + " throws " + e.message);
    continue;
  }
  if (!Array.isArray(parts) || !parts.length) {
    bad.parts.push(it.id + " (no parts)");
    continue;
  }
  for (const p of parts) {
    const shapes = SHAPES.filter((s) => s in p);
    const why =
      shapes.length !== 1 ? "shape count " + shapes.length
      : Object.keys(p).some((k) => !KEYS.has(k)) ? "unknown key " + Object.keys(p).filter((k) => !KEYS.has(k))
      : SIZES[shapes[0]] === 0 ? (!num(p[shapes[0]]) ? "size" : "")
      : !nums(p[shapes[0]], SIZES[shapes[0]]) ? "size"
      : "";
    const why2 = why || (!nums(p.at, 3) ? "at" : p.pivot && !nums(p.pivot, 3) ? "pivot" : ["rx", "ry", "rz"].some((k) => k in p && !num(p[k])) ? "rotation" : !COLOR.test(p.color) ? "color " + p.color : "");
    if (why2) {
      bad.parts.push(it.id + ": " + why2);
      break;
    }
  }
}
ok(!bad.id.length, "ids are unique" + (bad.id.length ? ": " + bad.id.join(", ") : ""));
ok(!bad.world.length, "every item has a valid world" + (bad.world.length ? ": " + bad.world.join(", ") : ""));
ok(!bad.place.length, "every place belongs to its world" + (bad.place.length ? ": " + bad.place.join(", ") : ""));
ok(!bad.type.length, "every item has a valid type" + (bad.type.length ? ": " + bad.type.join(", ") : ""));
ok(!bad.color.length, "item colors are #rrggbb" + (bad.color.length ? ": " + bad.color.join(", ") : ""));
ok(!bad.fields.length, "every item has a name, tags, look and ring" + (bad.fields.length ? ": " + bad.fields.join(", ") : ""));
ok(!bad.parts.length, "every part uses the listed shapes, numeric arrays and #rrggbb colors" + (bad.parts.length ? ": " + bad.parts.join("; ") : ""));
ok(O.WORLDS.every((w) => O.items.some((it) => it.world === w)), "every world has items");

ok(O.find("kettle") && O.find("kettle").name === "Kettle", "find(id) returns an item");
ok(O.search("puppy").some((it) => /dog/i.test(it.name)), "search('puppy') finds a dog");
ok(O.search("auto").some((it) => it.name === "Car"), "search('auto') finds a car");
ok(O.search("", { world: "City", type: "People" }).some((it) => it.id === "police-officer"), "search('', City, People) finds the police officer");
ok(O.search("", { world: "Sky" }).every((it) => it.world === "Sky"), "the world filter keeps to its world");
ok(O.search("red car").length >= 0 && O.search("zzzz").length === 0, "every word must match");

console.log(fails ? `\n${fails} failed` : `\nall passed (${O.items.length} items)`);
process.exit(fails ? 1 : 0);
