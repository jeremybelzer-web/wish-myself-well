/* The Momentum curve tab in a real browser:
     NODE_PATH=/opt/node22/lib/node_modules node apps/curiosities/momentum/tests/curve-browser.js [--three <three.min.js>] [--shots <dir>]
   Opens the app's index.html (adding momentum/load.js if the page does not have it yet), opens Momentum, opens
   the "Momentum curve" tab, draws a curated film with another laid over it, hovers the chart, changes the
   window, draws the engine's film and clicks a sag to move the Screen's playhead, then checks a phone width.
   The page must report no errors. Screenshots go to --shots (default: the system temp folder). */
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
    await page.waitForFunction(() => window.CurioMomentumUI && window.CurioCurve, null, { timeout: 10000 });
  }

  const page = await newPage({ width: 1360, height: 900 });
  await openApp(page);
  await page.evaluate(() => {
    document.getElementById("lib-btn").click();
  });
  await page.click("#lib-menu [data-momentum]");
  await page.waitForSelector(".mo-dlg[open]");
  ok(!!(await page.$('.mo-dlg [data-tab="curve"]')), 'Momentum has a "Momentum curve" tab');
  await page.click('.mo-dlg [data-tab="curve"]');
  const study = await page.$$eval(".mo-dlg [data-cv-source] option", (o) => o.map((x) => x.value).filter((v) => v.startsWith("study:")));
  ok(study.length >= 2, `curated films to draw: ${study.length}`);
  await page.selectOption(".mo-dlg [data-cv-source]", study.find((s) => /diner/.test(s)) || study[0]);
  await page.waitForSelector(".mo-dlg .mcv-svg");
  const drawn = await page.evaluate(() => {
    const me = document.querySelector(".mo-dlg .mcv-line-me");
    const them = document.querySelector(".mo-dlg .mcv-line-them");
    return {
      me: !!me && getComputedStyle(me).stroke,
      them: !!them && getComputedStyle(them).strokeDasharray,
      ends: [...document.querySelectorAll(".mo-dlg .mcv-end")].map((t) => t.textContent),
      thirds: [...document.querySelectorAll(".mo-dlg .mcv-third-l")].map((t) => t.textContent),
      grid: document.querySelectorAll(".mo-dlg .mcv-grid").length,
      sags: document.querySelectorAll(".mo-dlg .mcv-sag-item").length,
      label: document.querySelector(".mo-dlg .mcv-svg").getAttribute("aria-label"),
    };
  });
  ok(drawn.me === "rgb(42, 120, 214)", "your film is a blue line: " + drawn.me);
  ok(drawn.them && drawn.them !== "none", "the comparison is a dashed line: " + drawn.them);
  ok(drawn.ends.length === 2 && drawn.ends[0] === "Your film", "each line is labeled at its end: " + drawn.ends.join(" / "));
  ok(drawn.thirds.join() === "Beginning,Middle,End", "the film is marked in thirds");
  ok(drawn.grid === 6, "light gridlines at 0 to 5");
  ok(/Average momentum by third/.test(drawn.label), "the chart describes itself for screen readers");
  ok(drawn.sags >= 1, `the diner scene lists its sags (${drawn.sags})`);
  const hit = await page.$(".mo-dlg .mcv-hit");
  const hb = await hit.boundingBox();
  await page.mouse.move(hb.x + hb.width * 0.55, hb.y + hb.height / 2);
  const tip = await page.evaluate(() => {
    const t = document.querySelector(".mo-dlg .mcv-tip");
    return t && !t.hidden ? t.textContent : "";
  });
  ok(/momentum \d/.test(tip) && /\d:\d\d/.test(tip), "pointing at the chart shows the moment, value and what held attention: " + tip);
  await page.screenshot({ path: path.join(SHOTS, "curve-study.png") });
  await page.evaluate(() => (document.querySelector(".mo-dlg").scrollTop = 600));
  await page.screenshot({ path: path.join(SHOTS, "curve-study-sags.png") });
  const before = await page.$eval(".mo-dlg .mcv-line-me", (p) => p.getAttribute("d"));
  await page.selectOption(".mo-dlg [data-cv-win]", "60");
  const after = await page.$eval(".mo-dlg .mcv-line-me", (p) => p.getAttribute("d"));
  ok(before !== after, "changing the window redraws the line");
  await page.selectOption(".mo-dlg [data-cv-win]", "15");
  await page.selectOption(".mo-dlg [data-cv-cmp]", "none");
  ok((await page.$$(".mo-dlg .mcv-line-them")).length === 0, "No other film removes the gray line");

  /* The engine's film: a sag moves the Screen's playhead there. */
  await page.evaluate(() => window.CurioEngine.send({ type: "importFilm", film: window.CurioSeeds.starter() }));
  await page.evaluate(() => window.CurioMomentumUI.draw());
  await page.selectOption(".mo-dlg [data-cv-source]", "engine");
  await page.waitForSelector(".mo-dlg .mcv-svg, .mo-dlg .mo-empty");
  const eng = await page.evaluate(() => ({ rows: window.CurioEngine.state().rows.length, sags: document.querySelectorAll(".mo-dlg [data-cv-sag]").length, screen: !!(window.CurioScreen && window.CurioScreen.setRow) }));
  ok(eng.rows > 0, `the engine's film draws (${eng.rows} moments)`);
  if (!eng.sags) {
    /* The starter film may move along too well for a sag at the usual limit: wear it down with a short one. */
    await page.click('.mo-dlg [data-tab="attention"]');
    await page.fill('.mo-dlg input[data-m="limit"]', "3");
    await page.evaluate(() => document.querySelector('.mo-dlg input[data-m="limit"]').dispatchEvent(new Event("change", { bubbles: true })));
    await page.click('.mo-dlg [data-tab="curve"]');
  }
  const sagBtn = await page.$(".mo-dlg [data-cv-sag]");
  if (!sagBtn) ok(false, "the engine's film has a sag to click");
  else {
    const want = await page.evaluate(() => {
      const b = document.querySelector(".mo-dlg [data-cv-sag]");
      return Number(/moment (\d+)/.exec(b.textContent)[1]) - 1;
    });
    const r0 = await page.evaluate(() => window.CurioScreen.row());
    await sagBtn.click();
    const r1 = await page.evaluate(() => window.CurioScreen.row());
    const said = await page.evaluate(() => (document.querySelector(".mo-dlg .mcv-said") || {}).textContent || "");
    ok(r1 === want && /playhead/.test(said), `clicking a sag moves the Screen's playhead to moment ${want + 1} (was ${r0 + 1}, now ${r1 + 1})`);
  }
  await page.screenshot({ path: path.join(SHOTS, "curve-engine.png") });
  await page.evaluate(() => {
    const el = document.querySelector('.mo-dlg [data-tab="attention"]');
    if (el) el.click();
  });
  await page.fill('.mo-dlg input[data-m="limit"]', "").catch(() => {});
  await page.evaluate(() => {
    const el = document.querySelector('.mo-dlg input[data-m="limit"]');
    if (el) el.dispatchEvent(new Event("change", { bubbles: true }));
  });

  /* Phone width: no sideways scroll, the chart fits and still answers a tap. */
  const phone = await newPage({ width: 375, height: 800 });
  await openApp(phone);
  await phone.evaluate(() => window.CurioMomentumUI.open("curve"));
  await phone.waitForSelector(".mo-dlg .mcv-svg, .mo-dlg .mo-empty");
  const firstStudy = await phone.$$eval(".mo-dlg [data-cv-source] option", (o) => o.map((x) => x.value).find((v) => v.startsWith("study:")));
  await phone.selectOption(".mo-dlg [data-cv-source]", firstStudy);
  await phone.waitForSelector(".mo-dlg .mcv-svg");
  const fit = await phone.evaluate(() => {
    const d = document.querySelector(".mo-dlg");
    const svg = document.querySelector(".mo-dlg .mcv-svg").getBoundingClientRect();
    return { page: document.documentElement.scrollWidth - window.innerWidth, dlg: d.scrollWidth - d.clientWidth, svgRight: svg.right, w: window.innerWidth };
  });
  ok(fit.page <= 0 && fit.dlg <= 0, `no sideways scroll at phone width (page ${fit.page}px, window ${fit.dlg}px over)`);
  ok(fit.svgRight <= fit.w, `the chart fits the phone (${Math.round(fit.svgRight)} of ${fit.w})`);
  await phone.$eval(".mo-dlg .mcv-svg", (s) => s.scrollIntoView({ block: "center" }));
  const pb = await (await phone.$(".mo-dlg .mcv-hit")).boundingBox();
  await phone.mouse.click(pb.x + pb.width * 0.3, pb.y + pb.height / 2);
  ok(await phone.evaluate(() => !document.querySelector(".mo-dlg .mcv-tip").hidden), "a tap shows the moment");
  await phone.screenshot({ path: path.join(SHOTS, "curve-phone.png"), fullPage: true });

  ok(errors.length === 0, "no page errors" + (errors.length ? ": " + errors.slice(0, 3).join(" | ") : ""));
  await browser.close();
  server.close();
  console.log(failed ? `\n${failed} failed` : "\nall curve browser checks passed");
  process.exit(failed ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
