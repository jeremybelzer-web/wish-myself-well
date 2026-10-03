/* "Send to storyboard" (rig/snapshot.js) in a real browser:
   node apps/curiosities/rig/tests/snapshot.js [--three three.min.js] [--shots dir]
   (needs Playwright and Chromium; --three serves a local three.js r128 for the cdnjs address).

   Checks: each sketch look (clean lines, pencil, marker) changes the picture (paper behind, an outline, gray
   pencil, bolder marker lines) and turning it off puts back every material and the dark background; no WebGL
   memory is left behind after cycling the looks; "Send this frame" lands a small JPEG in a new storyboard panel
   after the selected one, and on it when asked; "Send a flip book" makes N panels in a new scene with seconds
   set to the gap, showing different moments of the walk; one undo takes the whole flip book away; the
   storyboard draws the pictures in the flip book. Screenshots go to --shots (default
   /mnt/project-files/maya-app/3d-characters when it exists) as snapshot-*.png. */
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
const SHOTS = arg("--shots", fs.existsSync("/mnt/project-files/maya-app/3d-characters") ? "/mnt/project-files/maya-app/3d-characters" : "");
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

/* In the page: set the look, let a few frames draw, then measure the picture. */
async function measure(page, look) {
  return page.evaluate(async (look) => {
    const c = CurioRig.current();
    const ctx = c.ctx;
    if (look) CurioRigSnapshot.setLook(ctx, look);
    const frames = (n) => new Promise((r) => { const go = () => (n-- > 0 ? requestAnimationFrame(go) : r()); go(); });
    await frames(5);
    const cv = document.querySelector(".rig-dlg canvas");
    const W = cv.width;
    const H = cv.height;
    const x = Object.assign(document.createElement("canvas"), { width: W, height: H }).getContext("2d");
    x.drawImage(cv, 0, 0);
    const d = x.getImageData(0, 0, W, H).data;
    const lum = (i) => 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
    const corner = lum((4 * W + 4) * 4);
    let dark = 0;
    let colorful = 0;
    let mid = 0;
    let n = 0;
    for (let i = 0; i < d.length; i += 16) {
      const l = lum(i);
      n++;
      if (l < 45) dark++;
      if (l > 70 && l < 200) mid++;
      if (Math.max(d[i], d[i + 1], d[i + 2]) - Math.min(d[i], d[i + 1], d[i + 2]) > 40) colorful++;
    }
    const mats = [];
    ctx.model.traverse((o) => o.isMesh && !o.userData.sketchHull && [].concat(o.material).forEach((m) => mats.push(m.uuid)));
    return { corner, dark: dark / n, mid: mid / n, colorful: colorful / n, mats, state: CurioRigSnapshot.state(ctx), mem: Object.assign({ programs: (ctx.renderer.info.programs || []).length }, ctx.renderer.info.memory) };
  }, look);
}

(async () => {
  const server = await serve();
  const base = `http://127.0.0.1:${server.address().port}/`;
  const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--ignore-gpu-blocklist"] });
  const context = await browser.newContext({ viewport: { width: 1400, height: 950 }, serviceWorkers: "block" });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => (m.type() === "error" || (m.type() === "warning" && /3D add-on|Storyboard/.test(m.text()))) && !/Failed to load resource|three|cdnjs|fonts\.g|WebGL|GPU stall/.test(m.text()) && errors.push(m.text()));
  if (THREE_FILE) await page.route("**/cdnjs.cloudflare.com/**", (r) => r.fulfill({ path: THREE_FILE, contentType: "text/javascript" }));
  await page.route("**/fonts.g*/**", (r) => r.abort());
  const shot = async (name, sel) => {
    if (!SHOTS) return;
    fs.mkdirSync(SHOTS, { recursive: true });
    await page.locator(sel || ".rig-dlg .rig-view").screenshot({ path: path.join(SHOTS, name + ".png") });
  };
  try {
    await page.goto(base + "index.html?screen=0");
    await page.waitForFunction(() => window.CurioRig && window.CurioRigSnapshot && window.CuriosityStoryboard && document.querySelector("#lib-menu [data-rig3d]"), null, { timeout: 15000 });
    ok(CurioRigHas(await page.evaluate(() => CurioRig.extensions().map((x) => x.id))), "the Send to storyboard add-on is part of the 3D view");
    await page.evaluate(() => {
      localStorage.removeItem("curiosities-rig3d-v1");
      localStorage.removeItem("curiosities-storyboard-v1");
      document.querySelector("#lib-menu [data-rig3d]").click();
    });
    await page.waitForSelector(".rig-dlg[open] canvas");
    await page.evaluate(() => CurioRig.current().ready);
    const err = await page.evaluate(() => CurioRig.current().error());
    if (!THREE_FILE && err) {
      ok(/three\.js/.test(err), "without three.js the window says it is needed (" + err + ")");
    } else {
      ok(!err, "the free figure loads" + (err ? ": " + err : ""));
      const panel = await page.evaluate(() => {
        const box = document.querySelector('.rig-dlg [data-ext="snapshot"]');
        return { look: [...box.querySelectorAll('[data-snap="look"] option')].map((o) => o.textContent), text: box.textContent };
      });
      ok(panel.look.join("|") === "Off|Clean lines|Pencil|Marker", "the Sketch look choices: " + panel.look.join(", "));
      ok(/Send this frame to the storyboard/.test(panel.text) && /Send a flip book/.test(panel.text), "the panel has Send this frame and Send a flip book");

      await page.selectOption('.rig-dlg [data-rig="character"]', "cesium-man");
      await page.evaluate(() => CurioRig.current().ready);
      await page.click('.rig-dlg [data-rig="front"]');
      await page.evaluate(() => CurioRig.current().set("rigRulesLens.motion", "walking"));

      /* off, then each look */
      const off = await measure(page, "off");
      await shot("snapshot-off");
      ok(off.corner < 70 && off.state.wrapped === 0 && off.state.hulls === 0, `off: the dark 3D view as before (corner ${off.corner.toFixed(0)})`);
      const looks = {};
      for (const k of ["clean", "pencil", "marker"]) {
        looks[k] = await measure(page, k);
        await shot("snapshot-" + k);
      }
      const L = looks;
      ok(["clean", "pencil", "marker"].every((k) => L[k].corner > 215 && L[k].state.paper), `each look draws on paper (corners ${["clean", "pencil", "marker"].map((k) => L[k].corner.toFixed(0)).join(", ")})`);
      ok(["clean", "pencil", "marker"].every((k) => L[k].state.hulls > 0 && L[k].state.wrapped > 0 && L[k].state.hidden > 0), `each look outlines the figure and hides the grid (${L.clean.state.hulls} outlines, ${L.clean.state.wrapped} parts)`);
      ok(L.clean.mats.every((u) => !off.mats.includes(u)), "clean lines swaps every material for a drawn one");
      ok(L.clean.dark > 0.002, `clean lines: an ink outline around the figure (${(L.clean.dark * 100).toFixed(2)}% ink)`);
      ok(L.pencil.colorful < 0.002 && L.pencil.mid > 0.004, `pencil: gray lines and hatching, no color (${(L.pencil.colorful * 100).toFixed(2)}% colored, ${(L.pencil.mid * 100).toFixed(2)}% gray)`);
      ok(L.marker.dark > L.clean.dark * 1.3, `marker: bolder lines than clean lines (${(L.marker.dark * 100).toFixed(2)}% ink against ${(L.clean.dark * 100).toFixed(2)}%)`);
      ok(L.clean.state.overlay, "the paper grain lies over the live view");

      /* off again: everything back, nothing left behind, also after cycling looks a few times */
      for (const k of ["pencil", "clean", "marker", "pencil"]) await measure(page, k);
      const back = await measure(page, "off");
      ok(back.corner < 70 && !back.state.paper && back.state.hidden === 0, `off again: the dark background and the grid come back (corner ${back.corner.toFixed(0)})`);
      ok(back.mats.join() === off.mats.join(), "off again: every part has its own material back");
      ok(back.state.wrapped === 0 && back.state.hulls === 0 && back.state.outlines === 0 && !back.state.ramp && !back.state.overlay, "off again: outlines, drawn materials, the tone ramp and the paper overlay are gone");
      ok(back.mem.geometries <= off.mem.geometries && back.mem.textures <= off.mem.textures && back.mem.programs <= off.mem.programs, `no WebGL leaks (geometries ${off.mem.geometries}→${back.mem.geometries}, textures ${off.mem.textures}→${back.mem.textures}, programs ${off.mem.programs}→${back.mem.programs})`);
      ok((await page.evaluate(() => JSON.parse(localStorage.getItem("curiosities-rig3d-v1")).sketchLook)) === "off", "the look is remembered");

      /* the look through the panel's own select, and the other characters */
      await page.selectOption('.rig-dlg [data-snap="look"]', "clean");
      for (const id of ["rigged-figure", "fox", "desk-lamp", "made"]) {
        await page.selectOption('.rig-dlg [data-rig="character"]', id);
        await page.evaluate(() => CurioRig.current().ready);
        const m = await measure(page, null);
        ok(m.state.look === "clean" && m.state.hulls > 0 && m.corner > 215, `the ${id} gets the clean lines look (${m.state.hulls} outlines)`);
        if (id === "made") await shot("snapshot-made-clean");
      }
      await page.selectOption('.rig-dlg [data-rig="character"]', "cesium-man");
      await page.evaluate(() => CurioRig.current().ready);
      await page.click('.rig-dlg [data-rig="front"]');
      await page.evaluate(() => CurioRig.current().set("rigRulesLens.motion", "walking"));

      /* Send this frame */
      const panels = () => page.evaluate(() => CuriosityStoryboard.data().scenes.map((s) => s.panels.length));
      ok((await panels()).length === 0, "the storyboard starts empty");
      await page.click('.rig-dlg [data-snap="frame"]');
      await page.waitForFunction(() => CuriosityStoryboard.data().scenes.length === 1, null, { timeout: 8000 });
      const first = await page.evaluate(async () => {
        const p = CuriosityStoryboard.data().scenes[0].panels[0];
        const img = new Image();
        await new Promise((r) => ((img.onload = r), (img.onerror = r), (img.src = p.pic)));
        return { pic: p.pic.slice(0, 23), size: p.pic.length, w: img.naturalWidth, h: img.naturalHeight, v: !!p.v, said: document.querySelector('.rig-dlg [data-snap="said"]').textContent };
      });
      ok(first.pic === "data:image/jpeg;base64," && first.w === 640 && first.h === 288, `a frame lands in a new storyboard panel as a 640 x 288 JPEG (${first.w} x ${first.h})`);
      ok(first.size < 120000, `the picture is small (${Math.round(first.size / 1024)} KB as text)`);
      ok(/scene 1, panel 1/.test(first.said), `the panel says where it went ("${first.said}")`);
      await page.selectOption('.rig-dlg [data-snap="look"]', "pencil");
      await page.click('.rig-dlg [data-snap="frame"]');
      await page.waitForFunction(() => CuriosityStoryboard.data().scenes[0].panels.length === 2, null, { timeout: 8000 });
      ok((await panels()).join() === "2", "the next frame goes in a new panel after the selected one");
      const before = await page.evaluate(() => CuriosityStoryboard.data().scenes[0].panels.map((p) => p.pic.length));
      await page.selectOption('.rig-dlg [data-snap="look"]', "marker");
      await page.check('.rig-dlg [data-snap="onto"]');
      await page.click('.rig-dlg [data-snap="frame"]');
      await page.waitForFunction((b) => CuriosityStoryboard.data().scenes[0].panels[1].pic.length !== b, before[1], { timeout: 8000 });
      ok((await panels()).join() === "2", "with Draw it on the panel I picked, the selected panel gets the picture and no panel is added");
      await page.uncheck('.rig-dlg [data-snap="onto"]');
      await page.evaluate(() => CuriosityStoryboard.addPictures([{ pic: "javascript:alert(1)" }, { pic: "data:text/html;base64,PGI+" }]));
      ok((await panels()).join() === "2", "anything that is not a small picture is refused");

      /* Send a flip book: 8 frames of the walk, one every 1/8 s */
      await page.selectOption('.rig-dlg [data-snap="look"]', "clean");
      const undoBefore = await page.evaluate(() => (window.CurioStore ? CurioStore.history().undo.length : -1));
      await page.selectOption('.rig-dlg [data-snap="count"]', "8");
      await page.selectOption('.rig-dlg [data-snap="gap"]', { label: "1/8 s" });
      const t0 = Date.now();
      await page.click('.rig-dlg [data-snap="flip"]');
      await page.waitForFunction(() => CuriosityStoryboard.data().scenes.length === 2, null, { timeout: 15000 });
      const flip = await page.evaluate(() => {
        const s = CuriosityStoryboard.data().scenes[1];
        return { n: s.panels.length, secs: s.panels.map((p) => p.seconds), unique: new Set(s.panels.map((p) => p.pic)).size, name: s.name, timing: CuriosityStoryboard.timing()[1] };
      });
      ok(flip.n === 8 && flip.secs.every((x) => x === 0.13 || Math.abs(x - 0.125) < 0.006), `a flip book makes 8 panels in a new scene, each held 1/8 s (${flip.secs.join(", ")}; took ${Date.now() - t0} ms)`);
      ok(flip.unique >= 6, `the drawings follow the walk (${flip.unique} different of 8)`);
      ok(Array.isArray(flip.timing) && flip.timing.every((x) => x > 0), "the storyboard's timing() sees each panel's seconds");
      if (undoBefore >= 0) {
        const steps = await page.evaluate(() => CurioStore.history().undo.length);
        ok(steps === undoBefore + 1, `the flip book is one undo step (${undoBefore} → ${steps})`);
        await page.evaluate(() => CurioStore.undo());
        ok((await panels()).join() === "2", "one undo takes the whole flip book away and keeps the frames sent before");
        await page.evaluate(() => CurioStore.redo());
        ok((await panels()).join() === "2,8", "redo brings it back");
      } else ok(false, "the app's undo list (CurioStore) is on the page");

      /* the storyboard draws the pictures */
      await page.evaluate(() => document.querySelector(".rig-dlg").close());
      await page.click('#tabs button[data-ws="storyboard"]');
      await page.waitForSelector('[data-sb="view-flip"]');
      await page.click('[data-sb="view-flip"]');
      await page.click('[data-go="0"]');
      await page.waitForTimeout(400);
      const sb = await page.evaluate(() => ({ big: !!document.querySelector('[data-sb="big"] img.stage.sb-pic'), loaded: (document.querySelector('[data-sb="big"] img.stage') || {}).naturalWidth || 0, thumbs: document.querySelectorAll(".sb-thumb img.stage").length }));
      ok(sb.big && sb.loaded === 640, "the flip book shows the picture where the drawn stage would be");
      await page.click('[data-go="3"]');
      await page.waitForTimeout(500);
      ok((await page.evaluate(() => document.querySelectorAll(".sb-thumb img.stage").length)) >= 4, "the small pictures under it show the drawings too");
      if (SHOTS) await page.locator('[data-sb="viewer"]').screenshot({ path: path.join(SHOTS, "snapshot-storyboard.png") });
      await page.click('[data-sb="view-grid"]');
      await page.waitForTimeout(500);
      ok((await page.evaluate(() => document.querySelectorAll(".sb-scene img.stage.sb-pic").length)) >= 6, "All scenes shows the pictures");
      if (SHOTS) await page.locator(".sb-grid").screenshot({ path: path.join(SHOTS, "snapshot-storyboard-scenes.png") });
      const sheet = await page.evaluate(async () => {
        const n = document.querySelector('[data-sb="png"]');
        return !!n;
      });
      ok(sheet, "the contact sheet button is still there");
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

function CurioRigHas(ids) {
  return Array.isArray(ids) && ids.includes("snapshot");
}
