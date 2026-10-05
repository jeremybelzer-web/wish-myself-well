/* Hover help in a real browser: node apps/curiosities/viewer/tests/hoverhelp.js
   (Jeremy's notes, 2026-10-04 20:16Z). Resting the pointer on a button, a slider, a thing in the picture or any
   part of the Viewer or the Screen shows a bubble saying what it is and what it does, in the walkthrough's
   words for the part; the browser's own tooltip doesn't double it; Help ▸ Hover help turns it off and on, and
   the choice is kept; no errors. */
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
  await page.goto(base + "?viewer=1&hoverhelp=1");
  await page.evaluate(() => {
    localStorage.removeItem("curiosities-viewer-v1");
    localStorage.removeItem("curiosities-viewer-windows-v1");
    localStorage.removeItem("curiosities-viewer-winmode-v1");
  });
  await page.reload();
  await page.waitForFunction(() => window.CurioViewer && CurioViewer.isOpen(), null, { timeout: 20000 });
  await page.waitForTimeout(300);

  const L = (f, a) => page.evaluate(f, a);
  const bubble = async () => ((await page.isVisible(".hh-bubble")) ? (await page.textContent(".hh-bubble")).replace(/\s+/g, " ") : "");
  const rest = async (x, y) => {
    await page.mouse.move(x - 20, y - 20);
    await page.mouse.move(x, y, { steps: 3 });
    await page.waitForTimeout(800);
    return bubble();
  };
  const mid = async (sel) => {
    const b = await page.locator(sel).first().boundingBox();
    return [b.x + b.width / 2, b.y + b.height / 2];
  };
  ok(await L(() => CurioHoverHelp.on()), "hover help is on");

  let t = await rest(...(await mid('[data-act="play"]')));
  ok(/Play/.test(t) && /space/.test(t), "resting on Play says what it does: " + t);
  ok((await L(() => !document.querySelector('[data-act="play"]').getAttribute("title"))), "and the browser's own tooltip is held back meanwhile");
  await rest(...(await mid(".cv-strip-head")));
  ok((await L(() => document.querySelector('[data-act="play"]').getAttribute("title"))) === "Play (space)", "the button's own description comes back after");

  await page.click('.cv-tabs [data-tab="camera"]');
  await page.waitForTimeout(100);
  const slider = page.locator('.cv-details input[type="range"]').first();
  const sb = await slider.boundingBox();
  t = await rest(sb.x + sb.width / 2, sb.y + sb.height / 2);
  ok(/Slide from/.test(t) && /Camera & lens/.test(t), "a slider: its name, its two ends and the part it is in: " + t);

  /* a building in the picture */
  const spot = await L(() => {
    const L0 = CurioViewer.live();
    const r = L0.canvas.getBoundingClientRect();
    const p = L0.picks.find((q) => q.obj && /^b/.test(q.obj));
    if (!p) return null;
    const cx = p.s.reduce((a, q) => a + q[0], 0) / p.s.length;
    const cy = p.s.reduce((a, q) => a + q[1], 0) / p.s.length;
    return [r.left + (cx / L0.canvas.width) * r.width, r.top + (cy / L0.canvas.height) * r.height];
  });
  t = spot ? await rest(...spot) : "";
  ok(/Building/.test(t) && /Click to pick/.test(t), "a thing in the picture is named: " + t);

  t = await rest(...(await mid(".cv-under .cf-pie, .cv-under")));
  ok(/Front and center/.test(t), "a part of the Viewer is explained in the walkthrough's words: " + t.slice(0, 90));

  /* Help ▸ Hover help: off */
  await page.mouse.move(5, 5);
  await page.click(".cv-bar .cw-help");
  await page.click('[data-cw="hover"]');
  ok(!(await L(() => CurioHoverHelp.on())), "Help ▸ Hover help turns it off");
  t = await rest(...(await mid('[data-act="play"]')));
  ok(t === "", "and then nothing pops up");
  await page.reload();
  await page.waitForFunction(() => window.CurioViewer && CurioViewer.isOpen() && window.CurioHoverHelp, null, { timeout: 20000 });
  ok(!(await L(() => CurioHoverHelp.on())), "the choice is kept");
  await page.click(".cv-bar .cw-help");
  ok(/Hover help: off/.test(await page.textContent(".cw-menu")), "the menu says it is off");
  await page.click('[data-cw="hover"]');
  ok(await L(() => CurioHoverHelp.on()), "and turns it back on");

  /* the Screen too */
  await page.click('.cv-bar [data-act="close"]');
  await page.waitForTimeout(400);
  const target = await L(() => {
    const b = [...document.querySelectorAll("button")].find((x) => {
      const r = x.getBoundingClientRect();
      return r.width > 20 && r.height > 10 && r.top > 0 && r.top < innerHeight - 20 && !x.closest(".cv-root.cv-viewer") && getComputedStyle(x).visibility !== "hidden";
    });
    if (!b) return null;
    const r = b.getBoundingClientRect();
    return [r.left + r.width / 2, r.top + r.height / 2];
  });
  t = target ? await rest(...target) : "";
  ok(t.length > 3, "it works outside the Viewer too: " + t.slice(0, 80));

  ok(errors.length === 0, "no page errors" + (errors.length ? ": " + errors.join(" | ") : ""));
  await browser.close();
  server.close();
  console.log(fails ? `${fails} failed` : "all passed");
  process.exit(fails ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
