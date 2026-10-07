/* Arrange the big Viewer your own way (viewer/workspace.js), in a real browser:
   node apps/curiosities/viewer/tests/workspace.js [--shots dir]
   (needs Playwright and Chromium; set NODE_PATH to where Playwright is installed if it is not local).
   With one picture Front and center sits beside it with its nodes and lines in rows like sheet music; the ⠿ handle
   at a part's top-left corner moves it by dragging onto a spot or by its list; two pictures put the lanes back under. */
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
  await page.waitForSelector(".cv-root[data-ws-lanes] .cv-under .cf-charts", { timeout: 15000 });
  await page.waitForTimeout(800);
  const box = (q) => page.evaluate((q) => { const e = document.querySelector(q); if (!e) return null; const b = e.getBoundingClientRect(); return { l: b.left, r: b.right, t: b.top, b: b.bottom, w: b.width, h: b.height }; }, q);
  const ds = () => page.evaluate(() => Object.assign({}, document.querySelector(".cv-root").dataset));

  /* one picture: the lanes beside it, the same width, wrapped into rows */
  let d = await ds();
  ok(d.wsLanes === "beside", "with one picture Front and center sits beside it (" + d.wsLanes + ")");
  const pic = await box(".cv-stage");
  const lane = await box(".cv-under");
  const pw = await page.$eval(".cv-wins .cv-win", (e) => e.getBoundingClientRect().right);
  ok(lane.l >= pw - 2 && lane.w >= 380 && lane.t < pic.b, `it takes the room to the right of the picture (${Math.round(lane.w)}px wide)`);
  const rows = await page.$$eval(".cv-under .cf-pane-focus .ws-sheet .ws-sys", (els) => els.map((e) => e.getBoundingClientRect().top));
  ok(rows.length >= 2 && rows.every((t, i) => !i || t > rows[i - 1]), `its nodes and lines wrap into ${rows.length} rows, one under the other`);
  await page.evaluate(() => CurioViewer.seek(CurioViewer.film().panels.reduce((a, p) => a + (p.sec || 1), 0) * 0.75));
  await page.waitForTimeout(400);
  const heads = await page.$$eval(".cv-under .cf-pane-focus .ws-sheet .cf-ln-head", (els) => els.filter((h) => { const b = h.getBoundingClientRect(); const t = h.closest(".cf-ln-track").getBoundingClientRect(); return h.style.display !== "none" && b.left >= t.left - 1 && b.left <= t.right + 1; }).length);
  ok(heads === 1, `the playhead shows in just the row it has reached (${heads})`);
  await page.screenshot({ path: path.join(SHOTS, "viewer-workspace-beside.png") });

  /* drag the storyboard by its corner to the right of the picture */
  const grip = await box('.cv-strip > .ws-grip[data-ws-grip="strip"]');
  ok(!!grip, "the storyboard has a handle at its top-left corner");
  await page.mouse.move(grip.l + 8, grip.t + 8);
  await page.mouse.down();
  await page.mouse.move(grip.l + 200, grip.t - 100, { steps: 4 });
  const main = await box(".cv-main");
  await page.mouse.move(main.r - 60, main.t + main.h / 2, { steps: 6 });
  ok(await page.isVisible('.ws-zone[data-ws-zone="right"].on'), "while dragging, the spots light up and the one under the pointer is picked");
  await page.screenshot({ path: path.join(SHOTS, "viewer-workspace-drag.png") });
  await page.mouse.up();
  await page.waitForTimeout(600);
  d = await ds();
  const strip = await box(".cv-strip");
  ok(d.wsStrip === "right" && strip.l > (await box(".cv-main")).r - 2, "dropped there, the storyboard sits right of the picture");
  const cards = await page.$$eval(".cv-card", (els) => els.slice(0, 4).map((e) => Math.round(e.getBoundingClientRect().top)));
  ok(new Set(cards).size >= 2, "its cards run left to right and wrap onto the next row (" + cards.join(", ") + ")");
  await page.click('.cv-card[data-i="3"]');
  await page.waitForTimeout(300);
  ok(await page.evaluate(() => CurioViewer.panel() === 3), "a card there still picks its panel");
  await page.screenshot({ path: path.join(SHOTS, "viewer-workspace-strip-right.png") });

  /* click a handle for the list: the menu to the top, the lanes under the storyboards */
  await page.click('.cvb-rail > .ws-grip[data-ws-grip="rail"]');
  await page.waitForTimeout(200);
  ok(await page.isVisible(".ws-menu"), "clicking a handle lists the places it can go");
  await page.click('.ws-menu [data-ws-spot="top"]');
  await page.waitForTimeout(500);
  const rail = await box(".cvb-rail");
  ok(rail.w > rail.h * 3 && rail.t < (await box(".cv-stage")).t, "the menu runs along the top");
  await page.click('.cv-under > .ws-grip[data-ws-grip="lanes"]');
  await page.click('.ws-menu [data-ws-spot="bottom"]');
  await page.waitForTimeout(600);
  const under = await box(".cv-under");
  ok(under.t >= (await box(".cv-strip")).b - 2 && under.w > 1000, "Front and center goes under the storyboards, full width");
  ok(await page.isVisible(".cv-under .cf-graph"), "and still shows its nodes and lines");
  await page.screenshot({ path: path.join(SHOTS, "viewer-workspace-moved.png") });
  ok(await page.evaluate(() => JSON.parse(localStorage.getItem("curio-viewer-workspace-v1")).rail === "top"), "the arrangement is kept on this device");

  /* back to the usual places; two pictures put the lanes under them */
  await page.evaluate(() => (CurioWorkspace.set("strip", "bottom"), CurioWorkspace.set("rail", "left"), localStorage.setItem("curio-viewer-workspace-v1", "{}")));
  await page.evaluate(() => { const w = CurioWorkspace.get(); w.lanes = "auto"; });
  await page.reload();
  await page.waitForSelector(".cv-root[data-ws-lanes] .cv-under .cf-charts", { timeout: 15000 });
  await page.waitForTimeout(600);
  await page.click('[data-act="addwin"]');
  await page.waitForTimeout(800);
  d = await ds();
  ok(d.wsLanes === "below", "with two pictures Front and center goes back under them (" + d.wsLanes + ")");
  ok(!(await page.$(".cv-under .ws-sheet")), "in one long row again");
  /* Lanes follow the window: a shorter top part leaves room beside two pictures, and the lanes move there */
  const views = async () => (await page.isVisible(".cv-views-menu")) || page.click('[data-act="views"]');
  await views();
  await page.waitForTimeout(200);
  ok((await page.getAttribute(".cv-views-menu > .ws-follow", "aria-checked")) === "true", "Views ▾ starts with a Lanes follow the window switch, on");
  await page.evaluate(() => { const f = CurioViewer.live().film; f.view = f.view || {}; f.view.borders = { strip: 480 }; CurioBorders.apply(); });
  await page.waitForTimeout(800);
  d = await ds();
  const pics = await page.$$eval(".cv-wins .cv-win", (els) => els.map((e) => e.getBoundingClientRect().right));
  const ln = await box(".cv-under");
  ok(d.wsLanes === "beside" && ln.l >= Math.max(...pics) - 2, `with the top part shorter, two pictures move over and the lanes take the room beside them (${d.wsLanes})`);
  await page.screenshot({ path: path.join(SHOTS, "viewer-workspace-follow.png") });
  await page.evaluate(() => { const f = CurioViewer.live().film; f.view.borders = { strip: 0 }; CurioBorders.apply(); });
  await page.waitForTimeout(800);
  ok((await ds()).wsLanes === "below", "taller again, the pictures fill the width and the lanes drop under them");
  await page.evaluate(() => { const f = CurioViewer.live().film; f.view.borders = { strip: 480 }; CurioBorders.apply(); });
  await views();
  await page.click(".cv-views-menu > .ws-follow");
  await page.waitForTimeout(600);
  ok((await ds()).wsLanes === "below" && (await page.getAttribute(".cv-views-menu > .ws-follow", "aria-checked")) === "false", "switched off, the lanes stay under two pictures");
  await page.click(".cv-views-menu > .ws-follow");
  await page.waitForTimeout(600);
  ok((await ds()).wsLanes === "beside", "switched back on, they follow the window again");
  await page.evaluate(() => CurioWorkspace.set("lanes", "below"));
  ok((await page.evaluate(() => CurioWorkspace.get().follow)) === false, "putting the lanes somewhere yourself turns the switch off");

  ok(!errors.length, "no page errors" + (errors.length ? ": " + errors.join(" | ") : ""));
  await browser.close();
  server.close();
  console.log(fails ? fails + " failed" : "all passed");
  process.exit(fails ? 1 : 0);
});
