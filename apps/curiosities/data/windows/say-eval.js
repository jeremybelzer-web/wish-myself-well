/* Scores "Say what you want" against what a beginner would really type:
     node apps/curiosities/data/windows/say-eval.js [category] [--fail] [--min 90] [--quiet]

   Loads the app as check-windows.js does (the database, data/windows/*.js, screen/levels.js) plus
   screen/windows.js (its interpret() needs no page), then runs every request in say-eval.json through
   CurioWindowFaces.interpret with every setting at the middle of its scale or range, and checks the result
   against what the request should do (the "expect" grammar is in say-eval.json).

   Prints the score per category and the total. --fail lists every request that missed, with what it set.
   --min N exits 1 when the total score is under N percent (tests/run-all.js uses it). */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const A = path.join(__dirname, "..", "..");
const t0 = Date.now();
const core = require(path.join(A, "engine", "tests", "load.js"))();
const w = core.window;
const ctx = core.context || vm.createContext(w);
const run = (f) => vm.runInContext(fs.readFileSync(f, "utf8"), ctx, { filename: f });
run(path.join(A, "data", "db-editing.js"));
require("./files.json").forEach((f) => fs.existsSync(path.join(__dirname, f)) && run(path.join(__dirname, f)));
run(path.join(A, "screen", "levels.js"));
run(path.join(A, "screen", "windows.js"));
const L = w.CurioLevels;
const S = w.CurioScale;
const F = w.CurioWindowFaces;

const args = process.argv.slice(2);
const only = args.find((a) => !a.startsWith("--") && args[args.indexOf(a) - 1] !== "--min");
const showFail = args.includes("--fail");
const min = args.includes("--min") ? Number(args[args.indexOf("--min") + 1]) : null;
const { items } = JSON.parse(fs.readFileSync(path.join(__dirname, "say-eval.json"), "utf8"));

const sliderId = (c, s) => (s.id === c.main || s.id === "setting" ? (S.known(c.id) ? c.id : c.id + "." + s.id) : c.id + "." + s.id);
const middle = (k) => (S.known(k) ? S.at(k, 0.5) : undefined);

/* One term ("setting down", "distance=3", "around<=-135", "roll changed") against what was set. */
function holds(c, term, got) {
  const m = term.match(/^([\w-]+)(?:\s+(up|down|changed)|\s*(=|<=|>=|<|>)\s*(.+))$/);
  if (!m) throw new Error(`${c.id}: cannot read "${term}"`);
  const s = c.sliders.find((x) => x.id === m[1]);
  if (!s) throw new Error(`${c.id}: no setting ${m[1]}`);
  const k = sliderId(c, s);
  if (!got.has(k)) return false;
  const v = got.get(k);
  const was = middle(k);
  if (m[2] === "changed") return String(v) !== String(was);
  if (m[2]) {
    const a = s.scale ? S.pos(k, v) : Number(v);
    const b = s.scale ? S.pos(k, was) : Number(was);
    return m[2] === "up" ? a > b : a < b;
  }
  if (m[3] === "=") return s.scale ? String(v) === m[4] : Math.abs(Number(v) - Number(S.fix(k, Number(m[4])))) < 1e-6;
  const n = Number(v);
  const x = Number(m[4]);
  return { "<": n < x, ">": n > x, "<=": n <= x, ">=": n >= x }[m[3]];
}

const byCat = new Map(L.CATEGORIES.map((c) => [c.id, { n: 0, ok: 0 }]));
const fails = [];
items
  .filter((it) => !only || it.cat === only)
  .forEach((it) => {
    const c = L.get("curiosity", it.id);
    if (!c) throw new Error(`no curiosity ${it.id}`);
    const h = { sliderId, ctx: { value: middle } };
    const r = F.interpret(c, it.say, h);
    const got = new Map(r.set.map(([k, v]) => [k, v]));
    const ok = it.expect.split(" | ").some((alt) => alt.split(" & ").every((t) => holds(c, t.trim(), got)));
    const row = byCat.get(it.cat) || byCat.set(it.cat, { n: 0, ok: 0 }).get(it.cat);
    row.n++;
    if (ok) row.ok++;
    else fails.push(`${it.cat.padEnd(11)} ${it.id}: "${it.say}" wants ${it.expect}; got ${r.set.map(([k, v]) => k.replace(c.id + ".", "") + "=" + v).join(", ") || "nothing"}`);
  });

let n = 0;
let ok = 0;
const pct = (a, b) => (b ? Math.round((1000 * a) / b) / 10 : 0);
if (!args.includes("--quiet"))
  byCat.forEach((row, cat) => {
    if (!row.n) return;
    n += row.n;
    ok += row.ok;
    console.log(`${cat.padEnd(12)} ${String(row.ok).padStart(3)} of ${String(row.n).padStart(3)}  ${String(pct(row.ok, row.n)).padStart(5)}%`);
  });
else byCat.forEach((row) => ((n += row.n), (ok += row.ok)));
console.log(`${"total".padEnd(12)} ${String(ok).padStart(3)} of ${String(n).padStart(3)}  ${String(pct(ok, n)).padStart(5)}%  (${items.length} requests, ${new Set(items.map((i) => i.id)).size} curiosities, ${Date.now() - t0} ms)`);
if (showFail) fails.forEach((f) => console.log("  miss " + f));
if (min != null && pct(ok, n) < min) {
  console.log(`under the threshold of ${min}%`);
  process.exit(1);
}
