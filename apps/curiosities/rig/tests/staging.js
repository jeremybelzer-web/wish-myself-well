/* "More than one actor" (rig/staging.js) in a real browser:
   node apps/curiosities/rig/tests/staging.js [--three three.min.js] [--shots dir]
   (needs Playwright and Chromium; --three serves a local three.js r128 for the cdnjs address).

   Checks: the add-on, its panel and its two sliders (How far apart, Eyelines) are in the 3D window; two actors and
   then four (made from words, Cesium Man, the desk lamp) build, each with its own skeleton, and go away again
   without leaving graphics memory behind; the presets put them where their words say (face to face, side by side,
   one behind the other, over the shoulder, huddle, standoff, and Closer to the camera); everyone's face turns to
   the speaker (eyelines); "Ida walks over to Nessa and shrugs" walks Ida to Nessa, stops at talking distance,
   turns to her and plays the shrug; the line (180-degree rule) shows on the floor and warns when the camera is
   dragged across it; on the Screen, two character tracks are shown together and "Everyone together" off shows one.
   No page errors. Screenshots (face to face, over the shoulder, huddle of 4, the line warning) go to --shots
   (default /mnt/project-files/maya-app/3d-characters when it exists) as staging-*.png. */
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

const MADE = {
  text: "long red hair, a green dress and brown boots",
  list: [
    { id: "ida", name: "Ida", text: "long red hair, a green dress and brown boots" },
    { id: "nessa", name: "Nessa", text: "curly black hair, a yellow hoodie, blue jeans and white sneakers" },
    { id: "abe", name: "Abe", text: "an old man with a gray beard, round glasses, a brown sweater and gray trousers" },
  ],
  cur: "ida",
};

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
  const shot = async (name) => {
    if (!SHOTS) return;
    fs.mkdirSync(SHOTS, { recursive: true });
    await page.locator(".rig-dlg .rig-view").screenshot({ path: path.join(SHOTS, name + ".png") });
  };
  const frames = (n) => page.evaluate((n) => new Promise((r) => { const go = () => (n-- > 0 ? requestAnimationFrame(go) : r()); go(); }), n);
  const st = () => page.evaluate(() => CurioRigStaging.state());
  const castAndWait = async (list) => {
    await page.evaluate((list) => CurioRigStaging.cast(list), list);
    await page.evaluate(() => CurioRigStaging.ready());
    await frames(6);
    return st();
  };
  const mem = () => page.evaluate(() => {
    const r = CurioRig.current().ctx.renderer;
    return { g: r.info.memory.geometries, t: r.info.memory.textures };
  });
  /* the body's facing on the floor, from its yaw */
  const fwd = (a) => [Math.sin(a.yaw), Math.cos(a.yaw)];
  const dot2 = (u, v) => u[0] * v[0] + u[1] * v[1];
  const unit = (x, z) => {
    const L = Math.hypot(x, z) || 1;
    return [x / L, z / L];
  };
  try {
    await page.goto(base + "index.html?screen=0");
    await page.evaluate((made) => {
      localStorage.setItem("curiosities-rig3d-made-v1", JSON.stringify(made));
      localStorage.setItem("curiosities-rig3d-v1", JSON.stringify({ character: "made" }));
    }, MADE);
    await page.reload();
    /* the 3D files load on first use (rig/load.js): fetch them before using the add-ons */
    await page.waitForFunction(() => window.CurioRig && window.CurioRig.load, null, { timeout: 15000 });
    await page.evaluate(() => CurioRig.load());
    await page.waitForFunction(() => window.CurioRig && window.CurioRigStaging && document.querySelector("#lib-menu [data-rig3d]"), null, { timeout: 15000 });
    ok(await page.evaluate(() => CurioRig.extensions().some((x) => x.id === "staging") && typeof CurioRig.maker.dress === "function"), "More than one actor is part of the 3D view, and the maker hands out its builder (CurioRig.maker.dress)");
    await page.evaluate(() => document.querySelector("#lib-menu [data-rig3d]").click());
    await page.waitForSelector(".rig-dlg[open] canvas");
    await page.evaluate(() => CurioRig.current().ready);
    const err = await page.evaluate(() => CurioRig.current().error());
    if (!THREE_FILE && err) {
      ok(/three\.js/.test(err), "without three.js the window says it is needed (" + err + ")");
    } else {
      ok(!err, "the made character Ida loads as actor 1" + (err ? ": " + err : ""));
      const panel = await page.evaluate(() => {
        const b = document.querySelector('.rig-dlg [data-ext="staging"]');
        return { box: !!b, sliders: !!(b && b.querySelector('[data-row="blocking.distance"]') && b.querySelector('[data-row="eyeline"]')), add: !!(b && b.querySelector('[data-stg="add"]')), more: b && b.querySelector('[data-stg="more"]').hidden, words: b ? b.textContent : "" };
      });
      ok(panel.box && panel.add && panel.more, "the panel is there with Add an actor, and the staging tools wait for a second actor");
      ok(panel.sliders, "How far apart and Eyelines (curiosity sliders) sit in the panel");
      ok((await st()).active === false, "one actor: nothing is staged, the character stays in the middle as before");
      await page.click('.rig-dlg [data-rig="front"]');
      await frames(10);
      const base0 = await mem();

      /* two actors */
      let s = await castAndWait([{ who: "made:nessa", name: "Nessa" }]);
      await page.evaluate(() => CurioRigStaging.name(0, "Ida"));
      ok(s.active && s.actors.length === 2 && s.actors.every((a) => a.loaded && a.bones === 19 && a.head), `two actors build, each with a 19-joint skeleton (${s.actors.map((a) => a.name + ":" + a.bones).join(", ")})`);
      const own = await page.evaluate(() => {
        const c = CurioRig.current().ctx;
        const all = [];
        c.scene.traverse((o) => o.isSkinnedMesh && all.push(o.skeleton));
        const set = new Set();
        all.forEach((k) => k.bones.forEach((b) => set.add(b)));
        return { skeletons: all.length, bones: set.size, groups: c.scene.children.filter((o) => /^actor /.test(o.name)).map((o) => o.name) };
      });
      ok(own.bones >= 38 && own.groups.length === 2, `each actor has its own bones, not shared (${own.bones} different joints in ${own.groups.join(" and ")})`);
      ok(await page.evaluate(() => !!document.querySelector('.rig-dlg [data-ext="staging"] [data-stg="more"]:not([hidden])') && document.querySelectorAll('.rig-dlg [data-stg-name]').length === 2), "the staging tools show, with a name box for each actor");

      await page.evaluate(() => CurioRigStaging.preset("face to face"));
      await frames(8);
      s = await st();
      let [a, b] = s.actors;
      const d = Math.hypot(b.x - a.x, b.z - a.z);
      ok(s.distance === "personal" && Math.abs(d - s.meters) < 0.02, `face to face: they stand at personal distance (${d.toFixed(2)} m apart)`);
      ok(dot2(fwd(a), unit(b.x - a.x, b.z - a.z)) > 0.98 && dot2(fwd(b), unit(a.x - b.x, a.z - b.z)) > 0.98, "face to face: each one faces the other");
      ok(Math.abs(a.z - b.z) < 0.01, "face to face: side-on to the camera (both the same distance from it)");
      await page.evaluate(() => CurioRigStaging.speaker(1));
      await frames(50);
      const e1 = await page.evaluate(() => CurioRigStaging.lookError(0));
      const e1b = await page.evaluate(() => CurioRigStaging.lookError(1));
      ok(e1 != null && e1 < 12, `eyelines: Ida's face points at Nessa, who is speaking (${e1 && e1.toFixed(1)} degrees off)`);
      ok(e1b != null && e1b < 12, `"both hold": Nessa looks back at Ida (${e1b && e1b.toFixed(1)} degrees off)`);
      await shot("staging-face-to-face");

      /* distances, and who is closer to the camera */
      await page.evaluate(() => CurioRig.current().set("blocking.distance", "intimate"));
      await frames(4);
      s = await st();
      const dI = Math.hypot(s.actors[1].x - s.actors[0].x, s.actors[1].z - s.actors[0].z);
      await page.evaluate(() => CurioRig.current().set("blocking.distance", "social"));
      await frames(4);
      s = await st();
      const dS = Math.hypot(s.actors[1].x - s.actors[0].x, s.actors[1].z - s.actors[0].z);
      ok(dI < 0.7 && dS > 2 && /strangers/.test(await page.evaluate(() => document.querySelector('[data-stg="dist-say"]').textContent)), `How far apart: intimate ${dI.toFixed(2)} m, social ${dS.toFixed(2)} m, explained in words`);
      await page.evaluate(() => CurioRigStaging.front(1));
      await frames(4);
      s = await st();
      ok(s.actors[1].z > s.actors[0].z + 0.2, `Closer to the camera: Nessa is nearer the lens (${s.actors[1].z.toFixed(2)} against ${s.actors[0].z.toFixed(2)})`);
      await page.evaluate(() => CurioRigStaging.front(-1));

      await page.evaluate(() => CurioRigStaging.preset("side by side"));
      await frames(4);
      s = await st();
      [a, b] = s.actors;
      ok(Math.abs(a.z - b.z) < 0.01 && Math.abs(a.x - b.x) > 0.5 && Math.abs(a.yaw) < 0.01 && Math.abs(b.yaw) < 0.01, "side by side: in a row, both facing the camera");
      await page.evaluate(() => CurioRigStaging.preset("one behind the other"));
      await frames(4);
      s = await st();
      [a, b] = s.actors;
      ok(a.z > b.z + 0.5 && Math.abs(a.yaw) < 0.01, "one behind the other: Ida in front, Nessa behind, both facing the camera");
      await page.evaluate(() => CurioRigStaging.preset("standoff"));
      await frames(4);
      s = await st();
      [a, b] = s.actors;
      ok(s.distance === "public" && Math.hypot(b.x - a.x, b.z - a.z) > 4 && dot2(fwd(a), unit(b.x - a.x, b.z - a.z)) > 0.98, "standoff: far apart (public distance) and facing");

      await page.evaluate(() => CurioRigStaging.preset("over the shoulder"));
      await page.click('.rig-dlg [data-rig="front"]');
      await frames(40);
      s = await st();
      [a, b] = s.actors;
      ok(a.z > b.z + 0.5 && a.face[2] < -0.5 && b.face[2] > 0.5, `over the shoulder: Ida's back is to the camera, Nessa faces it (faces ${a.face[2].toFixed(2)} and ${b.face[2].toFixed(2)})`);
      await shot("staging-over-the-shoulder");

      /* four actors: made from words, Cesium Man, an object */
      s = await castAndWait([{ who: "made:nessa", name: "Nessa" }, { who: "cesium-man", name: "Cesium Man" }, { who: "desk-lamp", name: "Lamp" }]);
      ok(s.actors.length === 4 && s.actors.every((x) => x.loaded && x.head), `four actors build (${s.actors.map((x) => `${x.name}: ${x.bones} joints`).join(", ")})`);
      ok(s.actors[3].bones === 5, "the lamp (an object) gets its chain of joints");
      await page.evaluate(() => CurioRigStaging.preset("circle"));
      await page.evaluate(() => CurioRigStaging.speaker(0));
      await frames(50);
      s = await st();
      const errs = [];
      for (const i of [1, 2, 3]) errs.push(await page.evaluate((i) => CurioRigStaging.lookError(i), i));
      ok(errs.every((x) => x != null && x < 20), `circle of four: everyone looks at Ida, who is speaking (${errs.map((x) => x && x.toFixed(1)).join(", ")} degrees off)`);
      const c4 = s.actors.reduce((m, x) => [m[0] + x.x / 4, m[1] + x.z / 4], [0, 0]);
      ok(s.actors.every((x) => dot2(fwd(x), unit(c4[0] - x.x, c4[1] - x.z)) > 0.98), "circle: everyone faces the middle");
      /* swap the lamp for Abe: the lamp goes away, Abe comes in */
      s = await castAndWait([{ who: "made:nessa", name: "Nessa" }, { who: "cesium-man", name: "Cesium Man" }, { who: "made:abe", name: "Abe" }]);
      ok(s.actors[3].name === "Abe" && s.actors[3].bones === 19 && (await page.evaluate(() => !CurioRig.current().ctx.scene.children.some((o) => o.name === "actor Lamp"))), "swapping an actor takes the old one out of the scene");
      await page.evaluate(() => CurioRigStaging.preset("huddle"));
      await page.evaluate(() => CurioRigStaging.speaker(2));
      await page.click('.rig-dlg [data-rig="front"]');
      await frames(50);
      s = await st();
      const ch = s.actors.reduce((m, x) => [m[0] + x.x / 4, m[1] + x.z / 4], [0, 0]);
      ok(s.distance === "intimate" && s.actors.every((x) => Math.hypot(x.x - ch[0], x.z - ch[1]) < 0.5 && dot2(fwd(x), unit(ch[0] - x.x, ch[1] - x.z)) > 0.98), "huddle: four close together, all facing in");
      /* a huddle reads best from a little above: drag the view up */
      const hv = await page.locator(".rig-dlg canvas").boundingBox();
      await page.mouse.move(hv.x + hv.width / 2, hv.y + hv.height / 2);
      await page.mouse.down();
      await page.mouse.move(hv.x + hv.width / 2 + 40, hv.y + hv.height / 2 + 45, { steps: 6 });
      await page.mouse.up();
      await frames(8);
      await shot("staging-huddle-of-4");

      /* everyone out again: the graphics memory goes back to what one actor used */
      await castAndWait([]);
      await frames(10);
      const after = await mem();
      s = await st();
      ok(!s.active && s.actors.length === 1 && (await page.evaluate(() => !CurioRig.current().ctx.scene.children.some((o) => /^actor /.test(o.name) && o.name !== "actor 1"))), "taking the extra actors out leaves one, back in the middle");
      ok(after.g <= base0.g && after.t <= base0.t, `no graphics memory left behind (geometries ${base0.g} before, ${after.g} after; pictures ${base0.t} before, ${after.t} after)`);

      /* blocking: Ida walks over to Nessa and shrugs */
      await castAndWait([{ who: "made:nessa", name: "Nessa" }]);
      await page.evaluate(() => CurioRigStaging.preset("standoff"));
      await frames(4);
      const motion0 = await page.evaluate(() => CurioRig.current().ctx.pick("rigRulesLens.motion"));
      const said = await page.evaluate(() => CurioRigStaging.beat("Ida walks over to Nessa and shrugs"));
      ok(said.length && /Ida walks to Nessa, then shrug/.test(said[0]), `the beat is read: "${said.join(" ")}"`);
      await frames(20);
      s = await st();
      const mid = s.actors[0];
      const walkMotion = await page.evaluate(() => CurioRig.current().playing());
      ok(mid.walking && /walk/.test(walkMotion), `on the way Ida walks with the walk rule (${walkMotion})`);
      await page.waitForFunction(() => CurioRigStaging.state().actors[0].arrived > 0, null, { timeout: 15000 });
      await frames(3);
      s = await st();
      [a, b] = s.actors;
      const gap = Math.hypot(b.x - a.x, b.z - a.z);
      ok(!a.walking && Math.abs(gap - 1.15) < 0.05, `Ida arrives and stops at talking distance from Nessa (${gap.toFixed(2)} m)`);
      ok(a.gesture === "shrug", `then she shrugs (${a.gesture || "nothing playing"})`);
      ok((await page.evaluate(() => CurioRig.current().ctx.pick("rigRulesLens.motion"))) === motion0, "her own Movement rule comes back after the walk");
      await frames(30);
      s = await st();
      [a, b] = s.actors;
      ok(dot2(fwd(a), unit(b.x - a.x, b.z - a.z)) > 0.95, "she turns to face Nessa");
      /* an extra actor walks too */
      await page.evaluate(() => CurioRigStaging.walkTo(1, { x: 0, z: 1.6 }));
      await frames(10);
      s = await st();
      ok(s.actors[1].walking && /walk/.test(s.actors[1].motion), `Nessa (an extra actor) walks to the front with the walk rule (${s.actors[1].motion})`);
      await page.waitForFunction(() => CurioRigStaging.state().actors[1].arrived > 0, null, { timeout: 15000 });
      s = await st();
      ok(!s.actors[1].walking && Math.hypot(s.actors[1].x, s.actors[1].z - 1.6) < 0.01, "and arrives on the mark");
      await page.evaluate(() => CurioRigStaging.walkTo(1, "mark"));
      await page.waitForFunction(() => CurioRigStaging.state().actors[1].arrived > 1 && !CurioRigStaging.state().actors[1].offMark, null, { timeout: 15000 });
      ok(true, "then walks back to her own mark");

      /* the line */
      await page.evaluate(() => CurioRigStaging.preset("face to face"));
      await page.evaluate(() => CurioRigStaging.line(true, 0, 1));
      await page.click('.rig-dlg [data-rig="front"]');
      await frames(6);
      s = await st();
      ok(s.line.visible && !s.line.crossed && !s.line.overlay, "the line shows on the floor between Ida and Nessa; the camera is on its side");
      const cv = await page.locator(".rig-dlg canvas").boundingBox();
      await page.mouse.move(cv.x + cv.width / 2 - 160, cv.y + cv.height / 2);
      await page.mouse.down();
      await page.mouse.move(cv.x + cv.width / 2 + 154, cv.y + cv.height / 2, { steps: 12 });
      await page.mouse.up();
      await frames(6);
      s = await st();
      ok(s.line.crossed && s.line.overlay && /swapped sides/.test(s.line.warn), `dragging the camera across the line warns: "${s.line.warn.slice(0, 90)}…"`);
      ok(await page.evaluate(() => !document.querySelector('[data-stg="warn"]').hidden && !document.querySelector('[data-stg="newside"]').hidden), "the panel says it too, with Use this side from now on");
      await shot("staging-180-line-warning");
      await page.click('.rig-dlg [data-stg="newside"]');
      await frames(4);
      ok(!(await st()).line.crossed, "Use this side from now on clears the warning");
      await page.evaluate(() => CurioRigStaging.line(false));
      await frames(2);
      ok(!(await st()).line.visible, "the line goes away when turned off");
      await page.evaluate(() => document.querySelector(".rig-dlg").close());

      /* on the Screen: two character tracks, shown together */
      await page.goto(base + "index.html?screen=1");
      await page.evaluate(() => {
        localStorage.removeItem("curiosities-rig3d-screen-view-v1");
        localStorage.removeItem("curiosities-rig3d-cast-v1");
        localStorage.removeItem("curiosities-rig3d-v1");
      });
      await page.reload();
      await page.waitForFunction(() => window.CurioScreen && window.CurioScreen.isOpen() && window.CurioRigScreen && window.CurioEngine && document.querySelector('[data-panel="rig3d"] [data-r3s="toggle"]'), null, { timeout: 15000 });
      const tracks = await page.evaluate(() => {
        const E = window.CurioEngine;
        let have = E.state().tracks.filter((t) => t.kind === "character");
        ["Ida", "Nessa"].slice(0, Math.max(0, 2 - have.length)).forEach((label) => E.send({ type: "addTrack", label, kind: "character", curiosities: [] }));
        have = E.state().tracks.filter((t) => t.kind === "character");
        return have.map((t) => t.label);
      });
      ok(tracks.length >= 2, `the timeline has two character tracks (${tracks.join(", ")})`);
      await page.evaluate(() => window.CurioRigScreen.open(true));
      await page.waitForFunction(() => window.CurioRigScreen.controller() && document.querySelector('[data-panel="rig3d"] canvas'));
      await page.evaluate(() => window.CurioRigScreen.controller().ready);
      await page.waitForFunction(() => {
        const s = CurioRigStaging.state(window.CurioRigScreen.controller());
        return s && s.actors.length >= 2 && s.actors.every((a) => a.loaded);
      }, null, { timeout: 15000 });
      s = await page.evaluate(() => CurioRigStaging.state(window.CurioRigScreen.controller()));
      ok(s.active && s.actors[1].track && tracks.includes(s.actors[1].name) && tracks.includes(s.actors[0].name), `the Screen shows the character tracks together (${s.actors.map((x) => x.name).join(" and ")})`);
      ok(await page.evaluate(() => document.querySelector('[data-panel="rig3d"] [data-r3s="together"]').checked), "the Screen's 3D panel has Everyone together, on");
      await page.click('[data-panel="rig3d"] [data-r3s="together"]');
      await page.waitForFunction(() => CurioRigStaging.state(window.CurioRigScreen.controller()).actors.length === 1, null, { timeout: 5000 });
      ok(true, "Everyone together off: one character again");
      await page.evaluate(() => window.CurioRigScreen.open(false));
    }
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
