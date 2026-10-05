/* The App Walkthrough in a real browser: node apps/curiosities/viewer/tests/walkthrough.js [--shots dir]
   (needs Playwright and Chromium; set NODE_PATH to where Playwright is installed if it is not local).

   A first visit starts the tour by itself, once. Every step shows a thought bubble with its title, and the
   steps that point at a part light that part up (the Viewer's, the Screen's and the app's own). Next walks
   the whole tour to Done, which puts the Viewer back on top. Help ▾ is at the top of the Viewer, the Screen
   and the app, and Help ▸ App Walkthrough opens the tour again. Escape closes it. No page errors.

   Every lit part is on screen with size and something in it. The Screen's steps and the app's steps also show
   the real part with nothing over it (the Screen open and the Viewer closed; for the app, both closed).
   The walk is done twice: once as above, and once with the Screen open on start (as people get it) and
   another part's own .cv-root on the page, the way voice/voice.js's 🎤 has one. That second .cv-root once
   took the Viewer's full-window layout and covered the Screen and the app in black whenever the Viewer
   closed. Ending the tour puts back what was open: the Viewer, the Screen and the Screen's view. */
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

/* Another part's own .cv-root, made the way voice/voice.js makes its 🎤 (on DOMContentLoaded, before the Viewer). */
const OTHER_CV_ROOT = () =>
  document.addEventListener("DOMContentLoaded", () => {
    const st = document.createElement("style");
    st.textContent = ".cv-root { position: fixed; left: 12px; bottom: 12px; z-index: 2147483000; }";
    document.head.appendChild(st);
    const el = document.createElement("div");
    el.className = "cv-root";
    el.dataset.other = "1";
    el.innerHTML = '<button type="button" class="cv-mic">🎤</button><div class="cv-box" hidden></div>';
    document.body.appendChild(el);
  });

/* The lit part as people see it: on screen, with size and content, and on top at every sampled point (the
   tour's own bubble and dots aside). Also what is open: the Viewer and the Screen. */
function partSeen(sel) {
  const el = document.querySelector(sel);
  const out = { sel, found: !!el, viewer: !!(window.CurioViewer && CurioViewer.isOpen()), screen: !!(window.CurioScreen && CurioScreen.isOpen()) };
  if (!el) return out;
  const r = el.getBoundingClientRect();
  const L = Math.max(0, r.left), T = Math.max(0, r.top), R = Math.min(innerWidth, r.right), B = Math.min(innerHeight, r.bottom);
  out.size = [Math.round(R - L), Math.round(B - T)];
  out.onScreen = R - L > 2 && B - T > 2;
  out.content = el.innerText.trim().length > 0 || !!el.querySelector("svg, canvas, img, video");
  const ours = (e) => e.closest(".cw-bubble, .cw-dot, .cw-light, .cw-menu");
  const pts = [[0.5, 0.5], [0.2, 0.3], [0.8, 0.3], [0.2, 0.7], [0.8, 0.7]];
  out.hits = 0;
  out.covers = [];
  pts.forEach(([fx, fy]) => {
    const x = L + (R - L) * fx, y = T + (B - T) * fy;
    const top = document.elementsFromPoint(x, y).find((e) => !ours(e));
    if (!top) return;
    if (el === top || el.contains(top)) out.hits++;
    else out.covers.push(top.tagName.toLowerCase() + (typeof top.className === "string" && top.className.trim() ? "." + top.className.trim().split(/\s+/).join(".") : ""));
  });
  out.ok = out.onScreen && out.content && out.hits > 0 && out.covers.length === 0;
  return out;
}
const SCREEN_STEPS = ["The Screen", "Looking through", "The curiosity library", "The player", "Details", "The timeline", "Back to the app"];
const APP_STEPS = ["My film, Storyboard and Library", "Workspaces", "Library"];

/* Walks the tour with Next to Done, checking every lit step's part; shots go to SHOTS/prefix-NN.png. */
async function walkAll(page, steps, prefix) {
  const seen = [];
  for (let n = 0; n < steps.length + 2; n++) {
    const at = await page.evaluate(() => CurioWalkthrough.step());
    if (at < 0) break;
    const s = steps[at];
    const info = await page.evaluate(() => {
      const b = document.querySelector(".cw-bubble");
      const r = b.getBoundingClientRect();
      const lit = !document.querySelector(".cw-light").classList.contains("cw-none");
      return { title: b.querySelector("h3").textContent, inView: r.left >= 0 && r.top >= 0 && r.right <= innerWidth && r.bottom <= innerHeight, lit };
    });
    const part = s.sel ? await page.evaluate(partSeen, s.sel) : null;
    seen.push({ at, title: info.title, part: s.part, sel: s.sel, lit: info.lit, inView: info.inView, seen: part });
    if (SHOTS) await page.screenshot({ path: path.join(SHOTS, `${prefix}-${String(at + 1).padStart(2, "0")}.png`) });
    await page.click(".cw-bubble .cw-next");
    await page.waitForTimeout(260);
  }
  return seen;
}
function checkParts(seen, label, screen) {
  const bad = seen.filter((x) => x.sel && !(x.seen && x.seen.onScreen && x.seen.content));
  ok(bad.length === 0, `${label}: every lit part is on screen and has something in it` + (bad.length ? ": " + bad.map((x) => `${x.title} ${JSON.stringify(x.seen)}`).join(" | ") : ""));
  const named = (list) => list.map((t) => seen.find((x) => x.title === t));
  const sc = named(SCREEN_STEPS);
  if (!screen) ok(sc.every((x) => !x), `${label}: no step points at the full editor, which is no longer an option`);
  else ok(sc.every((x) => x && x.seen && x.seen.ok && x.seen.screen && !x.seen.viewer), `${label}: the Screen's ${SCREEN_STEPS.length} steps show the Screen itself, with the Viewer closed` + (sc.some((x) => !x) ? ": missing " + SCREEN_STEPS.filter((t, i) => !sc[i]).join(", ") : ""));
  const ap = named(APP_STEPS);
  ok(ap.every((x) => x && x.seen && x.seen.ok && !x.seen.screen && !x.seen.viewer), `${label}: the app's ${APP_STEPS.length} steps show the app's own pages, with the Viewer and the Screen closed` + (ap.some((x) => !x) ? ": missing " + APP_STEPS.filter((t, i) => !ap[i]).join(", ") : ""));
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
  await page.goto(base + "?viewer=1&walkthrough=1");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForSelector(".cw-bubble", { timeout: 20000 });
  await page.waitForTimeout(200);

  ok(await page.isVisible(".cw-bubble"), "a first visit starts the walkthrough by itself");
  ok((await page.evaluate(() => localStorage.getItem(CurioWalkthrough.key))) === "1", "it remembers the tour was seen");
  const steps = await page.evaluate(() => CurioWalkthrough.steps());
  ok(steps.length >= 20, `the tour has a step for every part (${steps.length})`);

  const seen = await walkAll(page, steps, "walk");
  const parts = new Set(seen.filter((x) => x.sel && x.lit).map((x) => x.part));
  const missed = seen.filter((x) => x.sel && !x.lit);
  ok(seen.length >= steps.length - 1, `Next walks the tour (${seen.length} of ${steps.length} steps shown)`);
  ok(missed.length === 0, "every step lights up its part" + (missed.length ? ": missed " + missed.map((x) => x.title).join(", ") : ""));
  ok(seen.every((x) => x.inView), "every bubble fits on the screen");
  ok(parts.size >= 3, `the tour covers the Viewer, the app and Help (${[...parts].join(", ")})`);
  ok(!(await page.isVisible(".cw-bubble")), "Done closes the walkthrough");
  ok(await page.evaluate(() => CurioViewer.isOpen()), "the Viewer is back on top afterward");
  checkParts(seen, "first walk");
  const sw = steps.findIndex((s) => s.title === "Switch films from the corner");
  await page.evaluate((i) => CurioWalkthrough.start(i), sw);
  await page.waitForTimeout(200);
  const swText = await page.textContent(".cw-bubble p");
  await page.keyboard.press("Escape");
  await page.waitForTimeout(100);
  ok(/‹ ›/.test(swText) && /click and drag left or right/.test(swText) && /swipe between films/.test(swText) && !/video from your computer/.test(swText), "Switch films says: tap the ‹ › arrows, or click and drag left or right to swipe between films (no 'a video from your computer')");

  ok(await page.isVisible(".cv-bar .cw-help"), "Help is at the top of the Viewer");
  await page.click(".cv-bar .cw-help");
  ok(await page.isVisible(".cw-menu [data-cw=tour]"), "Help shows App Walkthrough");
  ok((await page.textContent(".cw-menu [data-cw=tour]")).includes("App Walkthrough"), "it is called App Walkthrough");
  await page.click(".cw-menu [data-cw=tour]");
  await page.waitForTimeout(200);
  ok(await page.isVisible(".cw-bubble"), "Help ▸ App Walkthrough opens the tour again");
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(200);
  ok((await page.evaluate(() => CurioWalkthrough.step())) === 1, "the right arrow key goes to the next step");
  await page.keyboard.press("Escape");
  await page.waitForTimeout(100);
  ok(!(await page.isVisible(".cw-bubble")), "Escape closes it");

  await page.click(".cv-bar [data-act=close]");
  await page.evaluate(() => window.CurioScreen && !CurioScreen.isOpen() && CurioScreen.open());
  await page.waitForTimeout(300);
  ok(await page.isVisible(".sc-page .sc-bar .cw-help"), "Help is at the top of the Screen");
  await page.evaluate(() => window.CurioScreen && CurioScreen.close());
  await page.waitForTimeout(300);
  ok(await page.isVisible(".tabs-top .cw-help"), "Help is at the top of the app");
  await page.click(".tabs-top .cw-help");
  await page.click(".cw-menu [data-cw=tour]");
  await page.waitForTimeout(200);
  ok(await page.isVisible(".cw-bubble"), "the app's Help opens the tour too");
  await page.keyboard.press("Escape");

  await page.reload();
  await page.waitForTimeout(1500);
  ok(!(await page.isVisible(".cw-bubble")), "it does not start by itself a second time");

  /* As people get it: the Screen open on start, and another part's own .cv-root on the page. */
  /* a fresh browser profile, so nothing is remembered (clearing after the first load raced the tour's own start) */
  const realCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const real = await realCtx.newPage();
  real.on("pageerror", (e) => errors.push(e.message));
  await real.addInitScript(OTHER_CV_ROOT);
  await real.goto(base + "?viewer=1&walkthrough=1&screen=1");
  await real.waitForSelector(".cw-bubble", { timeout: 20000 });
  await real.waitForTimeout(200);
  ok(await real.evaluate(() => !!document.querySelector(".cv-root[data-other]") && CurioScreen.isOpen() && CurioViewer.isOpen()), "second walk: the Screen is open under the Viewer, with another part's .cv-root on the page");
  /* ?screen=1 brings the Screen's own steps back, so this tour is longer than the first. */
  const steps2 = await real.evaluate(() => CurioWalkthrough.steps());
  const seen2 = await walkAll(real, steps2, "real");
  ok(seen2.length >= steps2.length - 1, `second walk: Next walks the tour (${seen2.length} of ${steps2.length} steps shown)`);
  checkParts(seen2, "second walk", true);
  ok(await real.evaluate(() => { const o = document.querySelector(".cv-root[data-other]").getBoundingClientRect(); return o.width < 200 && o.height < 200; }), "the Viewer's full-window layout stays on its own root, not on another part's .cv-root");
  ok(await real.evaluate(() => CurioViewer.isOpen() && CurioScreen.isOpen()), "second walk: Done puts back the Viewer over the Screen");

  /* Started from the Screen in Arrange view with the Viewer closed: ending (or skipping) puts all of it back. */
  await real.evaluate(() => { CurioViewer.close(); CurioScreen.view("arrange"); });
  await real.waitForTimeout(150);
  const lib = steps2.findIndex((s) => s.title === "The curiosity library");
  await real.evaluate((i) => CurioWalkthrough.start(i), lib);
  await real.waitForTimeout(300);
  const mid = await real.evaluate(partSeen, ".sc-page .sc-lib");
  ok(mid.ok && (await real.evaluate(() => CurioScreen.view())) === "screen", "from Arrange, the library step switches the Screen to its Screen view and shows the library" + (mid.ok ? "" : ": " + JSON.stringify(mid)));
  await real.keyboard.press("Escape");
  await real.waitForTimeout(150);
  ok(await real.evaluate(() => !CurioViewer.isOpen() && CurioScreen.isOpen() && CurioScreen.view() === "arrange"), "skipping puts back what was open: the Screen in Arrange view, the Viewer closed");
  const ws = steps2.findIndex((s) => s.title === "Workspaces");
  await real.evaluate((i) => CurioWalkthrough.start(i), ws);
  await real.waitForTimeout(300);
  ok((await real.evaluate(partSeen, "#ws-buttons")).ok, "an app step shows the app's own Workspaces");
  await real.click(".cw-bubble .cw-x");
  await real.waitForTimeout(150);
  ok(await real.evaluate(() => !CurioViewer.isOpen() && CurioScreen.isOpen() && CurioScreen.view() === "arrange"), "closing it from an app step puts the Screen back too");
  await real.evaluate(() => CurioScreen.view("screen"));
  await real.close();

  const phone = await browser.newPage({ viewport: { width: 390, height: 800 } });
  phone.on("pageerror", (e) => errors.push(e.message));
  await phone.goto(base + "?viewer=1&walkthrough=1");
  await phone.evaluate(() => localStorage.clear());
  await phone.reload();
  await phone.waitForSelector(".cw-bubble", { timeout: 20000 });
  let fit = true;
  for (let n = 0; n < 6; n++) {
    fit = fit && (await phone.evaluate(() => { const r = document.querySelector(".cw-bubble").getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth + 1; }));
    await phone.click(".cw-bubble .cw-next");
    await phone.waitForTimeout(200);
  }
  ok(fit, "on a phone the bubbles fit the screen");
  await phone.keyboard.press("Escape");
  await phone.evaluate(() => { window.CurioViewer.close(); window.CurioScreen && CurioScreen.isOpen() && CurioScreen.close(); });
  await phone.setViewportSize({ width: 320, height: 800 });
  await phone.waitForTimeout(200);
  const over = await phone.evaluate(() => { const t = document.querySelector(".tabs-top"); return Math.max(t.scrollWidth - t.clientWidth, ...[...t.children].filter((e) => e.offsetParent).map((e) => e.getBoundingClientRect().right - t.getBoundingClientRect().right)); });
  ok(over <= 0.5, `at 320px the app's top row still fits (${Math.round(over)}px over)`);
  await phone.click("#lib-btn");
  ok(await phone.isVisible("#lib-menu [data-cw-lib=tour]"), "on a phone Library carries App Walkthrough");
  ok(await phone.isVisible("#lib-menu [data-viewer]"), "and the Viewer");
  await phone.click("#lib-menu [data-cw-lib=tour]");
  await phone.waitForTimeout(200);
  ok((await phone.isVisible(".cw-bubble")) && !(await phone.isVisible("#lib-menu")), "it opens the tour and closes Library");
  await phone.keyboard.press("Escape");
  if (SHOTS) await phone.screenshot({ path: path.join(SHOTS, "walk-phone.png") });

  ok(errors.length === 0, "no page errors" + (errors.length ? ": " + errors.join(" | ") : ""));
  if (process.env.WALK_DEBUG) console.log(JSON.stringify(seen, null, 1));
  await browser.close();
  server.close();
  console.log(fails ? `${fails} failed` : "all passed");
  process.exit(fails ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
