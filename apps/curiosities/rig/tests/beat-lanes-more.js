/* More of a beat on the timeline (rig/scene.js toTimeline, followed by rig/staging.js, rig/sets.js and rig/camera.js
   on the Screen), in a real browser inside the real app:
   node apps/curiosities/rig/tests/beat-lanes-more.js [--three three.min.js] [--shots dir]
   (needs Playwright and Chromium; --three serves a local three.js r128 for the cdnjs address).

   Checks: the Eyelines slider is keyed and read on the catalog's eyeline.setting lane (the bare eyeline is only
   off or on); "Ida and Nessa stand far apart at a diner. Ida walks over to Nessa, sits. Close-up on Ida. Ida
   smiles." is read as a walk, then a sit, then a smile with a close-up on Ida, and lanesOf gives How they stand
   together (standoff), Walks to, Sitting or standing and Who it frames; put on the timeline these land on the
   right tracks with the right words ("the second character" is the second character track) as one undo step;
   pressing the Screen's own Play stages everyone on their marks, walks Ida over to Nessa, seats her in the
   diner, and the camera's close-up frames Ida, all from the lanes (scene.js's own player never runs); a Who it
   frames node on the second character frames Nessa; going back to the start puts everyone on their marks
   again. No page errors. Screenshots go to --shots (default /mnt/project-files/maya-app/3d-characters when it
   exists) as lanes-more-*.png. */
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
const shot = async (page, name) => SHOTS && (fs.mkdirSync(SHOTS, { recursive: true }), await page.screenshot({ path: path.join(SHOTS, name + ".png") }));

(async () => {
  const server = await serve();
  const base = `http://127.0.0.1:${server.address().port}/`;
  const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--ignore-gpu-blocklist"] });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, serviceWorkers: "block" });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => m.type() === "error" && !/Failed to load resource|three|cdnjs|fonts\.g|WebGL|GPU stall/.test(m.text()) && errors.push(m.text()));
  if (THREE_FILE) await page.route("**/cdnjs.cloudflare.com/**", (r) => r.fulfill({ path: THREE_FILE, contentType: "text/javascript" }));
  await page.route("**/fonts.g*/**", (r) => r.abort());
  const BEAT = "Ida (spiky red hair, overalls) and Nessa (curly black hair, yellow hoodie) stand far apart at a diner. Ida walks over to Nessa, sits. Close-up on Ida. Ida smiles.";
  try {
    await page.goto(base + "index.html?screen=1");
    await page.evaluate(() => {
      ["curiosities-rig3d-screen-view-v1", "curiosities-rig3d-cast-v1", "curiosities-rig3d-v1", "curiosities-rig3d-beat-v1", "curiosities-rig3d-made-v1", "curiosities-rig3d-sets-v1"].forEach((k) => localStorage.removeItem(k));
    });
    await page.reload();
    /* the 3D files load on first use (rig/load.js): fetch them before using the add-ons */
    await page.waitForFunction(() => window.CurioRig && window.CurioRig.load, null, { timeout: 15000 });
    await page.evaluate(() => CurioRig.load());
    await page.waitForFunction(() => window.CurioScreen && window.CurioScreen.isOpen() && window.CurioRigScreen && window.CurioRigScene && window.CurioEngine && window.CurioRigStaging && document.querySelector('[data-panel="rig3d"] [data-r3s="toggle"]'), null, { timeout: 15000 });

    /* ---------- Eyelines: on the catalog's eyeline.setting lane ---------- */
    const eye = await page.evaluate(() => {
      const s = CurioRig.SLIDERS.find((x) => x.id === "eyeline");
      const Sc = window.CurioScale;
      return { lane: s && s.lane, bare: Sc.domain("eyeline").options, words: s.scale.map((w) => Sc.fix(s.lane, w)), other: ["blocking.together", "blocking.seated", "characterPath.to", "shotSize.who"].map((id) => [id, Sc.known(id), Sc.domain(id).options.length, Sc.label(id)]) };
    });
    ok(eye.lane === "eyeline.setting" && eye.words.join() === "no one meets,glances,one holds the look,both hold", `Eyelines is keyed on eyeline.setting, every word fits it (${eye.words}; the bare eyeline is only ${eye.bare})`);
    ok(eye.other.every((x) => x[1] && x[2] >= 2), `the new lanes are curiosity sliders the engine knows (${eye.other.map((x) => x[3]).join("; ")})`);

    /* ---------- reading the beat ---------- */
    const rd = await page.evaluate((BEAT) => {
      const B = window.CurioRigScene;
      const p = B.read(BEAT);
      const L = B.lanesOf(p);
      return { names: p.cast.map((c) => c.name), preset: p.preset, steps: p.steps.map((s) => ({ who: s.who, walk: s.walk && s.walk.where, sit: s.sit, feel: s.feel.map((f) => f[0]).join() })), sitFirst: p.sitFirst, setText: p.setText, ida: L.chars[0].lanes, nessa: L.chars[1].lanes, film: L.film, camera: L.camera, n: L.n };
    }, BEAT);
    ok(rd.names.join() === "Ida,Nessa" && rd.preset === "standoff", `two people, far apart: a standoff (${rd.names}, ${rd.preset})`);
    ok(rd.steps.length === 3 && rd.steps[0].walk === "Nessa" && rd.steps[1].sit && rd.steps[1].who.join() === "0" && rd.steps[2].feel === "happy", `moments: Ida walks to Nessa, Ida sits, Ida smiles (${JSON.stringify(rd.steps)})`);
    ok(rd.sitFirst.length === 0 && /diner/.test(rd.setText) && /sitting/.test(rd.setText), `nobody sits at the start; the set is a diner with seats (${rd.setText})`);
    ok(rd.ida["characterPath.to"].join() === "@1,stays put,stays put" && !rd.nessa["characterPath.to"].some((v) => v !== "stays put"), `Walks to: Ida to Nessa at the first moment (${rd.ida["characterPath.to"]})`);
    ok(rd.ida["blocking.seated"].join() === "standing,sitting,sitting" && rd.nessa["blocking.seated"].join() === "standing,standing,standing", `Sitting or standing: Ida sits from the second moment, Nessa stands (${rd.ida["blocking.seated"]} / ${rd.nessa["blocking.seated"]})`);
    ok(rd.film["blocking.together"] && rd.film["blocking.together"][0] === "standoff", `How they stand together: standoff (${JSON.stringify(rd.film["blocking.together"])})`);
    ok(rd.camera.shotSize && rd.camera.shotSize[0] === "wide" && rd.camera.shotSize[2] === "close" && rd.camera["shotSize.who"] && rd.camera["shotSize.who"][0] === "whoever is shown" && rd.camera["shotSize.who"][2] === "@0", `Who it frames: the close-up is on Ida (${JSON.stringify(rd.camera)})`);
    const rd2 = await page.evaluate(() => {
      const B = window.CurioRigScene;
      const p = B.read("Ida (red hair) and Nessa (black hair) sit side by side. Nessa says something. Ida stands up. Over Nessa's shoulder, Ida shrugs. Nessa walks to the middle.");
      const L = B.lanesOf(p);
      return { preset: p.preset, first: p.sitFirst, ida: L.chars[0].lanes["blocking.seated"], nessa: L.chars[1].lanes["blocking.seated"], walk: L.chars[1].lanes["characterPath.to"], who: L.camera["shotSize.who"], together: L.film["blocking.together"] };
    });
    ok(rd2.preset === "side by side" && rd2.first.join() === "0,1" && rd2.ida.join() === "sitting,standing,standing,standing" && rd2.nessa.every((v) => v === "sitting"), `sitting from the start, then "Ida stands up" is a moment of its own (${rd2.ida} / ${rd2.nessa})`);
    ok(rd2.walk[3] === "the middle" && rd2.who && rd2.who[2] === "@0", `"walks to the middle", and "over Nessa's shoulder" frames Ida (${rd2.walk}; ${JSON.stringify(rd2.who)})`);

    /* ---------- on the timeline ---------- */
    const pre = await page.evaluate(() => {
      const E = window.CurioEngine;
      const st = E.state();
      const cmds = st.tracks.filter((t) => t.kind === "character").map((t) => ({ type: "removeTrack", track: t.id }));
      for (let i = st.rows.length; i < 10; i++) cmds.push({ type: "addRow" });
      if (cmds.length) E.send({ type: "batch", label: "Test: a clean cast", commands: cmds });
      window.CurioScreen.setRow(1);
      return { print: E.fingerprint(), undo: E.history().undo.length };
    });
    const put = await page.evaluate((BEAT) => window.CurioRigScene.toTimeline(BEAT), BEAT);
    ok(put.ok && put.from === 1 && put.to === 3, `the beat goes on the timeline at moments 2 to 4 (${put.ok ? put.said : put.error})`);
    const lanes = await page.evaluate((put) => {
      const E = window.CurioEngine;
      const st = E.state();
      const at = (track, id) => put.rows.map((r) => {
        try {
          return E.value(r, track, id);
        } catch (e) {
          return "?";
        }
      });
      const film = (id) => {
        const t = st.tracks.find((x) => x.curiosities.includes(id) && st.lanes[x.id + "|" + id]);
        return t ? { kind: t.kind, v: at(t.id, id) } : null;
      };
      return {
        order: st.tracks.filter((t) => t.kind === "character").map((t) => t.label),
        idaWalk: at(put.tracks.Ida, "characterPath.to"),
        nessaWalk: at(put.tracks.Nessa, "characterPath.to"),
        idaSeat: at(put.tracks.Ida, "blocking.seated"),
        nessaSeat: at(put.tracks.Nessa, "blocking.seated"),
        together: film("blocking.together"),
        frames: film("shotSize.who"),
        shot: film("shotSize"),
        undo: E.history().undo.length,
      };
    }, put);
    ok(lanes.order.join() === "Ida,Nessa" && lanes.idaWalk.join() === "the second character,stays put,stays put" && lanes.nessaWalk.every((v) => v === "stays put"), `Walks to on Ida's track: the second character (Nessa's track) (${lanes.idaWalk})`);
    ok(lanes.idaSeat.join() === "standing,sitting,sitting" && lanes.nessaSeat.join() === "standing,standing,standing", `Sitting or standing on each track (${lanes.idaSeat} / ${lanes.nessaSeat})`);
    ok(lanes.together && lanes.together.kind !== "character" && lanes.together.v[0] === "standoff", `How they stand together on the film's track (${JSON.stringify(lanes.together)})`);
    ok(lanes.frames && lanes.frames.kind === "camera" && lanes.frames.v.join() === "whoever is shown,whoever is shown,the first character" && lanes.shot.v.join() === "wide,wide,close", `Who it frames on the camera track: the first character (Ida) for the close-up (${lanes.frames && lanes.frames.v}; ${lanes.shot && lanes.shot.v})`);
    ok(lanes.undo === pre.undo + 1, "all of it is one undo step");

    /* ---------- the Screen plays it from the lanes ---------- */
    await page.evaluate(() => {
      window.CurioScreen.setRow(0);
      const st = window.CurioEngine.state();
      const ida = st.tracks.find((t) => t.label === "Ida");
      if (window.CharacterScreen && window.CharacterScreen.pick) window.CharacterScreen.pick(ida.id);
    });
    await page.evaluate(() => window.CurioRigScreen.open(true));
    await page.waitForFunction(() => window.CurioRigScreen.controller() && document.querySelector('[data-panel="rig3d"] canvas'));
    await page.evaluate(() => window.CurioRigScreen.controller().ready);
    const err3 = await page.evaluate(() => window.CurioRigScreen.controller().error());
    if (!THREE_FILE && err3) ok(/three\.js/.test(err3), "without three.js the 3D part is skipped (" + err3 + ")");
    else {
      await page.waitForFunction(() => {
        const s = CurioRigStaging.state(window.CurioRigScreen.controller());
        return s && s.actors.length === 2 && s.actors.every((a) => a.loaded);
      }, null, { timeout: 20000 });
      await page.waitForTimeout(500);
      const start = await page.evaluate(() => {
        const s = CurioRigStaging.state(window.CurioRigScreen.controller());
        return { names: s.actors.map((a) => a.name), preset: s.preset, gap: Math.hypot(s.actors[0].x - s.actors[1].x, s.actors[0].z - s.actors[1].z) };
      });
      ok(start.names.join() === "Ida,Nessa" && start.preset === "standoff" && start.gap > 3, `at the start: Ida and Nessa on their standoff marks, far apart (${start.preset}, ${start.gap.toFixed(2)} m)`);
      await page.evaluate(() => document.querySelector('[data-act="play"]').click());
      const seen = await page.evaluate(
        () =>
          new Promise((done) => {
            const ctl = window.CurioRigScreen.controller();
            const out = [];
            const t0 = performance.now();
            const iv = setInterval(() => {
              const s = CurioRigStaging.state(ctl);
              const sets = window.CurioRigSets.state(ctl.ctx);
              const cam = window.CurioRigCamera.info() || {};
              const a = s.actors;
              out.push({ t: Math.round(performance.now() - t0), row: window.CurioScreen.row(), walking: a[0].walking, arrived: a[0].arrived, gap: +Math.hypot(a[0].x - a[1].x, a[0].z - a[1].z).toFixed(2), sitters: s.sitters, subject: s.subject, place: sets.place || "", idaSits: (sets.seats || []).some((x) => x.i === 0 && x.sitting), nessaSits: (sets.seats || []).some((x) => x.i === 1 && x.sitting), on: cam.on, follow: cam.follow, scene: window.CurioRigScene.state(ctl.ctx).plays });
              if (performance.now() - t0 > 8500) {
                clearInterval(iv);
                done(out);
              }
            }, 100);
          })
      );
      await page.evaluate(() => document.querySelector('[data-act="play"]').click());
      const atRow = (r) => seen.filter((x) => x.row === r);
      ok(atRow(1).some((x) => x.walking), `at moment 2 Ida walks (${JSON.stringify(atRow(1).slice(-1)[0])})`);
      const end = seen[seen.length - 1];
      ok(seen.some((x) => x.arrived > 0) && end.gap < 1.5, `Ida walked over to Nessa and stopped at talking distance (${end.gap} m)`);
      ok(atRow(2).some((x) => x.sitters && x.sitters.join() === "0") && seen.some((x) => x.idaSits) && !seen.some((x) => x.nessaSits), `from moment 3 Ida sits on a seat of the diner, Nessa stands (${JSON.stringify(end)})`);
      ok(seen.some((x) => x.row >= 3 && x.subject === 0 && x.follow), `from moment 4 the close-up frames Ida, actor 1 (${JSON.stringify(atRow(3).slice(-1)[0])})`);
      ok(seen.every((x) => x.scene === 0), "scene.js's own player never ran: the walk, the sitting and the camera came from the lanes");

      /* Who it frames on the second character: the close-up is on Nessa */
      await page.evaluate((put) => {
        const E = window.CurioEngine;
        const st = E.state();
        const cam = st.tracks.find((t) => t.curiosities.includes("shotSize.who"));
        E.send({ type: "setPoint", row: put.rows[2], track: cam.id, curiosity: "shotSize.who", value: "the second character" });
        window.CurioScreen.setRow(3);
      }, put);
      await page.waitForTimeout(900);
      const nessa = await page.evaluate(() => {
        const ctl = window.CurioRigScreen.controller();
        const s = CurioRigStaging.state(ctl);
        const cam = window.CurioRigCamera.info();
        const head = s.actors[1].headAt;
        return { subject: s.subject, on: cam.on, d: Math.hypot(cam.want[0] - head[0], cam.want[2] - head[2]) };
      });
      ok(nessa.subject === 1 && nessa.on === "Nessa" && nessa.d < 0.4, `"the second character" frames Nessa: the close-up is on her head (${JSON.stringify(nessa)})`);
      await page.evaluate(() => window.CurioEngine.undo());

      /* Eyelines from the lane: no one meets */
      const eyeNow = await page.evaluate((put) => {
        const E = window.CurioEngine;
        E.send({ type: "batch", label: "Test: eyelines", commands: [{ type: "addCuriosity", track: put.tracks.Ida, curiosity: "eyeline.setting" }, { type: "setPoint", row: put.rows[2], track: put.tracks.Ida, curiosity: "eyeline.setting", value: "no one meets" }] });
        window.CurioScreen.setRow(3);
        return new Promise((done) => setTimeout(() => {
          const ctl = window.CurioRigScreen.controller();
          done({ word: CurioRigStaging.state(ctl).eyeline, tl: ctl.timeline().eyeline });
        }, 400));
      }, put);
      ok(eyeNow.word === "no one meets" && eyeNow.tl === 0, `Eyelines follows its lane on the Screen (${JSON.stringify(eyeNow)})`);
      await page.evaluate(() => window.CurioEngine.undo());

      /* back to the start: everyone on their marks again */
      await page.evaluate(() => window.CurioScreen.setRow(0));
      await page.waitForTimeout(600);
      const back = await page.evaluate(() => {
        const s = CurioRigStaging.state(window.CurioRigScreen.controller());
        return { gap: Math.hypot(s.actors[0].x - s.actors[1].x, s.actors[0].z - s.actors[1].z), off: s.actors.some((a) => a.offMark), sitters: s.sitters };
      });
      ok(back.gap > 3 && !back.off && back.sitters.length === 0, `going back to the start puts them on their marks, standing (${back.gap.toFixed(2)} m)`);

      /* ---------- pictures: walk over, sit, close-up on Ida ---------- */
      if (SHOTS) {
        await page.click('[data-view="arrange"]').catch(() => {});
        await page.waitForTimeout(200);
        const cb = await page.$('[data-act="viewers-in-arrange"]');
        if (cb && !(await cb.isChecked())) await cb.click();
        await page.evaluate(() => window.CurioScreen.setRow(1));
        await page.waitForTimeout(2000);
        await shot(page, "lanes-more-walk");
        await page.evaluate(() => window.CurioScreen.setRow(2));
        await page.waitForTimeout(4000);
        await page.evaluate(() => window.CurioScreen.setRow(3));
        await page.waitForTimeout(1500);
        /* the 3D view by itself too: Ida seated in the diner, the close-up on her */
        const cv = await page.$('[data-panel="rig3d"] canvas');
        if (cv) await cv.screenshot({ path: path.join(SHOTS, "lanes-more-closeup-3d.png") });
        await shot(page, "lanes-more-closeup");
      }
    }
    ok(!errors.length, "no page errors" + (errors.length ? ": " + errors.slice(0, 4).join(" | ") : ""));
  } catch (e) {
    ok(false, "ran to the end: " + ((e && e.stack) || e));
  } finally {
    await browser.close();
    server.close();
  }
  console.log(failed ? failed + " failed" : "all passed");
  process.exit(failed ? 1 : 0);
})();
