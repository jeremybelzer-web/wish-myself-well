/* The big Viewer (viewer/big.js) in a real browser: node apps/curiosities/viewer/tests/big.js [--shots dir]
   (needs Playwright and Chromium; set NODE_PATH to where Playwright is installed if it is not local).
   The side panels leave the screen for a rail, the picture gets the room, a rail button opens its panel in a big
   tabbed window (the Details tabs too), Esc closes it, a second window is as big as the first, and Side panels
   puts the old three columns back. */
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
  await page.addInitScript(() => sessionStorage.getItem("big-set") || (localStorage.setItem("curio-viewer-big-v1", "1"), localStorage.setItem("curio-viewer-workspace-v1", JSON.stringify({ lanes: "below" })), sessionStorage.setItem("big-set", "1")));
  await page.goto(`http://127.0.0.1:${server.address().port}/index.html?viewer=1`);
  await page.waitForSelector(".cv-root.cv-big .cvb-rail button", { timeout: 15000 });
  await page.waitForTimeout(500);
  const box = (q) => page.evaluate((q) => { const e = document.querySelector(q); if (!e) return null; const b = e.getBoundingClientRect(); return { l: b.left, r: b.right, t: b.top, b: b.bottom, w: b.width, h: b.height }; }, q);
  const main = await box(".cv-root .cv-main");
  const player = await box(".cv-root .cv-player");
  ok(player.w > main.w - 120, `the picture's column takes the whole width but the rail (${Math.round(player.w)} of ${Math.round(main.w)})`);
  const lane = await box(".cv-under");
  ok(lane && lane.r <= main.r + 1 && lane.r > main.r - 30 && lane.l < player.l + 20, `Front and center runs from the rail to the right edge, inside the screen (${lane && Math.round(lane.l)} to ${lane && Math.round(lane.r)} of ${Math.round(main.r)})`);
  ok(!(await page.isVisible(".cv-things")) && !(await page.isVisible(".cv-details")), "In the scene and Details are off the screen");
  const labels = await page.$$eval(".cvb-rail button", (bs) => bs.map((b) => b.textContent.trim()));
  const has = (x) => labels.some((l) => l.endsWith(x));
  ok(has("In the scene") && has("Move it") && has("Camera & lens") && has("Side panels"), "the rail lists the panels: " + labels.join(", "));
  await page.screenshot({ path: path.join(SHOTS, "viewer-big.png") });
  await page.click('.cvb-rail [data-cvb="move"]');
  await page.waitForTimeout(300);
  const win = await box(".cvb-win");
  ok(win && win.w >= 600 && win.h > 300 && (await page.isVisible(".cvb-win .cv-details .cv-body")), `Move it opens in a big window (${win && Math.round(win.w)}×${win && Math.round(win.h)})`);
  await page.screenshot({ path: path.join(SHOTS, "viewer-big-move.png") });
  const pic = await box(".cv-wins .cv-win");
  ok(pic.r <= win.l + 1, `with one picture the window sits to its right and covers none of it (picture ends ${Math.round(pic.r)}, window starts ${Math.round(win.l)})`);
  await page.click('.cvb-tabs [data-cvb="camera"]');
  await page.waitForTimeout(200);
  ok(await page.evaluate(() => document.querySelector('.cv-details .cv-tabs [data-tab="camera"]').classList.contains("on")), "the window's tabs switch the Details tab");
  await page.click('.cvb-tabs [data-cvb="things"]');
  await page.waitForTimeout(200);
  ok(await page.isVisible(".cvb-win .cv-things"), "In the scene shows in the same window");
  await page.keyboard.press("Escape");
  await page.waitForTimeout(200);
  ok(!(await page.isVisible(".cvb-win")), "Esc closes the window");
  /* the transport sits on the top line now (Jeremy 2026-10-08), so nothing crowds the picture's sides */
  ok(await page.isVisible(".cv-bar .cv-transport [data-act=play]") && !(await page.isVisible(".cvb-side-l")), "Play and Next sit on the top line, not beside the picture");
  await page.click(".cv-bar .cv-transport [data-act=next]");
  await page.waitForTimeout(300);
  ok(await page.evaluate(() => /Panel 2 of/.test(document.querySelector(".cv-hud, .cv-root").textContent)), "Next ▶ on the top line steps to panel 2");
  await page.click(".cv-bar .cv-transport [data-act=prev]");
  await page.waitForTimeout(200);
  await page.click('[data-act="addwin"]');
  await page.waitForTimeout(500);
  const ws = await page.$$eval(".cv-wins .cv-win", (els) => els.map((e) => Math.round(e.getBoundingClientRect().width)));
  ok(ws.length === 2 && Math.abs(ws[0] - ws[1]) < 3 && ws[0] > 500, "a second window is as big as the first (" + ws.join(", ") + ")");
  await page.screenshot({ path: path.join(SHOTS, "viewer-big-two.png") });
  await page.click('.cvb-rail [data-cvb="camera"]');
  await page.waitForTimeout(400);
  const w2 = await box(".cvb-win");
  const pics = await page.$$eval(".cv-wins .cv-win", (els) => els.map((e) => e.getBoundingClientRect().bottom));
  const strip = await box(".cv-cards");
  ok(strip && w2.b <= strip.t + 2 && strip.h > 20 && strip.h < 90, `the storyboard stays as a tiny strip under the window (${strip && Math.round(strip.h)}px)`);
  ok(w2.t >= Math.max(...pics) - 1 && w2.h > 250, `with two pictures the window sits under them (${Math.round(w2.t)} under ${Math.round(Math.max(...pics))}, ${Math.round(w2.h)} tall)`);
  await page.screenshot({ path: path.join(SHOTS, "viewer-big-two-camera.png") });
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);
  /* a shorter screen with one picture: the window still opens big enough to use (it came out 2px wide, 2026-10-07) */
  await page.click(".cv-wins .cv-win:nth-child(2) [data-act=closewin], .cv-wins .cv-win:last-child .cv-win-x").catch(() => {});
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.waitForTimeout(500);
  await page.click('.cvb-rail [data-cvb="move"]');
  await page.waitForTimeout(400);
  const w3 = await box(".cvb-win");
  ok(w3 && w3.w >= 400 && w3.h >= 300 && w3.r <= 1281, `on a 1280×720 screen Move it opens big enough to use (${w3 && Math.round(w3.w)}×${w3 && Math.round(w3.h)})`);
  await page.screenshot({ path: path.join(SHOTS, "viewer-big-short.png") });
  await page.keyboard.press("Escape");
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(300);
  await page.click(".cvb-rail [data-cvb-old]");
  await page.waitForTimeout(300);
  ok(await page.isVisible(".cv-main > .cv-things") && (await page.isVisible(".cv-main > .cv-details")), "Side panels puts the old three columns back");
  ok(await page.evaluate(() => localStorage.getItem("curio-viewer-big-v1") === "0"), "and remembers it on this device");
  ok(!errors.length, "no page errors" + (errors.length ? ": " + errors.join(" | ") : ""));
  await browser.close();
  server.close();
  console.log(fails ? fails + " failed" : "all passed");
  process.exit(fails ? 1 : 0);
});
