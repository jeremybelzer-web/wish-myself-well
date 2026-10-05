/* Front and center, the lane under the Viewer's picture: node apps/curiosities/viewer/tests/focus-lane.js [--shots dir]
   (needs Playwright and Chromium; set NODE_PATH to where Playwright is installed if it is not local).

   The lane is under the picture with its three rows (Leading, With it, Suite). In the sample, the attention
   model puts something in front in every panel, one or two at a time; the phone coming into the scene sets off
   the cut to an insert of it (a proximity, marked ⚡ with what set it off); the line above names what is in
   front at the playhead and follows Play; clicking a block jumps there; an edit (hiding the phone) changes the
   reading; it fits a phone; no page errors. */
const http = require("http");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { chromium } = require("playwright");

const args = process.argv.slice(2);
const arg = (n, d) => (args.includes(n) ? args[args.indexOf(n) + 1] : d);
const SHOTS = arg("--shots", "");
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
  const base = `http://127.0.0.1:${server.address().port}/index.html`;
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(base + "?viewer=1");
  await page.evaluate(() => localStorage.removeItem("curiosities-viewer-v1"));
  await page.reload();
  await page.waitForFunction(() => window.CurioViewer && CurioViewer.isOpen() && document.querySelector(".cv-under .cf-lead button"), null, { timeout: 20000 });

  ok(await page.isVisible(".cv-under"), "Front and center is under the picture");
  const box = await page.evaluate(() => {
    const a = document.querySelector(".cv-stage").getBoundingClientRect();
    const b = document.querySelector(".cv-under").getBoundingClientRect();
    const c = document.querySelector(".cv-transport").getBoundingClientRect();
    return { below: b.top >= a.bottom - 1, aboveTransport: b.bottom <= c.top + 1 };
  });
  ok(box.below && box.aboveTransport, "it sits right under the picture, above Play");
  const rows = await page.$$eval(".cv-under .cf-rows > span", (s) => s.map((x) => x.textContent));
  ok(rows.join() === "Leading,With it,Suite", "its rows: " + rows.join(", "));
  const r = await page.evaluate(() => CurioFocusLane.read());
  ok(r.length === 13 && r.every((p) => p.lead), "every panel has a curiosity in front (" + r.map((p) => p.lead).join(" / ") + ")");
  ok(r.every((p) => [p.lead, p.second].filter(Boolean).length <= 2), "one or two at a time");
  ok(r[4].leadId === "shotSize" && r[4].trigger === "an object enters", `panel 5: the phone coming in sets off the cut to an insert (${r[4].lead}, ${r[4].trigger})`);
  ok(r.filter((p) => p.trigger).length >= 2, "proximities fire (" + r.filter((p) => p.trigger).map((p) => p.panel + ": " + p.trigger).join(", ") + ")");
  ok(r.some((p) => p.suite), "a suite shows when most of it is on (" + r.filter((p) => p.suite).map((p) => p.panel + ": " + p.suite).join(", ") + ")");
  const bolts = await page.locator(".cv-under .cf-bolt").count();
  ok(bolts === r.filter((p) => p.trigger).length, `each proximity has a ⚡ on the lane (${bolts})`);

  await page.evaluate(() => CurioViewer.select(4));
  await page.waitForTimeout(200);
  const line5 = await page.textContent(".cv-under .cf-now");
  ok(/Shot size/.test(line5) && /set off by something else: an object enters \(panel 4\)/.test(line5), "the line says what is in front and what set it off: " + line5);
  if (SHOTS) await page.locator(".cv-player").screenshot({ path: path.join(SHOTS, "focus-lane.png") });

  ok(await page.isVisible(".cv-under .cf-pie") && await page.isVisible(".cv-under .cf-graph"), "the attention pie and graph are both shown");
  const items = await page.$$eval(".cv-under .cf-list li", (l) => l.map((x) => x.textContent));
  ok(items.length >= 3 && /Shot size/.test(items[0] + items[1]), "the list names every curiosity on, by share: " + items.slice(0, 4).join(" / "));
  await page.click(".cv-under .cf-pie");
  await page.waitForTimeout(150);
  ok(!(await page.isVisible(".cv-under .cf-graph")) && (await page.$eval(".cv-under .cf-pie", (c) => c.clientWidth)) >= 100, "clicking the pie hides the graph and makes the pie bigger");
  await page.click(".cv-under .cf-pie");
  await page.waitForTimeout(150);
  ok(await page.isVisible(".cv-under .cf-graph"), "clicking it again shows both");
  await page.hover(".cv-under .cf-lead button:nth-of-type(4)");
  const full = await page.textContent(".cv-under .cf-name");
  ok(/^Leading: .{12,}/.test(full), "pointing at a shortened name shows it in full: " + full);
  const head0 = await page.$eval(".cv-under .cf-head", (h) => parseFloat(h.style.left));
  await page.evaluate(() => CurioViewer.select(0));
  await page.evaluate(() => CurioViewer.play(true));
  await page.waitForTimeout(1600);
  await page.evaluate(() => CurioViewer.play(false));
  const head1 = await page.$eval(".cv-under .cf-head", (h) => parseFloat(h.style.left));
  ok(head1 > 0 && head1 !== head0, "the playhead line follows Play");

  const target = await page.$eval(".cv-under .cf-lead button:nth-of-type(8)", (b) => +b.dataset.cfAt);
  await page.click(".cv-under .cf-lead button:nth-of-type(8)");
  await page.waitForTimeout(200);
  const at = await page.evaluate(() => CurioViewer.time());
  ok(Math.abs(at - target) < 0.01, `clicking a block jumps there (${at} s)`);

  await page.evaluate(() => {
    const f = CurioViewer.film();
    f.panels.forEach((p) => (p.place.phone.show = false));
    CurioViewer.setFilm(f);
  });
  await page.waitForTimeout(200);
  const r2 = await page.evaluate(() => CurioFocusLane.read());
  ok(r2[4].trigger !== "an object enters", "an edit changes the reading: with no phone, nothing comes in to set off the insert");
  await page.evaluate(() => CurioViewer.undo());

  await page.setViewportSize({ width: 390, height: 800 });
  await page.waitForTimeout(300);
  const fit = await page.evaluate(() => {
    const u = document.querySelector(".cv-under").getBoundingClientRect();
    return u.width > 0 && u.right <= innerWidth + 1 && document.documentElement.scrollWidth <= innerWidth + 1;
  });
  ok(fit, "on a phone the lane fits the screen");

  ok(errors.length === 0, "no page errors" + (errors.length ? ": " + errors.join(" | ") : ""));
  await browser.close();
  server.close();
  console.log(fails ? `${fails} failed` : "all passed");
  process.exit(fails ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
