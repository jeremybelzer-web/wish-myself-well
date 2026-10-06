/* Record the "Show me" demonstrations as video clips:
     node apps/curiosities/demo/tools/record.js [--out dir] [--three three.min.js] [--only map,window,lanes]
                                                [--win <curiosity id>,...] [--size 1440x900]
   (needs Playwright and Chromium; NODE_PATH to where Playwright is installed if it is not local.)
   Each demonstration plays at normal speed in a fresh page and is saved as <out>/<n> <name>.webm, and as .mp4
   too when ffmpeg is installed. --win adds one clip per curiosity window named (the window demonstration on it).
   --three gives a local three.js r128 for the 3D map when cdnjs cannot be reached. */
const http = require("http");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { execFileSync } = require("child_process");
const { chromium } = require("playwright");

const args = process.argv.slice(2);
const arg = (n, d) => (args.includes(n) ? args[args.indexOf(n) + 1] : d);
const OUT = path.resolve(arg("--out", path.join(os.tmpdir(), "curiomatic-demos")));
const THREE = arg("--three", process.env.CURIO_THREE || "");
const ONLY = arg("--only", "map,window,lanes").split(",").filter(Boolean);
const WINS = arg("--win", "").split(",").filter(Boolean);
const [W, H] = arg("--size", "1440x900").split("x").map(Number);
const ROOT = path.join(__dirname, "..", "..");
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".glb": "model/gltf-binary", ".webmanifest": "application/manifest+json" };

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
const NAMES = { map: "The 3D curiosity map", window: "A curiosity window", lanes: "Nodes and lines on a lane" };

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const server = await serve();
  const base = `http://127.0.0.1:${server.address().port}/`;
  const browser = await chromium.launch();
  const jobs = ONLY.map((id) => ({ id, name: NAMES[id] || id, opts: {} })).concat(WINS.map((w) => ({ id: "window", name: "Window - " + w, opts: { id: w } })));
  let n = 0;
  let bad = 0;
  for (const job of jobs) {
    n++;
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "demo-rec-"));
    const ctx = await browser.newContext({ viewport: { width: W, height: H }, recordVideo: { dir, size: { width: W, height: H } } });
    if (THREE) await ctx.route(/three(\.min)?\.js$/, (route) => route.fulfill({ body: fs.readFileSync(THREE), contentType: "text/javascript" }));
    const page = await ctx.newPage();
    page.on("pageerror", (e) => console.log("     page error: " + e));
    // the walkthrough starts once per device on its own and hover help shows bubbles: neither should cover it
    await page.addInitScript(() => {
      try {
        localStorage.setItem("curio-walkthrough-seen-v1", "1");
        localStorage.setItem("curio-hoverhelp-v1", "off");
      } catch (e) {}
    });
    await page.goto(base + "index.html?screen=1");
    await page.waitForFunction(() => window.CurioScreen && window.CurioScreen.isOpen() && window.CurioDemo, null, { timeout: 30000 });
    await page.evaluate(() => document.querySelectorAll(".cw-bubble, .cw-light, .cw-dot").forEach((e) => e.remove()));
    await page.waitForTimeout(1200);
    if (job.opts.id) await page.evaluate((id) => window.CurioScreen.openWin(id), job.opts.id);
    const t0 = Date.now();
    const r = await page.evaluate(([id, opts]) => window.CurioDemo.run(id, opts), [job.id, job.opts]);
    await page.waitForTimeout(800);
    const video = page.video();
    await ctx.close();
    const file = path.join(OUT, `${n} ${job.name}.webm`);
    fs.copyFileSync(await video.path(), file);
    fs.rmSync(dir, { recursive: true, force: true });
    if (!r.ok) bad++;
    console.log(`${r.ok ? "ok  " : "FAIL"} ${job.name}: ${Math.round((Date.now() - t0) / 1000)} s${r.error ? " (" + r.error + ")" : ""} -> ${file}`);
    try {
      execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", file, "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "26", "-movflags", "+faststart", file.replace(/\.webm$/, ".mp4")]);
    } catch (e) {
      /* no ffmpeg: the .webm plays in any browser */
    }
  }
  await browser.close();
  server.close();
  process.exit(bad ? 1 : 0);
})();
