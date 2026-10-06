/* The big viewer layout in a real browser: node apps/curiosities/screen/tests/big-layout.js [--shots dir]
   (needs Playwright and Chromium; set NODE_PATH to where Playwright is installed if it is not local).
   At a laptop, a small laptop and a phone size: the viewer fills the top, two viewers are the same size, the lane
   strip runs under it from the rail to the right edge, the storyboards run across the whole bottom, the library
   and Details open in a big tabbed window that Esc closes, and Player in the middle puts every panel back. */
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
      const url = decodeURIComponent(req.url.split("?")[0]);
      const p = path.join(ROOT, url.replace(/^\/+/, "") || "index.html");
      if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) {
        res.writeHead(404);
        return res.end();
      }
      res.writeHead(200, { "content-type": TYPES[path.extname(p)] || "application/octet-stream" });
      if (p.endsWith(path.join(ROOT, "index.html"))) {
        let html = fs.readFileSync(p, "utf8");
        if (!html.includes("screen/load.js")) html = html.replace("</body>", '    <script src="screen/load.js"></script>\n  </body>');
        return res.end(html);
      }
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
  const base = `http://127.0.0.1:${server.address().port}/`;
  const browser = await chromium.launch();
  const errors = [];
  for (const [w, h, tag] of [[1440, 900, "laptop"], [1280, 800, "small"], [390, 844, "phone"]]) {
    const page = await browser.newPage({ viewport: { width: w, height: h } });
    page.on("pageerror", (e) => errors.push(String(e)));
    await page.goto(base + "index.html?screen=1");
    await page.waitForFunction(() => window.CurioScreen && window.CurioScreen.isOpen(), null, { timeout: 15000 });
    await page.waitForTimeout(400);
    await page.selectOption("[data-pick-layout]", "big");
    await page.waitForTimeout(300);
    const g = await page.evaluate(() => {
      const r = (q) => { const e = document.querySelector(q); if (!e) return null; const b = e.getBoundingClientRect(); return { l: b.left, t: b.top, r: b.right, b: b.bottom, w: b.width, h: b.height, shown: !!e.offsetParent || getComputedStyle(e).position === "fixed" }; };
      return { main: r(".sc-main"), player: r(".sc-player"), tl: r(".sc-timeline"), ov: r(".sc-main > .sc-overview"), rail: r(".sc-rail"), win: r(".sc-bigwin"), lib: r(".sc-lib"), frames: [...document.querySelectorAll(".sc-viewers .sc-frame")].map((f) => f.getBoundingClientRect().width), viewers: r(".sc-viewers") };
    });
    if (tag !== "phone") {
      ok(g.rail && g.ov && g.tl && g.player, `${tag}: the rail, the viewer, the lane strip and the storyboards are on the Screen`);
      ok(g.player.h > g.tl.h * 1.5, `${tag}: the viewer gets most of the height (${Math.round(g.player.h)} vs lanes ${Math.round(g.tl.h)})`);
      ok(g.tl.t >= g.player.b - 1 && g.ov.t >= g.tl.b - 1, `${tag}: lanes under the viewer, storyboards under the lanes`);
      ok(g.ov.w > g.main.w - 20, `${tag}: the storyboards run across the whole bottom`);
      ok(g.tl.r > g.main.r - 10 && g.tl.l >= g.rail.r - 1, `${tag}: the lane strip runs from the rail to the right edge`);
      ok(g.lib.w === 0 && !g.win.w, `${tag}: the library and Details are tucked away in the tabbed window`);
      ok(Math.abs(g.frames[0] - g.frames[g.frames.length - 1]) < 2 && g.frames.length > 1, `${tag}: the two viewers are the same size (${g.frames.map(Math.round).join(", ")})`);
    }
    const g1 = g.frames.length ? g.frames[0] : 0;
    await page.screenshot({ path: path.join(SHOTS, `big-${tag}.png`) });
    await page.click('.sc-rail [data-bigtab="lib"]');
    await page.waitForTimeout(200);
    const w1 = await page.evaluate(() => { const b = document.querySelector(".sc-bigwin").getBoundingClientRect(); const l = document.querySelector(".sc-bigwin .sc-lib").getBoundingClientRect(); return { w: b.width, h: b.height, lw: l.width }; });
    ok(w1.w > (tag === "phone" ? 300 : 900) && w1.lw > w1.w - 10, `${tag}: Library opens in a big window (${Math.round(w1.w)}×${Math.round(w1.h)})`);
    const clear = await page.evaluate(() => { const w = document.querySelector(".sc-bigwin").getBoundingClientRect(); return [...document.querySelectorAll(".sc-viewers .sc-frame")].every((f) => { const b = f.getBoundingClientRect(); return b.bottom <= w.top + 1 || b.right <= w.left + 1; }); });
    ok(clear, `${tag}: the window covers none of the viewers (two viewers: it sits under them)`);
    await page.screenshot({ path: path.join(SHOTS, `big-${tag}-library.png`) });
    await page.click('.sc-bigwin-tabs [data-bigtab="insp"]');
    await page.waitForTimeout(200);
    ok(await page.evaluate(() => document.querySelector(".sc-bigwin .sc-inspector").getBoundingClientRect().width > 200), `${tag}: the Details tab shows Details`);
    await page.screenshot({ path: path.join(SHOTS, `big-${tag}-details.png`) });
    ok(await page.evaluate(() => window.CurioScreen.panel("lib") && document.querySelector(".sc-bigwin").dataset.tab === "lib"), `${tag}: CurioScreen.panel("lib") opens the Library tab (the App Walkthrough uses it)`);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(100);
    ok(await page.evaluate(() => document.querySelector(".sc-bigwin").hidden), `${tag}: Esc closes the window`);
    if (tag !== "phone") {
      await page.evaluate(() => window.CurioScreen.openWin("shotSize"));
      await page.waitForTimeout(300);
      const free = await page.evaluate(() => { const w = [...document.querySelectorAll(".sc-win")].pop(); if (!w) return null; const b = w.getBoundingClientRect(); return [...document.querySelectorAll(".sc-viewers .sc-frame")].every((f) => { const r = f.getBoundingClientRect(); return b.top >= r.bottom - 1 || b.left >= r.right - 1; }); });
      ok(free === true, `${tag}: a curiosity window opens clear of the viewers (${free})`);
      await page.screenshot({ path: path.join(SHOTS, `big-${tag}-curiosity-window.png`) });
      await page.evaluate(() => document.querySelectorAll(".sc-win [data-win-close], .sc-win .sc-win-x").forEach((b) => b.click()));
    }
    await page.click('[data-wins="1"]');
    await page.waitForTimeout(200);
    if (tag !== "phone") {
      await page.click('.sc-rail [data-bigtab="insp"]');
      await page.waitForTimeout(300);
      const side = await page.evaluate(() => { const w = document.querySelector(".sc-bigwin").getBoundingClientRect(); const f = document.querySelector(".sc-viewers .sc-frame").getBoundingClientRect(); return [f.right, w.left, w.width]; });
      ok(side[0] <= side[1] + 1 && side[2] > 450, `${tag}: with one viewer the window sits to its right (viewer ends ${Math.round(side[0])}, window starts ${Math.round(side[1])})`);
      await page.screenshot({ path: path.join(SHOTS, `big-${tag}-one-details.png`) });
      await page.keyboard.press("Escape");
      await page.waitForTimeout(200);
    }
    if (tag === "laptop") {
      const one = await page.evaluate(() => [document.querySelector(".sc-viewers .sc-frame").getBoundingClientRect().width, document.querySelector(".sc-viewers").getBoundingClientRect().width]);
      ok(one[0] >= g1 - 1 && one[0] > 380, `${tag}: one viewer alone is at least as big as each of two (${Math.round(one[0])}px wide)`);
    }
    await page.screenshot({ path: path.join(SHOTS, `big-${tag}-one.png`) });
    await page.selectOption("[data-pick-layout]", "center");
    await page.waitForTimeout(200);
    ok(await page.evaluate(() => !document.querySelector(".sc-bigwin") && !document.querySelector(".sc-rail") && document.querySelector(".sc-lib").parentNode.classList.contains("sc-main") && document.querySelector(".sc-overview").parentNode.classList.contains("sc-player")), `${tag}: Player in the middle puts every panel back`);
    await page.close();
  }
  ok(!errors.length, "no page errors" + (errors.length ? ": " + errors.join(" | ") : ""));
  await browser.close();
  server.close();
  console.log(fails ? fails + " failed" : "all passed");
  process.exit(fails ? 1 : 0);
})();
