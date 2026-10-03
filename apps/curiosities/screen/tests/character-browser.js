/* The character matrix on the Screen, in a real browser inside the real app:
   NODE_PATH=... node apps/curiosities/screen/tests/character-browser.js [--shots dir] [--three path/to/three.min.js]
   (--three serves a local three.js for the cdnjs address, for machines that cannot reach cdnjs.)

   Opens the Character tab, brings the matrix's cast onto the timeline, writes a character's health from
   Details, opens the 3D matrix over the Screen, changes a character there and checks the timeline has the node,
   undoes it on the timeline and checks the matrix follows, then closes the matrix. No page errors.

   (The serving code below is the same as browser.js.)
   ---------- */
/* The Screen in a real browser, inside the real app: node apps/curiosities/screen/tests/browser.js [--shots dir]
   (needs Playwright and Chromium; set NODE_PATH to where Playwright is installed if it is not local).

   index.html is served with <script src="screen/load.js"> added as its last script (the line the app thread
   adds), so this works before that patch lands. It walks the Screen the way a person would: the Screen opens
   on start, pick each level, change a control in the inspector (a node appears), add an inspiration viewer,
   take a curiosity from two films and blend it, click a lane to add nodes, join two nodes across lanes (a
   proximity), copy and paste it, move a node (its partner moves too), switch to Arrange, show all potential
   curiosities and suites, change a track's curiosity, undo, reload. The page must report no errors. */
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
const THREE_FILE = arg("--three", "");

(async () => {
  const server = await serve();
  const base = `http://127.0.0.1:${server.address().port}/`;
  const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--ignore-gpu-blocklist"] });
  /* The app's service worker would fetch three.js itself, past the --three stand-in. */
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, serviceWorkers: THREE_FILE ? "block" : "allow" });
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => m.type() === "error" && !/Failed to load resource|three|cdnjs|fonts\.g/.test(m.text()) && errors.push(m.text()));
  if (THREE_FILE) await page.route("**/cdnjs.cloudflare.com/**", (r) => r.fulfill({ path: THREE_FILE, contentType: "text/javascript" }));
  await page.route("**/fonts.g*/**", (r) => r.abort());
  await page.goto(base + "index.html?screen=1");
  await page.waitForFunction(() => window.CurioScreen && window.CurioScreen.isOpen() && window.CharacterScreen, null, { timeout: 15000 });
  ok(true, "the Screen opens with screen/character.js loaded");

  await page.click('.sc-icons [data-icat="character"]');
  await page.waitForSelector(".cs-bar");
  ok(true, "the Character tab's Details start with the character bar");
  if (await page.$('[data-more="character"]')) await page.click('[data-more="character"]');
  ok(await page.evaluate(() => [...document.querySelectorAll(".sc-cur-name")].some((b) => b.dataset.selectCur === "cm-health")), "Details list the matrix's curiosities");

  await page.click('.cs-bar [data-cs="bring"]');
  await page.waitForFunction(() => window.CurioEngine.state().tracks.filter((t) => t.kind === "character" && t.curiosities.includes("cm-health")).length >= 3, null, { timeout: 10000 });
  const cast = await page.evaluate(() => window.CurioEngine.state().tracks.filter((t) => t.curiosities.includes("cm-health")).map((t) => t.label));
  ok(cast.length >= 3, "Bring the matrix's cast in: " + cast.join(", ") + " are character tracks with their own lanes");
  await page.waitForSelector('.cs-bar [data-cs="pick"]');
  await page.screenshot({ path: path.join(SHOTS, "character-tab.png") });

  /* Write a character's health from Details at the playhead. */
  const pickId = await page.evaluate(() => {
    const t = window.CurioEngine.state().tracks.filter((x) => x.curiosities.includes("cm-health"))[1];
    return t.id;
  });
  await page.selectOption('.cs-bar [data-cs="pick"]', pickId);
  await page.waitForFunction((id) => window.CharacterScreen.track() === id, pickId);
  if ((await page.textContent('[data-more="character"]')).startsWith("Show all")) await page.click('[data-more="character"]');
  await page.waitForSelector('[data-set="cm-risk"]', { state: "attached" });
  await page.evaluate(() => {
    const el = document.querySelector('[data-set="cm-risk"]');
    el.value = "77";
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.waitForTimeout(300);
  const risk = await page.evaluate((id) => {
    const st = window.CurioEngine.state();
    return st.tracks.find((t) => t.id === id).curiosities.includes("cm-risk") ? window.CurioEngine.value(st.rows[0].id, id, "cm-risk") : null;
  }, pickId);
  ok(String(risk) === "77", "Details write Cautious to Reckless 77 onto the picked character's own lane (" + risk + ")");
  const others = await page.evaluate((id) => window.CurioEngine.state().tracks.filter((t) => t.id !== id && t.curiosities.includes("cm-risk")).length, pickId);
  ok(others === 0, "the other characters have no such lane");

  /* The 3D matrix over the Screen, linked to the film. */
  await page.click('.cs-bar [data-cs="matrix"]');
  await page.waitForFunction(() => window.CharacterMatrix && window.CharacterMatrix.linked() && document.querySelector(".cs-overlay:not([hidden]) .cm-grid"), null, { timeout: 15000 });
  ok(true, "Open the 3D matrix shows the matrix over the Screen, linked");
  ok(await page.evaluate((strict) => !!document.querySelector(".cs-overlay canvas") || (!strict && !window.THREE), !!THREE_FILE), "with its 3D view" + (THREE_FILE ? "" : " (or the note, without three.js)"));
  const names = await page.evaluate(() => window.CharacterMatrix.state().characters.map((c) => c.name));
  ok(cast.every((n) => names.includes(n)), "its cast is the character tracks");
  ok(await page.evaluate((id) => window.CharacterMatrix.state().selected === id, pickId), "it opens on the character picked in Details");
  const shown = await page.evaluate(() => Number(document.querySelector('.cs-overlay input[data-axis="risk"]').value));
  ok(shown === 77, "and shows the value written on the timeline (" + shown + ")");
  const h0 = await page.evaluate((id) => window.CharacterMatrix.state().characters.find((c) => c.id === id).scenes[0].health, pickId);
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(SHOTS, "character-matrix-linked.png") });

  /* A change in the matrix is a node on the timeline, and undo there takes it back. */
  await page.evaluate(() => {
    const el = document.querySelector('.cs-overlay [data-f="health"]');
    el.value = "2";
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.waitForTimeout(200);
  const h2 = await page.evaluate((id) => window.CurioEngine.value(window.CurioEngine.state().rows[0].id, id, "cm-health"), pickId);
  ok(String(h2) === "2", "health 2 in the matrix is a node on the timeline (" + h2 + ")");
  await page.evaluate(() => {
    const el = document.querySelector('.cs-overlay input[data-axis="risk"]');
    el.value = "95";
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.waitForTimeout(200);
  ok(await page.evaluate((id) => window.CurioEngine.state().tracks.find((t) => t.id === id).curiosities.includes("cm-risk") && window.CurioEngine.value(window.CurioEngine.state().rows[0].id, id, "cm-risk") === 95, pickId), "moving an axis in the matrix moves that character's lane");
  await page.evaluate(() => {
    const el = document.querySelector('.cs-overlay input[data-axis="truth"]');
    el.value = "90";
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.waitForTimeout(200);
  ok(await page.evaluate((id) => window.CurioEngine.state().tracks.find((t) => t.id === id).curiosities.includes("cm-truth"), pickId), "nudging a new axis gives that character an Honest to Deceptive lane");
  await page.evaluate(() => window.CurioEngine.undo());
  await page.evaluate(() => window.CurioEngine.undo());
  await page.evaluate(() => window.CurioEngine.undo());
  await page.waitForTimeout(200);
  ok(await page.evaluate(([id, h]) => window.CharacterMatrix.state().characters.find((c) => c.id === id).scenes[0].health === h, [pickId, h0]), "undo on the timeline and the matrix follows");

  await page.click('.cs-overlay [data-cs="close"]');
  ok(await page.evaluate(() => document.querySelector(".cs-overlay").hidden && window.CurioScreen.isOpen() && !window.CharacterMatrix.linked()), "Back to the Screen closes it and unlinks the matrix");
  ok(await page.evaluate(() => !!document.querySelector(".cs-bar")), "the Character tab is still there");

  ok(!errors.length, "no page errors" + (errors.length ? ": " + errors.slice(0, 3).join(" | ") : ""));
  await browser.close();
  server.close();
  console.log(fails ? fails + " failed" : "all passed");
  process.exit(fails ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
