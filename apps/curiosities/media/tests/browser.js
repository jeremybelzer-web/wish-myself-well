/* Bringing in your own video, in a real browser:
     node apps/curiosities/media/tests/browser.js
   (needs Playwright and Chromium; set NODE_PATH to where Playwright is installed if it is not local).

   Makes a short test video inside the browser (four shots: bars, orange, moving bars, dark blue), brings it in
   through the Library's "Bring in a video" window, and checks: the cuts are found where the shots change, the
   orange shot reads warm and the dark blue one low key, one small picture per moment is kept, the video becomes
   a curated film with curiosity values, highlights are offered, the window says nothing was uploaded, the
   measurements survive a reload, and Forget removes them. */
const http = require("http");
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const ROOT = path.join(__dirname, "..", "..");
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".webmanifest": "application/manifest+json" };
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
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  try {
    await page.goto(`http://127.0.0.1:${server.address().port}/index.html?screen=0`);
    await page.waitForFunction(() => window.CurioMedia && document.querySelector("#lib-menu [data-media]"), null, { timeout: 15000 });
    ok(true, "the Library has Bring in a video");

    /* A 16-second test video, recorded in the page: 4 shots of 4 seconds. */
    await page.evaluate(async () => {
      const c = Object.assign(document.createElement("canvas"), { width: 320, height: 180 });
      const x = c.getContext("2d");
      const rec = new MediaRecorder(c.captureStream(25), { mimeType: "video/webm" });
      const parts = [];
      rec.ondataavailable = (e) => e.data.size && parts.push(e.data);
      const done = new Promise((r) => (rec.onstop = r));
      rec.start(250);
      const t0 = performance.now();
      await new Promise((resolve) => {
        (function frame() {
          const t = (performance.now() - t0) / 1000;
          if (t >= 16) return resolve();
          const shot = Math.floor(t / 4);
          const bars = ["#fff", "#ff0", "#0ff", "#0f0", "#f0f", "#f00", "#00f", "#000"];
          if (shot === 0 || shot === 2) bars.forEach((b, i) => ((x.fillStyle = b), x.fillRect(((i * 40 + (shot === 2 ? t * 60 : 0)) % 320), 0, 40, 180)));
          else {
            x.fillStyle = shot === 1 ? "#d2601e" : "#0c1430";
            x.fillRect(0, 0, 320, 180);
          }
          requestAnimationFrame(frame);
        })();
      });
      rec.stop();
      await done;
      window.__testVideo = new File(parts, "four shots.webm", { type: "video/webm", lastModified: 1 });
    });

    await page.evaluate(() => document.querySelector("#lib-menu [data-media]").click());
    await page.waitForSelector(".cm-media[open] input[type=file]");
    ok(/nothing is uploaded or copied/.test(await page.textContent(".cm-media")), "the window says the video is not uploaded or copied");
    await page.selectOption('.cm-media [data-m="step"]', "2");
    await page.evaluate(() => {
      const input = document.querySelector('.cm-media input[type=file]');
      const dt = new DataTransfer();
      dt.items.add(window.__testVideo);
      input.files = dt.files;
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await page.waitForFunction(() => /Moment by moment|Could not/.test(document.querySelector(".cm-body").innerText), null, { timeout: 120000 });
    const v = await page.evaluate(async () => (await CurioMedia.videos())[0]);
    console.log(`     (measured by the ${v && v.analyzer} analyzer: "video" when video/ is loaded, else "light")`);
    ok(v && v.beats.length >= 7 && v.beats.length <= 9, `one moment every 2 seconds (${v && v.beats.length})`);
    const cutAt = v.beats.filter((b) => b.stats.cuts).map((b) => b.from);
    ok([4, 8, 12].every((s) => cutAt.some((t) => Math.abs(t - s) <= 2)), `cuts found near 4, 8 and 12 s (${cutAt.join(", ")})`);
    const at = (s) => v.beats.find((b) => b.from <= s && b.to > s) || {};
    ok(/warm/.test(at(5).values.warmCool || ""), `the orange shot reads warm (${at(5).values.warmCool})`);
    ok(at(13).values.valueKey === "low key", `the dark blue shot reads low key (${at(13).values.valueKey})`);
    ok(/cool/.test(at(13).values.warmCool || ""), `the dark blue shot reads cool (${at(13).values.warmCool})`);
    ok((v.highlights || []).length >= 1, `highlights offered (${(v.highlights || []).length})`);
    const pics = await page.evaluate(async ([id, n]) => {
      let k = 0;
      for (let i = 0; i < n; i++) if (await CurioMedia.thumb(id, i)) k++;
      return k;
    }, [v.id, v.beats.length]);
    ok(pics === v.beats.length, `a small picture for every moment (${pics})`);
    const study = await page.evaluate(() => CuriosityStudy.studies().find((s) => s.source === "my video"));
    ok(study && study.title === "four shots" && study.beats.length === v.beats.length && Object.keys(study.beats[0].values).length >= 5, "it is a curated film with curiosity values");
    ok(study && !JSON.stringify(study).includes("blob:"), "the curated film holds values only, no video");

    await page.reload();
    await page.waitForFunction(() => window.CurioMedia);
    const kept = await page.evaluate(async () => (await CurioMedia.videos()).length);
    ok(kept === 1, "the measurements survive a reload");
    await page.evaluate(() => CurioMedia.open());
    await page.waitForSelector('.cm-media [data-m="forget"]');
    await page.click('.cm-media [data-m="forget"]');
    await page.waitForTimeout(400);
    const after = await page.evaluate(async () => ({ videos: (await CurioMedia.videos()).length }));
    ok(after.videos === 0, "Forget removes them");
    ok(!errors.length, "no page errors" + (errors.length ? ": " + errors.join(" | ") : ""));
  } catch (e) {
    ok(false, "ran to the end: " + e.message);
  } finally {
    await browser.close();
    server.close();
  }
  console.log(failed ? `${failed} failed` : "all passed");
  process.exit(failed ? 1 : 0);
})();
