/* Every Curiomatic test, with one command. Run from anywhere:

     node apps/curiosities/tests/run-all.js              quick: the checks that need no browser (about a minute)
     node apps/curiosities/tests/run-all.js --browser    also the browser tests (needs Playwright and Chromium)
     node apps/curiosities/tests/run-all.js --full       also the long whole-app stress run
     --only name,name   run only the suites whose names contain one of these words
     --three <file>     a local three.js r128 (three.min.js) for the browser tests, when the CDN is blocked
     --shard k/n        run only part k of n, so CI can run the parts side by side: part 1 takes the quick
                        checks, and the browser and long suites are dealt out by how long each takes

   Each suite is its own program; a suite passes when it exits with 0. The summary at the end lists every
   suite as pass, FAIL or skip (skip = a tool it needs, like Python or Blender, is not installed).
   The exit code is 1 when any suite failed, so CI and a pre-push hook can use it. */
const { spawn, spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const APP = path.join(__dirname, "..");
const args = process.argv.slice(2);
const arg = (n, d) => (args.includes(n) ? args[args.indexOf(n) + 1] : d);
const FULL = args.includes("--full");
const BROWSER = FULL || args.includes("--browser");
const ONLY = arg("--only", "").split(",").filter(Boolean);
const [SHARD, SHARDS] = arg("--shard", "1/1").split("/").map(Number);
if (!(SHARDS >= 1 && SHARD >= 1 && SHARD <= SHARDS)) {
  console.error("--shard must look like 1/3");
  process.exit(2);
}
/* On GitHub Actions a failing suite's FAIL lines also go out as ::error:: notes, shown on the check's page. */
const GITHUB = !!process.env.GITHUB_ACTIONS;

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
  { name: "curiosity windows", ...node("data/windows/check-windows.js", ["--strict", "--say", "--look"]) },
  { name: "character matrix on the screen", ...node("screen/tests/character.js") },
  { name: "momentum", ...node("momentum/tests/run.js") },
  { name: "video", ...node("video/tests/run.js") },
  { name: "viewer object library", ...node("viewer/tests/objects.js") },
  { name: "cloud saving (off)", ...node("sync/tests/run.js") },
  { name: "site files committed", ...node("core/site-check.js") },
  { name: "desktop bridge", ...node("desktop/check.js"), needs: fs.existsSync(path.join(APP, "desktop/node_modules/ws")) ? "" : "desktop/node_modules (npm install in desktop/)" },
  { name: "maya camera", ...py("maya/tests/test_curio_camera.py") },
  { name: "maya panel", ...py("maya/tests/test_maya_camera.py") },
  { name: "resolve", ...py("resolve/tests/test_resolve.py") },
  { name: "unreal", ...py("unreal/tests/test_unreal.py") },
  { name: "blender", ...py("blender/tests/test_blender.py"), needs: python && has(python, ["-c", "import bpy"]) ? "" : "Blender's Python (bpy)" },
  /* Browser. */
  /* secs: roughly how long a suite takes on a laptop, used only to deal suites out to --shard parts
     (a suite without it counts as 60). The long every-control runs are split in two by page. */
  { name: "screen in a browser", browser: true, secs: 65, ...node("screen/tests/browser.js") },
  { name: "every curiosity window in a browser", browser: true, secs: 30, ...node("screen/tests/windows-browser.js") },
  { name: "character matrix in a browser", browser: true, secs: 10, ...node("screen/tests/character-browser.js", threeArgs) },
  { name: "engine in a browser", browser: true, secs: 135, ...node("engine/tests/browser.js", threeArgs) },
  { name: "momentum in a browser", browser: true, secs: 30, ...node("momentum/tests/browser.js", threeArgs) },
  { name: "video in a browser", browser: true, secs: 25, ...node("video/tests/browser.js") },
  { name: "viewer in a browser", browser: true, secs: 15, ...node("viewer/tests/browser.js") },
  { name: "viewer draw & build in a browser", browser: true, secs: 25, ...node("viewer/tests/build.js") },
  { name: "app walkthrough in a browser", browser: true, secs: 15, ...node("viewer/tests/walkthrough.js") },
  { name: "front and center lane", browser: true, secs: 10, ...node("viewer/tests/focus-lane.js") },
  { name: "viewer camera and windows", browser: true, secs: 12, ...node("viewer/tests/camera.js") },
  { name: "camera flight path", browser: true, secs: 15, ...node("viewer/tests/flight.js") },
  { name: "storyboard flip book", browser: true, secs: 10, ...node("tests/flipbook.js") },
  { name: "save, new, open a project", browser: true, secs: 30, ...node("tests/save-open.js") },
  { name: "bring in a video", browser: true, secs: 25, ...node("media/tests/browser.js") },
  { name: "3D characters", browser: true, secs: 25, ...node("rig/tests/browser.js", threeArgs) },
  { name: "3D loads on first use", browser: true, secs: 5, ...node("rig/tests/lazy.js", threeArgs) },
  { name: "3D feet and hands (IK)", browser: true, secs: 20, ...node("rig/tests/ik.js", threeArgs) },
  { name: "3D lights", browser: true, secs: 20, ...node("rig/tests/lights.js", threeArgs) },
  { name: "3D forces", browser: true, secs: 30, ...node("rig/tests/dynamics.js", threeArgs) },
  { name: "3D camera", browser: true, secs: 20, ...node("rig/tests/camera.js", threeArgs) },
  { name: "3D on the Screen", browser: true, secs: 10, ...node("rig/tests/screen.js", threeArgs) },
  { name: "3D to storyboard", browser: true, secs: 25, ...node("rig/tests/snapshot.js", threeArgs) },
  { name: "3D characters from words", browser: true, secs: 55, ...node("rig/tests/maker.js", threeArgs) },
  { name: "3D faces and feelings", browser: true, secs: 45, ...node("rig/tests/faces.js", threeArgs) },
  { name: "3D acting moves", browser: true, secs: 150, ...node("rig/tests/gestures.js", threeArgs) },
  { name: "3D more than one actor", browser: true, secs: 60, ...node("rig/tests/staging.js", threeArgs) },
  { name: "3D sets from words", browser: true, secs: 90, ...node("rig/tests/sets.js", threeArgs) },
  { name: "3D whole scene from words", browser: true, secs: 90, ...node("rig/tests/scene.js", threeArgs) },
  { name: "3D beat on the timeline", browser: true, secs: 20, ...node("rig/tests/beat-lanes.js", threeArgs) },
  { name: "3D more of a beat on the timeline", browser: true, secs: 30, ...node("rig/tests/beat-lanes-more.js", threeArgs) },
  { name: "3D start here", browser: true, secs: 35, ...node("rig/tests/guide.js", threeArgs) },
  /* --browser uses the first 60 kinds of control on each page (about 15 minutes); --full uses them all. */
  ...[1, 2].map((k) => ({ name: `every control in a browser (${k}/2)`, browser: true, secs: FULL ? 1200 : 360, ...node("tests/every-control.js", [...threeArgs, "--max", FULL ? "250" : "60", "--part", `${k}/2`]) })),
  ...[1, 2].map((k) => ({ name: `every control on a phone (${k}/2)`, browser: true, secs: FULL ? 600 : 150, ...node("tests/every-control.js", [...threeArgs, "--width", "390", "--max", FULL ? "250" : "30", "--part", `${k}/2`]) })),
  /* Long. */
  { name: "whole-app stress run", full: true, secs: 900, ...node("engine/tests/app-fuzz.js", [...threeArgs, "--events", "4000", "--chains", "4"]) },
];

/* --shard: part 1 keeps every quick check; the browser and long suites go, longest first, to whichever
   part has the least so far. The same suites always land in the same part. */
function shardOf(list) {
  const load = Array(SHARDS).fill(0);
  const where = new Map();
  for (const s of list.filter((s) => !s.browser && !s.full)) where.set(s, 0), (load[0] += s.secs || 5);
  const slow = list.filter((s) => s.browser || s.full).sort((a, b) => (b.secs || 60) - (a.secs || 60) || a.name.localeCompare(b.name));
  for (const s of slow) {
    const i = load.indexOf(Math.min(...load));
    where.set(s, i);
    load[i] += s.secs || 60;
  }
  return where;
}

/* Runs one suite, showing its output as it goes and keeping it for the FAIL lines. */
function run(s) {
  return new Promise((resolve) => {
    const child = spawn(s.cmd, s.args, { cwd: path.join(APP, "..", ".."), stdio: ["ignore", "pipe", "pipe"], env: process.env });
    let out = "";
    const keep = (stream, to) => stream.on("data", (d) => {
      to.write(d);
      out += d;
    });
    keep(child.stdout, process.stdout);
    keep(child.stderr, process.stderr);
    const timer = setTimeout(() => child.kill("SIGKILL"), 60 * 60 * 1000);
    child.on("error", (e) => (out += String(e)));
    child.on("close", (status) => {
      clearTimeout(timer);
      resolve({ status, out });
    });
  });
}
const annotate = (text) => text.replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A");
const annotateTitle = (text) => annotate(text).replace(/:/g, "%3A").replace(/,/g, "%2C");

(async () => {
  const chosen = suites.filter((s) => (!ONLY.length || ONLY.some((w) => s.name.includes(w))) && !((s.browser && !BROWSER) || (s.full && !FULL)));
  const shard = shardOf(chosen);
  if (SHARDS > 1) console.log(`Part ${SHARD} of ${SHARDS}: ${chosen.filter((s) => shard.get(s) === SHARD - 1).map((s) => s.name).join(", ")}`);
  const results = [];
  for (const s of chosen) {
    if (shard.get(s) !== SHARD - 1) continue;
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
    const r = await run(s);
    const stale = before.filter(([f, text]) => (fs.existsSync(path.join(APP, f)) ? fs.readFileSync(path.join(APP, f), "utf8") : null) !== text).map(([f]) => f);
    for (const [f, text] of before) if (text !== null) fs.writeFileSync(path.join(APP, f), text);
    let note = ((Date.now() - t0) / 1000).toFixed(1) + " s";
    if (stale.length) note += "; out of date, run node apps/curiosities/" + s.args[0].slice(APP.length + 1) + " and commit: " + stale.join(", ");
    const state = r.status === 0 && !stale.length ? "pass" : "FAIL";
    results.push({ name: s.name, state, note });
    if (GITHUB && state === "FAIL") {
      const lines = r.out.split("\n").filter((l) => /^\s*FAIL\b|Error:|out of date/.test(l)).slice(0, 10);
      if (stale.length) lines.push("out of date: " + stale.join(", "));
      if (!lines.length) lines.push(`exited with ${r.status}`);
      for (const l of lines) console.log(`::error title=${annotateTitle(s.name)}::${annotate(l.trim().slice(0, 500))}`);
    }
  }

  console.log("\n=== Summary");
  for (const r of results) console.log(`${r.state.padEnd(5)} ${r.name.padEnd(30)} ${r.note}`);
  if (!BROWSER) console.log("\n(browser tests not run: add --browser)");
  if (BROWSER && !three) console.log("\n(no local three.js given: 3D drawing is skipped in the browser tests; see tests/README.md)");
  const failed = results.filter((r) => r.state === "FAIL");
  console.log(failed.length ? `\n${failed.length} suite(s) failed.` : "\nAll suites passed.");
  process.exit(failed.length ? 1 : 0);
})();
