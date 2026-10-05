/* Front and center, the lane under the Viewer's picture: node apps/curiosities/viewer/tests/focus-lane.js [--shots dir]
   (needs Playwright and Chromium; set NODE_PATH to where Playwright is installed if it is not local).

   The lane is under the picture with its three rows (Leading, With it, Suite). In the sample, the attention
   model puts something in front in every panel, one or two at a time; the phone coming into the scene sets off
   the cut to an insert of it (a proximity, marked ⚡ with what set it off); the line above names what is in
   front at the playhead and follows Play; clicking a block jumps there; an edit (hiding the phone) changes the
   reading; it fits a phone; no page errors. */
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
  await page.evaluate(() => localStorage.removeItem("curiosities-viewer-v1"));
  await page.reload();
  await page.waitForFunction(() => window.CurioViewer && CurioViewer.isOpen() && document.querySelector(".cv-under .cf-lead button"), null, { timeout: 20000 });

  ok(await page.isVisible(".cv-under"), "Front and center is under the picture");
  const box = await page.evaluate(() => {
    const a = document.querySelector(".cv-stage").getBoundingClientRect();
    const b = document.querySelector(".cv-under").getBoundingClientRect();
    const c = document.querySelector(".cv-transport").getBoundingClientRect();
    return { below: b.top >= a.bottom - 1, aboveTransport: b.bottom <= c.top + 1 };
  });
  ok(box.below && box.aboveTransport, "it sits right under the picture, above Play");
  const rows = await page.$$eval(".cv-under .cf-rows > span", (s) => s.map((x) => x.textContent));
  ok(rows.join() === "Leading,With it,Suite", "its rows: " + rows.join(", "));
  const r = await page.evaluate(() => CurioFocusLane.read());
  ok(r.length === 13 && r.every((p) => p.lead), "every panel has a curiosity in front (" + r.map((p) => p.lead).join(" / ") + ")");
  ok(r.every((p) => [p.lead, p.second].filter(Boolean).length <= 2), "one or two at a time");
  ok(r[4].leadId === "shotSize" && r[4].trigger === "an object enters", `panel 5: the phone coming in sets off the cut to an insert (${r[4].lead}, ${r[4].trigger})`);
  ok(r.filter((p) => p.trigger).length >= 2, "proximities fire (" + r.filter((p) => p.trigger).map((p) => p.panel + ": " + p.trigger).join(", ") + ")");
  ok(r.some((p) => p.suite), "a suite shows when most of it is on (" + r.filter((p) => p.suite).map((p) => p.panel + ": " + p.suite).join(", ") + ")");
  const bolts = await page.locator(".cv-under .cf-bolt").count();
  ok(bolts === r.filter((p) => p.trigger).length, `each proximity has a ⚡ on the lane (${bolts})`);

  await page.evaluate(() => CurioViewer.select(4));
  await page.waitForTimeout(200);
  const line5 = await page.textContent(".cv-under .cf-now");
  ok(/Shot size/.test(line5) && /set off by something else: an object enters \(panel 4\)/.test(line5), "the line says what is in front and what set it off: " + line5);
  if (SHOTS) await page.locator(".cv-player").screenshot({ path: path.join(SHOTS, "focus-lane.png") });

  ok(await page.isVisible(".cv-under .cf-pie") && await page.isVisible(".cv-under .cf-graph"), "the attention pie and graph are both shown");
  const items = await page.$$eval(".cv-under .cf-list li", (l) => l.map((x) => x.textContent));
  ok(items.length >= 3 && /Shot size/.test(items[0] + items[1]), "the list names every curiosity on, by share: " + items.slice(0, 4).join(" / "));
  /* Jeremy 2026-10-05: two tabs, Viewer focus (the top 2 or 3 things, the pie, the graph, the list) and Moments */
  const focus5 = await page.textContent(".cv-under .cf-focus");
  ok(/ \+ /.test(focus5) && /Shot size/.test(focus5), "Viewer focus names the things holding attention: " + focus5);
  ok((await page.textContent(".cv-under .cf-force")).length > 2, "the force driving the scene is the title: " + (await page.textContent(".cv-under .cf-force")));
  const cards = await page.$$eval(".cv-card .cv-force", (l) => l.map((x) => x.textContent));
  ok(cards.length === 13 && cards.every(Boolean), "every storyboard panel is titled with its force: " + cards.slice(0, 4).join(" / "));
  const labels = await page.$$eval(".cv-card .cv-focus", (l) => l.map((x) => x.textContent));
  ok(labels.every((x) => / \+ /.test(x)), "and labelled with 2 or 3 things holding attention: " + labels.slice(0, 3).join(" / "));
  /* Jeremy 2026-10-05: the graph is one view of the automation lanes, nodes and lines you can drag */
  const gd = await page.locator(".cv-under .cf-graph .cf-ln-dot.cf-ed").first();
  ok((await page.locator(".cv-under .cf-graph .cf-ln-dot").count()) >= 13 && (await page.locator(".cv-under .cf-graph path").count()) >= 2, "the graph is lines with a node per panel for the top curiosities");
  const g0 = await page.evaluate(() => JSON.stringify(CurioViewer.film().panels.map((p) => p.v || null)));
  const gb = await gd.boundingBox();
  await page.mouse.move(gb.x + 5, gb.y + 5);
  await page.mouse.down();
  await page.mouse.move(gb.x + 5, gb.y + 40, { steps: 4 });
  await page.mouse.up();
  await page.waitForTimeout(200);
  ok((await page.evaluate(() => JSON.stringify(CurioViewer.film().panels.map((p) => p.v || null)))) !== g0, "dragging a node on the graph changes that panel's value");
  await page.evaluate(() => CurioViewer.undo());
  await page.waitForTimeout(150);
  ok((await page.evaluate(() => JSON.stringify(CurioViewer.film().panels.map((p) => p.v || null)))) === g0, "and Undo puts it back");
  /* Jeremy 2026-10-05: a color in the pie picks that lane in the graph; Ctrl+click a line opens the curve window */
  const pie = await page.locator(".cv-under .cf-pie").boundingBox();
  await page.mouse.click(pie.x + pie.width / 2 + 4, pie.y + 8);
  await page.waitForTimeout(150);
  const pk = await page.evaluate(() => CurioFocusLane.picked());
  ok(!!pk && (await page.locator(`.cv-under .cf-graph .cf-g.on[data-g="${pk}"]`).count()) === 1 && (await page.locator(".cv-under .cf-list li.on").count()) === 1, "clicking a color in the pie picks that lane in the graph and the list: " + pk);
  const seg = page.locator(".cv-under .cf-graph .cf-g.on .cf-seg").first();
  const sb = await seg.boundingBox();
  const sgI = +(await seg.getAttribute("data-seg"));
  const sgId = await seg.getAttribute("data-ln");
  await page.keyboard.down("Control");
  await page.mouse.click(sb.x + sb.width / 2, sb.y + sb.height / 2);
  await page.keyboard.up("Control");
  await page.waitForTimeout(150);
  ok(await page.isVisible(".cf-cpop"), "Ctrl+click on a line opens the curve window");
  const cvb = await page.locator(".cf-cpop canvas").boundingBox();
  await page.mouse.move(cvb.x + 14, cvb.y + 100);
  await page.mouse.down();
  await page.mouse.move(cvb.x + cvb.width / 2, cvb.y + 15, { steps: 6 });
  await page.mouse.move(cvb.x + cvb.width - 14, cvb.y + 110, { steps: 6 });
  await page.mouse.up();
  ok((await page.getAttribute('.cf-cpop [data-shape="draw"]', "class")) === "on", "drawing in the box makes it your own curve");
  await page.click('.cf-cpop [data-c="apply"]');
  await page.waitForTimeout(200);
  const cur = await page.evaluate(([i, id]) => (CurioViewer.film().panels[i].curves || {})[id], [sgI, sgId]);
  ok(!(await page.isVisible(".cf-cpop")) && cur && cur.shape === "draw" && cur.pts.length === 33, "Apply keeps the drawn curve on that line");
  await page.evaluate(() => CurioViewer.undo());
  await page.waitForTimeout(150);
  ok(!(await page.evaluate(([i, id]) => (CurioViewer.film().panels[i].curves || {})[id], [sgI, sgId])), "and Undo takes it off");
  await page.evaluate(() => CurioFocusLane.pick(CurioFocusLane.picked()));
  ok(!(await page.isVisible(".cv-under .cf-rows")), "the colored blocks wait in the Moments tab");
  await page.click('.cv-under [data-cf-tab="moments"]');
  await page.waitForTimeout(150);
  ok(await page.isVisible(".cv-under .cf-rows") && !(await page.isVisible(".cv-under .cf-pie")), "Moments shows the blocks instead of the charts");
  await page.hover(".cv-under .cf-lead button:nth-of-type(4)");
  const full = await page.textContent(".cv-under .cf-pick");
  ok(full.length > 20, "pointing at a block reads it in full at the top: " + full);
  await page.click('.cv-under [data-cf-tab="lanes"]');
  await page.waitForTimeout(150);
  const big = await page.evaluate(() => ({ card: document.querySelector(".cv-card").offsetWidth, on: document.querySelector(".cv-root").classList.contains("cf-big"), shown: [...document.querySelectorAll(".cv-under .cf-lanes .cf-ln")].filter((l) => { const a = l.getBoundingClientRect(), b = document.querySelector(".cv-under .cf-lanes").getBoundingClientRect(); return a.top >= b.top - 1 && a.bottom <= b.bottom + 1; }).length }));
  ok(big.on && big.card < 120 && big.shown >= 4, `the Automation lanes tab shrinks the storyboards (${big.card}px) and shows the top lanes large (${big.shown} in view)`);
  const lanes = await page.$$eval(".cv-under .cf-ln", (l) => l.map((x) => x.dataset.ln || "suite:" + x.dataset.lnSuite));
  ok(lanes.length >= 8 && lanes.some((x) => x.startsWith("suite:")), "Automation lanes: a lane per curiosity and suite (" + lanes.slice(0, 5).join(", ") + " ...)");
  const v0 = await page.evaluate(() => JSON.stringify(CurioViewer.film().panels.map((p) => p.v || null)));
  const dot = await page.locator(".cv-under .cf-ln-edit .cf-ln-dot").first().boundingBox();
  await page.mouse.move(dot.x + 5, dot.y + 5);
  await page.mouse.down();
  await page.mouse.move(dot.x + 5, dot.y + 28, { steps: 4 });
  await page.mouse.up();
  await page.waitForTimeout(200);
  const v1 = await page.evaluate(() => JSON.stringify(CurioViewer.film().panels.map((p) => p.v || null)));
  ok(v0 !== v1, "dragging a dot changes that panel's value");
  await page.evaluate(() => CurioViewer.undo());
  await page.waitForTimeout(150);
  ok((await page.evaluate(() => JSON.stringify(CurioViewer.film().panels.map((p) => p.v || null)))) === v0, "and Undo puts it back");
  await page.click('.cv-under [data-cf-tab="moments"]');
  await page.waitForTimeout(150);
  ok(!(await page.evaluate(() => document.querySelector(".cv-root").classList.contains("cf-big"))), "leaving the tab gives the storyboards their size back");
  const head0 = await page.$eval(".cv-under .cf-head", (h) => parseFloat(h.style.left));
  await page.evaluate(() => CurioViewer.select(0));
  await page.evaluate(() => CurioViewer.play(true));
  await page.waitForTimeout(1600);
  await page.evaluate(() => CurioViewer.play(false));
  const head1 = await page.$eval(".cv-under .cf-head", (h) => parseFloat(h.style.left));
  ok(head1 > 0 && head1 !== head0, "the playhead line follows Play");

  /* the space bar plays and stops even right after picking from the Pause menu */
  await page.focus('[data-k="afterstop"]');
  await page.keyboard.press(" ");
  await page.waitForTimeout(300);
  ok(await page.evaluate(() => CurioViewer.playing && CurioViewer.playing()), "space plays after picking from the Pause menu");
  await page.keyboard.press(" ");
  await page.waitForTimeout(100);
  ok(!(await page.evaluate(() => CurioViewer.playing && CurioViewer.playing())), "and space stops it");
  const target = await page.$eval(".cv-under .cf-lead button:nth-of-type(8)", (b) => +b.dataset.cfAt);
  await page.click(".cv-under .cf-lead button:nth-of-type(8)");
  await page.waitForTimeout(200);
  const at = await page.evaluate(() => CurioViewer.time());
  ok(Math.abs(at - target) < 0.01, `clicking a block jumps there (${at} s)`);

  await page.evaluate(() => {
    const f = CurioViewer.film();
    f.panels.forEach((p) => (p.place.phone.show = false));
    CurioViewer.setFilm(f);
  });
  await page.waitForTimeout(200);
  const r2 = await page.evaluate(() => CurioFocusLane.read());
  ok(r2[4].trigger !== "an object enters", "an edit changes the reading: with no phone, nothing comes in to set off the insert");
  await page.evaluate(() => CurioViewer.undo());

  await page.setViewportSize({ width: 390, height: 800 });
  await page.waitForTimeout(300);
  const fit = await page.evaluate(() => {
    const u = document.querySelector(".cv-under").getBoundingClientRect();
    return u.width > 0 && u.right <= innerWidth + 1 && document.documentElement.scrollWidth <= innerWidth + 1;
  });
  ok(fit, "on a phone the lane fits the screen");

  ok(errors.length === 0, "no page errors" + (errors.length ? ": " + errors.join(" | ") : ""));
  await browser.close();
  server.close();
  console.log(fails ? `${fails} failed` : "all passed");
  process.exit(fails ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
