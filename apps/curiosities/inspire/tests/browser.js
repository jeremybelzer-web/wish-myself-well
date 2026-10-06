/* Scene inspiration in a real browser:
     node apps/curiosities/inspire/tests/browser.js
   (needs Playwright and Chromium). Opens Library, Scene inspiration; checks the topics, that each filter narrows the
   list, typing, Every curiosity, Watch (a YouTube search), Borrow (a curated film in the Prism), and Log a clip. */
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
  const page = await (await browser.newContext({ viewport: { width: 1400, height: 900 } })).newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  try {
    await page.goto(`http://127.0.0.1:${server.address().port}/index.html?screen=0`);
    await page.waitForFunction(() => window.CurioInspire && document.querySelector("#lib-menu [data-inspire]"), null, { timeout: 15000 });
    ok(true, "the Library has Scene inspiration");
    await page.evaluate(() => window.CurioInspire.open());
    const total = await page.evaluate(() => window.CurioInspire.hub().scenes.length);
    const count = () => page.$$eval("dialog.ci-hub .ci-card", (x) => x.length);
    ok((await count()) === total && total >= 30, `every scene is listed first (${total})`);
    ok((await page.$$eval("dialog.ci-hub .ci-col:nth-child(2) .ci-row", (x) => x.length)) >= 6, "the big topics are in the columns");
    ok((await page.$$eval("dialog.ci-hub .ci-col:nth-child(2) .ci-row", (x) => x.length)) > 3, "ALL lists curiosity suites");
    await page.click('dialog.ci-hub [data-i="topic"][data-v="camera"]');
    await page.click('dialog.ci-hub [data-i="key"][data-v="shotSize"]');
    await page.click('dialog.ci-hub [data-i="value"][data-v="close"]');
    const n1 = await count();
    ok(n1 > 0 && n1 < total, `a value narrows the list (${total} -> ${n1})`);
    await page.click('dialog.ci-hub [data-i="rate"]');
    const n2 = await count();
    ok(n2 > 0 && n2 <= n1, `how fast it changes narrows it again (${n2})`);
    ok((await page.$$eval("dialog.ci-hub .ci-chip", (x) => x.length)) === 2, "each filter shows as a chip");
    await page.click('dialog.ci-hub [data-i="clear"]');
    ok((await count()) === total, "Clear all brings every scene back");
    await page.fill("dialog.ci-hub .ci-search", "jaws");
    await page.waitForFunction(() => document.querySelectorAll("dialog.ci-hub .ci-card").length === 1);
    ok(true, "typing finds a film");
    await page.click('dialog.ci-hub [data-i="open"]');
    ok((await page.$$eval("dialog.ci-hub .ci-table tr", (x) => x.length)) > 5, "Every curiosity shows the scene's curiosities and how fast they change");
    await page.evaluate(() => (window.open = (u) => ((window.__opened = u), null)));
    await page.click('dialog.ci-hub [data-i="watch-go"]');
    const url = await page.evaluate(() => window.__opened || "");
    ok(/youtube\.com\/results\?search_query=/.test(url), "Watch opens a YouTube search, not a fixed link");
    ok((await page.textContent("dialog.ci-hub .ci-card")).includes("watched 1"), "each view is counted");
    await page.click('dialog.ci-hub [data-i="borrow"]');
    const st = await page.evaluate(() => {
      const s = window.CuriosityStudy.studies().find((x) => x.id.startsWith("inspire-jaws"));
      return { study: !!s, prism: !document.getElementById("prism").classList.contains("hidden"), closed: !document.querySelector("dialog.ci-hub").open };
    });
    ok(st.study && st.prism && st.closed, "Borrow makes it a curated film and opens the Prism");
    /* The search pop-up a curiosity window opens: beside its anchor, on that curiosity, every column a filter. */
    await page.evaluate(() => {
      const a = document.createElement("div");
      a.id = "fake-window";
      a.style.cssText = "position:fixed;left:10px;top:60px;width:200px;height:200px";
      document.body.appendChild(a);
      window.CurioInspire.openSearch("pacing", { anchor: a });
    });
    const pop = await page.evaluate(() => {
      const d = document.querySelector("dialog.ci-hub");
      const r = d.getBoundingClientRect();
      return { pop: d.classList.contains("ci-pop"), open: d.open, left: r.left, cols: d.querySelectorAll(".ci-grid > .ci-col").length, picked: !!d.querySelector('[data-i="key"][data-v="pacing"].on'), from: d.querySelector(".ci-from") && d.querySelector(".ci-from").textContent };
    });
    ok(pop.pop && pop.open && pop.left >= 210, "openSearch opens a pop-up beside the window it came from");
    ok(pop.cols === 6 && pop.picked && /Walking back and forth/.test(pop.from || ""), "it has six filter columns and starts on that curiosity");
    ok(await page.$('dialog.ci-hub [data-i="db"][data-v="writing"].on'), "a movement curiosity only writing has opens the Writing database");
    ok(!(await page.$('dialog.ci-hub [data-i="kind"][data-v="film"]')), "films and games do not mix into writing");
    await page.click('dialog.ci-hub [data-i="db"][data-v="writing"]');
    const kinds = await page.$$eval('dialog.ci-hub [data-i="kind"]', (x) => x.map((b) => b.dataset.v));
    ok(kinds.join() === "novel,short story,essay,poem", "Writing is its own database: novels, short stories, essays, poems");
    await page.click('dialog.ci-hub [data-i="kind"][data-v="novel"]');
    const books = await page.$$eval("dialog.ci-hub .ci-card", (x) => x.map((c) => c.textContent));
    ok(books.length >= 1 && books.every((t) => /Read/.test(t)), "novels are read rather than watched (" + books.length + ")");
    await page.click('dialog.ci-hub [data-i="clear"]');
    await page.click('dialog.ci-hub [data-i="movement"][data-v="pacing"]');
    ok((await count()) >= 2, "the Movements column filters by how characters move");
    await page.click('dialog.ci-hub [data-ci="close"]');

    /* The lanes' docked search window: CurioSceneSearch.mount(el, { curiosity, lane, label, from }). */
    const docked = await page.evaluate(() => {
      const el = document.createElement("div");
      el.id = "dock";
      document.body.appendChild(el);
      window.CurioSceneSearch.mount(el, { curiosity: "tensionCurve", lane: "tensionCurve", label: "Tension", from: "viewer" });
      return { cols: el.querySelectorAll(".ci-grid > .ci-col").length, cards: el.querySelectorAll(".ci-card").length, picked: !!el.querySelector('[data-i="key"][data-v="tensionCurve"].on') };
    });
    ok(docked.cols === 6 && docked.cards > 0 && docked.picked, "CurioSceneSearch.mount draws the search in a docked window, on that curiosity");
    await page.click('#dock [data-i="value"]');
    ok((await page.$$eval("#dock .ci-chip", (x) => x.length)) === 1, "the docked search filters too");

    await page.evaluate(() => window.CurioInspire.open({ filters: [] }));
    await page.click('dialog.ci-hub [data-i="db"][data-v="screen"]');
    await page.click('dialog.ci-hub [data-i="log"]');
    await page.fill('dialog.ci-hub [data-l="work"]', "Test clip");
    await page.fill('dialog.ci-hub [data-l="moment"]', "a hello at a door");
    await page.selectOption('dialog.ci-hub [data-l="from"][data-r="0"]', "wide");
    await page.selectOption('dialog.ci-hub [data-l="to"][data-r="0"]', "close");
    await page.click('dialog.ci-hub [data-i="logsave"]');
    ok((await count()) === 1 && (await page.textContent("dialog.ci-hub .ci-card")).includes("logged by you"), "a logged clip joins the database");
    await page.reload();
    await page.waitForFunction(() => window.CurioInspire);
    ok(await page.evaluate(() => window.CurioInspire.hub().scenes.some((s) => s.work === "Test clip")), "logged clips survive a reload");
    // Watch and tag: a YouTube link loads the player (blocked here, so times are typed), tags keep their times.
    await page.route(/youtube(-nocookie)?\.com|ytimg|googlevideo/, (r) => r.abort());
    await page.evaluate(() => window.CurioInspire.open({ filters: [] }));
    await page.click('dialog.ci-hub [data-i="tag"]');
    await page.waitForSelector("dialog.wt-watch[open]");
    await page.fill('dialog.wt-watch [data-w="link"]', "https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=30");
    await page.click('dialog.wt-watch [data-w="load"]');
    ok((await page.getAttribute("dialog.wt-watch .wt-player iframe", "src")).includes("youtube-nocookie.com/embed/dQw4w9WgXcQ?") , "a YouTube link plays in YouTube's own player");
    await page.fill('dialog.wt-watch [data-w="cend"]', "1:10");
    await page.fill('dialog.wt-watch [data-w="backup"]', "https://youtu.be/9bZkp7q19f0");
    await page.click('dialog.wt-watch [data-w="addbackup"]');
    ok((await page.$$('dialog.wt-watch [data-w="useid"]')).length === 2 && (await page.inputValue('dialog.wt-watch [data-w="cstart"]')) === "0:30" && (await page.getAttribute("dialog.wt-watch .wt-player iframe", "src")).includes("&end=70"), "the scene's start and end are kept and a backup link is added");
    await page.selectOption('dialog.wt-watch [data-w="key"]', "shotSize");
    await page.selectOption('dialog.wt-watch [data-w="value"]', "wide");
    await page.fill('dialog.wt-watch [data-w="at"]', "0:30");
    await page.click('dialog.wt-watch [data-w="tag"]');
    await page.selectOption('dialog.wt-watch [data-w="value"]', "close");
    await page.fill('dialog.wt-watch [data-w="at"]', "0:42");
    await page.press('dialog.wt-watch [data-w="at"]', "Enter");
    ok((await page.$$("dialog.wt-watch .wt-tags tr")).length === 3, "two tags, each with its time");
    await page.click('dialog.wt-watch [data-w="keep"]');
    ok((await page.textContent("dialog.wt-watch .wt-msg")).includes("title"), "a clip needs a title");
    await page.fill('dialog.wt-watch [data-f="work"]', "Tagged clip");
    await page.fill('dialog.wt-watch [data-f="feelings"]', "joy");
    await page.click('dialog.wt-watch [data-w="keep"]');
    const tagged = await page.evaluate(() => window.CurioInspire.store().clips.find((c) => c.work === "Tagged clip"));
    ok(tagged && tagged.video && tagged.video.id === "dQw4w9WgXcQ" && tagged.beats.length === 2 && tagged.beats[0].at === 30 && tagged.beats[1].values.shotSize === "close", "Keep saves the tags as beats with the video id");
    ok(tagged.video.start === 30 && tagged.video.end === 70 && tagged.video.ids.join() === "dQw4w9WgXcQ,9bZkp7q19f0", "Keep saves the stretch and the backup");
    ok(!JSON.stringify(tagged).includes("youtube.com/watch"), "only the id is kept, no link or title from YouTube");
    ok(await page.evaluate(() => document.querySelector("dialog.ci-hub").open && document.querySelector("dialog.ci-hub .ci-card").textContent.includes("Tagged clip")), "the tagged clip shows in the hub");
    await page.click('dialog.ci-hub .ci-card [data-i="tag-scene"]');
    ok((await page.getAttribute("dialog.wt-watch .wt-player iframe", "src")).includes("dQw4w9WgXcQ"), "Watch and tag on a tagged clip plays it again");
    await page.click('dialog.wt-watch [data-w="layout"][data-v="full"]');
    ok(await page.evaluate(() => { const d = document.querySelector("dialog.wt-watch"); const r = d.getBoundingClientRect(); return d.open && d.classList.contains("wt-full") && r.width >= innerWidth - 2 && r.height >= innerHeight - 2 && d.querySelector(".wt-player iframe").src.includes("dQw4w9WgXcQ"); }), "Full screen fills the window and keeps the clip");
    await page.click('dialog.wt-watch [data-w="layout"][data-v="side"]');
    ok(await page.evaluate(() => { const r = document.querySelector("dialog.wt-watch").getBoundingClientRect(); return document.body.classList.contains("wt-dock-side") && Math.abs(r.width - innerWidth / 2) < 3 && r.right >= innerWidth - 2; }), "Side by side takes the right half and leaves the film beside it");
    ok(await page.evaluate(() => localStorage.getItem("curio-watch-layout-v1") === "side"), "the choice is remembered on this device");
    await page.click('dialog.wt-watch [data-w="layout"][data-v="stack"]');
    ok(await page.evaluate(() => { const r = document.querySelector("dialog.wt-watch").getBoundingClientRect(); return document.body.classList.contains("wt-dock-stack") && !document.body.classList.contains("wt-dock-side") && r.top <= 1 && Math.abs(r.height - innerHeight / 2) < 3; }), "Stacked takes the top half");
    await page.click('dialog.wt-watch [data-w="shut"]');
    ok(await page.evaluate(() => !document.querySelector("dialog.wt-watch").open && !/wt-dock/.test(document.body.className)), "Close gives the whole window back");
    ok(await page.evaluate(() => !!document.querySelector("#lib-menu [data-watch-tag]")), "the Library menu opens Watch and tag");
    ok(errors.length === 0, "no page errors" + (errors.length ? ": " + errors.join(" | ") : ""));
  } catch (e) {
    ok(false, e.message + (errors.length ? " page errors: " + errors.join(" | ") : ""));
  }
  await browser.close();
  server.close();
  process.exit(failed ? 1 : 0);
})();
