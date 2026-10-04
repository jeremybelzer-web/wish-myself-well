/* Viewer borders in a real browser: node apps/curiosities/viewer/tests/borders.js
   (Jeremy's notes, 2026-10-04 20:16Z: every border draggable, panels fully collapsible, triangles hinting which
   way to drag, undo for everything). Dragging the borders resizes In the scene, Details and the storyboard;
   « folds a panel away and a click on the thin edge brings it back; Undo and Redo take border moves back; the
   sizes come back after a reload; double-click is the usual size; phones and Read as a comic have no borders;
   no errors. */
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
  await page.evaluate(() => {
    localStorage.removeItem("curiosities-viewer-v1");
    localStorage.removeItem("curiosities-viewer-windows-v1");
  });
  await page.reload();
  await page.waitForFunction(() => window.CurioViewer && CurioViewer.isOpen() && document.querySelectorAll(".cvd-border").length === 4, null, { timeout: 20000 });
  await page.waitForTimeout(400);
  const L = (f, a) => page.evaluate(f, a);
  const w = (sel) => L((s) => Math.round(document.querySelector(s).getBoundingClientRect().width), sel);
  const h = (sel) => L((s) => Math.round(document.querySelector(s).getBoundingClientRect().height), sel);
  const box = async (name) => page.locator(`.cvd-border[data-border="${name}"]`).boundingBox();
  const drag = async (name, dx, dy) => {
    const b = await box(name);
    const x = b.x + b.width / 2;
    const y = b.y + b.height / 2;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + dx / 2, y + dy / 2, { steps: 4 });
    await page.mouse.move(x + dx, y + dy, { steps: 4 });
    await page.mouse.up();
    await page.waitForTimeout(150);
  };
  if (SHOTS) await page.screenshot({ path: path.join(SHOTS, "borders-0.png") });

  ok(await L(() => document.querySelector(".cv-root.cv-viewer").classList.contains("cvd-on")), "wide screen: the borders are on");
  const left0 = await w(".cv-things");
  ok(Math.abs(left0 - 190) < 4, "In the scene starts at its usual width: " + left0);
  const tri = await L(() => document.querySelector('.cvd-border[data-border="left"] .sc-split-tri').textContent);
  ok(/◂/.test(tri) && /▸/.test(tri), "the border has triangles showing which way it goes: " + tri);

  await drag("left", 80, 0);
  const left1 = await w(".cv-things");
  ok(Math.abs(left1 - 270) < 6, "dragging the left border right widens In the scene: " + left1);
  const lb = await box("left");
  const pr = await L(() => document.querySelector(".cv-player").getBoundingClientRect().left);
  ok(Math.abs(lb.x + lb.width / 2 - pr) < 10, "the border follows the panel's new edge");

  await drag("right", -100, 0);
  const right1 = await w(".cv-details");
  ok(Math.abs(right1 - 430) < 6, "dragging the right border left widens Details: " + right1);

  const strip0 = await h(".cv-strip");
  await drag("strip", 0, -70);
  const strip1 = await h(".cv-strip");
  ok(strip1 > strip0 + 50, `dragging the storyboard's border up makes it taller: ${strip0} -> ${strip1}`);
  const lane0 = await h(".cv-under");
  await drag("lane", 0, -40);
  const lane1 = await h(".cv-under");
  ok(lane1 > lane0 + 25, `dragging the border above Front and center up makes it taller: ${lane0} -> ${lane1}`);
  await page.click('[data-act="undo"]');
  await page.waitForTimeout(150);
  ok(Math.abs((await h(".cv-under")) - lane0) < 4, "Undo takes it back");
  if (SHOTS) await page.screenshot({ path: path.join(SHOTS, "borders-1.png") });

  /* undo takes the moves back one at a time, redo puts them back */
  await page.click('[data-act="undo"]');
  await page.waitForTimeout(150);
  ok(Math.abs((await h(".cv-strip")) - strip0) < 4, "Undo takes the storyboard's height back");
  await page.click('[data-act="undo"]');
  await page.waitForTimeout(150);
  ok(Math.abs((await w(".cv-details")) - 330) < 4, "Undo again takes Details back");
  await page.click('[data-act="undo"]');
  await page.waitForTimeout(150);
  ok(Math.abs((await w(".cv-things")) - 190) < 4, "and again, In the scene");
  await page.click('[data-act="redo"]');
  await page.waitForTimeout(150);
  ok(Math.abs((await w(".cv-things")) - 270) < 6, "Redo puts it back");

  /* fold away and back */
  await page.hover('.cvd-border[data-border="left"]');
  await page.click('.cvd-border[data-border="left"] .sc-split-fold', { force: true });
  await page.waitForTimeout(150);
  ok(await L(() => document.querySelector(".cv-things").hidden), "« folds In the scene away completely");
  const playerW = await w(".cv-player");
  ok(playerW > 1440 - 330 - 60, "and the picture takes the room: " + playerW);
  const lb2 = await box("left");
  ok(lb2 && lb2.x < 20, "the thin edge stays at the side to bring it back");
  await page.mouse.click(lb2.x + lb2.width / 2, lb2.y + lb2.height / 2);
  await page.waitForTimeout(150);
  ok(!(await L(() => document.querySelector(".cv-things").hidden)) && Math.abs((await w(".cv-things")) - 270) < 6, "clicking the edge brings it back at its own width");

  /* dragging far past the smallest size folds it too */
  await drag("right", 400, 0);
  ok(await L(() => document.querySelector(".cv-details").hidden), "dragging Details' border all the way right folds it away");
  await page.click('[data-act="undo"]');
  await page.waitForTimeout(150);
  ok(!(await L(() => document.querySelector(".cv-details").hidden)), "Undo brings it back");

  /* keys */
  await page.focus('.cvd-border[data-border="left"]');
  await page.keyboard.press("ArrowLeft");
  await page.waitForTimeout(100);
  ok(Math.abs((await w(".cv-things")) - 260) < 6, "the arrow keys move a border too");

  /* kept with the film */
  await page.waitForTimeout(400);
  await page.reload();
  await page.waitForFunction(() => window.CurioViewer && CurioViewer.isOpen() && document.querySelectorAll(".cvd-border").length === 4, null, { timeout: 20000 });
  await page.waitForTimeout(400);
  ok(Math.abs((await w(".cv-things")) - 260) < 6, "the sizes come back after a reload");

  await page.dblclick('.cvd-border[data-border="left"]');
  await page.waitForTimeout(150);
  ok(Math.abs((await w(".cv-things")) - 190) < 4, "double-click: the usual size");

  /* the picture still draws at its size */
  const cv = await L(() => {
    const c = CurioViewer.live().canvas;
    const r = c.getBoundingClientRect();
    return Math.abs(r.width - c.parentElement.getBoundingClientRect().width) < 4;
  });
  ok(cv, "the picture fills its window after the moves");

  /* Read as a comic: no borders */
  await page.click('[data-act="comic"]');
  await page.waitForTimeout(200);
  ok(await L(() => [...document.querySelectorAll(".cvd-border")].every((b) => b.hidden)), "Read as a comic has no borders");
  await page.click('[data-act="comic"]');
  await page.waitForTimeout(200);
  ok(await L(() => document.querySelectorAll(".cvd-border:not([hidden])").length >= 3), "back from the comic, the borders are back");

  /* a phone keeps its one column */
  await page.setViewportSize({ width: 420, height: 860 });
  await page.waitForTimeout(300);
  ok(await L(() => !document.querySelector(".cv-root.cv-viewer").classList.contains("cvd-on") && [...document.querySelectorAll(".cvd-border")].every((b) => b.hidden)), "a phone has no borders");
  ok(await L(() => !document.querySelector(".cv-things").hidden && !document.querySelector(".cv-details").hidden), "and every panel shows");
  ok(await L(() => document.documentElement.scrollWidth <= innerWidth + 1), "and nothing pokes out sideways");
  if (SHOTS) await page.screenshot({ path: path.join(SHOTS, "borders-phone.png") });

  ok(errors.length === 0, "no page errors" + (errors.length ? ": " + errors.join(" | ") : ""));
  await browser.close();
  server.close();
  console.log(fails ? `${fails} failed` : "all passed");
  process.exit(fails ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
