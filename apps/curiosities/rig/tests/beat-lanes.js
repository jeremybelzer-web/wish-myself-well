/* "Put this beat on the timeline" (rig/scene.js toTimeline) in a real browser, inside the real app:
   node apps/curiosities/rig/tests/beat-lanes.js [--three three.min.js] [--shots dir]
   (needs Playwright and Chromium; --three serves a local three.js r128 for the cdnjs address).

   Checks: camera words ("wide shot", "close-up on Ida", "over Nessa's shoulder", "low angle", "the camera pushes
   in") are read as camera.js's lenses and are not taken for names; the diner example, put on the timeline at the
   playhead, keys lanes for both characters at the right moments (Ida's double take and feelings, Nessa speaking,
   how far apart, where it happens and when) as one undo step, and one undo removes all of it; playing the Screen
   (its own Play button) through the beat, with the 3D actors panel open, plays Ida's double take, her surprised
   then happy face and Nessa speaking from the lanes alone (scene.js's own player never runs), and builds the
   diner at night; the Momentum engine reads the keyed beat as attention cues; camera words key the camera's lanes
   and the 3D view follows them. No page errors. Screenshots (the Screen with the beat's lanes and the 3D view
   mid double take) go to --shots (default /mnt/project-files/maya-app/3d-characters when it exists) as
   beat-lanes-*.png. */
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
  try {
    await page.goto(base + "index.html?screen=1");
    await page.evaluate(() => {
      ["curiosities-rig3d-screen-view-v1", "curiosities-rig3d-cast-v1", "curiosities-rig3d-v1", "curiosities-rig3d-beat-v1", "curiosities-rig3d-made-v1", "curiosities-rig3d-sets-v1"].forEach((k) => localStorage.removeItem(k));
    });
    await page.reload();
    await page.waitForFunction(() => window.CurioScreen && window.CurioScreen.isOpen() && window.CurioRigScreen && window.CurioRigScene && window.CurioEngine && document.querySelector('[data-panel="rig3d"] [data-r3s="toggle"]'), null, { timeout: 15000 });

    /* ---------- camera words ---------- */
    const cam = await page.evaluate(() => {
      const B = window.CurioRigScene;
      const a = B.read("Ida (red hair) and Nessa (black hair) stand. Wide shot. Nessa waves. The camera pushes in. Ida shrugs. Low angle, close-up on Ida. Ida laughs.");
      const b = B.read("Over Nessa's shoulder: Ida (red hair) talks to Nessa (black hair). Dutch angle. Nessa gasps.");
      const c = B.read("Ida (red hair) sits next to Nessa (black hair). Nessa shrugs. Then the camera pulls back to a wide shot, high angle, long lens.");
      return {
        a: { names: a.cast.map((x) => x.name), steps: a.steps.length, camera: a.camera, ign: a.ignored, on: a.steps[2] && a.steps[2].cam && a.steps[2].cam.on, lanes: B.lanesOf(a).camera },
        b: { names: b.cast.map((x) => x.name), camera: b.camera, over: b.steps[0] && b.steps[0].cam && b.steps[0].cam.over },
        c: { names: c.cast.map((x) => x.name), camera: c.camera, steps: c.steps.map((s) => s.text) },
      };
    });
    ok(cam.a.names.join() === "Ida,Nessa" && cam.b.names.join() === "Ida,Nessa" && cam.c.names.join() === "Ida,Nessa", `camera words are not taken for names (${cam.a.names}, ${cam.b.names}, ${cam.c.names})`);
    ok(cam.a.steps === 3 && cam.a.camera[0].shotSize === "wide" && cam.a.camera[1].shotSize === "medium" && cam.a.camera[1].cameraMove === "push in" && cam.a.camera[2].shotSize === "close" && cam.a.camera[2].angleHeight === "low" && cam.a.on === 0, `"wide shot", "the camera pushes in", "low angle, close-up on Ida" go with the next step (${JSON.stringify(cam.a.camera)})`);
    ok(cam.a.lanes.shotSize[0] === "wide" && cam.a.lanes.angleHeight[0] === "eye" && cam.a.lanes.angleHeight[2] === "low" && cam.a.lanes.cameraMove[2] === "none", `the camera lanes start from a plain shot and the push stops after its moment (${JSON.stringify(cam.a.lanes)})`);
    ok(cam.b.camera[0] && cam.b.camera[0].shotSize === "medium" && cam.b.over === 1 && cam.b.camera.some((x) => x && x.dutch === "tilted"), `"over Nessa's shoulder" is a medium shot past Nessa, "dutch angle" tilts (${JSON.stringify(cam.b.camera)})`);
    const lastC = cam.c.camera[cam.c.camera.length - 1] || {};
    ok(lastC.shotSize === "wide" && lastC.angleHeight === "high" && lastC.lensLength === "long" && lastC.cameraMove === "pull out", `camera words after the last action get a moment of their own (${JSON.stringify(cam.c.camera)})`);

    ok(await page.evaluate(() => /data-scene="lanes"[^>]*>Put this beat on the timeline/.test(CurioRig.extensions().find((x) => x.id === "scene").panel({ prefs: {} }))), "the 3D window's Make a whole scene from words has Put this beat on the timeline");

    /* ---------- the diner example on the timeline ---------- */
    const pre = await page.evaluate(() => {
      const E = window.CurioEngine;
      /* a clean cast: no other character tracks, and room after the playhead */
      const st = E.state();
      const cmds = st.tracks.filter((t) => t.kind === "character").map((t) => ({ type: "removeTrack", track: t.id }));
      for (let i = st.rows.length; i < 10; i++) cmds.push({ type: "addRow" });
      if (cmds.length) E.send({ type: "batch", label: "Test: a clean cast", commands: cmds });
      window.CurioScreen.setRow(1);
      return { print: E.fingerprint(), undo: E.history().undo.length, rows: E.state().rows.length };
    });
    const put = await page.evaluate(() => window.CurioRigScene.toTimeline(window.CurioRigScene.EXAMPLE));
    ok(put.ok && put.from === 1 && put.to === 3, `the diner beat goes on the timeline at the playhead, one moment per step (${put.ok ? put.said : put.error})`);
    const lanes = await page.evaluate((put) => {
      const E = window.CurioEngine;
      const st = E.state();
      const ida = put.tracks.Ida;
      const nessa = put.tracks.Nessa;
      const at = (track, id) => put.rows.map((r) => {
        try {
          return E.value(r, track, id);
        } catch (e) {
          return "?";
        }
      });
      const film = (id) => {
        const t = st.tracks.find((x) => x.curiosities.includes(id) && st.lanes[x.id + "|" + id]);
        return t ? E.value(put.rows[0], t.id, id) : null;
      };
      const tod = st.tracks.some((t) => t.curiosities.includes("timeOfDay") && st.lanes[t.id + "|timeOfDay"]) ? "timeOfDay" : "timeOfDay.setting";
      return {
        kinds: [ida, nessa].map((id) => (st.tracks.find((t) => t.id === id) || {}).kind),
        idaMove: at(ida, "actingLens.move"),
        idaCue: at(ida, "actingLens.cue"),
        nessaMove: at(nessa, "actingLens.move"),
        idaSurprised: at(ida, "feelingFaceLens.surprised"),
        idaHappy: at(ida, "feelingFaceLens.happy"),
        nessaHappy: at(nessa, "feelingFaceLens.happy"),
        speaking: [at(ida, "eyeline.speaking"), at(nessa, "eyeline.speaking")],
        place: film("setting.place"),
        time: film(tod),
        distance: film("blocking.distance"),
        mode: st.lanes[ida + "|actingLens.move"] && st.lanes[ida + "|actingLens.move"].mode,
        undo: E.history().undo.length,
        label: E.history().undo.slice(-1)[0],
      };
    }, put);
    ok(lanes.kinds.join() === "character,character", "Ida and Nessa each get a character track");
    ok(lanes.idaMove.join() === "none,double take,none" && lanes.idaCue.join() === "wait,go,wait" && lanes.nessaMove.join() === "none,none,none", `the acting move lands on Ida's track at moment 3, with Play it on go there (${lanes.idaMove} / ${lanes.idaCue}; Nessa ${lanes.nessaMove})`);
    ok(lanes.idaSurprised.join() === "not at all,clearly,not at all" && lanes.idaHappy.join() === "not at all,not at all,very" && lanes.nessaHappy.join() === "not at all,not at all,not at all", `Ida's feelings: surprised on the double take, then very happy (${lanes.idaSurprised} / ${lanes.idaHappy})`);
    ok(lanes.speaking[1].join() === "speaking,speaking,speaking" && lanes.speaking[0].join() === "listening,listening,listening", `Nessa is the one speaking from her line on (${lanes.speaking[1]})`);
    ok(lanes.place === "a diner" && lanes.time === "night" && lanes.distance === 2, `the film's lanes: where it happens (${lanes.place}), when (${lanes.time}), how far apart (${lanes.distance}: personal)`);
    ok(lanes.mode === "hold" && lanes.undo === pre.undo + 1, `one undo step ("${lanes.label}"), and new lanes hold from node to node`);
    const undone = await page.evaluate((pre) => {
      const E = window.CurioEngine;
      E.undo();
      const st = E.state();
      return { same: E.fingerprint() === pre.print, chars: st.tracks.filter((t) => t.kind === "character").length };
    }, pre);
    ok(undone.same && undone.chars === 0, "one undo removes all of it: the film is exactly as before");
    const put2 = await page.evaluate(() => {
      window.CurioScreen.setRow(1);
      const r = window.CurioRigScene.toTimeline(window.CurioRigScene.EXAMPLE);
      const RS = window.CurioRigScreen;
      if (window.CharacterScreen && window.CharacterScreen.pick) window.CharacterScreen.pick(r.tracks.Ida);
      return Object.assign(r, { casts: [RS.cast(r.tracks.Ida), RS.cast(r.tracks.Nessa)] });
    });
    ok(put2.ok && put2.casts.every((c) => /^made:/.test(c)), `put again; each track is played by its made-from-words character (${put2.casts})`);

    /* ---------- momentum reads the keyed beat ---------- */
    const mom = await page.evaluate((put) => {
      const M = window.CurioMomentumEngine;
      if (!M || !M.reading) return null;
      const rows = window.CurioEngine.state().rows.map((r) => r.id);
      const from = rows.indexOf(put.rows[0]);
      const rd = M.reading();
      const segs = rd.segments.filter((s) => s.beat >= from && s.beat <= from + 2).map((s) => ({ beat: s.beat - from, cur: s.curiosity + (s.slider ? " " + s.slider : ""), family: s.family, cue: s.cue }));
      return segs;
    }, put2);
    if (!mom) ok(true, "the Momentum engine is not on this page (nothing to check)");
    else {
      const hit = mom.find((s) => /actingLens|feelingFaceLens/.test(s.cur));
      ok(!!hit, `the Momentum engine reads the beat as attention cues (${mom.map((s) => `moment ${s.beat + 2}: ${s.cur} (${s.family}, ${s.cue})`).join("; ") || "none"})`);
    }

    /* ---------- playing the Screen through the beat, from the lanes alone ---------- */
    await page.evaluate(() => window.CurioScreen.setRow(0));
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
      const who = await page.evaluate(() => CurioRigStaging.state(window.CurioRigScreen.controller()).actors.map((a) => a.name));
      ok(who.join() === "Ida,Nessa", `the Screen's 3D view shows Ida and Nessa together (${who})`);
      /* press the Screen's own Play and watch */
      const speed = await page.evaluate(() => {
        const b = document.querySelector('.sc-transport [data-act="play"], [data-act="play"]');
        b.click();
        return !!b;
      });
      const seen = await page.evaluate(
        () =>
          new Promise((done) => {
            const ctl = window.CurioRigScreen.controller();
            const out = [];
            const t0 = performance.now();
            const iv = setInterval(() => {
              const s = CurioRigStaging.state(ctl);
              const F = window.CurioRigFaces;
              const face = (c) => {
                const f = F && F.state ? F.state(c) : null;
                return f && f.w ? Object.keys(f.w).filter((k) => f.w[k] > 0.3) : [];
              };
              const sets = window.CurioRigSets.state(ctl.ctx);
              out.push({ row: window.CurioScreen.row(), gIda: s.actors[0].gesture || "", gNessa: s.actors[1].gesture || "", speaker: s.speaker, fIda: face(ctl.ctx), fNessa: face(s.actors[1] && CurioRigStaging.actors(ctl) ? CurioRigStaging.actors(ctl)[1].ctx : null), place: sets.place || "", time: sets.time || "", scene: window.CurioRigScene.state(ctl.ctx).plays });
              if (performance.now() - t0 > 5200) {
                clearInterval(iv);
                done(out);
              }
            }, 100);
          })
      );
      await page.evaluate(() => document.querySelector('[data-act="play"]').click());
      const atRow = (r) => seen.filter((x) => x.row === r);
      const rowsSeen = [...new Set(seen.map((x) => x.row))];
      ok(speed && rowsSeen.includes(1) && rowsSeen.includes(2) && rowsSeen.includes(3), `the Screen played through the beat (moments ${rowsSeen.map((r) => r + 1).join(", ")})`);
      ok(atRow(1).some((x) => x.speaker === 1) && atRow(1).some((x) => x.place === "diner" && x.time === "night"), `at moment 2: Nessa speaks (everyone looks at her) and the diner at night is built (${JSON.stringify(atRow(1).slice(-1)[0])})`);
      ok(atRow(2).some((x) => x.gIda === "double take") && !seen.some((x) => x.gNessa), `at moment 3 Ida does the double take from her lane, and Nessa plays no move (${[...new Set(atRow(2).map((x) => x.gIda))]})`);
      ok(atRow(2).some((x) => x.fIda.includes("surprised")) && atRow(3).some((x) => x.fIda.includes("happy") && !x.fIda.includes("surprised")), `Ida's face: surprised at the double take, then happy (${JSON.stringify(atRow(2).slice(-1)[0].fIda)} then ${JSON.stringify(atRow(3).slice(-1)[0] && atRow(3).slice(-1)[0].fIda)})`);
      ok(seen.every((x) => x.scene === 0), "scene.js's own player never ran: it all came from the lanes");

      /* ---------- camera words key the camera's lanes ---------- */
      /* through the Screen's own box this time: Write a whole beat, Put this beat on the timeline */
      await page.evaluate(() => window.CurioScreen.setRow(5));
      await page.click('[data-panel="rig3d"] [data-r3s="beat-box"] summary');
      await page.fill('[data-panel="rig3d"] [data-r3s="beat"]', "Ida and Nessa stand. Wide shot. Nessa waves. The camera pushes in. Ida shrugs. Low angle, close-up on Ida. Ida laughs.");
      await page.click('[data-panel="rig3d"] [data-r3s="beat-key"]');
      const camSaid = await page.textContent('[data-panel="rig3d"] [data-r3s="said"]');
      const camPut = await page.evaluate(() => {
        const st = window.CurioEngine.state();
        return { ok: true, rows: st.rows.slice(5, 8).map((r) => r.id) };
      });
      ok(/On the timeline at moments 6 to 8/.test(camSaid) && /the camera/.test(camSaid), `the Screen's Write a whole beat box puts it on the timeline (${camSaid.slice(0, 90)}...)`);
      const camLanes = await page.evaluate((put) => {
        const E = window.CurioEngine;
        const st = E.state();
        const lane = (id) => {
          const t = st.tracks.find((x) => x.curiosities.includes(id) && st.lanes[x.id + "|" + id]);
          return t ? { kind: t.kind, v: put.rows.map((r) => E.value(r, t.id, id)) } : null;
        };
        return { shot: lane("shotSize"), angle: lane("angleHeight"), move: lane("cameraMove") };
      }, camPut);
      ok(camPut.ok && camLanes.shot && camLanes.shot.kind === "camera" && camLanes.shot.v.join() === "wide,medium,close" && camLanes.angle.v.join() === "eye,eye,low" && camLanes.move.v.join() === "none,push in,none", `camera words key the camera track's lanes (shot ${camLanes.shot && camLanes.shot.v}; angle ${camLanes.angle && camLanes.angle.v}; move ${camLanes.move && camLanes.move.v})`);
      await page.evaluate(() => window.CurioScreen.setRow(7));
      await page.waitForTimeout(400);
      const camNow = await page.evaluate(() => {
        const tl = window.CurioRigScreen.controller().timeline();
        return { shot: tl.shotSize, angle: tl.angleHeight };
      });
      ok(Math.abs(camNow.shot - 1 / 3) < 0.01 && Math.abs(camNow.angle - 0.25) < 0.01, `the 3D view's camera follows them: close and low at moment 8 (${JSON.stringify(camNow)})`);

      /* ---------- a picture: the Screen with the beat's lanes, the 3D view mid double take ---------- */
      if (SHOTS) {
        /* Arrange, with the player shown: every keyed lane on the timeline under the 3D view */
        await page.click('[data-view="arrange"]');
        await page.waitForTimeout(200);
        const cb = await page.$('[data-act="viewers-in-arrange"]');
        if (cb && !(await cb.isChecked())) await cb.click();
        await page.waitForTimeout(300);
        await page.evaluate(() => {
          window.CurioScreen.setRow(0);
        });
        await page.waitForTimeout(300);
        await page.evaluate(() => window.CurioScreen.setRow(1));
        await page.waitForTimeout(300);
        await page.evaluate(() => window.CurioScreen.setRow(2));
        await page.waitForTimeout(1100);
        await shot(page, "beat-lanes-screen");
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
