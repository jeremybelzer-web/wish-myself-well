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
  ok(await page.isVisible('[data-find="objects"]') && await page.isVisible('[data-find="settings"]') && await page.isVisible('[data-find="characters"]'), "Object, Setting and Character search sit at the top of the In the scene list");
  ok(await page.$$eval(".cvb-scene .cvb-trow", (r) => r.length > 3 && r.every((x) => x.querySelector("[data-bplus]"))) && await page.$$eval(".cvb-addlist .cvb-addit", (r) => r.length > 15), "the scene list scrolls, with a + on every row, and so does Add a shape");

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

  /* picking several, groups, lock and eye (Roblox's selection, UEFN's outliner) */
  await page.evaluate(() => CurioBuild.setTool("select"));
  const two = await page.evaluate(() => {
    const a = CurioBuild.addPart("block");
    Object.assign(CurioViewer.live().panel.place[a.id], { x: -3, y: 0, z: 4 });
    const b = CurioBuild.addPart("cylinder");
    Object.assign(CurioViewer.live().panel.place[b.id], { x: -1.5, y: 0, z: 4 });
    CurioViewer.changed(true);
    return [a.id, b.id];
  });
  const scr = (oid) =>
    page.evaluate((oid) => {
      const lv = CurioViewer.live();
      const p = lv.panel.place[oid];
      const s = CurioViewer.projectNow([p.x, p.y + 0.5, p.z]);
      const r = lv.canvas.getBoundingClientRect();
      const k = r.width / lv.canvas.width;
      return [r.left + s[0] * k, r.top + s[1] * k];
    }, oid);
  let q = await scr(two[0]);
  await page.mouse.click(q[0], q[1]);
  q = await scr(two[1]);
  await page.keyboard.down("Shift");
  await page.mouse.click(q[0], q[1]);
  await page.keyboard.up("Shift");
  let picked = await page.evaluate(() => CurioBuild.selection());
  ok(picked.length === 2 && picked.includes(two[0]) && picked.includes(two[1]), "Shift-click picks a second thing");
  await page.keyboard.press("Control+g");
  let f2 = await film();
  const g = f2.objects.find((o) => o.id === two[0]).group;
  ok(g && f2.objects.find((o) => o.id === two[1]).group === g, "⌘G / Ctrl+G groups them");
  await page.mouse.click(box.x + 5, box.y + box.height - 5);
  q = await scr(two[0]);
  await page.mouse.click(q[0], q[1]);
  picked = await page.evaluate(() => CurioBuild.selection());
  ok(picked.length === 2, "clicking one member of a group picks the whole group");
  const b0 = await page.evaluate((ids) => ids.map((id) => CurioViewer.live().panel.place[id].x), two);
  q = await scr(two[0]);
  await page.mouse.move(q[0], q[1]);
  await page.mouse.down();
  await page.mouse.move(q[0] + 120, q[1], { steps: 6 });
  await page.mouse.up();
  const b1 = await page.evaluate((ids) => ids.map((id) => CurioViewer.live().panel.place[id].x), two);
  ok(Math.abs(b1[0] - b0[0] - (b1[1] - b0[1])) < 1e-6 && Math.abs(b1[0] - b0[0]) > 0.2, "dragging one moves the whole group the same way");
  q = await scr(two[1]);
  await page.keyboard.down("Alt");
  await page.mouse.click(q[0], q[1]);
  await page.keyboard.up("Alt");
  picked = await page.evaluate(() => CurioBuild.selection());
  ok(picked.length === 1 && picked[0] === two[1], "Alt-click picks just one thing inside the group");
  await page.keyboard.press("Control+u");
  ok(!(await film()).objects.find((o) => o.id === two[0]).group, "⌘U / Ctrl+U ungroups");
  await page.click(`[data-block="${two[0]}"]`);
  ok((await film()).objects.find((o) => o.id === two[0]).locked, "the lock in the list locks it");
  const lx = (await film()).panels[0].place[two[0]].x;
  q = await scr(two[0]);
  await page.mouse.move(q[0], q[1]);
  await page.mouse.down();
  await page.mouse.move(q[0] + 100, q[1], { steps: 5 });
  await page.mouse.up();
  ok((await film()).panels[0].place[two[0]].x === lx, "a locked thing can't be dragged");
  await page.click(`[data-beye="${two[1]}"]`);
  ok((await film()).panels[0].place[two[1]].show === false, "the eye hides it in this panel");
  await page.click(`[data-beye="${two[1]}"]`);
  /* Shift-drag a box around both */
  await page.click(`[data-block="${two[0]}"]`);
  const qa = await scr(two[0]);
  const qb = await scr(two[1]);
  await page.mouse.click(box.x + 5, box.y + box.height - 5);
  /* start the box on a corner with nothing under it */
  const xs = [Math.min(qa[0], qb[0]) - 50, Math.max(qa[0], qb[0]) + 50];
  const ys = [Math.min(qa[1], qb[1]) - 50, Math.max(qa[1], qb[1]) + 50];
  let corner = null;
  for (const [i, j] of [[0, 0], [1, 1], [0, 1], [1, 0]]) {
    const free = await page.evaluate(([x, y]) => !CurioViewer.pickAt({ clientX: x, clientY: y }), [xs[i], ys[j]]);
    if (free) {
      corner = [i, j];
      break;
    }
  }
  corner = corner || [1, 1];
  await page.keyboard.down("Shift");
  await page.mouse.move(xs[corner[0]], ys[corner[1]]);
  await page.mouse.down();
  await page.mouse.move(xs[1 - corner[0]], ys[1 - corner[1]], { steps: 5 });
  await page.mouse.up();
  await page.keyboard.up("Shift");
  picked = await page.evaluate(() => CurioBuild.selection());
  ok(two.every((id) => picked.includes(id)), `Shift-dragging a box on empty space picks what is inside (${picked.length})`);
  await page.click('[data-ba="snapm"]');
  ok((await page.evaluate(() => CurioBuild.settings().snap)) === 0.5, "the move steps button on the toolbar changes the step (25 cm to half a metre)");
  await page.click('[data-btool="move"]');
  await shot("8b-picked");
  await page.evaluate(() => CurioBuild.set({ snap: 0.25 }));
  await page.click('[data-btool="select"]');

  /* walls and a room */
  await page.keyboard.press("w");
  [x, y] = at(0.2, 0.8);
  /* when this fails, the message says which tool was on and what was under the pointer */
  const wallWhy = await page.evaluate(([x, y]) => {
    const el = document.elementFromPoint(x, y);
    return "tool " + CurioBuild.tool() + ", focus " + (document.activeElement ? document.activeElement.tagName.toLowerCase() + "." + String(document.activeElement.className || "").replace(/\s+/g, ".") : "none") + ", under " + (el ? el.tagName.toLowerCase() + "." + String(el.className || "").replace(/\s+/g, ".") : "nothing");
  }, [x, y]);
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 200, y, { steps: 5 });
  await page.mouse.up();
  d = await sel();
  ok(d && d.make === "walls" && d.segs.length === 1 && Math.hypot(d.segs[0][2], d.segs[0][3]) > 0.4, "Wall: dragging on the floor builds a wall" + (d && d.make === "walls" ? "" : ` (${wallWhy}; picked ${d ? d.make || d.kind : "nothing"})`));
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
    await page.click('[data-find="objects"]');
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

    /* Setting search: a place becomes the scene's setting, and a new one replaces it */
    await page.click('[data-find="settings"]');
    ok(await page.isVisible(".cvb-search.cvb-m-settings") && !(await page.isVisible('.cvb-col[data-col="type"]')), "Setting search opens with World and Place columns");
    await page.fill(".cvb-q", "kitchen");
    await page.click('.cvb-setcard[data-setting="Kitchen"]');
    let fk = await film();
    const kit = fk.objects.filter((o) => o.setting === "Kitchen");
    ok(kit.length >= 4 && kit.some((o) => o.make === "walls" && o.floor), `the Kitchen setting puts in walls, a floor and kitchen things (${kit.length})`);
    await page.fill(".cvb-q", "");
    await page.click('.cvb-col[data-col="world"] [data-v="Country"]');
    await page.click('.cvb-setcard[data-setting="Forest"]');
    fk = await film();
    ok(!fk.objects.some((o) => o.setting === "Kitchen") && fk.objects.some((o) => o.setting === "Forest"), "a new setting replaces the old one");
    await shot("11b-forest");
    /* Character search: people and animals only, the ones in the scene on top */
    await page.click('.cvb-modes [data-smode="characters"]');
    const types = await page.$$eval('.cvb-col[data-col="type"] [data-v]', (els) => els.map((e) => e.dataset.v).filter(Boolean));
    ok(types.join(",") === "People,Animals" && (await page.isVisible(".cvb-inscene [data-cpick]")), "Character search shows people and animals, with who is in the scene");
    const nC = (await film()).objects.length;
    await page.fill(".cvb-q", "chef");
    await page.click(".cvb-card >> nth=0");
    const chef = (await film()).objects.find((o) => /chef/i.test(o.name));
    ok(chef && chef.kind === "person" && (await film()).objects.length === nC + 1, "picking the chef brings a person in");
    await page.click(`.cvb-inscene [data-cout="${chef.id}"]`);
    ok(!(await film()).objects.some((o) => o.id === chef.id), "✕ takes a character out");
    await page.keyboard.press("Escape");

    /* Control+drag spins a thing; Control+click opens what it can do */
    await page.evaluate(() => CurioBuild.setTool("select"));
    /* a person you can see (not one sitting inside the tuk-tuk) */
    const [pid, spot] = await page.evaluate(() => {
      const lv = CurioViewer.live();
      const r = lv.canvas.getBoundingClientRect();
      for (const o of lv.film.objects.filter((x) => x.kind === "person")) {
        const pl = lv.panel.place[o.id];
        for (const h of [1.1, 0.8, 1.4, 0.5]) {
          const p = CurioViewer.projectNow([pl.x, pl.y + h, pl.z]);
          if (!p) continue;
          const xy = [r.left + (p[0] * r.width) / lv.canvas.width, r.top + (p[1] * r.height) / lv.canvas.height];
          const k = CurioViewer.pickAt({ clientX: xy[0], clientY: xy[1] });
          if (k && k.obj === o.id) return [o.id, xy];
        }
      }
      return [null, null];
    });
    if (spot) {
      const turn0 = (await film()).panels[0].place[pid].turn || 0;
      await page.keyboard.down("Control");
      await page.mouse.move(spot[0], spot[1]);
      await page.mouse.down();
      await page.mouse.move(spot[0] + 80, spot[1], { steps: 6 });
      await page.mouse.up();
      await page.keyboard.up("Control");
      const turn1 = (await film()).panels[0].place[pid].turn || 0;
      ok(Math.abs(turn1 - turn0) > 20, `Control+drag on a person spins them (${turn0} → ${turn1})`);
      const spot2 = await page.evaluate((id) => {
        const lv = CurioViewer.live();
        const r = lv.canvas.getBoundingClientRect();
        const pl = lv.panel.place[id];
        for (const h of [1.1, 0.8, 1.4, 0.5, 0.3, 1.6]) {
          const p = CurioViewer.projectNow([pl.x, pl.y + h, pl.z]);
          if (!p) continue;
          const xy = [r.left + (p[0] * r.width) / lv.canvas.width, r.top + (p[1] * r.height) / lv.canvas.height];
          const k = CurioViewer.pickAt({ clientX: xy[0], clientY: xy[1] });
          if (k && k.obj === id) return xy;
        }
        return [0, 0];
      }, pid);
      await page.keyboard.down("Control");
      await page.mouse.click(spot2[0], spot2[1]);
      await page.keyboard.up("Control");
      ok(await page.isVisible(".cva-menu"), "Control+click on a person opens what they can do");
      const labels = await page.$$eval(".cva-list button", (els) => els.map((e) => e.firstChild.textContent));
      ok(["Lie down", "Get up", "Run", "Climb", "Swim", "Jumping jacks", "Push-ups", "Eat"].every((l) => labels.includes(l)), "people can lie down, get up, run, climb, swim, do jumping jacks and push-ups, and eat");
      await page.click('.cva-list [data-act="lie"]');
      let pf = await film();
      ok(pf.panels[0].place[pid].tilt === -90 && pf.panels[0].place[pid].pose === "lie" && pf.panels[pf.panels.length - 1].place[pid].pose === "lie", "Lie down lays them on their back from this panel on");
      await shot("11c-lie-down");
      await page.evaluate((id) => CurioActions.apply(id, "getup"), pid);
      pf = await film();
      ok(!pf.panels[0].place[pid].tilt && pf.panels[0].place[pid].pose === "stand", "Get up stands them back up");
    } else ok(false, "found a person to spin");
    const things = await page.evaluate(() => {
      const f = CurioViewer.live().film;
      const t = f.objects.find((o) => o.make === "catalog" && !/dog|cat|bird|squirrel|deer|fox|owl|rabbit|bear/i.test(o.item || ""));
      const a = f.objects.find((o) => /squirrel|deer|fox|owl|rabbit|bear|dog/.test(o.item || ""));
      return { t: t && t.id, a: a && a.id, tm: t && CurioActions.menuFor(t.id), am: a && CurioActions.menuFor(a.id) };
    });
    ok(things.tm && things.tm.kind === "thing" && ["Crumble to the ground", "Catch fire", "Get trampled", "Break apart"].every((l) => things.tm.actions.some((x) => x.label === l)), "things can crumble, catch fire, get trampled and break apart");
    ok(things.am && things.am.kind === "animal" && things.am.actions.some((x) => x.label === "Sleep"), "animals have their own list");
    const faces0 = await page.evaluate((id) => CurioViewer.faces(CurioViewer.live().film.objects.find((o) => o.id === id), CurioViewer.live().panel.place[id]).length, things.t);
    await page.evaluate((id) => CurioActions.apply(id, "fire"), things.t);
    const faces1 = await page.evaluate((id) => CurioViewer.faces(CurioViewer.live().film.objects.find((o) => o.id === id), CurioViewer.live().panel.place[id]).length, things.t);
    ok(faces1 > faces0, `Catch fire adds flames (${faces0} → ${faces1} faces)`);
    await shot("11d-fire");
    await page.evaluate((id) => CurioActions.apply(id, "normal"), things.t);
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
