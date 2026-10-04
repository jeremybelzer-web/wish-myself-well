/* "Make a set from words" (rig/sets.js) in a real browser:
   node apps/curiosities/rig/tests/sets.js [--three three.min.js] [--shots dir]
   (needs Playwright and Chromium; --three serves a local three.js r128 for the cdnjs address).

   Checks: the words are read (places, things with counts, colors, sizes and where, floors and walls, time of day,
   sitting, "no ..."); Surprise me writes words it can read; every set built around the made-from-words
   character keeps every piece on the floor, on a wall or on top of another thing, inside the room, apart from
   the other pieces and out of the character; a sitting person sits on the seat with the feet on the floor and
   the hands on the table or the steering wheel; walls on the camera's side are cut away; the sky and the Light
   add-on's starting point follow the time of day; "a surface" (rig/ik.js) uses the set's table; the sketch look
   draws outlines on the set; building and clearing sets gives graphics memory back; the panel keeps several
   sets in localStorage; switching to the fox rebuilds the set; no page errors.
   Screenshots of four sets go to --shots (default /mnt/project-files/maya-app/3d-characters when it exists) as
   sets-*.png, one in the pencil sketch look. */
const http = require("http");
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const ROOT = path.join(__dirname, "..", "..");
const arg = (name, d) => {
  const i = process.argv.indexOf(name);
  return i > 0 ? process.argv[i + 1] : d;
};
const THREE_FILE = arg("--three", "");
const SHOTS = arg("--shots", fs.existsSync("/mnt/project-files/maya-app/3d-characters") ? "/mnt/project-files/maya-app/3d-characters" : "");
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".glb": "model/gltf-binary", ".webmanifest": "application/manifest+json" };
const KEY = "curiosities-rig3d-sets-v1";
let failed = 0;
const ok = (cond, what) => {
  console.log((cond ? "ok   " : "FAIL ") + what);
  if (!cond) failed++;
};
function serve() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const p = path.join(ROOT, decodeURIComponent(req.url.split("?")[0]).replace(/^\/+/, "") || "index.html");
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

/* In the page: build a set and measure it against the character. */
async function check(text) {
  const c = CurioRig.current();
  const T = c.ctx.THREE;
  CurioRigSets.make(c.ctx, text);
  await new Promise((r) => {
    let n = 4;
    const go = () => (n-- > 0 ? requestAnimationFrame(go) : r());
    go();
  });
  const s = CurioRigSets.state(c.ctx);
  const problems = [];
  const model = c.ctx.model;
  model.updateMatrixWorld(true);
  const body = new T.Box3();
  model.traverse((o) => o.isMesh && o.visible && !o.userData.sketchHull && body.expandByObject(o));
  const B = (a) => new T.Box3(new T.Vector3(a[0], a[1], a[2]), new T.Vector3(a[3], a[4], a[5]));
  const room = s.room;
  const indoor = s.walls.length > 0 && !/car/.test(s.place);
  const name = (p) => p.kind + (p.wall ? "@" + p.wall : p.mount ? "^" + p.mount : "");
  const solid = s.pieces.filter((p) => p.box && !p.mount && !p.on && p.kind !== "rug" && p.kind !== "back seat");
  s.pieces.forEach((p) => {
    if (!p.box) return;
    const b = p.box;
    if (p.on) {
      if (b[1] < 0.25) problems.push(name(p) + " should stand on the " + p.on + " (bottom at " + b[1] + ")");
    } else if (p.mount) {
      const d = p.mount === "back" ? Math.abs(b[2] - room.z0) : p.mount === "left" ? Math.abs(b[0] - room.x0) : Math.abs(b[3] - room.x1);
      if (d > 0.05) problems.push(name(p) + " is " + d.toFixed(2) + " m off its wall");
    } else if (!/car seat|dashboard|back seat/.test(p.kind) && (b[1] > 0.03 || b[1] < -0.12)) problems.push(name(p) + " floats or sinks (bottom at " + b[1] + ")");
    if (indoor && !p.on && (b[0] < room.x0 - 0.03 || b[3] > room.x1 + 0.03 || b[2] < room.z0 - 0.03)) problems.push(name(p) + " goes through a wall " + JSON.stringify(b));
  });
  if (!/car/.test(s.place))
    for (let i = 0; i < solid.length; i++)
      for (let j = i + 1; j < solid.length; j++) {
        const a = B(solid[i].box).expandByScalar(-0.03);
        const b = B(solid[j].box).expandByScalar(-0.03);
        /* trees and bushes are round: their boxes may touch at the corners */
        if (a.intersectsBox(b) && !(/tree|pine|palm|bush/.test(solid[i].kind) && /tree|pine|palm|bush/.test(solid[j].kind))) problems.push(name(solid[i]) + " runs into " + name(solid[j]));
      }
  const r = c.rig();
  const w = (bn) => bn.getWorldPosition(new T.Vector3());
  const out = { s, problems, body: [body.min.x, body.min.y, body.min.z, body.max.x, body.max.y, body.max.z] };
  if (s.sitting && r.legs) {
    const hip = w(r.legs.L[0]);
    const ankles = ["L", "R"].map((k) => w(r.legs[k][2]).y);
    const knees = ["L", "R"].map((k) => w(r.legs[k][1]));
    const wrists = ["L", "R"].map((k) => w(r.arms[k][2]));
    out.seated = { hip: hip.y, ankles, knees: knees.map((v) => v.y), kneesZ: knees.map((v) => v.z), wrists: wrists.map((v) => v.toArray()) };
  } else {
    /* standing: no piece goes through the character */
    const me = new T.Box3().copy(body).expandByScalar(-0.04);
    s.pieces.forEach((p) => p.box && !p.mount && p.kind !== "rug" && B(p.box).expandByScalar(-0.02).intersectsBox(me) && problems.push(name(p) + " is inside the character"));
  }
  return out;
}

(async () => {
  const server = await serve();
  const base = `http://127.0.0.1:${server.address().port}/`;
  const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--ignore-gpu-blocklist"] });
  const context = await browser.newContext({ viewport: { width: 1400, height: 950 }, serviceWorkers: "block" });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => (m.type() === "error" || (m.type() === "warning" && /3D add-on/.test(m.text()))) && !/Failed to load resource|three|cdnjs|fonts\.g|WebGL|GPU stall/.test(m.text()) && errors.push(m.text()));
  if (THREE_FILE) await page.route("**/cdnjs.cloudflare.com/**", (r) => r.fulfill({ path: THREE_FILE, contentType: "text/javascript" }));
  await page.route("**/fonts.g*/**", (r) => r.abort());
  const frames = (n) => page.evaluate((n) => new Promise((r) => { const go = () => (n-- > 0 ? requestAnimationFrame(go) : r()); go(); }), n);
  const build = (text) => page.evaluate((t) => check(t), text);
  /* the camera: yaw and pitch by dragging, then a set zoom */
  const view = async (dx, dy, zoomOut) => {
    await page.click('.rig-dlg [data-rig="front"]');
    const cv = await page.$(".rig-dlg canvas");
    const bb = await cv.boundingBox();
    await page.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2);
    await page.mouse.down();
    await page.mouse.move(bb.x + bb.width / 2 + dx, bb.y + bb.height / 2 + dy, { steps: 4 });
    await page.mouse.up();
    for (let i = 0; i < 30; i++) await page.mouse.wheel(0, -100);
    for (let i = 0; i < zoomOut; i++) await page.mouse.wheel(0, 100);
    await frames(4);
  };
  const shot = async (name) => {
    if (!SHOTS) return;
    fs.mkdirSync(SHOTS, { recursive: true });
    await frames(3);
    await page.locator(".rig-dlg .rig-view").screenshot({ path: path.join(SHOTS, name + ".png") });
  };
  try {
    await page.goto(base + "index.html?screen=0");
    /* the 3D files load on first use (rig/load.js): fetch them before using the add-ons */
    await page.waitForFunction(() => window.CurioRig && window.CurioRig.load, null, { timeout: 15000 });
    await page.evaluate(() => CurioRig.load());
    await page.waitForFunction(() => window.CurioRig && CurioRig.sets && document.querySelector("#lib-menu [data-rig3d]"), null, { timeout: 15000 });
    await page.evaluate(`window.check = ${check.toString()}`);

    /* ----- reading the words ----- */
    const read = await page.evaluate(() => {
      const r = (t) => CurioRig.sets.read(t);
      const kinds = (p) => p.props.map((x) => (x.count > 1 ? x.count + " " : "") + x.kind).sort().join(", ");
      const o = {};
      let p = r("a kitchen with a table, two chairs and a window");
      o.kitchen = { place: p.place, walls: p.walls, floor: p.floor, kinds: kinds(p) };
      p = r("a dusty country road with a fence and a big tree at sunset");
      o.road = { place: p.place, road: p.road, time: p.time, dusty: p.dusty, tree: (p.props.find((x) => x.kind === "tree") || {}).scale, fence: p.props.some((x) => x.kind === "fence"), indoor: p.indoor };
      p = r("a diner booth");
      o.diner = { place: p.place, sit: p.sit, sitOn: p.sitOn, kinds: kinds(p) };
      p = r("a bedroom at night with a lamp");
      o.bedroom = { place: p.place, time: p.time, lampOn: (p.props.find((x) => x.kind === "lamp") || {}).on, kinds: kinds(p) };
      p = r("a stage with a curtain");
      o.stage = { place: p.place, stage: p.stage, curtain: p.props.some((x) => x.kind === "curtain") };
      p = r("a car interior");
      o.car = { car: p.car, sit: p.sit };
      p = r("a living room with blue walls, a red sofa on the left, three plants and no TV, sitting on the sofa");
      o.living = { wall: p.wallWord, sofa: (p.props.find((x) => x.kind === "sofa") || {}).colorWord, where: (p.props.find((x) => x.kind === "sofa") || {}).where, plants: (p.props.find((x) => x.kind === "plant") || {}).count, tv: p.props.some((x) => x.kind === "tv"), sitOn: p.sitOn };
      p = r("an office with a carpet floor, two walls, a desk and a laptop on the desk, at noon");
      o.office = { floor: p.floor, walls: p.walls, laptop: (p.props.find((x) => x.kind === "computer") || {}).on, time: p.time };
      p = r("a street with a yellow car, a streetlight and a fire hydrant at night");
      o.street = { place: p.place, car: (p.props.find((x) => x.kind === "car") || {}).colorWord, kinds: kinds(p), time: p.time };
      p = r("a forest with lots of pine trees and a big rock");
      o.forest = { pines: p.props.filter((x) => x.kind === "pine").reduce((n, x) => n + x.count, 0), rock: (p.props.find((x) => x.kind === "rock") || {}).scale };
      p = r("a tree, a bench and a mailbox");
      o.outside = { indoor: p.indoor };
      p = r("hello there");
      o.nothing = p.found;
      o.surprises = Array.from({ length: 30 }, () => CurioRig.sets.surprise()).map((t) => ({ t, p: r(t) })).filter(({ p }) => !p.found || (!p.place && !p.props.length)).map(({ t }) => t);
      return o;
    });
    ok(read.kitchen.place === "kitchen" && read.kitchen.walls === 3 && read.kitchen.floor === "checker" && read.kitchen.kinds === "2 chair, counter, fridge, table, window", `a kitchen with a table, two chairs and a window (and its counter and fridge) ${JSON.stringify(read.kitchen)}`);
    ok(read.road.place === "road" && read.road.road === "dirt" && read.road.time === "sunset" && read.road.dusty && read.road.tree > 1 && read.road.fence && !read.road.indoor, `a dusty country road: a dirt road, a fence, a big tree, sunset ${JSON.stringify(read.road)}`);
    ok(read.diner.place === "diner" && read.diner.sit && read.diner.sitOn === "booth" && /booth/.test(read.diner.kinds), `a diner booth is sat in ${JSON.stringify(read.diner)}`);
    ok(read.bedroom.place === "bedroom" && read.bedroom.time === "night" && read.bedroom.lampOn === "nightstand" && /bed/.test(read.bedroom.kinds), `a bedroom at night: the lamp stands on a nightstand ${JSON.stringify(read.bedroom)}`);
    ok(read.stage.place === "stage" && read.stage.stage && read.stage.curtain, "a stage with a curtain");
    ok(read.car.car && read.car.sit, "a car interior is sat in");
    ok(read.living.wall === "blue" && read.living.sofa === "red" && read.living.where === "left" && read.living.plants === 3 && !read.living.tv && read.living.sitOn === "sofa", `colors, where, counts, "no TV" and sitting on the sofa ${JSON.stringify(read.living)}`);
    ok(read.office.floor === "carpet" && read.office.walls === 2 && read.office.laptop === "desk" && read.office.time === "noon", `carpet, two walls, a laptop on the desk, noon ${JSON.stringify(read.office)}`);
    ok(read.street.place === "street" && read.street.car === "yellow" && /hydrant/.test(read.street.kinds) && /streetlight/.test(read.street.kinds) && read.street.time === "night", `a street at night ${JSON.stringify(read.street)}`);
    ok(read.forest.pines >= 5 && read.forest.rock > 1, `lots of pine trees, a big rock ${JSON.stringify(read.forest)}`);
    ok(read.outside.indoor === false, "trees, a bench and a mailbox with no place are outside");
    ok(read.nothing === false, "words with no place or things say so");
    ok(!read.surprises.length, "every Surprise me description is read back" + (read.surprises.length ? ": " + read.surprises.join(" / ") : ""));

    /* ----- built around the made character ----- */
    await page.evaluate(async () => {
      const c = CurioRig.open({ character: "made" });
      await c.ready;
    });
    await page.waitForSelector('.rig-dlg [data-sets="make"]');
    await frames(3);
    const sets = [
      "a kitchen with a table, two chairs and a window",
      "a dusty country road with a fence and a big tree at sunset",
      "a diner booth",
      "a bedroom at night with a lamp",
      "a stage with a curtain and a microphone stand",
      "a car interior",
      "a living room with a red sofa, a TV, a rug, a lamp next to the sofa and three plants",
      "an office with a desk, a computer on the desk, a bookshelf, a clock and a window",
      "a city street with a streetlight, a trash can, a fire hydrant and a yellow car at night",
      "a farm with a red barn, a fence, two trees and a barrel in the morning",
      "a park with a bench, three trees and some bushes",
      "a small bathroom with a sink, a mirror and a plant",
      "a garage with a car, two crates, a barrel and a shelf",
      "a kitchen with a stove, a sink, a fridge, a counter, a table, four chairs, a door, a clock and a picture",
    ];
    const results = {};
    for (const t of sets) results[t] = await build(t);
    const bad = Object.entries(results).filter(([, r]) => r.problems.length);
    ok(!bad.length, `${sets.length} sets: every piece on the floor, a wall or a surface, inside the walls, apart, and out of the character` + (bad.length ? ": " + bad.map(([t, r]) => t + " → " + r.problems.slice(0, 4).join("; ")).join(" | ") : ""));
    const counts = Object.values(results).map((r) => r.s.pieces.length);
    ok(counts.every((n) => n >= 3), "every set has things in it: " + counts.join(", "));
    const k = results[sets[0]].s;
    ok(k.pieces.filter((p) => p.kind === "chair").length === 2 && k.pieces.some((p) => p.kind === "table") && k.pieces.some((p) => p.mount === "back" || (p.kind === "window" && p.mount)) && k.pieces.some((p) => p.kind === "counter" && p.wall), `the kitchen has its table, two chairs, a window on a wall and a counter against a wall (${k.pieces.map((p) => p.kind).join(", ")})`);
    const notRoom = Object.entries(results).filter(([, r]) => r.s.notes.length).map(([t, r]) => t + ": " + r.s.notes.join());
    ok(!notRoom.length, "everything named found room" + (notRoom.length ? ": " + notRoom.join(" | ") : ""));

    /* sitting */
    const diner = results[sets[2]];
    ok(diner.s.sitting && diner.seated, "in the diner booth the character sits");
    if (diner.seated) {
      const d = diner.seated;
      ok(d.hip > diner.s.seatTop && d.hip < diner.s.seatTop + 0.18, `the hips are just above the seat (${d.hip.toFixed(2)} on a seat at ${diner.s.seatTop.toFixed(2)})`);
      ok(d.ankles.every((y) => y > 0.02 && y < 0.16), `the feet stay on the floor (ankles at ${d.ankles.map((y) => y.toFixed(2)).join(", ")})`);
      ok(d.knees.every((y) => y < diner.s.table.top - 0.08), `the knees fit under the table (${d.knees.map((y) => y.toFixed(2)).join(", ")} under ${diner.s.table.top.toFixed(2)})`);
      ok(d.wrists.every((v) => Math.abs(v[1] - diner.s.table.top) < 0.1 && v[2] > diner.s.table.z0 - 0.05), `the hands rest on the table (${d.wrists.map((v) => v[1].toFixed(2)).join(", ")}, top ${diner.s.table.top.toFixed(2)})`);
    }
    const car = results[sets[5]];
    ok(car.s.sitting && car.seated && car.seated.ankles.every((y) => y > 0.02 && y < 0.16), "in the car the character sits with the feet on the floor");
    const living = await build("a living room with a green sofa, sitting on the sofa");
    ok(living.s.sitting && living.seated && living.seated.hip > living.s.seatTop && !living.problems.length, `"sitting on the sofa" sits on the sofa (${living.problems.join("; ")})`);
    const stand = await build("a diner booth, standing");
    ok(!stand.s.sits && !stand.problems.length, `"standing" keeps the character up, out of the booth (${stand.problems.join("; ")})`);

    /* the sky and the light */
    const night = await build("a bedroom at night with a lamp");
    const light = await page.evaluate(() => {
      const c = CurioRig.current();
      return { sky: CurioRigSets.state(c.ctx).sky, type: c.ctx.pick("lightRigLens.lightType"), temp: c.ctx.pick("lightingLens.colorTemp"), lamps: CurioRigSets.state(c.ctx).lights };
    });
    ok(light.sky === 0x111a33 && light.type === "spotlight" && light.temp === "warm practical" && light.lamps >= 1, `night: a dark sky, a warm starting point for the Light add-on and a glowing lamp ${JSON.stringify(light)}`);
    void night;
    const sunset = await build("a dusty country road with a fence and a big tree at sunset");
    const sun = await page.evaluate(() => {
      const c = CurioRig.current();
      return { sky: CurioRigSets.state(c.ctx).sky, temp: c.ctx.pick("lightingLens.colorTemp"), rim: c.ctx.pick("lightRigLens.rim") };
    });
    ok(sun.sky === 0xe88a5a && sun.temp === "warm practical" && sun.rim === "strong", `sunset: an orange sky and a warm rim light ${JSON.stringify(sun)}`);
    void sunset;
    /* the sliders stay the person's: changing one sticks while the set stays */
    const kept = await page.evaluate(async () => {
      const c = CurioRig.current();
      c.set("lightingLens.colorTemp", "cold day");
      await new Promise((r) => setTimeout(r, 200));
      return c.ctx.pick("lightingLens.colorTemp");
    });
    ok(kept === "cold day", "the Light sliders are not fought: a change sticks");

    /* the dollhouse cut-away */
    await build("a kitchen with a table, two chairs and a window");
    await page.click('.rig-dlg [data-rig="side"]');
    await frames(3);
    const cut = await page.evaluate(() => CurioRigSets.state(CurioRig.current().ctx).walls);
    ok(cut.find((w) => w.name === "right").visible === false && cut.find((w) => w.name === "back").visible, `from the side, the wall in front of the camera is cut away ${JSON.stringify(cut)}`);
    await page.click('.rig-dlg [data-rig="front"]');
    await frames(3);
    const cut2 = await page.evaluate(() => CurioRigSets.state(CurioRig.current().ctx).walls);
    ok(cut2.every((w) => w.visible), "from the front, all three walls show");

    /* Feet and hands: "a surface" uses the set's table */
    const surf = await page.evaluate(async () => {
      const c = CurioRig.current();
      c.set("poseRigLens.hands", "a surface");
      await new Promise((r) => setTimeout(r, 300));
      const s = CurioRigSets.state(c.ctx);
      const t = s.pieces.find((p) => p.kind === "table");
      const aims = CurioRigIK.aims(c.ctx).hands;
      const out = { moved: s.moved, ikTable: CurioRigIK.table(c.ctx), top: t.box[4], hands: aims.map((a) => a[1]), front: t.box[2], handZ: aims.map((a) => a[2]) };
      c.set("poseRigLens.hands", "empty");
      await new Promise((r) => setTimeout(r, 200));
      out.back = CurioRigSets.state(c.ctx).moved;
      return out;
    });
    ok(surf.moved && !surf.ikTable && surf.hands.every((y) => Math.abs(y - surf.top) < 0.08) && surf.handZ.every((z) => z > surf.front), `"What the hands hold: a surface" rests the hands on the set's table, and the plain one hides ${JSON.stringify(surf)}`);
    ok(surf.back === false, "with empty hands the table goes back to its place");
    const atTable = await build("a kitchen with a table and two chairs, he sits at the table");
    ok(atTable.s.sitting && atTable.s.table && atTable.seated && atTable.seated.wrists.every((v) => Math.abs(v[1] - atTable.s.table.top) < 0.1) && !atTable.problems.length, `"sits at the table": on a chair, hands on the table (${atTable.problems.join("; ")})`);

    /* the sketch look draws the set too */
    const sketch = await page.evaluate(async () => {
      const c = CurioRig.current();
      CurioRigSnapshot.setLook(c.ctx, "pencil");
      await new Promise((r) => setTimeout(r, 400));
      let hulls = 0;
      let parts = 0;
      c.ctx.scene.getObjectByName("set").traverse((o) => {
        if (o.userData.sketchHull) hulls++;
        else if (o.isMesh) parts++;
      });
      const sky = c.ctx.scene.children.find((o) => o.name === "set sky");
      return { hulls, parts, skyHidden: !sky || !sky.visible };
    });
    ok(sketch.hulls > 20 && sketch.skyHidden, `in the pencil look the set's pieces get outlines (${sketch.hulls} outlines on ${sketch.parts} parts)`);
    await build("a diner booth");
    await view(-80, 20, 13);
    await shot("sets-diner-booth-pencil");
    await page.evaluate(() => CurioRigSnapshot.setLook(CurioRig.current().ctx, "off"));

    /* graphics memory comes back */
    const mem = await page.evaluate(async () => {
      const c = CurioRig.current();
      const m = c.ctx.renderer.info.memory;
      const wait = (ms) => new Promise((r) => setTimeout(r, ms));
      const cycle = async (look) => {
        CurioRigSnapshot.setLook(c.ctx, look);
        CurioRigSets.clear(c.ctx);
        await wait(250);
        const before = m.geometries + m.textures;
        for (const t of ["a kitchen with a table, two chairs and a window", "a dusty country road with a fence and a big tree at sunset", "a car interior", "a bedroom at night with a lamp"]) {
          CurioRigSets.make(c.ctx, t);
          await wait(250);
        }
        const during = m.geometries + m.textures;
        CurioRigSets.clear(c.ctx);
        await wait(300);
        return { before, during, after: m.geometries + m.textures };
      };
      const plain = await cycle("off");
      const pencil = await cycle("pencil");
      CurioRigSnapshot.setLook(c.ctx, "off");
      await wait(200);
      return { plain, pencil, left: !!c.ctx.scene.getObjectByName("set") };
    });
    ok(mem.plain.during > mem.plain.before && mem.plain.after <= mem.plain.before, `building and clearing sets gives graphics memory back (${JSON.stringify(mem.plain)})`);
    ok(mem.pencil.after <= mem.pencil.before + 1, `... in the pencil look too, outlines included (${JSON.stringify(mem.pencil)})`);
    ok(!mem.left, "a cleared set leaves nothing in the scene");

    /* ----- the panel: saved sets ----- */
    await page.fill('.rig-dlg [data-sets="text"]', "a kitchen with a table, two chairs and a window");
    await page.click('.rig-dlg [data-sets="make"]');
    await frames(3);
    let st = await page.evaluate((KEY) => ({ ls: JSON.parse(localStorage.getItem(KEY)), said: document.querySelector('.rig-dlg [data-sets="said"]').textContent, on: CurioRigSets.state(CurioRig.current().ctx).on }), KEY);
    ok(st.ls.on && st.on && /^Read as: a kitchen/.test(st.said), `Build this set saves the words and shows "Read as" (${st.said.slice(0, 90)}…)`);
    await page.fill('.rig-dlg [data-sets="text"]', "a park with a bench, three trees and some bushes");
    await page.click('.rig-dlg [data-sets="new"]');
    await frames(3);
    st = await page.evaluate((KEY) => JSON.parse(localStorage.getItem(KEY)), KEY);
    ok(st.list.length === 2 && st.list[1].text.startsWith("a park") && st.cur === st.list[1].id && /Park/.test(st.list[1].name), `Keep as a new one adds a second set with its own name (${st.list.map((x) => x.name).join(", ")})`);
    await page.click(`.rig-dlg [data-sets-pick="${st.list[0].id}"]`);
    await frames(3);
    const back = await page.evaluate(() => ({ text: document.querySelector('.rig-dlg [data-sets="text"]').value, place: CurioRigSets.state(CurioRig.current().ctx).place }));
    ok(back.text.startsWith("a kitchen") && back.place === "kitchen", "clicking a name switches to that set");
    await page.click('.rig-dlg [data-sets="surprise"]');
    await frames(3);
    st = await page.evaluate((KEY) => ({ ls: JSON.parse(localStorage.getItem(KEY)), said: document.querySelector('.rig-dlg [data-sets="said"]').textContent }), KEY);
    ok(st.ls.list.length === 3 && /^Read as: /.test(st.said), `Surprise me writes and builds a new set: "${st.ls.list[2].text}"`);
    await page.click(".rig-dlg [data-sets-del] >> nth=-1");
    st = await page.evaluate((KEY) => JSON.parse(localStorage.getItem(KEY)), KEY);
    ok(st.list.length === 2, "× deletes a set");
    await page.click('.rig-dlg [data-sets="clear"]');
    await frames(2);
    st = await page.evaluate((KEY) => ({ ls: JSON.parse(localStorage.getItem(KEY)), on: CurioRigSets.state(CurioRig.current().ctx).on, set: !!CurioRig.current().ctx.scene.getObjectByName("set"), grid: CurioRig.current().ctx.scene.children.some((o) => o.type === "GridHelper" && o.visible) }), KEY);
    ok(!st.ls.on && !st.on && !st.set && st.ls.list.length === 2 && st.grid, "Clear the set takes it away, keeps the words, and the grid comes back");

    /* reopening the window brings the set back; another character gets it rebuilt */
    await page.click('.rig-dlg [data-sets="make"]');
    await frames(2);
    await page.evaluate(() => document.querySelector(".rig-dlg").close());
    const again = await page.evaluate(async () => {
      const c = CurioRig.open({ character: "made" });
      await c.ready;
      await new Promise((r) => setTimeout(r, 300));
      return CurioRigSets.state(c.ctx).place;
    });
    ok(again === "kitchen", "the set comes back when the window opens again");
    const fox = await page.evaluate(async () => {
      const c = CurioRig.current();
      await c.load("fox");
      CurioRigSets.make(c.ctx, "a kitchen with a table, two chairs, a window, sitting on the chair");
      await new Promise((r) => setTimeout(r, 400));
      return { s: CurioRigSets.state(c.ctx), err: c.error() };
    });
    ok(!fox.err && fox.s.on && !fox.s.sits && /cannot sit/.test(fox.s.said), `the fox gets the set too and stands, and the words say why (${fox.s.said.slice(-80)})`);
    const foxCheck = await build("a kitchen with a table, two chairs and a window");
    ok(!foxCheck.problems.length, "nothing runs into the fox: " + foxCheck.problems.join("; "));
    await page.evaluate(() => CurioRig.current().load("made"));
    await frames(3);

    /* the screenshots */
    await build("a dusty country road with a fence and a big tree at sunset");
    await view(-60, 0, 17);
    await shot("sets-country-road-sunset");
    await build("a bedroom at night with a lamp");
    await view(-40, 20, 16);
    await shot("sets-bedroom-night-lamp");
    await build("a kitchen with a table, two chairs and a window in the morning");
    await view(-60, 15, 14);
    await shot("sets-kitchen-table-chairs");
    await page.evaluate(() => CurioRigSets.clear(CurioRig.current().ctx));
    await page.evaluate(() => document.querySelector(".rig-dlg").close());
    ok(!errors.length, "no page errors" + (errors.length ? ": " + errors.slice(0, 4).join(" | ") : ""));
  } catch (e) {
    ok(false, "ran to the end: " + e.message);
  } finally {
    await browser.close();
    server.close();
  }
  console.log(failed ? `${failed} failed` : "all passed");
  process.exit(failed ? 1 : 0);
})();
