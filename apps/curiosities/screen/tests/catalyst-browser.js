/* The Catalyst window (screen/catalyst.js) in a real browser: Spark and Elixir tabs, play, the lock, your own elixir.
   node apps/curiosities/screen/tests/catalyst-browser.js   (needs Playwright and Chromium) */
const http = require("http");
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const ROOT = path.join(__dirname, "..", "..");
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".webmanifest": "application/manifest+json" };
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
  const base = `http://127.0.0.1:${server.address().port}/`;
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => m.type() === "error" && !/Failed to load resource|three|cdnjs|fonts\.g/.test(m.text()) && errors.push(m.text()));
  await page.goto(base + "index.html?screen=1");
  await page.waitForFunction(() => window.CurioScreen && window.CurioScreen.isOpen() && window.CurioCatalyst, null, { timeout: 15000 });
  const T = (fn, arg) => page.evaluate(fn, arg);

  /* The pure part. */
  const core = await T(() => {
    const C = window.CurioCatalyst.core;
    const list = [{ id: "a", x: { curiosity: "music" } }, { id: "b", x: { curiosity: "music.loud" } }, { id: "c", x: { suite: "noir" } }];
    const holds = (x, ps, i) => !!ps[i][x.curiosity];
    const lu = C.lineUp(["a", "c2", "d"], [{ id: "a", x: { curiosity: "lips" } }, { id: "d", x: { curiosity: "eyes" } }], [{ lips: 1 }, { lips: 1, eyes: 1 }, { eyes: 1 }], holds);
    return { causes: C.causes(list), from: C.sparksFrom(list, "c:music").map((p) => p.id), lu };
  });
  ok(core.causes[0].key === "c:music" && core.causes[0].ids.length === 2, "one curiosity is one cause, whatever slider of it changes");
  ok(core.from.join() === "a,b", "sparksFrom lists every spark a cause fires");
  ok(core.lu.rows.length === 2 && core.lu.all.join() === "1", "an elixir lines up only where every ingredient is in");

  /* The window opens from the bar, with two tabs. */
  await page.click("[data-cat-open]");
  await page.waitForSelector(".cat-win", { timeout: 5000 });
  ok(!!(await page.$('.cat-win [data-cat-tab="spark"][aria-selected="true"]')) && !!(await page.$('.cat-win [data-cat-tab="elixir"]')), "the Catalyst window opens on Spark, with an Elixir tab");
  ok((await page.$$(".cat-win .cat-ray")).length > 0, "a cause is drawn as a burst of the sparks it fires");
  const first = await page.$eval(".cat-win [data-cat-play]", (b) => b.dataset.catPlay);
  await page.click(".cat-win [data-cat-play]");
  ok(await T((k) => window.CurioAuto.running().includes(k), first), "Play starts that spark in automation");
  await page.click(`.cat-win [data-cat-play="${first}"]`);
  ok(!(await T((k) => window.CurioAuto.running().includes(k), first)), "and Stop stops it");

  /* Elixir: key and flask, the lock, your own. */
  await page.click('.cat-win [data-cat-tab="elixir"]');
  ok(!!(await page.$(".cat-win .cat-pin")), "an elixir shows as a key with one pin per ingredient");
  const pins = (await page.$$(".cat-win .cat-pin")).length;
  const ings = (await page.$$(".cat-win .cat-ing li")).length;
  ok(pins === ings && pins > 0, `one pin per ingredient (${pins})`);
  await page.click('.cat-win [data-cat-look="flask"]');
  ok(!!(await page.$(".cat-win .cat-glass")), "the Flask look draws a flask");
  const ek = await T(() => "ps:" + window.CurioAuto.PROXIMITY_SUITES[0].id);
  await page.click('.cat-win [data-cat="lock"]');
  ok(await T((k) => window.CurioAuto.lanes(k).find((l) => l.id === "lock").on, ek), "the Lock box switches on the elixir's lock lane");
  await page.click('.cat-win [data-cat="lock"]');
  await page.click(".cat-win .cat-make summary");
  await page.fill('.cat-win [data-cat-in="pq"]', "music");
  await page.waitForTimeout(300);
  const adds = await page.$$(".cat-win [data-cat-pick]");
  ok(adds.length >= 2, "finding sparks to add as ingredients");
  /* locators, not held handles: the found list can redraw a moment after typing */
  await page.locator(".cat-win [data-cat-pick]").first().click();
  await page.locator(".cat-win [data-cat-pick]:not([disabled])").first().click();
  await page.fill('.cat-win [data-cat-mk="name"]', "Test potion");
  await page.click('.cat-win [data-cat="make-elixir"]');
  const mine = await T(() => window.CurioCatalyst.mine());
  ok(mine.length === 1 && mine[0].members.length === 2 && (await T((id) => !!window.CurioAuto.param("ps:" + id), mine[0].id)), "Save the elixir keeps it and makes it automatable");
  await page.reload();
  await page.waitForFunction(() => window.CurioScreen && window.CurioScreen.isOpen() && window.CurioCatalyst, null, { timeout: 15000 });
  ok(await T((id) => !!window.CurioAuto.param("ps:" + id), mine[0].id), "your elixir is back after a reload");
  await page.keyboard.press("Escape");

  ok(errors.length === 0, "no page errors" + (errors.length ? ": " + errors.slice(0, 3).join(" | ") : ""));
  await browser.close();
  server.close();
  console.log(fails ? `${fails} failed` : "all passed");
  process.exit(fails ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
