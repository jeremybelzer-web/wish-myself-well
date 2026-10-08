/* The Viewer's camera and windows in a real browser: node apps/curiosities/viewer/tests/camera.js [--shots dir]
   (Jeremy's notes, 2026-10-04 20:16Z). A plain drag on a building that isn't picked swings the camera instead
   of moving the building; buildings stay drawn when the camera goes right up to them and past them; the
   Foreshortening slider all the way to "less" keeps a clear picture (not grey); full fisheye bends the picture
   much more than before; the camera swings all the way under the subject; the + in a window's corner tab adds a
   window; "Keep size, swipe the top edge" shows one window and the top edge switches between them; no errors. */
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
    localStorage.removeItem("curiosities-viewer-winmode-v1");
  });
  await page.reload();
  await page.waitForFunction(() => window.CurioViewer && CurioViewer.isOpen(), null, { timeout: 20000 });
  await page.waitForTimeout(300);
  const cam = () => page.evaluate(() => CurioViewer.film().panels[CurioViewer.panel()].cam);
  const picked = () => page.evaluate(() => CurioViewer.live().film.sel);
  const shot = (name) => SHOTS && page.locator(".cv-win").first().screenshot({ path: path.join(SHOTS, name + ".png") });
  /* the screen spot of a thing's middle, from the live picks */
  const spotOf = (id) =>
    page.evaluate((id) => {
      const L = CurioViewer.live();
      const r = L.canvas.getBoundingClientRect();
      const ps = L.picks.filter((p) => p.obj === id);
      if (!ps.length) return null;
      const big = ps.sort((a, b) => area(b.s) - area(a.s))[0];
      function area(s) { let a = 0; s.forEach((p, i) => { const q = s[(i + 1) % s.length]; a += p[0] * q[1] - q[0] * p[1]; }); return Math.abs(a / 2); }
      const cx = big.s.reduce((a, p) => a + p[0], 0) / big.s.length;
      const cy = big.s.reduce((a, p) => a + p[1], 0) / big.s.length;
      return [r.left + (cx / L.canvas.width) * r.width, r.top + (cy / L.canvas.height) * r.height];
    }, id);

  /* 1. a plain drag on a building that isn't picked looks around */
  await page.evaluate(() => CurioViewer.select(0));
  await page.evaluate(() => CurioViewer.pick("biju"));
  await page.waitForTimeout(150);
  const b = await spotOf("b3");
  ok(!!b, "a building is in the first panel's picture");
  const c0 = await cam();
  const place0 = await page.evaluate(() => CurioViewer.film().panels[0].place.b3);
  await page.mouse.move(b[0], b[1]);
  await page.mouse.down();
  await page.mouse.move(b[0] - 160, b[1] + 30, { steps: 8 });
  await page.mouse.up();
  await page.waitForTimeout(150);
  const c1 = await cam();
  const place1 = await page.evaluate(() => CurioViewer.film().panels[0].place.b3);
  ok(c1.around !== c0.around && JSON.stringify(place0) === JSON.stringify(place1), `dragging an unpicked building swings the camera (${c0.around}° → ${c1.around}°) and leaves the building where it was`);
  ok((await picked()) === "b3", "and that click picked it");

  /* 2. buildings stay when the camera goes right up to them and past them */
  await page.evaluate(() => CurioViewer.setCamera({ shot: 0.25, lens: 24, height: 4, around: 180, aim: "b2", pan: [0, 0, 0] }));
  await page.waitForTimeout(150);
  const near = await page.evaluate(() => [...new Set(CurioViewer.live().picks.map((p) => p.obj))].filter((id) => /^b\d/.test(id)).length);
  ok(near >= 1, `up close to a building, buildings are still drawn (${near})`);
  await shot("cam-close-building");
  await page.evaluate(() => CurioViewer.undo());

  /* 3. Foreshortening all the way to "less" keeps a clear picture */
  const spread = () =>
    page.evaluate(() => {
      const cv = CurioViewer.live().canvas;
      const d = cv.getContext("2d").getImageData(0, 0, cv.width, cv.height).data;
      const lum = [];
      for (let k = 0; k < d.length; k += 4 * 97) lum.push(0.3 * d[k] + 0.59 * d[k + 1] + 0.11 * d[k + 2]);
      const m = lum.reduce((a, v) => a + v, 0) / lum.length;
      return Math.sqrt(lum.reduce((a, v) => a + (v - m) * (v - m), 0) / lum.length);
    });
  await page.click('.cv-tabs [data-tab="camera"]');
  await page.waitForTimeout(100);
  await page.$eval('[data-k="fore"]', (el) => { el.value = "0"; el.dispatchEvent(new Event("input", { bubbles: true })); el.dispatchEvent(new Event("change", { bubbles: true })); });
  await page.waitForTimeout(200);
  const sd = await spread();
  ok(sd > 18, `least foreshortening still shows a clear picture, not a grey one (contrast ${sd.toFixed(1)})`);
  await shot("cam-fore-least");
  await page.evaluate(() => CurioViewer.undo());

  /* 4. full fisheye bends a lot: a straight line through the picture's edge is pulled toward the middle */
  const edge = (fish) =>
    page.evaluate((fish) => {
      const c = Object.assign({}, CurioViewer.film().panels[0].cam, { fish, pan: [0, 0, 0] });
      const p = CurioViewer.project(c, [0, 1, 0], 1600, 900, [6, 1, -4]);
      return p ? Math.hypot(p[0] - 800, p[1] - 450) : null;
    }, fish);
  const e0 = await edge(0);
  const e1 = await edge(1);
  ok(e0 && e1 && e1 < e0 * 0.6, `full fisheye squeezes the edges hard (an off-center point moves from ${Math.round(e0)} to ${Math.round(e1)} px from the middle)`);

  /* 5. the camera swings all the way under the subject */
  await page.evaluate(() => CurioViewer.setCamera({ height: -85 }));
  await page.waitForTimeout(150);
  const under = await page.evaluate(() => CurioViewer.live().C.pos[1]);
  ok(under < 0, `at height -85° the camera is below the floor, looking up (${under.toFixed(2)} m)`);
  ok(/underneath/i.test(await page.textContent(".cv-hud")), "and says so: " + (await page.textContent(".cv-hud")));
  await shot("cam-underneath");
  await page.evaluate(() => CurioViewer.undo());

  /* 6. windows: + in the corner tab, then fit or swipe */
  await page.click(".cv-root [data-act=addwin] >> visible=true");
  await page.waitForTimeout(200);
  ok((await page.locator(".cv-win").count()) === 2, "the + in the corner tab adds a window");
  ok((await page.locator(".cv-win:not([hidden])").count()) === 2, "Fit all windows on screen shows both");
  await page.selectOption('[data-k="winmode"]', "swipe");
  await page.waitForTimeout(200);
  ok((await page.locator(".cv-win:not([hidden])").count()) === 1, "Keep size, swipe the top edge shows one big window");
  const shownName = () => page.textContent(".cv-win:not([hidden]) .cv-wname");
  const n0 = await shownName();
  const top = await page.locator(".cv-win:not([hidden]) .cv-wtop").boundingBox();
  await page.mouse.move(top.x + top.width * 0.7, top.y + 5);
  await page.mouse.down();
  await page.mouse.move(top.x + top.width * 0.3, top.y + 5, { steps: 6 });
  await page.mouse.up();
  await page.waitForTimeout(200);
  const n1 = await shownName();
  ok(n0 !== n1, `dragging along the top edge shows the other window (${n0} → ${n1})`);
  await page.reload();
  await page.waitForFunction(() => window.CurioViewer && CurioViewer.isOpen(), null, { timeout: 20000 });
  await page.waitForTimeout(200);
  ok((await page.$eval('[data-k="winmode"]', (s) => s.value)) === "swipe", "the choice is kept after a reload");
  await page.selectOption('[data-k="winmode"]', "fit");

  ok(errors.length === 0, "no page errors" + (errors.length ? ": " + errors.join(" | ") : ""));
  await browser.close();
  server.close();
  console.log(fails ? `${fails} failed` : "all passed");
  process.exit(fails ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
