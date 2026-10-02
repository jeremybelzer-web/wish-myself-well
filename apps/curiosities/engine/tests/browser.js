/* The engine in a real browser, inside the real app: node apps/curiosities/engine/tests/browser.js [--events N]
   (needs Playwright and Chromium; set NODE_PATH to where Playwright is installed if it is not local).

   1. Measure the host: the same script runs against the real My film (window.CuriosityBoard) and the fake
      host (engine/fake-host.js). Every answer must match; a mismatch means the fake has drifted from the
      real board and must be fixed before its tests can be trusted.
   2. Walk through the engine window the way a person would: read My film, change a cell, pin one, add an
      automation point, add a link, analyze a script and carry a curiosity, open the cube, undo and redo,
      send to My film and take it back, run the self-check.
   3. Clicks and keys at random: N clicks, key presses, wheel turns and hovers over the engine window. The
      page must report no errors and the film must stay valid and survive a reload.
   4. Reload: the film must come back with the same fingerprint.
   Screenshots go to the folder given by --shots (default: the system temp folder). */
const http = require("http");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { chromium } = require("playwright");

const args = process.argv.slice(2);
const arg = (n, d) => (args.includes(n) ? args[args.indexOf(n) + 1] : d);
const EVENTS = Number(arg("--events", 3000));
const SHOTS = arg("--shots", os.tmpdir());
const ROOT = path.join(__dirname, "..", "..");
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".webmanifest": "application/manifest+json" };

function serve() {
  return new Promise((resolve) => {
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
}

let failed = 0;
const ok = (cond, text) => {
  console.log((cond ? "ok   " : "FAIL ") + text);
  if (!cond) failed++;
};

(async () => {
  const server = await serve();
  const url = "http://127.0.0.1:" + server.address().port + "/index.html";
  const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist"] });
  const page = await browser.newPage({ viewport: { width: 1360, height: 900 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e && e.message)));
  page.on("console", (m) => m.type() === "error" && !/Failed to load resource|favicon|fonts\.g/.test(m.text()) && errors.push(m.text()));
  page.on("dialog", (d) => d.accept("A track from the test"));
  /* --three <file>: serve three.js from a local copy when the CDN cannot be reached from where the test runs. */
  const three = arg("--three", "");
  if (three) await page.route(/three\.min\.js$/, (r) => r.fulfill({ contentType: "text/javascript", body: fs.readFileSync(three, "utf8") }));
  await page.goto(url);
  await page.waitForFunction(() => window.CuriosityBoard && window.CurioAuto);
  await page.addScriptTag({ url: "engine/load.js" });
  await page.waitForFunction(() => window.CurioEngineUI && window.CurioCube && window.CurioSelfCheck);
  ok(true, "the engine loads into the app with one script tag");

  /* 1. Measure the host. */
  const measured = await page.evaluate(() => {
    const real = window.CuriosityBoard;
    const before = { applied: real.applied(), values: real.values() };
    const fake = window.CurioFakeHost.board({ values: before.values });
    const live = Object.keys(real.values());
    const pick = (p) => live.reduce((o, k) => ((o[k] = p[k]), o), {});
    const script = (b) => {
      const out = [];
      b.apply("Shelf", {});
      b.apply("Automation", {});
      b.set("angleCount", 0);
      out.push(["1 count at 0", b.count()]);
      b.set("angleCount", 3);
      out.push(["1 count at 3", b.count()]);
      b.set("emotion", "angry");
      out.push(["2 set a non-live id", b.values().emotion === undefined]);
      b.set("volume", "very loud");
      out.push(["2 set does not check values", b.values().volume]);
      b.set("volume", 3);
      b.apply("Shelf", { volume: [1, 2] });
      b.set("volume", 4);
      out.push(["3 set takes it out of the strand", b.applied()]);
      b.apply("Automation", { volume: [5] });
      b.apply("Shelf", { cameraCarry: ["locked"], moveSpeed: [1, "", 5] });
      out.push(["4,5 layers and repeats", b.panels().map(pick)]);
      const a = b.applied();
      a.values.cameraCarry[0] = "handheld";
      out.push(["6 applied is a copy", b.applied()]);
      b.apply("Engine", { volume: [2] });
      out.push(["4 a new strand replaces the old", b.applied()]);
      b.apply("Engine", {});
      out.push(["4 empty clears", b.applied()]);
      b.apply("Automation", {});
      return out;
    };
    const r = script(real);
    const f = script(fake);
    real.apply(before.applied ? before.applied.label : "x", before.applied ? before.applied.values : {});
    Object.keys(before.values).forEach((k) => real.set(k, before.values[k]));
    return r.map((x, i) => ({ step: x[0], real: JSON.stringify(x[1]), fake: JSON.stringify(f[i][1]) }));
  });
  measured.forEach((m) => ok(m.real === m.fake, "host rule " + m.step + (m.real === m.fake ? "" : ": real " + m.real + " but fake " + m.fake)));

  /* 2. Walk through it. */
  await page.click("#lib-btn");
  await page.click("#lib-menu [data-engine]");
  await page.waitForSelector(".en-overlay:not([hidden])");
  const startBtn = await page.$("[data-act=start-board]");
  if (startBtn) await startBtn.click();
  const rows = await page.evaluate(() => CurioEngine.state().rows.length);
  ok(rows >= 1, "Read My film: " + rows + " rows from the board's panels");
  ok((await page.evaluate(() => CurioEngine.state().links.length)) > 0, "the letter's links were added");
  await page.click(".en-tab, [data-tab=timeline]").catch(() => {});
  const cell = await page.$('.en-cell[data-track="master"][data-cur="emotion"]');
  await cell.click();
  await page.selectOption(".en-pop select[name=v]", "angry");
  await page.click(".en-pop [data-pop=change]");
  ok((await page.evaluate(() => { const st = CurioEngine.state(); return CurioEngine.value(st.rows[0].id, "master", "emotion"); })) === "angry", "a cell change lands in your material");
  ok((await page.evaluate(() => { const st = CurioEngine.state(); return CurioEngine.value(st.rows[0].id, "master", "cutRate"); })) === "fast", "and ripples: the cutting rate follows the emotion");
  await page.click('.en-cell[data-track="master"][data-cur="cutRate"]');
  await page.selectOption(".en-pop select[name=v]", "slow");
  await page.click(".en-pop [data-pop=pin]");
  ok((await page.evaluate(() => { const st = CurioEngine.state(); return CurioEngine.why(st.rows[0].id, "master", "cutRate"); })) === "edit", "a pin is kept as a hand edit");
  await page.screenshot({ path: path.join(SHOTS, "engine-timeline.png") });
  await page.click("[data-act=undo]");
  ok((await page.evaluate(() => { const st = CurioEngine.state(); return CurioEngine.value(st.rows[0].id, "master", "cutRate"); })) === "fast", "Undo takes the pin back");
  await page.keyboard.press("Control+Shift+Z");
  ok((await page.evaluate(() => { const st = CurioEngine.state(); return CurioEngine.value(st.rows[0].id, "master", "cutRate"); })) === "slow", "Ctrl+Shift+Z redoes it");

  await page.click("[data-tab=links]");
  await page.selectOption("[data-form=link] [name=from]", "camera|cameraCarry");
  await page.selectOption("[data-form=link] [name=to]", "camera|moveSpeed");
  await page.selectOption("[data-form=link] [name=does]", "rise");
  await page.click("[data-act=link-add]");
  ok((await page.evaluate(() => CurioEngine.state().links.some((l) => l.from.curiosity === "cameraCarry" && l.does === "rise"))) === true, "a link added from the form");
  await page.click("[data-act=seed-catalog]");
  await page.screenshot({ path: path.join(SHOTS, "engine-links.png"), fullPage: false });

  await page.click("[data-tab=analyze]");
  await page.fill("[data-field=ref-text]", "INT. KITCHEN - NIGHT\n\nShe paces, glances at the clock.\n\nANA\n(whispering)\nWhere is he?\n\nBEN\nI'm HERE!\n\nEXT. ROOF - DAWN\n\nThey sit. She smiles.\n\nANA\nI love this.\n\nINT. CAR - DAY\n\nBEN\nHa!");
  await page.click("[data-act=analyze]");
  await page.click("[data-act=ref-keep]");
  await page.selectOption("[data-form=carry] [name=cur]", "emotion");
  await page.selectOption("[data-form=carry] [name=track]", "master");
  await page.click("[data-act=carry]");
  ok((await page.evaluate(() => Object.keys(CurioEngine.state().lanes).includes("master|emotion"))) === true, "a script's emotional road carried onto the Master track");
  ok((await page.evaluate(() => !JSON.stringify(CurioEngine.state()).includes("clock"))) === true, "the script's text was not kept");
  await page.screenshot({ path: path.join(SHOTS, "engine-analyze.png") });

  await page.click("[data-tab=cube]");
  await page.waitForTimeout(600);
  const canvas = await page.$(".en-cube canvas");
  ok(!!canvas, "the cube draws (WebGL)");
  await page.screenshot({ path: path.join(SHOTS, "engine-cube-front.png") });
  await page.click("[data-c=next]");
  await page.click("[data-c=next]");
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(SHOTS, "engine-cube-layer.png") });
  await page.click("[data-c=turn]");
  await page.waitForTimeout(900);
  await page.screenshot({ path: path.join(SHOTS, "engine-cube-turned.png") });
  await page.click("[data-c=inside]");
  await page.waitForTimeout(900);
  await page.screenshot({ path: path.join(SHOTS, "engine-cube-inside.png") });

  await page.click("[data-tab=timeline]");
  await page.click("[data-act=print]");
  ok((await page.evaluate(() => (CuriosityBoard.applied() || {}).label)) === "Engine", "Send to My film plays the result on the board's panels");
  await page.click("[data-act=unprint]");
  ok((await page.evaluate(() => (CuriosityBoard.applied() || {}).label)) !== "Engine", "Take back puts My film back");
  await page.click("[data-tab=history]");
  await page.click("[data-act=selfcheck]");
  const sc = await page.evaluate(() => document.querySelector(".en-body").innerText);
  ok(/Self-check passed/.test(await page.evaluate(() => document.querySelector(".en-msg").textContent)), "the self-check passes and leaves nothing behind");
  if (!/Self-check passed/.test(await page.evaluate(() => document.querySelector(".en-msg").textContent))) console.log(sc.slice(0, 800));
  await page.screenshot({ path: path.join(SHOTS, "engine-history.png") });

  /* 3. Random clicks and keys. */
  const fpBefore = await page.evaluate(() => CurioEngine.fingerprint());
  const monkey = await page.evaluate(async (n) => {
    let seed = 7;
    const R = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
    const pick = (a) => a[Math.floor(R() * a.length)];
    const stats = { click: 0, key: 0, wheel: 0, hover: 0, change: 0 };
    const tabs = ["timeline", "links", "analyze", "history", "cube"];
    const origAlert = window.alert;
    const origPrompt = window.prompt;
    const origConfirm = window.confirm;
    window.alert = () => {};
    window.prompt = () => "Monkey";
    window.confirm = () => true;
    const reloadBlock = () => {};
    const app = window.CurioAppUndo;
    const undoTo = app && app.undoTo;
    if (app) app.undoTo = () => false; /* it reloads the page; tested on its own */
    for (let i = 0; i < n; i++) {
      const root = document.querySelector(".en-overlay");
      if (!root || root.hidden) CurioEngineUI.open(pick(tabs));
      const r = R();
      if (r < 0.06) {
        CurioEngineUI.open(pick(tabs));
        continue;
      }
      const scope = document.querySelector(".en-pop") && R() < 0.6 ? document.querySelector(".en-pop") : document.querySelector(".en-overlay");
      const els = [...scope.querySelectorAll("button, input, select, textarea, canvas")].filter((e) => !e.disabled && e.dataset.act !== "close" && e.dataset.act !== "app-undo" && e.dataset.act !== "app-redo");
      if (!els.length) continue;
      const el = pick(els);
      try {
        if (r < 0.6) {
          if (el.tagName === "SELECT") {
            el.selectedIndex = Math.floor(R() * el.options.length);
            el.dispatchEvent(new Event("change", { bubbles: true }));
            stats.change++;
          } else if (el.tagName === "INPUT" && el.type !== "checkbox") {
            el.value = pick(["0", "3", "-5", "99999", "angry", "", "slow", "<b>x</b>", "1e9"]);
            el.dispatchEvent(new Event("change", { bubbles: true }));
            stats.change++;
          } else {
            el.click();
            stats.click++;
          }
        } else if (r < 0.8) {
          const key = pick(["z", "y", "Escape", "ArrowLeft", "ArrowRight", "Enter", "Tab", "a"]);
          (R() < 0.5 ? el : document).dispatchEvent(new KeyboardEvent("keydown", { key, ctrlKey: R() < 0.4, shiftKey: R() < 0.3, bubbles: true }));
          stats.key++;
        } else if (r < 0.9) {
          el.dispatchEvent(new WheelEvent("wheel", { deltaY: R() < 0.5 ? 120 : -120, bubbles: true, cancelable: true }));
          stats.wheel++;
        } else {
          const b = el.getBoundingClientRect();
          el.dispatchEvent(new PointerEvent("pointermove", { clientX: b.left + R() * b.width, clientY: b.top + R() * b.height, bubbles: true }));
          stats.hover++;
        }
      } catch (e) {
        stats.error = (stats.error || 0) + 1;
        stats.lastError = String(e && e.message);
      }
      if (i % 50 === 0) await new Promise((res) => setTimeout(res, 0));
    }
    window.alert = origAlert;
    window.prompt = origPrompt;
    window.confirm = origConfirm;
    if (app) app.undoTo = undoTo;
    const st = CurioEngine.state();
    return { stats, valid: CurioEngine.canon(CurioEngine.normalize(st)) === CurioEngine.canon(st), check: CurioEngine.check(), drift: CurioEngine.drift().length, steps: CurioEngine.history().undo.length };
  }, EVENTS);
  ok(!monkey.stats.error, EVENTS + " random events (" + JSON.stringify(monkey.stats) + ")");
  ok(monkey.valid && monkey.check.ok && !monkey.drift, "after them the film is valid and would survive a reload (" + monkey.steps + " undo steps)");
  const fpAfterMonkey = await page.evaluate(() => CurioEngine.fingerprint());
  ok(fpAfterMonkey !== fpBefore || monkey.steps === 0, "the random events did change the film");

  /* 4. Reload. */
  const fp = await page.evaluate(() => {
    CurioEngine.save();
    return CurioEngine.fingerprint();
  });
  await page.reload();
  await page.waitForFunction(() => window.CuriosityBoard);
  await page.addScriptTag({ url: "engine/load.js" });
  await page.waitForFunction(() => window.CurioEngineUI);
  const back = await page.evaluate(() => ({ fp: CurioEngine.fingerprint(), check: CurioEngine.lastCheck() }));
  ok(back.fp === fp && back.check.ok, "after a page reload the film comes back with the same fingerprint");

  /* The app-wide undo, which reloads the page. */
  await page.evaluate(() => CurioAppUndo.clear());
  await page.evaluate(() => CuriosityBoard.set("volume", 5));
  await page.waitForTimeout(1700);
  await page.evaluate(() => CuriosityBoard.set("volume", 1));
  const stepsNow = await page.evaluate(() => CurioAppUndo.steps().length);
  ok(stepsNow === 2, "two board changes, more than 1.5 seconds apart, are two app undo steps (" + stepsNow + ")");
  await Promise.all([page.waitForNavigation(), page.evaluate(() => CurioAppUndo.undoTo(0))]);
  await page.waitForFunction(() => window.CuriosityBoard);
  ok((await page.evaluate(() => CuriosityBoard.values().volume)) === 5, "app undo puts My film back and reloads");

  ok(errors.length === 0, "no errors on the page" + (errors.length ? ": " + errors.slice(0, 5).join(" | ") : ""));
  await browser.close();
  server.close();
  console.log("\nScreenshots in " + SHOTS);
  console.log(failed ? failed + " failed" : "all passed");
  process.exit(failed ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
