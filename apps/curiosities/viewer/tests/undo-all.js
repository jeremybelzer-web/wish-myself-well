/* One Undo for everything (Jeremy 2026-10-08: "undo any deleted thing. From storyboards to a viewer, to deleting
   the Automation window. Anything."), in a real browser:
   node apps/curiosities/viewer/tests/undo-all.js
   (needs Playwright and Chromium; set NODE_PATH to where Playwright is installed if it is not local).
   The Viewer's Undo button and ⌘Z undo the newest change anywhere, one at a time and in order: a closed window,
   a deleted panel, a curiosity window, a storyboard scene, a modulation. Most come back in place; a change only a
   reload can put back reloads the page, and undo carries on after it. */
const http = require("http");
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

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
  page.on("dialog", (d) => d.dismiss());
  const open = async () => {
    await page.waitForSelector(".cv-root .cv-wins .cv-win", { timeout: 20000 });
    await page.waitForFunction(() => window.CurioAppUndo && window.CurioStore, null, { timeout: 20000 });
    await page.waitForTimeout(900);
  };
  await page.goto(`http://127.0.0.1:${server.address().port}/index.html?viewer=1`);
  await open();
  const wins = () => page.$$eval(".cv-wins .cv-win", (e) => e.length);
  const panels = () => page.evaluate(() => CurioViewer.live().film.panels.length);
  const undoKey = async () => (await page.keyboard.press("Control+z"), page.waitForTimeout(500));
  const redoKey = async () => (await page.keyboard.press("Control+Shift+z"), page.waitForTimeout(500));
  await page.evaluate(() => (window.__same = 1));
  const same = () => page.evaluate(() => window.__same === 1);

  /* a window closed and a panel deleted: Undo brings back the newest first, in place */
  await page.click('.cv-wadd[data-act="addwin"]');
  await page.waitForTimeout(500);
  ok((await wins()) === 2, "+ Window adds a second window");
  const p0 = await panels();
  await page.click('[data-act="delpanel"]');
  await page.waitForTimeout(400);
  ok((await panels()) === p0 - 1, "a panel is deleted");
  await page.click(".cv-wclose[data-wclose='1']");
  await page.waitForTimeout(500);
  ok((await wins()) === 1, "the second window is closed");
  console.log("     newest steps: " + (await page.evaluate(() => CurioStore.history().undo.slice(-3).join(" | "))));
  await undoKey();
  ok((await wins()) === 2 && (await panels()) === p0 - 1, "⌘Z brings the closed window back first, and leaves the panel deleted");
  ok(await same(), "in place: the page did not reload");
  await page.mouse.click(5, 5);
  await page.click('[data-act="undo"]');
  await page.waitForTimeout(500);
  ok((await panels()) === p0 && (await wins()) === 2, "the Undo button then brings the deleted panel back");
  await redoKey();
  ok((await panels()) === p0 - 1, "⇧⌘Z deletes it again");
  await redoKey();
  ok((await wins()) === 1, "and closes the window again");
  await undoKey();
  await undoKey();
  ok((await wins()) === 2 && (await panels()) === p0, "and undo brings both back again");

  /* a curiosity window closed with ✕ comes back */
  const opened = await page.evaluate(() => {
    const b = document.querySelector(".cv-under [data-cwin]");
    if (!b) return "";
    CurioFocusLane.openWindow(b.dataset.cwin);
    return document.querySelector(".cf-cwin") ? b.dataset.cwin : "";
  });
  if (opened) {
    await page.click('.cf-cwin [data-cw="close"]');
    await page.waitForTimeout(300);
    ok(!(await page.$(".cf-cwin")), "a curiosity window is closed with ✕");
    await undoKey();
    ok((await page.$eval(".cf-cwin", (e) => e.dataset.cwin).catch(() => "")) === opened, "⌘Z opens the same curiosity window again");
    await page.click('.cf-cwin [data-cw="close"]');
    await page.waitForTimeout(300);
  } else ok(false, "Front and center has a curiosity window to open");

  /* a storyboard scene added, then undone; a modulation changed, then undone, in place */
  const scenes = () => page.evaluate(() => CuriosityStoryboard.data().scenes.length);
  const s0 = await scenes();
  await page.evaluate(() => CuriosityStoryboard.putScenes("undotest", [{ name: "Undo test", panels: [{ v: {}, line: "" }] }]));
  await page.waitForTimeout(300);
  ok((await scenes()) === s0 + 1, "a storyboard scene is added");
  const auto = () => page.evaluate(() => JSON.parse(localStorage.getItem("curiosities-automation-v1") || "{}"));
  const key = await page.evaluate(() => "c:" + CURIOSITIES[0].id);
  await page.mouse.click(5, 5); /* the modulation is changed by a person, so it is a step of its own */
  await page.evaluate((k) => CurioAuto.set(k, { rate: 3.25 }), key);
  await page.waitForTimeout(300);
  ok(((await auto()).patches || {})[key] && (await auto()).patches[key].rate === 3.25, "a modulation's rate is changed");
  await undoKey();
  const a1 = (await auto()).patches || {};
  ok(!a1[key] || a1[key].rate !== 3.25, "⌘Z puts the modulation back");
  ok(await same(), "in place, so running automation keeps running");
  await undoKey();
  ok((await scenes()) === s0, "the next ⌘Z takes the storyboard scene away again");

  /* something only a reload can put back: undo reloads, and carries on after it */
  await page.click('[data-act="delpanel"]');
  await page.waitForTimeout(500);
  await page.mouse.click(5, 5);
  await page.evaluate(() => localStorage.setItem("curiosities-test-undo-v1", JSON.stringify({ n: 1 })));
  await page.waitForTimeout(300);
  await Promise.all([page.waitForNavigation({ timeout: 15000 }), page.keyboard.press("Control+z")]);
  await open();
  ok((await page.evaluate(() => localStorage.getItem("curiosities-test-undo-v1"))) === null, "a change with no way back in place is undone by a reload");
  ok((await panels()) === p0 - 1, "the deleted panel is still deleted after the reload");
  await undoKey();
  ok((await panels()) === p0, "and ⌘Z after the reload brings the deleted panel back");
  await redoKey();
  ok((await panels()) === p0 - 1, "redo still works after the reload");

  ok(!errors.length, "no page errors" + (errors.length ? ": " + errors.join(" | ") : ""));
  await browser.close();
  server.close();
  console.log(fails ? fails + " failed" : "all passed");
  process.exit(fails ? 1 : 0);
});
