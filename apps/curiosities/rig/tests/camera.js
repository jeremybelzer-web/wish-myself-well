/* The Camera add-on in a real browser: node apps/curiosities/rig/tests/camera.js [--three three.min.js] [--shots dir]
   (needs Playwright and Chromium; --three serves a local three.js r128 for the cdnjs address).

   Checks: the camera sliders are in the panel; with "Camera follows the curiosities" off the camera is the free
   orbit; on, a close shot makes the head much bigger on screen than a wide one, an insert frames a hand, a long
   lens narrows the view and stands further back, a low angle puts the camera below the head looking up, a high
   one above it, a tilted horizon rolls the camera, shake moves it; a camera lane on the timeline frames the shot
   by itself; the two lens-length sliders move together; Snapshot saves a PNG; the lamp's close shot frames its
   shade and the Fox's frames its head; turning the toggle off gives back the orbit; no page errors. */
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
const shot = async (page, name) => {
  if (!SHOTS) return;
  fs.mkdirSync(SHOTS, { recursive: true });
  const box = await page.locator(".rig-dlg .rig-main").boundingBox();
  await page.screenshot({ path: path.join(SHOTS, name + ".png"), clip: box || undefined });
};

(async () => {
  const server = await serve();
  const base = `http://127.0.0.1:${server.address().port}/`;
  const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--ignore-gpu-blocklist"] });
  const page = await browser.newPage({ viewport: { width: 1400, height: 950 }, serviceWorkers: "block", acceptDownloads: true });
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => (m.type() === "error" || (m.type() === "warning" && /3D add-on camera/.test(m.text()))) && !/Failed to load resource|three|cdnjs|fonts\.g|WebGL|GPU stall/.test(m.text()) && errors.push(m.text()));
  if (THREE_FILE) await page.route("**/cdnjs.cloudflare.com/**", (r) => r.fulfill({ path: THREE_FILE, contentType: "text/javascript" }));
  await page.route("**/fonts.g*/**", (r) => r.abort());
  try {
    await page.goto(base + "index.html?screen=0");
    /* the 3D files load on first use (rig/load.js): fetch them before using the add-ons */
    await page.waitForFunction(() => window.CurioRig && window.CurioRig.load, null, { timeout: 15000 });
    await page.evaluate(() => CurioRig.load());
    await page.waitForFunction(() => window.CurioRig && window.CurioRigCamera && document.querySelector("#lib-menu [data-rig3d]"), null, { timeout: 15000 });
    ok(await page.evaluate(() => CurioRig.extensions().some((x) => x.id === "camera")), "the Camera add-on is registered");
    await page.evaluate(() => {
      localStorage.removeItem("curiosities-rig3d-v1");
      document.querySelector("#lib-menu [data-rig3d]").click();
    });
    await page.waitForSelector(".rig-dlg[open] canvas");
    await page.evaluate(() => CurioRig.current().ready);
    const err = await page.evaluate(() => CurioRig.current().error());
    if (!THREE_FILE && err) {
      ok(/three\.js/.test(err), "without three.js the window says it is needed (" + err + ")");
    } else {
      ok(!err, "the free figure loads" + (err ? ": " + err : ""));
      const rows = await page.evaluate(() => ["shotSize", "angleHeight", "lensLength", "dutch", "cameraLensLens.length", "cameraLensLens.shake", "cameraLensLens.vignette"].filter((id) => document.querySelector(`.rig-dlg [data-row="${id}"]`)));
      ok(rows.length === 7, `the camera sliders are in the panel (${rows.join(", ")})`);
      ok(await page.evaluate(() => !!document.querySelector('.rig-dlg [data-ext="camera"] [data-cam="follow"]') && !!document.querySelector('.rig-dlg [data-ext="camera"] [data-cam="snap"]')), "the panel has the toggle and Snapshot");

      /* helpers in the page */
      await page.evaluate(() => {
        window.__cam = {
          wait: (ms) => new Promise((r) => setTimeout(r, ms)),
          /* the head's size on screen, in pixels: the distance between two points 0.15 apart around the head */
          headSize(bone) {
            const c = CurioRig.current().ctx;
            const T = c.THREE;
            const b = bone || c.rig.head;
            const p = b.getWorldPosition(new T.Vector3());
            const a = p.clone().project(c.camera);
            const q = p.clone().add(new T.Vector3(0, 0.15, 0)).project(c.camera);
            const cv = c.renderer.domElement;
            return { px: Math.hypot((a.x - q.x) * cv.clientWidth, (a.y - q.y) * cv.clientHeight) / 2, x: a.x, y: a.y, z: a.z };
          },
          cam() {
            const c = CurioRig.current().ctx;
            const T = c.THREE;
            const dir = c.camera.getWorldDirection(new T.Vector3());
            const right = new T.Vector3(1, 0, 0).applyQuaternion(c.camera.quaternion);
            return { pos: c.camera.position.toArray(), dir: dir.toArray(), rightY: right.y, fov: c.camera.fov, head: c.rig.head.getWorldPosition(new T.Vector3()).toArray() };
          },
          set(vals) {
            const c = CurioRig.current();
            Object.keys(vals).forEach((k) => c.set(k, vals[k]));
          },
        };
      });
      await page.evaluate(() => __cam.set({ "rigRulesLens.floppy": "stiff", "rigRulesLens.breath": "held" }));

      /* off: the free orbit, as before */
      await page.waitForTimeout(250);
      const off0 = await page.evaluate(() => ({ cam: __cam.cam(), info: CurioRigCamera.info(), tick: document.querySelector('.rig-dlg [data-cam="follow"]').checked }));
      const r0 = Math.hypot(off0.cam.pos[0], off0.cam.pos[2]);
      ok(!off0.tick && off0.info && off0.info.follow === false && Math.abs(off0.cam.fov - 35) < 0.01, `off at first: the free view (fov ${off0.cam.fov.toFixed(1)})`);

      /* on: the shot sizes */
      await page.click('.rig-dlg [data-cam="follow"]');
      const sizeAt = async (word) => {
        await page.evaluate((w) => __cam.set({ shotSize: w }), word);
        await page.waitForTimeout(700);
        return page.evaluate(() => __cam.headSize());
      };
      const wide = await sizeAt("wide");
      const medium = await sizeAt("medium");
      const close = await sizeAt("close");
      ok(close.px > wide.px * 2.5 && medium.px > wide.px * 1.3 && close.px > medium.px, `close makes the head much bigger on screen than wide (${wide.px.toFixed(0)}, ${medium.px.toFixed(0)}, ${close.px.toFixed(0)} px for wide, medium, close)`);
      ok(Math.abs(close.x) < 0.6 && Math.abs(close.y) < 0.8 && close.z < 1, `the close shot keeps the head in the frame (${close.x.toFixed(2)}, ${close.y.toFixed(2)})`);
      const nowText = await page.evaluate(() => document.querySelector('.rig-dlg [data-cam="now"]').textContent);
      ok(/close shot/.test(nowText), `the panel says what the frame is doing ("${nowText}")`);
      await page.evaluate(() => __cam.set({ shotSize: "insert" }));
      await page.waitForTimeout(700);
      const hand = await page.evaluate(() => {
        const r = CurioRig.current().rig();
        const arm = r.arms.R.length ? r.arms.R : r.arms.L;
        return __cam.headSize(arm[arm.length - 1]);
      });
      ok(Math.abs(hand.x) < 0.35 && Math.abs(hand.y) < 0.35 && hand.px > close.px * 0.8, `an insert frames a hand (at ${hand.x.toFixed(2)}, ${hand.y.toFixed(2)}; ${hand.px.toFixed(0)} px for 0.15)`);

      /* the lens */
      const lensAt = async (word) => {
        await page.evaluate((w) => __cam.set({ "cameraLensLens.length": w, lensLength: w }), word);
        await page.waitForTimeout(700);
        return page.evaluate(() => Object.assign(CurioRigCamera.info(), { head: __cam.headSize().px }));
      };
      await page.evaluate(() => __cam.set({ shotSize: "medium" }));
      const lw = await lensAt("wide");
      const ll = await lensAt("long");
      ok(ll.fov < lw.fov * 0.5 && ll.dist > lw.dist * 2, `a long lens narrows the view and stands further back (fov ${lw.fov.toFixed(0)}° to ${ll.fov.toFixed(0)}°, ${lw.dist.toFixed(1)} to ${ll.dist.toFixed(1)} away)`);
      ok(Math.abs(ll.head - lw.head) / lw.head < 0.35, `and the head stays about the same size in a medium shot (${lw.head.toFixed(0)} and ${ll.head.toFixed(0)} px)`);
      await lensAt("normal");

      /* the two lens-length sliders move together */
      const paired = await page.evaluate(() => {
        const a = document.querySelector('.rig-dlg [data-slider="lensLength"]');
        a.value = "0";
        a.dispatchEvent(new Event("input", { bubbles: true }));
        const b = document.querySelector('.rig-dlg [data-slider="cameraLensLens.length"]');
        const out = { b: b.value, word: b.closest(".rig-row").querySelector("[data-word]").textContent, val: CurioRig.current().ctx.val("cameraLensLens.length") };
        CurioRig.current().set("lensLength", "normal");
        CurioRig.current().set("cameraLensLens.length", "normal");
        return out;
      });
      ok(paired.val === 0 && paired.word === "wide", `moving Lens length moves the lens's Wide or long too (${paired.word})`);

      /* height of the camera */
      await page.evaluate(() => __cam.set({ shotSize: "close", angleHeight: "low" }));
      await page.waitForTimeout(700);
      const low = await page.evaluate(() => __cam.cam());
      ok(low.pos[1] < low.head[1] - 0.05 && low.dir[1] > 0.1, `a low angle puts the camera below the head looking up (camera at ${low.pos[1].toFixed(2)}, head at ${low.head[1].toFixed(2)}, looking ${low.dir[1] > 0 ? "up" : "down"})`);
      await page.evaluate(() => __cam.set({ angleHeight: "high" }));
      await page.waitForTimeout(700);
      const high = await page.evaluate(() => __cam.cam());
      ok(high.pos[1] > high.head[1] + 0.05 && high.dir[1] < -0.1, `a high angle puts it above, looking down (camera at ${high.pos[1].toFixed(2)})`);
      await page.evaluate(() => __cam.set({ angleHeight: "eye" }));
      await page.waitForTimeout(700);
      const eye = await page.evaluate(() => __cam.cam());
      ok(Math.abs(eye.pos[1] - eye.head[1]) < 0.15, `eye height puts it level with the head (camera at ${eye.pos[1].toFixed(2)}, head at ${eye.head[1].toFixed(2)})`);
      ok(Math.abs(eye.rightY) < 0.01, `the horizon is level (${eye.rightY.toFixed(3)})`);

      /* the horizon tilts */
      await page.evaluate(() => __cam.set({ dutch: "tilted", angleHeight: "low" }));
      await page.waitForTimeout(700);
      const tilt = await page.evaluate(() => __cam.cam());
      ok(Math.abs(tilt.rightY) > 0.2, `tilted rolls the camera (its side leans ${((Math.asin(Math.abs(tilt.rightY)) * 180) / Math.PI).toFixed(0)}°)`);
      await shot(page, "camera-close-low-tilted");
      await page.evaluate(() => __cam.set({ dutch: "level", angleHeight: "eye" }));

      /* shake */
      await page.evaluate(() => __cam.set({ "cameraLensLens.shake": "strong" }));
      const shaken = await page.evaluate(async () => {
        const seen = [];
        for (let i = 0; i < 6; i++) {
          await __cam.wait(90);
          seen.push(__cam.cam().dir);
        }
        let most = 0;
        seen.forEach((a) => seen.forEach((b) => (most = Math.max(most, Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])))));
        return most;
      });
      ok(shaken > 0.01, `Shake moves the camera (${shaken.toFixed(3)})`);
      await page.evaluate(() => __cam.set({ "cameraLensLens.shake": "none" }));

      /* dark corners */
      await page.evaluate(() => __cam.set({ "cameraLensLens.vignette": "heavy", shotSize: "medium" }));
      await page.waitForTimeout(300);
      ok(await page.evaluate(() => /radial-gradient/.test(document.querySelector(".rig-dlg [data-cam-vignette]").style.backgroundImage)), "Dark corners darkens the corners of the view");

      /* Snapshot */
      const [dl] = await Promise.all([page.waitForEvent("download"), page.click('.rig-dlg [data-cam="snap"]')]);
      const file = await dl.path();
      const head = file ? fs.readFileSync(file).slice(0, 8) : Buffer.alloc(0);
      ok(/\.png$/.test(dl.suggestedFilename()) && head.toString("hex") === "89504e470d0a1a0a" && fs.statSync(file).size > 5000, `Snapshot saves a PNG of the frame (${dl.suggestedFilename()}, ${file ? fs.statSync(file).size : 0} bytes)`);
      await page.evaluate(() => __cam.set({ "cameraLensLens.vignette": "none" }));

      /* off again: the orbit comes back */
      await page.click('.rig-dlg [data-cam="follow"]');
      await page.waitForTimeout(250);
      const off1 = await page.evaluate(() => ({ cam: __cam.cam(), info: CurioRigCamera.info() }));
      ok(off1.info.follow === false && Math.abs(off1.cam.fov - 35) < 0.01 && Math.abs(Math.hypot(off1.cam.pos[0], off1.cam.pos[2]) - r0) < 0.01 && Math.abs(off1.cam.rightY) < 0.01, `turning it off gives back the orbit (fov ${off1.cam.fov.toFixed(1)}, ${Math.hypot(off1.cam.pos[0], off1.cam.pos[2]).toFixed(2)} away)`);

      /* a camera lane on the timeline frames the shot by itself */
      const lane = await page.evaluate(async () => {
        const c = CurioRig.current();
        const keep = { E: window.CurioEngine, S: window.CurioScreen };
        delete c.ctx.prefs.camera;
        const st = { rows: [{ id: "r1" }], tracks: [{ id: "t1", curiosities: ["shotSize", "angleHeight"] }], lanes: { "t1|shotSize": { on: true }, "t1|angleHeight": { on: true } } };
        window.CurioEngine = Object.assign({}, keep.E, { state: () => st, value: (r, t, cur) => ({ shotSize: "close", angleHeight: "high" })[cur] });
        window.CurioScreen = Object.assign({}, keep.S, { isOpen: () => true, row: () => 0 });
        await __cam.wait(800);
        const out = { tl: c.timeline(), info: CurioRigCamera.info(), tick: document.querySelector('.rig-dlg [data-cam="follow"]').checked, note: !document.querySelector('.rig-dlg [data-row="shotSize"] [data-auto-note]').hidden, word: document.querySelector('.rig-dlg [data-row="shotSize"] [data-word]').textContent, cam: __cam.cam(), size: __cam.headSize().px };
        window.CurioEngine = keep.E;
        window.CurioScreen = keep.S;
        await __cam.wait(300);
        out.after = CurioRigCamera.info().follow;
        return out;
      });
      ok(lane.info.follow && lane.tick && lane.note && lane.word === "close", `a Shot size lane on the timeline turns following on and frames a close shot (${lane.word}, from the timeline: ${lane.note})`);
      ok(lane.size > wide.px * 2 && lane.cam.pos[1] > lane.cam.head[1], `the lane's close, high shot is close and above the head (${lane.size.toFixed(0)} px)`);
      ok(lane.after === false, "without the lane it goes back to the free view");

      /* objects and animals */
      await page.click('.rig-dlg [data-cam="follow"]');
      await page.selectOption('.rig-dlg [data-rig="character"]', "desk-lamp");
      await page.evaluate(() => CurioRig.current().ready);
      await page.evaluate(() => __cam.set({ shotSize: "wide", "rigRulesLens.motion": "standing still" }));
      await page.waitForTimeout(700);
      const lampWide = await page.evaluate(() => __cam.headSize());
      await page.evaluate(() => __cam.set({ shotSize: "close" }));
      await page.waitForTimeout(700);
      const lampClose = await page.evaluate(() => __cam.headSize());
      ok(lampClose.px > lampWide.px * 2 && Math.abs(lampClose.x) < 0.5 && Math.abs(lampClose.y) < 0.6, `the lamp's close shot frames its shade (${lampWide.px.toFixed(0)} to ${lampClose.px.toFixed(0)} px, at ${lampClose.x.toFixed(2)}, ${lampClose.y.toFixed(2)})`);
      await page.evaluate(() => __cam.set({ shotSize: "insert", angleHeight: "high" }));
      await page.waitForTimeout(700);
      await shot(page, "camera-lamp-insert-high");

      await page.selectOption('.rig-dlg [data-rig="character"]', "fox");
      await page.evaluate(() => CurioRig.current().ready);
      await page.evaluate(() => __cam.set({ shotSize: "wide", angleHeight: "eye" }));
      await page.waitForTimeout(700);
      const foxWide = await page.evaluate(() => __cam.headSize());
      await shot(page, "camera-fox-wide");
      await page.evaluate(() => __cam.set({ shotSize: "close" }));
      await page.waitForTimeout(700);
      const foxClose = await page.evaluate(() => __cam.headSize());
      ok(foxClose.px > foxWide.px * 2 && Math.abs(foxClose.x) < 0.6 && Math.abs(foxClose.y) < 0.8, `the Fox's close shot frames its head (${foxWide.px.toFixed(0)} to ${foxClose.px.toFixed(0)} px)`);
      await page.evaluate(() => {
        __cam.set({ shotSize: "medium" });
        const t = document.querySelector('.rig-dlg [data-cam="follow"]');
        if (t.checked) t.click();
      });
      await page.evaluate(() => document.querySelector(".rig-dlg").close());
    }
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
