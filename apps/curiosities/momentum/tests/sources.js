/* Momentum as modulation sources (momentum/sources.js).
   node momentum/tests/sources.js                     checks with no page
   NODE_PATH=/opt/node22/lib/node_modules node momentum/tests/sources.js --browser [--three <three.min.js>] [--shots <dir>]

   With no page: loads the shared core (core/headless.js, the automation and the engine included), the momentum
   core, perform.js and sources.js, with a stand-in Screen (row() and on()). Checks the three sources are added to
   the automation, their values stay in 0..1 (over is 0 or 1), they follow the playhead and the film, they agree
   with a fresh reading, they follow Perform while it runs, they are cheap (a thousand automation reads read the
   film at most once), and nothing happens with an automation that has no addSource.

   With --browser: the app's page, the sources listed, the Automation patch bay with a patch moved by
   "Momentum: attention held", the Screen's playhead and an engine change moving the value, no page errors, no
   sideways scroll at 375 px. Screenshots go to --shots. */
const path = require("path");
const fs = require("fs");
const os = require("os");
const vm = require("vm");
const assert = require("assert");

const ROOT = path.join(__dirname, "..", "..");
const args = process.argv.slice(2);
const arg = (n, d) => (args.includes(n) ? args[args.indexOf(n) + 1] : d);
const IDS = ["momentum:attention", "momentum:level", "momentum:over"];

function load(ctx, files) {
  files.forEach((f) => {
    const file = path.join(ROOT, "momentum", f);
    vm.runInContext(fs.readFileSync(file, "utf8"), vm.isContext(ctx) ? ctx : vm.createContext(ctx), { filename: file });
  });
}

function nodeChecks() {
  const core = require(path.join(ROOT, "core", "headless.js")).load();
  const ctx = core.window;
  /* A stand-in Screen: the playhead and its listeners. */
  let row = 0;
  const heard = [];
  ctx.CurioScreen = { row: () => row, on: (fn) => (heard.push(fn), () => heard.splice(heard.indexOf(fn), 1)) };
  const moveTo = (r) => ((row = r), heard.slice().forEach((fn) => fn({ type: "row" })));
  load(ctx, ["notes.js", "attention.js", "rates.js", "compass.js", "engine-lanes.js", "perform.js", "sources.js"]);
  const S = ctx.CurioMomentumSources;
  const Au = ctx.CurioAuto;
  const E = ctx.CurioEngine;
  const A = ctx.CurioAttention;
  const ME = ctx.CurioMomentumEngine;
  let n = 0;
  const ok = (name, fn) => {
    fn();
    n++;
    console.log("ok", name);
  };
  const vals = () => ({ attention: S.value("attention"), level: S.value("level"), over: S.value("over") });
  const setPrefs = (p) => {
    ctx.localStorage.setItem("curiosities-momentum-v1", JSON.stringify(p));
    S.refresh();
  };
  /* What the sources should say: a fresh reading of My film up to the playhead. */
  const R = ctx.CurioRates;
  const usual = () => R.limitFor(R.average(R.DEFAULT_FILMS.filter((f) => f.id === "pulp-fiction"))); /* the Momentum window's default */
  const fresh = (limit) => S.valuesOf(A.read(ME.flatBeats().slice(0, row + 1), { secondsPerBeat: 3, limit: limit || usual() }));
  const near = (a, b) => ["attention", "level", "over"].every((k) => Math.abs(a[k] - b[k]) < 1e-9);

  ok("the three sources are added to the automation, with plain labels", () => {
    const list = Au.sources();
    IDS.forEach((id) => assert(list.some((x) => x.id === id && x.mod === "source:" + id), id + " missing"));
    list.filter((x) => IDS.includes(x.id)).forEach((x) => assert(/^Momentum: /.test(x.label) && !/—/.test(x.label), x.label));
  });
  ok("with no film yet every source reads 0", () => {
    const v = vals();
    assert.deepStrictEqual([v.attention, v.level, v.over], [0, 0, 0]);
  });
  assert(E.send({ type: "importFilm", film: ctx.CurioSeeds.starter() }).ok);
  const rows = E.state().rows.length;
  ok("values stay in 0..1 at every moment, and over is a gate (0 or 1)", () => {
    setPrefs({ limit: 9 });
    let sawOver = false;
    for (let r = 0; r < rows; r++) {
      moveTo(r);
      const v = vals();
      ["attention", "level", "over"].forEach((k) => assert(v[k] >= 0 && v[k] <= 1, `${k} ${v[k]} at ${r}`));
      assert(v.over === 0 || v.over === 1);
      if (v.over) {
        sawOver = true;
        assert.strictEqual(v.attention, 1, "past the limit, attention is at 1");
      }
      assert(near(v, fresh(9)), `row ${r}: ${JSON.stringify(v)} vs ${JSON.stringify(fresh(9))}`);
    }
    assert(sawOver, "a 9 second limit is passed somewhere in the starter film");
    setPrefs({});
  });
  ok("they follow the Screen's playhead", () => {
    moveTo(0);
    const a0 = vals().attention;
    moveTo(rows - 1);
    const a1 = vals().attention;
    assert(a1 > a0, `attention climbs while one family holds it (${a0} then ${a1})`);
    /* Even when the Screen does not say so, a new playhead is seen on the next read. */
    row = 0;
    assert.strictEqual(vals().attention, a0);
  });
  ok("they change when the film changes (an engine change), and one undo brings them back", () => {
    moveTo(rows - 1);
    const before = vals();
    const last = E.state().rows[rows - 1].id;
    /* A Compass move at the last moment (one notch of another family), the way the Screen's panel makes one:
       try the families until one takes attention there. */
    const holding = ctx.CurioAttention.read(ME.flatBeats(), { secondsPerBeat: 3, limit: usual() }).stats.currentRun.family;
    let moved = false;
    for (const f of ctx.CurioMomentum.FAMILIES) {
      if (f.id === holding) continue;
      const mv = ME.moveAt({ family: f.id }, last);
      if (!mv) continue;
      assert(ME.applyMove(mv).ok);
      const v = vals();
      if (v.attention !== before.attention || v.level !== before.level) {
        moved = true;
        break;
      }
      E.undo();
    }
    assert(moved, "some family's move changes the reading at the last moment");
    const after = vals();
    assert(near(after, fresh()), "agrees with a fresh reading");
    assert(after.attention !== before.attention || after.level !== before.level, `the values moved (${JSON.stringify(before)} then ${JSON.stringify(after)})`);
    E.undo();
    assert(near(vals(), before), "undo brings them back");
  });
  ok("cheap: a thousand automation frames read the film at most once", () => {
    moveTo(2);
    const key = Au.PARAMS[0].key;
    Au.set(key, { mod: "source:momentum:attention", depth: 1 });
    Au.start(key);
    const s0 = S.stats();
    let m = 0;
    for (let i = 0; i < 1000; i++) m = Au.m(key);
    const s1 = S.stats();
    assert(s1.reads - s0.reads >= 1000, "every frame asks the source");
    assert(s1.computes - s0.computes <= 1, `the film was read ${s1.computes - s0.computes} times`);
    assert(Math.abs(m - vals().attention) < 1e-9, "the patch follows the source");
    Au.set(key, { depth: 0.5 });
    assert(Math.abs(Au.m(key) - vals().attention * 0.5) < 1e-9, "Depth scales it");
    Au.stop(key);
    Au.set(key, { mod: "lfo", depth: 1 });
  });
  ok("while Perform runs they follow its live meter, and the film again once it stops", () => {
    let board = { emotion: "joyful" };
    ctx.CuriosityBoard = { panels: () => [board], values: () => board, on: () => () => {} };
    const P = ctx.CurioPerform;
    const film = vals();
    assert(P.start());
    P.tick();
    const want = S.fromPerform(P.state());
    assert(near(vals(), want), `Perform: ${JSON.stringify(vals())} vs ${JSON.stringify(want)}`);
    const c0 = S.stats().computes;
    for (let i = 0; i < 200; i++) S.value("level");
    assert.strictEqual(S.stats().computes, c0, "no film reading while Perform runs");
    P.stop();
    assert(near(vals(), film), "back to My film");
    delete ctx.CuriosityBoard;
  });
  ok("the pure parts: valuesOf and fromPerform clamp to 0..1", () => {
    const same = (a, b) => assert.strictEqual(JSON.stringify(a), JSON.stringify(b));
    same(S.valuesOf(null), { attention: 0, level: 0, over: 0 });
    same(S.valuesOf({ limit: 10, stats: { momentum: 9, currentRun: { dur: 25 } } }), { attention: 1, level: 1, over: 1 });
    same(S.valuesOf({ limit: 10, stats: { momentum: 2.5, currentRun: { dur: 5 } } }), { attention: 0.5, level: 0.5, over: 0 });
    same(S.fromPerform({ attention: 3, momentum: -1, over: true }), { attention: 1, level: 0, over: 1 });
  });
  ok("an automation with no addSource: nothing is added and nothing breaks", () => {
    const bare = vm.createContext({ console, CurioAuto: { PARAMS: [] } });
    bare.window = bare;
    load(bare, ["sources.js"]);
    assert.strictEqual(bare.CurioMomentumSources.register(), false);
    assert.strictEqual(bare.CurioMomentumSources.value("attention"), 0);
  });
  console.log(`${n} momentum source checks passed`);
}

async function browserChecks() {
  const http = require("http");
  const { chromium } = require("playwright");
  const SHOTS = arg("--shots", os.tmpdir());
  const three = arg("--three", "");
  const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".webmanifest": "application/manifest+json" };
  const server = await new Promise((resolve) => {
    const s = http.createServer((req, res) => {
      const p = path.join(ROOT, decodeURIComponent(req.url.split("?")[0]).replace(/^\/+/, ""));
      if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) {
        res.writeHead(404);
        return res.end();
      }
      res.writeHead(200, { "content-type": TYPES[path.extname(p)] || "application/octet-stream" });
      fs.createReadStream(p).pipe(res);
    });
    s.listen(0, "127.0.0.1", () => resolve(s));
  });
  const base = "http://127.0.0.1:" + server.address().port + "/";
  const browser = await chromium.launch();
  const errors = [];
  let failed = 0;
  const ok = (cond, text) => {
    console.log((cond ? "ok   " : "FAIL ") + text);
    if (!cond) failed++;
  };
  async function newPage(viewport) {
    const page = await browser.newPage({ viewport });
    page.on("pageerror", (e) => errors.push(String(e && e.message)));
    page.on("console", (m) => m.type() === "error" && !/Failed to load resource|favicon|fonts\.g/.test(m.text()) && errors.push(m.text()));
    await page.route(/three\.min\.js$/, (r) => r.fulfill({ contentType: "text/javascript", body: three ? fs.readFileSync(three, "utf8") : "" }));
    await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
    await page.goto(base + "index.html");
    await page.evaluate(() => {
      if (document.querySelector('script[src="momentum/load.js"]')) return;
      const s = document.createElement("script");
      s.src = "momentum/load.js";
      document.body.appendChild(s);
    });
    await page.waitForFunction(() => window.CurioMomentumSources && window.CurioAuto && window.CurioEngine, null, { timeout: 15000 });
    await page.evaluate(() => {
      try {
        localStorage.removeItem("curiosities-momentum-v1");
      } catch (e) {}
      window.CurioMomentumSources.refresh();
    });
    return page;
  }
  try {
    const page = await newPage({ width: 1280, height: 900 });
    const listed = await page.evaluate((ids) => {
      const l = window.CurioAuto.sources();
      return ids.map((id) => {
        const x = l.find((s) => s.id === id);
        return x ? [x.label, x.value] : null;
      });
    }, IDS);
    ok(listed.every((x) => x && x[1] >= 0 && x[1] <= 1), "the three sources are listed, each 0 to 1: " + JSON.stringify(listed));

    /* The Screen's playhead and an engine change move the value. */
    const moved = await page.evaluate(() => {
      const E = window.CurioEngine;
      const SC = window.CurioScreen;
      const S = window.CurioMomentumSources;
      if (!E.state().rows.length && window.CurioSeeds) E.send({ type: "importFilm", film: window.CurioSeeds.starter() });
      const st = E.state();
      const n = st.rows.length;
      const at = (r) => {
        if (SC && SC.setRow) SC.setRow(r);
        return S.value("attention");
      };
      const out = { n, screen: !!(SC && SC.row), first: at(0), lastRow: null };
      out.last = at(n - 1);
      out.lastRow = SC && SC.row ? SC.row() : null;
      const c0 = S.stats().computes;
      for (let i = 0; i < 500; i++) S.value("attention");
      out.cheap = S.stats().computes - c0;
      /* A Compass move at the last moment (one notch of another family), as in the Node checks. */
      const last = st.rows[n - 1].id;
      const ME = window.CurioMomentumEngine;
      const before = [S.value("attention"), S.value("level")];
      for (const f of window.CurioMomentum.FAMILIES) {
        const mv = ME.moveAt({ family: f.id }, last);
        if (!mv || !ME.applyMove(mv).ok) continue;
        if (S.value("attention") !== before[0] || S.value("level") !== before[1]) break;
        E.undo();
      }
      out.changed = [S.value("attention"), S.value("level")];
      out.before = before;
      E.undo();
      out.undone = [S.value("attention"), S.value("level")];
      return out;
    });
    ok(moved.n > 1 && moved.screen, `My film has ${moved.n} moments and the Screen is there`);
    ok(moved.last !== moved.first, `the playhead moves the value (${moved.first.toFixed(3)} at moment 1, ${moved.last.toFixed(3)} at moment ${moved.lastRow + 1})`);
    ok(moved.cheap === 0, `500 reads with nothing changed read the film ${moved.cheap} times`);
    ok(JSON.stringify(moved.changed) !== JSON.stringify(moved.before) && JSON.stringify(moved.undone) === JSON.stringify(moved.before), `an engine change moves it and Undo puts it back (${JSON.stringify(moved.before)}, ${JSON.stringify(moved.changed)}, ${JSON.stringify(moved.undone)})`);

    /* The Automation patch bay: a patch moved by Momentum. */
    await page.evaluate(() => document.getElementById("lib-btn").click());
    await page.click('#lib-menu [data-tab="automate"]');
    await page.waitForSelector('#automate [data-mod="source:momentum:attention"]', { timeout: 10000 });
    await page.click('#automate [data-mod="source:momentum:attention"]');
    await page.waitForSelector('#automate [data-mod="source:momentum:attention"].on', { timeout: 5000 });
    const card = await page.evaluate(() => {
      const b = document.querySelector('#automate [data-mod="source:momentum:attention"]');
      const face = b.closest(".au-face") || b.closest(".au-card") || document.getElementById("automate");
      const labels = [...face.querySelectorAll("[data-mod]")].map((x) => x.textContent.trim());
      return { labels, depth: /Depth/.test(face.textContent) };
    });
    ok(card.labels.includes("Momentum: attention held") && card.labels.includes("Momentum: past the limit") && card.depth, "the patch offers the Momentum sources with a Depth knob: " + card.labels.join(", "));
    await page.evaluate(() => document.querySelector('#automate [data-mod="source:momentum:attention"]').scrollIntoView({ block: "center" }));
    await page.screenshot({ path: path.join(SHOTS, "sources-patch.png") });
    const followed = await page.evaluate(() => {
      const A = window.CurioAuto;
      const key = A.PARAMS.find((p) => A.patch(p.key).mod === "source:momentum:attention");
      const k = key ? key.key : null;
      if (!k) return null;
      A.start(k);
      const m = A.m(k);
      A.stop(k);
      A.set(k, { mod: "lfo" });
      return { m, v: window.CurioMomentumSources.value("attention") };
    });
    ok(!!followed && Math.abs(followed.m - followed.v) < 1e-9, "the running patch follows the source: " + JSON.stringify(followed));
    await page.close();

    const phone = await newPage({ width: 375, height: 800 });
    await phone.evaluate(() => document.getElementById("lib-btn").click());
    await phone.click('#lib-menu [data-tab="automate"]');
    await phone.waitForSelector('#automate [data-mod="source:momentum:attention"]', { timeout: 10000 });
    await phone.click('#automate [data-mod="source:momentum:over"]');
    await phone.waitForTimeout(200);
    const wide = await phone.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    ok(wide <= 1, `no sideways scroll at 375 px (${wide})`);
    await phone.evaluate(() => document.querySelector('#automate [data-mod="source:momentum:over"]').scrollIntoView({ block: "center" }));
    await phone.screenshot({ path: path.join(SHOTS, "sources-phone.png") });
    await phone.evaluate(() => {
      const A = window.CurioAuto;
      A.PARAMS.forEach((p) => /^source:momentum/.test(A.patch(p.key).mod) && A.set(p.key, { mod: "lfo" }));
    });
    ok(errors.length === 0, "no page errors" + (errors.length ? ": " + errors.slice(0, 3).join(" | ") : ""));
  } catch (e) {
    console.log("FAIL " + (e && e.stack));
    failed++;
  } finally {
    await browser.close();
    server.close();
  }
  if (failed) {
    console.log(failed + " browser checks failed");
    process.exit(1);
  }
  console.log("momentum source browser checks passed; screenshots in " + SHOTS);
}

nodeChecks();
if (args.includes("--browser"))
  browserChecks().catch((e) => {
    console.error(e);
    process.exit(1);
  });
