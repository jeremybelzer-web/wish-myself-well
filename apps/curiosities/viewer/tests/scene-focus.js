/* \u201cWould you like to choose a closely related curiosity?\u201d, the pop-up after a change: node apps/curiosities/viewer/tests/scene-focus.js [--shots dir]
   (needs Playwright and Chromium; set NODE_PATH to where Playwright is installed if it is not local).

   Changing a curiosity in the Viewer (here the feeling, the lines and the camera height of a panel, like a
   gestures + dialogue + emotion suite) pops it up once you stop: a type-in box at the top, a menu of 4
   curiosities picked to start, a scrollable list of options with Jeremy's kinds (a setting, a camera angle, an
   extra character's line). Typing filters it; ticked options apply to the panel as one undo step; "Not now"
   leaves a ✨ button that brings it back; "Ask me after changes" off stops it; the engine path writes My film's
   cells; it fits a phone; test runs without ?focusask=1 never pop it up; no page errors. Also checks the
   suggester in Node. */
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

const WAITMS = 2000;
let fails = 0;
const ok = (cond, msg) => {
  console.log((cond ? "ok   " : "FAIL ") + msg);
  if (!cond) fails++;
};

(async () => {
  /* the suggester, in Node */
  const DB = require("../../data/load-db.js");
  const F = require("../scene-focus.js");
  const s = F.suggest([{ cur: "gesture", value: 4 }, { cur: "wordsAmount", value: 4 }, { cur: "emotion", value: "joyful" }], { emotion: "joyful" }, { db: DB });
  ok(s.picks.length === 4, "4 curiosities picked to start: " + s.picks.join(", "));
  ok(s.picks.every((id) => !["gesture", "wordsAmount", "emotion"].includes(id)), "none of them is one you just changed");
  ok(s.scenes.length > 0 && s.options[s.picks[0]].some((o) => /^Like /.test(o.why)), "options say which scenes they are like: " + s.scenes.slice(0, 2).join(" / "));
  const all = Object.values(s.options).flat().map((o) => o.label);
  ok(["Bright blue sky (Setting)", "In a large mansion (Setting)", "From below shot (Camera angle)", "“Great to see you again” (Extra character)"].every((l) => all.includes(l)), "Jeremy's examples are options");
  ok(F.suggest([], {}, { db: DB }).picks.length === 4, "with nothing known it still offers 4");

  const server = await serve();
  const base = `http://127.0.0.1:${server.address().port}/index.html`;
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(base + "?viewer=1");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForFunction(() => window.CurioViewer && CurioViewer.isOpen() && window.CurioSceneFocus, null, { timeout: 20000 });
  const edit = () =>
    page.evaluate(() => {
      CurioViewer.select(2);
      CurioViewer.edit("test");
      const p = CurioViewer.live().panel;
      p.v.emotion = p.v.emotion === "angry" ? "fearful" : "angry";
      p.words.push({ who: "biju", text: "You did what?" });
      CurioViewer.changed(true);
    });
  await page.waitForTimeout(600);
  await edit();
  await page.waitForTimeout(2200);
  ok(!(await page.isVisible(".sf-back")), "a test run without ?focusask=1 is never interrupted");

  await page.goto(base + "?viewer=1&focusask=1");
  await page.waitForFunction(() => window.CurioViewer && CurioViewer.isOpen() && window.CurioSceneFocus, null, { timeout: 20000 });
  await page.waitForTimeout(800);
  await page.evaluate(() => CurioViewer.select(2));
  await page.waitForTimeout(200);
  await edit();
  await page.waitForTimeout(400);
  ok(!(await page.isVisible(".sf-back")), "it waits until you stop changing things");
  await page.waitForSelector(".sf-back", { state: "visible", timeout: 5000 }).catch(() => {});
  ok(await page.isVisible(".sf-back"), "after a change it pops up");
  const why = await page.textContent(".sf-why");
  ok(/You changed .*Emotion/.test(why), "it says what you changed: " + why.slice(0, 120));
  ok(/Would you like to choose a closely related curiosity\?/.test(await page.textContent(".sf-head h2")), "its title asks: Would you like to choose a closely related curiosity?");
  const seen = await page.evaluate(() => {
    const st = document.querySelector(".cv-stage").getBoundingClientRect();
    const box = document.querySelector(".sf-box").getBoundingClientRect();
    const hit = document.elementFromPoint(st.left + st.width * 0.35, st.top + st.height / 2);
    return { free: !!hit && !hit.closest(".sf-back"), dim: getComputedStyle(document.querySelector(".sf-back")).backgroundColor, side: box.left > st.left + st.width * 0.4 };
  });
  ok(seen.free && /rgba\(0, 0, 0, 0\)|transparent/.test(seen.dim) && seen.side, "the Viewer stays in sight and usable while it is open (no dark cover, the box sits to the side)");
  const tabs = await page.$$eval(".sf-tab", (t) => t.map((x) => x.textContent));
  ok(tabs.join() === "Related,Curiosities,3D,Lanes,Overlay,Timeline", "tabs at the top: " + tabs.join(", "));
  const top = await page.evaluate(() => {
    const t = document.querySelector(".sf-type").getBoundingClientRect();
    const c = document.querySelector(".sf-curs").getBoundingClientRect();
    const l = document.querySelector(".sf-list").getBoundingClientRect();
    return t.bottom <= c.top + 1 && c.bottom <= l.top + 1 && document.activeElement.classList.contains("sf-type");
  });
  ok(top, "the type-in box is at the top (and has the cursor), the curiosity menu under it, then the list");
  ok((await page.locator(".sf-cur[aria-pressed=true]").count()) === 4, "4 curiosities are picked to start");
  ok(await page.$eval(".sf-list", (l) => getComputedStyle(l).overflowY === "auto" && l.scrollHeight > l.clientHeight), "the options list scrolls");
  const n0 = await page.locator(".sf-opt").count();
  await page.selectOption(".sf-more", "angleHeight");
  ok((await page.locator(".sf-cur[aria-pressed=true]").count()) === 5 && (await page.locator(".sf-opt").count()) > n0, "+ More curiosities adds one to the menu and its options");
  await page.fill(".sf-type", "from below");
  await page.waitForTimeout(100);
  const shown = await page.$$eval(".sf-opt", (o) => o.map((x) => x.textContent));
  ok(shown.length >= 1 && shown.every((t) => /from below/i.test(t)), "typing filters the list: " + shown.join(" / "));
  await page.check(".sf-opt input");
  await page.fill(".sf-type", "great to see");
  await page.waitForTimeout(100);
  await page.check(".sf-opt input");
  await page.fill(".sf-type", "");
  ok((await page.textContent(".sf-go")) === "Change 2", "two ticked: the button says Change 2");
  if (SHOTS) await page.locator(".sf-box").screenshot({ path: path.join(SHOTS, "scene-focus.png") });
  const before = await page.evaluate(() => JSON.stringify(CurioViewer.live().panel));
  await page.click(".sf-go");
  await page.waitForTimeout(200);
  const after = await page.evaluate(() => CurioViewer.live().panel);
  ok(!(await page.isVisible(".sf-back")), "Change closes it");
  ok(after.v.angleHeight === "low" && after.cam.height < -4, "From below moved the camera below eye level (" + after.cam.height + ")");
  ok(after.words.some((w) => w.text === "Great to see you again."), "the extra character's line is a new balloon");
  await page.waitForTimeout(WAITMS);
  ok(!(await page.isVisible(".sf-back")), "its own change does not pop it up again");
  await page.evaluate(() => CurioViewer.undo());
  ok((await page.evaluate(() => JSON.stringify(CurioViewer.live().panel))) === before, "one Undo takes it all back");

  await page.evaluate(() => CurioSceneFocus.open({ source: "viewer" }));
  await page.click('.sf-tab[data-tab="all"]');
  const cats = await page.$$eval(".sf-cat", (c) => c.map((x) => x.textContent));
  ok(cats.length >= 10 && cats.includes("Camera") && cats.includes("Comedy"), "Curiosities lists the main categories: " + cats.slice(0, 6).join(", ") + "...");
  await page.click('.sf-cat[data-cat="feeling"]');
  const pickId = await page.$eval(".sf-catcurs [data-sf=pick][aria-pressed=false]", (b) => b.dataset.id);
  await page.click(`.sf-catcurs [data-id="${pickId}"]`);
  ok((await page.$eval('.sf-tab[aria-selected="true"]', (t) => t.dataset.tab)) === "related" && (await page.locator(`.sf-cur[data-cur="${pickId}"]`).count()) === 1 && (await page.locator(".sf-opt").count()) > 0, "picking one there adds it to Related, with options (" + pickId + ")");
  await page.click('.sf-tab[data-tab="lanes"]');
  await page.waitForTimeout(150);
  ok((await page.$eval(".cv-under", (u) => u.dataset.tab)) === "lanes" && (await page.locator(".cv-under.sf-flash").count()) === 1 && (await page.isVisible(".sf-box")), "Lanes brings up the Viewer's automation lanes and makes them flash; the box stays");
  await page.click('.sf-tab[data-tab="overlay"]');
  await page.waitForTimeout(150);
  ok((await page.$eval(".cv-under", (u) => u.dataset.tab)) === "focus" && (await page.locator(".cv-under .sf-flash").count()) === 1, "Overlay brings up the graph of every lane's nodes and lines and makes it flash");
  await page.click('.sf-tab[data-tab="cube"]');
  await page.waitForTimeout(400);
  ok(await page.evaluate(() => !!document.querySelector(".en-overlay:not([hidden])")), "3D opens the cube of curiosities");
  await page.evaluate(() => CurioEngineUI.close());
  await page.evaluate(() => CurioSceneFocus.close());

  await page.evaluate(() => CurioSceneFocus.open({ source: "viewer" }));
  await page.click("[data-sf=later]");
  ok(!(await page.isVisible(".sf-back")) && (await page.isVisible(".sf-pill")), "Not now closes it and leaves the ✨ button");
  await page.click(".sf-pill");
  ok(await page.isVisible(".sf-back"), "the ✨ button brings it back");
  await page.uncheck(".sf-ask");
  await page.click("[data-sf=close]");
  ok((await page.evaluate(() => CurioSceneFocus.settings().ask)) === false, "Ask me after changes can be turned off (kept)");
  await page.evaluate(() => {
    CurioViewer.edit("test");
    CurioViewer.live().panel.v.emotion = "loving";
    CurioViewer.changed(true);
  });
  await page.waitForTimeout(WAITMS);
  ok(!(await page.isVisible(".sf-back")), "turned off, a change does not pop it up");

  const eng = await page.evaluate(() => {
    const E = CurioEngine;
    if (!E.state().rows.length) E.send({ type: "importFilm", film: CurioSeeds.starter() });
    const r = CurioSceneFocus.apply([{ set: { angleHeight: "overhead", "setStyle.wealth": "palatial" } }], "engine");
    const st = E.state();
    const row = st.rows[CurioScreen && CurioScreen.row ? CurioScreen.row() : 0].id;
    const vals = Object.keys(E.result().dest).filter((k) => k.startsWith(row + "|")).map((k) => k.split("|")[2] + "=" + E.result().dest[k]);
    E.undo();
    return { ok: r.ok, vals };
  });
  ok((eng.ok && eng.vals.includes("angleHeight=overhead") && eng.vals.includes("setStyle.wealth=palatial")), "on My film's engine it writes the cells at the playhead (adding a lane when none has it): " + eng.vals.filter((v) => /angleHeight|wealth/.test(v)).join(", "));

  await page.setViewportSize({ width: 390, height: 800 });
  await page.evaluate(() => CurioSceneFocus.open({ source: "viewer" }));
  await page.waitForTimeout(200);
  const fit = await page.evaluate(() => {
    const b = document.querySelector(".sf-box").getBoundingClientRect();
    return b.left >= -1 && b.right <= innerWidth + 1 && b.bottom <= innerHeight + 1 && document.documentElement.scrollWidth <= innerWidth + 1;
  });
  ok(fit, "on a phone it fits the screen");

  ok(errors.length === 0, "no page errors" + (errors.length ? ": " + errors.join(" | ") : ""));
  await browser.close();
  server.close();
  console.log(fails ? `${fails} failed` : "all passed");
  process.exit(fails ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
