/* The App Walkthrough in a real browser: node apps/curiosities/viewer/tests/walkthrough.js [--shots dir]
   (needs Playwright and Chromium; set NODE_PATH to where Playwright is installed if it is not local).

   A first visit starts the tour by itself, once. Every step shows a thought bubble with its title, and the
   steps that point at a part light that part up (the Viewer's, the Screen's and the app's own). Next walks
   the whole tour to Done, which puts the Viewer back on top. Help ▾ is at the top of the Viewer, the Screen
   and the app, and Help ▸ App Walkthrough opens the tour again. Escape closes it. No page errors. */
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
  await page.goto(base + "?viewer=1&walkthrough=1");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForSelector(".cw-bubble", { timeout: 20000 });
  await page.waitForTimeout(200);

  ok(await page.isVisible(".cw-bubble"), "a first visit starts the walkthrough by itself");
  ok((await page.evaluate(() => localStorage.getItem(CurioWalkthrough.key))) === "1", "it remembers the tour was seen");
  const steps = await page.evaluate(() => CurioWalkthrough.steps());
  ok(steps.length >= 20, `the tour has a step for every part (${steps.length})`);

  const seen = [];
  const parts = new Set();
  for (let n = 0; n < steps.length + 2; n++) {
    const at = await page.evaluate(() => CurioWalkthrough.step());
    if (at < 0) break;
    const s = steps[at];
    const info = await page.evaluate(() => {
      const b = document.querySelector(".cw-bubble");
      const r = b.getBoundingClientRect();
      const lit = !document.querySelector(".cw-light").classList.contains("cw-none");
      return { title: b.querySelector("h3").textContent, inView: r.left >= 0 && r.top >= 0 && r.right <= innerWidth && r.bottom <= innerHeight, lit };
    });
    seen.push({ at, title: info.title, sel: s.sel, lit: info.lit, inView: info.inView });
    if (s.sel && info.lit) parts.add(s.part);
    if (SHOTS) await page.screenshot({ path: path.join(SHOTS, `walk-${String(at + 1).padStart(2, "0")}.png`) });
    await page.click(".cw-bubble .cw-next");
    await page.waitForTimeout(260);
  }
  const missed = seen.filter((x) => x.sel && !x.lit);
  ok(seen.length >= steps.length - 1, `Next walks the tour (${seen.length} of ${steps.length} steps shown)`);
  ok(missed.length === 0, "every step lights up its part" + (missed.length ? ": missed " + missed.map((x) => x.title).join(", ") : ""));
  ok(seen.every((x) => x.inView), "every bubble fits on the screen");
  ok(parts.size >= 3, `the tour covers the Viewer, the Screen and the app (${[...parts].join(", ")})`);
  ok(!(await page.isVisible(".cw-bubble")), "Done closes the walkthrough");
  ok(await page.evaluate(() => CurioViewer.isOpen()), "the Viewer is back on top afterward");

  ok(await page.isVisible(".cv-bar .cw-help"), "Help is at the top of the Viewer");
  await page.click(".cv-bar .cw-help");
  ok(await page.isVisible(".cw-menu [data-cw=tour]"), "Help shows App Walkthrough");
  ok((await page.textContent(".cw-menu [data-cw=tour]")).includes("App Walkthrough"), "it is called App Walkthrough");
  await page.click(".cw-menu [data-cw=tour]");
  await page.waitForTimeout(200);
  ok(await page.isVisible(".cw-bubble"), "Help ▸ App Walkthrough opens the tour again");
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(200);
  ok((await page.evaluate(() => CurioWalkthrough.step())) === 1, "the right arrow key goes to the next step");
  await page.keyboard.press("Escape");
  await page.waitForTimeout(100);
  ok(!(await page.isVisible(".cw-bubble")), "Escape closes it");

  await page.click(".cv-bar [data-act=close]");
  await page.evaluate(() => window.CurioScreen && !CurioScreen.isOpen() && CurioScreen.open());
  await page.waitForTimeout(300);
  ok(await page.isVisible(".sc-page .sc-bar .cw-help"), "Help is at the top of the Screen");
  await page.evaluate(() => window.CurioScreen && CurioScreen.close());
  await page.waitForTimeout(300);
  ok(await page.isVisible(".tabs-top .cw-help"), "Help is at the top of the app");
  await page.click(".tabs-top .cw-help");
  await page.click(".cw-menu [data-cw=tour]");
  await page.waitForTimeout(200);
  ok(await page.isVisible(".cw-bubble"), "the app's Help opens the tour too");
  await page.keyboard.press("Escape");

  await page.reload();
  await page.waitForTimeout(1500);
  ok(!(await page.isVisible(".cw-bubble")), "it does not start by itself a second time");

  const phone = await browser.newPage({ viewport: { width: 390, height: 800 } });
  phone.on("pageerror", (e) => errors.push(e.message));
  await phone.goto(base + "?viewer=1&walkthrough=1");
  await phone.evaluate(() => localStorage.clear());
  await phone.reload();
  await phone.waitForSelector(".cw-bubble", { timeout: 20000 });
  let fit = true;
  for (let n = 0; n < 6; n++) {
    fit = fit && (await phone.evaluate(() => { const r = document.querySelector(".cw-bubble").getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth + 1; }));
    await phone.click(".cw-bubble .cw-next");
    await phone.waitForTimeout(200);
  }
  ok(fit, "on a phone the bubbles fit the screen");
  await phone.keyboard.press("Escape");
  await phone.evaluate(() => { window.CurioViewer.close(); window.CurioScreen && CurioScreen.isOpen() && CurioScreen.close(); });
  await phone.setViewportSize({ width: 320, height: 800 });
  await phone.waitForTimeout(200);
  const over = await phone.evaluate(() => { const t = document.querySelector(".tabs-top"); return Math.max(t.scrollWidth - t.clientWidth, ...[...t.children].filter((e) => e.offsetParent).map((e) => e.getBoundingClientRect().right - t.getBoundingClientRect().right)); });
  ok(over <= 0.5, `at 320px the app's top row still fits (${Math.round(over)}px over)`);
  await phone.click("#lib-btn");
  ok(await phone.isVisible("#lib-menu [data-cw-lib=tour]"), "on a phone Library carries App Walkthrough");
  ok(await phone.isVisible("#lib-menu [data-viewer]"), "and the Viewer");
  await phone.click("#lib-menu [data-cw-lib=tour]");
  await phone.waitForTimeout(200);
  ok((await phone.isVisible(".cw-bubble")) && !(await phone.isVisible("#lib-menu")), "it opens the tour and closes Library");
  await phone.keyboard.press("Escape");
  if (SHOTS) await phone.screenshot({ path: path.join(SHOTS, "walk-phone.png") });

  ok(errors.length === 0, "no page errors" + (errors.length ? ": " + errors.join(" | ") : ""));
  if (process.env.WALK_DEBUG) console.log(JSON.stringify(seen, null, 1));
  await browser.close();
  server.close();
  console.log(fails ? `${fails} failed` : "all passed");
  process.exit(fails ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
