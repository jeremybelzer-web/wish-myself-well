/* The Light add-on (rig/lights.js) in a real browser:
   node apps/curiosities/rig/tests/lights.js [--three three.min.js] [--shots dir]
   (needs Playwright and Chromium; --three serves a local three.js r128 for the cdnjs address).

   Reads the picture back from the 3D view and checks: "one side black" makes one half of the figure much darker
   than the other, far more than "flat and even"; a warm light makes the figure redder and a cold day bluer; the
   figure throws a shadow on the floor, and with "Lights follow the curiosities" off the plain lights come back
   and the shadow goes; each kind of main light is the right kind of light; soft shadows are blurrier; beams,
   shaped light, lamps in the shot and cartoon shading appear and go away; no page errors. Screenshots go to
   --shots (default /mnt/project-files/maya-app/3d-characters when it exists). */
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

/* In the page: set sliders, let a few frames draw, then read the figure and the floor beside it. */
async function look(page, values) {
  return page.evaluate(async (values) => {
    const c = CurioRig.current();
    Object.keys(values).forEach((k) => c.set(k, values[k]));
    const frames = (n) => new Promise((r) => { const go = () => (n-- > 0 ? requestAnimationFrame(go) : r()); go(); });
    const cv = document.querySelector(".rig-dlg canvas");
    const grab = async () => {
      await frames(4);
      const x = Object.assign(document.createElement("canvas"), { width: cv.width, height: cv.height }).getContext("2d");
      x.drawImage(cv, 0, 0);
      return x.getImageData(0, 0, cv.width, cv.height).data;
    };
    const ctx = c.ctx;
    const T = ctx.THREE;
    const W = cv.width;
    const H = cv.height;
    const toPx = (v) => { const p = v.clone().project(ctx.camera); return [((p.x + 1) / 2) * W, ((1 - p.y) / 2) * H]; };
    const box = new T.Box3().setFromObject(ctx.model);
    const pts = [];
    [box.min.x, box.max.x].forEach((x) => [box.min.y, box.max.y].forEach((y) => [box.min.z, box.max.z].forEach((z) => pts.push(toPx(new T.Vector3(x, y, z))))));
    const x0 = Math.max(0, Math.floor(Math.min(...pts.map((p) => p[0]))));
    const x1 = Math.min(W, Math.ceil(Math.max(...pts.map((p) => p[0]))));
    const y0 = Math.max(0, Math.floor(Math.min(...pts.map((p) => p[1]))));
    const y1 = Math.min(H, Math.ceil(Math.max(...pts.map((p) => p[1]))));
    const mid = toPx(box.getCenter(new T.Vector3()))[0];
    /* the floor to the left of the feet, where a light from the right throws the shadow */
    const f = [toPx(new T.Vector3(-1.3, 0, 0.35)), toPx(new T.Vector3(-0.35, 0, -0.35))];
    const with_ = await grab();
    ctx.model.visible = false;
    const without = await grab();
    ctx.model.visible = true;
    await frames(1);
    const lum = (d, i) => 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
    const side = [[0, 0], [0, 0]];
    let red = 0;
    let blue = 0;
    let n = 0;
    const yTop = y0;
    const yLow = y0 + (y1 - y0) * 0.6; /* head to hips: well above the floor */
    for (let y = yTop; y < yLow; y++)
      for (let x = x0; x < x1; x++) {
        const i = (y * W + x) * 4;
        if (Math.max(Math.abs(with_[i] - without[i]), Math.abs(with_[i + 1] - without[i + 1]), Math.abs(with_[i + 2] - without[i + 2])) < 14) continue;
        const s = x < mid ? 0 : 1;
        side[s][0] += lum(with_, i);
        side[s][1]++;
        red += with_[i];
        blue += with_[i + 2];
        n++;
      }
    let fa = 0;
    let fb = 0;
    let fn = 0;
    for (let y = Math.floor(Math.min(f[0][1], f[1][1])); y < Math.max(f[0][1], f[1][1]); y++)
      for (let x = Math.floor(f[0][0]); x < f[1][0]; x++) {
        const i = (y * W + x) * 4;
        fa += lum(with_, i);
        fb += lum(without, i);
        fn++;
      }
    return {
      left: side[0][1] ? side[0][0] / side[0][1] : 0,
      right: side[1][1] ? side[1][0] / side[1][1] : 0,
      pixels: n,
      redMinusBlue: n ? (red - blue) / n : 0,
      floorWith: fn ? fa / fn : 0,
      floorWithout: fn ? fb / fn : 0,
      state: CurioRigLights.state(ctx),
    };
  }, values);
}

(async () => {
  const server = await serve();
  const base = `http://127.0.0.1:${server.address().port}/`;
  const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--ignore-gpu-blocklist"] });
  const page = await browser.newPage({ viewport: { width: 1400, height: 950 }, serviceWorkers: "block" });
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => (m.type() === "error" || (m.type() === "warning" && /3D add-on lights/.test(m.text()))) && !/Failed to load resource|three|cdnjs|fonts\.g|WebGL|GPU stall/.test(m.text()) && errors.push(m.text()));
  if (THREE_FILE) await page.route("**/cdnjs.cloudflare.com/**", (r) => r.fulfill({ path: THREE_FILE, contentType: "text/javascript" }));
  await page.route("**/fonts.g*/**", (r) => r.abort());
  const shot = async (name) => {
    if (!SHOTS) return;
    fs.mkdirSync(SHOTS, { recursive: true });
    await page.locator(".rig-dlg .rig-view").screenshot({ path: path.join(SHOTS, name + ".png") });
  };
  try {
    await page.goto(base + "index.html?screen=0");
    await page.waitForFunction(() => window.CurioRig && window.CurioRigLights && document.querySelector("#lib-menu [data-rig3d]"), null, { timeout: 15000 });
    ok(CurioRigHas(await page.evaluate(() => CurioRig.extensions().map((x) => x.id))), "the Light add-on is part of the 3D view");
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
      const panel = await page.evaluate(() => ({
        rows: ["lightRigLens.lightType", "lightRigLens.ratio", "lightRigLens.softness", "lightingLens.colorTemp", "renderLookLens.bands"].every((id) => document.querySelector(`.rig-dlg [data-row="${id}"]`)),
        toggle: !!document.querySelector('.rig-dlg [data-ext="lights"] [data-lights="follow"]:checked'),
        words: document.querySelector('.rig-dlg [data-ext="lights"]').textContent,
      }));
      ok(panel.rows, "the Light sliders are in the panel (Main light, Bright side to dark side, Hard or soft, Color of the light, Shading)");
      ok(panel.toggle && /Main light/.test(panel.words) && /Fill light/.test(panel.words) && /Edge light/.test(panel.words) && /Sky and bounce/.test(panel.words), "the panel has the toggle, on, and a line for each light");
      /* Cesium Man: a rounded body shows a lit side and a dark side (the plain figure is made of flat boxes) */
      await page.selectOption('.rig-dlg [data-rig="character"]', "cesium-man");
      await page.evaluate(() => CurioRig.current().ready);
      await page.click('.rig-dlg [data-rig="front"]');

      const plain = { "lightRigLens.lightType": "sun", "lightingLens.key": "side", "lightRigLens.bounce": "none", "lightRigLens.rim": "off", "lightRigLens.haze": "clear", "lightRigLens.shape": "open", "lightRigLens.softness": "hard", "lightingLens.colorTemp": "mixed", "lightRigLens.falloff": "reaches far" };
      const black = await look(page, Object.assign({}, plain, { "lightRigLens.ratio": "one side black" }));
      await shot("lights-one-side-black");
      const flat = await look(page, Object.assign({}, plain, { "lightRigLens.ratio": "flat and even" }));
      const cr = (m) => Math.max(m.left, m.right) / Math.max(1, Math.min(m.left, m.right));
      ok(black.pixels > 2000, `the figure is found in the picture (${black.pixels} pixels)`);
      ok(cr(black) > 2.5 && black.right > black.left, `"one side black": the lit half is much brighter than the dark half (${black.right.toFixed(0)} against ${black.left.toFixed(0)})`);
      ok(cr(flat) < cr(black) / 1.8, `"flat and even" is far more even (${flat.right.toFixed(0)} against ${flat.left.toFixed(0)})`);
      ok(black.state.fill === 0 && black.state.sky < 0.01 && flat.state.fill > 0.5, `the fill and sky lights go out for "one side black" (fill ${black.state.fill.toFixed(2)}, sky ${black.state.sky.toFixed(3)})`);

      ok(black.floorWith < black.floorWithout * 0.8, `the figure throws a shadow on the floor (floor ${black.floorWith.toFixed(0)} with the figure, ${black.floorWithout.toFixed(0)} without)`);

      const warm = await look(page, Object.assign({}, plain, { "lightRigLens.ratio": "gentle", "lightingLens.colorTemp": "warm practical" }));
      const cold = await look(page, Object.assign({}, plain, { "lightRigLens.ratio": "gentle", "lightingLens.colorTemp": "cold day" }));
      ok(warm.redMinusBlue > cold.redMinusBlue + 15, `warm light makes the figure redder and a cold day bluer (red minus blue ${warm.redMinusBlue.toFixed(0)} against ${cold.redMinusBlue.toFixed(0)})`);
      ok(/warm/.test(warm.state.said) && /cold/.test(cold.state.said), `the panel says what the light is doing ("${cold.state.said}")`);

      /* kinds of main light */
      const kinds = {};
      for (const t of ["sun", "open sky", "window", "spotlight", "bare bulb", "glowing object"]) kinds[t] = (await look(page, { "lightRigLens.lightType": t })).state;
      ok(kinds.sun.key === "dir" && kinds["open sky"].key === "dir" && kinds.window.key === "spot" && kinds.spotlight.key === "spot" && kinds["bare bulb"].key === "point" && kinds["glowing object"].key === "point", "each kind of main light is the right kind of light (sun and sky far away, window and spotlight aimed, bulb and glowing object from a point)");
      ok(kinds["open sky"].sky > kinds.sun.sky, "open sky leans on the sky light");
      ok(kinds["bare bulb"].lamp && kinds["glowing object"].orb && !kinds.sun.lamp, "a bare bulb shows its bulb; a glowing object shows the glow");
      ok(Object.values(kinds).every((s) => s.keyShadows), "every main light throws shadows");

      const hard = (await look(page, { "lightRigLens.lightType": "sun", "lightRigLens.softness": "hard" })).state;
      const soft = (await look(page, { "lightRigLens.softness": "soft" })).state;
      ok(soft.softRadius > hard.softRadius * 3, `soft light blurs the shadow edge (${hard.softRadius.toFixed(1)} to ${soft.softRadius.toFixed(1)})`);

      /* extras: haze and beams, shaped light, lamps in the shot, falloff, rim */
      const extra = (await look(page, { "lightRigLens.lightType": "spotlight", "lightRigLens.haze": "beams", "lightRigLens.shape": "blinds", "lightRigLens.practical": "yes", "lightRigLens.rim": "strong", "lightingLens.colorTemp": "warm practical", "lightRigLens.ratio": "dramatic", "lightRigLens.bounce": "a little" })).state;
      ok(extra.beam && extra.fog && extra.shape === "blinds" && extra.lamp && extra.rim > 1.5, `beams in haze, blinds across the light, the lamp in the shot and a strong edge light (${JSON.stringify({ beam: extra.beam, fog: extra.fog, shape: extra.shape, lamp: extra.lamp, rim: extra.rim })})`);
      await shot("lights-spotlight-blinds-beams");
      const near = (await look(page, { "lightRigLens.lightType": "bare bulb", "lightRigLens.haze": "clear", "lightRigLens.shape": "open", "lightRigLens.falloff": "reaches far" })).state;
      const fast = (await look(page, { "lightRigLens.falloff": "drops off fast" })).state;
      ok(fast.keyIntensity > near.keyIntensity * 2, `"drops off fast" makes the bulb fade quickly but keeps the figure lit (strength ${near.keyIntensity.toFixed(2)} to ${fast.keyIntensity.toFixed(2)})`);

      /* cartoon shading */
      const toon = await look(page, { "lightRigLens.lightType": "sun", "lightRigLens.falloff": "reaches far", "lightRigLens.practical": "no", "lightRigLens.rim": "thin", "renderLookLens.bands": "two bands", "lightRigLens.ratio": "dramatic", "lightingLens.colorTemp": "mixed" });
      ok(toon.state.toon && toon.pixels > 2000, "two bands turns the figure into cartoon shading");
      await shot("lights-two-bands");
      const smooth = await look(page, { "renderLookLens.bands": "smooth" });
      ok(!smooth.state.toon, "smooth puts the figure's own materials back");

      /* off: the plain lights */
      await page.click('.rig-dlg [data-ext="lights"] [data-lights="follow"]');
      const off = await look(page, { "lightRigLens.ratio": "one side black" });
      ok(!off.state.on && off.state.defaultsVisible && !off.state.floor, "off: the plain lights come back and the shadow floor goes");
      ok(cr(off) < cr(black) / 1.8 && Math.abs(off.floorWith - off.floorWithout) < 6, `off: the sliders no longer change the light (sides ${off.right.toFixed(0)} and ${off.left.toFixed(0)}, no shadow)`);
      ok((await page.evaluate(() => JSON.parse(localStorage.getItem("curiosities-rig3d-v1")).lightsFollow)) === false, "the choice is remembered");
      await page.click('.rig-dlg [data-ext="lights"] [data-lights="follow"]');
      ok((await look(page, {})).state.on, "on again");

      /* other characters and objects get lit and throw shadows too */
      for (const id of ["rigged-figure", "fox", "desk-lamp"]) {
        await page.selectOption('.rig-dlg [data-rig="character"]', id);
        await page.evaluate(() => CurioRig.current().ready);
        const m = await look(page, Object.assign({}, plain, { "lightRigLens.ratio": "dramatic" }));
        ok(m.state.keyShadows && m.pixels > 500, `the ${id} is lit by the Light add-on (${m.pixels} pixels)`);
      }
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

function CurioRigHas(ids) {
  return Array.isArray(ids) && ids.includes("lights");
}
