/* People's looks and stuck drawings in a real browser: node apps/curiosities/viewer/tests/wear.js [--three three.min.js] [--shots dir]
   (needs Playwright and Chromium; --three serves a local three.js r128 for the cdnjs address, so the words can be read).

   Character search makes a person from words ("Ida: spiky red hair, overalls, boots"): named Ida, the words kept as
   their look in every panel, shown as a full 3D character. The Properties window has a Character section (hair, hat,
   top, bottom, shoes, their colors, skin, build, height) and each part can be automated panel by panel (◇). The block
   figure wears the look. The Sims' Create a Sim gives ready-made looks. A drawing made with the pencil "on things"
   on a person sticks to them, and goes where they go, turns when they turn and grows when they grow. */
const http = require("http");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { chromium } = require("playwright");

const args = process.argv.slice(2);
const arg = (n, d) => (args.includes(n) ? args[args.indexOf(n) + 1] : d);
const SHOTS = arg("--shots", os.tmpdir());
const THREE_FILE = arg("--three", "");
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
  if (THREE_FILE) await page.route("**/cdnjs.cloudflare.com/**", (r) => r.fulfill({ path: THREE_FILE, contentType: "text/javascript" }));
  else await page.route("**/cdnjs.cloudflare.com/**", (r) => r.abort());
  await page.route("**/fonts.g*/**", (r) => r.abort());
  await page.goto(base + "?viewer=1");
  await page.evaluate(() => {
    localStorage.removeItem("curiosities-viewer-v1");
    localStorage.removeItem("curiosities-build-v1");
    localStorage.removeItem("curiosities-build-windows-v1");
  });
  await page.reload();
  await page.waitForFunction(() => window.CurioViewer && window.CurioViewer.isOpen() && window.CurioBuild && window.CurioWear, null, { timeout: 20000 });
  await page.waitForTimeout(300);
  const shot = (n) => page.screenshot({ path: path.join(SHOTS, "wear-" + n + ".png") });
  const film = () => page.evaluate(() => CurioViewer.film());
  await page.click('.cv-tabs [data-tab="build"]');

  /* ---- Character search: make someone from words ---- */
  await page.evaluate(() => CurioBuild.openSearch({ mode: "characters" }));
  await page.waitForSelector(".cvb-search [data-cwords]");
  ok(await page.isVisible(".cvb-search [data-cmake]"), "Character search has Make someone from words");
  await page.fill(".cvb-search [data-cwords]", "Ida: spiky red hair, overalls, boots");
  if (THREE_FILE) {
    await page.waitForFunction(() => /Reads as/.test(document.querySelector(".cvb-read").textContent), null, { timeout: 20000 });
    const said = await page.textContent(".cvb-read");
    ok(/spiky/.test(said) && /overalls/.test(said), "it says how it read the words (" + said + ")");
  }
  const before = (await film()).objects.length;
  await page.click(".cvb-search [data-cmake]");
  let f = await film();
  const ida = f.objects.find((o) => o.name === "Ida");
  ok(f.objects.length === before + 1 && ida && ida.kind === "person", "Make puts a new person in, named Ida from the words");
  ok(f.panels.every((p) => p.place[ida.id] && p.place[ida.id].look === "spiky red hair, overalls, boots" && p.place[ida.id].rig === true), "their look is kept in every panel, and they are a full 3D character");
  ok((await page.textContent(".cvb-search [data-clook]")).includes("Ida"), "with Ida picked, the search offers to give Ida a look");
  await page.keyboard.press("Escape");

  const facesOf = (id) => page.evaluate((id) => {
    const lv = CurioViewer.live();
    return CurioViewer.faces(lv.film.objects.find((o) => o.id === id), lv.panel.place[id]);
  }, id);
  const plain = await page.evaluate(() => {
    const lv = CurioViewer.live();
    const p = lv.film.objects.find((o) => o.kind === "person" && o.name !== "Ida");
    return CurioViewer.faces(p, lv.panel.place[p.id]).length;
  });
  if (THREE_FILE) {
    const lk = await page.evaluate((id) => CurioWear.resolve(CurioViewer.live().panel.place[id]), ida.id);
    ok(lk.hair === "spiky" && lk.bottom === "overalls" && lk.feet === "boots", `the words become hair ${lk.hair}, ${lk.bottom}, ${lk.feet}`);
    ok((await facesOf(ida.id)).length > plain, "the block figure wears it (spiky hair on top)");
  }

  /* ---- Properties: the Character section ---- */
  await page.click('[data-cbw-open="roblox"]');
  const rw = '.cbw-win[aria-label*="Properties"]';
  await page.waitForSelector(rw);
  for (const id of ["look", "look.hair", "look.topColor", "look.build", "rig"]) ok(await page.isVisible(rw + ` [data-p="${id}"]`), `Properties shows ${id} for a person`);
  await page.locator(rw + ' [data-p="look.topColor"]').evaluate((e) => {
    e.value = "#ff0000";
    e.dispatchEvent(new Event("change", { bubbles: true }));
  });
  f = await film();
  ok(f.panels.every((p) => p.place[ida.id].lookParts && p.place[ida.id].lookParts.topColor === "#ff0000"), "Top color changes every panel (◇ hollow)");
  const reds = (await facesOf(ida.id)).filter((x) => /255, ?0, ?0|#ff0000/i.test(String(x.color))).length;
  ok(reds >= 3, `the block figure's top turns red (${reds} faces)`);
  /* hat, automated */
  await page.click(rw + ' [data-key="look.hat"]');
  await page.waitForTimeout(100);
  ok(await page.isVisible(rw + ' [data-lane="look.hat"]'), "◇ on Hat opens its lane");
  await page.selectOption(rw + ' [data-p="look.hat"]', "top");
  f = await film();
  const ci = await page.evaluate(() => CurioViewer.live().cur);
  const hats = f.panels.map((p) => (p.place[ida.id].lookParts || {}).hat);
  ok(hats[ci] === "top" && hats.filter((h) => h === "top").length === 1, "with ◆, the top hat is only in this panel");
  const withHat = (await facesOf(ida.id)).length;
  await page.selectOption(rw + ' [data-p="look.hat"]', "");
  ok((await facesOf(ida.id)).length < withHat, "the hat is drawn on the block figure, and goes when it is taken off");
  /* build and height */
  const tallBefore = Math.max(...(await facesOf(ida.id)).flatMap((x) => (x.pts || []).map((p) => p[1])));
  await page.fill(rw + ' [data-p="look.height"]', "1.2");
  await page.locator(rw + ' [data-p="look.height"]').evaluate((e) => e.dispatchEvent(new Event("change", { bubbles: true })));
  const tallAfter = Math.max(...(await facesOf(ida.id)).flatMap((x) => (x.pts || []).map((p) => p[1])));
  ok(tallAfter > tallBefore + 0.1, `Height makes them taller (${tallBefore.toFixed(2)} to ${tallAfter.toFixed(2)} m)`);
  await shot("1-properties");

  /* ---- The Sims: Create a Sim ---- */
  await page.click('[data-cbw-open="sims"]');
  const sw = '.cbw-win[aria-label*="Build Mode"]';
  await page.click(sw + ' [data-cat="Looks"]');
  await page.click(sw + ' [data-simlook] >> text=Chef');
  f = await film();
  ok(f.panels.every((p) => p.place[ida.id].look === "chef" && !p.place[ida.id].lookParts), "Create a Sim's Chef dresses Ida as a chef in every panel, starting fresh");
  await shot("2-sims");
  await page.evaluate(() => CurioBuildWindows.list().forEach((w) => CurioBuildWindows.close(w.id)));

  /* ---- drawing on a person sticks to them ---- */
  const scr = (oid, up) =>
    page.evaluate(([oid, up]) => {
      const lv = CurioViewer.live();
      const p = lv.panel.place[oid];
      const s = CurioViewer.projectNow([p.x, p.y + up, p.z]);
      const r = lv.canvas.getBoundingClientRect();
      const k = r.width / lv.canvas.width;
      return [r.left + s[0] * k, r.top + s[1] * k];
    }, [oid, up]);
  let on = null;
  for (const up of [1.2, 1.0, 1.4, 0.8, 1.6]) {
    const q = await scr(ida.id, up);
    const hit = await page.evaluate(([x, y]) => (CurioViewer.pickAt({ clientX: x, clientY: y }) || {}).obj, q);
    if (hit === ida.id) {
      on = q;
      break;
    }
  }
  ok(!!on, "found Ida in the picture");
  if (on) {
    await page.evaluate(() => {
      CurioBuild.set({ pen: { on: "touch", shape: "free" } });
      CurioBuild.setTool("draw");
    });
    await page.mouse.move(on[0] - 6, on[1]);
    await page.mouse.down();
    await page.mouse.move(on[0], on[1] - 3, { steps: 3 });
    await page.mouse.move(on[0] + 6, on[1], { steps: 3 });
    await page.mouse.up();
    f = await film();
    const d = f.objects.filter((o) => o.make === "sketch").pop();
    ok(d && d.pin && d.pin.id === ida.id, "a drawing made on Ida sticks to Ida");
    if (d) {
      const before = f.panels.map((p) => [p.place[d.id].x, p.place[d.id].z]);
      await page.evaluate((id) => {
        CurioViewer.edit("test-move");
        CurioViewer.live().film.panels.forEach((p) => p.place[id] && (p.place[id].x += 2));
        CurioViewer.changed(true);
      }, ida.id);
      f = await film();
      ok(f.panels.every((p, i) => Math.abs(p.place[d.id].x - before[i][0] - 2) < 0.01), "when Ida moves 2 m, the drawing goes with her");
      const dist = (p) => Math.hypot(p.place[d.id].x - p.place[ida.id].x, p.place[d.id].z - p.place[ida.id].z);
      const d0 = dist(f.panels[0]);
      await page.evaluate((id) => {
        const p = CurioViewer.live().film.panels[0].place[id];
        p.turn = (p.turn || 0) + 90;
        p.size = 2;
        CurioViewer.changed(true);
      }, ida.id);
      f = await film();
      const p0 = f.panels[0];
      ok(Math.abs(dist(p0) - d0 * 2) < 0.02 && p0.place[d.id].size === 2 * (d.pin.ds || 1), `when Ida turns and grows, the drawing turns and grows with her (${d0.toFixed(2)} to ${dist(p0).toFixed(2)} m)`);
      /* Properties: Stuck to */
      await page.evaluate((id) => CurioBuild.select([id]), d.id);
      await page.click('[data-cbw-open="roblox"]');
      await page.waitForSelector(rw + ' [data-p="pin"]');
      ok((await page.inputValue(rw + ' [data-p="pin"]')) === ida.id, "Properties says the drawing is stuck to Ida");
      await page.selectOption(rw + ' [data-p="pin"]', "");
      ok(!(await film()).objects.find((o) => o.id === d.id).pin, "choosing Nothing unsticks it");
      await page.selectOption(rw + ' [data-p="pin"]', ida.id);
      ok(((await film()).objects.find((o) => o.id === d.id).pin || {}).id === ida.id, "and Stuck to sticks it again");
      await shot("3-stuck");
    }
  }

  /* survives a reload */
  await page.reload();
  await page.waitForFunction(() => window.CurioViewer && window.CurioViewer.isOpen() && window.CurioWear, null, { timeout: 20000 });
  f = await film();
  ok(f.objects.some((o) => o.name === "Ida") && f.panels.every((p) => p.place[ida.id].look === "chef"), "Ida and her look are still there after a reload");
  ok(errors.length === 0, "no page errors" + (errors.length ? ": " + errors.join(" | ") : ""));
  await browser.close();
  server.close();
  console.log(fails ? `\n${fails} failed` : "\nall passed");
  process.exit(fails ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
