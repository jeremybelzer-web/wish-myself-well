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
const only = process.argv.slice(2).find((a) => !a.startsWith("--"));
const broken = [];
require("./files.json").forEach((f) => {
  if (!fs.existsSync(path.join(__dirname, f))) return;
  try {
    run(path.join(__dirname, f));
  } catch (e) {
    /* While a category is being written, another category's half-done file only warns. */
    if (!only || f === "windows.js" || f === `win-${only}.js`) throw e;
    broken.push(`${f}: ${e.message}`);
  }
});
/* --measure: also the measure-, say- and look-<category>.js files not yet in files.json (while they are being written). */
if (process.argv.includes("--measure"))
  fs.readdirSync(__dirname)
    .filter((f) => /^(measure|say|look)-.*\.js$/.test(f) && !require("./files.json").includes(f))
    .sort()
    .forEach((f) => {
      try {
        run(path.join(__dirname, f));
      } catch (e) {
        if (!only || f === `measure-${only}.js` || f === `say-${only}.js` || f === `look-${only}.js`) throw e;
        broken.push(`${f}: ${e.message}`);
      }
    });
if (broken.length) console.log("warning, not loaded: " + broken.join("; "));
run(path.join(A, "screen", "levels.js"));
const DB = w.CuriosityDB;
const W = w.CuriosityWindows;
const L = w.CurioLevels;
const strict = process.argv.includes("--strict");
const SHARED = ["push", "pointsAhead", "themeLink", "amount", "noticeable", "change"];
let problems = DB.check().concat(W.check());
if (only) {
  /* Only this category's rows, so other categories still being written don't fail it. */
  const mine = new Set(L.curiosities(only).filter((x) => L.categoryOf(x.id) === only).map((x) => x.id));
  problems = problems.filter((p) => mine.has(p.replace(/^curiosity /, "").split(":")[0]));
}
const gaps = [];
L.CATEGORIES.filter((c) => !only || c.id === only).forEach((cat) => {
  const rows = L.curiosities(cat.id).filter((x) => L.categoryOf(x.id) === cat.id);
  const noWin = rows.filter((c) => !W.get(c.id) || !(W.get(c.id).faces || []).length);
  const thin = rows.filter((c) => c.sliders.filter((s) => !SHARED.includes(s.id)).length < 4);
  console.log(`${cat.id.padEnd(12)} ${String(rows.length).padStart(3)} curiosities, ${rows.length - noWin.length} with a window, ${thin.length} with fewer than 4 own settings`);
  noWin.forEach((c) => gaps.push(`${cat.id}: ${c.id} has no window faces`));
  if (process.argv.includes("--say")) rows.filter((c) => Object.keys(W.phrases[c.id] || {}).length < 3).forEach((c) => gaps.push(`${cat.id}: ${c.id} has fewer than 3 plain-words phrases`));
  /* --look: every curiosity has a live picture, and every one of its own settings changes it (lowest against
     highest, with the other settings where they start). */
  if (process.argv.includes("--look"))
    rows.forEach((c) => {
      if (!W.looks[c.id]) return gaps.push(`${cat.id}: ${c.id} has no live picture`);
      const own = c.sliders.filter((s) => !SHARED.includes(s.id));
      const ends = (s) => (Array.isArray(s.scale) ? [s.scale[0], s.scale[s.scale.length - 1]] : s.range ? [s.range.min, s.range.max] : [null, null]);
      let base;
      try {
        base = W.drawLook(c, () => undefined);
      } catch (e) {
        return problems.push(`curiosity ${c.id}: its live picture fails: ${e.message}`);
      }
      if (!base || /NaN|undefined/.test(base)) problems.push(`curiosity ${c.id}: its live picture draws NaN or undefined`);
      own.forEach((s) => {
        const [lo, hi] = ends(s);
        try {
          const a = W.drawLook(c, (x) => (x === s ? lo : undefined));
          const b = W.drawLook(c, (x) => (x === s ? hi : undefined));
          if (/NaN|undefined/.test(a + b)) problems.push(`curiosity ${c.id}: its live picture draws NaN or undefined when ${s.id} is at an end`);
          if (a === b) gaps.push(`${cat.id}: ${c.id}.${s.id} (${s.label}) does not change its live picture`);
        } catch (e) {
          problems.push(`curiosity ${c.id}: its live picture fails when ${s.id} is at an end: ${e.message}`);
        }
      });
    });
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
