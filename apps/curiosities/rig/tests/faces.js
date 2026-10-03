/* Face and feelings (rig/faces.js) in a real browser:
   node apps/curiosities/rig/tests/faces.js [--three three.min.js] [--shots dir]
   (needs Playwright and Chromium; --three serves a local three.js r128 for the cdnjs address).

   Checks: the sliders are in the 3D window; the Plain figure gets a drawn face; Happy curves the mouth up and Sad
   down, both in the face's own state and in the picture (the mouth's dark pixels sit higher at the corners than
   in the middle for happy, lower for sad); Surprised opens the eyes wider than Angry; the brows tilt opposite
   ways for Sad and Angry; blinks happen at "all the time" and stop at "never"; the pupils look left and right;
   the body joins in (sad sinks the head, happy bounces); a made-from-words character's own eyes are hidden while
   the face is drawn and come back when it is off; a character with blend shapes is moved through them instead;
   on the Screen, Emotion lanes at the playhead (joyful, then melancholy) and a Face and feelings lane drive the
   face. No page errors. Screenshots of one character happy, sad, angry and surprised go to --shots (default
   /mnt/project-files/maya-app/3d-characters when it exists) as faces-*.png. */
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
const FEEL = ["happy", "sad", "angry", "scared", "surprised", "disgust"];

/* A test-only add-on: a camera close on the face, so the face fills the picture. */
const faceCam = () =>
  CurioRig.extend({
    id: "test-face-cam",
    beforeRender(ctx) {
      if (!window.__faceCam || !ctx.rig || !ctx.rig.head) return;
      const T = ctx.THREE;
      const d = ctx.data("faces");
      const at = d.hb ? d.hb.c.clone().add(new T.Vector3(0, -0.02, 0)) : ctx.rig.head.getWorldPosition(new T.Vector3());
      ctx.camera.position.copy(at).add(new T.Vector3(0.1, 0.06, ctx.rig.quadruped ? 1.1 : 0.85));
      ctx.camera.lookAt(at);
    },
  });

/* Set the feelings (others to "not at all"), wait for the face to settle, and read its state. */
async function feel(page, set, extra) {
  return page.evaluate(
    async ([set, extra, FEEL]) => {
      const c = CurioRig.current();
      FEEL.forEach((f) => c.set("feelingFaceLens." + f, set[f] || "not at all"));
      Object.keys(extra || {}).forEach((k) => c.set(k, extra[k]));
      await new Promise((r) => setTimeout(r, 900));
      return CurioRigFaces.state(c.ctx);
    },
    [set, extra || {}, FEEL]
  );
}
/* Where the mouth's dark pixels are: the mean height of mouth pixels (red that is not there when the face
   is hidden) in the corner columns and in the middle columns. */
async function mouthPixels(page) {
  return page.evaluate(async () => {
    const c = CurioRig.current();
    const ctx = c.ctx;
    const frames = (n) => new Promise((r) => { const go = () => (n-- > 0 ? requestAnimationFrame(go) : r()); go(); });
    const cv = ctx.renderer.domElement;
    const grab = async () => {
      await frames(3);
      const x = Object.assign(document.createElement("canvas"), { width: cv.width, height: cv.height }).getContext("2d");
      x.drawImage(cv, 0, 0);
      return x.getImageData(0, 0, cv.width, cv.height).data;
    };
    ctx.prefs.faceBody = false; /* hold the head still (no bounce) while the picture is read */
    await frames(12);
    const s = CurioRigFaces.state(ctx);
    const m = s.mouthPx;
    const W = cv.width;
    const x0 = Math.floor(Math.min(m.left[0], m.right[0]));
    const x1 = Math.ceil(Math.max(m.left[0], m.right[0]));
    const span = Math.max(4, x1 - x0);
    const y0 = Math.max(0, Math.floor(Math.min(m.left[1], m.middle[1], m.top[1]) - span * 0.2));
    const y1 = Math.min(cv.height, Math.ceil(Math.max(m.left[1], m.middle[1], m.bottom[1]) + span * 0.2));
    const withFace = await grab();
    ctx.prefs.faceDraw = false;
    const without = await grab();
    ctx.prefs.faceDraw = true;
    ctx.prefs.faceBody = true;
    await frames(2);
    const col = (a, b) => {
      let sy = 0;
      let n = 0;
      for (let y = y0; y < y1; y++)
        for (let x = Math.floor(a); x < b; x++) {
          const i = (y * W + x) * 4;
          const changed = Math.abs(withFace[i] - without[i]) + Math.abs(withFace[i + 1] - without[i + 1]) + Math.abs(withFace[i + 2] - without[i + 2]) > 60;
          if (changed && withFace[i] - withFace[i + 1] > 18 && withFace[i] - withFace[i + 2] > 12) (sy += y), n++; /* red that is not there without the face: the mouth */
        }
      return n ? sy / n : null;
    };
    const q = span * 0.25;
    const left = col(x0, x0 + q);
    const right = col(x1 - q, x1);
    const middle = col(x0 + span * 0.42, x0 + span * 0.58);
    return { left, right, middle, corners: left != null && right != null ? (left + right) / 2 : null };
  });
}

(async () => {
  const server = await serve();
  const base = `http://127.0.0.1:${server.address().port}/`;
  const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--ignore-gpu-blocklist"] });
  const page = await browser.newPage({ viewport: { width: 1400, height: 950 }, serviceWorkers: "block" });
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => (m.type() === "error" || (m.type() === "warning" && /3D add-on faces/.test(m.text()))) && !/Failed to load resource|three|cdnjs|fonts\.g|WebGL|GPU stall/.test(m.text()) && errors.push(m.text()));
  if (THREE_FILE) await page.route("**/cdnjs.cloudflare.com/**", (r) => r.fulfill({ path: THREE_FILE, contentType: "text/javascript" }));
  await page.route("**/fonts.g*/**", (r) => r.abort());
  const shot = async (name) => {
    if (!SHOTS) return;
    fs.mkdirSync(SHOTS, { recursive: true });
    await page.locator(".rig-dlg .rig-view canvas").screenshot({ path: path.join(SHOTS, name + ".png") });
  };
  const load = async (id) => {
    await page.selectOption('.rig-dlg [data-rig="character"]', id);
    await page.evaluate(() => CurioRig.current().ready);
    await page.waitForTimeout(300);
  };
  try {
    await page.goto(base + "index.html?screen=0");
    await page.waitForFunction(() => window.CurioRig && window.CurioRigFaces && document.querySelector("#lib-menu [data-rig3d]"), null, { timeout: 15000 });
    ok(await page.evaluate(() => CurioRig.extensions().some((x) => x.id === "faces")), "the Face and feelings add-on is part of the 3D view");
    const lens = await page.evaluate(() => {
      const DB = window.CuriosityDB;
      const row = DB && DB.get && DB.get("curiosity", "feelingFaceLens");
      return row ? { label: row.label, sliders: row.sliders.map((s) => s.id) } : null;
    });
    ok(lens && lens.label === "Face and feelings" && ["happy", "sad", "angry", "scared", "surprised", "disgust", "look"].every((s) => lens.sliders.includes(s)), "the Face and feelings lens is in the curiosity database with its sliders" + (lens ? "" : " (not found)"));
    await page.evaluate(faceCam);
    await page.evaluate(() => {
      localStorage.removeItem("curiosities-rig3d-v1");
      localStorage.setItem("curiosities-rig3d-made-v1", JSON.stringify({ text: "short red hair, a green t-shirt, blue jeans and brown shoes" }));
      window.__faceCam = true;
      document.querySelector("#lib-menu [data-rig3d]").click();
    });
    await page.waitForSelector(".rig-dlg[open] canvas");
    await page.evaluate(() => CurioRig.current().ready);
    const err = await page.evaluate(() => CurioRig.current().error());
    if (!THREE_FILE && err) {
      ok(/three\.js/.test(err), "without three.js the window says it is needed (" + err + ")");
    } else {
      ok(!err, "the free figure loads" + (err ? ": " + err : ""));
      const panel = await page.evaluate(() => ({
        rows: ["feelingFaceLens.happy", "feelingFaceLens.sad", "feelingFaceLens.angry", "feelingFaceLens.scared", "feelingFaceLens.surprised", "feelingFaceLens.disgust", "faceLens.expression", "faceLens.blinks", "feelingFaceLens.look"].every((id) => document.querySelector(`.rig-dlg [data-row="${id}"]`)),
        words: (document.querySelector('.rig-dlg [data-ext="faces"]') || {}).textContent || "",
      }));
      ok(panel.rows, "the sliders are in the panel (six feelings, how big, blinks, where the eyes look)");
      ok(/Show a face/.test(panel.words) && /Follow the film's feelings/.test(panel.words) && /The body joins in/.test(panel.words), "the panel has its three switches");
      await page.waitForTimeout(400);

      /* the Plain figure: a drawn face */
      const calm = await feel(page, {}, { "faceLens.blinks": "never", "faceLens.expression": "clear", "feelingFaceLens.look": "ahead" });
      ok(calm.drawn && calm.visible && calm.morphs === 0, "the Plain figure gets a drawn face (eyes, brows, mouth)");
      const happy = await feel(page, { happy: "very" });
      const hp = await mouthPixels(page);
      const sad = await feel(page, { sad: "very" });
      const sp = await mouthPixels(page);
      ok(happy.cornerLift > 0 && sad.cornerLift < 0, `happy curves the mouth up, sad down (corners ${happy.cornerLift.toFixed(3)} and ${sad.cornerLift.toFixed(3)} above the middle)`);
      ok(happy.mouthPx.left[1] < happy.mouthPx.middle[1] - 1 && sad.mouthPx.left[1] > sad.mouthPx.middle[1] + 1, `on the screen too: happy corners above the middle (${happy.mouthPx.left[1].toFixed(0)} against ${happy.mouthPx.middle[1].toFixed(0)}), sad below (${sad.mouthPx.left[1].toFixed(0)} against ${sad.mouthPx.middle[1].toFixed(0)})`);
      ok(hp.corners != null && hp.middle != null && hp.corners < hp.middle - 2, `in the picture, happy's mouth pixels sit higher at the corners (rows ${hp.corners && hp.corners.toFixed(1)}) than in the middle (${hp.middle && hp.middle.toFixed(1)})`);
      ok(sp.corners != null && sp.middle != null && sp.corners > sp.middle + 1, `in the picture, sad's mouth pixels sit lower at the corners (rows ${sp.corners && sp.corners.toFixed(1)}) than in the middle (${sp.middle && sp.middle.toFixed(1)})`);
      ok(Math.sign(sad.browTilt[0]) !== Math.sign(sad.browTilt[1]) && sad.browTilt[1] < 0, `sad lifts the inner ends of the brows (${sad.browTilt.map((x) => x.toFixed(2)).join(", ")})`);
      const angry = await feel(page, { angry: "very" });
      const surprised = await feel(page, { surprised: "very" });
      ok(angry.browTilt[1] > 0 && angry.browTilt[0] < 0, `angry pulls the inner ends of the brows down (${angry.browTilt.map((x) => x.toFixed(2)).join(", ")})`);
      ok(surprised.eyeOpen > 1.2 && angry.eyeOpen < 0.8, `surprised opens the eyes wide (${surprised.eyeOpen.toFixed(2)}), angry narrows them (${angry.eyeOpen.toFixed(2)})`);
      ok(surprised.p.open > 0.6 && surprised.browY[0] > calm.browY[0], `surprised drops the jaw open (${surprised.p.open.toFixed(2)}) and lifts the brows`);
      const big = await feel(page, { happy: "a little" }, { "faceLens.expression": "extreme" });
      const small = await feel(page, { happy: "a little" }, { "faceLens.expression": "subtle" });
      ok(big.cornerLift > small.cornerLift * 2.5, `how big the face goes: extreme is a cartoon take, subtle barely shows (${big.cornerLift.toFixed(3)} against ${small.cornerLift.toFixed(3)})`);
      await feel(page, {}, { "faceLens.expression": "clear" });

      /* blinks */
      const blinks = await page.evaluate(async () => {
        const c = CurioRig.current();
        c.set("faceLens.blinks", "all the time");
        const b0 = CurioRigFaces.state(c.ctx).blinks;
        let shut = 0;
        const t0 = performance.now();
        while (performance.now() - t0 < 2500) {
          const s = CurioRigFaces.state(c.ctx);
          shut = Math.max(shut, s.lid);
          await new Promise((r) => requestAnimationFrame(r));
        }
        const b1 = CurioRigFaces.state(c.ctx).blinks;
        c.set("faceLens.blinks", "never");
        await new Promise((r) => setTimeout(r, 300));
        const b2 = CurioRigFaces.state(c.ctx).blinks;
        await new Promise((r) => setTimeout(r, 1500));
        const b3 = CurioRigFaces.state(c.ctx).blinks;
        return { b0, b1, b2, b3, shut };
      });
      ok(blinks.b1 - blinks.b0 >= 1 && blinks.shut > 0.5, `blinks happen at "all the time" (${blinks.b1 - blinks.b0} in 2.5 s, eyes ${Math.round(blinks.shut * 100)}% shut at the deepest)`);
      ok(blinks.b3 === blinks.b2, `no blinks at "never" (${blinks.b3 - blinks.b2})`);

      /* the eyes look */
      const left = await feel(page, {}, { "feelingFaceLens.look": "left" });
      const right = await feel(page, {}, { "feelingFaceLens.look": "right" });
      const upLook = await feel(page, {}, { "feelingFaceLens.look": "up" });
      ok(left.pupil[0][0] < 0 && right.pupil[0][0] > 0 && upLook.pupil[0][1] > 0, `the pupils look left, right and up (${left.pupil[0][0].toFixed(4)}, ${right.pupil[0][0].toFixed(4)}, ${upLook.pupil[0][1].toFixed(4)})`);
      await feel(page, {}, { "feelingFaceLens.look": "ahead" });

      /* the body joins in */
      const headY = () => page.evaluate(() => CurioRig.current().where(CurioRig.current().rig().head)[1]);
      await feel(page, {});
      const y0 = await headY();
      await feel(page, { sad: "very" });
      const y1 = await headY();
      ok(y1 < y0 - 0.003, `sad sinks the head and shoulders (head ${y0.toFixed(3)} to ${y1.toFixed(3)})`);
      const bounce = await page.evaluate(async () => {
        const c = CurioRig.current();
        ["sad"].forEach((f) => c.set("feelingFaceLens." + f, "not at all"));
        c.set("feelingFaceLens.happy", "very");
        let most = 0;
        const t0 = performance.now();
        while (performance.now() - t0 < 1200) {
          most = Math.max(most, CurioRigFaces.state(c.ctx).bounce);
          await new Promise((r) => requestAnimationFrame(r));
        }
        return most;
      });
      ok(bounce > 0.005, `happy bounces (${bounce.toFixed(3)} up)`);
      await page.click('.rig-dlg [data-faces="faceBody"]');
      await feel(page, { sad: "very" });
      const y2 = await headY();
      ok(Math.abs(y2 - y0) < Math.abs(y1 - y0) / 2, `with "The body joins in" off, only the face changes (head ${y2.toFixed(3)})`);
      await page.click('.rig-dlg [data-faces="faceBody"]');

      /* made from words: the maker's own eyes give way */
      await load("made");
      const made = await feel(page, { happy: "very" });
      ok(made.drawn && made.hiddenMaker === 2 && !made.makerEyesShown, `a made-from-words character: the maker's two eyes are hidden while this face is drawn (${made.hiddenMaker} hidden)`);
      for (const f of ["happy", "sad", "angry", "surprised"]) {
        await feel(page, { [f]: "very" });
        await shot("faces-" + f);
      }
      await page.click('.rig-dlg [data-faces="faceDraw"]');
      await page.waitForTimeout(200);
      const off = await page.evaluate(() => CurioRigFaces.state(CurioRig.current().ctx));
      ok(!off.visible && off.makerEyesShown, "Show a face off: the drawn face goes and the maker's eyes come back");
      await page.click('.rig-dlg [data-faces="faceDraw"]');

      /* objects and animals get a face too */
      for (const id of ["fox", "desk-lamp"]) {
        await load(id);
        const s = await feel(page, { happy: "very" });
        ok(s.drawn && s.cornerLift > 0, `the ${id} gets a face that smiles`);
      }

      /* blend shapes: a character with its own face shapes is moved through them */
      const morph = await page.evaluate(async () => {
        const c = CurioRig.current();
        const ctx = c.ctx;
        const T = ctx.THREE;
        const g = new T.BoxGeometry(0.1, 0.1, 0.1);
        const base = g.attributes.position;
        g.morphAttributes.position = ["mouthSmile", "eyeBlinkLeft", "jawOpen", "browInnerUp"].map((n) => {
          const a = base.clone();
          a.name = n;
          return a;
        });
        const m = new T.Mesh(g, new T.MeshStandardMaterial({ morphTargets: true }));
        m.updateMorphTargets();
        ctx.rig.head.add(m);
        const ext = CurioRig.extensions().find((x) => x.id === "faces");
        ext.built(ctx);
        c.set("feelingFaceLens.happy", "very");
        c.set("feelingFaceLens.surprised", "a little");
        await new Promise((r) => setTimeout(r, 700));
        const d = m.morphTargetDictionary;
        const inf = m.morphTargetInfluences;
        const s = CurioRigFaces.state(ctx);
        CurioRigFaces.blink(ctx);
        let blink = 0;
        for (let i = 0; i < 20; i++) {
          await new Promise((r) => requestAnimationFrame(r));
          blink = Math.max(blink, inf[d.eyeBlinkLeft]);
        }
        return { smile: inf[d.mouthSmile], open: inf[d.jawOpen], brow: inf[d.browInnerUp], blink, morphs: s.morphs, pending: ctx.data("faces").pending };
      });
      ok(morph.morphs === 1 && morph.smile > 0.5 && morph.open > 0.1 && morph.brow > 0.1 && !morph.pending, `blend shapes named smile, jaw open and brow up are used (${morph.smile.toFixed(2)}, ${morph.open.toFixed(2)}, ${morph.brow.toFixed(2)}), with no drawn face`);
      ok(morph.blink > 0.4, `and the blink shape blinks (${morph.blink.toFixed(2)})`);
      await page.evaluate(() => {
        window.__faceCam = false;
        document.querySelector(".rig-dlg").close();
      });
    }

    /* On the Screen: the film's feelings at the playhead drive the face */
    await page.goto(base + "index.html?screen=1");
    await page.evaluate(() => {
      localStorage.removeItem("curiosities-rig3d-screen-view-v1");
      localStorage.removeItem("curiosities-rig3d-cast-v1");
      localStorage.removeItem("curiosities-rig3d-v1");
    });
    await page.reload();
    await page.waitForFunction(() => window.CurioScreen && window.CurioScreen.isOpen() && window.CurioRigScreen && document.querySelector('[data-panel="rig3d"] [data-r3s="toggle"]'), null, { timeout: 15000 });
    await page.evaluate(() => window.CurioScreen.setRow(0));
    await page.click('[data-panel="rig3d"] [data-r3s="toggle"]');
    await page.waitForFunction(() => window.CurioRigScreen.controller() && document.querySelector('[data-panel="rig3d"] canvas'));
    await page.evaluate(() => window.CurioRigScreen.controller().ready);
    if (!(await page.evaluate(() => window.CurioRigScreen.controller().error()))) {
      const wrote = await page.evaluate(() => {
        const E = window.CurioEngine;
        const st = E.state();
        const who = window.CurioRigScreen.shown();
        const cmds = [];
        const lane = (id, values) => {
          let track = who && st.tracks.find((t) => t.id === who) ? who : (st.tracks.find((t) => t.curiosities.includes(id)) || {}).id;
          if (!track) track = window.CurioLanes.trackFor(id, st);
          if (!st.tracks.find((t) => t.id === track).curiosities.includes(id)) cmds.push({ type: "addCuriosity", track, curiosity: id });
          Object.keys(values).forEach((j) => cmds.push({ type: "setPoint", row: st.rows[j].id, track, curiosity: id, value: values[j] }));
          return track;
        };
        const t = lane("emotion", { 0: "joyful", 2: "melancholy" });
        lane("emotionIntensity", { 0: 5, 2: 5 });
        const r = E.send({ type: "batch", label: "Feelings for the test", commands: cmds });
        return { ok: r.ok, error: r.error, track: t, who };
      });
      ok(wrote.ok, `Emotion lanes are written on ${wrote.track} (shown: ${wrote.who})` + (wrote.ok ? "" : ": " + wrote.error));
      const at = async (row) => {
        await page.evaluate((row) => window.CurioScreen.setRow(row), row);
        await page.waitForTimeout(900);
        return page.evaluate(() => {
          const ctx = window.CurioRigScreen.controller().ctx;
          return Object.assign(CurioRigFaces.state(ctx), { now: (ctx.el.querySelector('[data-faces="now"]') || {}).textContent || "" });
        });
      };
      const joy = await at(0);
      const low = await at(2);
      ok(joy.film && joy.w.happy > 0.6 && joy.cornerLift > 0, `at a joyful moment the face smiles (${joy.film && joy.film.said}; happy ${joy.w.happy && joy.w.happy.toFixed(2)})`);
      ok(low.film && low.w.sad > 0.6 && low.cornerLift < 0, `moving the playhead to a melancholy moment turns the mouth down (${low.film && low.film.said}; sad ${low.w.sad && low.w.sad.toFixed(2)})`);
      /* a Face and feelings lane on the character: read like any other 3D lane */
      const fl = await page.evaluate(() => {
        const E = window.CurioEngine;
        const st = E.state();
        const id = "feelingFaceLens.angry";
        const who = window.CurioRigScreen.shown();
        let track = who || (st.tracks.find((t) => t.curiosities.includes(id)) || {}).id || window.CurioLanes.trackFor(id, st);
        const cmds = [];
        if (!st.tracks.find((t) => t.id === track).curiosities.includes(id)) cmds.push({ type: "addCuriosity", track, curiosity: id });
        cmds.push({ type: "setPoint", row: st.rows[1].id, track, curiosity: id, value: "very" });
        return E.send({ type: "batch", label: "Angry for the test", commands: cmds }).ok;
      });
      const mad = await at(1);
      const lane = await page.evaluate(() => window.CurioRigScreen.controller().timeline()["feelingFaceLens.angry"]);
      ok(fl && lane === 1 && mad.w.angry > 0.9 && mad.browTilt[1] > 0, `a Face and feelings lane ("Angry: very") drives the face at the playhead (timeline ${lane}, angry ${mad.w.angry && mad.w.angry.toFixed(2)})`);
      await page.click('[data-panel="rig3d"] [data-r3s="toggle"]');
    } else ok(!THREE_FILE, "the Screen's 3D view needs three.js");
    ok(!errors.length, "no page errors" + (errors.length ? ": " + errors.slice(0, 4).join(" | ") : ""));
  } catch (e) {
    ok(false, "ran to the end: " + ((e && e.stack) || e));
  } finally {
    await browser.close();
    server.close();
  }
  console.log(failed ? `${failed} failed` : "all passed");
  process.exit(failed ? 1 : 0);
})();
