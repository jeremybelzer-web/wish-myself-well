/* Draw & build in a real browser, inside the real app: node apps/curiosities/viewer/tests/build.js [--shots dir]
   (needs Playwright and Chromium; set NODE_PATH to where Playwright is installed if it is not local).

   Works the Viewer's Draw & build tab the way a person would: the tab is there; the pencil draws a line in
   the picture that becomes a drawing; Puff it up, Push it out, Make it a tube and Spin it round turn that
   drawing 3D and Keep it a drawing turns it back; a shape from the shapes menu draws a star; Words put text in
   the picture and change font; a part (Block) lands in the middle; the Move tool's arrow slides it one way in
   steps; Scale stretches one side; Rotate turns it in steps; Duplicate and Delete; a thing dropped onto a
   table lands on top of it; a wall and a room are dragged out on the floor; the Search window's columns
   filter (City > Street > People finds the police officer) and its search box finds a dog from "puppy";
   clicking a result puts it in the picture; a ready-made set puts several things in; the work survives a
   reload; undo takes a drawing back. The page must report no errors. */
const http = require("http");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { chromium } = require("playwright");

const args = process.argv.slice(2);
const arg = (n, d) => (args.includes(n) ? args[args.indexOf(n) + 1] : d);
const SHOTS = arg("--shots", os.tmpdir());
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
    localStorage.removeItem("curiosities-build-v1");
  });
  await page.reload();
  await page.waitForFunction(() => window.CurioViewer && window.CurioViewer.isOpen() && window.CurioBuild, null, { timeout: 20000 });
  await page.waitForTimeout(300);
  const shot = (n) => page.screenshot({ path: path.join(SHOTS, "build-" + n + ".png") });
  const film = () => page.evaluate(() => CurioViewer.film());
  const sel = async () => {
    const f = await film();
    return f.objects.find((o) => o.id === f.sel);
  };
  const canvas = page.locator(".cv-win.is-mine canvas");
  const box = await canvas.boundingBox();
  const at = (fx, fy) => [box.x + box.width * fx, box.y + box.height * fy];

  ok(await page.isVisible('.cv-tabs [data-tab="build"]'), "the Details side has a Draw & build tab");
  ok(await page.isVisible('[data-bq="search"]'), "the In the scene list has Draw, Words, Parts and Search objects");

  /* the pencil */
  await page.click('[data-bq="draw"]');
  ok(await page.isVisible('[data-btool="draw"].on'), "Draw picks the pencil");
  const n0 = (await film()).objects.length;
  let [x, y] = at(0.35, 0.35);
  await page.mouse.move(x, y);
  await page.mouse.down();
  for (let i = 0; i <= 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    await page.mouse.move(box.x + box.width * (0.42 + 0.07 * Math.cos(a)), box.y + box.height * (0.42 + 0.12 * Math.sin(a)));
  }
  await page.mouse.up();
  let d = await sel();
  ok(d && d.make === "sketch" && d.strokes.length === 1 && d.strokes[0].p.length > 8, `drawing in the picture makes a drawing with one line (${d && d.strokes[0] && d.strokes[0].p.length} points)`);
  ok((await film()).objects.length === n0 + 1, "it is one new thing in the scene");
  await shot("1-pencil");
  for (const k of ["puff", "push", "tube", "spin", "flat"]) {
    await page.click(`[data-bsolid="${k}"]`);
    d = await sel();
    const faces = await page.evaluate(() => {
      const lv = CurioViewer.live();
      const o = lv.film.objects.find((x) => x.id === lv.film.sel);
      return CurioViewer.faces(o, lv.panel.place[o.id]).map((f) => (f.line ? "line" : "face"));
    });
    if (k === "flat") ok(d.solid === "flat" && faces.every((f) => f === "line"), "Keep it a drawing turns it back into pencil lines");
    else ok(d.solid === k && faces.filter((f) => f === "face").length > 20, `${k}: the drawing becomes a 3D shape (${faces.length} faces)`);
    if (k === "puff") await shot("2-puff");
    if (k === "spin") await shot("3-spin");
  }
  /* a star from the shapes menu joins the same drawing */
  await page.click('[data-bshape="star"]');
  [x, y] = at(0.55, 0.3);
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 60, y + 40, { steps: 4 });
  await page.mouse.move(x + 120, y + 100, { steps: 4 });
  await page.mouse.up();
  d = await sel();
  ok(d.make === "sketch" && d.strokes.length === 2 && d.strokes[1].p.length === 11, "a star from the shapes menu is drawn by dragging, into the same drawing");
  await page.click('[data-ba="undoline"]');
  ok((await sel()).strokes.length === 1, "Take away last line removes it");
  await page.keyboard.press("Control+z");
  ok((await sel()).strokes.length === 2, "undo brings the line back");

  /* words */
  await page.click('[data-btool="words"]');
  await page.fill('.cvb [data-bk="words.text"]', "WISH MYSELF WELL");
  await page.click('.cvb [data-bfont="poster"]');
  [x, y] = at(0.5, 0.75);
  await page.mouse.click(x, y);
  d = await sel();
  ok(d && d.make === "text" && d.text === "WISH MYSELF WELL" && d.font === "poster", "Words: clicking the picture puts the typed words there in the chosen font");
  await page.click('.cvb [data-bfont="hand"]');
  ok((await sel()).font === "hand", "the font can be changed afterwards");
  await page.fill('.cvb [data-bk="o.depth"]', "0.2");
  await page.dispatchEvent('.cvb [data-bk="o.depth"]', "change");
  ok((await sel()).depth > 0.1, "3D thickness makes solid letters");
  await shot("4-words");

  /* parts and the Roblox tools */
  await page.click('[data-btool="select"]');
  await page.click('details[data-sec="parts"] summary').catch(() => {});
  await page.click('[data-bpart="block"]');
  d = await sel();
  ok(d && d.make === "part" && d.shape === "block", "a Block part lands in the picture");
  const id = d.id;
  const pl = async () => (await film()).panels[0].place[id];
  await page.evaluate(() => CurioBuild.setTool("move"));
  await page.waitForTimeout(50);
  const p0 = await pl();
  /* drag the red (left-right) arrow */
  const tip = await page.evaluate((oid) => {
    const lv = CurioViewer.live();
    const p = lv.panel.place[oid];
    const a = CurioViewer.projectNow([p.x + 1.2, p.y + 0.5, p.z]);
    const c = CurioViewer.projectNow([p.x, p.y + 0.5, p.z]);
    const cv = lv.canvas;
    const r = cv.getBoundingClientRect();
    const k = r.width / cv.width;
    return { a: [r.left + a[0] * k, r.top + a[1] * k], c: [r.left + c[0] * k, r.top + c[1] * k] };
  }, id);
  const hx = await page.evaluate(() => {
    const h = document.querySelector(".cv-win.is-mine canvas");
    return !!h;
  });
  await page.mouse.move(tip.a[0], tip.a[1]);
  await page.mouse.down();
  await page.mouse.move(tip.a[0] + (tip.a[0] - tip.c[0]) * 1.5, tip.a[1] + (tip.a[1] - tip.c[1]) * 1.5, { steps: 6 });
  await page.mouse.up();
  const p1 = await pl();
  ok(hx && Math.abs(p1.x - p0.x) >= 0.24 && Math.abs(p1.z - p0.z) < 1e-6 && Math.abs(p1.y - p0.y) < 1e-6, `Move: the red arrow slides it left-right only (${p0.x} -> ${p1.x})`);
  ok(Math.abs(Math.round(p1.x / 0.25) * 0.25 - p1.x) < 1e-6, "it moves in 25 cm steps");
  await shot("5-move");
  /* scale and rotate through the handles' math, then keys */
  await page.evaluate(() => CurioBuild.setTool("scale"));
  await page.waitForTimeout(50);
  const sTip = await page.evaluate((oid) => {
    const lv = CurioViewer.live();
    const p = lv.panel.place[oid];
    const t = (p.turn * Math.PI) / 180;
    const ax = [Math.cos(t), 0, -Math.sin(t)];
    const w = (q) => {
      const s = CurioViewer.projectNow(q);
      const cv = lv.canvas;
      const r = cv.getBoundingClientRect();
      const k = r.width / cv.width;
      return [r.left + s[0] * k, r.top + s[1] * k];
    };
    return { tip: w([p.x + ax[0] * 0.58, p.y + 0.5, p.z + ax[2] * 0.58]), far: w([p.x + ax[0] * 1.6, p.y + 0.5, p.z + ax[2] * 1.6]) };
  }, id);
  await page.mouse.move(sTip.tip[0], sTip.tip[1]);
  await page.mouse.down();
  await page.mouse.move(sTip.far[0], sTip.far[1], { steps: 6 });
  await page.mouse.up();
  const p2 = await pl();
  ok((p2.sx || 1) > 1.4 && (p2.sy || 1) === 1, `Scale: dragging a side's dot stretches that way only (sx ${p2.sx})`);
  await shot("6-scale");
  await page.evaluate(() => CurioBuild.setTool("rotate"));
  await page.waitForTimeout(50);
  const t0 = (await pl()).turn;
  await page.keyboard.press("e");
  ok(((await pl()).turn - t0 + 360) % 360 === 15, "E turns it 15 degrees");
  await shot("7-rotate");
  await page.keyboard.press("Control+d");
  d = await sel();
  ok(d.id !== id && d.make === "part", "⌘D / Ctrl+D duplicates it");
  await page.keyboard.press("Delete");
  ok(!(await film()).objects.some((o) => o.id === d.id), "Delete takes the copy out");

  /* things land on surfaces */
  const landed = await page.evaluate(() => {
    const lv = CurioViewer.live();
    const table = CurioBuild.addPart("block");
    const tp = CurioViewer.live().panel.place[table.id];
    tp.sy = 0.8;
    tp.sx = 2;
    tp.sz = 2;
    Object.assign(tp, { x: 3, y: 0, z: 2.5, turn: 0 });
    const ball = CurioBuild.addPart("ball");
    Object.assign(CurioViewer.live().panel.place[ball.id], { x: -2, y: 0, z: 2.5 });
    CurioViewer.changed(true);
    return { t: [tp.x, tp.z], ball: ball.id };
  });
  /* drag the ball onto the table with the Select tool */
  await page.evaluate(() => CurioBuild.setTool("select"));
  const drop = await page.evaluate(({ t, ball }) => {
    const lv = CurioViewer.live();
    const p = lv.panel.place[ball];
    const w = (q) => {
      const s = CurioViewer.projectNow(q);
      const cv = lv.canvas;
      const r = cv.getBoundingClientRect();
      const k = r.width / cv.width;
      return [r.left + s[0] * k, r.top + s[1] * k];
    };
    return { from: w([p.x, 0.5, p.z]), to: w([t[0], 0.5, t[1]]), y0: p.y };
  }, landed);
  await page.mouse.move(drop.from[0], drop.from[1]);
  await page.mouse.down();
  await page.mouse.move(drop.to[0], drop.to[1], { steps: 8 });
  await page.mouse.up();
  const ballY = (await film()).panels[0].place[landed.ball].y;
  ok(Math.abs(ballY - 0.8) < 0.06, `a ball dragged onto a table lands on top of it (y ${ballY})`);
  await shot("8-land");

  /* walls and a room */
  await page.keyboard.press("w");
  [x, y] = at(0.2, 0.8);
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 200, y, { steps: 5 });
  await page.mouse.up();
  d = await sel();
  ok(d && d.make === "walls" && d.segs.length === 1 && Math.hypot(d.segs[0][2], d.segs[0][3]) > 0.4, "Wall: dragging on the floor builds a wall");
  await page.keyboard.press("r");
  [x, y] = at(0.6, 0.78);
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 160, y + 60, { steps: 5 });
  await page.mouse.up();
  d = await sel();
  ok(d && d.make === "walls" && d.segs.length === 4 && d.floor, "Room: dragging a rectangle builds four walls and a floor");
  await page.keyboard.press("Escape");
  await shot("9-walls");

  /* the search window */
  const hasLib = await page.evaluate(() => !!window.CurioObjects);
  ok(hasLib, "the object library is loaded");
  if (hasLib) {
    await page.click('[data-bq="search"]');
    ok(await page.isVisible(".cvb-search"), "Search objects opens the search window");
    await page.click('.cvb-col[data-col="world"] [data-v="City"]');
    await page.click('.cvb-col[data-col="place"] [data-v="Street"]');
    await page.click('.cvb-col[data-col="type"] [data-v="People"]');
    const names = await page.$$eval(".cvb-card span", (els) => els.map((e) => e.textContent));
    ok(names.some((n) => /police/i.test(n)) && !names.some((n) => /dog|car$/i.test(n)), `City > Street > People shows the police officer and no dogs or cars (${names.length})`);
    await page.waitForTimeout(400);
    await shot("10-search-columns");
    await page.click('.cvb-col[data-col="world"] [data-v=""]');
    await page.click('.cvb-col[data-col="place"] [data-v=""]');
    await page.click('.cvb-col[data-col="type"] [data-v=""]');
    await page.fill(".cvb-q", "puppy");
    const pn = await page.$$eval(".cvb-card", (els) => els.map((e) => e.dataset.item));
    ok(pn.some((n) => /dog/.test(n)), `typing "puppy" finds a dog (${pn.join(", ")})`);
    const before = (await film()).objects.length;
    await page.click(".cvb-card >> nth=0");
    ok((await film()).objects.length === before + 1, "clicking a result puts it in the picture");
    await page.keyboard.press("Escape");
    ok(!(await page.isVisible(".cvb-search")), "Escape closes the search window");
    const b2 = (await film()).objects.length;
    await page.evaluate(() => CurioBuild.addPrefab("kitchen"));
    ok((await film()).objects.length >= b2 + 5, "a ready-made set (Kitchen corner) puts several things in at once");
    await shot("11-kitchen");
  }

  /* survives a reload */
  const count = (await film()).objects.length;
  await page.waitForTimeout(700);
  await page.reload();
  await page.waitForFunction(() => window.CurioViewer && window.CurioViewer.isOpen(), null, { timeout: 20000 });
  const after = await film();
  ok(after.objects.length === count && after.objects.some((o) => o.make === "sketch") && after.objects.some((o) => o.make === "text"), "drawings, words, parts and objects survive a reload");
  await page.waitForTimeout(300);
  await shot("12-reloaded");
  ok(errors.length === 0, "no page errors" + (errors.length ? ": " + errors.slice(0, 3).join(" | ") : ""));
  await browser.close();
  server.close();
  console.log(fails ? `${fails} failed` : "all passed");
  process.exit(fails ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
