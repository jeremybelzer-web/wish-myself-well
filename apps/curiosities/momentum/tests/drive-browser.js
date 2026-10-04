/* The Story drive tab in a real browser:
     NODE_PATH=/opt/node22/lib/node_modules node apps/curiosities/momentum/tests/drive-browser.js [--three <three.min.js>] [--shots <dir>]
   Opens the app's index.html (adding momentum/load.js if the page does not have it yet), opens Momentum, opens
   the "Story drive" tab, reads a curated film (headline, strip, legend, every move, comparison), then the
   engine's film worn down so attention moves with no story: an empty stretch, "Make this move here" (one undo
   step that raises the share), Undo, then a phone width. The page must report no errors. Screenshots go to
   --shots (default: the system temp folder). */
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

/* The engine's starter film, worn down: the shot size and the place take turns changing, nothing else moves. */
function decorate() {
  const E = window.CurioEngine;
  E.send({ type: "importFilm", film: window.CurioSeeds.starter() });
  const st = E.state();
  const sizes = ["wide", "close", "medium", "insert"];
  const places = window.CurioScale.domain("setting").options;
  const cmds = [];
  st.rows.forEach((row, i) => {
    cmds.push({ type: "setPoint", row: row.id, track: "camera", curiosity: "shotSize", value: sizes[Math.floor((i + 1) / 2) % sizes.length] });
    cmds.push({ type: "setPoint", row: row.id, track: "master", curiosity: "setting", value: places[Math.floor(i / 2) % places.length] });
    cmds.push({ type: "setPoint", row: row.id, track: "master", curiosity: "emotion", value: "curious" });
    cmds.push({ type: "setPoint", row: row.id, track: "char1", curiosity: "volume", value: 2 });
    cmds.push({ type: "setPoint", row: row.id, track: "char2", curiosity: "volume", value: 2 });
  });
  ["shotSize@camera", "setting@master", "emotion@master", "volume@char1", "volume@char2"].forEach((k) => {
    const [c, t] = k.split("@");
    cmds.push({ type: "laneMode", track: t, curiosity: c, mode: "hold" });
  });
  return E.send({ type: "batch", label: "test: decorate", commands: cmds }).ok;
}

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
    await page.waitForFunction(() => window.CurioMomentumUI && window.CurioDrive, null, { timeout: 10000 });
  }

  const page = await newPage({ width: 1360, height: 900 });
  await openApp(page);
  await page.evaluate(() => document.getElementById("lib-btn").click());
  await page.click("#lib-menu [data-momentum]");
  await page.waitForSelector(".mo-dlg[open]");
  ok(!!(await page.$('.mo-dlg [data-tab="drive"]')), 'Momentum has a "Story drive" tab');
  await page.click('.mo-dlg [data-tab="drive"]');
  await page.waitForSelector(".mo-dlg .mdr");
  const study = await page.$$eval(".mo-dlg [data-dr-source] option", (o) => o.map((x) => x.value).filter((v) => v.startsWith("study:")));
  ok(study.length >= 2, `curated films to read: ${study.length}`);
  await page.selectOption(".mo-dlg [data-dr-source]", study.find((s) => /diner/.test(s)) || study[0]);
  await page.waitForSelector(".mo-dlg .mdr-strip");
  const other = study.find((s) => /dinner-party/.test(s)) || study[1];
  await page.selectOption(".mo-dlg [data-dr-also]", other);
  await page.waitForSelector(".mo-dlg .mdr-cmp-row:nth-child(3)");
  const read = await page.evaluate(() => ({
    head: document.querySelector(".mo-dlg .mdr-head").textContent,
    cells: [...document.querySelectorAll(".mo-dlg .mdr-cell:not(.mdr-start)")].map((c) => c.textContent),
    legend: [...document.querySelectorAll(".mo-dlg .mdr-legend li")].map((l) => l.textContent.trim()),
    rows: document.querySelectorAll(".mo-dlg .mdr-table tbody tr").length,
    cmp: [...document.querySelectorAll(".mo-dlg .mdr-cmp-row")].map((r) => r.textContent.replace(/\s+/g, " ").trim()),
    text: document.querySelector(".mo-dlg .mdr").textContent,
  }));
  ok(/^\d+ of \d+ times attention moves, the story moves too\.$|^Every one of/.test(read.head), "a plain headline: " + read.head);
  ok(read.cells.length >= 3 && read.cells.every((c) => ["P", "C", "T", "D", ""].includes(c)), "the strip has a letter for each move: " + read.cells.join(""));
  ok(read.legend.length === 4 && /Plot/.test(read.legend[0]) && /Decoration only/.test(read.legend[3]), "the legend names the four kinds: " + read.legend.join(" / "));
  ok(read.rows >= 3, `every move is listed with its reason (${read.rows})`);
  ok(read.cmp.length >= 3 && /^Your film/.test(read.cmp[0]) && read.cmp.some((r) => /estimate/.test(r) && /no share/.test(r)), "the comparison shows your film, an estimate with no number, and the other film: " + read.cmp.join(" | "));
  ok(!/—/.test(read.text), "no em-dashes in the tab");
  await page.screenshot({ path: path.join(SHOTS, "drive-study.png") });
  await page.evaluate(() => (document.querySelector(".mo-dlg").scrollTop = 700));
  await page.screenshot({ path: path.join(SHOTS, "drive-study-more.png") });

  /* The engine's film: an empty stretch and Make this move here, one undo step. */
  ok(await page.evaluate(decorate), "the engine's film is worn down to decoration");
  await page.evaluate(() => window.CurioMomentumUI.draw());
  await page.selectOption(".mo-dlg [data-dr-source]", "engine");
  await page.waitForSelector(".mo-dlg [data-dr-move]");
  const share = () => page.evaluate(() => window.CurioDrive.drive(window.CurioMomentumEngine.beats(), {}).totals.driving);
  const d0 = await share();
  const u0 = await page.evaluate(() => window.CurioEngine.history().undo.length);
  await page.evaluate(() => (document.querySelector(".mo-dlg").scrollTop = 0));
  await page.screenshot({ path: path.join(SHOTS, "drive-engine-before.png") });
  await page.click(".mo-dlg [data-dr-move]");
  const d1 = await share();
  const u1 = await page.evaluate(() => window.CurioEngine.history().undo.length);
  const flash = await page.evaluate(() => (document.querySelector(".mo-dlg .mo-flash") || {}).textContent || "");
  ok(u1 === u0 + 1, `Make this move here is one undo step (${u0} to ${u1})`);
  ok(d1 > d0, `more moves drive the story after it (${d0} to ${d1})`);
  ok(/Undo takes it back/.test(flash), "it says what changed: " + flash);
  await page.screenshot({ path: path.join(SHOTS, "drive-engine-after.png") });
  await page.evaluate(() => window.CurioEngine.undo());
  ok((await share()) === d0, "Undo takes it back");

  /* Phone width: no sideways scroll. */
  const phone = await newPage({ width: 375, height: 800 });
  await openApp(phone);
  await phone.evaluate(() => window.CurioMomentumUI.open("drive"));
  await phone.waitForSelector(".mo-dlg .mdr");
  const firstStudy = await phone.$$eval(".mo-dlg [data-dr-source] option", (o) => o.map((x) => x.value).find((v) => /diner/.test(v)) || o.map((x) => x.value).find((v) => v.startsWith("study:")));
  await phone.selectOption(".mo-dlg [data-dr-source]", firstStudy);
  await phone.waitForSelector(".mo-dlg .mdr-strip");
  const fit = await phone.evaluate(() => {
    const d = document.querySelector(".mo-dlg");
    return { page: document.documentElement.scrollWidth - window.innerWidth, dlg: d.scrollWidth - d.clientWidth };
  });
  ok(fit.page <= 0 && fit.dlg <= 0, `no sideways scroll at phone width (page ${fit.page}px, window ${fit.dlg}px over)`);
  await phone.screenshot({ path: path.join(SHOTS, "drive-phone.png"), fullPage: true });
  await phone.evaluate(() => (document.querySelector(".mo-dlg").scrollTop = 900));
  await phone.screenshot({ path: path.join(SHOTS, "drive-phone-more.png") });

  ok(errors.length === 0, "no page errors" + (errors.length ? ": " + errors.slice(0, 3).join(" | ") : ""));
  await browser.close();
  server.close();
  console.log(failed ? `\n${failed} failed` : "\nall story drive browser checks passed");
  process.exit(failed ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
