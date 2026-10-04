/* The Viewer in a real browser, inside the real app: node apps/curiosities/viewer/tests/browser.js [--shots dir]
   (needs Playwright and Chromium; set NODE_PATH to where Playwright is installed if it is not local).

   It opens the app with ?viewer=1 (test runs skip the Viewer otherwise) and works it the way a person would:
   the Viewer is open on start with the sample comic strip, the arrow pad moves the picked thing left, right and
   on a diagonal, Face the camera turns it, Undo puts it back, dragging it in the picture moves it, the lens
   presets change the picture (fisheye bends the floor's straight lines), Play moves the playhead through the
   panels, a new balloon shows up, Read as a comic shows every panel, and the work survives a reload. The page
   must report no errors. */
const http = require("http");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { chromium } = require("playwright");

const args = process.argv.slice(2);
const arg = (n, d) => (args.includes(n) ? args[args.indexOf(n) + 1] : d);
const SHOTS = arg("--shots", os.tmpdir());
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
  await page.evaluate(() => localStorage.removeItem("curiosities-viewer-v1"));
  await page.reload();
  await page.waitForFunction(() => window.CurioViewer && window.CurioViewer.isOpen(), null, { timeout: 20000 });
  await page.waitForTimeout(300);

  ok(await page.isVisible(".cv-root .cv-canvas"), "the Viewer is open on start with its picture");
  const cards = await page.locator(".cv-card").count();
  ok(cards >= 10, `the comic strip shows the sample's panels (${cards})`);
  const film = await page.evaluate(() => CurioViewer.film());
  ok(film.panels.some((p) => p.words.length) && film.panels.some((p) => p.caption), "the sample has speech balloons and narrator boxes");

  /* the picture is really drawn: many different colors in the middle of the canvas */
  const colors = await page.evaluate(() => {
    const c = document.querySelector(".cv-canvas");
    const d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
    const seen = new Set();
    for (let i = 0; i < d.length; i += 4 * 97) seen.add((d[i] >> 4) * 256 + (d[i + 1] >> 4) * 16 + (d[i + 2] >> 4));
    return seen.size;
  });
  ok(colors > 40, `the picture is drawn (${colors} colors)`);

  const place = () => page.evaluate(() => {
    const f = CurioViewer.film();
    return f.panels[CurioViewer.panel()].place[f.sel];
  });
  const p0 = await place();
  await page.click('.cv-pad [data-mv="1,0"]');
  const p1 = await place();
  ok(Math.hypot(p1.x - p0.x, p1.z - p0.z) > 0.2, "the right arrow moves the picked thing");
  await page.click('.cv-pad [data-mv="-1,1"]');
  const p2 = await place();
  ok(Math.hypot(p2.x - p1.x, p2.z - p1.z) > 0.15, "a diagonal arrow moves it too");
  await page.check('input[data-k="upMeans"][value="air"]');
  await page.click('.cv-pad [data-mv="0,1"]');
  const p3 = await place();
  ok(p3.y > p2.y + 0.2, "with 'up in the air', the up arrow lifts it");
  await page.click('[data-act="face"]');
  const p4 = await place();
  ok(Math.abs(p4.turn - p3.turn) > 5, "Face the camera turns it");
  await page.click('[data-act="undo"]');
  const p5 = await place();
  ok(p5.turn === p3.turn, "Undo turns it back");

  /* drag the Passenger in the first panel's picture */
  await page.evaluate(() => CurioViewer.select(0));
  await page.click('[data-thing="passenger"]');
  const before = await place();
  const spot = await page.evaluate(() => {
    const c = document.querySelector(".cv-canvas");
    const r = c.getBoundingClientRect();
    const f = CurioViewer.film();
    const p = f.panels[0];
    const pl = p.place.passenger;
    const tu = p.place[p.cam.aim];
    const q = CurioViewer.project(p.cam, [tu.x, tu.y + 1.1, tu.z], c.width, c.height, [pl.x, pl.y + 1.0, pl.z]);
    return q && { x: r.left + (q[0] / c.width) * r.width, y: r.top + (q[1] / c.height) * r.height };
  });
  ok(!!spot, "the Passenger can be found in the picture");
  if (spot) {
    await page.mouse.move(spot.x, spot.y);
    await page.mouse.down();
    await page.mouse.move(spot.x + 80, spot.y + 10, { steps: 6 });
    await page.mouse.up();
    const after = await place();
    ok(Math.hypot(after.x - before.x, after.z - before.z) > 0.2, "dragging the Passenger in the picture moves her or him on the floor");
  }

  /* the lens */
  await page.click('.cv-tabs [data-tab="camera"]');
  const shot = async (name) => page.evaluate(() => document.querySelector(".cv-canvas").toDataURL("image/png").length);
  const plain = await shot();
  await page.click('[data-preset="fisheye"]');
  let cam = await page.evaluate(() => CurioViewer.film().panels[CurioViewer.panel()].cam);
  ok(cam.fish === 1 && cam.lens <= 12, "Fisheye sets a very wide, bending lens");
  ok((await shot()) !== plain, "the picture changes with the fisheye");
  await page.screenshot({ path: path.join(SHOTS, "viewer-fisheye.png") });
  await page.click('[data-preset="flat"]');
  cam = await page.evaluate(() => CurioViewer.film().panels[CurioViewer.panel()].cam);
  ok(cam.lens >= 150 && cam.fish === 0, "Flat (long lens) sets a long lens");
  const fore = page.locator('input[data-k="fore"]');
  await fore.fill("90");
  cam = await page.evaluate(() => CurioViewer.film().panels[CurioViewer.panel()].cam);
  ok(cam.lens < 20, `more foreshortening means a wider lens (${cam.lens}mm)`);
  const sayFore = await page.textContent('[data-say="fore"]');
  ok(/wide/i.test(sayFore), `the lens is named in plain words (${sayFore})`);
  await page.locator('input[data-k="height"]').fill("-30");
  ok(/worm/i.test(await page.textContent('[data-say="height"]')), "a low camera says worm's eye");

  /* words */
  await page.click('.cv-tabs [data-tab="words"]');
  const n0 = await page.evaluate(() => CurioViewer.film().panels[CurioViewer.panel()].words.length);
  await page.click('[data-act="addword"]');
  await page.fill('textarea[data-k="text"][data-w="' + n0 + '"]', "Hello from the test.");
  const w = await page.evaluate(() => CurioViewer.film().panels[CurioViewer.panel()].words);
  ok(w.length === n0 + 1 && w[n0].text === "Hello from the test.", "a new speech balloon keeps its words");

  /* play */
  await page.click('[data-act="play"]');
  await page.waitForTimeout(1500);
  const t = await page.evaluate(() => CurioViewer.time());
  ok(t > 0.5, `Play moves through the film (${t.toFixed(2)} s)`);
  await page.screenshot({ path: path.join(SHOTS, "viewer-playing.png") });
  await page.click('[data-act="play"]');

  /* a new panel */
  const np0 = await page.locator(".cv-card").count();
  await page.click('[data-act="addpanel"]');
  ok((await page.locator(".cv-card").count()) === np0 + 1, "+ New panel adds a panel to the strip");

  /* comic */
  await page.click('[data-act="comic"]');
  ok(await page.evaluate(() => document.querySelector(".cv-root").classList.contains("cv-comic")), "Read as a comic shows the panels as a page");
  await page.screenshot({ path: path.join(SHOTS, "viewer-comic.png") });
  await page.click('[data-act="comic"]');

  /* full editor and back */
  await page.click('[data-act="close"]');
  ok(!(await page.evaluate(() => CurioViewer.isOpen())), "Full editor closes the Viewer");
  ok((await page.locator("[data-viewer]").count()) >= 1, "a Viewer button brings it back");

  /* it is kept */
  await page.waitForTimeout(400);
  await page.reload();
  await page.waitForFunction(() => window.CurioViewer && window.CurioViewer.isOpen(), null, { timeout: 20000 });
  const kept = await page.evaluate(() => CurioViewer.film());
  ok(kept.panels.length === np0 + 1, "the work is still there after a reload");

  /* a phone */
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(300);
  const wide = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1 && document.querySelector(".cv-canvas").getBoundingClientRect().width > 300);
  ok(wide, "on a phone the picture fills the width with no sideways scroll");
  await page.screenshot({ path: path.join(SHOTS, "viewer-phone.png") });

  ok(errors.length === 0, "no page errors" + (errors.length ? ": " + errors.join(" | ") : ""));
  await browser.close();
  server.close();
  console.log(fails ? `${fails} failed` : "all passed");
  process.exit(fails ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
