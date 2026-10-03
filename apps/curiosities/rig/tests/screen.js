/* "3D on the Screen" (rig/screen.js) in a real browser, inside the real app:
   NODE_PATH=$(npm root -g) node apps/curiosities/rig/tests/screen.js [--three three.min.js] [--shots dir]
   (needs Playwright and Chromium; --three serves a local three.js r128 for the cdnjs address).

   Opens index.html?screen=1 and checks: the 3D actors panel is docked in the Player and stays a bar (no 3D)
   until Show 3D; Show 3D loads a character; a Spine node ("collapsed") written at the playhead through the
   engine drops the 3D head; moving the playhead to a moment where the lane says "relaxed" lifts it back;
   Played by swaps the 3D character and is kept under curiosities-rig3d-cast-v1; Key this on the timeline writes
   nodes at the playhead as one undo step; Hide 3D stops the 3D view. No page errors. Without three.js it only
   checks the panel says what is missing. */
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
const SHOTS = arg("--shots", "");
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
const shot = async (page, name) => SHOTS && (fs.mkdirSync(SHOTS, { recursive: true }), await page.screenshot({ path: path.join(SHOTS, name + ".png") }));

(async () => {
  const server = await serve();
  const base = `http://127.0.0.1:${server.address().port}/`;
  const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--ignore-gpu-blocklist"] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, serviceWorkers: "block" });
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => m.type() === "error" && !/Failed to load resource|three|cdnjs|fonts\.g|WebGL|GPU stall/.test(m.text()) && errors.push(m.text()));
  if (THREE_FILE) await page.route("**/cdnjs.cloudflare.com/**", (r) => r.fulfill({ path: THREE_FILE, contentType: "text/javascript" }));
  await page.route("**/fonts.g*/**", (r) => r.abort());
  try {
    await page.goto(base + "index.html?screen=1");
    await page.evaluate(() => {
      localStorage.removeItem("curiosities-rig3d-screen-view-v1");
      localStorage.removeItem("curiosities-rig3d-cast-v1");
      localStorage.removeItem("curiosities-rig3d-v1");
    });
    await page.reload();
    await page.waitForFunction(() => window.CurioScreen && window.CurioScreen.isOpen() && window.CurioRigScreen && document.querySelector('.sc-player .sc-dock[data-panel="rig3d"] [data-r3s="toggle"]'), null, { timeout: 15000 });
    ok(true, "the 3D actors panel is docked in the Player");
    ok(await page.evaluate(() => !window.CurioRigScreen.controller() && !document.querySelector('[data-panel="rig3d"] canvas')), "closed, it is only a bar: no 3D is started");

    /* The playhead on moment 1, then Show 3D. */
    await page.evaluate(() => window.CurioScreen.setRow(0));
    await page.click('[data-panel="rig3d"] [data-r3s="toggle"]');
    await page.waitForFunction(() => window.CurioRigScreen.controller() && document.querySelector('[data-panel="rig3d"] canvas'));
    await page.evaluate(() => window.CurioRigScreen.controller().ready);
    const err = await page.evaluate(() => window.CurioRigScreen.controller().error());
    if (!THREE_FILE && err) {
      ok(/three\.js/.test(err), "without three.js the panel says it is needed (" + err + ")");
    } else {
      ok(!err, "Show 3D loads a character" + (err ? ": " + err : ""));
      const info = await page.evaluate(() => {
        const c = window.CurioRigScreen.controller();
        const cv = document.querySelector('[data-panel="rig3d"] canvas').getBoundingClientRect();
        const side = document.querySelector('[data-panel="rig3d"] .rig-panel');
        return { joints: c.bones().length, w: cv.width, h: cv.height, sideHidden: !side || getComputedStyle(side).display === "none", who: window.CurioRigScreen.shown(), cast: window.CurioRigScreen.cast() };
      });
      ok(info.joints === 19 && info.cast === "rigged-figure", `the shown character (${info.who || "the film"}) is played by the plain figure, 19 joints (${info.joints})`);
      const room = await page.evaluate(() => {
        const v = document.querySelector(".sc-player .sc-viewers");
        const btn = document.querySelector('[data-panel="rig3d"] .r3s-ask button');
        const b = btn.getBoundingClientRect();
        const top = document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2);
        return { viewers: v ? v.getBoundingClientRect().height : 0, onTop: !!top && btn.contains(top), inView: b.bottom <= innerHeight };
      });
      ok(room.viewers > 120 && room.onTop && room.inView, `the 3D window floats over the Screen: the viewers keep their room (${Math.round(room.viewers)} px) and its buttons are not covered`);
      ok(info.w > 150 && info.h > 120 && info.sideHidden, `a compact 3D view (${Math.round(info.w)} by ${Math.round(info.h)}) without the 3D window's side panel`);

      /* A Spine lane through the engine, the way the Screen writes a node: "relaxed" at moment 1, "collapsed" at moment 3. */
      const wrote = await page.evaluate(() => {
        const E = window.CurioEngine;
        const st = E.state();
        const id = "rigRulesLens.slump";
        const who = window.CurioRigScreen.shown();
        let track = (st.tracks.find((t) => t.curiosities.includes(id)) || {}).id;
        const cmds = [];
        if (!track) {
          track = who || window.CurioLanes.trackFor(id, st);
          cmds.push({ type: "addCuriosity", track, curiosity: id });
        }
        cmds.push({ type: "setPoint", row: st.rows[0].id, track, curiosity: id, value: "relaxed" });
        cmds.push({ type: "setPoint", row: st.rows[2].id, track, curiosity: id, value: "collapsed" });
        const r = E.send({ type: "batch", label: "Spine for the test", commands: cmds });
        return { ok: r.ok, error: r.error, track, rows: st.rows.length };
      });
      ok(wrote.ok, `a Spine lane is written through the engine on ${wrote.track} (${wrote.rows} moments)` + (wrote.ok ? "" : ": " + wrote.error));
      const headY = () => page.evaluate(() => window.CurioRigScreen.controller().where(window.CurioRigScreen.controller().rig().head)[1]);
      const word = () => page.evaluate(() => window.CurioRigScreen.controller().timeline()["rigRulesLens.slump"]);
      await page.waitForTimeout(400);
      const y0 = await headY();
      const w0 = await word();
      await page.evaluate(() => window.CurioScreen.setRow(2));
      await page.waitForTimeout(500);
      const y2 = await headY();
      const w2 = await word();
      ok(w2 === 1 && w0 < 1, `the 3D view reads the lane at the playhead (moment 1: ${w0}, moment 3: ${w2})`);
      ok(y2 < y0 - 0.05, `moving the playhead to the "collapsed" node drops the head (${y0.toFixed(2)} to ${y2.toFixed(2)})`);
      await shot(page, "screen-1-collapsed");
      await page.evaluate(() => window.CurioScreen.setRow(0));
      await page.waitForTimeout(500);
      const y3 = await headY();
      ok(Math.abs(y3 - y0) < 0.03, `back at a moment without it, the head comes back up (${y3.toFixed(2)})`);

      /* Played by: the Fox, kept per character. */
      await page.selectOption('[data-panel="rig3d"] [data-r3s="actor"]', "fox");
      await page.waitForFunction(() => window.CurioRigScreen.controller() && window.CurioRigScreen.cast() === "fox");
      await page.evaluate(() => window.CurioRigScreen.controller().ready);
      const fox = await page.evaluate(() => ({ quad: window.CurioRigScreen.controller().rig().quadruped, saved: JSON.parse(localStorage.getItem("curiosities-rig3d-cast-v1")) }));
      ok(fox.quad && Object.values(fox.saved.cast).includes("fox"), `Played by swaps in the Fox and keeps it in curiosities-rig3d-cast-v1 (${JSON.stringify(fox.saved.cast)})`);
      await page.evaluate(() => window.CurioScreen.setRow(2));
      await page.waitForTimeout(500);
      await shot(page, "screen-2-fox");

      /* Plain words, then Key this on the timeline. */
      await page.evaluate(() => window.CurioScreen.setRow(1));
      /* a leftover setting (as if changed in the Library's 3D window) that "scared" does not touch */
      const leftover = await page.evaluate(() => {
        const told = CurioRig.readRequest("scared").values;
        const s = CurioRig.SLIDERS.find((x) => x.id.startsWith("rigRulesLens.") && !(x.id in told) && x.scale.length > 2);
        CurioRigScreen.controller().set(s.id, s.scale[s.scale.length - 1 === s.start ? 0 : s.scale.length - 1]);
        return s.id;
      });
      await page.fill('[data-panel="rig3d"] [data-r3s="ask"]', "scared");
      await page.click('[data-panel="rig3d"] .r3s-ask button');
      const said = await page.textContent('[data-panel="rig3d"] [data-r3s="said"]');
      ok(/Changed:/.test(said), "Tell it what to do changes the rules (" + said.slice(0, 70) + "...)");
      const undo0 = await page.evaluate(() => window.CurioEngine.history().undo.length);
      await page.click('[data-panel="rig3d"] [data-r3s="key"]');
      const keyed = await page.evaluate(() => {
        const E = window.CurioEngine;
        const st = E.state();
        const r = st.rows[1].id;
        const t = st.tracks.find((x) => x.curiosities.includes("rigRulesLens.pace"));
        const lane = t && st.lanes[t.id + "|rigRulesLens.pace"];
        return { pace: lane && lane.points[r], undo: E.history().undo.length, said: document.querySelector('[data-panel="rig3d"] [data-r3s="said"]').textContent };
      });
      const extra = await page.evaluate((id) => {
        const st = window.CurioEngine.state();
        const t = st.tracks.find((x) => x.curiosities.includes(id));
        const lane = t && st.lanes[t.id + "|" + id];
        return lane ? lane.points[st.rows[1].id] : undefined;
      }, leftover);
      ok(extra === undefined, `Key this keys only what the actor was told, not leftover settings (${leftover}: ${extra})`);
      ok(keyed.pace === "frantic" && keyed.undo === undo0 + 1, `Key this on the timeline puts the nodes at the playhead as one step (Pace: ${keyed.pace}; ${keyed.said.slice(0, 60)}...)`);
      await page.waitForTimeout(300);
      ok((await page.evaluate(() => window.CurioRigScreen.controller().timeline()["rigRulesLens.pace"])) === 1, "the 3D view follows the new node");
    }

    /* Hide 3D stops it. */
    await page.click('[data-panel="rig3d"] [data-r3s="toggle"]');
    ok(await page.evaluate(() => !window.CurioRigScreen.controller() && !document.querySelector('[data-panel="rig3d"] canvas')), "Hide 3D stops the 3D view");
    ok(!errors.length, "no page errors" + (errors.length ? ": " + errors.join(" | ") : ""));
  } catch (e) {
    ok(false, "the test ran: " + ((e && e.stack) || e));
  }
  await browser.close();
  server.close();
  console.log(failed ? failed + " failed" : "all passed");
  process.exit(failed ? 1 : 0);
})();
