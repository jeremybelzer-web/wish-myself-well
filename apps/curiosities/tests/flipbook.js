/* The Storyboard's flip book, in a real browser:
     node apps/curiosities/tests/flipbook.js
   (needs Playwright and Chromium; set NODE_PATH to where Playwright is installed if it is not local).

   Saves My film into the storyboard twice, opens Flip through, and checks: next and previous move one panel,
   wrapping at the ends; Play moves on its own and Pause stops it; the arrow keys move; a small picture jumps
   to its panel; All scenes can duplicate and delete a scene; the scenes survive a reload. */
const http = require("http");
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const ROOT = path.join(__dirname, "..");
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
  page.on("console", (m) => m.type() === "error" && !/Failed to load resource|net::|three/i.test(m.text()) && errors.push(m.text()));
  page.on("dialog", (d) => d.accept().catch(() => {}));
  await page.route(/fonts\.(googleapis|gstatic)|cdnjs|jsdelivr|unpkg/, (r) => r.abort());
  await page.goto(`http://127.0.0.1:${server.address().port}/index.html`);
  await page.waitForTimeout(1200);

  /* Two scenes from My film, the second with a different camera. */
  const toStoryboard = async () => {
    await page.click('#tabs button[data-tab="board"]');
    await page.click('button:has-text("Save into the storyboard")');
    await page.waitForTimeout(500);
  };
  await toStoryboard();
  await page.click('#tabs button[data-tab="board"]');
  await page.evaluate(() => {
    const s = document.querySelector("#controls select");
    s.selectedIndex = (s.selectedIndex + 1) % s.options.length;
    s.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await toStoryboard();
  const sb = '[data-sb="body"]';
  await page.click('[data-sb="view-flip"]');
  await page.waitForSelector('[data-sb="count"]');
  const count = () => page.textContent('[data-sb="count"]');
  const at = async () => Number(((await count()).match(/(\d+) \/ (\d+)\s*$/) || [])[1]);
  const total = Number(((await count()).match(/\/ (\d+)\s*$/) || [])[1]);
  ok(total >= 2, "the flip book has the saved panels (" + (await count()).trim() + ")");
  ok(/Scene \d+ of 2/.test(await count()), "two scenes are kept");

  const start = await at();
  await page.click('[data-sb="next"]');
  ok((await at()) === (start % total) + 1, "▶ moves one panel on");
  await page.click('[data-sb="prev"]');
  ok((await at()) === start, "◀ moves one panel back");
  await page.click('[data-go="0"]');
  await page.click('[data-sb="prev"]');
  ok((await at()) === total, "◀ on the first panel goes to the last");
  await page.click('[data-sb="next"]');
  ok((await at()) === 1, "▶ on the last panel goes to the first");

  await page.click('[data-sb="play"]');
  ok((await page.textContent('[data-sb="play"]')).trim() === "Pause", "Play turns into Pause");
  const p0 = await at();
  await page.waitForTimeout(1600);
  const p1 = await at();
  ok(p1 !== p0, "playing moves on its own (" + p0 + " → " + p1 + ")");
  await page.click('[data-sb="play"]');
  const q0 = await at();
  await page.waitForTimeout(900);
  ok((await at()) === q0, "Pause stops it");

  await page.focus('[data-sb="viewer"]');
  const k0 = await at();
  await page.keyboard.press("ArrowRight");
  ok((await at()) === (k0 % total) + 1, "the right arrow key moves on");
  await page.keyboard.press("ArrowLeft");
  ok((await at()) === k0, "the left arrow key moves back");

  const target = Math.min(total, 3);
  await page.click(`[data-go="${target - 1}"]`);
  ok((await at()) === target, "a small picture jumps to its panel (" + target + ")");

  await page.click('[data-sb="view-grid"]');
  await page.waitForSelector('[data-act="dup"]');
  const scenes = () => page.$$eval(".sb-scene", (s) => s.length);
  const n0 = await scenes();
  await page.click('[data-act="dup"][data-i="0"]');
  await page.waitForTimeout(300);
  ok((await scenes()) === n0 + 1, "Duplicate adds a scene");
  await page.click('[data-act="del"][data-i="0"]');
  await page.waitForTimeout(300);
  /* Delete may ask first ("press again"). */
  if ((await scenes()) === n0 + 1) {
    const again = await page.$('[data-act="del"][data-i="0"]');
    if (again) await again.click();
    await page.waitForTimeout(300);
  }
  ok((await scenes()) === n0, "Delete takes it away");

  await page.reload();
  await page.waitForTimeout(1200);
  await page.click('#tabs button[data-ws="storyboard"]');
  await page.waitForTimeout(500);
  ok((await page.textContent("#workspace")).includes(n0 + " scene"), "the scenes survive a reload");

  ok(errors.length === 0, "no page errors" + (errors.length ? ": " + errors.slice(0, 3).join(" | ") : ""));
  await browser.close();
  server.close();
  console.log(failed ? `\n${failed} failed` : "\nall passed");
  process.exit(failed ? 1 : 0);
})().catch((e) => {
  console.error("FAIL the test could not finish: " + e.message.split("\n")[0]);
  process.exit(1);
});
