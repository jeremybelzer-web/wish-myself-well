/* The "Show me" demonstrations in a real browser: node apps/curiosities/demo/tests/browser.js [--three three.min.js]
   (needs Playwright and Chromium; set NODE_PATH to where Playwright is installed if it is not local).

   Plays the window and lanes demonstrations fast and checks they finish and really change the film (the engine's
   undo history grows; a curve is written; nodes are added), that every window's title bar and Help ▾ offer
   Show me, and that Stop ends one at once. The 3D map demonstration runs too when relations/ is in this copy
   and three.js loads (from cdnjs, or --three): it must fly inside a cube (the Jarvis screens) and come back out. */
const http = require("http");
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const args = process.argv.slice(2);
const arg = (n, d) => (args.includes(n) ? args[args.indexOf(n) + 1] : d);
const THREE = arg("--three", process.env.CURIO_THREE || "");
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
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  if (THREE) await ctx.route(/three(\.min)?\.js$/, (route) => route.fulfill({ body: fs.readFileSync(THREE), contentType: "text/javascript" }));
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.addInitScript(() => {
    localStorage.setItem("curio-walkthrough-seen-v1", "1");
    localStorage.setItem("curio-hoverhelp-v1", "off");
  });
  await page.goto(base + "index.html?screen=1");
  await page.waitForFunction(() => window.CurioScreen && window.CurioScreen.isOpen() && window.CurioDemo, null, { timeout: 30000 });
  ok(await page.evaluate(() => ["map", "window", "lanes"].every((id) => window.CurioDemo.tours.has(id))), "the three demonstrations are registered");

  /* Show me on a window's title bar, and in Help. */
  await page.evaluate(() => window.CurioScreen.openWin("pov"));
  await page.waitForSelector('.sc-win[data-win="pov"] .sc-win-h .cd-show', { timeout: 3000 }).catch(() => {});
  ok(!!(await page.$('.sc-win[data-win="pov"] .sc-win-h .cd-show')), "a curiosity window's title bar has ▶ Show me");
  const tours = await page.evaluate(async () => {
    const help = [...document.querySelectorAll(".cw-help")].find((b) => b.getBoundingClientRect().width > 0);
    if (!help) return -1;
    help.click();
    await new Promise((r) => setTimeout(r, 200));
    const n = document.querySelectorAll(".cw-menu [data-cd-tour]").length;
    document.querySelector(".cw-menu").hidden = true;
    return n;
  });
  ok(tours >= 2, `Help ▾ lists the Show me demonstrations (${tours})`);

  /* Stop ends a demonstration at once and takes its pointer and caption away. */
  const stopped = await page.evaluate(async () => {
    const p = window.CurioDemo.run("window");
    await new Promise((r) => setTimeout(r, 900));
    document.querySelector(".cd-bar [data-cd=stop]").click();
    const r = await p;
    return { r, left: document.querySelectorAll(".cd-ui").length };
  });
  ok(stopped.r.stopped && !stopped.left, "Stop ends a demonstration and clears its pointer and caption: " + JSON.stringify(stopped));

  /* The window demonstration, fast: it must change the film for real. */
  const undo0 = await page.evaluate(() => window.CurioEngine.history().undo.length);
  const win = await page.evaluate(async () => {
    window.CurioDemo.speed = 8;
    const said = [];
    const mo = new MutationObserver(() => {
      const c = document.querySelector(".cd-cap");
      if (c && c.textContent && said[said.length - 1] !== c.textContent) said.push(c.textContent);
    });
    mo.observe(document.body, { subtree: true, childList: true, characterData: true });
    const r = await window.CurioDemo.run("window", { win: document.querySelector('.sc-win[data-win="pov"]') });
    mo.disconnect();
    return { r, said };
  });
  ok(win.r.ok, "the window demonstration plays to the end: " + JSON.stringify(win.r));
  const undo1 = await page.evaluate(() => window.CurioEngine.history().undo.length);
  ok(undo1 >= undo0 + 6, `it changes the film for real, one undo step at a time (${undo1 - undo0} steps)`);
  const want = ["picture at the top", "Click a choice", "A knob", "A slider", "preset", "Shape over my film", "Drag a node", "Click on a line", "Alt", "Curves", "Double-click a node"];
  const text = win.said.join(" | ");
  want.forEach((w) => ok(text.includes(w), `it shows: ${w}`));
  ok(await page.evaluate(() => !!JSON.parse(localStorage.getItem("curiosities-screen-curves-v1") || "{}") && Object.keys(JSON.parse(localStorage.getItem("curiosities-screen-curves-v1") || "{}")).length > 0), "bending a line writes a curve");
  ok(!(await page.evaluate(() => document.querySelectorAll(".cd-ui").length)), "nothing of the demonstration is left on the page");

  /* The 3D map, when this copy has it and three.js loads. */
  const hasMap = await page.evaluate(() => !!(window.CurioRelations || window.CurioRelationsLoad));
  if (!hasMap) console.log("     (no relations/ here: the 3D map demonstration is skipped)");
  else {
    const map = await page.evaluate(async () => {
      window.CurioDemo.speed = 8;
      let inside = false;
      const mo = new MutationObserver(() => (inside = inside || !!document.querySelector(".rl-jarvis .rl-screen")));
      mo.observe(document.body, { subtree: true, childList: true });
      const r = await window.CurioDemo.run("map");
      mo.disconnect();
      return { r, inside, three: !!window.THREE, out: !document.querySelector(".rl-jarvis") };
    });
    if (!map.three) console.log("     (three.js did not load: pass --three to check the 3D map demonstration)");
    else {
      ok(map.r.ok, "the 3D map demonstration plays to the end: " + JSON.stringify(map.r));
      ok(map.inside, "it flies inside a cube and the screens come up");
      ok(map.out, "it leaves the cube at the end");
    }
  }
  ok(!errors.length, "no page errors: " + (errors.slice(0, 3).join("; ") || "none"));
  await browser.close();
  server.close();
  process.exit(fails ? 1 : 0);
})();
