/* Moving and stretching storyboards with the mouse (Jeremy, 2026-10-07):
   node apps/curiosities/viewer/tests/strip-drag.js (needs Playwright and Chromium; set NODE_PATH if not local).

   Near a storyboard's edge the pointer is the resize arrows, in the middle a hand. Dragging from the middle
   carries a copy of the storyboard under the pointer and drops the panel where it is let go (one undo step);
   dragging the right edge makes the panel longer in quarter seconds, with a label saying how long; One size
   switches to Relative size, where a longer panel is wider; no page errors. */
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
    localStorage.removeItem("curio-strip-size-v1");
  });
  await page.reload();
  await page.waitForFunction(() => window.CurioViewer && CurioViewer.isOpen() && window.CurioStripDrag && document.querySelector(".cv-strip-head .csd-size"), null, { timeout: 20000 });
  const L = (fn, a) => page.evaluate(fn, a);
  const notes = () => L(() => CurioViewer.film().panels.map((p) => p.note));
  const box = (i) => page.locator(`.cv-card[data-i="${i}"]`).boundingBox();

  /* the cursor */
  const c1 = await box(1);
  await page.mouse.move(c1.x + c1.width - 3, c1.y + c1.height / 2);
  const edge = await L(() => getComputedStyle(document.querySelector('.cv-card[data-i="1"]')).cursor);
  await page.mouse.move(c1.x + c1.width / 2, c1.y + c1.height / 2);
  const mid = await L(() => getComputedStyle(document.querySelector('.cv-card[data-i="1"]')).cursor);
  ok(edge === "col-resize" && mid === "grab", `the pointer shows resize arrows at the edge (${edge}) and a hand in the middle (${mid})`);

  /* drag panel 2 after panel 4 */
  const before = await notes();
  const c3 = await box(3);
  await page.mouse.down();
  await page.mouse.move(c1.x + c1.width / 2 + 30, c1.y + c1.height / 2 + 5, { steps: 4 });
  const ghost = await L(() => {
    const g = document.querySelector(".csd-ghost");
    return g ? { left: parseFloat(g.style.left), top: parseFloat(g.style.top) } : null;
  });
  const grabbed = { x: c1.x + c1.width / 2 + 30 - c1.width / 2, y: c1.y + 5 };
  ok(ghost && Math.abs(ghost.left - grabbed.x) < 3 && Math.abs(ghost.top - grabbed.y) < 3, "while dragging, a copy of the storyboard rides under the pointer where it was grabbed");
  await page.mouse.move(c3.x + c3.width * 0.75, c3.y + c3.height / 2, { steps: 8 });
  ok(await page.isVisible(".csd-drop"), "a bright line shows where it will land");
  await page.mouse.up();
  await page.waitForTimeout(200);
  const after = await notes();
  ok(after[3] === before[1] && after[1] === before[2] && after[2] === before[3], "letting go drops panel 2 after panel 4");
  ok((await L(() => CurioViewer.panel())) === 3, "and the moved panel is the one picked");
  ok(!(await L(() => document.querySelector(".csd-ghost"))), "the copy goes away");
  await L(() => CurioViewer.undo());
  ok(JSON.stringify(await notes()) === JSON.stringify(before), "one undo puts it back");

  /* stretch panel 3's right edge */
  const s0 = await L(() => CurioViewer.film().panels[2].sec);
  const c2 = await box(2);
  await page.mouse.move(c2.x + c2.width - 3, c2.y + c2.height / 2);
  await page.mouse.down();
  await page.mouse.move(c2.x + c2.width - 3 + c2.width / 2, c2.y + c2.height / 2, { steps: 6 });
  const label = await L(() => (document.querySelector(".csd-len") || {}).textContent || "");
  await page.mouse.up();
  await page.waitForTimeout(150);
  const s1 = await L(() => CurioViewer.film().panels[2].sec);
  ok(Math.abs(s1 - (s0 + 1)) < 0.26 && s1 * 4 === Math.round(s1 * 4), `dragging the right edge half a card makes the panel about a second longer (${s0} s → ${s1} s)`);
  ok(/^\d+(\.\d+)? s$/.test(label), `a label says how long it is while dragging (${label})`);

  /* One size / Relative size */
  const w0 = await L(() => [2, 3].map((i) => document.querySelector(`.cv-card[data-i="${i}"]`).getBoundingClientRect().width));
  ok(Math.abs(w0[0] - w0[1]) < 1 && (await page.textContent(".csd-size")) === "One size", "One size: every storyboard is as wide as the next");
  await page.click(".csd-size");
  await page.waitForTimeout(200);
  const w1 = await L(() => [2, 3].map((i) => document.querySelector(`.cv-card[data-i="${i}"]`).getBoundingClientRect().width));
  const secs = await L(() => [2, 3].map((i) => CurioViewer.film().panels[i].sec));
  ok((await page.textContent(".csd-size")) === "Relative size" && Math.abs(w1[0] / w1[1] - secs[0] / secs[1]) < 0.08, `Relative size: a ${secs[0]} s panel is ${(w1[0] / w1[1]).toFixed(2)}× as wide as a ${secs[1]} s one`);
  await page.click(".csd-size");
  await page.waitForTimeout(100);
  ok((await page.textContent(".csd-size")) === "One size", "clicking again goes back to One size");

  ok(errors.length === 0, "no page errors" + (errors.length ? ": " + errors.join(" | ") : ""));
  await browser.close();
  server.close();
  console.log(fails ? `${fails} failed` : "all passed");
  process.exit(fails ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
