/* Checks every curiosity's window:  node apps/curiosities/data/windows/check-windows.js [category] [--strict]
   Loads the whole database as the app does (engine/tests/load.js, plus db-editing.js and the Screen's
   categories), then data/windows/*.js in files.json order. Prints problems (exit 1) and, per category, which
   curiosities still lack a window or have fewer than four settings of their own. --strict fails on those too. */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const A = path.join(__dirname, "..", "..");
const core = require(path.join(A, "engine", "tests", "load.js"))();
const w = core.window;
const ctx = core.context || vm.createContext(w);
const run = (f) => vm.runInContext(fs.readFileSync(f, "utf8"), ctx, { filename: f });
run(path.join(A, "data", "db-editing.js"));
require("./files.json").forEach((f) => fs.existsSync(path.join(__dirname, f)) && run(path.join(__dirname, f)));
run(path.join(A, "screen", "levels.js"));
const DB = w.CuriosityDB;
const W = w.CuriosityWindows;
const L = w.CurioLevels;
const only = process.argv.slice(2).find((a) => !a.startsWith("--"));
const strict = process.argv.includes("--strict");
const SHARED = ["push", "pointsAhead", "themeLink", "amount", "noticeable", "change"];
const problems = DB.check().concat(W.check());
const gaps = [];
L.CATEGORIES.filter((c) => !only || c.id === only).forEach((cat) => {
  const rows = L.curiosities(cat.id).filter((x) => L.categoryOf(x.id) === cat.id);
  const noWin = rows.filter((c) => !W.get(c.id) || !(W.get(c.id).faces || []).length);
  const thin = rows.filter((c) => c.sliders.filter((s) => !SHARED.includes(s.id)).length < 4);
  console.log(`${cat.id.padEnd(12)} ${String(rows.length).padStart(3)} curiosities, ${rows.length - noWin.length} with a window, ${thin.length} with fewer than 4 own settings`);
  noWin.forEach((c) => gaps.push(`${cat.id}: ${c.id} has no window faces`));
  thin.forEach((c) => gaps.push(`${cat.id}: ${c.id} has only ${c.sliders.filter((s) => !SHARED.includes(s.id)).length} settings of its own`));
});
if (W.skipped.length) console.log("skipped (row not loaded here): " + W.skipped.join(", "));
if (process.argv.includes("--gaps") || strict) gaps.forEach((g) => console.log("  gap  " + g));
if (problems.length) {
  console.log(problems.length + " problems:");
  problems.forEach((p) => console.log("  " + p));
  process.exit(1);
}
if (strict && gaps.length) process.exit(1);
console.log("OK");
