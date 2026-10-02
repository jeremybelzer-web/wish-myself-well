/* Load the app's core and the engine core in Node, with no page (for the engine's tests). */
const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..", "..");
const CORE = JSON.parse(fs.readFileSync(path.join(ROOT, "core", "files.json"), "utf8")).files;
const ENGINE = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "files.json"), "utf8")).core.map((f) => "engine/" + f);
module.exports = function load(opts) {
  const core = require(path.join(ROOT, "core", "headless.js")).load(Object.assign({ files: CORE.concat(ENGINE.filter((f) => !CORE.includes(f))) }, opts || {}));
  const w = core.window;
  return Object.assign(core, { E: w.CurioEngine, S: w.CurioScale, Host: w.CurioHost, Fake: w.CurioFakeHost, Seeds: w.CurioSeeds, Analyze: w.CurioAnalyze, Tracks: w.CurioTracks });
};
