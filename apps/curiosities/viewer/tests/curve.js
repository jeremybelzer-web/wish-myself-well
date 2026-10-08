/* The Curve window on Front and center's lanes: node apps/curiosities/viewer/tests/curve.js
   (needs Playwright and Chromium; set NODE_PATH to where Playwright is installed if it is not local).

   Jeremy's spec (2026-10-05, from his music app's Slide window): the curve function gives the preset values to two
   decimals and always runs from 0 to 1; points stay between their neighbours and inside 0.02 to 0.98, at most 16, never
   fewer than 1; a double-click on the curve adds exactly one point on the curve, a double-click on a point removes it,
   a single click adds nothing; each drag, add, remove and preset is one undo step and undo restores the points
   exactly; a preset goes on every selected line; a falling line draws its start at the top; the lane plays
   a + (b - a) * curve(u); the film saves and reloads the points unchanged. */
const http = require("http");
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

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
const SAMPLES = {
  Straight: [0, 0.2, 0.4, 0.6, 0.8, 1],
  "Ease in": [0, 0.08, 0.17, 0.37, 0.68, 1],
  "Ease out": [0, 0.32, 0.63, 0.83, 0.92, 1],
  "S curve": [0, 0.05, 0.32, 0.68, 0.95, 1],
  "Sharp in": [0, 0.03, 0.07, 0.14, 0.41, 1],
  "Sharp out": [0, 0.59, 0.86, 0.93, 0.97, 1],
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
    sessionStorage.setItem("curio-focus-tab-v1", "lanes");
  });
  await page.reload();
  await page.waitForFunction(() => window.CurioViewer && CurioViewer.isOpen() && document.querySelector(".cv-under .cf-ln-edit .cf-seg"), null, { timeout: 20000 });
  const L = (f, a) => page.evaluate(f, a);

  /* the maths */
  const got = await L((S) => Object.keys(S).map((name) => [name, CurioFocusLane.curve.PRESETS.find((p) => p.name === name).nodes]).map(([name, nodes]) => [name, [0, 0.2, 0.4, 0.6, 0.8, 1].map((u) => +CurioFocusLane.curve.eval(nodes, u).toFixed(2))]), SAMPLES);
  got.forEach(([name, vals]) => ok(JSON.stringify(vals) === JSON.stringify(SAMPLES[name]), `${name}: ${vals.join(", ")}`));
  ok(await L(() => {
    for (let k = 0; k < 200; k++) {
      const nodes = Array.from({ length: 1 + (k % 16) }, () => [0.02 + Math.random() * 0.96, Math.random()]);
      if (CurioFocusLane.curve.eval(nodes, 0) !== 0 || CurioFocusLane.curve.eval(nodes, 1) !== 1) return false;
    }
    return true;
  }), "any points: the curve starts at 0 and ends at 1");
  const lim = await L(() => {
    const C = CurioFocusLane.curve;
    const a = C.place([[0.3, 0.3], [0.6, 0.6]], 0, 0.9, 0.5)[0][0];
    const b = C.place([[0.5, 0.5]], 0, -1, 2)[0];
    const c = C.place([[0.5, 0.5]], 0, 2, -1)[0];
    const full = Array.from({ length: 16 }, (_, k) => [0.05 + k * 0.055, 0.5]);
    const one = [[0.5, 0.5]];
    return { a, b, c, add17: C.add(full, 0.99 - 0.001), len: full.length, rm: C.remove(one, 0), oneLen: one.length };
  });
  ok(lim.a <= 0.58 + 1e-9, "a point can't be dragged past its neighbour (" + lim.a + ")");
  ok(lim.b[0] === 0.02 && lim.c[0] === 0.98 && lim.b[1] === 1 && lim.c[1] === 0, "u stays in 0.02 to 0.98 and v in 0 to 1 (" + lim.b + " / " + lim.c + ")");
  ok(lim.add17 === -1 && lim.len === 16, "no 17th point");
  ok(lim.rm === false && lim.oneLen === 1, "the last point can't be removed");

  /* find a rising and a falling line on an editable lane */
  const segs = await L(() => {
    const f = CurioViewer.film();
    let at = 0;
    const mid = f.panels.map((p) => ((at += p.sec), at - p.sec / 2));
    const out = { up: null, down: null };
    document.querySelectorAll(".cv-under .cf-lanes .cf-ln-edit .cf-seg").forEach((el) => {
      const id = el.dataset.ln;
      const i = +el.dataset.seg;
      const j = +el.dataset.to;
      const a = CurioFocusLane.valueAt(id, mid[i]).y;
      const b = CurioFocusLane.valueAt(id, mid[j]).y;
      if (b > a && !out.up) out.up = { id, i, j, a, b, ti: mid[i], tj: mid[j] };
      if (b < a && !out.down) out.down = { id, i, j, a, b, ti: mid[i], tj: mid[j] };
    });
    return out;
  });
  ok(segs.up && segs.down, `found a rising line (${segs.up && segs.up.id}) and a falling one (${segs.down && segs.down.id})`);
  const segSel = (s) => `.cv-under .cf-lanes .cf-seg[data-ln="${s.id}"][data-seg="${s.i}"]`;
  async function openOn(s) {
    await page.locator(segSel(s)).first().scrollIntoViewIfNeeded();
    await L((q) => {
      const e = document.querySelector(q);
      const r = e.getBoundingClientRect();
      e.dispatchEvent(new MouseEvent("click", { bubbles: true, ctrlKey: true, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2 }));
    }, segSel(s));
    await page.waitForTimeout(150);
  }
  const nodes = (s) => L((s) => ((CurioViewer.film().panels[s.i].curves || {})[s.id] || {}).nodes || null, s);
  const hist = () => L(() => document.querySelector('[data-act="undo"]') && !document.querySelector('[data-act="undo"]').disabled);
  /* canvas point (u, v) on screen; rising: start at the bottom */
  async function pt(u, v, fall) {
    const b = await page.locator(".cf-cpop canvas").boundingBox();
    const X = 40 + u * 560;
    const ys = fall ? 46 : 396;
    const ye = fall ? 396 : 46;
    const Y = ys + (ye - ys) * v;
    return [b.x + (X / 640) * b.width, b.y + (Y / 420) * b.height];
  }

  await openOn(segs.up);
  ok(await page.isVisible(".cf-cpop"), "Ctrl+click on a line opens the Curve window");
  ok(/curve: 1 point/.test(await page.textContent(".cf-cpop .cf-cstatus")) && (await page.getAttribute('.cf-cpop [data-preset="0"]', "class")) === "on", "it starts straight, with one point in the middle");
  const v0 = await nodes(segs.up);
  let [x, y] = await pt(0.25, 0.25);
  await page.mouse.click(x, y);
  await page.waitForTimeout(400);
  ok(JSON.stringify(await nodes(segs.up)) === JSON.stringify(v0), "a single click on the curve adds nothing");
  await page.mouse.dblclick(x, y);
  await page.waitForTimeout(200);
  const n1 = await nodes(segs.up);
  ok(n1 && n1.length === 2 && Math.abs(n1[0][0] - 0.25) < 0.02 && Math.abs(n1[0][1] - n1[0][0]) < 0.02, "a double-click on the curve adds one point, on the curve: " + JSON.stringify(n1));
  await L(() => CurioViewer.undo());
  await page.waitForTimeout(200);
  ok(JSON.stringify(await nodes(segs.up)) === JSON.stringify(v0), "one undo takes the new point away exactly");
  await L(() => CurioViewer.redo && CurioViewer.redo());
  await page.waitForTimeout(200);
  if (!(await nodes(segs.up))) {
    await page.mouse.dblclick(x, y);
    await page.waitForTimeout(200);
  }
  [x, y] = await pt(0.25, n1[0][1]);
  await page.mouse.dblclick(x, y);
  await page.waitForTimeout(200);
  const n2 = await nodes(segs.up);
  ok(n2 && n2.length === 1 && n2[0][0] === 0.5, "a double-click on a point removes it: " + JSON.stringify(n2));
  [x, y] = await pt(0.5, 0.5);
  await page.mouse.dblclick(x, y);
  await page.waitForTimeout(200);
  ok((await nodes(segs.up)).length === 1, "the last point stays");

  /* drag: one undo step */
  const before = await nodes(segs.up);
  [x, y] = await pt(0.5, 0.5);
  await page.mouse.move(x, y);
  await page.mouse.down();
  const [x2, y2] = await pt(0.5, 0.85);
  await page.mouse.move(x2, y2, { steps: 6 });
  await page.mouse.up();
  await page.waitForTimeout(200);
  const dragged = await nodes(segs.up);
  ok(dragged && Math.abs(dragged[0][1] - 0.85) < 0.03 && /eases out/.test(await L((n) => CurioFocusLane.curve.describe(n), dragged)), "dragging the middle point up on a rising line: it gets there early (" + JSON.stringify(dragged) + ")");
  await L(() => CurioViewer.undo());
  await page.waitForTimeout(200);
  ok(JSON.stringify(await nodes(segs.up)) === JSON.stringify(before), "the whole drag is one undo step");

  /* the lane plays a + (b - a) * curve(u) */
  await page.click('.cf-cpop [data-preset="3"]');
  await page.waitForTimeout(200);
  ok(JSON.stringify(await nodes(segs.up)) === JSON.stringify([[0.25, 0.1], [0.75, 0.9]]) && (await page.getAttribute('.cf-cpop [data-preset="3"]', "class")) === "on", "S curve puts its points on and its button lights");
  const play = await L((s) => [0.1, 0.3, 0.5, 0.7, 0.9].map((u) => {
    const t = s.ti + (s.tj - s.ti) * u;
    const want = s.a + (s.b - s.a) * CurioFocusLane.curve.eval([[0.25, 0.1], [0.75, 0.9]], u);
    return Math.abs(CurioFocusLane.valueAt(s.id, t).y - want);
  }), segs.up);
  ok(play.every((d) => d < 1e-9), "the lane plays a + (b - a) * curve(u) at sampled times");
  await L(() => CurioViewer.undo());
  await page.waitForTimeout(200);
  ok(JSON.stringify(await nodes(segs.up)) === JSON.stringify(before), "a preset is one undo step");
  await page.keyboard.press("Escape");
  ok(!(await page.isVisible(".cf-cpop")), "Esc closes the window");

  /* a falling line: the start is drawn at the top, presets ease the same way in time */
  await openOn(segs.down);
  const px = await L(() => {
    const g = document.querySelector(".cf-cpop canvas").getContext("2d");
    const at = (x, y) => Array.from(g.getImageData(x, y, 1, 1).data).slice(0, 3).join(",");
    return { topStart: at(40, 46), botStart: at(40, 396), botEnd: at(600, 396) };
  });
  ok(px.topStart === "214,214,219" && px.botEnd === "214,214,219" && px.botStart !== "214,214,219", "a falling line draws its start at the top and its end at the bottom");
  await page.click('.cf-cpop [data-preset="1"]');
  await page.waitForTimeout(200);
  const fall = await L((s) => {
    const t = s.ti + (s.tj - s.ti) * 0.5;
    return (CurioFocusLane.valueAt(s.id, t).y - s.a) / (s.b - s.a);
  }, segs.down);
  ok(Math.abs(fall - 0.25) < 0.005, "Ease in on a falling line still starts slowly in time (" + fall.toFixed(3) + " of the way at the middle)");
  await page.keyboard.press("Escape");

  /* a preset on every selected line, one undo step */
  await L(() => CurioViewer.undo());
  await page.waitForTimeout(200);
  await page.locator(segSel(segs.up)).first().scrollIntoViewIfNeeded();
  await L(([a, b]) => {
    document.querySelector(a).dispatchEvent(new MouseEvent("click", { bubbles: true }));
    document.querySelector(b).dispatchEvent(new MouseEvent("click", { bubbles: true, shiftKey: true }));
  }, [segSel(segs.up), segSel(segs.down)]);
  const prior = JSON.stringify([await nodes(segs.up), await nodes(segs.down)]);
  ok((await page.locator(".cv-under .cf-lanes .cf-seg.on").count()) === 2, "click and Shift+click select two lines");
  await L((a) => document.querySelector(a).dispatchEvent(new MouseEvent("dblclick", { bubbles: true, clientX: 400, clientY: 400 })), segSel(segs.up));
  await page.waitForTimeout(150);
  await page.click('.cf-cpop [data-preset="4"]');
  await page.waitForTimeout(200);
  const both = [await nodes(segs.up), await nodes(segs.down)];
  ok(both.every((q) => JSON.stringify(q) === JSON.stringify([[0.5, 0.1], [0.75, 0.3]])), "a preset goes on every selected line (double-click opened the window)");
  await L(() => CurioViewer.undo());
  await page.waitForTimeout(200);
  const after = [await nodes(segs.up), await nodes(segs.down)];
  ok(JSON.stringify(after) === prior, "and one undo puts both back exactly " + JSON.stringify(after));
  await page.click('.cf-cpop [data-preset="4"]');
  await page.waitForTimeout(800);

  /* saved with the film */
  await page.reload();
  await page.waitForFunction(() => window.CurioViewer && CurioViewer.isOpen() && document.querySelector(".cv-under .cf-seg"), null, { timeout: 20000 });
  ok(JSON.stringify(await nodes(segs.up)) === JSON.stringify([[0.5, 0.1], [0.75, 0.3]]), "the film saves and reloads the points unchanged");

  ok(errors.length === 0, "no page errors" + (errors.length ? ": " + errors.join(" | ") : ""));
  await browser.close();
  server.close();
  console.log(fails ? `${fails} failed` : "all passed");
  process.exit(fails ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
