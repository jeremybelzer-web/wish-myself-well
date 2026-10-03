/* Panel timing checks: node apps/curiosities/momentum/tests/timing.js [--browser] [--three <three.min.js>] [--shots <dir>]

   With no page: loads the shared core and the curiosity database (core/headless.js), then the momentum core,
   comedy-timing.js and timing.js, and checks the rules: a held family gets shorter panels (Fresh, Getting long,
   Too long), a move gets a longer one, a comedy payoff gets half a second more, every hold stays between 0.5 and
   8 seconds, the totals, and the JSON and CSV downloads.

   With --browser (needs Playwright and Chromium; set NODE_PATH to where Playwright is installed): the app's page
   with two seeded storyboard scenes, Momentum, the Panel timing tab, Play with this timing (the preview flips
   through the panels and stops at the end, with Stop, and on a tab change), no page errors, and no sideways
   scroll at 375 px. Screenshots go to --shots. */
const path = require("path");
const fs = require("fs");
const vm = require("vm");
const os = require("os");
const assert = require("assert");

const ROOT = path.join(__dirname, "..", "..");
const args = process.argv.slice(2);
const arg = (n, d) => (args.includes(n) ? args[args.indexOf(n) + 1] : d);
const same = (a, b) => assert.strictEqual(JSON.stringify(a), JSON.stringify(b));

function nodeChecks() {
  const core = require(path.join(ROOT, "core", "headless.js")).load();
  const ctx = core.window;
  ["notes.js", "attention.js", "rates.js", "compass.js", "engine-lanes.js", "comedy-timing.js", "timing.js"].forEach((f) => {
    const file = path.join(ROOT, "momentum", f);
    vm.runInContext(fs.readFileSync(file, "utf8"), vm.isContext(ctx) ? ctx : vm.createContext(ctx), { filename: file });
  });
  const T = ctx.CurioPanelTiming;
  const A = ctx.CurioAttention;
  const M = ctx.CurioMomentum;
  let n = 0;
  const ok = (name, fn) => {
    fn();
    n++;
    console.log("ok", name);
  };
  const optsOf = (id) => {
    const c = M.find(id);
    return (c && (c.options || (c.sliders && c.sliders[0] && c.sliders[0].scale))) || ["a", "b"];
  };
  const still = { id: "s1", name: "One feeling held", panels: Array.from({ length: 12 }, (_, i) => ({ v: { emotion: i % 2 ? "angry" : "melancholy" } })) };
  const varied = { id: "s2", name: "Always moving", panels: ["emotion", "shotSize", "music", "characterPath", "setting", "comedyDevice"].map((id) => ({ v: { [id]: optsOf(id)[1] || optsOf(id)[0] } })) };

  ok("Node has the pure part and no tab", () => {
    assert.strictEqual(typeof T.panelTiming, "function");
    assert.strictEqual(typeof T.mountTab, "undefined");
  });
  ok("one family held: the first panel settles in, then Fresh, Getting long and Too long get shorter", () => {
    const r = T.forScene(still, { base: 3, limit: 20 });
    assert.strictEqual(r.panels.length, 12);
    same(r.panels.map((p) => p.hold), [3.8, 3, 3, 3, 3, 2.3, 2.3, 1.5, 1.5, 1.5, 1.5, 1.5]);
    assert.strictEqual(r.panels[0].kind, "start");
    same(r.panels.slice(1).map((p) => p.status.icon).join(""), "●●●●▲▲■■■■■");
    assert(/past the 20 second limit \(■ Too long\)/.test(r.panels[8].why), r.panels[8].why);
    assert.strictEqual(r.before, 36);
    assert(r.after < r.before, "a held scene gets shorter");
  });
  ok("a move to another family holds longer, so the new thing lands", () => {
    const r = T.forScene(varied, { base: 3, limit: 20 });
    const moves = r.panels.filter((p) => p.kind === "move");
    assert(moves.length >= 3, "the varied scene moves often");
    moves.forEach((p) => {
      assert.strictEqual(p.hold, 4.5);
      assert(/Attention moves to .* so it stays longer and the new thing lands/.test(p.why), p.why);
    });
    assert(r.after > r.before, "a scene that keeps moving gets longer");
  });
  ok("the reading's own panels: segments start on the panel they begin, and empty panels keep the usual time", () => {
    const rd = A.read([{ values: {} }, { values: {} }, { values: { emotion: "angry" } }], { secondsPerBeat: 2, limit: 20 });
    const r = T.panelTiming(rd, { base: 2 });
    same(r.panels.map((p) => p.kind), ["empty", "empty", "start"]);
    same(r.panels.map((p) => p.hold), [2, 2, 2.5]);
    assert(/Nothing holds attention yet/.test(r.panels[0].why));
    const none = T.panelTiming(null, {});
    same([none.panels.length, none.before, none.after], [0, 0, 0]);
  });
  ok("a comedy payoff gets half a second more; payoffs come from Comedy timing", () => {
    const sc = { panels: [{ v: { comicBeat: "setup planted" } }, { v: { emotion: "anxious" } }, { v: { music: "none" } }, { v: { comicBeat: "payoff lands" } }, { v: { emotion: "joyful" } }] };
    const beats = sc.panels.map((p) => ({ values: p.v }));
    const pays = T.payoffsOf(beats, 3);
    same(pays, [3]);
    const r = T.forScene(sc, { base: 3, limit: 20 });
    const p = r.panels[3];
    assert(p.payoff && /comedy payoff lands here/.test(p.why));
    const without = T.forScene(sc, { base: 3, limit: 20, payoffs: [] }).panels[3];
    assert.strictEqual(Math.round((p.hold - without.hold) * 10) / 10, 0.5);
  });
  ok("every hold stays between 0.5 and 8 seconds", () => {
    const slow = T.forScene(varied, { base: 7, limit: 20 });
    assert(slow.panels.every((p) => p.hold <= 8 && p.hold >= 0.5));
    assert(slow.panels.some((p) => p.clamped && p.hold === 8 && /between 0.5 and 8 seconds/.test(p.why)));
    const fast = T.forScene(still, { base: 0.6, limit: 2 });
    assert(fast.panels.every((p) => p.hold >= 0.5));
    assert(fast.panels.some((p) => p.clamped && p.hold === 0.5));
    const sum = Math.round(slow.panels.reduce((a, p) => a + p.hold, 0) * 10) / 10;
    assert.strictEqual(slow.after, sum);
  });
  ok("plain words: no em-dashes, every panel says why", () => {
    [still, varied].forEach((s) => T.forScene(s, { base: 3, limit: 20 }).panels.forEach((p) => assert(p.why.length > 20 && !/—/.test(p.why), p.why)));
  });
  ok("the JSON and CSV downloads carry each panel's seconds", () => {
    const r = T.forScene(varied, { base: 3, limit: 20 });
    const j = JSON.parse(T.toJson(r, { scene: varied }));
    assert.strictEqual(j.format, "curiomatic-panel-timing");
    assert.strictEqual(j.scene.name, "Always moving");
    assert.strictEqual(j.panels.length, 6);
    assert.strictEqual(j.panels[0].panel, 1);
    assert.strictEqual(j.totalAfter, r.after);
    const csv = T.toCsv(r).trim().split("\n");
    assert.strictEqual(csv[0], "panel,seconds,family,curiosity,kind,payoff,why");
    assert.strictEqual(csv.length, 7);
  });
  ok("the practice scenes all read", () => {
    core.CuriosityDB.studiesExport().studies.forEach((s) => {
      const rd = A.fromStudy(s, { secondsPerBeat: 3, limit: 20 });
      const r = T.panelTiming(rd, { base: 3, limit: 20 });
      assert.strictEqual(r.panels.length, rd.beats, s.title);
      assert(r.panels.every((p) => p.hold >= 0.5 && p.hold <= 8), s.title);
    });
  });
  console.log(`${n} panel timing checks passed`);
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
    await page.route(/three\.min\.js$/, (r) => (three ? r.fulfill({ contentType: "text/javascript", body: fs.readFileSync(three, "utf8") }) : r.fulfill({ contentType: "text/javascript", body: "" })));
    await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
    await page.goto(base + "index.html");
    await page.evaluate(() => {
      if (document.querySelector('script[src="momentum/load.js"]')) return;
      const s = document.createElement("script");
      s.src = "momentum/load.js";
      document.body.appendChild(s);
    });
    await page.waitForFunction(() => window.CurioMomentumUI && window.CurioPanelTiming && window.CuriosityStoryboard, null, { timeout: 15000 });
    /* Two seeded scenes: one feeling held on, and one that keeps moving (with a comedy payoff). */
    await page.evaluate(() => {
      const M = window.CurioMomentum;
      const opt = (id) => {
        const c = M.find(id);
        const o = (c.options || (c.sliders && c.sliders[0] && c.sliders[0].scale) || ["a", "b"]).slice(0, 2);
        return o[1] || o[0];
      };
      const still = { name: "One feeling held", panels: Array.from({ length: 12 }, (_, i) => ({ v: { emotion: i % 2 ? "angry" : "melancholy" }, line: { who: "", text: "" } })) };
      const varied = { name: "Always moving", panels: [{ comicBeat: "setup planted" }, { shotSize: opt("shotSize") }, { music: "none" }, { comicBeat: "payoff lands" }, { characterPath: opt("characterPath") }, { setting: opt("setting") }].map((v) => ({ v, line: { who: "", text: "" } })) };
      try {
        localStorage.removeItem("curiosities-momentum-v1");
        localStorage.removeItem("curiosities-momentum-timing-v1");
      } catch (e) {}
      window.CuriosityStoryboard.putScenes("timingtest", [still, varied]);
    });
    return page;
  }
  try {
    const page = await newPage({ width: 1280, height: 900 });
    /* Short panels so the preview plays through quickly. */
    await page.evaluate(() => {
      const p = JSON.parse(localStorage.getItem("curiosities-momentum-v1") || "{}");
      p.secondsPerPanel = 0.5;
      localStorage.setItem("curiosities-momentum-v1", JSON.stringify(p));
    });
    await page.reload();
    await page.waitForFunction(() => window.CurioMomentumUI && window.CurioPanelTiming, null, { timeout: 15000 });
    await page.evaluate(() => document.getElementById("lib-btn").click());
    await page.click("#lib-menu [data-momentum]");
    await page.waitForSelector(".mo-dlg[open]");
    const tabInfo = await page.evaluate(() => {
      const t = document.querySelector('.mo-dlg [data-tab="timing"]');
      const g = t && t.closest(".mo-tabgroup");
      return { label: t && t.textContent.trim(), group: g && g.querySelector(".mo-tabgroup-name").textContent.trim(), last: g && [...g.querySelectorAll("[data-tab]")].map((x) => x.dataset.tab).slice(-2).includes("timing") };
    });
    ok(tabInfo.label === "Panel timing" && /Fix it/i.test(tabInfo.group) && tabInfo.last, `the tab sits at the end of Fix it (${JSON.stringify(tabInfo)})`);
    await page.click('.mo-dlg [data-tab="timing"]');
    await page.waitForSelector(".mo-dlg .mpt-root .mpt-col");
    const scenes = await page.$$eval(".mo-dlg [data-mpt-scene] option", (o) => o.map((x) => x.textContent));
    ok(scenes.some((s) => /One feeling held/.test(s)) && scenes.some((s) => /Always moving/.test(s)), "both seeded scenes are listed");
    const held = await page.evaluate(() => {
      const sel = document.querySelector(".mo-dlg [data-mpt-scene]");
      return { scene: sel.options[sel.selectedIndex].textContent, cols: document.querySelectorAll(".mo-dlg .mpt-col").length, rows: document.querySelectorAll(".mo-dlg .mpt-rows li").length, tiles: [...document.querySelectorAll(".mo-dlg .mpt-root .mo-tile-v")].map((x) => x.textContent) };
    });
    ok(held.cols === held.rows && held.cols > 0, `one bar and one reason per panel (${held.cols})`);
    ok(held.tiles.length === 3, "scene length today, with this timing, shortest to longest: " + held.tiles.join(" | "));
    await page.screenshot({ path: path.join(SHOTS, "timing.png") });

    const want = await page.$eval(".mo-dlg [data-mpt-scene]", (s) => [...s.options].find((o) => /Always moving/.test(o.textContent)).value);
    await page.selectOption(".mo-dlg [data-mpt-scene]", want);
    await page.waitForFunction(() => document.querySelectorAll(".mo-dlg .mpt-col").length === 6);
    ok(await page.evaluate(() => !!document.querySelector(".mo-dlg .mpt-pay")), "the comedy payoff is marked P");

    /* Play: the preview flips through the panels and stops at the end. */
    await page.click(".mo-dlg [data-mpt-play]");
    const first = await page.evaluate(() => ({ playing: window.CurioPanelTiming.playing(), shown: !document.querySelector(".mo-dlg .mpt-preview").hidden, at: document.querySelector(".mo-dlg .mpt-root").parentElement.dataset.at, btn: document.querySelector(".mo-dlg [data-mpt-play]").textContent }));
    ok(first.playing && first.shown && first.at === "0" && first.btn === "Stop", "Play shows panel 1 in the preview: " + JSON.stringify(first));
    await page.waitForFunction(() => Number(document.querySelector(".mo-dlg .mpt-root").parentElement.dataset.at) >= 2, null, { timeout: 8000 });
    await page.screenshot({ path: path.join(SHOTS, "timing-playing.png") });
    ok(await page.evaluate(() => document.querySelectorAll(".mo-dlg .mpt-col.on").length === 1), "the panel on show is marked in the bars");
    await page.waitForFunction(() => !window.CurioPanelTiming.playing(), null, { timeout: 15000 });
    const end = await page.evaluate(() => ({ text: document.querySelector(".mo-dlg .mpt-now").textContent, btn: document.querySelector(".mo-dlg [data-mpt-play]").textContent }));
    ok(/^The end\./.test(end.text) && end.btn === "Play with this timing", "it stops at the end: " + end.text);

    /* Stop, and a tab change stops it too. */
    await page.click(".mo-dlg [data-mpt-play]");
    await page.click(".mo-dlg [data-mpt-play]");
    ok(!(await page.evaluate(() => window.CurioPanelTiming.playing())), "Stop stops it");
    await page.click(".mo-dlg [data-mpt-play]");
    ok(await page.evaluate(() => window.CurioPanelTiming.playing()), "playing again");
    await page.click('.mo-dlg [data-tab="attention"]');
    await page.waitForTimeout(300);
    ok(!(await page.evaluate(() => window.CurioPanelTiming.playing())), "changing tab stops it");
    await page.click('.mo-dlg [data-tab="timing"]');
    await page.click(".mo-dlg [data-mpt-play]");
    await page.evaluate(() => window.CurioMomentumUI.close());
    await page.waitForTimeout(300);
    ok(!(await page.evaluate(() => window.CurioPanelTiming.playing())), "closing the window stops it");

    /* Download. */
    await page.evaluate(() => window.CurioMomentumUI.open("timing"));
    await page.waitForSelector(".mo-dlg .mpt-col");
    const [dl] = await Promise.all([page.waitForEvent("download"), page.click(".mo-dlg [data-mpt-csv]")]);
    ok(/^panel-timing-.*\.csv$/.test(dl.suggestedFilename()), "downloads " + dl.suggestedFilename());
    await page.close();

    const phone = await newPage({ width: 375, height: 800 });
    await phone.evaluate(() => window.CurioMomentumUI.open("timing"));
    await phone.waitForSelector(".mo-dlg .mpt-col");
    await phone.click(".mo-dlg [data-mpt-play]");
    await phone.waitForTimeout(400);
    const wide = await phone.evaluate(() => {
      const d = document.querySelector(".mo-dlg");
      return [document.documentElement.scrollWidth - window.innerWidth, d.scrollWidth - d.clientWidth];
    });
    ok(wide[0] <= 0 && wide[1] <= 0, `no sideways scroll at 375 px (page ${wide[0]}, window ${wide[1]})`);
    await phone.screenshot({ path: path.join(SHOTS, "timing-phone.png") });
    await phone.evaluate(() => document.querySelector(".mo-dlg .mpt-preview").scrollIntoView());
    await phone.screenshot({ path: path.join(SHOTS, "timing-phone-2.png") });
    await phone.evaluate(() => window.CurioPanelTiming.stop());
    ok(errors.length === 0, "no page errors" + (errors.length ? ": " + errors.slice(0, 3).join(" | ") : ""));
  } finally {
    await browser.close();
    server.close();
  }
  if (failed) {
    console.log(failed + " browser checks failed");
    process.exit(1);
  }
  console.log("panel timing browser checks passed; screenshots in " + SHOTS);
}

nodeChecks();
if (args.includes("--browser"))
  browserChecks().catch((e) => {
    console.error(e);
    process.exit(1);
  });
