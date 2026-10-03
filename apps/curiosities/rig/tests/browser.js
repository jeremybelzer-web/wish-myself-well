/* 3D characters in a real browser: node apps/curiosities/rig/tests/browser.js [--three three.min.js] [--shots dir]
   (needs Playwright and Chromium; --three serves a local three.js r128 for the cdnjs address).

   Opens Library, 3D characters, and checks: the free figure loads with its skeleton read correctly (hips, spine,
   head, two arms, two legs); Spine "collapsed" drops the head; a knee pushed the wrong way is held straight by
   the joint limits, bends when limits are off, and bends a little when joints are "like rubber"; Walking plays
   the walk and the joints move; Where the eyes go turns the head; the Fox loads with its three moves and a tail;
   your own .glb comes in and is remembered after a reload, and Forget removes it; the Screen's Movement rules row
   offers the tool. Without three.js it only checks that the window says what is missing. */
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
  const page = await browser.newPage({ viewport: { width: 1400, height: 950 }, serviceWorkers: "block" });
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  const warnings = [];
  page.on("console", (m) => warnings.push(m.text()));
  page.on("console", (m) => m.type() === "error" && !/Failed to load resource|three|cdnjs|fonts\.g|WebGL|GPU stall/.test(m.text()) && errors.push(m.text()));
  if (THREE_FILE) await page.route("**/cdnjs.cloudflare.com/**", (r) => r.fulfill({ path: THREE_FILE, contentType: "text/javascript" }));
  await page.route("**/fonts.g*/**", (r) => r.abort());
  try {
    await page.goto(base + "index.html?screen=0");
    await page.waitForFunction(() => window.CurioRig && document.querySelector("#lib-menu [data-rig3d]"), null, { timeout: 15000 });
    ok(true, "the Library has 3D characters");
    ok(await page.evaluate(() => CuriosityStudio.tools().some((t) => t.id === "rig3d")), "it is a Studio tool too");
    await page.evaluate(() => {
      localStorage.removeItem("curiosities-rig3d-v1");
      document.querySelector("#lib-menu [data-rig3d]").click();
    });
    await page.waitForSelector(".rig-dlg[open] canvas");
    await page.evaluate(() => CurioRig.current().ready);
    const err = await page.evaluate(() => CurioRig.current().error());
    if (!THREE_FILE && err) {
      ok(/three\.js/.test(err), "without three.js the window says it is needed (" + err + ")");
    } else {
      ok(!err, "the free figure loads" + (err ? ": " + err : ""));
      const shape = await page.evaluate(() => {
        const r = CurioRig.current().rig();
        return { hips: !!r.hips, spine: r.spine.length, head: !!r.head, arms: [r.arms.L.length, r.arms.R.length], legs: [r.legs.L.length, r.legs.R.length], quad: r.quadruped, joints: CurioRig.current().bones().length, clips: CurioRig.current().clips().length };
      });
      ok(shape.hips && shape.spine >= 2 && shape.head && shape.arms.every((n) => n >= 2) && shape.legs.every((n) => n >= 3) && !shape.quad, `the skeleton is read: hips, spine ${shape.spine}, head, arms ${shape.arms}, legs ${shape.legs}`);
      ok(shape.joints === 19 && shape.clips >= 1, `19 joints and a move (${shape.joints}, ${shape.clips})`);
      await page.waitForTimeout(400);
      await shot(page, "1-figure");

      const headY = () => page.evaluate(() => CurioRig.current().where(CurioRig.current().rig().head)[1]);
      await page.evaluate(() => CurioRig.current().set("rigRulesLens.slump", "proud and upright"));
      await page.waitForTimeout(300);
      const up = await headY();
      await page.evaluate(() => CurioRig.current().set("rigRulesLens.slump", "collapsed"));
      await page.waitForTimeout(300);
      const down = await headY();
      ok(down < up - 0.05, `Spine "collapsed" drops the head (${up.toFixed(2)} to ${down.toFixed(2)})`);
      await shot(page, "2-collapsed");
      await page.evaluate(() => CurioRig.current().set("rigRulesLens.slump", "relaxed"));

      /* A knee pushed the wrong way (toward the front). */
      const knee = (on, limits) =>
        page.evaluate(
          async ([on, limits]) => {
            const c = CurioRig.current();
            const k = c.rig().legs.L[1];
            c.rule("limits", on);
            c.set("rigRulesLens.limits", limits);
            c.setJoint(k, { bend: 90 });
            await new Promise((r) => setTimeout(r, 250));
            const t = c.turned(k);
            c.resetJoints();
            return t;
          },
          [on, limits]
        );
      const held = await knee(true, "natural");
      const free = await knee(false, "natural");
      const rubber = await knee(true, "like rubber");
      ok(held < 3, `joint limits hold a knee pushed the wrong way straight (${held.toFixed(1)}°)`);
      ok(free > 80, `with limits off it bends the wrong way (${free.toFixed(1)}°)`);
      ok(rubber > 5 && rubber < free, `like rubber lets it bend the wrong way a little (${rubber.toFixed(1)}°)`);
      await page.evaluate(() => CurioRig.current().rule("limits", true));

      /* Walking plays the walk. */
      await page.evaluate(() => CurioRig.current().set("rigRulesLens.motion", "walking"));
      const swing = await page.evaluate(async () => {
        const c = CurioRig.current();
        const seen = [];
        for (let i = 0; i < 8; i++) {
          await new Promise((r) => setTimeout(r, 140));
          seen.push(c.turned(c.rig().legs.L[0]));
        }
        return { lo: Math.min(...seen), hi: Math.max(...seen), playing: c.playing() };
      });
      ok(swing.playing !== "" && swing.hi - swing.lo > 8, `Walking plays a walk (${swing.playing}) and the hip joint swings (${swing.lo.toFixed(1)}° to ${swing.hi.toFixed(1)}°)`);
      await shot(page, "3-walking");
      await page.evaluate(() => CurioRig.current().set("rigRulesLens.motion", "standing still"));

      /* Where the eyes go: the head turns toward the ground. */
      await page.evaluate(() => CurioRig.current().set("rigRulesLens.floppy", "stiff"));
      await page.waitForTimeout(200);
      const h0 = await page.evaluate(() => CurioRig.current().turned(CurioRig.current().rig().head));
      await page.evaluate(() => CurioRig.current().set("rigRulesLens.lookAt", "at the ground"));
      await page.waitForTimeout(300);
      const h1 = await page.evaluate(() => CurioRig.current().turned(CurioRig.current().rig().head));
      ok(h1 > h0 + 5, `looking at the ground turns the head (${h0.toFixed(1)}° to ${h1.toFixed(1)}°)`);
      await page.evaluate(() => CurioRig.current().set("rigRulesLens.lookAt", "straight ahead"));

      /* Picking a joint by clicking it. */
      const box = await page.evaluate(() => {
        const c = CurioRig.current();
        const head = c.rig().head;
        const cv = document.querySelector(".rig-dlg canvas").getBoundingClientRect();
        return { w: cv.width, h: cv.height, x: cv.x, y: cv.y };
      });
      ok(box.w > 200 && box.h > 200, `the 3D view has room (${Math.round(box.w)} by ${Math.round(box.h)})`);
      await page.selectOption('.rig-dlg [data-rig="joint-pick"]', { index: 3 });
      ok((await page.locator('.rig-dlg [data-joint="bend"]').count()) === 1, "picking a joint shows its bend, side and twist with what is allowed");

      /* The Fox. */
      await page.selectOption('.rig-dlg [data-rig="character"]', "fox");
      await page.evaluate(() => CurioRig.current().ready);
      await page.waitForTimeout(300);
      const fox = await page.evaluate(() => ({ clips: CurioRig.current().clips(), tail: CurioRig.current().rig().tail.length, quad: CurioRig.current().rig().quadruped, err: CurioRig.current().error() }));
      ok(!fox.err && ["Survey", "Walk", "Run"].every((c) => fox.clips.includes(c)), `the Fox loads with Survey, Walk and Run (${fox.clips})`);
      ok(fox.tail >= 3 && fox.quad, `the Fox has a tail (${fox.tail}) and four legs`);
      await page.evaluate(() => CurioRig.current().set("rigRulesLens.motion", "running"));
      await page.waitForTimeout(300);
      ok((await page.evaluate(() => CurioRig.current().playing())) === "Run", "Running plays the Fox's run");
      await shot(page, "4-fox-running");
      await page.evaluate(() => CurioRig.current().set("rigRulesLens.motion", "standing still"));

      /* Objects: the same rules on a lamp, a tree and a cut-out picture. */
      await page.selectOption('.rig-dlg [data-rig="character"]', "desk-lamp");
      await page.evaluate(() => CurioRig.current().ready);
      const lamp = await page.evaluate(() => {
        const c = CurioRig.current();
        return { joints: c.bones().length, object: c.rig().object, err: c.error() };
      });
      ok(!lamp.err && lamp.object && lamp.joints === 5, `the desk lamp gets a chain of 5 joints (${lamp.joints})`);
      await page.evaluate(() => {
        const c = CurioRig.current();
        c.set("rigRulesLens.floppy", "stiff");
        c.set("rigRulesLens.slump", "relaxed");
        c.set("rigRulesLens.lookAt", "straight ahead");
      });
      await page.waitForTimeout(300);
      const tip0 = await page.evaluate(() => CurioRig.current().turned(CurioRig.current().rig().head));
      await page.evaluate(() => CurioRig.current().set("rigRulesLens.lookAt", "at the camera"));
      await page.waitForTimeout(300);
      const tip1 = await page.evaluate(() => CurioRig.current().turned(CurioRig.current().rig().head));
      ok(tip1 > tip0 + 5, `the lamp's shade turns to look at the camera (${tip0.toFixed(1)}° to ${tip1.toFixed(1)}°)`);
      await shot(page, "5-lamp-looks");
      await page.evaluate(() => CurioRig.current().set("rigRulesLens.motion", "walking"));
      const hop = await page.evaluate(async () => {
        const c = CurioRig.current();
        const ys = [];
        for (let i = 0; i < 8; i++) {
          await new Promise((r) => setTimeout(r, 120));
          ys.push(c.where(c.rig().hips)[1]);
        }
        return { lo: Math.min(...ys), hi: Math.max(...ys), playing: c.playing() };
      });
      ok(/hop/.test(hop.playing) && hop.hi - hop.lo > 0.05, `Walking makes the lamp hop (${hop.playing}, ${hop.lo.toFixed(2)} to ${hop.hi.toFixed(2)})`);
      await shot(page, "6-lamp-hops");
      /* Plain words: which parts bend and how far. */
      const asked = await page.evaluate(async () => {
        const c = CurioRig.current();
        c.set("rigRulesLens.motion", "standing still");
        c.set("rigRulesLens.limits", "natural");
        c.set("rigRulesLens.lookAt", "straight ahead");
        c.set("rigRulesLens.floppy", "stiff");
        await new Promise((r) => setTimeout(r, 200));
        const tip = c.rig().head;
        const base = c.rig().hips;
        c.resetJoints();
        c.setJoint(tip, { bend: 120 });
        c.setJoint(base, { bend: 10 });
        await new Promise((r) => setTimeout(r, 250));
        const tipBefore = c.turned(tip);
        const r = c.ask("make the lamp nod like it's sleepy, stiff base and a floppy top");
        c.setJoint(tip, { bend: 120 });
        c.set("rigRulesLens.floppy", "stiff");
        c.set("rigRulesLens.lookAt", "straight ahead");
        await new Promise((r) => setTimeout(r, 400));
        const out = { said: r.said, changes: r.changes, parts: c.parts(), tipBefore, tipAfter: c.turned(tip), word: document.querySelector('.rig-dlg [data-row="rigRulesLens.slump"] [data-word]').textContent };
        document.querySelector('.rig-dlg [data-rig="undo-ask"]').click();
        out.undone = c.parts();
        c.resetJoints();
        return out;
      });
      ok(asked.said.includes("sleepy") && asked.word === "slumped", `"sleepy" slumps it (${asked.said}; Spine: ${asked.word})`);
      ok(asked.parts.base < 1 && asked.parts.top > 1, `"stiff base and a floppy top" makes the base stiff and the top loose (${JSON.stringify(asked.parts)})`);
      ok(asked.tipAfter > asked.tipBefore + 10, `the loose top bends further than before (${asked.tipBefore.toFixed(0)}° to ${asked.tipAfter.toFixed(0)}°)`);
      ok(!Object.keys(asked.undone).length, "Undo puts it back");
      await page.evaluate(() => CurioRig.current().set("rigRulesLens.slump", "relaxed"));
      await page.evaluate(() => CurioRig.current().set("rigRulesLens.motion", "standing still"));
      await page.selectOption('.rig-dlg [data-rig="character"]', "tree");
      await page.evaluate(() => CurioRig.current().ready);
      ok((await page.evaluate(() => CurioRig.current().bones().length)) === 5 && !(await page.evaluate(() => CurioRig.current().error())), "the tree gets a chain too");
      await page.evaluate(() => {
        const c = CurioRig.current();
        c.set("poseRigLens.lineOfAction", "S curve");
        c.set("rigRulesLens.slump", "slumped");
      });
      await page.waitForTimeout(400);
      await shot(page, "7-tree-bends");
      await page.evaluate(() => {
        const c = CurioRig.current();
        c.set("poseRigLens.lineOfAction", "straight and stiff");
        c.set("rigRulesLens.slump", "relaxed");
        c.set("rigRulesLens.lookAt", "straight ahead");
      });
      const pic = await page.evaluate(async () => {
        const cv = Object.assign(document.createElement("canvas"), { width: 120, height: 240 });
        const x = cv.getContext("2d");
        x.fillStyle = "#e0703a";
        x.beginPath();
        x.ellipse(60, 150, 45, 85, 0, 0, Math.PI * 2);
        x.fill();
        x.beginPath();
        x.fillStyle = "#2a50ff"; /* a blue head, to see which way up the puppet stands */
        x.arc(60, 40, 32, 0, Math.PI * 2);
        x.fill();
        const c = await CurioRig.fromCutout(cv, "test cut-out");
        await c.ready;
        c.el.querySelector('[data-rig="front"]').click();
        await new Promise((r) => setTimeout(r, 400));
        const gl = c.el.querySelector("canvas");
        const out = Object.assign(document.createElement("canvas"), { width: gl.width, height: gl.height });
        const g = out.getContext("2d");
        g.drawImage(gl, 0, 0);
        const d = g.getImageData(0, 0, out.width, out.height).data;
        let blue = 0, orange = 0, nb = 0, no = 0;
        for (let i = 0; i < d.length; i += 4) {
          const y = Math.floor(i / 4 / out.width);
          if (d[i + 2] > 150 && d[i] < 110) (blue += y), nb++;
          else if (d[i] > 150 && d[i + 2] < 110) (orange += y), no++;
        }
        return { joints: c.bones().length, err: c.error(), object: c.rig().object, headY: nb ? blue / nb : -1, bodyY: no ? orange / no : -1 };
      });
      ok(!pic.err && pic.object && pic.joints === 5, `a cut-out picture becomes a flat puppet with a chain of joints (${pic.joints})`);
      ok(pic.headY >= 0 && pic.bodyY >= 0 && pic.headY < pic.bodyY, `the puppet stands the right way up, head above body (head at ${pic.headY.toFixed(0)}px, body at ${pic.bodyY.toFixed(0)}px)`);
      await page.evaluate(() => CurioRig.current().set("rigRulesLens.slump", "collapsed"));
      await page.waitForTimeout(400);
      await shot(page, "8-cutout");
      await page.evaluate(() => CurioRig.current().set("rigRulesLens.slump", "relaxed"));
      await page.click('.rig-dlg [data-rig="forget"]');
      await page.waitForFunction(() => !/^own:/.test(document.querySelector('.rig-dlg [data-rig="character"]').value));

      /* Your own .glb. */
      await page.setInputFiles('.rig-dlg [data-rig="file"]', { name: "my hero.glb", mimeType: "model/gltf-binary", buffer: fs.readFileSync(path.join(ROOT, "rig/models/rigged-figure.glb")) });
      await page.waitForFunction(() => /^own:/.test(document.querySelector('.rig-dlg [data-rig="character"]').value), null, { timeout: 10000 });
      await page.evaluate(() => CurioRig.current().ready);
      ok((await page.evaluate(() => CurioRig.current().bones().length)) === 19, "your own .glb comes in and is posable");
      await page.reload();
      await page.waitForFunction(() => window.CurioRig);
      await page.evaluate(() => CurioRig.open());
      await page.evaluate(() => CurioRig.current().ready);
      ok((await page.evaluate(() => document.querySelector('.rig-dlg [data-rig="character"]').value)) === "own:my hero.glb", "it is still there after a reload (kept on this device)");
      await page.click('.rig-dlg [data-rig="forget"]');
      await page.waitForFunction(() => !/^own:/.test(document.querySelector('.rig-dlg [data-rig="character"]').value));
      ok(!(await page.evaluate(() => [...document.querySelectorAll('.rig-dlg [data-rig="character"] option')].some((o) => /^own:/.test(o.value)))), "Forget removes it");

      /* Bugs the testing thread found (2026-10-03). */
      const toe = await page.evaluate(() => {
        const c = CurioRig.current();
        const L = c.rig().legs.L;
        return L.length > 3 ? c.roleOf(L[3]) : "toe";
      });
      ok(toe === "toe", `the figure's 4th leg joint is the toes, not a second ankle (${toe})`);

      const fast = await page.evaluate(async () => {
        const sel = document.querySelector('.rig-dlg [data-rig="character"]');
        for (const id of ["cesium-man", "fox", "tree", "rigged-figure", "desk-lamp"]) {
          sel.value = id;
          sel.dispatchEvent(new Event("change", { bubbles: true }));
        }
        await CurioRig.current().ready;
        await new Promise((r) => setTimeout(r, 1500));
        const c = CurioRig.current();
        return { obj: !!c.rig().object, joints: c.bones().length, credit: document.querySelector('.rig-dlg [data-rig="credit"]').textContent };
      });
      ok(fast.obj && fast.joints === 5 && /lamp/i.test(fast.credit), `picking characters quickly ends on the last one picked (lamp: ${fast.obj}, ${fast.joints} joints, credit "${fast.credit.slice(0, 40)}")`);

      await page.setInputFiles('.rig-dlg [data-rig="file"]', { name: "broken.glb", mimeType: "model/gltf-binary", buffer: Buffer.from("not a 3D model at all") });
      await page.waitForFunction(() => /not kept/.test(document.querySelector('.rig-dlg [data-rig="status"]').textContent), null, { timeout: 5000 }).catch(() => {});
      const broken = await page.evaluate(() => ({
        status: document.querySelector('.rig-dlg [data-rig="status"]').textContent,
        kept: [...document.querySelectorAll('.rig-dlg [data-rig="character"] option')].some((o) => o.value === "own:broken.glb"),
      }));
      ok(!broken.kept && /not kept/.test(broken.status) && !/[{}]/.test(broken.status), `a broken .glb is refused in plain words and not kept ("${broken.status}")`);

      const undoKey = await page.evaluate(async () => {
        let n = 0;
        const real = CurioStore.undo;
        CurioStore.undo = () => (n++, false);
        document.querySelector('.rig-dlg [data-rig="front"]').focus();
        document.querySelector('.rig-dlg [data-rig="front"]').dispatchEvent(new KeyboardEvent("keydown", { key: "z", ctrlKey: true, bubbles: true }));
        CurioStore.undo = real;
        return n;
      });
      ok(undoKey === 0, "Ctrl+Z inside the 3D window does not undo the film behind it");

      const between = await page.evaluate(async () => {
        const inp = document.querySelector('.rig-dlg [data-slider="rigRulesLens.pace"]');
        inp.value = "1.4";
        inp.dispatchEvent(new Event("input", { bubbles: true }));
        const f = document.querySelector('.rig-dlg [data-rig="ask"]');
        f.value = "frantic";
        f.form.requestSubmit();
        document.querySelector('.rig-dlg [data-rig="undo-ask"]').click();
        return document.querySelector('.rig-dlg [data-slider="rigRulesLens.pace"]').value;
      });
      ok(Math.abs(Number(between) - 1.4) < 0.02, `"Undo these" puts a slider left between marks back exactly (${between})`);

      const chip = await page.evaluate(() => {
        let got = "";
        const W = window.CuriosityWorkspaces;
        const real = W && W.openFor;
        if (W) W.openFor = (k) => (got = k);
        document.querySelector(".rig-dlg .chip[data-auto]").click();
        if (W) W.openFor = real;
        return { got, open: document.querySelector(".rig-dlg").open };
      });
      ok(/^c:/.test(chip.got) && !chip.open, `"automate" in the Library window opens that curiosity's automation (${chip.got})`);

      const leak = await page.evaluate(async () => {
        for (let i = 0; i < 18; i++) {
          CurioRig.open();
          await CurioRig.current().ready;
          document.querySelector(".rig-dlg").close();
        }
        CurioRig.open();
        await CurioRig.current().ready;
        return { canvases: document.querySelectorAll("canvas").length, err: CurioRig.current().error() };
      });
      ok(!leak.err && !warnings.some((w) => /Too many active WebGL/.test(w)), `opening and closing 18 times does not run out of 3D views (${leak.canvases} canvases)`);
      await page.evaluate(() => document.querySelector(".rig-dlg").close());
    }

    /* The Screen offers the tool on the Movement rules row. */
    const row = await page.evaluate(() => {
      const m = window.CurioScreenMaya && CurioScreenMaya.map();
      return m && m.rigRulesLens ? m.rigRulesLens.tool : "";
    });
    ok(row === "rig3d", "Movement rules is a curiosity whose Maya tool is 3D characters");
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
