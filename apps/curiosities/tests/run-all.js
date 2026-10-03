/* Every Curiomatic test, with one command. Run from anywhere:

     node apps/curiosities/tests/run-all.js              quick: the checks that need no browser (about a minute)
     node apps/curiosities/tests/run-all.js --browser    also the browser tests (needs Playwright and Chromium)
     node apps/curiosities/tests/run-all.js --full       also the long whole-app stress run
     --only name,name   run only the suites whose names contain one of these words
     --three <file>     a local three.js r128 (three.min.js) for the browser tests, when the CDN is blocked

   Each suite is its own program; a suite passes when it exits with 0. The summary at the end lists every
   suite as pass, FAIL or skip (skip = a tool it needs, like Python or Blender, is not installed).
   The exit code is 1 when any suite failed, so CI and a pre-push hook can use it. */
const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const APP = path.join(__dirname, "..");
const args = process.argv.slice(2);
const arg = (n, d) => (args.includes(n) ? args[args.indexOf(n) + 1] : d);
const FULL = args.includes("--full");
const BROWSER = FULL || args.includes("--browser");
const ONLY = arg("--only", "").split(",").filter(Boolean);

/* three.js: --three, then $CURIO_THREE, then a copy in node_modules. Browser tests that draw 3D need it. */
function findThree() {
  const tries = [arg("--three", ""), process.env.CURIO_THREE || "", path.join(APP, "node_modules/three/build/three.min.js")];
  return tries.find((p) => p && fs.existsSync(p)) || "";
}
function has(cmd, test) {
  const r = spawnSync(cmd, test, { encoding: "utf8" });
  return r.status === 0;
}
const python = has("python3", ["--version"]) ? "python3" : has("python", ["--version"]) ? "python" : "";
const hasPlaywright = (() => {
  try {
    require.resolve("playwright", { paths: [APP, ...(process.env.NODE_PATH || "").split(path.delimiter).filter(Boolean)] });
    return true;
  } catch (e) {
    return false;
  }
})();

const three = findThree();
const threeArgs = three ? ["--three", three] : [];
const node = (file, extra) => ({ cmd: process.execPath, args: [path.join(APP, file), ...(extra || [])] });
const py = (file) => ({ cmd: python, args: [path.join(APP, file)], needs: python ? "" : "Python 3" });

const suites = [
  /* Quick: no browser. */
  { name: "core", ...node("core/check.js") },
  { name: "database", ...node("data/check-db.js"), generated: ["data/curiosity-db.json", "data/curiosity-links.json", "data/model-scenes.studies.json"] },
  { name: "engine", ...node("engine/tests/run.js") },
  { name: "engine bridge fuzz", ...node("engine/tests/bridge-fuzz.js") },
  { name: "screen", ...node("screen/tests/run.js") },
  { name: "curiosity windows", ...node("data/windows/check-windows.js", ["--strict"]) },
  { name: "character matrix on the screen", ...node("screen/tests/character.js") },
  { name: "momentum", ...node("momentum/tests/run.js") },
  { name: "video", ...node("video/tests/run.js") },
  { name: "cloud saving (off)", ...node("sync/tests/run.js") },
  { name: "site files committed", ...node("core/site-check.js") },
  { name: "desktop bridge", ...node("desktop/check.js"), needs: fs.existsSync(path.join(APP, "desktop/node_modules/ws")) ? "" : "desktop/node_modules (npm install in desktop/)" },
  { name: "maya camera", ...py("maya/tests/test_curio_camera.py") },
  { name: "maya panel", ...py("maya/tests/test_maya_camera.py") },
  { name: "resolve", ...py("resolve/tests/test_resolve.py") },
  { name: "unreal", ...py("unreal/tests/test_unreal.py") },
  { name: "blender", ...py("blender/tests/test_blender.py"), needs: python && has(python, ["-c", "import bpy"]) ? "" : "Blender's Python (bpy)" },
  /* Browser. */
  { name: "screen in a browser", browser: true, ...node("screen/tests/browser.js") },
  { name: "every curiosity window in a browser", browser: true, ...node("screen/tests/windows-browser.js") },
  { name: "character matrix in a browser", browser: true, ...node("screen/tests/character-browser.js", threeArgs) },
  { name: "engine in a browser", browser: true, ...node("engine/tests/browser.js", threeArgs) },
  { name: "momentum in a browser", browser: true, ...node("momentum/tests/browser.js", threeArgs) },
  { name: "video in a browser", browser: true, ...node("video/tests/browser.js") },
  { name: "storyboard flip book", browser: true, ...node("tests/flipbook.js") },
  { name: "save, new, open a project", browser: true, ...node("tests/save-open.js") },
  { name: "bring in a video", browser: true, ...node("media/tests/browser.js") },
  /* --browser uses the first 60 kinds of control on each page (about 15 minutes); --full uses them all. */
  { name: "every control in a browser", browser: true, ...node("tests/every-control.js", [...threeArgs, "--max", FULL ? "250" : "60"]) },
  { name: "every control on a phone", browser: true, ...node("tests/every-control.js", [...threeArgs, "--width", "390", "--max", FULL ? "250" : "30"]) },
  /* Long. */
  { name: "whole-app stress run", full: true, ...node("engine/tests/app-fuzz.js", [...threeArgs, "--events", "4000", "--chains", "4"]) },
];

const results = [];
for (const s of suites) {
  if (ONLY.length && !ONLY.some((w) => s.name.includes(w))) continue;
  if ((s.browser && !BROWSER) || (s.full && !FULL)) continue;
  const needs = s.needs || ((s.browser || s.full) && !hasPlaywright ? "Playwright" : "");
  if (needs) {
    results.push({ name: s.name, state: "skip", note: "needs " + needs });
    continue;
  }
  process.stdout.write(`\n=== ${s.name}\n`);
  const t0 = Date.now();
  /* A suite that rewrites generated files must leave them as they were: a change means someone edited
     the source and forgot to regenerate. The files are put back either way, so a test run never edits the repo. */
  const before = (s.generated || []).map((f) => [f, fs.existsSync(path.join(APP, f)) ? fs.readFileSync(path.join(APP, f), "utf8") : null]);
  const r = spawnSync(s.cmd, s.args, { cwd: path.join(APP, "..", ".."), stdio: "inherit", env: process.env, timeout: 60 * 60 * 1000 });
  const stale = before.filter(([f, text]) => (fs.existsSync(path.join(APP, f)) ? fs.readFileSync(path.join(APP, f), "utf8") : null) !== text).map(([f]) => f);
  for (const [f, text] of before) if (text !== null) fs.writeFileSync(path.join(APP, f), text);
  let note = ((Date.now() - t0) / 1000).toFixed(1) + " s";
  if (stale.length) note += "; out of date, run node apps/curiosities/" + s.args[0].slice(APP.length + 1) + " and commit: " + stale.join(", ");
  results.push({ name: s.name, state: r.status === 0 && !stale.length ? "pass" : "FAIL", note });
}

console.log("\n=== Summary");
for (const r of results) console.log(`${r.state.padEnd(5)} ${r.name.padEnd(30)} ${r.note}`);
if (!BROWSER) console.log("\n(browser tests not run: add --browser)");
if (BROWSER && !three) console.log("\n(no local three.js given: 3D drawing is skipped in the browser tests; see tests/README.md)");
const failed = results.filter((r) => r.state === "FAIL");
console.log(failed.length ? `\n${failed.length} suite(s) failed.` : "\nAll suites passed.");
process.exit(failed.length ? 1 : 0);
