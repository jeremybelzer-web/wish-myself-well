/* 3D characters in the Viewer, in a real browser: node apps/curiosities/viewer/tests/rig-actors.js [--three three.min.js]
   (Jeremy, 2026-10-04 22:06Z: "we want 3D characters both selectable and draw-able and tweak-able modifiable").
   The 3D button in In the scene turns a person into a 3D character drawn by the Viewer itself; it is posed like
   the block figure (standing, walking, sitting, waving), dressed from words (place.look, lookParts), picked by
   clicking it, its mouth follows the People tab, Undo turns it back, and nothing errors. */
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
const THREE_FILE = arg("--three", "");
(async () => {
  const server = await serve();
  const base = `http://127.0.0.1:${server.address().port}/index.html`;
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  if (THREE_FILE) await page.route("**/cdnjs.cloudflare.com/**", (r) => r.fulfill({ path: THREE_FILE, contentType: "text/javascript" }));
  await page.route("**/fonts.g*/**", (r) => r.abort());
  await page.goto(base + "?viewer=1");
  await page.evaluate(() => {
    localStorage.removeItem("curiosities-viewer-v1");
    localStorage.removeItem("curiosities-viewer-windows-v1");
  });
  await page.reload();
  await page.waitForFunction(() => window.CurioViewer && CurioViewer.isOpen() && window.CurioRigActors, null, { timeout: 20000 });
  await page.waitForTimeout(300);
  const L = (f, a) => page.evaluate(f, a);
  const shot = async (n) => SHOTS && (await page.screenshot({ path: path.join(SHOTS, n) }));

  ok((await page.locator('[data-cvr3d="biju"]').count()) === 1 && (await page.locator('[data-cvr3d="tuktuk"]').count()) === 0, "people have a 3D button in In the scene; other things don't");
  await L(() => CurioViewer.select(2));
  await page.click('[data-cvr3d="biju"]');
  ok(await L(() => CurioRigActors.on("biju", 2)), "clicking it makes Biju a 3D character");
  await page.waitForFunction(() => CurioRigActors.faces("biju") > 50, null, { timeout: 30000 });
  const n = await L(() => CurioRigActors.faces("biju"));
  ok(n > 200 && n < 6000, "the 3D character is drawn face by face in the picture: " + n + " faces");
  await page.waitForTimeout(300);
  await shot("rig-1.png");

  /* every face of Biju in the picture is Biju's, so clicking picks Biju */
  const spot = await L(() => {
    const L0 = CurioViewer.live();
    const r = L0.canvas.getBoundingClientRect();
    const ps = L0.picks.filter((q) => q.obj === "biju" && q.s && q.s.length >= 3);
    if (!ps.length) return null;
    /* a spot where Biju is the top thing */
    for (let k = ps.length - 1; k >= 0; k--) {
      const p = ps[k];
      const cx = p.s.reduce((a, q) => a + q[0], 0) / p.s.length;
      const cy = p.s.reduce((a, q) => a + q[1], 0) / p.s.length;
      const x = r.left + (cx * r.width) / L0.canvas.width;
      const y = r.top + (cy * r.height) / L0.canvas.height;
      const hit = CurioViewer.pickAt({ clientX: x, clientY: y });
      if (hit && hit.obj === "biju") return [x, y, ps.length];
    }
    return [0, 0, ps.length];
  });
  ok(spot && spot[2] > 50, "Biju's 3D faces are in the picture's pick list: " + (spot && spot[2]));
  if (spot) {
    await L(() => CurioViewer.select && CurioViewer.live().film && (CurioViewer.live().film.sel = null));
    await page.mouse.click(spot[0], spot[1]);
    await page.waitForTimeout(150);
    ok((await L(() => CurioViewer.live().film.sel)) === "biju", "clicking the 3D character picks it");
  }

  /* posed like the block figure */
  const reach = await L(() => {
    const f = CurioViewer.live().film;
    const i = CurioViewer.live().cur;
    const q = f.panels[i].place.biju;
    const z = (pose) => {
      q.pose = pose;
      CurioViewer.redraw();
      const P = CurioViewer.live().picks.filter((x) => x.obj === "biju");
      return P.length;
    };
    const a = z("stand");
    const b = z("reach");
    q.pose = "stand";
    CurioViewer.redraw();
    return [a, b];
  });
  ok(reach[0] > 0 && reach[1] > 0, "standing and reaching both draw");
  const arms = await L(() => {
    const body = CurioRigActors._body("biju");
    const T = window.THREE;
    const hand = (pose) => {
      CurioRigActors._pose(body, CurioViewer.limbs(pose, 0));
      const list = body.arms.L;
      return list[list.length - 1].getWorldPosition(new T.Vector3()).toArray().map((v) => Math.round(v * 100) / 100);
    };
    return { stand: hand("stand"), reach: hand("reach"), wave: hand("wave"), sit: (CurioRigActors._pose(body, CurioViewer.limbs("sit", 0)), body.legs.L[1].getWorldPosition(new T.Vector3()).toArray()) };
  });
  ok(arms.stand[1] < 1.0, "standing, the hands hang down: " + arms.stand.join(","));
  ok(arms.reach[2] > arms.stand[2] + 0.3 && arms.reach[1] > 1.0, "reaching out, they come forward: " + arms.reach.join(","));
  ok(arms.wave[1] > 1.5, "waving, one hand is up high: " + arms.wave.join(","));

  /* dressed from words */
  await L(() => {
    const f = CurioViewer.live().film;
    f.panels[CurioViewer.live().cur].place.biju.look = "spiky red hair, a yellow hoodie, blue jeans and a cowboy hat";
    CurioViewer.changed(true);
  });
  const p = await L(() => CurioRigActors.plan("biju"));
  ok(p.hair === "spiky" && p.hat === "cowboy" && p.top === "hoodie", "place.look dresses it from words: " + [p.hair, p.top, p.hat].join(", "));
  await L(() => {
    const f = CurioViewer.live().film;
    f.panels[CurioViewer.live().cur].place.biju.lookParts = { topColor: "green", hat: "" };
    CurioViewer.changed(true);
  });
  const p2 = await L(() => CurioRigActors.plan("biju"));
  ok(p2.hat === "" && p2.topColor !== p.topColor, "lookParts changes single parts on top of the words");
  await page.waitForFunction(() => CurioRigActors.ready("biju"), null, { timeout: 30000 });
  await page.waitForTimeout(200);
  await shot("rig-2.png");

  /* the mouth follows the People tab */
  const mouth = await L(() => {
    const f = CurioViewer.live().film;
    const i = CurioViewer.live().cur;
    f.panels[i].people = f.panels[i].people || {};
    f.panels[i].people.biju = Object.assign(f.panels[i].people.biju || {}, { emo: { a: 270, r: 0.9 } });
    return CurioRigActors.plan("biju").mouth;
  });
  ok(mouth === "grumpy", "in a rage (People tab), the 3D character's mouth turns grumpy: " + mouth);

  /* playing walks it */
  await L(() => {
    const f = CurioViewer.live().film;
    f.panels[CurioViewer.live().cur].place.biju.pose = "walk";
    CurioViewer.changed(true);
  });
  await page.waitForTimeout(400);
  await shot("rig-3.png");

  /* undo turns it back */
  await L(() => {
    for (let k = 0; k < 5 && CurioRigActors.on("biju", 2); k++) CurioViewer.undo();
  });
  ok(!(await L(() => CurioRigActors.on("biju", 2))), "Undo turns it back into the block figure");

  /* per panel: place.rig */
  await L(() => {
    const f = CurioViewer.live().film;
    f.panels[4].place.biju.rig = true;
  });
  ok((await L(() => CurioRigActors.on("biju", 4))) && !(await L(() => CurioRigActors.on("biju", 3))), "place.rig makes it 3D in one panel only");

  ok(errors.length === 0, "no page errors" + (errors.length ? ": " + errors.join(" | ") : ""));
  await browser.close();
  server.close();
  console.log(fails ? `${fails} failed` : "all passed");
  process.exit(fails ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
