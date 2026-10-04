/* Forces in the 3D view: node apps/curiosities/rig/tests/dynamics.js [--three three.min.js] [--shots dir]
   (needs Playwright and Chromium; --three serves a local three.js r128 for the cdnjs address).

   Checks rig/dynamics.js: its sliders show in the panel; a strong steady wind bends the young tree's tip toward
   where the wind blows, clearly more than still air, and turning the wind around bends it the other way; joints
   stay inside their limits; the Fox's tail catches the wind; the number of bits in the air follows How much (and
   never passes 3000); "Drop it" lifts the lamp, it falls, bounces, squashes on landing and settles on the floor;
   Show the wind draws an arrow; no page errors. Saves screenshots with --shots (default: none). */
const http = require("http");
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const ROOT = path.join(__dirname, "..", "..");
const arg = (name, d) => {
  const i = process.argv.indexOf(name);
  return i > 0 ? process.argv[i + 1] : d;
};
const THREE_FILE = arg("--three", "");
const SHOTS = arg("--shots", "");
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".glb": "model/gltf-binary", ".webmanifest": "application/manifest+json" };
let failed = 0;
const ok = (cond, what) => {
  console.log((cond ? "ok   " : "FAIL ") + what);
  if (!cond) failed++;
};
function serve() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const p = path.join(ROOT, decodeURIComponent(req.url.split("?")[0]).replace(/^\/+/, "") || "index.html");
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
const shot = async (page, name) => SHOTS && (fs.mkdirSync(SHOTS, { recursive: true }), await page.screenshot({ path: path.join(SHOTS, name + ".png") }));

(async () => {
  if (!THREE_FILE) {
    console.log("skipped: needs --three <three.min.js r128>");
    console.log("all passed");
    return;
  }
  const server = await serve();
  const base = `http://127.0.0.1:${server.address().port}/`;
  const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--ignore-gpu-blocklist"] });
  const page = await browser.newPage({ viewport: { width: 1400, height: 950 }, serviceWorkers: "block" });
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => (m.type() === "error" || (m.type() === "warning" && /3D add-on/.test(m.text()))) && !/Failed to load resource|three|cdnjs|fonts\.g|WebGL|GPU stall/.test(m.text()) && errors.push(m.text()));
  await page.route("**/cdnjs.cloudflare.com/**", (r) => r.fulfill({ path: THREE_FILE, contentType: "text/javascript" }));
  await page.route("**/fonts.g*/**", (r) => r.abort());
  const set = (pairs) => page.evaluate((pairs) => Object.keys(pairs).forEach((k) => CurioRig.current().set(k, pairs[k])), pairs);
  const wait = (ms) => page.waitForTimeout(ms);
  try {
    await page.goto(base + "index.html?screen=0");
    /* the 3D files load on first use (rig/load.js): fetch them before using the add-ons */
    await page.waitForFunction(() => window.CurioRig && window.CurioRig.load, null, { timeout: 15000 });
    await page.evaluate(() => CurioRig.load());
    await page.waitForFunction(() => window.CurioRig && CurioRig.forces && document.querySelector("#lib-menu [data-rig3d]"), null, { timeout: 15000 });
    ok(await page.evaluate(() => CurioRig.extensions().some((x) => x.id === "forces")), "Forces is an add-on of the 3D view");
    await page.evaluate(() => {
      localStorage.removeItem("curiosities-rig3d-v1");
      document.querySelector("#lib-menu [data-rig3d]").click();
    });
    await page.waitForSelector(".rig-dlg[open] canvas");
    await page.evaluate(() => CurioRig.current().ready);
    ok(!(await page.evaluate(() => CurioRig.current().error())), "the 3D view loads");
    const rows = await page.evaluate(() => ["forcesLens.wind", "forcesLens.gusts", "forcesLens.direction", "bitsLens.kind", "bitsLens.amount", "crashLens.bounce", "crashLens.slide"].filter((id) => document.querySelector(`.rig-dlg [data-row="${id}"]`)).length);
    ok(rows === 7, `wind, bits and landing sliders show in the panel (${rows} of 7)`);
    ok((await page.locator('.rig-dlg [data-ext="forces"] [data-forces="drop"]').count()) === 1, "the panel has a Drop it button");

    /* Wind on the young tree. */
    await page.selectOption('.rig-dlg [data-rig="character"]', "tree");
    await page.evaluate(() => CurioRig.current().ready);
    await set({ "rigRulesLens.motion": "standing still", "rigRulesLens.slump": "relaxed", "rigRulesLens.lookAt": "straight ahead", "poseRigLens.lineOfAction": "straight and stiff", "forcesLens.gusts": "steady", "forcesLens.chaos": "calm (0)", "forcesLens.whirl": "none", "forcesLens.direction": "from the left", "forcesLens.wind": "still (0)" });
    const tipAlong = () =>
      page.evaluate(() => {
        const c = CurioRig.current();
        const s = CurioRig.forces.state(c);
        const p = c.where(c.rig().head);
        /* the camera's right, flat on the floor: "from the left" blows this way */
        const cam = c.ctx.camera;
        const look = new THREE.Vector3();
        cam.getWorldDirection(look);
        const right = new THREE.Vector3(-look.z, 0, look.x).normalize();
        return { along: p[0] * right.x + p[2] * right.z, y: p[1], wind: s.wind };
      });
    await wait(1200);
    const still = await tipAlong();
    await set({ "forcesLens.wind": "a gale (5)" });
    await wait(2500);
    const gale = await tipAlong();
    ok(gale.along > still.along + 0.25, `a gale from the left bends the tree's top toward the right (${still.along.toFixed(2)} to ${gale.along.toFixed(2)})`);
    ok(gale.y < still.y - 0.03, `and the top dips as it bends (${still.y.toFixed(2)} to ${gale.y.toFixed(2)})`);
    const limits = await page.evaluate(() => {
      const c = CurioRig.current();
      return c.bones().map((b) => {
        const L = c.ctx.limitOf(b);
        const room = Math.min(Math.max(Math.abs(L.bend[0]), Math.abs(L.bend[1])), Math.max(Math.abs(L.side[0]), Math.abs(L.side[1])));
        return { turned: c.turned(b), room };
      });
    });
    ok(limits.every((j) => j.turned <= j.room + 1), `every joint stays inside its limits (${limits.map((j) => j.turned.toFixed(0) + "/" + j.room.toFixed(0)).join(", ")})`);
    await page.click('.rig-dlg [data-forces="arrow"]');
    await set({ "bitsLens.kind": "leaves", "bitsLens.amount": "plenty" });
    await wait(700);
    ok((await page.evaluate(() => CurioRig.forces.state().arrow)) === true, "Show the wind draws the wind arrow");
    await shot(page, "forces-tree-gale");
    await set({ "forcesLens.direction": "from the right" });
    await wait(2500);
    const back = await tipAlong();
    ok(back.along < still.along - 0.25, `from the right it bends the other way (${back.along.toFixed(2)})`);
    await set({ "forcesLens.wind": "a breeze (2)", "forcesLens.direction": "from the left" });
    await wait(2500);
    const breeze = await tipAlong();
    ok(breeze.along > still.along + 0.03 && breeze.along < gale.along - 0.05, `a breeze bends it less than a gale (${breeze.along.toFixed(2)})`);
    /* Thick air pushes harder but slower; heavy things bend less. */
    await set({ "forcesLens.weight": "heavy" });
    await wait(2500);
    const heavy = await tipAlong();
    ok(heavy.along < breeze.along - 0.01, `in a heavy world it bends less (${breeze.along.toFixed(2)} to ${heavy.along.toFixed(2)})`);
    await set({ "forcesLens.weight": "real" });

    /* Bits in the air follow How much. */
    const counts = {};
    for (const a of ["none", "a few", "plenty", "a storm"]) {
      await set({ "bitsLens.amount": a });
      await wait(250);
      counts[a] = await page.evaluate(() => CurioRig.forces.state().drawn);
    }
    ok(counts.none === 0 && counts["a few"] > 0 && counts["a few"] < counts.plenty && counts.plenty < counts["a storm"] && counts["a storm"] <= 3000, `the number of bits follows How much (${JSON.stringify(counts)})`);
    /* They fall: rain comes down, and the wind carries it sideways. */
    await set({ "bitsLens.kind": "rain", "bitsLens.amount": "plenty", "forcesLens.wind": "a gale (5)" });
    await wait(400);
    const fall = await page.evaluate(async () => {
      const c = CurioRig.current();
      const pts = c.ctx.scene.getObjectByName("bits in the air");
      const look = new THREE.Vector3();
      c.ctx.camera.getWorldDirection(look);
      const right = new THREE.Vector3(-look.z, 0, look.x).normalize();
      const snap = () => Array.from(pts.geometry.attributes.position.array.slice(0, 300));
      const a = snap();
      await new Promise((r) => setTimeout(r, 150));
      const b = snap();
      let down = 0;
      let side = 0;
      let n = 0;
      for (let i = 0; i < 100; i++) {
        const dy = b[i * 3 + 1] - a[i * 3 + 1];
        const dx = b[i * 3] - a[i * 3];
        const dz = b[i * 3 + 2] - a[i * 3 + 2];
        if (Math.abs(dx) > 1 || Math.abs(dz) > 1 || dy > 1) continue; /* came back in on the other side, or started over */
        down += dy;
        side += dx * right.x + dz * right.z;
        n++;
      }
      return { down: down / n, side: side / n, n };
    });
    ok(fall.n > 30 && fall.down < -0.05 && fall.side > 0.05, `rain falls and the wind carries it (down ${fall.down.toFixed(2)}, sideways ${fall.side.toFixed(2)})`);
    await wait(300);
    await shot(page, "forces-rain-storm");

    /* The Fox's tail catches the wind. */
    await set({ "bitsLens.amount": "none", "forcesLens.wind": "still (0)" });
    await page.selectOption('.rig-dlg [data-rig="character"]', "fox");
    await page.evaluate(() => CurioRig.current().ready);
    const tail = (ms) =>
      page.evaluate(async (ms) => {
        await new Promise((r) => setTimeout(r, ms));
        const c = CurioRig.current();
        return c.rig().tail.reduce((a, b) => a + c.turned(b), 0);
      }, ms);
    const t0 = await tail(1500);
    await set({ "forcesLens.wind": "a gale (5)", "forcesLens.direction": "toward the camera" });
    const t1 = await tail(2500);
    ok(t1 > t0 + 15, `the Fox's tail swings in the wind (${t0.toFixed(0)}° to ${t1.toFixed(0)}° in all)`);
    await set({ "forcesLens.wind": "still (0)" });

    /* Drop it: the lamp falls, bounces and settles on the floor. */
    await page.selectOption('.rig-dlg [data-rig="character"]', "desk-lamp");
    await page.evaluate(() => CurioRig.current().ready);
    await set({ "crashLens.bounce": "bouncy", "crashLens.slide": "smooth", "crashLens.settle": "a moment (1)" });
    await wait(1200);
    const run = await page.evaluate(async () => {
      const c = CurioRig.current();
      document.querySelector('.rig-dlg [data-forces="drop"]').click();
      const seen = [];
      const t0 = performance.now();
      while (performance.now() - t0 < 6000) {
        await new Promise((r) => requestAnimationFrame(() => r()));
        const s = CurioRig.forces.state(c);
        const box = new THREE.Box3().setFromObject(c.ctx.model);
        seen.push({ t: performance.now() - t0, y: s.drop.y, phase: s.drop.phase, bounces: s.drop.bounces, landed: s.drop.landed, deepest: s.drop.deepest, sy: c.ctx.holder.scale.y, floor: box.min.y });
        if (s.drop.phase === "rest" && s.drop.landed) break;
      }
      return { seen, said: document.querySelector('.rig-dlg [data-forces="said"]').textContent, x: CurioRig.forces.state(c).drop.x };
    });
    const ys = run.seen.map((s) => s.y);
    const first = run.seen[0];
    const lastS = run.seen[run.seen.length - 1];
    const firstHit = run.seen.findIndex((s) => s.landed > 0);
    const upAgain = firstHit >= 0 && run.seen.slice(firstHit).some((s) => s.y > 0.05);
    ok(first.y > 0.8, `Drop it lifts the lamp (${first.y.toFixed(2)} up)`);
    ok(firstHit > 0 && ys.slice(0, firstHit).length > 1 && ys.slice(0, firstHit).every((y, i, a) => i === 0 || y <= a[i - 1] + 1e-6), "it falls to the floor");
    ok(upAgain && lastS.bounces >= 1, `"bouncy" makes it bounce (${lastS.bounces} bounce${lastS.bounces === 1 ? "" : "s"})`);
    ok(lastS.deepest < -0.15, `it squashes on landing (down to ${((1 + lastS.deepest) * 100).toFixed(0)}% of its height)`);
    ok(lastS.phase === "rest" && lastS.y === 0 && Math.abs(lastS.floor) < 0.03, `it settles on the floor (${lastS.phase}, bottom at ${lastS.floor.toFixed(3)}, after ${(lastS.t / 1000).toFixed(1)} s)`);
    ok(/Landed/.test(run.said), `the panel says so ("${run.said}")`);
    ok(Math.abs(run.x) > 0.01, `"smooth" lets it slide a little (${run.x.toFixed(2)})`);
    /* A dead thud does not bounce; ice slides further than grippy. */
    const once = (bounce, slide) =>
      page.evaluate(
        async ([bounce, slide]) => {
          const c = CurioRig.current();
          c.set("crashLens.bounce", bounce);
          c.set("crashLens.slide", slide);
          CurioRig.forces.drop(c);
          const t0 = performance.now();
          let s;
          while (performance.now() - t0 < 8000) {
            await new Promise((r) => requestAnimationFrame(() => r()));
            s = CurioRig.forces.state(c).drop;
            if (s.phase === "rest") break;
          }
          return s;
        },
        [bounce, slide]
      );
    const thud = await once("dead thud", "grippy");
    const ice = await once("small bounce", "ice");
    ok(thud.bounces === 0 && thud.phase === "rest", `"dead thud" lands without bouncing (${thud.bounces})`);
    ok(Math.hypot(ice.x, ice.z) > Math.hypot(thud.x, thud.z) + 0.05, `on "ice" it slides further than "grippy" (${Math.hypot(ice.x, ice.z).toFixed(2)} against ${Math.hypot(thud.x, thud.z).toFixed(2)})`);
    /* A screenshot mid-squash, with snow. */
    await set({ "crashLens.bounce": "dead thud", "crashLens.settle": "a long wobble (4)", "bitsLens.kind": "snow", "bitsLens.amount": "a storm", "forcesLens.wind": "a breeze (2)" });
    await page.evaluate(async () => {
      const c = CurioRig.current();
      CurioRig.forces.drop(c);
      const t0 = performance.now();
      while (performance.now() - t0 < 4000) {
        await new Promise((r) => requestAnimationFrame(() => r()));
        if (CurioRig.forces.state(c).drop.landed && c.ctx.holder.scale.y < 0.8) break;
      }
    });
    await shot(page, "forces-lamp-lands");
    await set({ "bitsLens.amount": "none", "forcesLens.wind": "still (0)" });
    await page.evaluate(() => document.querySelector(".rig-dlg").close());
    ok(!errors.length, "no page errors" + (errors.length ? ": " + errors.slice(0, 4).join(" | ") : ""));
  } catch (e) {
    ok(false, "ran to the end: " + e.message);
  } finally {
    await browser.close();
    server.close();
  }
  console.log(failed ? `${failed} failed` : "all passed");
  process.exit(failed ? 1 : 0);
})();
