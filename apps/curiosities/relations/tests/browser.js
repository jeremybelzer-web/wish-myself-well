/* The relationship map in a real browser: node apps/curiosities/relations/tests/browser.js [--three three.min.js] [--shots dir]
   (needs Playwright and Chromium; --three serves a local three.js for the cdnjs address.)
   Standalone page: select a trait and see its lines, hop along a tie, open the movement archive, pick a feeling,
   pick movements and read what they say, show them on the map, switch to the 3D cube, double-click a curiosity
   to fly to it and double-click empty space to fly out. Then inside the app: Library, Relationship map opens over
   the app with the live database. No page errors. */
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
  const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--ignore-gpu-blocklist"] });
  const page = await browser.newPage({ viewport: { width: 1400, height: 950 }, serviceWorkers: "block" });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && !/Failed to load resource|three|cdnjs|fonts\.g/.test(m.text()) && errors.push(m.text()));
  if (THREE_FILE) await page.route("**/cdnjs.cloudflare.com/**", (r) => r.fulfill({ path: THREE_FILE, contentType: "text/javascript" }));
  else await page.route("**/cdnjs.cloudflare.com/**", (r) => r.abort());
  await page.route("**/fonts.g*/**", (r) => r.abort());
  try {
    await page.goto(base + "relations/index.html");
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForSelector(".rl-chip");
    const chips = await page.locator(".rl-chip").count();
    ok(chips > 900, `the flat matrix shows every node (${chips})`);

    await page.click('.rl-chip[data-id="tr-suspicious-authority"]');
    ok((await page.textContent(".rl-side h2")) === "Suspicious of authority", "clicking a trait selects it");
    const lines = await page.locator(".rl-svg path").count();
    ok(lines >= 15, `lines run to everything it is tied to (${lines})`);
    for (const id of ["fig-authority", "em-suspicion", "mv-constricted", "mv-darting-eyes", "mv-shallow-breath"])
      ok(await page.locator(`.rl-chip.near[data-id="${id}"]`).count(), `${id} is lit as a direct tie`);
    await page.screenshot({ path: path.join(SHOTS, "relations-flat.png") });

    await page.click('.rl-side button[data-id="em-suspicion"]');
    ok((await page.textContent(".rl-side h2")) === "Suspicion", "a tie in the side panel hops to that feeling");

    await page.click('.rl-side [data-act="archive"]');
    await page.waitForSelector(".rl-modal");
    const shown = await page.$$eval(".rl-move em", (els) => els.map((e) => e.textContent));
    ok(shown.length >= 10 && shown.every((t) => t.includes("Suspicion")), `the archive opens on that feeling's movements (${shown.length})`);
    await page.click('.rl-move[data-move="mv-darting-eyes"]');
    await page.click('.rl-move[data-move="mv-shallow-breath"]');
    await page.click('.rl-move[data-move="mv-constricted"]');
    ok(/3 picked/.test(await page.textContent(".rl-reads")) && /Suspicion/.test(await page.textContent(".rl-reads")), "three picked movements read as suspicion");
    await page.click('.rl-feelings [data-feel="em-suspicion"]');
    await page.click('[data-act="still"]');
    const still = await page.locator(".rl-move").count();
    const want = await page.evaluate(() => CurioArchive.movements.filter((m) => m.still).length);
    ok(still === want, `Stillness only shows every lack of movement and nothing else (${still} of ${want})`);
    await page.screenshot({ path: path.join(SHOTS, "relations-archive.png") });
    await page.click('[data-act="show"]');
    ok((await page.textContent(".rl-side h2")) === "3 picked", "Show on the map selects the picked movements");
    ok(await page.evaluate(() => JSON.parse(localStorage.getItem("curio-relations-v1")).picked.length === 3), "picks are kept on this device");

    await page.click('[data-view="cube"]');
    if (THREE_FILE) {
      await page.waitForSelector(".rl-cube canvas");
      await page.evaluate(() => document.getElementById("relations")._curioRelations.select("tr-suspicious-authority"));
      await page.waitForTimeout(300);
      const labels = await page.locator(".rl-labels div:not(.slab)").count();
      ok(labels >= 15, `the cube labels the selection and its ties (${labels})`);
      const spot = await page.evaluate(() => {
        const c = document.getElementById("relations")._curioRelations.view().inner();
        const p = c.pos.get("em-suspicion");
        const v = new THREE.Vector3(p[0], p[1], p[2]).project(c.camera);
        const r = c.host.getBoundingClientRect();
        return { x: r.left + ((v.x + 1) / 2) * r.width, y: r.top + ((1 - v.y) / 2) * r.height };
      });
      await page.mouse.dblclick(spot.x, spot.y);
      await page.waitForTimeout(1100);
      // Like a map: the curiosity is now in the middle, and each double-click on it goes further in.
      const mid = await page.evaluate(() => {
        const r = document.querySelector(".rl-cube canvas").getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      });
      for (let i = 0; i < 2; i++) {
        await page.mouse.dblclick(mid.x, mid.y);
        await page.waitForTimeout(1100);
      }
      const flown = await page.evaluate(() => {
        const c = document.getElementById("relations")._curioRelations.view().inner();
        return { r: c.orbit.r, sel: document.getElementById("relations")._curioRelations.selected() };
      });
      ok(flown.sel[0] === "em-suspicion" && flown.r < 20, `double-clicking a curiosity flies inside to it (r ${flown.r.toFixed(1)})`);
      await page.screenshot({ path: path.join(SHOTS, "relations-cube-inside.png") });
      const box = await page.locator(".rl-cube canvas").boundingBox();
      await page.mouse.move(box.x + 30, box.y + 30);
      await page.mouse.down();
      await page.mouse.move(box.x + 330, box.y + 60, { steps: 8 });
      await page.mouse.up();
      await page.click('[data-c="out"]');
      await page.waitForTimeout(1500);
      ok(await page.evaluate(() => document.getElementById("relations")._curioRelations.view().inner().orbit.r > 150), "Fly out goes back outside the cube");
      await page.screenshot({ path: path.join(SHOTS, "relations-cube.png") });
    } else ok(await page.locator(".rl-cube .rl-note").count(), "without three.js the cube says so");

    // Round two: layers, adding your own, ties, moving, flying in step by step, looking around.
    await page.click('[data-view="layers"]');
    await page.waitForSelector(".rl-layer.front");
    const before = await page.evaluate(() => document.getElementById("relations")._curioRelations.view().order());
    const st0 = await page.locator(".rl-stack").boundingBox();
    await page.mouse.move(st0.x + 100, st0.y + st0.height - 20);
    await page.mouse.down();
    await page.mouse.move(st0.x + 300, st0.y + st0.height - 20, { steps: 5 });
    await page.mouse.up();
    let after = await page.evaluate(() => document.getElementById("relations")._curioRelations.view().order());
    ok(after[after.length - 1] === before[0] && after[0] === before[1], "swiping right sends the front layer to the back");
    await page.keyboard.press("ArrowLeft");
    after = await page.evaluate(() => document.getElementById("relations")._curioRelations.view().order());
    ok(after[0] === before[0], "the left arrow brings the back layer to the front");
    await page.click('[data-by="workspace"]');
    const many = await page.locator(".rl-layer").count();
    ok(many > 30, `one layer per workspace (${many})`);
    await page.click('[data-by="family"]');
    await page.click('.rl-cell[data-id="tr-suspicious-authority"]');
    ok((await page.locator(".rl-layer.front .rl-svg line").count()) > 0 && (await page.locator(".rl-tabs b").count()) >= 3, "a picked cell draws lines on its layer and counts ties on the other layers");
    await page.screenshot({ path: path.join(SHOTS, "relations-layers.png") });

    await page.click('[data-act="add"]');
    await page.fill("#rl-new-name", "Distrust of doctors");
    await page.selectOption("#rl-new-family", "character");
    await page.click('.rl-form button[type="submit"]');
    ok((await page.textContent(".rl-side h2")) === "Distrust of doctors", "Add a curiosity puts a new one on the map");
    const mine = await page.evaluate(() => document.getElementById("relations")._curioRelations.graph.links("mine-distrust-of-doctors").map((l) => l.id));
    ok(mine.includes("tr-suspicious-authority"), "it is tied to what was selected");
    await page.click('.rl-side [data-act="tie"]');
    await page.fill(".rl-find input", "Shallow breathing");
    await page.click('.rl-hits button[data-id="mv-shallow-breath"]');
    const tied = await page.evaluate(() => document.getElementById("relations")._curioRelations.graph.links("mine-distrust-of-doctors").map((l) => l.id));
    ok(tied.includes("mv-shallow-breath"), "Tie to… then clicking another draws a new line");
    await page.click('.rl-side .rl-mine button[aria-label="Remove this tie"]');
    const left = await page.evaluate(() => document.getElementById("relations")._curioRelations.graph.links("mine-distrust-of-doctors").length);
    ok(left === 1, "× removes a tie you drew");

    await page.click('[data-view="cube"]');
    if (THREE_FILE) {
      await page.waitForSelector(".rl-cube canvas");
      await page.waitForTimeout(300);
      const view = () => page.evaluate(() => document.getElementById("relations")._curioRelations.view().inner());
      const box = await page.locator(".rl-cube canvas").boundingBox();
      const cx = box.x + box.width / 2;
      const cy = box.y + box.height / 2;
      await page.click('[data-c="out"]');
      await page.waitForTimeout(1100);
      const r = async () => page.evaluate(() => document.getElementById("relations")._curioRelations.view().inner().orbit.r);
      const r0 = await r();
      await page.mouse.dblclick(box.x + 20, box.y + 20);
      await page.waitForTimeout(1100);
      const r1 = await r();
      await page.mouse.dblclick(box.x + 20, box.y + 20);
      await page.waitForTimeout(1100);
      const r2 = await r();
      ok(r1 < r0 * 0.6 && r2 < r1 * 0.6, `each double-click flies further in (${r0.toFixed(0)}, ${r1.toFixed(0)}, ${r2.toFixed(0)})`);
      const eye0 = await page.evaluate(() => document.getElementById("relations")._curioRelations.view().inner().camera.position.toArray());
      await page.mouse.move(cx, cy);
      await page.mouse.down();
      await page.mouse.move(cx + 250, cy + 40, { steps: 6 });
      await page.mouse.up();
      await page.waitForTimeout(100);
      const eye1 = await page.evaluate(() => document.getElementById("relations")._curioRelations.view().inner().camera.position.toArray());
      ok(eye0.every((v, i) => Math.abs(v - eye1[i]) < 0.5), "inside, dragging looks around without moving where you stand");
      await page.click('[data-c="all"]');
      ok(await page.evaluate(() => JSON.parse(localStorage.getItem("curio-relations-v1")).showAll === true), "Show every proximity stays on");
      await page.click('[data-c="out"]');
      await page.waitForTimeout(1100);
      await page.screenshot({ path: path.join(SHOTS, "relations-cube-web.png") });
      // Move: drag the selected curiosity somewhere else.
      await page.click('[data-c="out"]');
      await page.evaluate(() => document.getElementById("relations")._curioRelations.select("em-suspicion"));
      await page.waitForTimeout(1100);
      const sp = await page.evaluate(() => {
        const c = document.getElementById("relations")._curioRelations.view().inner();
        const p = c.pos.get("em-suspicion");
        const v = new THREE.Vector3(p[0], p[1], p[2]).project(c.camera);
        const r = c.host.getBoundingClientRect();
        return { x: r.left + ((v.x + 1) / 2) * r.width, y: r.top + ((1 - v.y) / 2) * r.height };
      });
      await page.click('[data-c="move"]');
      await page.mouse.move(sp.x, sp.y);
      await page.mouse.down();
      await page.mouse.move(sp.x + 120, sp.y + 80, { steps: 6 });
      await page.mouse.up();
      const moved = await page.evaluate(() => JSON.parse(localStorage.getItem("curio-relations-v1")).moved["em-suspicion"]);
      ok(Array.isArray(moved), "Move curiosities: a dragged curiosity stays where it was put");
    }

    // Inside the app, from the Library.
    await page.goto(base + "index.html");
    await page.waitForFunction(() => document.querySelector("#lib-menu [data-relations]"), null, { timeout: 30000 });
    await page.evaluate(() => document.querySelector("#lib-menu [data-relations]").click());
    await page.waitForSelector(".rl-overlay .rl-side h2", { timeout: 30000 });
    const live = await page.evaluate(() => document.querySelector(".rl-overlay .rl")._curioRelations.graph.nodes.length);
    ok(live >= chips, `Library, Relationship map opens over the app with the live database (${live})`);
    await page.click(".rl-overlay .rl-close");
    ok(!(await page.locator(".rl-overlay").count()), "Close takes it away");
  } catch (e) {
    ok(false, "ran to the end: " + e.message);
  }
  ok(!errors.length, "no page errors" + (errors.length ? ": " + errors.slice(0, 3).join(" | ") : ""));
  await browser.close();
  server.close();
  console.log(fails ? fails + " failed" : "all relationship map browser checks passed");
  process.exit(fails ? 1 : 0);
})();
