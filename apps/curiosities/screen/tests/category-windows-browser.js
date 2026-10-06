/* The category windows (screen/category-windows.js) in a real browser, inside the real app:
   node apps/curiosities/screen/tests/category-windows-browser.js   (needs Playwright and Chromium)
   Opens ◎ Categories on the Screen's bar, opens every category, turns a suite knob all the way (one undo step,
   the suite's share rises), Escape closes it. Desktop and phone widths. The page must report no errors. */
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
  for (const vp of [{ width: 1440, height: 1000 }, { width: 390, height: 800 }]) {
    const page = await browser.newPage({ viewport: vp });
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    page.on("console", (m) => m.type() === "error" && !/Failed to load resource|three|cdnjs|fonts\.g/.test(m.text()) && errors.push(m.text()));
    await page.goto(base + "index.html?screen=1");
    await page.waitForFunction(() => window.CurioScreen && window.CurioScreen.isOpen() && window.CurioCategoryWindows, null, { timeout: 15000 });
    const T = (fn, arg) => page.evaluate(fn, arg);
    const w = vp.width + "px: ";
    const cats = await T(() => window.CurioCategoryWindows.list());
    ok(cats.length >= 8, w + "the category list has " + cats.length + " categories");
    await page.waitForSelector(".sc-page .sc-bar .ccw-btn", { timeout: 5000 });
    await page.click(".sc-page .sc-bar .ccw-btn");
    ok(await page.isVisible("#ccw-menu"), w + "◎ Categories opens a menu of categories");
    const first = await page.getAttribute("#ccw-menu [data-cat]", "data-cat");
    await page.click("#ccw-menu [data-cat]");
    ok(await T(() => window.CurioCategoryWindows.isOpen()), w + "picking one opens its window (" + first + ")");
    ok(await page.isVisible(".ccw-pie") && (await page.$$(".ccw-knob")).length > 0 && (await page.$$(".ccw-row input")).length > 0 && (await page.$$(".ccw-graph")).length > 0, w + "it shows a pie, knobs, sliders and a graph");
    /* every category opens with no errors */
    for (const c of cats) await T((id) => window.CurioCategoryWindows.open(id), c.id);
    ok(errors.length === 0, w + "every category opens with no errors");
    const r = await T(() => {
      const C = window.CurioCategoryWindows;
      const id = C.list().find((c) => c.id === "emotion") ? "emotion" : C.list()[0].id;
      C.open(id);
      const s = C.suitesOf(id)[0];
      const before = C.shareOf(s);
      const n = window.CurioEngine.history().undo.length;
      const res = C.pushSuite(s, 1);
      return { s, before, after: C.shareOf(s), ok: res && res.ok !== false, steps: window.CurioEngine.history().undo.length - n };
    });
    ok(r.ok && r.steps === 1, w + "turning a knob all the way is one undo step (" + r.s + ")");
    ok(r.after >= r.before && r.after > 0.5, w + "the suite's share rises to " + Math.round(r.after * 100) + "% (was " + Math.round(r.before * 100) + "%)");
    await page.focus(".ccw-knob");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Escape");
    ok(!(await T(() => window.CurioCategoryWindows.isOpen())), w + "Escape closes the window");
    ok(errors.length === 0, w + "no page errors" + (errors.length ? ": " + errors.slice(0, 3).join(" | ") : ""));
    await page.close();
  }
  await browser.close();
  server.close();
  console.log(fails ? fails + " failed" : "all passed");
  process.exit(fails ? 1 : 0);
})();
