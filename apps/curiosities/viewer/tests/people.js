/* The Viewer's People tab in a real browser: node apps/curiosities/viewer/tests/people.js [--shots dir]
   (Jeremy's notes, 2026-10-04 20:16Z). Each character gets an emotion wheel (Plutchik's eight feelings, mild to
   intense, blends named), an Enneagram type and health from the Character matrix, a place in the chaos matrix
   with a why, all set panel by panel (◆ keys that hold until the next one); changing a type partway through
   shows Jeremy's warning first; the emotional roadmap shows everyone's feeling in every panel and clicking it
   goes there; the 3D tilt works; undo works; it fits a phone; no errors. */
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
    localStorage.removeItem("curiosities-viewer-windows-v1");
    localStorage.removeItem("curiosities-viewer-winmode-v1");
  });
  await page.reload();
  await page.waitForFunction(() => window.CurioViewer && CurioViewer.isOpen(), null, { timeout: 20000 });
  await page.waitForTimeout(300);

  const L = (f, a) => page.evaluate(f, a);
  const shot = (name) => SHOTS && page.screenshot({ path: path.join(SHOTS, name + ".png") });
  const tab = page.locator('.cv-tabs [data-tab="people"]');
  ok((await tab.count()) === 1, "there is a People tab");
  await tab.click();
  await page.waitForTimeout(150);
  ok((await page.locator(".cvp-who button").count()) >= 2, "it lists the people in the scene");

  const names = await L(() => [
    CurioPeople.emotionName({ a: 0, r: 0.9 }),
    CurioPeople.emotionName({ a: 22.5, r: 0.6 }),
    CurioPeople.emotionName({ a: 180, r: 0.3 }),
    CurioPeople.emotionName({ a: 90, r: 0.05 }),
  ]);
  ok(names.join(",") === "ecstasy,love,pensiveness,calm", "the wheel names feelings like Plutchik's: " + names.join(", "));

  /* the sample cast: the passenger's grief at "It's gone", held into the next panel */
  const g7 = await L(() => CurioPeople.emotionName(CurioPeople.at(6, "passenger").emo));
  ok(g7 === "grief", `the sample passenger is in grief at "It's gone" (${g7})`);
  const h8 = await L(() => CurioPeople.at(7, "passenger"));
  ok(h8.health === 8 && h8.from.health === 6, "and panel 8 holds the health set in panel 7");

  /* pick the passenger, go to panel 9, click the wheel's anger side */
  await page.click('[data-pwho="passenger"]');
  await L(() => CurioViewer.select(8));
  await page.waitForTimeout(150);
  await page.locator(".cvp-wheel").scrollIntoViewIfNeeded();
  const wb2 = await page.locator(".cvp-wheel").boundingBox();
  /* anger is at 270° (left of the middle), near the rim */
  await page.mouse.click(wb2.x + wb2.width * 0.5 - wb2.width * 0.4 * 0.9, wb2.y + wb2.height * 0.5);
  await page.waitForTimeout(100);
  const n9 = await L(() => CurioPeople.emotionName(CurioViewer.live().panel.people.passenger.emo));
  ok(n9 === "rage", `clicking the rim of anger sets rage in this panel (${n9})`);
  ok((await page.textContent(".cvp-emo")) === "rage", "and the heading says so");
  ok((await page.locator('[data-pk="emo"].on').count()) === 1, "with a ◆ key on Feeling");
  await page.click('[data-pk="emo"]');
  await page.waitForTimeout(80);
  const back = await L(() => CurioPeople.emotionName(CurioPeople.at(8, "passenger").emo));
  ok(back !== "rage", `clicking ◆ takes the key out, so it holds what came before (${back})`);

  /* the chaos matrix */
  await page.locator(".cvp-chaos").scrollIntoViewIfNeeded();
  const cb = await page.locator(".cvp-chaos").boundingBox();
  await page.mouse.move(cb.x + cb.width * 0.9, cb.y + cb.height * 0.2);
  await page.mouse.down();
  await page.mouse.move(cb.x + cb.width * 0.92, cb.y + cb.height * 0.15, { steps: 3 });
  await page.mouse.up();
  const c9 = await L(() => CurioPeople.at(8, "passenger"));
  ok(c9.chaos > 80 && c9.change > 70 && c9.from.chaos === 8, `dragging in the chaos matrix places them (chaotic ${c9.chaos}, change ${c9.change})`);
  ok(/Wildfire/.test(await page.textContent(".cvp-place")), "and names the corner: " + (await page.textContent(".cvp-place")));

  /* health and why */
  await page.$eval('[data-pf="health"]', (el) => {
    el.value = "2";
    el.dispatchEvent(new Event("change", { bubbles: true }));
  });
  ok((await L(() => CurioPeople.at(8, "passenger").health)) === 2, "health is set in this panel");
  await page.fill('[data-pf="why"]', "The rage finally pushes them to act.");
  await page.$eval('[data-pf="why"]', (el) => el.dispatchEvent(new Event("change", { bubbles: true })));
  ok((await L(() => CurioPeople.at(9, "passenger").why)) === "The rage finally pushes them to act.", "the why is kept and held into the next panel");

  /* who they act like: health moves them along the Enneagram's lines (Jeremy, 22:06Z) */
  let A = await L(() => CurioPeople.at(8, "passenger").acts);
  ok(A && A.n === 9 && A.how === "growth", "at health 2 the Loyalist (6) acts like a Peacemaker (9), their growth number");
  ok(/Peacemaker/.test(await page.textContent(".cvp-body")) && /growth line/.test(await page.textContent(".cvp-body")), "and the tab says so in words");
  A = await L(() => CurioPeople.at(6, "passenger").acts);
  ok(A && A.n === 3 && A.how === "stress" && !A.lean, "at health 8 they act like an Achiever (3), their stress number");
  ok((await L(() => CurioPeople.at(0, "passenger").acts.how)) === "own", "at average health they act like themselves");
  await page.selectOption('[data-pf="acts"]', "5");
  A = await L(() => CurioPeople.at(8, "passenger").acts);
  ok(A.n === 5 && A.how === "set" && (await page.locator('[data-pk="acts"].on').count()) === 1, "who they act like can be set by hand, with a ◆ key");
  await page.selectOption('[data-pf="acts"]', "");
  ok((await L(() => CurioPeople.at(8, "passenger").acts.n)) === 9, "and handed back to their health");

  /* what they want right now */
  await page.fill('[data-pf="motive"]', "Make the driver pay for this.");
  await page.$eval('[data-pf="motive"]', (el) => el.dispatchEvent(new Event("change", { bubbles: true })));
  ok((await L(() => CurioPeople.at(9, "passenger").motive)) === "Make the driver pay for this.", "their motivation is kept and held into the next panel");
  ok((await L(() => CurioPeople.at(0, "passenger").motive)) === "Get across town on time without anyone noticing she's late.", "the sample passenger starts with a motivation");

  /* their normal amount of chaos */
  ok((await L(() => CurioPeople.at(8, "passenger").normal.chaos)) === 45, "the sample passenger has a normal amount of chaos");
  ok(/more chaotic than usual/.test(await page.textContent(".cvp-usual")), "and the tab compares this panel to it: " + (await page.textContent(".cvp-usual")));
  await page.click('[data-pa="normalhere"]');
  ok(/about as chaotic as usual/.test(await page.textContent(".cvp-usual")), "Make this their normal moves the ring to the dot");
  await page.waitForTimeout(1000); /* quick changes of the same kind join one undo step */
  await page.$eval('[data-pf="normal"]', (el) => {
    el.value = "10";
    el.dispatchEvent(new Event("change", { bubbles: true }));
  });
  ok((await L(() => CurioPeople.at(3, "passenger").normal.chaos)) === 10, "the slider sets their normal for the whole film");
  await L(() => CurioViewer.undo());
  await page.waitForTimeout(80);
  ok((await L(() => CurioPeople.at(3, "passenger").normal.chaos)) > 80, "undo takes the normal back");
  await L(() => CurioViewer.undo());
  await page.waitForTimeout(80);
  ok((await L(() => CurioPeople.at(3, "passenger").normal.chaos)) === 45, "and again");
  await L(() => CurioViewer.select(8));
  await page.waitForTimeout(80);

  /* changing their Enneagram type partway through */
  await page.selectOption('[data-pf="type"]', "8");
  await page.waitForTimeout(80);
  const warn = await page.textContent(".cvp-warn");
  ok(/massive change in personality/.test(warn) && /near death experience or brain damage, or disease of the mind/.test(warn), "changing the type partway through shows Jeremy's warning first");
  ok((await L(() => CurioPeople.at(8, "passenger").type)) === 6, "and nothing changes until you choose");
  await page.click('[data-pa="typeno"]');
  ok((await page.locator(".cvp-warn").count()) === 0 && (await L(() => CurioPeople.at(8, "passenger").type)) === 6, "Keep leaves the type as it was");
  await page.selectOption('[data-pf="type"]', "8");
  await page.click('[data-pa="typeok"]');
  ok((await L(() => CurioPeople.at(8, "passenger").type)) === 8 && (await L(() => CurioPeople.typeChanges("passenger"))).includes(8), "Change anyway sets it, and the roadmap marks the change");
  ok((await page.locator(".cvp-warn").count()) === 1, "the warning stays on that panel");
  await shot("people-warning");

  /* the roadmap: click panel 3 on Biju's row */
  await page.locator(".cvp-road").scrollIntoViewIfNeeded();
  const rb = await page.locator(".cvp-road").boundingBox();
  const geo = await L(() => {
    const cv = document.querySelector(".cvp-road");
    return { W: cv._W, n: CurioViewer.film().panels.length };
  });
  const cw = (geo.W - 76 - 4) / geo.n;
  await page.mouse.click(rb.x + 76 + cw * 2.5, rb.y + 22 + 26 * 1.5);
  await page.waitForTimeout(120);
  ok((await L(() => CurioViewer.panel())) === 2 && (await page.locator('[data-pwho="biju"].on').count()) === 1, "clicking the roadmap goes to that panel and that character");

  /* 3D */
  await page.click('[data-pa="tilt"]');
  await page.waitForTimeout(80);
  const tall = await L(() => {
    const cv = document.querySelector(".cvp-wheel");
    return cv._H / cv._W;
  });
  ok(tall < 0.8, "Tilt into 3D lays the wheel back like Plutchik's cone");
  await shot("people-3d");
  await page.click('[data-pa="tilt"]');

  /* undo */
  await L(() => CurioViewer.undo());
  await page.waitForTimeout(80);
  ok((await L(() => CurioPeople.at(8, "passenger").type)) === 6, "undo takes the type change back");

  /* phone */
  await page.setViewportSize({ width: 390, height: 800 });
  await page.waitForTimeout(300);
  ok(await L(() => document.documentElement.scrollWidth <= innerWidth + 1), "it fits a phone");

  ok(errors.length === 0, "no page errors" + (errors.length ? ": " + errors.join(" | ") : ""));
  await browser.close();
  server.close();
  console.log(fails ? `${fails} failed` : "all passed");
  process.exit(fails ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
