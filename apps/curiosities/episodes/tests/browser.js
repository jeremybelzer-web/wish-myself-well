/* node apps/curiosities/episodes/tests/browser.js : Show episodes in the Storyboard, in a real browser.
   Opens Episode 1, checks every panel holds one second, the panel says what we see and names the scene's own
   people, Play moves one panel a second, and opening it again replaces its scenes instead of adding more. */
const http = require("http");
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const ROOT = path.join(__dirname, "..", "..");
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".webmanifest": "application/manifest+json" };
let failed = 0;
const ok = (cond, what) => {
  console.log((cond ? "ok   " : "FAIL ") + what);
  if (!cond) failed++;
};
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split("?")[0]).replace(/^\/+/, "") || "index.html");
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) {
    res.writeHead(404);
    return res.end();
  }
  res.writeHead(200, { "content-type": TYPES[path.extname(p)] || "application/octet-stream" });
  fs.createReadStream(p).pipe(res);
});
server.listen(0, "127.0.0.1", async () => {
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: 1400, height: 900 } })).newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("dialog", (d) => d.accept().catch(() => {}));
  await page.route(/fonts\.(googleapis|gstatic)|cdnjs|jsdelivr|unpkg/, (r) => r.abort());
  await page.goto(`http://127.0.0.1:${server.address().port}/index.html`);
  await page.waitForTimeout(1200);
  await page.evaluate(() => window.CuriosityWorkspaces.open("storyboard"));
  await page.waitForTimeout(300);
  const want = await page.evaluate(() => window.CURIO_EPISODES[0]);
  ok(await page.$('[data-sb="episode"]'), "the Storyboard shows an Open button for the episode");
  await page.click('[data-sb="episode"]');
  await page.waitForTimeout(500);
  const d = await page.evaluate(() => window.CuriosityStoryboard.data());
  const panels = d.scenes.flatMap((s) => s.panels);
  ok(d.scenes.length === want.scenes.length && panels.length === want.seconds, `opened ${d.scenes.length} scenes, ${panels.length} panels`);
  ok(panels.every((p) => p.seconds === 1), "every panel holds one second");
  const cap = await page.textContent("[data-sb=big] .cap");
  const what = await page.textContent("[data-sb=big] .sb-what");
  ok(what.trim() === want.scenes[0].panels[0].what, "the panel says what we see");
  ok(want.scenes[0].board.people.some((n) => cap.includes(n)), "the panel names the scene's own people");
  await page.click('[data-sb="play"]');
  await page.waitForTimeout(2600);
  await page.click('[data-sb="play"]');
  const moved = await page.evaluate(() => Number((document.querySelector("[data-sb=count]").textContent.match(/(\d+) \/ \d+\s*$/) || [])[1]));
  ok(moved >= 2 && moved <= 4, `Play moved one panel a second (at panel ${moved} after about 2.6 s)`);
  await page.click('[data-sb="episode"]');
  await page.waitForTimeout(300);
  ok((await page.evaluate(() => window.CuriosityStoryboard.data().scenes.length)) === want.scenes.length, "opening it again replaces its scenes");
  ok(!errors.length, "no page errors" + (errors.length ? ": " + errors.join(" | ") : ""));
  await browser.close();
  server.close();
  console.log(failed ? `\n${failed} failed` : "\nepisodes in a browser ok");
  process.exit(failed ? 1 : 0);
});
