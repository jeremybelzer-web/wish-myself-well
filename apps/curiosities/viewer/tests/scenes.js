/* Scenes, scene colors, picking several storyboards and the zoom (Jeremy, 2026-10-06):
   node apps/curiosities/viewer/tests/scenes.js (needs Playwright and Chromium; set NODE_PATH if not local).

   The sample is one scene. "✂ New scene here" splits it, the storyboards of each scene get their own color and
   the first one its name; the zoom at the top of Front and center shows This scene (following the playhead),
   Whole film, or a span set with the slider; Shift+click on the storyboards picks several panels, which fills the
   lanes with just those and turns the pie into the attention across them; ✕ Unpick goes back; undo takes the
   scene out again; no page errors. */
const http = require("http");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { chromium } = require("playwright");

const args = process.argv.slice(2);
const arg = (n, d) => (args.includes(n) ? args[args.indexOf(n) + 1] : d);
const SHOTS = arg("--shots", "");
const ROOT = path.join(__dirname, "..", "..");
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".webmanifest": "application/manifest+json" };

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
  const base = `http://127.0.0.1:${server.address().port}/index.html`;
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(base + "?viewer=1");
  await page.evaluate(() => {
    localStorage.removeItem("curiosities-viewer-v1");
    localStorage.removeItem("curio-focus-zoom-v1");
  });
  await page.reload();
  await page.waitForFunction(() => window.CurioViewer && CurioViewer.isOpen() && window.CurioScenes && document.querySelector(".cv-under .cf-zoom"), null, { timeout: 20000 });
  const L = (fn) => page.evaluate(fn);

  ok((await L(() => CurioScenes.list().length)) === 1, "the sample film is one scene");
  ok(await page.isVisible(".cv-strip-head .cs-tools"), "the storyboard's top row has the scene tools");

  /* split at panel 6 */
  await L(() => CurioViewer.select(5));
  await page.click('.cv-strip-head [data-cs="split"]');
  await page.waitForTimeout(200);
  const sc = await L(() => CurioScenes.list());
  ok(sc.length === 2 && sc[1].first === 5 && sc[0].last === 4, `✂ New scene here starts scene 2 at panel 6 (${sc.map((s) => s.first + "-" + s.last).join(", ")})`);
  const colors = await L(() => [0, 4, 5, 9].map((i) => getComputedStyle(document.querySelector(`.cv-card[data-i="${i}"]`)).borderTopColor));
  ok(colors[0] === colors[1] && colors[2] === colors[3] && colors[0] !== colors[2], `each scene's storyboards have their own color (${colors.join(" / ")})`);
  ok((await L(() => (document.querySelector('.cv-card[data-i="5"] .cs-tag') || {}).textContent || "")).startsWith("Scene 2"), "the first storyboard of scene 2 carries its name");
  ok(await page.isVisible('.cv-strip-head [data-cs="join"]'), "on a scene's first panel the button offers Join the scene before");

  /* zoom: This scene follows the playhead */
  await page.click('.cv-under [data-cf-zoom="scene"]');
  await L(() => CurioViewer.select(1));
  await page.waitForTimeout(200);
  const what1 = await L(() => document.querySelector(".cf-zwhat").textContent);
  ok(/Scene 1: .* \(of 2\)/.test(what1), `This scene shows scene 1 when the playhead is in it (${what1})`);
  await L(() => CurioViewer.select(7));
  await page.waitForTimeout(200);
  const what2 = await L(() => document.querySelector(".cf-zwhat").textContent);
  ok(/Scene 2 \(of 2\)/.test(what2), `and follows the playhead into scene 2 (${what2})`);
  await page.click('.cv-under [data-cf-tab="moments"]');
  await page.waitForTimeout(150);
  const lead = await L(() => {
    const row = document.querySelector(".cf-lead").getBoundingClientRect();
    const bs = [...document.querySelectorAll(".cf-lead button")].map((b) => b.getBoundingClientRect());
    return { wide: bs.some((b) => b.width > row.width * 0.1), off: bs.some((b) => b.right <= row.left + 1 || b.left >= row.right - 1) };
  });
  ok(lead.wide && lead.off, "zoomed in, the blocks are bigger and the other scene's blocks are off to the side");

  await page.click('.cv-under [data-cf-zoom="film"]');
  await page.waitForTimeout(200);
  const what3 = await L(() => document.querySelector(".cf-zwhat").textContent);
  ok(/scenes 1 to 2 of 2/.test(what3), `Whole film shows every scene (${what3})`);
  const scb = await L(() => document.querySelectorAll(".cf-scene .cf-scb").length);
  ok(scb === 2, "the Moments rows have a Scene row with a block per scene");

  /* the slider */
  await page.evaluate(() => {
    const r = document.querySelector(".cf-zr");
    r.value = "80";
    r.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await page.waitForTimeout(200);
  const span = await L(() => {
    const m = /(\d+):([\d.]+) to (\d+):([\d.]+)/.exec(document.querySelector(".cf-zwhat").textContent);
    return m ? +m[3] * 60 + +m[4] - (+m[1] * 60 + +m[2]) : -1;
  });
  ok(span > 0 && span < 8, `the zoom slider shows a few seconds at a time (${span.toFixed(1)} s)`);
  await page.click('.cv-under [data-cf-zoom="out"]');
  await page.waitForTimeout(200);
  const span2 = await L(() => {
    const m = /(\d+):([\d.]+) to (\d+):([\d.]+)/.exec(document.querySelector(".cf-zwhat").textContent);
    return m ? +m[3] * 60 + +m[4] - (+m[1] * 60 + +m[2]) : -1;
  });
  ok(span2 > span, `− zooms out (${span2.toFixed(1)} s)`);

  /* pick panels 3 to 5 with Shift+click */
  await page.click('.cv-under [data-cf-zoom="film"]');
  await L(() => CurioViewer.select(2));
  await page.locator('.cv-card[data-i="2"]').scrollIntoViewIfNeeded();
  await page.click('.cv-card[data-i="2"]');
  await page.locator('.cv-card[data-i="4"]').scrollIntoViewIfNeeded();
  await page.click('.cv-card[data-i="4"]', { modifiers: ["Shift"] });
  await page.waitForTimeout(250);
  const pk = await L(() => CurioScenes.picked());
  ok(pk && pk.first === 2 && pk.last === 4 && pk.panels.length === 3, "Shift+click picks panels 3 to 5");
  ok((await L(() => document.querySelectorAll(".cv-card.cs-picked").length)) === 3, "the picked storyboards are marked");
  const what4 = await L(() => document.querySelector(".cf-zwhat").textContent);
  ok(/Picked panels 3 to 5/.test(what4), `the lanes show just the picked panels (${what4})`);
  ok(await L(() => document.querySelector(".cf-pie").classList.contains("cf-across")), "the pie is the attention across the picked panels");
  const pieSig = await L(() => document.querySelector(".cf-list").dataset.sig || "");
  ok(/^2-4:/.test(pieSig), "the list beside the pie is the picked panels'");
  await page.click('.cv-card[data-i="6"]', { modifiers: ["Control"] });
  await page.waitForTimeout(150);
  ok((await L(() => CurioScenes.picked().panels.join(","))) === "2,3,4,6", "Ctrl+click adds one more panel");
  await page.click('.cv-under [data-cf-zoom="unpick"]');
  await page.waitForTimeout(150);
  ok((await L(() => CurioScenes.picked())) === null && !(await L(() => document.querySelector(".cf-pie").classList.contains("cf-across"))), "✕ Unpick goes back to the playhead");

  /* undo takes the new scene out */
  await L(() => CurioViewer.undo());
  await page.waitForTimeout(150);
  ok((await L(() => CurioScenes.list().length)) === 1, "undo takes the new scene out again");

  ok(errors.length === 0, "no page errors" + (errors.length ? ": " + errors.join(" | ") : ""));
  await browser.close();
  server.close();
  console.log(fails ? `${fails} failed` : "all passed");
  process.exit(fails ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
