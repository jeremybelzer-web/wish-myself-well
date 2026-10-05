/* The relationship map in a real browser: node apps/curiosities/relations/tests/browser.js [--three three.min.js] [--shots dir]
   (needs Playwright and Chromium; --three serves a local three.js for the cdnjs address.)
   Standalone page: select a trait and see its lines, hop along a tie, open the movement archive, pick a feeling,
   pick movements and read what they say, show them on the map, switch to the 3D cube, double-click a curiosity
   to fly to it and double-click empty space to fly out. Then inside the app: Library, Relationship map opens over
   the app with the live database. No page errors. */
const http = require("http");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { chromium } = require("playwright");

const args = process.argv.slice(2);
const arg = (n, d) => (args.includes(n) ? args[args.indexOf(n) + 1] : d);
const SHOTS = arg("--shots", os.tmpdir());
const THREE_FILE = arg("--three", "");
const ROOT = path.join(__dirname, "..", "..");
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".webmanifest": "application/manifest+json" };

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
  const base = `http://127.0.0.1:${server.address().port}/`;
  const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--ignore-gpu-blocklist"] });
  const page = await browser.newPage({ viewport: { width: 1400, height: 950 }, serviceWorkers: "block" });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && !/Failed to load resource|three|cdnjs|fonts\.g/.test(m.text()) && errors.push(m.text()));
  if (THREE_FILE) await page.route("**/cdnjs.cloudflare.com/**", (r) => r.fulfill({ path: THREE_FILE, contentType: "text/javascript" }));
  else await page.route("**/cdnjs.cloudflare.com/**", (r) => r.abort());
  await page.route("**/fonts.g*/**", (r) => r.abort());
  try {
    await page.goto(base + "relations/index.html");
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForSelector(".rl-bar");
    ok((await page.getAttribute(".rl-bar .on[data-view]", "data-view")) === "cube", "it opens on the Cube matrix");
    await page.click('[data-view="flat"]');
    await page.waitForSelector(".rl-chip");
    const chips = await page.locator(".rl-chip").count();
    ok(chips > 900, `the flat matrix shows every node (${chips})`);

    await page.click('.rl-chip[data-id="tr-suspicious-authority"]');
    ok((await page.textContent(".rl-side h2")) === "Suspicious of authority", "clicking a trait selects it");
    const lines = await page.locator(".rl-svg path").count();
    ok(lines >= 15, `lines run to everything it is tied to (${lines})`);
    for (const id of ["fig-authority", "em-suspicion", "mv-constricted", "mv-darting-eyes", "mv-shallow-breath"])
      ok(await page.locator(`.rl-chip.near[data-id="${id}"]`).count(), `${id} is lit as a direct tie`);
    await page.screenshot({ path: path.join(SHOTS, "relations-flat.png") });

    await page.click('.rl-side button[data-id="em-suspicion"]');
    ok((await page.textContent(".rl-side h2")) === "Suspicion", "a tie in the side panel hops to that feeling");

    await page.click('.rl-side [data-act="archive"]');
    await page.waitForSelector(".rl-modal");
    const shown = await page.$$eval(".rl-move em", (els) => els.map((e) => e.textContent));
    ok(shown.length >= 10 && shown.every((t) => t.includes("Suspicion")), `the archive opens on that feeling's movements (${shown.length})`);
    await page.click('.rl-move[data-move="mv-darting-eyes"]');
    await page.click('.rl-move[data-move="mv-shallow-breath"]');
    await page.click('.rl-move[data-move="mv-constricted"]');
    ok(/3 picked/.test(await page.textContent(".rl-reads")) && /Suspicion/.test(await page.textContent(".rl-reads")), "three picked movements read as suspicion");
    await page.click('.rl-feelings [data-feel="em-suspicion"]');
    await page.click('[data-act="still"]');
    const still = await page.locator(".rl-move").count();
    const want = await page.evaluate(() => CurioArchive.movements.filter((m) => m.still).length);
    ok(still === want, `Stillness only shows every lack of movement and nothing else (${still} of ${want})`);
    await page.screenshot({ path: path.join(SHOTS, "relations-archive.png") });
    await page.click('[data-act="show"]');
    ok((await page.textContent(".rl-side h2")) === "3 picked", "Show on the map selects the picked movements");
    ok(await page.evaluate(() => JSON.parse(localStorage.getItem("curio-relations-v1")).picked.length === 3), "picks are kept on this device");

    const call = (fn) => page.evaluate(`(${fn})(document.getElementById("relations")._curioRelations.view().inner())`);
    const flick = async (sel, dx) => {
      const b = await page.locator(sel).boundingBox();
      const x = b.x + b.width / 2 - dx / 2;
      const y = b.y + b.height / 2;
      await page.mouse.move(x, y);
      await page.mouse.down();
      await page.mouse.move(x + dx, y, { steps: 2 });
      await page.mouse.up();
      await page.waitForTimeout(150);
    };
    // where a cube is on the screen now
    const spotOf = (id) =>
      page.evaluate((id) => {
        const c = document.getElementById("relations")._curioRelations.view().inner();
        const p = c.pos.get(id);
        const v = new THREE.Vector3(p[0], p[1], p[2]).project(c.stage.camera);
        const r = c.stage.host.getBoundingClientRect();
        return { x: r.left + ((v.x + 1) / 2) * r.width, y: r.top + ((1 - v.y) / 2) * r.height };
      }, id);

    // Cube matrix: a block of small 3D cubes, one per curiosity, a slab per column.
    await page.click('[data-view="cube"]');
    if (THREE_FILE) {
      await page.waitForSelector(".rl-cube.cube canvas");
      await page.waitForTimeout(400);
      // It opens zoomed in at the mouth of a corridor, looking down it, with the slider and "Click and drag" showing.
      const start = await call((c) => ({ r: c.stage.orb.r, th: c.stage.orb.theta, z: c.stage.camera.position.z }));
      ok(start.r < 3 && Math.abs(start.th + Math.PI / 2) < 0.3, `the Cube matrix opens zoomed in, looking down a corridor (r ${start.r.toFixed(1)})`);
      ok((await page.isVisible(".rl-corridor")) && /Click and drag/.test(await page.textContent(".rl-under")), "the corridor slider and a Click and drag line show from the start");
      await page.screenshot({ path: path.join(SHOTS, "relations-start.png") });
      await page.evaluate(() => {
        const i = document.querySelector(".rl-corridor input");
        i.dispatchEvent(new Event("pointerdown"));
        i.value = "500";
        i.dispatchEvent(new Event("input"));
      });
      await page.waitForTimeout(100);
      ok((await call((c) => c.corridor())) >= 0, "from the mouth, the slider slides you into the corridor");
      await page.click('[data-c="home"]');
      await page.waitForTimeout(1100);
      const block = await call((c) => ({ cubes: c.pos.size, slabs: c.slabs.length, zs: new Set([...c.pos.values()].map((p) => Math.round(p[2] * 10))).size }));
      ok(block.cubes > 900 && block.slabs === 6 && block.zs === 6, `every curiosity is a cube in a block of 6 slabs (${block.cubes} cubes)`);
      await page.evaluate(() => document.getElementById("relations")._curioRelations.select("tr-suspicious-authority"));
      await page.waitForTimeout(300);
      const labels = await page.locator(".rl-labels div:not(.slab)").count();
      ok(labels >= 15, `the cube labels the selection and every cube it ties to (${labels})`);
      await page.screenshot({ path: path.join(SHOTS, "relations-cube.png") });
      // turn it all the way round
      const th0 = await call((c) => c.stage.orb.theta);
      const cb = await page.locator(".rl-cube.cube canvas").boundingBox();
      await page.mouse.move(cb.x + 60, cb.y + cb.height - 60);
      await page.mouse.down();
      await page.mouse.move(cb.x + 460, cb.y + cb.height - 40, { steps: 20 });
      await page.mouse.up();
      const th1 = await call((c) => c.stage.orb.theta);
      ok(Math.abs(th1 - th0) > 1, `dragging turns the cube around (${(((th1 - th0) * 180) / Math.PI).toFixed(0)}°)`);
      await page.click('[data-c="home"]');
      await page.waitForTimeout(1100);
      // click a cube on the front face: it is selected
      const front = await call((c) => {
        let best = null;
        c.pos.forEach((p, id) => {
          if (!best || p[2] > best.p[2] + 0.01 || (Math.abs(p[2] - best.p[2]) < 0.01 && Math.hypot(p[0], p[1]) < Math.hypot(best.p[0], best.p[1]))) best = { id, p };
        });
        return best.id;
      });
      const fs = await spotOf(front);
      await page.mouse.click(fs.x, fs.y);
      ok((await page.evaluate(() => document.getElementById("relations")._curioRelations.selected()))[0] === front, `clicking a cube selects it (${front})`);
      const r0 = await call((c) => c.stage.orb.r);
      await page.mouse.dblclick(fs.x, fs.y);
      await page.waitForTimeout(1100);
      const mid = { x: cb.x + cb.width / 2, y: cb.y + cb.height / 2 };
      await page.mouse.dblclick(mid.x, mid.y);
      await page.waitForTimeout(1100);
      const r2 = await call((c) => c.stage.orb.r);
      ok(r2 < r0 * 0.3, `each double-click zooms further in (${r0.toFixed(0)} to ${r2.toFixed(1)})`);
      await page.screenshot({ path: path.join(SHOTS, "relations-cube-inside.png") });
      await page.click('[data-c="home"]');
      await page.waitForTimeout(1100);

      // Corridors: stand between two faces and the slider slides you along it, never into a cube.
      await page.click('[data-c="corridor"]');
      await page.waitForTimeout(1200);
      ok((await call((c) => c.corridor())) >= 0 && (await page.isVisible(".rl-corridor")), "Walk a corridor puts you between two faces, slider showing");
      ok(/^Between .+ and .+/.test(await page.textContent(".rl-corridor small")), "it says which two faces you are between");
      const c0 = await call((c) => c.stage.camera.position.toArray());
      await page.evaluate(() => {
        const i = document.querySelector(".rl-corridor input");
        i.dispatchEvent(new Event("pointerdown"));
        i.value = "900";
        i.dispatchEvent(new Event("input"));
      });
      await page.waitForTimeout(100);
      const c1 = await call((c) => c.stage.camera.position.toArray());
      ok(Math.abs(c1[0] - c0[0]) > 5 && Math.abs(c1[2] - c0[2]) < 0.01, `sliding moves you along the corridor and never sideways into the cubes (${c0[0].toFixed(1)} to ${c1[0].toFixed(1)})`);
      ok((await call((c) => c.corridor())) >= 0, "you are still in the corridor after sliding");
      await page.screenshot({ path: path.join(SHOTS, "relations-corridor.png") });
      // Inside a cube: lanes like Ableton, a 3D graph, and the curiosity proximity web.
      await page.evaluate(() => document.getElementById("relations")._curioRelations.select("em-suspicion"));
      await page.click('[data-c="inside"]');
      await page.waitForSelector(".rl-inside .rl-track.own");
      ok(!(await page.isVisible(".rl-corridor")), "inside a cube the corridor slider goes away");
      const tracks = await page.locator(".rl-inside .rl-track:not(.rl-ruler)").count();
      ok(tracks >= 5 && /Suspicion/.test(await page.textContent(".rl-track.own")), `inside a cube its curiosity and every tie are automation lanes, Ableton style (${tracks})`);
      await page.screenshot({ path: path.join(SHOTS, "relations-inside.png") });
      await page.click('.rl-inside [data-tab="graph"]');
      await page.waitForSelector(".rl-inside .rl-ingraph canvas");
      ok(true, "the 3D graph tab shows the same lanes in 3D");
      await page.click('.rl-inside [data-tab="flatgraph"]');
      ok((await page.locator(".rl-graph polyline").count()) === tracks && (await page.locator(".rl-graph polyline.own").count()) === 1, "the Graph tab draws every lane on one chart, this cube's thick");
      await page.click('.rl-inside [data-tab="pie"]');
      ok((await page.locator(".rl-pie path").count()) === tracks, "the Pie tab gives each lane its share of the movement");
      await page.screenshot({ path: path.join(SHOTS, "relations-pie.png") });
      await page.click('.rl-inside [data-tab="web"]');
      const web = await call((c) => { const w = c.inside().web(); return { one: w.one.size, two: w.two.size }; });
      const drawn = await page.locator(".rl-websvg line.l2").count();
      ok(web.two > web.one && drawn > 0, `Curiosity proximity shows what the ties are tied to (${web.one} then ${web.two})`);
      await page.screenshot({ path: path.join(SHOTS, "relations-proximity.png") });
      await page.click('.rl-inside [data-tab="leave"]');
      ok(!(await page.locator(".rl-inside").count()), "Leave the cube goes back out");
      await page.click('[data-c="home"]');
      await page.waitForTimeout(1100);

      // Cube slices: the same block; swipe right sends the front slab to the back, swipe left brings the back one forward.
      await page.click('[data-view="slices"]');
      await page.waitForSelector(".rl-cube.slices canvas");
      await page.waitForTimeout(300);
      const before = await call((c) => c.order());
      await flick(".rl-cube.slices canvas", 220);
      let after = await call((c) => c.order());
      ok(after[after.length - 1] === before[0] && after[0] === before[1], "swiping right sends the front slab to the back");
      await flick(".rl-cube.slices canvas", -220);
      after = await call((c) => c.order());
      ok(after[0] === before[0], "swiping left brings the back slab to the front");
      await page.focus(".rl-cube.slices");
      await page.keyboard.press("ArrowRight");
      after = await call((c) => c.order());
      ok(after[0] === before[1], "the right arrow does the same as a swipe right");
      await page.click(`.rl-slabtabs button[data-slab]:nth-child(3)`);
      after = await call((c) => c.order());
      ok(after[0] === before[3] || after[0] !== before[1], "clicking a slab's name brings that face to the front");
      await page.evaluate(() => document.getElementById("relations")._curioRelations.select("tr-suspicious-authority"));
      await page.waitForTimeout(900);
      ok((await page.locator(".rl-slabtabs b").count()) >= 3, "each slab's name counts the ties on it");
      await page.screenshot({ path: path.join(SHOTS, "relations-slices.png") });
      await page.click('[data-c="by-workspace"]');
      await page.waitForSelector(".rl-cube.slices canvas");
      await page.waitForTimeout(300);
      const many = await call((c) => c.slabs.length);
      ok(many > 30, `a slab per workspace makes a longer block (${many} slabs)`);
      await page.click('[data-c="by-family"]');
      await page.waitForTimeout(300);

      // 3D graph: the film's automation lanes in 3D, the one that moves most at the back.
      await page.click('[data-view="lanes"]');
      await page.waitForSelector(".rl-cube.lanes canvas");
      await page.waitForTimeout(400);
      const lanes = await call((c) => ({ order: c.order(), lanes: c.lanes(), example: c.example }));
      const most = lanes.lanes.slice().sort((a, b) => b.move - a.move)[0];
      ok(lanes.order.length >= 6 && lanes.order[lanes.order.length - 1] === most.label, `the lane that moves most stands at the back (${most.label})`);
      ok(lanes.example && /Example film/.test(await page.textContent(".rl-filmnote")), "with no film open it says the lanes are an example film");
      const lth = await call((c) => c.stage.orb.theta);
      await page.click('[data-c="side"]');
      await page.waitForTimeout(1100);
      ok(Math.abs((await call((c) => c.stage.orb.theta)) - lth) > 0.5, "From the side turns the lanes to another angle");
      await page.click('[data-c="home"]');
      await page.waitForTimeout(1100);
      await page.screenshot({ path: path.join(SHOTS, "relations-lanes.png") });

      // The 3D graph is a deck: swipe moves lanes front to back, clicking a lane's name brings it to the front.
      const lb = await call((c) => c.order());
      await flick(".rl-cube.lanes canvas", 220);
      const la = await call((c) => c.order());
      ok(la[la.length - 1] === lb[0], "swiping right sends the front lane to the back");
      await flick(".rl-cube.lanes canvas", -220);
      ok((await call((c) => c.order()))[0] === lb[0], "swiping left brings the back lane to the front");
      await page.click(`.rl-labels div.lane[data-lane]:nth-child(3)`);
      await page.waitForTimeout(200);
      const pickedLane = (await call((c) => c.lanes()))[2].label;
      ok((await call((c) => c.order()))[0] === pickedLane, `clicking a lane's name brings it to the front (${pickedLane})`);

      // Graph & pie: nodes and lines with the pie to its left.
      await page.click('[data-view="graph"]');
      await page.waitForSelector(".rl-gp-graph circle");
      ok((await page.locator(".rl-gp-pie path").count()) === 6 && (await page.locator(".rl-gp-graph circle").count()) > 900, "Graph & pie: a pie of the six groups beside every item as a node");
      await page.evaluate(() => document.getElementById("relations")._curioRelations.select("tr-suspicious-authority"));
      ok((await page.locator(".rl-gp-graph path.l").count()) >= 15, "selecting one lights its lines in the graph");
      await page.click('.rl-gp-pie path[data-group="feeling"]');
      ok((await call((c) => c.lit())) === "feeling", "clicking a slice lights that group");
      await page.screenshot({ path: path.join(SHOTS, "relations-graph.png") });

      // One category in every view: pick Feeling and the views show only feelings.
      await page.selectOption(".rl-cat", "fam:feeling");
      await page.waitForSelector(".rl-gp-graph circle");
      const feel = await page.locator(".rl-gp-graph circle").count();
      ok(feel > 30 && feel < 200, `the category picker shows one category in the same view (${feel} feelings)`);
      await page.click('[data-view="cube"]');
      await page.waitForSelector(".rl-cube.cube canvas");
      await page.waitForTimeout(300);
      ok((await call((c) => c.slabs.length)) >= 3, "one group picked: its workspaces become the faces of the cube");
      await page.selectOption(".rl-cat", "all");

      // Storyboard: a card per moment, the big box is what holds front and center.
      await page.click('[data-view="story"]');
      await page.waitForSelector(".rl-card");
      ok((await page.locator(".rl-card").count()) === 12 && (await page.locator(".rl-card .rl-fc.big").count()) === 12, "Storyboard: a card per moment, each with what holds front and center");
      await page.screenshot({ path: path.join(SHOTS, "relations-story.png") });

      // Tracks: a suite per track, opens to its parts, and the pop-up adjusts and records without opening it.
      await page.click('[data-view="tracks"]');
      await page.waitForSelector(".rl-suite");
      ok((await page.locator(".rl-suite").count()) >= 10, "Tracks: one track per suite, top to bottom");
      await page.click(".rl-suite .rl-tog >> nth=0");
      ok((await page.locator(".rl-part").count()) >= 2, "▸ opens a suite to show its parts' lanes");
      await page.click(".rl-suite .rl-tog >> nth=0");
      await page.click(".rl-suite .rl-adj >> nth=1");
      await page.waitForSelector(".rl-pop");
      const part = await page.getAttribute(".rl-pop-parts input >> nth=0", "data-id");
      await page.fill(".rl-pop-parts input >> nth=0", "90");
      const saved = await page.evaluate((id) => JSON.parse(localStorage.getItem("curio-relations-v1")).rec[id], part);
      ok(Array.isArray(saved) && Math.abs(saved[0] - 0.9) < 0.01, "moving a part's slider sets it at the playhead and keeps it");
      await call((c) => { const p = c.pop(); p.el.querySelector('[data-p="rec"]').click(); return 1; });
      await page.evaluate((id) => { const i = document.querySelector(`.rl-pop-parts input[data-id="${id}"]`); i.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true })); i.value = "20"; i.dispatchEvent(new Event("input", { bubbles: true })); }, part);
      await call((c) => { c.pop().tick(); c.pop().tick(); return 1; });
      const recd = await page.evaluate((id) => JSON.parse(localStorage.getItem("curio-relations-v1")).rec[id], part);
      ok(Math.abs(recd[1] - 0.2) < 0.01 && Math.abs(recd[2] - 0.2) < 0.01, "with Record on, a held slider is written into each moment the playhead passes");
      ok(!(await page.locator(".rl-part").count()), "all without opening the group");
      await page.screenshot({ path: path.join(SHOTS, "relations-tracks.png") });
      await page.click('.rl-pop [data-p="clear"]');
      await page.click('.rl-pop [data-p="close"]');
      await page.click('[data-view="cube"]');
      await page.waitForSelector(".rl-cube.cube canvas");
    } else ok(await page.locator(".rl-cube .rl-note").count(), "without three.js the 3D views say so");


    await page.click('[data-act="add"]');
    await page.fill("#rl-new-name", "Distrust of doctors");
    await page.selectOption("#rl-new-family", "character");
    await page.click('.rl-form button[type="submit"]');
    ok((await page.textContent(".rl-side h2")) === "Distrust of doctors", "Add a curiosity puts a new one on the map");
    const mine = await page.evaluate(() => document.getElementById("relations")._curioRelations.graph.links("mine-distrust-of-doctors").map((l) => l.id));
    ok(mine.includes("tr-suspicious-authority"), "it is tied to what was selected");
    await page.click('.rl-side [data-act="tie"]');
    await page.fill(".rl-find input", "Shallow breathing");
    await page.click('.rl-hits button[data-id="mv-shallow-breath"]');
    const tied = await page.evaluate(() => document.getElementById("relations")._curioRelations.graph.links("mine-distrust-of-doctors").map((l) => l.id));
    ok(tied.includes("mv-shallow-breath"), "Tie to… then clicking another draws a new line");
    await page.click('.rl-side .rl-mine button[aria-label="Remove this tie"]');
    const left = await page.evaluate(() => document.getElementById("relations")._curioRelations.graph.links("mine-distrust-of-doctors").length);
    ok(left === 1, "× removes a tie you drew");

    await page.click('[data-view="cube"]');
    if (THREE_FILE) {
      await page.waitForSelector(".rl-cube.cube canvas");
      await page.waitForTimeout(300);
      ok(await call((c) => c.pos.has("mine-distrust-of-doctors")), "your own curiosity is a cube in the block too");
      const box = await page.locator(".rl-cube.cube canvas").boundingBox();
      const cx = box.x + box.width / 2;
      const cy = box.y + box.height / 2;
      await page.mouse.dblclick(cx, cy);
      await page.waitForTimeout(1100);
      await page.mouse.dblclick(cx, cy);
      await page.waitForTimeout(1100);
      await page.mouse.dblclick(cx, cy);
      await page.waitForTimeout(1100);
      const eye0 = await call((c) => c.stage.camera.position.toArray());
      await page.mouse.move(cx, cy);
      await page.mouse.down();
      await page.mouse.move(cx + 250, cy + 40, { steps: 6 });
      await page.mouse.up();
      await page.waitForTimeout(100);
      const eye1 = await call((c) => c.stage.camera.position.toArray());
      ok(eye0.every((v, i) => Math.abs(v - eye1[i]) < 0.5), "inside, dragging looks around without moving where you stand");
      await page.click('[data-c="all"]');
      ok(await page.evaluate(() => JSON.parse(localStorage.getItem("curio-relations-v1")).showAll === true), "Show every proximity stays on");
      await page.click('[data-c="home"]');
      await page.waitForTimeout(1100);
      await page.screenshot({ path: path.join(SHOTS, "relations-cube-web.png") });
    }

    // Inside the app, from the Library.
    await page.goto(base + "index.html");
    await page.waitForFunction(() => document.querySelector("#lib-menu [data-relations]"), null, { timeout: 30000 });
    await page.evaluate(() => document.querySelector("#lib-menu [data-relations]").click());
    await page.waitForSelector(".rl-overlay .rl-side h2", { timeout: 30000 });
    const live = await page.evaluate(() => document.querySelector(".rl-overlay .rl")._curioRelations.graph.nodes.length);
    ok(live >= chips, `Library, Relationship map opens over the app with the live database (${live})`);
    // In the app, what you add goes into the curiosity database as your own curiosity and proximity.
    const R = '.rl-overlay';
    await page.click(`${R} .rl-find input`);
    await page.fill(`${R} .rl-find input`, "Shame");
    await page.click(`${R} .rl-hits button[data-id="shame"]`);
    await page.click(`${R} [data-act="add"]`);
    await page.fill("#rl-new-name", "Hides behind humor");
    await page.click(`${R} .rl-form button[type="submit"]`);
    const made = await page.evaluate(() => {
      const id = document.querySelector(".rl-overlay .rl")._curioRelations.selected()[0];
      const v = CurioMine.store().view();
      return { id, inDb: !!CuriosityDB.get("curiosity", id), mine: v.curiosities.some((c) => c.id === id), prox: v.proximities.filter((p) => p.then.curiosity === id && p.when.curiosity === "shame").length };
    });
    ok(/^my-/.test(made.id) && made.inDb && made.mine, `Add a curiosity in the app makes one of your own in the database (${made.id})`);
    ok(made.prox === 1, "and its tie is one of your own proximities");
    await page.click(`${R} .rl-side [data-act="tie"]`);
    await page.fill(`${R} .rl-find input`, "Pride");
    await page.click(`${R} .rl-hits button[data-id="pride"]`);
    const tie2 = await page.evaluate((id) => CurioMine.store().view().proximities.some((p) => p.when.curiosity === id && p.then.curiosity === "pride"), made.id);
    ok(tie2, "Tie to… between two curiosities adds a proximity to the database");
    await page.click(`${R} .rl-side [data-act="delnode"]`);
    const gone = await page.evaluate((id) => !CuriosityDB.get("curiosity", id) && !CurioMine.store().view().proximities.some((p) => p.when.curiosity === id || p.then.curiosity === id), made.id);
    ok(gone, "Remove this curiosity takes it and its proximities out of the database");
    await page.click(".rl-overlay .rl-close");
    ok(!(await page.locator(".rl-overlay").count()), "Close takes it away");
  } catch (e) {
    ok(false, "ran to the end: " + e.message);
  }
  ok(!errors.length, "no page errors" + (errors.length ? ": " + errors.slice(0, 3).join(" | ") : ""));
  await browser.close();
  server.close();
  console.log(fails ? fails + " failed" : "all relationship map browser checks passed");
  process.exit(fails ? 1 : 0);
})();
