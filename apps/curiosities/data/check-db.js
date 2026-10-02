/* Checks the curiosity database and writes curiosity-db.json.
   Run from anywhere:  node apps/curiosities/data/check-db.js   (exit code 1 if anything is wrong) */
const fs = require("fs");
const path = require("path");
const DB = require("./load-db.js");
const problems = DB.check();
const n = DB.counts();
console.log(`${n.workspaces} workspaces, ${n.curiosities} curiosities, ${n.suites} suites, ${n.proximities} proximities, ${n.proximitySuites} proximity suites, ${n.sliders} sliders, ${n.scenes} model scenes`);
if (problems.length) {
  console.log(problems.length + " problems:");
  problems.forEach((p) => console.log("  " + p));
  process.exit(1);
}
fs.writeFileSync(path.join(__dirname, "curiosity-db.json"), JSON.stringify(Object.assign({ generated: "by data/check-db.js from the data/*.js files; do not hand-edit" }, DB.toJSON()), null, 1) + "\n");
console.log("OK. Wrote curiosity-db.json");
/* The model scenes as a file the Study tab's Import button reads. */
fs.writeFileSync(path.join(__dirname, "model-scenes.studies.json"), JSON.stringify(DB.studiesExport(), null, 1) + "\n");
console.log("Wrote model-scenes.studies.json");
