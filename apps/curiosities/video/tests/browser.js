/* The Video window in a real browser, inside the real app: node apps/curiosities/video/tests/browser.js
   (needs Playwright and Chromium; set NODE_PATH to where Playwright is installed if it is not local).

   The page makes its own two clips (a canvas and a tone, recorded as .webm), so no video files are needed:
   the inspiration goes dark and bright every second and gets loud with it; your clip is a steady grey with a
   moving square. Then, the way a person would: bring both in, see the lanes and their nodes, put them on My
   film, apply light only and check it follows the inspiration, apply everything and save a video, swap the
   clips, and find the window's button on the Screen. Screenshots go to --shots (default: the temp folder). */
const http = require("http");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { chromium } = require("playwright");

const args = process.argv.slice(2);
const arg = (n, d) => (args.includes(n) ? args[args.indexOf(n) + 1] : d);
const SHOTS = arg("--shots", os.tmpdir());
/* --mediapipe DIR: a local copy of @mediapipe/tasks-vision (its package folder) with the selfie multiclass model
   beside it, for the AI cut-out checks (the sandbox can't reach the CDN). */
const MP = arg("--mediapipe", "");
const ROOT = path.join(__dirname, "..", "..");
const TYPES = { ".html": "text/html", ".mjs": "text/javascript", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".webmanifest": "application/manifest+json" };

function serve() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const u = decodeURIComponent(req.url.split("?")[0]);
      const p = MP && u.startsWith("/__mp/") ? path.join(MP, u.slice(6)) : path.join(ROOT, u.replace(/^\/+/, ""));
      if (MP && u.startsWith("/__mp/")) {
        if (!fs.existsSync(p)) {
          res.writeHead(404);
          return res.end();
        }
        res.writeHead(200, { "content-type": /\.m?js$/.test(p) ? "text/javascript" : /\.wasm$/.test(p) ? "application/wasm" : "application/octet-stream" });
        return fs.createReadStream(p).pipe(res);
      }
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
let failed = 0;
const ok = (cond, text) => {
  console.log((cond ? "ok   " : "FAIL ") + text);
  if (!cond) failed++;
};

(async () => {
  const server = await serve();
  const url = "http://127.0.0.1:" + server.address().port + "/index.html?screen=0";
  const browser = await chromium.launch({ args: ["--autoplay-policy=no-user-gesture-required"] });
  const page = await browser.newPage({ viewport: { width: 1360, height: 900 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e && e.message)));
  page.on("console", (m) => m.type() === "error" && !/Failed to load resource|favicon|fonts\.g|cdnjs|^INFO: /.test(m.text()) && errors.push(m.text()));
  await page.goto(url);
  await page.waitForFunction(() => window.CurioVideoUI && window.CurioEngine && window.CurioClip, null, { timeout: 30000 });
  ok(true, "the Video window loads with the app");

  /* Two made-up clips, recorded in the page. */
  await page.evaluate(async () => {
    async function make(name, secs, draw, loud) {
      const c = document.createElement("canvas");
      c.width = 320;
      c.height = 180;
      const x = c.getContext("2d");
      const ac = new AudioContext();
      const osc = ac.createOscillator();
      const g = ac.createGain();
      const dest = ac.createMediaStreamDestination();
      osc.frequency.value = 220;
      osc.connect(g).connect(dest);
      osc.start();
      const stream = c.captureStream(30);
      dest.stream.getAudioTracks().forEach((t) => stream.addTrack(t));
      const rec = new MediaRecorder(stream, { mimeType: "video/webm;codecs=vp8,opus" });
      const chunks = [];
      rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      rec.start(100);
      const t0 = performance.now();
      await new Promise((done) => {
        const tick = () => {
          const t = (performance.now() - t0) / 1000;
          if (t > secs) return done();
          draw(x, t);
          g.gain.value = loud(t);
          requestAnimationFrame(tick);
        };
        tick();
      });
      await new Promise((r) => {
        rec.onstop = r;
        rec.stop();
      });
      osc.stop();
      ac.close();
      return new File(chunks, name, { type: "video/webm" });
    }
    const lit = (t) => Math.floor(t) % 2 === 1;
    window.__a = await make(
      "Get well test.webm",
      4.2,
      (x, t) => {
        const v = lit(t) ? 220 : 50;
        x.fillStyle = `rgb(${v + 30},${v},${v - 30})`;
        x.fillRect(0, 0, 320, 180);
        x.fillStyle = "#333";
        for (let i = 0; i < 8; i++) x.fillRect(i * 40 + 5, 60 + 20 * Math.sin(i), 20, 40);
      },
      (t) => (lit(t) ? 0.5 : 0.03)
    );
    /* A letterboxed clip: bright grey picture between black bars. */
    window.__lb = await make(
      "Letterboxed.webm",
      2.2,
      (x) => {
        x.fillStyle = "#000";
        x.fillRect(0, 0, 320, 180);
        x.fillStyle = "#c8c8c8";
        x.fillRect(0, 40, 320, 100);
        x.fillStyle = "#555";
        x.fillRect(100, 70, 40, 40);
      },
      () => 0.1
    );
    window.__b = await make(
      "My test clip.webm",
      4.2,
      (x, t) => {
        x.fillStyle = "#808080";
        x.fillRect(0, 0, 320, 180);
        x.fillStyle = "#204060";
        x.fillRect(40 + t * 50, 70, 40, 40);
        x.fillStyle = "#602020";
        x.fillRect(200, 20 + t * 20, 30, 30);
      },
      () => 0.1
    );
  });
  ok(true, "two clips recorded in the page");

  const lb = await page.evaluate(async () => {
    const c = await window.CurioClip.open(window.__lb, "Letterboxed.webm");
    const d = await window.CurioClip.dissect(c);
    return { luma: d.raw.luma[3], aspect: d.aspect };
  });
  ok(lb.luma > 0.6 && lb.aspect < 0.4, "black bars are left out of the measures: " + JSON.stringify(lb));

  if (MP) {
    const b = "http://127.0.0.1:" + server.address().port + "/__mp/";
    await page.evaluate((b) => window.CurioMask.configure({ lib: b + "package/vision_bundle.mjs", wasm: b + "package/wasm", models: { parts: b + "selfie_multiclass_256x256.tflite" } }), b);
    ok(await page.evaluate(() => window.CurioMask.load()), "the AI cut-out loads (MediaPipe in the browser)");
  }
  await page.evaluate(() => window.CurioVideoUI.open());
  ok(await page.isVisible(".vd-page"), "the window opens");
  ok((await page.locator(".vd-drop").count()) === 2, "two drop boxes to start");
  await page.evaluate(() => window.CurioVideoUI.bring("a", window.__a));
  await page.evaluate(() => window.CurioVideoUI.bring("b", window.__b));
  const st = await page.evaluate(() => {
    const s = window.CurioVideoUI.state();
    return { a: s.a && { nodes: s.a.nodes, raw: !!s.a.raw.db, dur: s.a.duration }, b: !!s.b };
  });
  ok(st.a && st.b, "both clips are taken apart");
  ok(st.a && st.a.raw, "the inspiration's sound is read");
  const key = st.a && st.a.nodes.valueKey;
  ok(key && key.length >= 3, "the light lane changes as the clip goes dark and bright: " + JSON.stringify(key));
  ok((await page.locator(".vd-lane").count()) >= 15, "a lane per curiosity: " + (await page.locator(".vd-lane").count()));
  ok((await page.locator(".vd-ai").count()) === 1, "the AI cut-outs box shows");
  if (MP) {
    const el = await page.evaluate(() => {
      const s = window.CurioVideoUI.state();
      return s.a.elements && { n: s.a.elements.times.length, parts: Object.keys(s.a.elements.parts) };
    });
    ok(el && el.n >= 2 && el.parts.includes("clothes"), "each clip's elements are found automatically: " + JSON.stringify(el));
    ok((await page.locator("text=Elements (AI cut-outs)").count()) === 1, "element lanes show");
    await page.click('[data-act="ai-preview"]');
    ok(/Blue: clothes/.test(await page.textContent(".vd-note")), "Show what it found tints the cut-out");
  }
  ok((await page.locator(".vd-node").count()) >= 3, "nodes drawn where values change");
  await page.screenshot({ path: path.join(SHOTS, "video-lanes.png"), fullPage: false });

  /* Onto My film. */
  await page.click('[data-act="to-film"]');
  const lanes = await page.evaluate(() => Object.keys(window.CurioEngine.state().lanes).filter((k) => /valueKey|volume/.test(k)));
  ok(lanes.length >= 2, "lanes put on My film: " + lanes.join(", "));
  const said = await page.textContent(".vd-note");
  ok(/Put \d+ lanes on My film/.test(said), "says what it did: " + said);

  /* Light only, then check. */
  await page.click('[data-all="0"]');
  await page.check('[data-on="light"]');
  await page.click('[data-act="check"]');
  await page.waitForFunction(() => window.CurioVideoUI.state().checks && window.CurioVideoUI.state().checks.light, null, { timeout: 120000 });
  const light = await page.evaluate(() => window.CurioVideoUI.state().checks.light);
  ok(light.corrAfter > 0.7 && light.corrAfter > light.corrBefore + 0.3, "your clip now goes light and dark with the inspiration: " + JSON.stringify(light));
  ok((await page.locator(".vd-check .good").count()) === 1, "the check shows on the light row");

  /* Everything, played and saved. */
  await page.click('[data-all="1"]');
  ok((await page.locator(".vd-dialogue li").count()) >= 1, "new lines fitted to the inspiration's talking");
  await page.click('[data-act="save"]');
  await page.waitForSelector(".vd-actions a[download]", { timeout: 60000 });
  const size = await page.evaluate(async () => (await (await fetch(document.querySelector(".vd-actions a[download]").href)).blob()).size);
  ok(size > 10000, "a saved video: " + size + " bytes");
  await page.screenshot({ path: path.join(SHOTS, "video-applied.png"), fullPage: false });

  /* Swap: your clip becomes the inspiration. */
  const before = await page.evaluate(() => window.CurioVideoUI.state().a.name);
  await page.click('[data-act="swap"]');
  const after = await page.evaluate(() => window.CurioVideoUI.state().a.name);
  ok(before !== after && /My test clip/.test(after), "swap puts your clip first");

  /* The Screen's bar has the button. */
  await page.click('[data-act="close"]');
  ok(!(await page.isVisible(".vd-page")), "closes");
  if (await page.evaluate(() => !!window.CurioScreen)) {
    await page.evaluate(() => window.CurioScreen.open());
    await page.waitForSelector(".sc-bar [data-video-open]", { timeout: 5000 }).catch(() => {});
    ok((await page.locator(".sc-bar [data-video-open]").count()) === 1, "the Screen's bar has Import a video");
    await page.click(".sc-bar [data-video-open]");
    ok(await page.isVisible(".vd-page"), "and it opens the window");
  }
  ok(errors.length === 0, "no page errors" + (errors.length ? ": " + errors.slice(0, 5).join(" | ") : ""));
  await browser.close();
  server.close();
  console.log(failed ? `\n${failed} failed` : "\nall passed");
  process.exit(failed ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
