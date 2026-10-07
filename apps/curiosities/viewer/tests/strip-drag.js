/* Moving and stretching storyboards with the mouse (Jeremy, 2026-10-07):
   node apps/curiosities/viewer/tests/strip-drag.js (needs Playwright and Chromium; set NODE_PATH if not local).

   Near a storyboard's edge the pointer is the resize arrows, in the middle a hand. Dragging from the middle
   carries a copy of the storyboard under the pointer and drops the panel where it is let go (one undo step);
   dragging the right edge makes the panel longer in quarter seconds, with a label saying how long; One size
   switches to Relative size, where a longer panel is wider; panels picked together drag and stretch together;
   right-click and Ctrl+click open the storyboard menu, whose commands work on the picked panels; no page errors. */
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


  /* several picked panels drag together */
  await page.click('.cv-card[data-i="1"]');
  await page.click('.cv-card[data-i="2"]', { modifiers: ["Shift"] });
  ok((await L(() => CurioScenes.picked().panels.join(","))) === "1,2", "Shift+click picks panels 2 and 3");
  const g0 = await notes();
  const b2 = await box(2);
  const b5 = await box(5);
  await page.mouse.move(b2.x + b2.width / 2, b2.y + b2.height / 2);
  await page.mouse.down();
  await page.mouse.move(b2.x + b2.width / 2 + 40, b2.y + b2.height / 2, { steps: 4 });
  ok(/2 panels/.test(await L(() => (document.querySelector(".csd-ghost .csd-count") || {}).textContent || "")), "the copy under the pointer says it carries 2 panels");
  ok((await L(() => document.querySelectorAll(".cv-card.csd-lifted").length)) === 2, "both picked storyboards are lifted");
  await page.mouse.move(b5.x + b5.width * 0.75, b5.y + b5.height / 2, { steps: 8 });
  await page.mouse.up();
  await page.waitForTimeout(200);
  const g1 = await notes();
  ok(g1[4] === g0[1] && g1[5] === g0[2] && g1[1] === g0[3], "dropping after panel 6 moves both, still in order");
  ok((await L(() => (CurioScenes.picked() || { panels: [] }).panels.join(","))) === "4,5", "and they stay picked");
  await L(() => CurioViewer.undo());

  /* several picked panels stretch together */
  await L(() => CurioScenes.pick([1, 2]));
  const t0 = await L(() => [1, 2].map((i) => CurioViewer.film().panels[i].sec));
  const e1 = await box(1);
  await page.mouse.move(e1.x + e1.width - 3, e1.y + e1.height / 2);
  await page.mouse.down();
  await page.mouse.move(e1.x + e1.width - 3 + e1.width / 4, e1.y + e1.height / 2, { steps: 5 });
  await page.mouse.up();
  await page.waitForTimeout(150);
  const t1 = await L(() => [1, 2].map((i) => CurioViewer.film().panels[i].sec));
  ok(t1[0] - t0[0] === 0.5 && t1[1] - t0[1] === 0.5, `stretching one picked panel's edge stretches both (${t0.join(", ")} → ${t1.join(", ")} s)`);
  await L(() => CurioViewer.undo());

  /* the menu */
  await L(() => CurioScenes.pick([3, 4]));
  const n0 = await L(() => CurioViewer.film().panels.length);
  await page.click('.cv-card[data-i="3"]', { button: "right" });
  ok(await page.isVisible(".csd-menu"), "right-click opens the storyboard menu");
  ok(/2 panels/i.test(await page.textContent(".csd-menu header")), "it works on the 2 picked panels");
  await page.click('.csd-menu button:has-text("Duplicate")');
  await page.waitForTimeout(150);
  ok((await L(() => CurioViewer.film().panels.length)) === n0 + 2 && !(await L(() => document.querySelector(".csd-menu"))), "Duplicate adds a copy of both after them and closes the menu");
  await L(() => CurioViewer.undo());
  ok((await L(() => CurioViewer.film().panels.length)) === n0, "one undo takes the copies out");

  await L(() => CurioScenes.clear());
  await page.locator('.cv-card[data-i="2"]').focus();
  await page.keyboard.press("Shift+F10");
  ok(await page.isVisible(".csd-menu"), "Shift+F10 (the PC menu key) opens the menu for the storyboard that has the focus");
  const s2 = await L(() => CurioViewer.film().panels[2].sec);
  await page.click('.csd-menu button:has-text("Split in two")');
  await page.waitForTimeout(150);
  const sp = await L(() => [2, 3].map((i) => CurioViewer.film().panels[i].sec));
  ok(sp[0] + sp[1] === s2 && (await L(() => CurioViewer.film().panels.length)) === n0 + 1, `Split in two makes two panels that add up to the old one (${sp.join(" + ")} = ${s2} s)`);
  await L(() => CurioViewer.undo());
  await page.click('.cv-card[data-i="2"]', { button: "right" });
  await page.click('.csd-len-row button:text-is("5 s")');
  await page.waitForTimeout(100);
  ok((await L(() => CurioViewer.film().panels[2].sec)) === 5, "Length 5 s sets the panel to 5 seconds");
  await L(() => CurioViewer.undo());
  await page.click('.cv-card[data-i="2"]', { button: "right" });
  await page.keyboard.press("Escape");
  ok(!(await L(() => document.querySelector(".csd-menu"))), "Escape closes the menu");

  ok(errors.length === 0, "no page errors" + (errors.length ? ": " + errors.join(" | ") : ""));
  await browser.close();
  server.close();
  console.log(fails ? `${fails} failed` : "all passed");
  process.exit(fails ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
