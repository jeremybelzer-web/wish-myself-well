/* Feet and hands (rig/ik.js) in a real browser: node apps/curiosities/rig/tests/ik.js [--three three.min.js] [--shots dir]
   (needs Playwright and Chromium; --three serves a local three.js r128 for the cdnjs address).

   Checks: the two sliders (Feet on the ground, What the hands hold) and the panel are there; with Spine
   collapsed and Balance falling, planted feet stay where they stood while sliding feet move with the body, and
   the knees still bend forward inside their limits; lifted raises one foot, in the air raises both and the body;
   while walking the feet are left to the walk; hands reach a table, a handshake and hold a cup that follows the
   hand; the markers show; the Fox plants four feet; an object is left alone; no page errors.
   Without three.js it only checks that the add-on registered. */
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
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const f2 = (x) => x.toFixed(3);

(async () => {
  const server = await serve();
  const base = `http://127.0.0.1:${server.address().port}/`;
  const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--ignore-gpu-blocklist"] });
  const page = await browser.newPage({ viewport: { width: 1400, height: 950 }, serviceWorkers: "block" });
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => (m.type() === "error" || /3D add-on/.test(m.text())) && !/Failed to load resource|three|cdnjs|fonts\.g|WebGL|GPU stall/.test(m.text()) && errors.push(m.text()));
  if (THREE_FILE) await page.route("**/cdnjs.cloudflare.com/**", (r) => r.fulfill({ path: THREE_FILE, contentType: "text/javascript" }));
  await page.route("**/fonts.g*/**", (r) => r.abort());
  /* set sliders, wait a few frames, then read joints */
  const set = (values, wait) =>
    page.evaluate(
      async ([values, wait]) => {
        const c = CurioRig.current();
        Object.keys(values).forEach((k) => c.set(k, values[k]));
        await new Promise((r) => setTimeout(r, wait || 350));
      },
      [values, wait]
    );
  const read = () =>
    page.evaluate(() => {
      const c = CurioRig.current();
      const r = c.rig();
      const w = (b) => (b ? c.where(b) : null);
      return {
        ankles: [r.legs.L[2], r.legs.R[2]].map(w),
        hipsJ: [r.legs.L[0], r.legs.R[0]].map(w),
        knees: [r.legs.L[1], r.legs.R[1]].map(w),
        kneeTurn: [r.legs.L[1], r.legs.R[1]].map((b) => (b ? c.turned(b) : 0)),
        paws: r.quadruped ? [r.arms.L[2], r.arms.R[2]].map(w) : [],
        wrists: [r.arms.L[2], r.arms.R[2]].map(w),
        shoulders: [r.arms.L[0], r.arms.R[0]].map(w),
        hips: w(r.hips),
        aims: CurioRigIK.aims(c.ctx),
        cup: CurioRigIK.cup(c.ctx),
        table: CurioRigIK.table(c.ctx),
        markers: (() => {
          let n = 0;
          c.ctx.scene.traverse((o) => o.name === "feet and hands" && o.children.forEach((m) => m.isMesh && m.visible && m.geometry.type === "SphereGeometry" && n++));
          return n;
        })(),
        now: (document.querySelector('.rig-dlg [data-ext="ik"] [data-ik="now"]') || {}).textContent || "",
      };
    });
  try {
    await page.goto(base + "index.html?screen=0");
    await page.waitForFunction(() => window.CurioRig && document.querySelector("#lib-menu [data-rig3d]"), null, { timeout: 15000 });
    /* the 3D files load on first use (rig/load.js): fetch them before using the add-ons */
    await page.evaluate(() => CurioRig.load());
    ok(await page.evaluate(() => CurioRig.extensions().some((x) => x.id === "ik") && !!window.CurioRigIK), "Feet and hands is added to the 3D view");
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
      const ui = await page.evaluate(() => ({
        feet: !!document.querySelector('.rig-dlg [data-slider="poseRigLens.feet"]'),
        hands: !!document.querySelector('.rig-dlg [data-slider="poseRigLens.hands"]'),
        feetWord: document.querySelector('.rig-dlg [data-row="poseRigLens.feet"] [data-word]').textContent,
        panel: !!document.querySelector('.rig-dlg [data-ext="ik"] [data-ik="show"]'),
        title: (document.querySelector('.rig-dlg [data-ext="ik"] h4') || {}).title || "",
      }));
      ok(ui.feet && ui.hands && ui.feetWord === "sliding", `the two sliders are in the panel (feet start at "${ui.feetWord}")`);
      ok(ui.panel && /In Maya: IK/.test(ui.title), "the panel has the markers switch and Maya's name in a tooltip");

      /* --- feet --- */
      const calm = { "rigRulesLens.motion": "standing still", "rigRulesLens.floppy": "stiff", "rigRulesLens.lookAt": "straight ahead", "rigRulesLens.breath": "held", "rigRulesLens.slump": "relaxed", "poseRigLens.balance": "planted", "poseRigLens.feet": "sliding", "poseRigLens.hands": "empty" };
      const fall = { "rigRulesLens.slump": "collapsed", "poseRigLens.balance": "falling", "poseRigLens.twist": "strong twist" };
      const still = { "rigRulesLens.slump": "relaxed", "poseRigLens.balance": "planted", "poseRigLens.twist": "square to the camera" };
      await set(calm);
      const stand = await read();
      await set(fall);
      const slid = await read();
      const slideMove = Math.max(...[0, 1].map((i) => dist(stand.ankles[i], slid.ankles[i])));
      await set(Object.assign({ "poseRigLens.feet": "planted" }, still));
      const stand2 = await read();
      await set(fall);
      const planted = await read();
      const plantMove = Math.max(...[0, 1].map((i) => dist(stand2.ankles[i], planted.ankles[i])));
      const toAim = Math.max(...[0, 1].map((i) => dist(planted.aims.feet[i], planted.ankles[i])));
      ok(slideMove > 0.08, `sliding feet move with a collapsing, falling, twisting body (${f2(slideMove)} m)`);
      ok(plantMove < 0.04 && toAim < 0.03, `planted feet stay where they stood (${f2(plantMove)} m from the stance, ${f2(toAim)} m from their aim)`);
      ok(plantMove < slideMove / 3, "planted feet move far less than sliding ones");
      /* knees bend forward (toward the toes), never backward, and inside a knee's range */
      const kneeFwd = [0, 1].map((i) => {
        const h = planted.hipsJ[i];
        const a = planted.ankles[i];
        const k = planted.knees[i];
        const t = ((k[1] - h[1]) * (a[1] - h[1]) + (k[2] - h[2]) * (a[2] - h[2])) / ((a[1] - h[1]) ** 2 + (a[2] - h[2]) ** 2 || 1);
        return k[2] - (h[2] + t * (a[2] - h[2]));
      });
      ok(kneeFwd.every((z) => z > -0.005) && planted.kneeTurn.every((t) => t < 150), `knees still bend the right way (forward by ${kneeFwd.map(f2)} m; turned ${planted.kneeTurn.map((t) => t.toFixed(0))}°)`);
      ok(/planted/.test(planted.now), `the panel says what the feet do ("${planted.now.slice(0, 40)}…")`);
      await page.evaluate(() => document.querySelector('.rig-dlg [data-ext="ik"] [data-ik="show"]').click());
      await set({}, 250);
      const marked = await read();
      ok(marked.markers === 2, `"Show where hands and feet aim" draws a marker per foot (${marked.markers})`);
      await shot(page, "ik-planted-feet");

      /* lifted and in the air */
      await set(Object.assign({ "poseRigLens.feet": "lifted" }, still));
      const lifted = await read();
      ok(lifted.ankles[0][1] > lifted.ankles[1][1] + 0.1 && dist(lifted.ankles[1], stand.ankles[1]) < 0.04, `lifted: the left foot is up (${f2(lifted.ankles[0][1])} m) and the right stays put (${f2(lifted.ankles[1][1])} m)`);
      await set({ "poseRigLens.feet": "in the air" });
      const air = await read();
      ok(air.ankles.every((a, i) => a[1] > stand.ankles[i][1] + 0.1) && air.hips[1] > stand.hips[1] + 0.1, `in the air: both feet off the floor (${air.ankles.map((a) => f2(a[1]))}) and the body up (${f2(stand.hips[1])} to ${f2(air.hips[1])})`);

      /* walking: the feet are left to the walk */
      await set({ "poseRigLens.feet": "planted", "rigRulesLens.motion": "walking" }, 100);
      const swing = await page.evaluate(async () => {
        const c = CurioRig.current();
        const seen = [];
        for (let i = 0; i < 8; i++) {
          await new Promise((r) => setTimeout(r, 140));
          seen.push(c.turned(c.rig().legs.L[0]));
        }
        return Math.max(...seen) - Math.min(...seen);
      });
      ok(swing > 8, `while walking, planted waits and the legs still swing (${swing.toFixed(1)}°)`);
      await set({ "rigRulesLens.motion": "standing still", "poseRigLens.feet": "sliding" });

      /* --- hands --- */
      await set({ "poseRigLens.hands": "a surface" });
      const table = await read();
      const onTable = Math.max(...[0, 1].map((i) => dist(table.wrists[i], table.aims.hands[i] || [9, 9, 9])));
      ok(table.table && table.aims.hands.length === 2 && onTable < 0.03, `a surface: a table appears and both hands reach it (${f2(onTable)} m off)`);
      ok(table.aims.hands.every((h, i) => h[2] > table.shoulders[i][2] + 0.1), "the table is in front of the body");
      await set({ "poseRigLens.feet": "planted", "rigRulesLens.slump": "slumped" });
      const leaning = await read();
      const stillOn = Math.max(...[0, 1].map((i) => dist(leaning.wrists[i], leaning.aims.hands[i])));
      ok(stillOn < 0.04, `the hands stay on the table while the back slumps (${f2(stillOn)} m off)`);
      await shot(page, "ik-hands-on-table");
      await set({ "rigRulesLens.slump": "relaxed", "poseRigLens.feet": "sliding" });

      await set({ "poseRigLens.hands": "another person" });
      const shake = await read();
      const shakeOff = shake.aims.hands.length ? dist(shake.wrists[1], shake.aims.hands[0]) : 9;
      ok(shake.aims.hands.length === 1 && shakeOff < 0.03 && shake.wrists[1][2] > shake.shoulders[1][2] + 0.3 && !shake.table, `another person: the right hand reaches forward to shake hands (${f2(shakeOff)} m off, ${f2(shake.wrists[1][2] - shake.shoulders[1][2])} m in front)`);

      await set({ "poseRigLens.hands": "a prop" });
      const held = await read();
      await set({ "rigRulesLens.slump": "collapsed", "poseRigLens.balance": "falling", "poseRigLens.twist": "strong twist" });
      const held2 = await read();
      const gap1 = held.cup ? dist(held.cup, held.wrists[1]) : 9;
      const gap2 = held2.cup ? dist(held2.cup, held2.wrists[1]) : 9;
      const cupMoved = held.cup && held2.cup ? dist(held.cup, held2.cup) : 0;
      ok(!!held.cup && gap1 < 0.15, `a prop: a cup appears in the right hand (${f2(gap1)} m from the wrist)`);
      ok(cupMoved > 0.02 && Math.abs(gap1 - gap2) < 0.003, `the cup follows the hand as the body moves (moved ${f2(cupMoved)} m, kept its place in the hand to ${f2(Math.abs(gap1 - gap2))} m)`);
      ok(held2.markers === 1, `the hand's aim is marked (${held2.markers})`);
      await set(still);
      const cv = await page.locator(".rig-dlg canvas").boundingBox();
      await page.mouse.move(cv.x + cv.width / 2, cv.y + cv.height / 2);
      for (let i = 0; i < 4; i++) await page.mouse.wheel(0, -100);
      await page.evaluate(() => document.querySelector('.rig-dlg [data-ext="ik"] [data-ik="show"]').click());
      await set({}, 300);
      await shot(page, "ik-cup-in-hand");
      for (let i = 0; i < 4; i++) await page.mouse.wheel(0, 100);
      await set({ "poseRigLens.hands": "empty" });
      const empty = await read();
      ok(!empty.cup && !empty.table && empty.aims.hands.length === 0, "empty: no cup, no table, the hands are free");

      /* --- the Fox: four feet --- */
      await page.selectOption('.rig-dlg [data-rig="character"]', "fox");
      await page.evaluate(() => CurioRig.current().ready);
      await set(Object.assign({}, calm, still, { "poseRigLens.feet": "sliding" }));
      const f0 = await read();
      await set(fall);
      const f1 = await read();
      await set(Object.assign({ "poseRigLens.feet": "planted" }, still));
      const f2a = await read();
      await set(fall);
      const f3 = await read();
      const feet4 = (r) => r.ankles.concat(r.paws);
      const foxSlide = Math.max(...feet4(f0).map((p, i) => dist(p, feet4(f1)[i])));
      const foxPlant = Math.max(...feet4(f2a).map((p, i) => dist(p, feet4(f3)[i])));
      ok(f3.aims.feet.length === 4, `the Fox plants four feet (${f3.aims.feet.length})`);
      ok(foxPlant < 0.05 && foxPlant < foxSlide / 2, `the Fox's planted feet stay put when it falls (${f2(foxPlant)} m, sliding: ${f2(foxSlide)} m)`);
      await set({ "poseRigLens.hands": "a prop" });
      ok(!(await read()).cup, "the Fox gets no cup (no hands)");
      await set({ "poseRigLens.hands": "empty" });
      await set(still);

      /* --- an object: left alone --- */
      await page.selectOption('.rig-dlg [data-rig="character"]', "desk-lamp");
      await page.evaluate(() => CurioRig.current().ready);
      await set({ "poseRigLens.feet": "planted", "poseRigLens.hands": "a surface" });
      const lamp = await page.evaluate(() => ({ aims: CurioRigIK.aims(CurioRig.current().ctx), table: CurioRigIK.table(CurioRig.current().ctx), err: CurioRig.current().error(), now: document.querySelector('.rig-dlg [data-ext="ik"] [data-ik="now"]').textContent }));
      ok(!lamp.err && !lamp.aims.feet.length && !lamp.aims.hands.length && !lamp.table && /Objects/.test(lamp.now), "an object has no feet or hands, so nothing happens to it");
      await set({ "poseRigLens.feet": "sliding", "poseRigLens.hands": "empty" });
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
