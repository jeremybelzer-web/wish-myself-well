/* What is inside Front and center and the Storyboard fits the size you drag them to (viewer/fit.js), in a real
   browser: node apps/curiosities/viewer/tests/fit.js [--shots dir]
   (needs Playwright and Chromium; set NODE_PATH to where Playwright is installed if it is not local). */
const http = require("http");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { chromium } = require("playwright");

const args = process.argv.slice(2);
const SHOTS = args.includes("--shots") ? args[args.indexOf("--shots") + 1] : os.tmpdir();
const ROOT = path.join(__dirname, "..", "..");
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml" };
let fails = 0;
const ok = (c, m) => {
  console.log((c ? "ok   " : "FAIL ") + m);
  if (!c) fails++;
};
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
server.listen(0, "127.0.0.1", async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.addInitScript(() => sessionStorage.getItem("big-set") || (localStorage.setItem("curio-viewer-big-v1", "1"), sessionStorage.setItem("big-set", "1")));
  await page.goto(`http://127.0.0.1:${server.address().port}/index.html?viewer=1`);
  await page.waitForSelector(".cv-root.cv-big .cv-under:not([hidden]) .cf-charts", { timeout: 15000 });
  await page.waitForTimeout(600);
  const sizes = (o) =>
    page.evaluate((o) => {
      const f = CurioViewer.live().film;
      f.view = f.view || {};
      f.view.borders = Object.assign({}, f.view.borders, o);
      CurioBorders.apply();
    }, o);
  const look = () =>
    page.evaluate(() => {
      const u = document.querySelector(".cv-under");
      const st = document.querySelector(".cv-strip");
      const cards = st.querySelector(".cv-cards");
      const card = cards.querySelector(".cv-card");
      const cb = cards.getBoundingClientRect();
      const kb = card.getBoundingClientRect();
      const g = u.querySelector(".cf-charts").getBoundingClientRect();
      const ub = u.getBoundingClientRect();
      return { lane: u.dataset.fit || "", laneZoom: +u.style.getPropertyValue("--cf-fit") || 1, laneH: ub.height, graphTop: g.top - ub.top, graphBottom: g.bottom - ub.top, scrollTop: u.scrollTop, strip: st.dataset.fit || "", cardH: kb.height, cardW: kb.width, cardsBottom: cb.bottom, cardBottom: kb.bottom, cap: getComputedStyle(card.querySelector(".cv-cap")).display };
    });
  const before = await look();
  ok(!before.lane && !before.strip, "at their usual sizes nothing is shrunk");

  /* Front and center a little smaller than its contents: everything gets tinier and all of it shows */
  await sizes({ lane: Math.round(before.laneH * 0.8) });
  await page.waitForTimeout(400);
  let a = await look();
  ok(a.lane === "shrink" && a.laneZoom < 1 && a.laneZoom >= 0.55, `a smaller Front and center makes its contents tinier (${a.laneZoom})`);
  ok(a.graphBottom <= a.laneH + 1, `and the nodes and lines still fit inside it (${Math.round(a.graphBottom)} of ${Math.round(a.laneH)})`);
  await page.screenshot({ path: path.join(SHOTS, "viewer-fit-lane-smaller.png") });

  /* very small: only the nodes and lines, with the tabs a scroll up away */
  await sizes({ lane: 70 });
  await page.waitForTimeout(400);
  a = await look();
  ok(a.lane === "small" && a.scrollTop > 0 && Math.abs(a.graphTop) < 6, `a very small Front and center shows the nodes and lines (${a.lane}, scrolled ${a.scrollTop}, graph at ${Math.round(a.graphTop)})`);
  await page.evaluate(() => (document.querySelector(".cv-under").scrollTop = 0));
  await page.waitForTimeout(200);
  ok(await page.evaluate(() => { const t = document.querySelector('.cv-under [data-cf-tab="lanes"]'); const b = t.getBoundingClientRect(); const u = document.querySelector(".cv-under").getBoundingClientRect(); return b.top >= u.top - 1 && b.bottom <= u.bottom + 1; }), "scrolling up reaches the tabs");
  await page.click('.cv-under [data-cf-tab="lanes"]');
  await page.waitForTimeout(400);
  ok(await page.evaluate(() => { const u = document.querySelector(".cv-under"); const l = u.querySelector(".cf-lanes").getBoundingClientRect(); return u.dataset.tab === "lanes" && Math.abs(l.top - u.getBoundingClientRect().top) < 8; }), "the tab works there, and Automation lanes opens on its lanes");
  await page.screenshot({ path: path.join(SHOTS, "viewer-fit-lane-small.png") });
  await page.click('.cv-under [data-cf-tab="focus"]').catch(() => page.evaluate(() => document.querySelector('.cv-under [data-cf-tab="focus"]').click()));
  await sizes({ lane: 0 });
  await page.waitForTimeout(300);
  ok(!(await look()).lane, "back to its usual size, Front and center is full size again");

  /* the Storyboard: drag its border down, the cards get smaller and stay inside, and can still be picked */
  let last = before;
  for (const h of [200, 150, 110]) {
    await sizes({ strip: h });
    await page.waitForTimeout(400);
    const s = await look();
    ok(s.strip && s.cardBottom <= s.cardsBottom + 1 && s.cardH < last.cardH + 0.5, `a ${h}px storyboard shrinks its cards to fit (${s.strip}, ${Math.round(s.cardW)}×${Math.round(s.cardH)})`);
    last = s;
  }
  ok(last.strip === "tiny" && last.cap === "none" && last.cardW > 30, "at the smallest only the pictures are left, still big enough to pick");
  await page.screenshot({ path: path.join(SHOTS, "viewer-fit-strip-small.png") });
  await page.click('.cv-card[data-i="4"]');
  await page.waitForTimeout(300);
  ok(await page.evaluate(() => CurioViewer.panel() === 4), "clicking a small card picks that panel");
  await sizes({ strip: 0 });
  await page.waitForTimeout(300);
  ok(!(await look()).strip, "back to its usual size, the cards are full size again");
  ok(!errors.length, "no page errors" + (errors.length ? ": " + errors.join(" | ") : ""));
  await browser.close();
  server.close();
  console.log(fails ? fails + " failed" : "all passed");
  process.exit(fails ? 1 : 0);
});
