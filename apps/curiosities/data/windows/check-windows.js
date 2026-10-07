/* Checks every curiosity's window:  node apps/curiosities/data/windows/check-windows.js [category] [--strict]
   [--measure] [--say] [--look] [--fit] [--gaps]. --fit draws every live picture in a headless browser and warns
   (never fails) about words off the 320x180 frame or on top of other words; see fitCheck below.
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
if (process.argv.includes("--measure") || process.argv.includes("--fit"))
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
      /* Every path's numbers must fit its commands (a curve needs its control point), or the browser rejects it. */
      const ARGS = { M: 2, L: 2, T: 2, H: 1, V: 1, C: 6, S: 4, Q: 4, A: 7, Z: 0 };
      const badPath = (svg) =>
        (svg.match(/\sd="[^"]*"/g) || []).find((d) => {
          const segs = d.slice(4, -1).match(/[a-zA-Z][^a-zA-Z]*/g) || [];
          return segs.some((sg) => {
            const n = ARGS[sg[0].toUpperCase()];
            const nums = (sg.slice(1).match(/-?(\d+\.?\d*|\.\d+)(e-?\d+)?/g) || []).length;
            return n == null || (n === 0 ? nums !== 0 : nums === 0 || nums % n !== 0);
          });
        });
      const bp = base && badPath(base);
      if (bp) problems.push(`curiosity ${c.id}: its live picture has a broken path${bp}`);
      if (!base || /NaN|undefined/.test(base)) problems.push(`curiosity ${c.id}: its live picture draws NaN or undefined`);
      own.forEach((s) => {
        const [lo, hi] = ends(s);
        try {
          const a = W.drawLook(c, (x) => (x === s ? lo : undefined));
          const b = W.drawLook(c, (x) => (x === s ? hi : undefined));
          const bp2 = badPath(a) || badPath(b);
          if (bp2) problems.push(`curiosity ${c.id}: its live picture has a broken path when ${s.id} is at an end:${bp2}`);
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
/* --fit: draw each live picture at its start, all own settings lowest, middle and highest, and two mixes (odd
   settings high, then even), in one headless Chromium page, and measure every <text>. Lists words that run off the
   frame or overlap other words. Warnings only: they never change the exit code. Needs Playwright; without it,
   it says so and moves on. */
async function fitCheck() {
  let chromium;
  for (const m of ["playwright", "/opt/node22/lib/node_modules/playwright"])
    try {
      ({ chromium } = require(m));
      break;
    } catch (e) {}
  if (!chromium) return console.log("fit: skipped, Playwright is not installed");
  const t0 = Date.now();
  const at = (s, q) => {
    if (Array.isArray(s.scale)) return s.scale[Math.round(q * (s.scale.length - 1))];
    if (!s.range) return undefined;
    const st = s.range.step || 1;
    return +(Math.round((s.range.min + (s.range.max - s.range.min) * q) / st) * st).toFixed(6);
  };
  const VARIANTS = [["start", null], ["lowest", 0], ["middle", 0.5], ["highest", 1], ["mix A", "a"], ["mix B", "b"]];
  const items = [];
  const byCat = {};
  L.CATEGORIES.filter((c) => !only || c.id === only).forEach((cat) => {
    byCat[cat.id] = [];
    L.curiosities(cat.id)
      .filter((x) => L.categoryOf(x.id) === cat.id && W.looks[x.id])
      .forEach((c) =>
        VARIANTS.forEach(([tag, q]) => {
          const get =
            q == null
              ? () => undefined
              : (s) => {
                  if (SHARED.includes(s.id)) return undefined;
                  if (typeof q === "number") return at(s, q);
                  const i = c.sliders.indexOf(s);
                  return at(s, i % 2 === (q === "a" ? 0 : 1) ? 1 : 0);
                };
          let svg = "";
          try {
            svg = W.drawLook(c, get);
          } catch (e) {
            return;
          }
          items.push({ cat: cat.id, id: c.id, tag, svg });
        })
      );
  });
  const b = await chromium.launch();
  const page = await b.newPage();
  await page.setContent("<!doctype html><body style='margin:0'></body>");
  const found = await page.evaluate((items) => {
    const out = [];
    const host = document.createElement("div");
    host.style.cssText = "width:320px;height:180px";
    document.body.appendChild(host);
    for (const it of items) {
      host.innerHTML = it.svg;
      const svg = host.querySelector("svg");
      if (!svg) continue;
      svg.setAttribute("width", 320);
      svg.setAttribute("height", 180);
      const o = svg.getBoundingClientRect();
      const T = [];
      for (const t of svg.querySelectorAll("text")) {
        const txt = t.textContent.trim();
        if (!txt) continue;
        const r = t.getBoundingClientRect();
        if (r.width < 0.5) continue;
        T.push({ txt, x0: r.left - o.left, y0: r.top - o.top, x1: r.right - o.left, y1: r.bottom - o.top });
      }
      const p = [];
      T.forEach((a) => {
        if (a.x0 < -0.5 || a.x1 > 320.5 || a.y0 < -0.5 || a.y1 > 180.5) p.push(`"${a.txt}" runs off the frame`);
      });
      for (let i = 0; i < T.length; i++)
        for (let j = i + 1; j < T.length; j++) {
          const a = T[i];
          const c = T[j];
          /* the same words on top of themselves are a deliberate copy (a shadow, a ghost, a repeated sticker) */
          if (a.txt === c.txt) continue;
          if (Math.min(a.x1, c.x1) - Math.max(a.x0, c.x0) > 1.5 && Math.min(a.y1, c.y1) - Math.max(a.y0, c.y0) > 2.5) p.push(`"${a.txt}" overlaps "${c.txt}"`);
        }
      if (p.length) out.push({ cat: it.cat, id: it.id, tag: it.tag, p });
    }
    return out;
  }, items);
  await b.close();
  /* One line per curiosity and problem, with the variants it shows up in. */
  const seen = {};
  found.forEach((f) =>
    f.p.forEach((msg) => {
      const key = `${f.cat}\u0000${f.id}\u0000${msg.replace(/\d+(\.\d+)?/g, "#")}`;
      (seen[key] = seen[key] || { cat: f.cat, id: f.id, msg, tags: new Set() }).tags.add(f.tag);
    })
  );
  Object.values(seen).forEach((x) => byCat[x.cat].push(x));
  const cats = Object.keys(byCat);
  console.log(`fit: ${items.length} pictures measured in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
  cats.forEach((c) => {
    const list = byCat[c];
    console.log(`fit  ${c.padEnd(12)} ${list.length ? list.length + " warnings in " + new Set(list.map((x) => x.id)).size + " pictures" : "clean"}`);
    list.forEach((x) => console.log(`  fit  ${c}: ${x.id} (${[...x.tags].join(", ")}): ${x.msg}`));
  });
}
function finish() {
  if (problems.length) {
    console.log(problems.length + " problems:");
    problems.forEach((p) => console.log("  " + p));
    process.exit(1);
  }
  if (strict && gaps.length) process.exit(1);
  console.log("OK");
}
if (process.argv.includes("--fit"))
  fitCheck()
    .catch((e) => console.log("fit: could not run: " + e.message))
    .then(finish);
else finish();
