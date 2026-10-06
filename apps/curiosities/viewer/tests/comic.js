/* The comic strip in a real browser: node apps/curiosities/viewer/tests/comic.js [--shots dir]
   (Jeremy's notes, 2026-10-04 20:16Z). A playhead (line and ▼) on the storyboard strip moves with the film;
   dragging along the ruler scrubs, with voice blips for the words and a tick at each new panel; clicking in a
   panel jumps to that moment; Pause goes back to where Play was pressed (or stays, if chosen); Read as a comic
   has Modern comic (frames sized and shaped by the shot and the story, read in order) and Zine layouts; no
   errors. */
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
  await page.waitForFunction(() => window.CurioComic, null, { timeout: 10000 });

  /* the playhead sits at the moment, inside its panel */
  await L(() => CurioViewer.time(CurioViewer.starts()[2] + 1));
  await page.waitForTimeout(100);
  const spot = await L(() => {
    const l = document.querySelector(".cvc-line").getBoundingClientRect();
    const c = document.querySelector('.cv-card[data-i="2"]').getBoundingClientRect();
    return { u: (l.left + 1 - c.left) / c.width, shown: !document.querySelector(".cvc-line").hidden };
  });
  ok(spot.shown && Math.abs(spot.u - 0.5) < 0.04, `the playhead line sits halfway through panel 3 at 1 s of 2 (${spot.u.toFixed(2)})`);
  ok((await page.locator(".cvc-ruler").count()) === 1, "with a ruler above the panels");

  /* click three quarters into panel 2 */
  const c2 = await page.locator('.cv-card[data-i="1"]').boundingBox();
  await page.mouse.click(c2.x + c2.width * 0.75, c2.y + c2.height * 0.4);
  await page.waitForTimeout(100);
  const t2 = await L(() => CurioViewer.time() - CurioViewer.starts()[1]);
  ok((await L(() => CurioViewer.panel())) === 1 && Math.abs(t2 - 1.5) < 0.1, `clicking three quarters into panel 2 jumps to 1.5 s into it (${t2.toFixed(2)} s)`);

  /* scrub along the ruler across panels 6 and 7 (they have words) */
  await page.locator('.cv-card[data-i="6"]').scrollIntoViewIfNeeded();
  const rb = await page.locator(".cvc-ruler").boundingBox();
  const c6 = await page.locator('.cv-card[data-i="5"]').boundingBox();
  const c7 = await page.locator('.cv-card[data-i="6"]').boundingBox();
  const h0 = await L(() => CurioComic.heard());
  await page.mouse.move(c6.x + 3, rb.y + rb.height / 2);
  await page.mouse.down();
  const seen = [];
  for (let k = 1; k <= 20; k++) {
    await page.mouse.move(c6.x + 3 + ((c7.x + c7.width - 6 - c6.x) * k) / 20, rb.y + rb.height / 2);
    seen.push(await L(() => CurioViewer.time()));
  }
  await page.mouse.up();
  const rising = seen.every((t, k) => k === 0 || t >= seen[k - 1] - 1e-6);
  ok(rising && seen[seen.length - 1] > seen[0] + 3, `dragging along the ruler scrubs through the film (${seen[0].toFixed(1)} s → ${seen[seen.length - 1].toFixed(1)} s)`);
  ok((await L(() => CurioViewer.panel())) === 6, "and lands on the panel under the pointer");
  const h1 = await L(() => CurioComic.heard());
  ok(h1 > h0 + 4, `scrubbing plays the words' syllables and the page turns (${h1 - h0} sounds)`);
  const fwd = await L(() => CurioComic.scrubbed());
  ok(fwd.dir === 1, "dragged right, the sound plays forwards");

  /* drag back to the left: the sound plays backwards, in the order the playhead crosses the words */
  const c7b = await page.locator('.cv-card[data-i="6"]').boundingBox();
  const c6b = await page.locator('.cv-card[data-i="5"]').boundingBox();
  const x1 = c7b.x + c7b.width - 6;
  const x0 = c6b.x + 3;
  await page.mouse.move(x1, rb.y + rb.height / 2);
  await page.mouse.down();
  const back = [];
  let order = true;
  for (let k = 1; k <= 20; k++) {
    await page.mouse.move(x1 - ((x1 - x0) * k) / 20, rb.y + rb.height / 2);
    back.push(await L(() => CurioViewer.time()));
    const b = await L(() => CurioComic.scrubbed());
    if (b.dir === -1 && !b.blips.every((t, j) => j === 0 || t <= b.blips[j - 1])) order = false;
  }
  const bk = await L(() => CurioComic.scrubbed());
  await page.mouse.up();
  ok(back.every((t, k) => k === 0 || t <= back[k - 1] + 1e-6) && back[back.length - 1] < back[0] - 3, `dragging left goes back through the film (${back[0].toFixed(1)} s → ${back[back.length - 1].toFixed(1)} s)`);
  ok(bk.dir === -1 && order, "dragged left, the sound plays backwards, last word first");

  /* the faster the drag, the faster the sound */
  const speedOf = async (steps) => {
    await page.mouse.move(x0, rb.y + rb.height / 2);
    await page.mouse.down();
    let r = 0;
    for (let k = 1; k <= steps; k++) {
      await page.mouse.move(x0 + ((x1 - x0) * k) / steps, rb.y + rb.height / 2);
      if (steps > 4) await page.waitForTimeout(25);
      r = Math.max(r, (await L(() => CurioComic.scrubbed())).rate);
    }
    await page.mouse.up();
    return r;
  };
  const slow = await speedOf(30);
  const fast = await speedOf(3);
  ok(fast > slow * 2, `a quick drag plays faster than a slow one (${fast.toFixed(1)}× against ${slow.toFixed(1)}× normal speed)`);

  /* a jump (a click) makes no sound; only playing or dragging does */
  const hj = await L(() => CurioComic.heard());
  await L(() => CurioViewer.time(CurioViewer.starts()[5] + 0.2));
  await L(() => CurioViewer.time(CurioViewer.starts()[6] + 1.5));
  ok((await L(() => CurioComic.heard())) === hj, "jumping the playhead without dragging it is silent");

  /* the space bar starts and stops the picture and the sound */
  await L(() => CurioViewer.select(5));
  await L(() => document.activeElement && document.activeElement.blur && document.activeElement.blur());
  await page.keyboard.press(" ");
  await page.waitForTimeout(600);
  const on = await L(() => [CurioViewer.playing(), CurioComic.heard()]);
  await page.keyboard.press(" ");
  await page.waitForTimeout(30);
  const off = await L(() => [CurioViewer.playing(), CurioComic.sounding(), CurioComic.heard()]);
  await page.waitForTimeout(400);
  ok(on[0] && !off[0], "the space bar plays, and pressed again stops");
  ok(off[1] === 0 && (await L(() => CurioComic.heard())) === off[2], `and stopping silences every sound at once (${off[1]} left playing)`);

  /* Pause goes back to where Play was pressed */
  await L(() => CurioViewer.select(3));
  const from = await L(() => CurioViewer.time());
  await page.click('[data-act="play"]');
  await page.waitForTimeout(700);
  await page.click('[data-act="play"]');
  await page.waitForTimeout(50);
  ok(Math.abs((await L(() => CurioViewer.time())) - from) < 1e-6 && (await L(() => CurioViewer.panel())) === 3, "Pause goes back to where Play was pressed");
  await page.selectOption('[data-k="afterstop"]', "advance");
  await page.click('[data-act="play"]');
  await page.waitForTimeout(700);
  await page.click('[data-act="play"]');
  ok((await L(() => CurioViewer.time())) > from + 0.4, "with 'stay where it stopped' it stays");
  await page.reload();
  await page.waitForFunction(() => window.CurioViewer && CurioViewer.isOpen() && window.CurioComic, null, { timeout: 20000 });
  ok((await page.$eval('[data-k="afterstop"]', (s) => s.value)) === "advance", "the choice is kept");
  await page.selectOption('[data-k="afterstop"]', "replay");

  /* Read as a modern comic */
  await page.click('[data-act="comic"]');
  await page.waitForTimeout(200);
  await page.selectOption('[data-cmx="layout"]', "modern");
  await page.waitForTimeout(400);
  const frames = await L(() => [...document.querySelectorAll(".cv-card")].map((el) => ({ f: el.dataset.frame, r: el.getBoundingClientRect().toJSON() })));
  const kinds = frames.map((x) => x.f);
  ok(kinds[0] === "establishing" && kinds.includes("splash") && kinds.includes("inset") && new Set(kinds).size >= 4, "Modern comic gives frames by the shot and the story: " + kinds.join(", "));
  const sizes = new Set(frames.map((x) => Math.round(x.r.width / 20) + "x" + Math.round(x.r.height / 20)));
  ok(sizes.size >= 4, `with varied sizes (${sizes.size} different)`);
  const inOrder = frames.every((x, k) => k === 0 || x.r.top > frames[k - 1].r.top + 5 || (Math.abs(x.r.top - frames[k - 1].r.top) < 5 && x.r.left > frames[k - 1].r.left));
  ok(inOrder, "and still read in order, left to right, tier by tier");
  const fitted = await L(() => {
    const el = document.querySelector('.cv-card[data-i="0"]');
    const cv = el.querySelector("canvas");
    const r = el.getBoundingClientRect();
    return Math.abs(cv.width / cv.height - r.width / r.height) < 0.15;
  });
  ok(fitted, "each picture is drawn to its frame's shape");
  await shot("comic-modern");
  await page.selectOption('[data-cmx="layout"]', "zine");
  await page.waitForTimeout(300);
  ok((await L(() => [...document.querySelectorAll(".cv-card")].filter((el) => /rotate/.test(el.style.transform)).length)) >= 6, "Zine turns the cut-outs a little");
  await shot("comic-zine");
  await page.selectOption('[data-cmx="layout"]', "simple");
  await page.waitForTimeout(300);
  ok((await L(() => document.querySelector(".cv-card canvas").width)) === 480, "Simple grid puts them back");
  await page.click('[data-act="comic"]');

  ok(errors.length === 0, "no page errors" + (errors.length ? ": " + errors.join(" | ") : ""));
  await browser.close();
  server.close();
  console.log(fails ? `${fails} failed` : "all passed");
  process.exit(fails ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
