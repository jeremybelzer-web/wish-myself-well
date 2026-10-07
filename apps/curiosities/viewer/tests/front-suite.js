/* Panel names, front and center by hand, curiosity suites and the window's pad (Jeremy, 2026-10-07):
   node apps/curiosities/viewer/tests/front-suite.js (needs Playwright and Chromium; set NODE_PATH if not local).

   Rename panel in the storyboard menu (and clicking the number on the picked panel) names a panel, shown on its
   card, one undo step; right-clicking the attention list puts a curiosity front and center (and the app can decide
   again); a lane's menu has front and center too, and Show curiosity suite opens every setting of that curiosity
   as its own lane; the curiosity window has a pad that sets two settings at once; no page errors. */
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
    localStorage.removeItem("curio-lane-suites-v1");
    localStorage.setItem("curio-focus-tab-v1", "lanes");
    localStorage.setItem("curio-focus-zoom-v1", JSON.stringify({ mode: "film", span: 0 }));
  });
  await page.reload();
  await page.waitForFunction(() => window.CurioViewer && CurioViewer.isOpen() && window.CurioMenu && document.querySelector(".cv-under .cf-ln-edit .cf-ln-dot"), null, { timeout: 20000 });
  const L = (fn, a) => page.evaluate(fn, a);

  /* rename a panel from the menu */
  await page.click('.cv-card[data-i="1"]', { button: "right" });
  await page.click('.csd-menu button:has-text("Rename panel")');
  ok(await page.isVisible(".csd-name input"), "Rename panel opens a name box");
  await page.fill(".csd-name input", "Tuk-tuk at the curb");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(150);
  ok((await L(() => CurioViewer.film().panels[1].name)) === "Tuk-tuk at the curb", "Enter names panel 2");
  ok(/Tuk-tuk at the curb/.test(await page.textContent('.cv-card[data-i="1"] .cv-num')), "the name shows on its card");
  await L(() => CurioViewer.undo());
  ok(!(await L(() => CurioViewer.film().panels[1].name)), "one undo takes the name off");
  /* click the number on the picked panel */
  await L(() => CurioViewer.select(2));
  await page.waitForTimeout(100);
  await page.click('.cv-card[data-i="2"] .cv-num');
  ok(await page.isVisible(".csd-name input"), "clicking the number on the picked panel opens the name box");
  await page.fill(".csd-name input", "Mango");
  await page.click('.csd-name button:has-text("Save")');
  await page.waitForTimeout(150);
  ok((await L(() => CurioViewer.film().panels[2].name)) === "Mango", "Save names it");

  /* front and center by hand, from the attention list */
  await page.click('.cv-under [data-cf-tab="focus"]');
  await L(() => CurioViewer.seek(CurioViewer.starts()[3] + 0.1));
  await page.waitForTimeout(300);
  const before = await L(() => CurioFocusLane.read()[3]);
  const other = await L((lead) => [...document.querySelectorAll(".cv-under .cf-list li[data-g]")].map((li) => li.dataset.g).find((g) => g !== lead), before.leadId);
  ok(!!other, `the list has a curiosity that isn't leading panel 4 (${other}, leading: ${before.leadId})`);
  await page.click(`.cv-under .cf-list li[data-g="${other}"]`, { button: "right" });
  ok(/panel 4/.test(await page.textContent(".csd-menu header")), "right-clicking the list opens a menu for the panel at the playhead");
  await page.click('.csd-menu button:has-text("front and center")');
  await page.waitForTimeout(200);
  const after = await L(() => CurioFocusLane.read()[3]);
  ok(after.leadId === other, `Put front and center makes it lead panel 4 (${after.leadId})`);
  ok((await L(() => CurioFocusLane.panel(3).force)) !== "", "the card's title follows");
  await page.click(`.cv-under .cf-list li[data-g="${other}"]`, { button: "right" });
  await page.click('.csd-menu button:has-text("Let the app decide again")');
  await page.waitForTimeout(200);
  ok((await L(() => CurioFocusLane.read()[3].leadId)) === before.leadId && !(await L(() => CurioViewer.film().panels[3].front)), "Let the app decide again puts it back");
  /* the pie */
  const pie = await page.$(".cv-under .cf-pie");
  const pb = await pie.boundingBox();
  await page.mouse.click(pb.x + pb.width / 2 + 5, pb.y + 8, { button: "right" });
  ok(await page.isVisible('.csd-menu button:has-text("front and center")'), "right-clicking the pie opens the same menu");
  await page.keyboard.press("Escape");

  /* the lanes: front and center and Show curiosity suite */
  await page.click('.cv-under [data-cf-tab="lanes"]');
  await page.waitForTimeout(200);
  const sel = '.cv-under .cf-ln[data-ln="emotion"] .cf-ln-track';
  await page.locator(sel).scrollIntoViewIfNeeded();
  await page.click(sel, { button: "right", position: { x: 30, y: 10 } });
  ok(await page.isVisible('.csd-menu button:has-text("Put Emotion front and center")') || await page.isVisible('.csd-menu button:has-text("front and center")'), "a lane's menu can change what's front and center");
  const n0 = await L(() => document.querySelectorAll(".cv-under .cf-ln-sub").length);
  await page.click('.csd-menu button:has-text("Show curiosity suite")');
  await page.waitForTimeout(200);
  const subs = await L(() => [...document.querySelectorAll(".cv-under .cf-ln-sub")].map((el) => el.dataset.ln));
  ok(n0 === 0 && subs.length >= 8 && subs.every((x) => x.startsWith("emotion.")), `Show curiosity suite opens every setting of Emotion (${subs.length} lanes)`);
  /* set an unset setting from its own lane */
  await page.click(`.cv-under .cf-ln[data-ln="${subs[0]}"] .cf-ln-track`, { button: "right", position: { x: 30, y: 10 } });
  await page.click('.csd-menu .csd-len-row button:text-is("Highest")');
  await page.waitForTimeout(150);
  const hv = await L((id) => {
    const P = CurioViewer.film().panels;
    return P.map((p) => p.v && p.v[id]).filter((v) => v != null);
  }, subs[0]);
  ok(hv.length >= 1, `a setting inside the suite can be set from its lane (${subs[0]} = ${hv[0]})`);
  await page.click(`.cv-under .cf-ln[data-ln="emotion"] .cf-ln-track`, { button: "right", position: { x: 30, y: 10 } });
  await page.click('.csd-menu button:has-text("Hide curiosity suite")');
  await page.waitForTimeout(200);
  ok(!(await L(() => document.querySelector(".cv-under .cf-ln-sub"))), "Hide curiosity suite folds it back");

  /* the window's pad */
  await page.click(`.cv-under .cf-ln[data-ln="emotion"] .cf-ln-track`, { button: "right", position: { x: 30, y: 10 } });
  await page.click('.csd-menu button:has-text("Open the")');
  ok(await page.isVisible(".cf-cwin .cf-pad"), "the curiosity window has a pad");
  const [px, py] = await L(() => document.querySelector(".cf-cwin .cf-pad").dataset.pad.split("|"));
  const cur = await L(() => CurioViewer.live().cur);
  const box = await (await page.$(".cf-cwin .cf-pad")).boundingBox();
  await page.mouse.move(box.x + box.width * 0.2, box.y + box.height * 0.8);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.9, box.y + box.height * 0.1, { steps: 5 });
  await page.mouse.up();
  await page.waitForTimeout(150);
  const pv = await L(([i, a, b]) => [CurioViewer.film().panels[i].v[a], CurioViewer.film().panels[i].v[b]], [cur, px, py]);
  ok(pv[0] != null && pv[1] != null, `dragging the pad sets both settings (${px} = ${pv[0]}, ${py} = ${pv[1]})`);
  ok(await page.isVisible(".cf-cwin .cf-pad-dot"), "the pad shows a dot where it is");
  await L(() => CurioViewer.undo());
  const pu = await L(([i, a]) => (CurioViewer.film().panels[i].v || {})[a], [cur, px]);
  ok(String(pu) !== String(pv[0]) || pu == null, "one undo takes the drag back");

  ok(errors.length === 0, "no page errors" + (errors.length ? ": " + errors.join(" | ") : ""));
  await browser.close();
  server.close();
  console.log(fails ? `${fails} failed` : "all passed");
  process.exit(fails ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
