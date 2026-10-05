/* The build windows in a real browser: node apps/curiosities/viewer/tests/build-windows.js [--shots dir]
   (needs Playwright and Chromium; set NODE_PATH to where Playwright is installed if it is not local).

   Opens Roblox Studio's Properties, The Sims' Build Mode and Fortnite Creative from the Draw & build tab; each
   has a Curiosity menu. A setting changes every panel until its ◇ is pressed; then it turns ◆, gets a lane and
   changes only the panel you are on. A curiosity's own value is kept per panel (panel.v). Another curiosity can
   be found by typing. The Sims' catalog by room puts a thing in and its swatches color it; Fortnite's Building
   tab places a brick wall and fills the quick bar, and the Phone raises it. ⧉ opens a second window. */
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
  await page.evaluate(() => {
    localStorage.removeItem("curiosities-viewer-v1");
    localStorage.removeItem("curiosities-build-v1");
  });
  await page.reload();
  await page.waitForFunction(() => window.CurioViewer && window.CurioViewer.isOpen() && window.CurioBuild, null, { timeout: 20000 });
  await page.waitForTimeout(300);
  const shot = (n) => page.screenshot({ path: path.join(SHOTS, "build-" + n + ".png") });
  const film = () => page.evaluate(() => CurioViewer.film());
  const sel = async () => {
    const f = await film();
    return f.objects.find((o) => o.id === f.sel);
  };
  const canvas = page.locator(".cv-win.is-mine canvas");
  const box = await canvas.boundingBox();
  const at = (fx, fy) => [box.x + box.width * fx, box.y + box.height * fy];


  await page.click('.cv-tabs [data-tab="build"]');
  ok(await page.isVisible('[data-cbw-open="roblox"]') && await page.isVisible('[data-cbw-open="sims"]') && await page.isVisible('[data-cbw-open="fortnite"]'), "the Build tab opens Properties (Roblox), Build Mode (The Sims) and Creative (Fortnite)");
  const pid = await page.evaluate(() => {
    const f = CurioViewer.live().film;
    const p = f.objects.find((o) => o.kind === "person" && o.name === "Passenger") || f.objects.find((o) => o.kind === "person");
    CurioBuild.select([p.id]);
    return p.id;
  });
  await page.click('[data-cbw-open="roblox"]');
  const rw = '.cbw-win[aria-label*="Properties"]';
  ok(await page.isVisible(rw + " [data-wcur]"), "the Properties window has a Curiosity menu at the top");
  ok(await page.isVisible(rw + ' [data-p="size"]') && await page.isVisible(rw + ' [data-p="turn"]') && await page.isVisible(rw + ' [data-p="color"]'), "Properties lists the picked thing's size, turn and color");
  const sizes = () => page.evaluate((id) => CurioViewer.film().panels.map((p) => (p.place[id] ? p.place[id].size || 1 : null)), pid);
  await page.fill(rw + ' [data-p="size"]', "1.5");
  await page.press(rw + ' [data-p="size"]', "Enter");
  await page.locator(rw + ' [data-p="size"]').evaluate((e) => e.dispatchEvent(new Event("change", { bubbles: true })));
  let sz = await sizes();
  ok(sz.every((v) => v === null || v === 1.5), "with ◇ hollow, a setting changes every panel");
  await page.click(rw + ' [data-key="size"]');
  await page.waitForTimeout(150);
  ok(await page.isVisible(rw + ' [data-lane="size"]'), "pressing ◇ turns it ◆ and opens a lane");
  const nd = await page.$$eval(rw + ' [data-lane="size"] .cbw-dot', (d) => d.length);
  const np = (await page.evaluate(() => CurioViewer.film().panels.length));
  ok(nd === np, `the lane has a dot per panel (${nd} of ${np})`);
  await page.fill(rw + ' [data-p="size"]', "2");
  await page.locator(rw + ' [data-p="size"]').evaluate((e) => e.dispatchEvent(new Event("change", { bubbles: true })));
  sz = await sizes();
  const ci = await page.evaluate(() => CurioViewer.live().cur);
  ok(sz[ci] === 2 && sz.filter((v) => v === 2).length === 1, "with ◆, it changes only the panel you are on");
  /* drag another panel's dot */
  const other = ci === 0 ? 1 : 0;
  const dot = page.locator(rw + ` [data-lane="size"] .cbw-dot[data-i="${other}"]`);
  await dot.scrollIntoViewIfNeeded();
  const db = await dot.boundingBox();
  await page.mouse.move(db.x + db.width / 2, db.y + db.height / 2);
  await page.mouse.down();
  await page.mouse.move(db.x + db.width / 2, db.y - 12, { steps: 4 });
  await page.mouse.up();
  sz = await sizes();
  ok(sz[other] > 1.5, `dragging a dot up changes that panel (${sz[other]})`);
  await page.dblclick(rw + ` [data-lane="size"] .cbw-dot[data-i="1"]`);
  sz = await sizes();
  ok(sz[1] === sz[0], "double-clicking a dot gives it the panel before's value");
  await shot("w1-properties");

  /* a curiosity */
  await page.selectOption(rw + " [data-wcur]", "palette");
  await page.waitForTimeout(150);
  ok(await page.isVisible(rw + " .cbw-curv") && (await page.textContent(rw + " .cbw-head")).includes("Range of colors"), "picking Range of colors (palette) shows that curiosity in the window");
  const mineIds = await page.$$eval(rw + " .cbw-body > details.cbw-sec [data-p]", (els) => els.map((e) => e.dataset.p));
  ok(mineIds.includes("color") && !mineIds.includes("x"), `its settings come first: ${mineIds.join(", ")}`);
  await page.locator(rw + " [data-cv]").evaluate((e) => {
    if (e.tagName === "SELECT") e.selectedIndex = Math.min(2, e.options.length - 1);
    else e.value = String((Number(e.min) + Number(e.max)) * 0.7);
    e.dispatchEvent(new Event("change", { bubbles: true }));
  });
  const pv = await page.evaluate(() => CurioViewer.live().panel.v && CurioViewer.live().panel.v.palette);
  ok(pv != null, `the curiosity's own value is kept in this panel (${pv})`);
  await page.selectOption(rw + " [data-wcur]", "?");
  await page.fill(rw + " [data-curq]", "comedy timing");
  await page.waitForTimeout(100);
  const found = await page.$$eval(rw + " [data-pickcur]", (b) => b.length);
  ok(found > 0, `typing finds any of the curiosities (${found} for "comedy timing")`);
  await page.click(rw + " [data-pickcur] >> nth=0");
  ok((await page.evaluate(() => CurioBuildWindows.list()[0].cur)) !== "palette", "picking one switches the window to it");
  /* Glows */
  await page.selectOption(rw + " [data-wcur]", "");
  await page.check(rw + ' [data-p="glow"]');
  ok(await page.evaluate((id) => CurioViewer.faces(CurioViewer.live().film.objects.find((o) => o.id === id), CurioViewer.live().panel.place[id]).every((f) => f.glow || f.text), pid), "Glows lights the thing from inside");
  await page.uncheck(rw + ' [data-p="glow"]');

  /* a second window */
  await page.click(rw + " [data-twin] >> nth=0");
  ok((await page.evaluate(() => CurioBuildWindows.list().filter((w) => w.app === "roblox").length)) === 2, "⧉ opens another Properties window, for another curiosity");
  await page.evaluate(() => CurioBuildWindows.list().forEach((w) => CurioBuildWindows.close(w.id)));

  /* The Sims */
  await page.click('[data-cbw-open="sims"]');
  const sw = '.cbw-win[aria-label*="Build Mode"]';
  ok(await page.isVisible(sw + ' [data-tool="wall"]') && await page.isVisible(sw + ' [data-do="del"]') && await page.isVisible(sw + ' [data-cat="Kitchen"]'), "Build Mode has the Wall tool, the Sledgehammer and the catalog by room");
  await page.click(sw + ' [data-cat="Kitchen"]');
  const n0 = (await page.evaluate(() => CurioViewer.film().objects.length));
  await page.click(sw + " [data-item] >> nth=0");
  ok((await page.evaluate(() => CurioViewer.film().objects.length)) === n0 + 1, "clicking a kitchen thing puts it in");
  await page.click(sw + ' [data-swatch="#6f9b5a"]');
  ok(await page.evaluate(() => { const f = CurioViewer.film(); return f.panels[0].place[f.sel].color === "#6f9b5a"; }), "a Design swatch colors the picked thing");
  await shot("w2-sims");
  await page.click(sw + " [data-close]");

  /* Fortnite */
  await page.click('[data-cbw-open="fortnite"]');
  const fw = '.cbw-win[aria-label*="Creative"]';
  const d0 = await page.evaluate(() => CurioBuildWindows.draws());
  await page.waitForTimeout(1500);
  const d1 = await page.evaluate(() => CurioBuildWindows.draws());
  ok(d1 - d0 <= 1, `the window sits still when nothing changes (${d1 - d0} redraws in 1.5 s)`);
  await page.click(fw + ' [data-tmat="brick"]');
  await page.click(fw + ' [data-piece="wall"]');
  const wall = await page.evaluate(() => { const f = CurioViewer.film(); return Object.assign({ brick: CurioBuild.materials.brick[1] }, f.objects.find((o) => o.id === f.sel)); });
  ok(wall && wall.make === "piece" && wall.piece === "wall" && wall.color === wall.brick, "Building: Brick, then Wall places a brick wall");
  ok(await page.isVisible(fw + ' [data-quick="0"]'), "the quick bar keeps what you placed");
  await page.click(fw + ' [data-ftab="phone"]');
  const y0 = await page.evaluate(() => { const f = CurioViewer.film(); return f.panels[0].place[f.sel].y || 0; });
  await page.click(fw + ' [data-do="up"]');
  const y1 = await page.evaluate(() => { const f = CurioViewer.film(); return f.panels[0].place[f.sel].y || 0; });
  ok(y1 > y0, `the Phone raises it (${y0} → ${y1})`);
  await shot("w3-fortnite");

  /* windows come back after a reload */
  await page.waitForTimeout(500);
  await page.reload();
  await page.waitForFunction(() => window.CurioViewer && window.CurioViewer.isOpen() && window.CurioBuildWindows, null, { timeout: 20000 });
  await page.waitForTimeout(800);
  ok(await page.isVisible(fw), "open windows come back after a reload");
  ok(errors.length === 0, "no page errors" + (errors.length ? ": " + errors.slice(0, 3).join(" | ") : ""));
  await browser.close();
  server.close();
  console.log(fails ? `${fails} failed` : "all passed");
  process.exit(fails ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
