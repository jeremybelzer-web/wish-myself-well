/* Checks the curiosity database and writes curiosity-db.json.
   Run from anywhere:  node apps/curiosities/data/check-db.js   (exit code 1 if anything is wrong) */
const fs = require("fs");
const path = require("path");
const DB = require("./load-db.js");
const problems = DB.check();
/* Links for the engine: every end must be a curiosity or slider row, and every value must be on its scale. */
const LINKS = DB.links();
const slider = (cid) => {
  const [c, s] = cid.split(".");
  const cur = DB.get("curiosity", c);
  return cur && cur.sliders.find((x) => x.id === (s || cur.main));
};
const onScale = (sl, v) => (sl.scale ? sl.scale.includes(v) : typeof v === "number" && v >= sl.range.min && v <= sl.range.max);
LINKS.links.forEach((l) => {
  [l.from, l.to].forEach((e) => slider(e.curiosity) || problems.push(`link ${l.id}: unknown curiosity ${e.curiosity}`));
  if (l.from.is != null && slider(l.from.curiosity) && !onScale(slider(l.from.curiosity), l.from.is)) problems.push(`link ${l.id}: "${l.from.is}" is not on ${l.from.curiosity}'s scale`);
  if (l.does === "set" && slider(l.to.curiosity) && !onScale(slider(l.to.curiosity), l.value)) problems.push(`link ${l.id}: "${l.value}" is not on ${l.to.curiosity}'s scale`);
});
LINKS.groups.forEach((g) => g.links.length || problems.push(`link group ${g.id}: no links`));
const n = DB.counts();
console.log(`${n.workspaces} workspaces, ${n.curiosities} curiosities, ${n.suites} suites, ${n.proximities} proximities, ${n.proximitySuites} proximity suites, ${n.sliders} sliders, ${n.scenes} model scenes`);
if (problems.length) {
  console.log(problems.length + " problems:");
  problems.forEach((p) => console.log("  " + p));
  process.exit(1);
}
fs.writeFileSync(path.join(__dirname, "curiosity-db.json"), JSON.stringify(Object.assign({ generated: "by data/check-db.js from the data/*.js files; do not hand-edit" }, DB.toJSON()), null, 1) + "\n");
console.log("OK. Wrote curiosity-db.json");
/* Every proximity and proximity suite as engine links (engine/seeds.js), also window.CURIOSITY_LINKS after install. */
fs.writeFileSync(path.join(__dirname, "curiosity-links.json"), JSON.stringify(Object.assign({ generated: "by data/check-db.js; do not hand-edit" }, LINKS), null, 1) + "\n");
console.log(`Wrote curiosity-links.json: ${LINKS.links.length} links from ${n.proximities} proximities, ${LINKS.groups.length} groups`);
/* The model scenes as a file the Study tab's Import button reads. */
fs.writeFileSync(path.join(__dirname, "model-scenes.studies.json"), JSON.stringify(DB.studiesExport(), null, 1) + "\n");
console.log("Wrote model-scenes.studies.json");
/* remove() check, after the files are written: a made-up curiosity goes in and comes back out leaving no trace. */
const before = DB.counts().curiosities;
DB.curiosity({ id: "zzCheckRemove", label: "Check remove", workspace: "structure" });
const gone = DB.remove("curiosity", "zzCheckRemove");
if (!gone || DB.get("curiosity", "zzCheckRemove") || DB.counts().curiosities !== before || DB.remove("curiosity", "zzCheckRemove") !== null) {
  console.log("remove() did not take the row out of its list and index");
  process.exit(1);
}
console.log("remove() takes a row out of its list and index");
