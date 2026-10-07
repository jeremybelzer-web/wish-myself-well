/* Who we watch in a real browser: node apps/curiosities/momentum/tests/characters-browser.js [--three <three.min.js>] [--shots <dir>]
   (needs Playwright and Chromium; set NODE_PATH to where Playwright is installed if it is not local).
   Opens the app, opens Momentum, opens "Who we watch": a film with no characters says so and offers the
   engine's film; the engine's film draws a bar per character, the strip and the families; clicking a moment
   moves the Screen's playhead; no page errors; no sideways scroll at 375px. Screenshots go to --shots. */
const http = require("http");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { chromium } = require("playwright");

const args = process.argv.slice(2);
const arg = (n, d) => (args.includes(n) ? args[args.indexOf(n) + 1] : d);
const SHOTS = arg("--shots", os.tmpdir());
const ROOT = path.join(__dirname, "..", "..");
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".webmanifest": "application/manifest+json" };

function serve() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const p = path.join(ROOT, decodeURIComponent(req.url.split("?")[0]).replace(/^\/+/, ""));
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
  fs.mkdirSync(SHOTS, { recursive: true });
  const server = await serve();
  const base = "http://127.0.0.1:" + server.address().port + "/";
  const browser = await chromium.launch();
  const errors = [];
  const three = arg("--three", "");
  async function newPage(viewport) {
    const page = await browser.newPage({ viewport });
    page.on("pageerror", (e) => errors.push(String(e && e.message)));
    page.on("console", (m) => m.type() === "error" && !/Failed to load resource|favicon|fonts\.g/.test(m.text()) && errors.push(m.text()));
    await page.route(/three\.min\.js$/, (r) => (three ? r.fulfill({ contentType: "text/javascript", body: fs.readFileSync(three, "utf8") }) : r.fulfill({ contentType: "text/javascript", body: "" })));
    await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
    return page;
  }
  async function openApp(page) {
    await page.goto(base + "index.html");
    if (!(await page.evaluate(() => !!document.querySelector('script[src="momentum/load.js"]')))) {
      await page.evaluate(() => {
        const s = document.createElement("script");
        s.src = "momentum/load.js";
        document.body.appendChild(s);
      });
    }
    await page.waitForFunction(() => window.CurioMomentumUI && window.CurioWatch && window.CurioEngine, null, { timeout: 10000 });
    /* Ida, Bo and Cy, where Cy never moves. */
    await page.evaluate(() => {
      const E = window.CurioEngine;
      E.send({ type: "importFilm", film: window.CurioSeeds.starter() });
      const st = E.state();
      const chars = st.tracks.filter((t) => t.kind === "character");
      const names = ["Ida", "Bo"];
      const cmds = [];
      chars.forEach((t, i) => names[i] && cmds.push({ type: "renameTrack", track: t.id, label: names[i] }));
      if (cmds.length) E.send({ type: "batch", label: "test names", commands: cmds });
    });
  }

  const page = await newPage({ width: 1360, height: 900 });
  await openApp(page);
  await page.evaluate(() => document.getElementById("lib-btn").click());
  await page.click("#lib-menu [data-momentum]");
  await page.waitForSelector(".mo-dlg[open]");
  ok(!!(await page.$('.mo-dlg [data-tab="watch"]')), 'Momentum has a "Who we watch" tab');
  await page.click('.mo-dlg [data-tab="watch"]');
  /* A curated film has no characters. */
  const study = await page.$$eval(".mo-dlg select[data-watch-source] option", (o) => o.map((x) => x.value).find((v) => v.startsWith("study:")));
  await page.selectOption(".mo-dlg select[data-watch-source]", study);
  const none = await page.evaluate(() => (document.querySelector(".mo-dlg .mo-w-none") || {}).textContent || "");
  ok(/no characters/.test(none), "a curated film says plainly it has no characters");
  await page.screenshot({ path: path.join(SHOTS, "watch-none.png") });
  ok(!!(await page.$('.mo-dlg [data-watch="engine"]')), "and offers the engine's film");
  await page.click('.mo-dlg [data-watch="engine"]');
  await page.waitForSelector(".mo-dlg .mo-w-strip");
  const drawn = await page.evaluate(() => ({
    bars: document.querySelectorAll(".mo-dlg .mo-w-bars .mo-w-row").length,
    chars: window.CurioEngine.state().tracks.filter((t) => t.kind === "character").length,
    strip: document.querySelectorAll(".mo-dlg .mo-w-strip button").length,
    rows: window.CurioEngine.state().rows.length,
    fams: document.querySelectorAll(".mo-dlg .mo-w-fams li").length,
    text: document.querySelector(".mo-dlg .mo-ext").textContent,
  }));
  ok(drawn.bars >= drawn.chars && drawn.chars > 0, `a bar per character (${drawn.bars} bars, ${drawn.chars} characters)`);
  ok(drawn.strip === drawn.rows, `the strip has a cell per moment (${drawn.strip} of ${drawn.rows})`);
  ok(drawn.fams === drawn.chars, "each character's families are listed");
  ok(/Ida/.test(drawn.text) && /Longest unwatched|Never watched/.test(drawn.text), "names and unwatched stretches show");
  await page.screenshot({ path: path.join(SHOTS, "watch-engine.png") });
  /* An engine change redraws the tab. */
  await page.evaluate(() => {
    const E = window.CurioEngine;
    const st = E.state();
    const t = st.tracks.find((x) => x.kind === "character" && x.label === "Bo");
    /* Moment 2: Ida's voice rises one step; Bo's now jumps to the top, so Bo takes attention. */
    E.send({ type: "batch", label: "test Bo", commands: [{ type: "setPoint", row: st.rows[0].id, track: t.id, curiosity: "volume", value: 1 }, { type: "setPoint", row: st.rows[1].id, track: t.id, curiosity: "volume", value: 5 }] });
  });
  await page.waitForTimeout(100);
  const bo = await page.evaluate(() => {
    const r = window.CurioWatch.fromEngine({ secondsPerBeat: 3 });
    const t = window.CurioEngine.state().tracks.find((x) => x.label === "Bo");
    return [r.strip[1].who, t.id, document.querySelector(".mo-dlg .mo-w-strip button:nth-child(2)").getAttribute("title")];
  });
  ok(bo[0] === bo[1] && /Bo/.test(bo[2]), "a bigger change on Bo's track gives Bo attention, and the tab redraws: " + bo[2]);
  ok(await page.evaluate(() => !!document.querySelector(".mo-dlg .mo-w-strip")), "the tab still draws after an engine change");
  /* Clicking a moment with no Screen says how to move the playhead. */
  await page.click(".mo-dlg .mo-w-strip button:nth-child(3)");
  const said = await page.evaluate(() => document.querySelector(".mo-dlg .mo-w-said").textContent);
  ok(/Moment 3/.test(said), "clicking a moment names it: " + said);
  /* With a Screen, the playhead moves. */
  const moved = await page.evaluate(() => {
    const had = window.CurioScreen;
    let got = null;
    if (!had || typeof had.setRow !== "function") window.CurioScreen = { setRow: (i) => (got = i) };
    else {
      const orig = had.setRow;
      had.setRow = (i) => ((got = i), orig.call(had, i));
    }
    document.querySelector(".mo-dlg .mo-w-strip button:nth-child(5)").click();
    if (!had) delete window.CurioScreen;
    return got;
  });
  ok(moved === 4, "clicking a moment moves the Screen's playhead (to index " + moved + ")");
  await page.keyboard.press("Escape");

  /* Phone width. */
  const phone = await newPage({ width: 375, height: 800 });
  await openApp(phone);
  await phone.evaluate(() => {
    window.CurioMomentumUI.open("watch");
    const sel = document.querySelector(".mo-dlg select[data-watch-source]");
    if (sel && sel.value !== "engine") document.querySelector('.mo-dlg [data-watch="engine"]').click();
  });
  await phone.waitForSelector(".mo-dlg .mo-w-strip");
  const wide = await phone.evaluate(() => {
    const d = document.querySelector(".mo-dlg");
    return Math.max(document.documentElement.scrollWidth - window.innerWidth, d.scrollWidth - d.clientWidth);
  });
  ok(wide <= 0, `no sideways scroll at 375px (${wide}px over)`);
  await phone.screenshot({ path: path.join(SHOTS, "watch-phone.png") });
  await phone.evaluate(() => (document.querySelector(".mo-dlg").scrollTop = 500));
  await phone.screenshot({ path: path.join(SHOTS, "watch-phone-2.png") });

  ok(errors.length === 0, "no page errors" + (errors.length ? ": " + errors.slice(0, 5).join(" | ") : ""));
  await browser.close();
  server.close();
  console.log(failed ? `\n${failed} failed` : "\nall passed");
  process.exit(failed ? 1 : 0);
})();
