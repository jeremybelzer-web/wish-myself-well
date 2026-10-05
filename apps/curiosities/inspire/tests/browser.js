/* Scene inspiration in a real browser:
     node apps/curiosities/inspire/tests/browser.js
   (needs Playwright and Chromium). Opens Library, Scene inspiration; checks the topics, that each filter narrows the
   list, typing, Every curiosity, Watch (a YouTube search), Borrow (a curated film in the Prism), and Log a clip. */
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
function serve() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const p = path.join(ROOT, decodeURIComponent(req.url.split("?")[0]).replace(/^\/+/, "") || "index.html");
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

(async () => {
  const server = await serve();
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: 1400, height: 900 } })).newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  try {
    await page.goto(`http://127.0.0.1:${server.address().port}/index.html?screen=0`);
    await page.waitForFunction(() => window.CurioInspire && document.querySelector("#lib-menu [data-inspire]"), null, { timeout: 15000 });
    ok(true, "the Library has Scene inspiration");
    await page.evaluate(() => window.CurioInspire.open());
    const total = await page.evaluate(() => window.CurioInspire.hub().scenes.length);
    const count = () => page.$$eval("dialog.ci-hub .ci-card", (x) => x.length);
    ok((await count()) === total && total >= 30, `every scene is listed first (${total})`);
    ok((await page.$$eval("dialog.ci-hub .ci-col:first-child .ci-row", (x) => x.length)) >= 6, "the big topics are on the left");
    ok((await page.$$eval("dialog.ci-hub .ci-col:nth-child(2) .ci-row", (x) => x.length)) > 3, "ALL lists curiosity suites");
    await page.click('dialog.ci-hub [data-i="topic"][data-v="camera"]');
    await page.click('dialog.ci-hub [data-i="key"][data-v="shotSize"]');
    await page.click('dialog.ci-hub [data-i="value"][data-v="close"]');
    const n1 = await count();
    ok(n1 > 0 && n1 < total, `a value narrows the list (${total} -> ${n1})`);
    await page.click('dialog.ci-hub [data-i="rate"]');
    const n2 = await count();
    ok(n2 > 0 && n2 <= n1, `how fast it changes narrows it again (${n2})`);
    ok((await page.$$eval("dialog.ci-hub .ci-chip", (x) => x.length)) === 2, "each filter shows as a chip");
    await page.click('dialog.ci-hub [data-i="clear"]');
    ok((await count()) === total, "Clear all brings every scene back");
    await page.fill("dialog.ci-hub .ci-search", "jaws");
    await page.waitForFunction(() => document.querySelectorAll("dialog.ci-hub .ci-card").length === 1);
    ok(true, "typing finds a film");
    await page.click('dialog.ci-hub [data-i="open"]');
    ok((await page.$$eval("dialog.ci-hub .ci-table tr", (x) => x.length)) > 5, "Every curiosity shows the scene's curiosities and how fast they change");
    await page.evaluate(() => (window.open = (u) => ((window.__opened = u), null)));
    await page.click('dialog.ci-hub [data-i="watch-go"]');
    const url = await page.evaluate(() => window.__opened || "");
    ok(/youtube\.com\/results\?search_query=/.test(url), "Watch opens a YouTube search, not a fixed link");
    ok((await page.textContent("dialog.ci-hub .ci-card")).includes("watched 1"), "each view is counted");
    await page.click('dialog.ci-hub [data-i="borrow"]');
    const st = await page.evaluate(() => {
      const s = window.CuriosityStudy.studies().find((x) => x.id.startsWith("inspire-jaws"));
      return { study: !!s, prism: !document.getElementById("prism").classList.contains("hidden"), closed: !document.querySelector("dialog.ci-hub").open };
    });
    ok(st.study && st.prism && st.closed, "Borrow makes it a curated film and opens the Prism");
    /* The search pop-up a curiosity window opens: beside its anchor, on that curiosity, every column a filter. */
    await page.evaluate(() => {
      const a = document.createElement("div");
      a.id = "fake-window";
      a.style.cssText = "position:fixed;left:10px;top:60px;width:200px;height:200px";
      document.body.appendChild(a);
      window.CurioInspire.openSearch("pacing", { anchor: a });
    });
    const pop = await page.evaluate(() => {
      const d = document.querySelector("dialog.ci-hub");
      const r = d.getBoundingClientRect();
      return { pop: d.classList.contains("ci-pop"), open: d.open, left: r.left, cols: d.querySelectorAll(".ci-grid > .ci-col").length, picked: !!d.querySelector('[data-i="key"][data-v="pacing"].on'), from: d.querySelector(".ci-from") && d.querySelector(".ci-from").textContent };
    });
    ok(pop.pop && pop.open && pop.left >= 210, "openSearch opens a pop-up beside the window it came from");
    ok(pop.cols === 6 && pop.picked && /Walking back and forth/.test(pop.from || ""), "it has six filter columns and starts on that curiosity");
    await page.click('dialog.ci-hub [data-i="kind"][data-v="book"]');
    const books = await page.$$eval("dialog.ci-hub .ci-card", (x) => x.map((c) => c.textContent));
    ok(books.length >= 1 && books.every((t) => /Read/.test(t)), "books are sources too, read rather than watched (" + books.length + ")");
    await page.click('dialog.ci-hub [data-i="clear"]');
    await page.click('dialog.ci-hub [data-i="movement"][data-v="pacing"]');
    ok((await count()) >= 2, "the Movements column filters by how characters move");
    await page.click('dialog.ci-hub [data-ci="close"]');

    await page.evaluate(() => window.CurioInspire.open({ filters: [] }));
    await page.click('dialog.ci-hub [data-i="log"]');
    await page.fill('dialog.ci-hub [data-l="work"]', "Test clip");
    await page.fill('dialog.ci-hub [data-l="moment"]', "a hello at a door");
    await page.selectOption('dialog.ci-hub [data-l="from"][data-r="0"]', "wide");
    await page.selectOption('dialog.ci-hub [data-l="to"][data-r="0"]', "close");
    await page.click('dialog.ci-hub [data-i="logsave"]');
    ok((await count()) === 1 && (await page.textContent("dialog.ci-hub .ci-card")).includes("logged by you"), "a logged clip joins the database");
    await page.reload();
    await page.waitForFunction(() => window.CurioInspire);
    ok(await page.evaluate(() => window.CurioInspire.hub().scenes.some((s) => s.work === "Test clip")), "logged clips survive a reload");
    ok(errors.length === 0, "no page errors" + (errors.length ? ": " + errors.join(" | ") : ""));
  } catch (e) {
    ok(false, e.message);
  }
  await browser.close();
  server.close();
  process.exit(failed ? 1 : 0);
})();
