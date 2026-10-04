/* Loading the 3D files on first use (rig/load.js) in a real browser:
   node apps/curiosities/rig/tests/lazy.js [--three three.min.js] [--shots dir]
   (needs Playwright and Chromium; --three serves a local three.js r128 for the cdnjs address).

   Checks: the page starts with only rig/load.js and rig/screen.js of the 3D files; the Library button and one
   Studio tool "rig3d" are there before anything loads; a file that does not arrive gives a plain message with
   Try again, and Try again fetches only what was missing; then the 3D window opens with every add-on, each file
   fetched once, in FILES order; CurioRig stays the same object; an add-on added after a view exists still gets
   its setup and built hooks; the Studio tool and CurioRig.mount work after loading; no page errors. */
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

(async () => {
  const server = await serve();
  const base = `http://127.0.0.1:${server.address().port}/`;
  const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--ignore-gpu-blocklist"] });
  const page = await browser.newPage({ viewport: { width: 1400, height: 950 }, serviceWorkers: "block" });
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => m.type() === "error" && !/Failed to load resource|three|cdnjs|fonts\.g|WebGL|GPU stall/.test(m.text()) && errors.push(m.text()));
  if (THREE_FILE) await page.route("**/cdnjs.cloudflare.com/**", (r) => r.fulfill({ path: THREE_FILE, contentType: "text/javascript" }));
  await page.route("**/fonts.g*/**", (r) => r.abort());
  const shot = async (name) => {
    if (!SHOTS) return;
    fs.mkdirSync(SHOTS, { recursive: true });
    await page.locator(".rig-dlg").screenshot({ path: path.join(SHOTS, name + ".png") });
  };
  const block = (r) => r.abort();
  await page.route("**/rig/sets.js", block);
  try {
    await page.goto(base + "index.html?screen=0");
    await page.waitForFunction(() => window.CurioRig && document.querySelector("#lib-menu [data-rig3d]"), null, { timeout: 15000 });
    const start = await page.evaluate(() => ({
      rig: performance.getEntriesByType("resource").map((e) => e.name).filter((n) => /\/rig\/[\w-]+\.js/.test(n)).map((n) => n.replace(/.*\/rig\//, "")),
      loaded: CurioRig.loaded(),
      tools: CuriosityStudio.tools().filter((t) => t.id === "rig3d").length,
      files: CurioRigLoad.FILES.length,
    }));
    ok(start.rig.sort().join() === "load.js,screen.js", "at start only rig/load.js and rig/screen.js load (" + start.rig.join(", ") + ")");
    ok(!start.loaded && start.files >= 12, "the other 3D files wait (" + start.files + " in FILES)");
    ok(start.tools === 1, "the Studio has the 3D characters tool before anything loads");
    await page.evaluate(() => (window.__early = window.CurioRig));

    /* a file that does not arrive */
    await page.evaluate(() => {
      document.getElementById("lib-menu").hidden = false;
      document.querySelector("#lib-menu [data-rig3d]").click();
    });
    await page.waitForFunction(() => /could not load/.test((document.querySelector(".rig-lazy-note") || {}).textContent || ""), null, { timeout: 15000 });
    const note = await page.evaluate(() => document.querySelector(".rig-lazy-note").textContent);
    if (SHOTS) await page.screenshot({ path: path.join(SHOTS, "lazy-missing-file.png"), clip: { x: 300, y: 820, width: 800, height: 130 } });
    ok(/sets\.js/.test(note) && /Try again/.test(note) && !/Error|undefined/.test(note), "a missing file says so in plain words, with Try again (" + note + ")");
    await page.unroute("**/rig/sets.js", block);
    await page.evaluate(() => [...document.querySelectorAll(".rig-lazy-note button")].find((b) => b.textContent === "Try again").click());
    await page.waitForFunction(() => document.querySelector(".rig-dlg") && document.querySelector(".rig-dlg").open && CurioRig.current() && CurioRig.current().ctx, null, { timeout: 30000 });
    await page.evaluate(() => CurioRig.current().ready);
    const after = await page.evaluate(() => {
      const names = performance.getEntriesByType("resource").map((e) => e.name.replace(/.*\/rig\//, "")).filter((n) => /^[\w-]+\.js$/.test(n));
      const count = {};
      names.forEach((n) => (count[n] = (count[n] || 0) + 1));
      const tags = [...document.querySelectorAll("script[data-rig-lazy]")].map((s) => s.dataset.rigLazy);
      return {
        count,
        tags,
        same: window.__early === window.CurioRig,
        loaded: CurioRig.loaded(),
        ext: CurioRig.extensions().map((x) => x.id),
        note: !!document.querySelector(".rig-lazy-note"),
        err: CurioRig.current().error(),
        sliders: document.querySelectorAll(".rig-dlg [data-slider]").length,
        tools: CuriosityStudio.tools().filter((t) => t.id === "rig3d").length,
      };
    });
    ok(after.loaded && !after.err && !after.note, "Try again loads the rest and the 3D window opens" + (after.err ? ": " + after.err : ""));
    ok(after.same, "CurioRig is the same object before and after loading");
    ok(["ik", "lights", "forces", "camera", "faces", "gestures", "scene", "sets", "snapshot"].every((id) => after.ext.includes(id)), "every add-on is in the view (" + after.ext.join(", ") + ")");
    const files = await page.evaluate(() => CurioRigLoad.FILES);
    const fetchedSets = (after.count["sets.js"] || 0);
    ok(files.filter((f) => f !== "sets.js").every((f) => after.count[f] === 1), "each 3D file was fetched once (" + JSON.stringify(after.count) + ")");
    ok(fetchedSets <= 2 && after.tags.filter((t) => t === "sets.js").length === 1, "the missing file was fetched again, and only it");
    ok(after.tags.slice(0, files.length - 1).join() === files.filter((f) => f !== "sets.js").join(), "the files run in FILES order");
    ok(after.sliders > 40, "the add-ons' sliders are in the window (" + after.sliders + ")");
    ok(after.tools === 1, "still one 3D characters tool in the Studio");
    await page.evaluate(() => (window.__early = window.CurioRig));
    await shot("lazy-opened");

    /* an add-on added after the view exists */
    const late = await page.evaluate(async () => {
      const r = { setup: 0, built: 0 };
      CurioRig.extend({ id: "late-test", setup: (ctx) => (r.setup += ctx && ctx.scene ? 1 : 0), built: (ctx) => (r.built += ctx && ctx.model ? 1 : 0) });
      await new Promise((res) => setTimeout(res, 50));
      return r;
    });
    ok(late.setup === 1 && late.built === 1, "an add-on added late still gets setup and built on the open view");

    /* mount and the Studio tool after loading */
    const m = await page.evaluate(async () => {
      document.querySelector(".rig-dlg").close();
      const el = document.createElement("div");
      document.body.appendChild(el);
      const c = CurioRig.mount(el);
      await c.ready;
      const ok = !c.pending && !!c.ctx && !!el.querySelector("canvas");
      c.stop();
      el.remove();
      return ok;
    });
    ok(m, "CurioRig.mount works the usual way once loaded");

    /* before loading, mount (the Studio tool, the Screen) hands back a stand-in that becomes the real view */
    await page.goto(base + "index.html?screen=0");
    await page.waitForFunction(() => window.CurioRig && window.CurioRig.load, null, { timeout: 15000 });
    const s = await page.evaluate(async () => {
      const el = document.createElement("div");
      document.body.appendChild(el);
      const c = CurioRig.mount(el);
      const r = { pending: c.pending === true, waiting: /ready/.test(el.textContent), current: CurioRig.current() === c };
      await c.ready;
      r.real = !!c.ctx && !!c.ctx.scene && !!el.querySelector("canvas") && !c.error();
      r.currentReal = CurioRig.current() && CurioRig.current().ctx === c.ctx;
      c.stop();
      return r;
    });
    ok(s.pending && s.waiting && s.current, "before loading, mount shows Getting the 3D view ready and hands back a stand-in");
    ok(s.real && s.currentReal, "the stand-in becomes the real 3D view once the files are in");
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
