/* The automation lanes' menu (Jeremy, 2026-10-07): node apps/curiosities/viewer/tests/lane-menu.js
   (needs Playwright and Chromium; set NODE_PATH if not local).

   Right-clicking a lane in Front and center's Automation lanes opens the same kind of menu as the storyboards,
   named for the lane and the panel; Set to Highest writes that panel's value (one undo step); with storyboards
   picked it works on all of them; a lane read from the
   picture says where to change it instead; Escape closes it; no page errors. */
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
    sessionStorage.setItem("curio-focus-tab-v1", "lanes");
    localStorage.setItem("curio-focus-zoom-v1", JSON.stringify({ mode: "film", span: 0 }));
  });
  await page.reload();
  await page.waitForFunction(() => window.CurioViewer && CurioViewer.isOpen() && window.CurioMenu && document.querySelector(".cv-under .cf-ln-edit .cf-ln-dot"), null, { timeout: 20000 });
  const L = (fn, a) => page.evaluate(fn, a);

  /* an editable lane (a story value), and panel 3 on it */
  const lane = await L(() => {
    const row = [...document.querySelectorAll(".cv-under .cf-ln-edit")].find((el) => el.querySelector('.cf-ln-dot[data-ln-i="2"]'));
    return row ? row.dataset.ln : null;
  });
  ok(!!lane, `found an editable lane with a value in panel 3 (${lane})`);
  const sel = `.cv-under .cf-ln[data-ln="${lane}"] .cf-ln-dot[data-ln-i="2"]`;
  await page.locator(sel).scrollIntoViewIfNeeded();
  await page.click(sel, { button: "right" });
  ok(await page.isVisible(".csd-menu"), "right-clicking a lane opens a menu");
  const head = await page.textContent(".csd-menu header");
  ok(/panel 3/.test(head), `named for the lane and the panel (${head})`);
  const v0 = await L((id) => CurioFocusLane.values(2)[id], lane);
  await page.click('.csd-menu .csd-len-row button:text-is("Highest")');
  await page.waitForTimeout(150);
  const v1 = await L((id) => CurioViewer.film().panels[2].v[id], lane);
  ok(v1 != null && String(v1) !== String(v0), `Set to Highest changes panel 3's value (${v0} → ${v1})`);
  await L(() => CurioViewer.undo());
  const v2 = await L((id) => (CurioViewer.film().panels[2].v || {})[id], lane);
  ok(String(v2) === String(v0) || v2 == null, "one undo puts it back");

  /* picked panels: ramp */
  await L(() => CurioScenes.pick([1, 2, 3, 4]));
  await page.waitForTimeout(150);
  await L((id) => {
    /* set the ends apart so the ramp has somewhere to go */
    CurioViewer.live().film.panels[1].v = Object.assign({}, CurioViewer.live().film.panels[1].v, { [id]: CurioFocusLane.values(1)[id] });
  }, lane);
  const dot = await page.$(`.cv-under .cf-ln[data-ln="${lane}"] .cf-ln-dot[data-ln-i="2"]`);
  await dot.click({ button: "right" });
  ok(/4 panels/.test(await page.textContent(".csd-menu header")), "with 4 storyboards picked the menu works on all 4");
  await page.click('.csd-menu button:has-text("Lowest")');
  await page.waitForTimeout(150);
  const lows = await L((id) => [1, 2, 3, 4].map((i) => CurioViewer.film().panels[i].v[id]), lane);
  ok(lows.every((v) => String(v) === String(lows[0])), `Set to Lowest sets all 4 (${lows.join(", ")})`);
  await L(() => CurioViewer.undo());
  await L(() => CurioScenes.clear());

  /* a lane read from the picture */
  const pic = await page.$('.cv-under .cf-ln[data-ln="shotSize"] .cf-ln-track');
  if (pic) {
    await pic.click({ button: "right", position: { x: 20, y: 10 } });
    const off = await L(() => [...document.querySelectorAll(".csd-menu .csd-len-row button")].filter((b) => /Lowest|Highest/.test(b.textContent)).every((b) => b.disabled && /picture/.test(b.title)));
    ok(off, "on Shot size (read from the picture) the value commands are off and say where to change it");
  } else ok(false, "Shot size has a lane");
  await page.keyboard.press("Escape");
  ok(!(await L(() => document.querySelector(".csd-menu"))), "Escape closes the menu");
  ok(!(await L(() => document.querySelector(".cf-ln-dot.cf-drag"))), "right-clicking a dot does not start dragging it");

  ok(errors.length === 0, "no page errors" + (errors.length ? ": " + errors.join(" | ") : ""));
  await browser.close();
  server.close();
  console.log(fails ? `${fails} failed` : "all passed");
  process.exit(fails ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
