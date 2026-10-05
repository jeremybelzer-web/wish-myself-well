/* Versions (momentum/versions.js): node apps/curiosities/momentum/tests/versions.js [--browser] [--three <three.min.js>] [--shots <dir>]
   1. With no page: the summary keeps only family letters, seconds and the numbers (never the film), the default
      name is "Version N, hh:mm", each film keeps at most 30 versions (oldest dropped), saving and loading
      survive broken storage, and compare() gives arrows, plain sentences and one verdict: a Pace it change that
      moves attention more often reads "better", the same change the other way "worse", and the same film
      "about the same".
   2. With --browser (needs Playwright and Chromium; set NODE_PATH): the app, Momentum, the "Versions" tab in
      Fix it, Keep this version twice around a Pace it change (which also keeps a version by itself, once),
      the comparison with its verdict, Delete, Clear all with its confirm, no page errors, no sideways scroll
      at 375px, and screenshots in --shots (default: the system temp folder). */
const path = require("path");
const fs = require("fs");
const os = require("os");
const vm = require("vm");
const assert = require("assert");

const args = process.argv.slice(2);
const arg = (n, d) => (args.includes(n) ? args[args.indexOf(n) + 1] : d);
const ROOT = path.join(__dirname, "..", "..");
const core = require(path.join(ROOT, "core", "headless.js")).load();
const ctx = core.window;
["notes.js", "attention.js", "rates.js", "compass.js", "engine-lanes.js", "pacer.js", "versions.js"].forEach((f) => {
  const file = path.join(ROOT, "momentum", f);
  vm.runInContext(fs.readFileSync(file, "utf8"), vm.isContext(ctx) ? ctx : vm.createContext(ctx), { filename: file });
});
const E = ctx.CurioEngine;
const P = ctx.CurioPacer;
const R = ctx.CurioRates;
const M = ctx.CurioMomentum;
const ME = ctx.CurioMomentumEngine;
const V = ctx.CurioVersions;
const film = (id) => R.DEFAULT_FILMS.find((f) => f.id === id);
let n = 0;
const ok = (name, fn) => {
  fn();
  n++;
  console.log("ok", name);
};
const memory = () => {
  const m = {};
  return { getItem: (k) => (k in m ? m[k] : null), setItem: (k, v) => (m[k] = String(v)), raw: m };
};

assert(E.send({ type: "importFilm", film: ctx.CurioSeeds.starter() }).ok);
const LIMIT = 6;
const readEngine = () => ME.reading({ secondsPerBeat: 3, limit: LIMIT });
const before = readEngine();

ok("versions.js also works through require", () => {
  const R2 = require(path.join(ROOT, "momentum", "versions.js"));
  assert.strictEqual(typeof R2.compare, "function");
  assert.strictEqual(R2.KEY, "curiosities-momentum-versions-v1");
});

ok("a summary keeps one family letter and second per moment, and the numbers, never the film", () => {
  const s = V.summary(before);
  assert.strictEqual(s.moments.length, before.beats);
  assert.strictEqual(s.count, before.beats);
  const letters = new Set(Object.values(M.LETTERS).concat(""));
  s.moments.forEach(([l, sec], i) => {
    assert(letters.has(l), "a family letter: " + l);
    assert.strictEqual(sec, i * 3);
  });
  assert.strictEqual(Object.keys(s.stats).join(), ["movesPerMinute", "usualRest", "longestRest", "momentum", "pastLimit"].join());
  const p = P.numbers(before);
  assert.strictEqual(s.stats.movesPerMinute, p.movesPerMinute);
  assert.strictEqual(s.stats.usualRest, p.usualStretch);
  assert.strictEqual(s.stats.longestRest, p.longestStretch);
  assert(s.stats.pastLimit > 0, "the starter holds a family past 6 seconds");
  const text = JSON.stringify(V.snapshot(before, { film: "engine", n: 1, now: 1 }));
  assert(!/values|curiosity|"label"/.test(text), "no film inside: " + text.slice(0, 200));
  assert(text.length < 1200, "small: " + text.length);
  assert.strictEqual(V.familyOfLetter(M.mark("camera").letter), "camera");
});

ok('the default name is "Version N, hh:mm", and a name given is kept', () => {
  const at = new Date(2026, 9, 3, 9, 5).getTime();
  assert.strictEqual(V.snapshot(before, { n: 3, now: at }).name, "Version 3, 09:05");
  assert.strictEqual(V.snapshot(before, { n: 3, now: at, name: "  Before the chase  " }).name, "Before the chase");
});

ok("each film keeps at most 30 versions, the oldest dropped, and numbers keep counting", () => {
  let st = { versions: [] };
  for (let i = 1; i <= 34; i++) st = V.add(st, V.snapshot(before, { film: "engine", n: V.nextNumber(st, "engine"), now: 1000 + i }));
  st = V.add(st, V.snapshot(before, { film: "study:x", n: V.nextNumber(st, "study:x"), now: 5000 }));
  const mine = V.list(st, "engine");
  assert.strictEqual(mine.length, 30);
  assert.strictEqual(mine[0].n, 34, "newest first");
  assert.strictEqual(mine[29].n, 5, "versions 1 to 4 dropped");
  assert.strictEqual(V.list(st, "study:x").length, 1, "other films untouched");
  assert.strictEqual(V.nextNumber(st, "engine"), 35);
  st = V.remove(st, mine[0].id);
  assert.strictEqual(V.list(st, "engine").length, 29);
  assert.strictEqual(V.nextNumber(st, "engine"), 35, "a deleted number is not used again");
  st = V.clear(st, "engine");
  assert.strictEqual(V.list(st, "engine").length, 0);
  assert.strictEqual(V.list(st, "study:x").length, 1);
});

ok("saving and loading go through the storage key and survive broken storage", () => {
  const mem = memory();
  const st = V.add({}, V.snapshot(before, { film: "engine", n: 1, now: 7 }));
  assert(V.save(st, mem));
  assert.strictEqual(JSON.stringify(V.load(mem)), mem.raw[V.KEY]);
  mem.setItem(V.KEY, "{not json");
  assert.strictEqual(V.load(mem).versions.length, 0);
  assert.strictEqual(V.load({ getItem: () => { throw new Error("blocked"); } }).versions.length, 0);
  assert.strictEqual(V.save(st, { setItem: () => { throw new Error("full"); } }), false);
});

/* A real edit: Pace it on the starter film. */
const plan = P.plan(E, [film("fury-road")], { strength: "strong", limit: LIMIT });
assert(plan.changes.length >= 1);
assert(P.apply(plan.changes, plan.title).ok);
const after = readEngine();
E.undo();
const vBefore = V.snapshot(before, { film: "engine", n: 1, now: 1 });
const vAfter = V.snapshot(after, { film: "engine", n: 2, now: 2 });

ok("a Pace it change that shortens the longest rest reads better, with the reason", () => {
  const c = V.compare(vBefore, vAfter);
  assert.strictEqual(c.verdict.key, "better", JSON.stringify(c.rows) + c.verdict.reason);
  assert.strictEqual(c.verdict.words, "Better");
  assert(/^This version keeps the film moving better: /.test(c.verdict.reason), c.verdict.reason);
  assert(/^Attention moves ([\d.]+ more times? a minute \(from [\d.]+ to [\d.]+\)|about as often as before \([\d.]+ times a minute\)); the longest rest went from [\d.]+ to [\d.]+ seconds\.$/.test(c.sentences[0]), c.sentences[0]);
  assert(c.text.includes(c.verdict.reason));
  const row = (k) => c.rows.find((r) => r.key === k);
  assert(row("movesPerMinute").arrow !== "↓");
  assert.strictEqual(row("longestRest").arrow, "↓");
  assert.strictEqual(row("longestRest").words, "better");
  assert.strictEqual(c.aligned.length, before.beats);
  assert(c.changed >= 1 && c.aligned.some((m) => !m.same), "the strips differ somewhere");
  c.sentences.concat(c.verdict.reason).forEach((s) => assert(!/—|\bbeats?\b|undefined|NaN/.test(s), s));
});

ok("the same change the other way reads worse, and the same film about the same", () => {
  const w = V.compare(vAfter, vBefore);
  assert.strictEqual(w.verdict.key, "worse", w.verdict.reason);
  assert(/^This version lets the film sit still more: /.test(w.verdict.reason));
  assert(/the longest rest went from [\d.]+ to [\d.]+ seconds/.test(w.sentences[0]), w.sentences[0]);
  const s = V.compare(vBefore, V.snapshot(before, { film: "engine", n: 3, now: 3 }));
  assert.strictEqual(s.verdict.key, "same");
  assert.strictEqual(s.verdict.words, "About the same");
  assert(/none of the numbers moved much/.test(s.verdict.reason));
  assert(/about as often as before/.test(s.sentences[0]) && /stays at/.test(s.sentences[0]), s.sentences[0]);
  assert(V.sameReading(vBefore, V.snapshot(before, { n: 9, now: 9 })));
  assert(!V.sameReading(vBefore, vAfter));
});

ok("the words read like a person: 2 more times a minute, the longest rest from 21 to 9 seconds", () => {
  const base = { moments: [], limit: 20, count: 10, name: "a" };
  const a = Object.assign({}, base, { stats: { movesPerMinute: 4, usualRest: 12, longestRest: 21, momentum: 2, pastLimit: 1 } });
  const b = Object.assign({}, base, { stats: { movesPerMinute: 6, usualRest: 8, longestRest: 9, momentum: 2, pastLimit: 0 } });
  const c = V.compare(a, b);
  assert.strictEqual(c.sentences[0], "Attention moves 2 more times a minute (from 4 to 6); the longest rest went from 21 to 9 seconds.");
  assert.strictEqual(c.verdict.key, "better");
  assert(/^This version keeps the film moving better: less time past the limit, attention moving more often and a shorter longest rest\.$/.test(c.verdict.reason), c.verdict.reason);
});
ok("a film that gets rushed does not count more moves as better", () => {
  const base = { moments: [], limit: 20, count: 10, name: "a" };
  const a = Object.assign({}, base, { stats: { movesPerMinute: 20, usualRest: 3, longestRest: 8, momentum: 2, pastLimit: 0 } });
  const b = Object.assign({}, base, { stats: { movesPerMinute: 40, usualRest: 1.5, longestRest: 7, momentum: 2, pastLimit: 0 } });
  const c = V.compare(a, b);
  assert.strictEqual(c.rows[0].effect, 0);
  assert.strictEqual(c.verdict.key, "same");
  assert(c.sentences.some((x) => /may feel rushed/.test(x)));
});

ok("engine labels say what changed the film", () => {
  assert.strictEqual(V.reasonFor("Undo: Momentum: pace like Fury Road"), "after Undo");
  assert.strictEqual(V.reasonFor("Momentum: pace like Fury Road"), "after Pace it");
  assert.strictEqual(V.reasonFor("Set a point"), "after an engine change (Set a point)");
});
console.log(`\n${n} versions checks passed`);

if (args.includes("--browser")) browserCheck();

function browserCheck() {
  const http = require("http");
  const { chromium } = require("playwright");
  const SHOTS = arg("--shots", os.tmpdir());
  fs.mkdirSync(SHOTS, { recursive: true });
  const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".webmanifest": "application/manifest+json" };
  const serve = () =>
    new Promise((resolve) => {
      const server = http.createServer((req, res) => {
        const p = path.join(ROOT, decodeURIComponent(req.url.split("?")[0]).replace(/^\/+/, ""));
        if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) {
          res.writeHead(404);
          return res.end();
        }
        res.writeHead(200, { "content-type": TYPES[path.extname(p)] || "application/octet-stream" });
        fs.createReadStream(p).pipe(res);
      });
      server.listen(0, "127.0.0.1", () => resolve(server));
    });
  let failed = 0;
  const check = (cond, text) => {
    console.log((cond ? "ok   " : "FAIL ") + text);
    if (!cond) failed++;
  };
  (async () => {
    const server = await serve();
    const base = "http://127.0.0.1:" + server.address().port + "/";
    const browser = await chromium.launch();
    const errors = [];
    const three = arg("--three", "");
    async function open(viewport) {
      const page = await browser.newPage({ viewport });
      page.on("pageerror", (e) => errors.push(String(e && e.message)));
      page.on("console", (m) => m.type() === "error" && !/Failed to load resource|favicon|fonts\.g/.test(m.text()) && errors.push(m.text()));
      await page.route(/three\.min\.js$/, (r) => (three ? r.fulfill({ contentType: "text/javascript", body: fs.readFileSync(three, "utf8") }) : r.fulfill({ contentType: "text/javascript", body: "" })));
      await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
      await page.goto(base + "index.html");
      if (!(await page.evaluate(() => !!document.querySelector('script[src="momentum/load.js"]'))))
        await page.evaluate(() => {
          const s = document.createElement("script");
          s.src = "momentum/load.js";
          document.body.appendChild(s);
        });
      await page.waitForFunction(() => window.CurioMomentumUI && window.CurioVersions && window.CurioPacer && window.CurioEngine, null, { timeout: 10000 });
      await page.evaluate(() => window.CurioEngine.send({ type: "importFilm", film: window.CurioSeeds.starter() }));
      await page.waitForTimeout(1100);
      await page.evaluate(() => localStorage.removeItem("curiosities-momentum-versions-v1"));
      await page.evaluate(() => document.getElementById("lib-btn").click());
      await page.click("#lib-menu [data-momentum]");
      await page.waitForSelector(".mo-dlg[open]");
      await page.click('.mo-dlg [data-tab="attention"]');
      await page.evaluate(() => {
        const el = document.querySelector('.mo-dlg input[data-m="limit"]');
        el.value = "6";
        el.dispatchEvent(new Event("change", { bubbles: true }));
      });
      await page.click('.mo-dlg [data-tab="versions"]');
      await page.waitForSelector(".mo-dlg .vs-root");
      await page.selectOption('.mo-dlg select[data-vs="film"]', "engine");
      await page.waitForSelector(".mo-dlg .vs-root");
      return page;
    }
    const page = await open({ width: 1360, height: 900 });
    const where = await page.evaluate(() => {
      const b = document.querySelector('.mo-dlg [data-tab="versions"]');
      return [b.textContent, b.closest("[data-tabgroup]").dataset.tabgroup];
    });
    check(where[0] === "Versions" && where[1] === "fix", `a "Versions" tab in Fix it (${where.join(", ")})`);
    await page.fill('.mo-dlg input[data-vs="name"]', "Before pacing");
    await page.click('.mo-dlg [data-vs="keep"]');
    check((await page.$$(".mo-dlg .vs-item")).length === 1, "Keep this version keeps one");
    check(await page.evaluate(() => document.querySelector(".mo-dlg .vs-name").textContent === "Before pacing"), "with the name given");
    /* Pace it: one batch in the engine, which should keep exactly one version by itself. */
    await page.evaluate(() => {
      const P = window.CurioPacer;
      const film = window.CurioRates.DEFAULT_FILMS.find((f) => f.id === "fury-road");
      const p = P.plan(window.CurioEngine, [film], { strength: "strong", limit: 6 });
      P.apply(p.changes, p.title);
    });
    await page.waitForTimeout(1500);
    const autos = await page.$$eval(".mo-dlg .vs-item small", (s) => s.map((x) => x.textContent).filter((t) => /kept by itself/.test(t)));
    check(autos.length === 1 && /after Pace it/.test(autos[0]), "Pace it keeps one version by itself: " + autos.join(" | "));
    await page.click('.mo-dlg [data-vs="keep"]');
    const items = (await page.$$(".mo-dlg .vs-item")).length;
    check(items === 3, "three versions now: " + items);
    const names = await page.$$eval(".mo-dlg .vs-name", (s) => s.map((x) => x.textContent));
    check(/^Version 3, \d\d:\d\d$/.test(names[0]) && names[2] === "Before pacing", "newest first, default name: " + names.join(" | "));
    /* Compare the named one with the newest. */
    const ids = await page.$$eval(".mo-dlg [data-vs-pick]", (s) => s.map((x) => x.dataset.vsPick));
    for (const id of ids) if (await page.isChecked(`.mo-dlg [data-vs-pick="${id}"]`)) await page.click(`.mo-dlg [data-vs-pick="${id}"]`);
    await page.click(`.mo-dlg [data-vs-pick="${ids[2]}"]`);
    await page.click(`.mo-dlg [data-vs-pick="${ids[0]}"]`);
    const verdict = await page.$eval(".mo-dlg .vs-verdict", (v) => [v.className, v.textContent.replace(/\s+/g, " ").trim()]);
    check(/vs-better/.test(verdict[0]) && /is better than Before pacing/.test(verdict[1]) && /keeps the film moving better/.test(verdict[1]), "the verdict reads better: " + verdict[1]);
    const strips = await page.$$eval(".mo-dlg .vs-pair .vs-strip", (s) => s.map((x) => x.children.length));
    check(strips.length === 2 && strips[0] === strips[1] && strips[0] > 0, "two strips, aligned moment by moment: " + strips.join(" and "));
    check((await page.$$(".mo-dlg .vs-nums tbody tr")).length === 5, "five numbers with arrows");
    await page.screenshot({ path: path.join(SHOTS, "versions-compare.png") });
    await page.evaluate(() => (document.querySelector(".mo-dlg").scrollTop = 900));
    await page.screenshot({ path: path.join(SHOTS, "versions-list.png") });
    await page.click(`.mo-dlg [data-vs-del="${ids[1]}"]`);
    check((await page.$$(".mo-dlg .vs-item")).length === 2, "Delete removes one");
    await page.click('.mo-dlg [data-vs="clear"]');
    check(!!(await page.$(".mo-dlg .vs-confirm")), "Clear all asks first");
    await page.screenshot({ path: path.join(SHOTS, "versions-confirm.png") });
    await page.click('.mo-dlg [data-vs="clear-no"]');
    check((await page.$$(".mo-dlg .vs-item")).length === 2, "No keeps them");
    await page.click('.mo-dlg [data-vs="clear"]');
    await page.click('.mo-dlg [data-vs="clear-yes"]');
    check((await page.$$(".mo-dlg .vs-item")).length === 0, "Yes deletes them all");
    const stored = await page.evaluate(() => localStorage.getItem("curiosities-momentum-versions-v1") || "");
    check(!/values/.test(stored), "storage never holds the film");

    const phone = await open({ width: 375, height: 800 });
    await phone.click('.mo-dlg [data-vs="keep"]');
    await phone.evaluate(() => window.CurioEngine.send({ type: "importFilm", film: window.CurioSeeds.starter() }));
    await phone.evaluate(() => {
      const P = window.CurioPacer;
      const film = window.CurioRates.DEFAULT_FILMS.find((f) => f.id === "fury-road");
      const p = P.plan(window.CurioEngine, [film], { strength: "strong", limit: 6 });
      P.apply(p.changes, p.title);
    });
    await phone.waitForTimeout(1500);
    const wide = await phone.evaluate(() => {
      const d = document.querySelector(".mo-dlg");
      return [document.documentElement.scrollWidth - window.innerWidth, d.scrollWidth - d.clientWidth];
    });
    check(wide[0] <= 0 && wide[1] <= 0, `no sideways scroll at 375px (page ${wide[0]}px, window ${wide[1]}px over)`);
    await phone.screenshot({ path: path.join(SHOTS, "versions-phone.png") });
    await phone.evaluate(() => (document.querySelector(".mo-dlg").scrollTop = 600));
    await phone.screenshot({ path: path.join(SHOTS, "versions-phone-2.png") });
    await phone.evaluate(() => (document.querySelector(".mo-dlg").scrollTop = 1400));
    await phone.screenshot({ path: path.join(SHOTS, "versions-phone-3.png") });

    check(errors.length === 0, "no page errors" + (errors.length ? ": " + errors.join(" | ") : ""));
    await browser.close();
    server.close();
    console.log(failed ? `\n${failed} browser checks FAILED` : "\nbrowser checks passed");
    process.exit(failed ? 1 : 0);
  })().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
