/* The Viewer's drone-style flight path in a real browser: node apps/curiosities/viewer/tests/flight.js [--shots dir]
   (Jeremy's notes, 2026-10-04 20:16Z). The Flight path tab records the camera while you drag and fly with
   W/A/S/D/R/F and Q/E; playing the panel flies the camera along it; the 3D graph draws the path and turns when
   dragged; a waypoint can be added, dragged on the graph and taken out; "look at" a point of interest aims the
   camera at that thing; spin turns the lens as it flies; Esc throws a take away; undo brings it back; the color
   filter and background blur change the picture; no errors. */
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
  const pix = () =>
    L(() => {
      const cv = CurioViewer.live().canvas;
      const d = cv.getContext("2d").getImageData(0, 0, cv.width, cv.height).data;
      let sat = 0, n = 0, edge = 0;
      for (let i = 0; i < d.length; i += 4 * 37) {
        const mx = Math.max(d[i], d[i + 1], d[i + 2]);
        const mn = Math.min(d[i], d[i + 1], d[i + 2]);
        sat += mx - mn;
        n++;
      }
      /* sharpness: sum of differences between neighbours along the middle row */
      const W = cv.width, y = Math.floor(cv.height * 0.4);
      for (let x = 1; x < W; x++) {
        const a = (y * W + x) * 4, b = a - 4;
        edge += Math.abs(d[a] - d[b]) + Math.abs(d[a + 1] - d[b + 1]);
      }
      return { sat: sat / n, edge };
    });
  const shot = (name) => SHOTS && page.screenshot({ path: path.join(SHOTS, name + ".png") });

  ok((await page.locator('.cv-tabs [data-tab="flight"]').count()) === 1, "there is a Flight path tab");
  await page.click('.cv-tabs [data-tab="flight"]');
  await page.waitForTimeout(100);
  ok((await page.locator('[data-fl="rec"]').count()) === 1, "with a Record button");

  /* record: drag to swing round, then fly forward with W */
  await page.click('[data-fl="rec"]');
  ok(await L(() => CurioFlight.recording()), "Record starts recording");
  const box = await L(() => {
    const r = CurioViewer.live().canvas.getBoundingClientRect();
    return { x: r.left, y: r.top, w: r.width, h: r.height };
  });
  const sec = await L(() => CurioViewer.live().panel.sec);
  await page.mouse.move(box.x + box.w * 0.6, box.y + box.h * 0.5);
  await page.mouse.down();
  await page.mouse.move(box.x + box.w * 0.3, box.y + box.h * 0.45, { steps: 12 });
  await page.mouse.up();
  await page.keyboard.down("w");
  await page.keyboard.down("e");
  await page.waitForTimeout(600);
  await page.keyboard.up("w");
  await page.keyboard.up("e");
  await page.waitForFunction(() => !CurioFlight.recording(), null, { timeout: (sec + 4) * 1000 });
  const f = await L(() => CurioViewer.live().panel.flight);
  ok(f && f.on && f.pts.length >= 3, `the take is kept as a flight path (${f ? f.pts.length : 0} points over ${sec}s)`);
  const spread = f ? Math.hypot(f.pts[0].p[0] - f.pts[f.pts.length - 1].p[0], f.pts[0].p[2] - f.pts[f.pts.length - 1].p[2]) : 0;
  ok(spread > 0.5, `the camera moved during the take (${spread.toFixed(2)} m)`);
  ok(f && f.pts[f.pts.length - 1].roll !== f.pts[0].roll, `Q/E turned the lens while flying (${f && f.pts[0].roll}° → ${f && f.pts[f.pts.length - 1].roll}°)`);
  ok((await page.locator(".cvf-wp").count()) === (f ? f.pts.length : -1), "each point is listed as a waypoint");

  /* playing flies the camera along it */
  const follows = await L(() => {
    const V = CurioViewer;
    const i = V.panel();
    const s = V.starts()[i];
    const p = V.live().panel;
    const out = [];
    for (const u of [0.1, 0.5, 0.9]) {
      V.time(s + u * p.sec);
      const want = CurioFlight.poseAt(p.flight, u, p.place);
      const got = V.live().C.pos;
      out.push(Math.hypot(want.pos[0] - got[0], want.pos[1] - got[1], want.pos[2] - got[2]));
    }
    return out;
  });
  ok(follows.every((d) => d < 0.05), `playing the panel flies the camera along the path (off by ${follows.map((d) => d.toFixed(3)).join(", ")} m)`);
  await shot("flight-recorded");

  /* the 3D graph draws and turns */
  const g = page.locator(".cvf-graph");
  const gsum = () =>
    page.$eval(".cvf-graph", (cv) => {
      const d = cv.getContext("2d").getImageData(0, 0, cv.width, cv.height).data;
      let s = 0, cyan = 0;
      for (let i = 0; i < d.length; i += 4) {
        s = (s * 31 + d[i] + d[i + 1] * 3 + d[i + 2] * 7) % 1000000007;
        if (d[i] < 90 && d[i + 1] > 170 && d[i + 2] > 190) cyan++;
      }
      return { s, cyan };
    });
  await g.scrollIntoViewIfNeeded();
  const g0 = await gsum();
  ok(g0.cyan > 200, `the 3D graph draws the path in cyan (${g0.cyan} px)`);
  const gb = await g.boundingBox();
  await page.mouse.move(gb.x + 30, gb.y + 30);
  await page.mouse.down();
  await page.mouse.move(gb.x + 160, gb.y + 70, { steps: 6 });
  await page.mouse.up();
  const g1 = await gsum();
  ok(g1.s !== g0.s, "dragging the graph turns it");

  /* drag a waypoint on the graph; Shift-drag lifts it */
  const k = Math.floor(f.pts.length / 2);
  const before = await L((k) => CurioViewer.live().panel.flight.pts[k].p.slice(), k);
  await g.scrollIntoViewIfNeeded();
  let at = await L((k) => CurioFlight.graphPoint(k), k);
  ok(at && at[0] > gb.x && at[0] < gb.x + gb.width, "the waypoint is on the graph");
  await page.mouse.move(at[0], at[1]);
  await page.mouse.down();
  await page.mouse.move(at[0] + 50, at[1] + 10, { steps: 5 });
  await page.mouse.up();
  const mid = await L((k) => CurioViewer.live().panel.flight.pts[k].p.slice(), k);
  ok(Math.hypot(mid[0] - before[0], mid[2] - before[2]) > 0.2 && Math.abs(mid[1] - before[1]) < 1e-6, `dragging waypoint ${k + 1} moves it across the floor, not up or down`);
  at = await L((k) => CurioFlight.graphPoint(k), k);
  await page.keyboard.down("Shift");
  await page.mouse.move(at[0], at[1]);
  await page.mouse.down();
  await page.mouse.move(at[0], at[1] - 40, { steps: 5 });
  await page.mouse.up();
  await page.keyboard.up("Shift");
  const hi = await L((k) => CurioViewer.live().panel.flight.pts[k].p.slice(), k);
  ok(hi[1] > mid[1] + 0.2, `Shift-dragging it raises it (${mid[1]} → ${hi[1]} m)`);

  /* add and take out waypoints */
  const n0 = await page.locator(".cvf-wp").count();
  await L(() => CurioViewer.time(CurioViewer.starts()[CurioViewer.panel()] + CurioViewer.live().panel.sec * 0.37));
  await page.click('[data-fl="addwp"]');
  await shot("flight-addwp");
  ok((await page.locator(".cvf-wp").count()) === n0 + 1, "+ Waypoint here adds one");
  await page.click('[data-wpdel="0"]');
  ok((await page.locator(".cvf-wp").count()) === n0, "✕ takes one out");

  /* look at a point of interest */
  await page.selectOption('[data-flk="look"]', "poi");
  await page.waitForTimeout(50);
  const poi = await page.$eval('[data-flk="poi"]', (s) => s.value);
  const aim = await L((poi) => {
    const V = CurioViewer;
    const p = V.live().panel;
    V.time(V.starts()[V.panel()] + p.sec * 0.5);
    const a = V.aimPoint(poi, p.place);
    const t = V.live().C.target;
    return Math.hypot(a[0] - t[0], a[1] - t[1], a[2] - t[2]);
  }, poi);
  ok(aim < 0.05, `"Look at a point of interest" keeps the camera on ${poi} (off by ${aim.toFixed(3)} m)`);

  /* spin the lens */
  await page.$eval('[data-flk="spin"]', (el) => {
    el.value = "360";
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  });
  const spin = await L(() => {
    const p = CurioViewer.live().panel;
    return CurioFlight.poseAt(p.flight, 1, p.place).roll - CurioFlight.poseAt(p.flight, 0, p.place).roll;
  });
  const rolls = f.pts[f.pts.length - 1].roll - f.pts[0].roll;
  ok(Math.abs(spin - rolls - 360) < 1, `Spin the lens 360° adds a full turn over the panel (${Math.round(spin)}°)`);
  await shot("flight-poi-spin");

  /* Esc throws a take away; undo brings a cleared path back */
  const keep = await L(() => JSON.stringify(CurioViewer.live().panel.flight.pts));
  await page.click('[data-fl="rec"]');
  await page.waitForTimeout(200);
  await page.keyboard.press("Escape");
  ok(!(await L(() => CurioFlight.recording())) && (await L(() => JSON.stringify(CurioViewer.live().panel.flight.pts))) === keep, "Esc stops a take and keeps the old path");
  await page.click('[data-fl="clear"]');
  ok(!(await L(() => CurioViewer.live().panel.flight)), "Clear takes the path out");
  await L(() => CurioViewer.undo());
  await page.waitForTimeout(50);
  ok(!!(await L(() => CurioViewer.live().panel.flight)), "and undo brings it back");

  /* color filter and background blur */
  await L(() => CurioViewer.time(CurioViewer.starts()[CurioViewer.panel()] + 0.2));
  await page.click('.cv-tabs [data-tab="camera"]');
  await page.waitForTimeout(80);
  const p0 = await pix();
  await page.selectOption('[data-k="filter"]', "noir");
  await page.waitForTimeout(80);
  const p1 = await pix();
  ok(p1.sat < p0.sat * 0.25, `the Noir filter drains the color (${p0.sat.toFixed(1)} → ${p1.sat.toFixed(1)})`);
  await page.selectOption('[data-k="filter"]', "none");
  await page.$eval('[data-k="blur"]', (el) => {
    el.value = "100";
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.waitForTimeout(80);
  const p2 = await pix();
  ok(p2.edge < p0.edge * 0.9, `background blur softens the picture (${p0.edge} → ${p2.edge})`);
  await shot("flight-blur");

  ok(errors.length === 0, "no page errors" + (errors.length ? ": " + errors.join(" | ") : ""));
  await browser.close();
  server.close();
  console.log(fails ? `${fails} failed` : "all passed");
  process.exit(fails ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
