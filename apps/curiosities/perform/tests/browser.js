/* The Transport window in a real browser: node apps/curiosities/perform/tests/browser.js [--shots dir]
   (needs Playwright and Chromium; set NODE_PATH to where Playwright is installed if it is not local).
   The Viewer's play row stays in sight with four windows on a short screen; Performance ▾ opens the Transport;
   Advance and Back move the panel; right-clicking Record and Help ▾ open Performance and recording; Record keeps panel jumps and Catalyst moves as a take; playing it back puts
   them back and clears its Catalysts at the end; the take survives a reload. */
const http = require("http");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { chromium } = require("playwright");

const args = process.argv.slice(2);
const arg = (n, d) => (args.includes(n) ? args[args.indexOf(n) + 1] : d);
const SHOTS = arg("--shots", os.tmpdir());
const ROOT = path.join(__dirname, "..", "..");
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".webmanifest": "application/manifest+json" };

function serve() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const url = decodeURIComponent(req.url.split("?")[0]);
      const p = path.join(ROOT, url.replace(/^\/+/, "") || "index.html");
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

let fails = 0;
const ok = (cond, msg) => {
  console.log((cond ? "ok   " : "FAIL ") + msg);
  if (!cond) fails++;
};

(async () => {
  const server = await serve();
  const base = `http://127.0.0.1:${server.address().port}/index.html?viewer=1`;
  const browser = await chromium.launch();
  for (const [w, h] of [[1366, 600], [1440, 900]]) {
    const page = await browser.newPage({ viewport: { width: w, height: h } });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(base);
    await page.waitForFunction(() => window.CurioViewer && window.CurioViewer.isOpen() && window.CurioTransport);
    await page.waitForTimeout(800);
    const playRowShows = () =>
      page.evaluate(() => {
        const n = document.querySelector('.cv-viewer .cv-transport [data-act="next"]');
        const r = n.getBoundingClientRect();
        const el = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
        return r.bottom <= innerHeight && !!el && n.contains(el);
      });
    ok(await playRowShows(), `${w}x${h}: the play row shows`);
    for (let k = 0; k < 3; k++) {
      await page.click(".cv-viewer .cv-transport [data-act=\"addwin\"]");
      await page.waitForTimeout(250);
    }
    ok(await playRowShows(), `${w}x${h}: the play row still shows with 4 windows`);

    await page.click('.cv-viewer [data-act="perform"]');
    await page.click('.pf-menu [data-m="transport"]');
    ok(await page.isVisible(".pf-transport"), "Performance ▾ opens the Transport");
    await page.click('.pf-transport [data-pf="next"]');
    ok((await page.evaluate(() => CurioViewer.panel())) === 1, "Advance goes to the next panel");
    await page.click('.pf-transport [data-pf="back"]');
    ok((await page.evaluate(() => CurioViewer.panel())) === 0, "Back goes to the panel before");

    await page.click('.pf-transport [data-pf="record"]');
    ok(await page.evaluate(() => CurioTransport.recording()), "Record starts a take");
    await page.click('.pf-transport [data-pf="next"]');
    await page.waitForTimeout(150);
    await page.evaluate(() => CurioViewer.select(4));
    await page.waitForTimeout(150);
    await page.evaluate(() => {
      CurioEngine.perform("triggers", { lanes: {} });
      CurioEngine.perform("triggers", null);
    });
    await page.click('.pf-transport [data-pf="first"]');
    await page.waitForTimeout(150);
    await page.click('.pf-transport [data-pf="record"]');
    const take = await page.evaluate(() => CurioTransport.takes()[0]);
    ok(take && take.events.filter((e) => e.k === "panel").map((e) => e.i).join() === "1,4,0", "the take kept the panel jumps in order");
    ok(take && take.events.filter((e) => e.k === "layer").length === 2, "the take kept the Catalyst moves");
    await page.click('.pf-transport [data-pf="record"]', { button: "right" });
    ok(await page.isVisible(".pf-panel"), "right-clicking Record opens Performance and recording");
    ok(!(await page.evaluate(() => CurioTransport.recording())), "right-clicking Record does not start recording");
    ok(await page.isVisible('.pf-panel [data-pf-take]'), "the take is listed there");
    await page.click('.pf-panel [data-pf="panel-close"]');
    await page.click(".cv-viewer .cw-help");
    await page.click('.cw-menu [data-cw="perform"]');
    ok(await page.evaluate(() => CurioTransport.panelOpen() && document.querySelector(".pf-panel .pf-how").open), "Help ▾ opens it with How it works showing");
    await page.click('.pf-panel [data-pf="panel-close"]');

    await page.evaluate(() => CurioViewer.select(7));
    await page.evaluate((id) => CurioTransport.play(id), take.id);
    await page.waitForFunction(() => !CurioTransport.playingTake(), null, { timeout: 5000 });
    ok((await page.evaluate(() => CurioViewer.panel())) === 0, "playing the take back ends where the performance ended");
    ok((await page.evaluate(() => CurioEngine.performing().filter((n) => n.startsWith("take:")).length)) === 0, "a take's Catalysts are put back when it ends");
    await page.screenshot({ path: path.join(SHOTS, `transport-${w}.png`) });

    await page.reload();
    await page.waitForFunction(() => window.CurioTransport);
    await page.waitForTimeout(500);
    ok((await page.evaluate(() => CurioTransport.takes().length)) === 1 && (await page.isVisible(".pf-transport")), "the take and the open Transport survive a reload");
    ok(!errors.length, "no page errors" + (errors.length ? ": " + errors.join(" | ") : ""));
    await page.close();
  }
  await browser.close();
  server.close();
  console.log(fails ? fails + " failed" : "all passed");
  process.exit(fails ? 1 : 0);
})();
