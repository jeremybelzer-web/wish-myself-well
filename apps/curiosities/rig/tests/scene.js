/* "Make a whole scene from words" (rig/scene.js) in a real browser:
   node apps/curiosities/rig/tests/scene.js [--three three.min.js] [--shots dir]
   (needs Playwright and Chromium; --three serves a local three.js r128 for the cdnjs address).

   Checks: the add-on and its panel (the box, Play the beat, Send to the storyboard as a flip book) are in the 3D
   window; the words are split into the set, the characters (made or reused by name), the staging, the feelings
   and the moves in order, with a Read as list and what was ignored; a famous name in a look is left out; the
   diner example and 3 other beats build and play to the end (every actor loaded, every move played, the last
   feelings showing); the set keeps clear of every actor, and is laid out again when the staging changes; two
   people sit across one table; the Sketch look (and its outlines) reaches every actor; building 5 scenes leaves
   no WebGL memory behind; a shrug, a sit or a smile after a far walk by the same walker starts after she gets there,
   on the lanes and in the view; the flip book of the beat lands in the storyboard. No page errors. Screenshots (the
   diner mid double take in color and in pencil, the storyboard after the flip book) go to --shots (default
   /mnt/project-files/maya-app/3d-characters when it exists) as scene-*.png. */
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

const OTHERS = [
  "In a kitchen in the morning, Abe (an old man with a gray beard, round glasses, a brown sweater) stands next to Rosa (long black hair, a red apron, jeans). Rosa shrugs. Abe sighs, then waves.",
  "On a country road at sunset, Kit (a cowboy hat, a plaid shirt, jeans and boots) walks over to Juno (pigtails, a yellow dress) and points. Juno gasps and freezes in shock.",
  "In a park, Mario (a red cap, blue overalls, a mustache like Mario) and Tess (short blond hair, a green hoodie) and Lou (a bun, a purple jacket) huddle. Lou whispers. Everyone laughs. It rains a lot.",
];

(async () => {
  const server = await serve();
  const base = `http://127.0.0.1:${server.address().port}/`;
  const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--ignore-gpu-blocklist"] });
  const context = await browser.newContext({ viewport: { width: 1400, height: 950 }, serviceWorkers: "block" });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => (m.type() === "error" || (m.type() === "warning" && /3D add-on|Storyboard/.test(m.text()))) && !/Failed to load resource|three|cdnjs|fonts\.g|WebGL|GPU stall/.test(m.text()) && errors.push(m.text()));
  if (THREE_FILE) await page.route("**/cdnjs.cloudflare.com/**", (r) => r.fulfill({ path: THREE_FILE, contentType: "text/javascript" }));
  await page.route("**/fonts.g*/**", (r) => r.abort());
  const shot = async (name) => {
    if (!SHOTS) return;
    fs.mkdirSync(SHOTS, { recursive: true });
    await page.locator(".rig-dlg .rig-view").screenshot({ path: path.join(SHOTS, name + ".png") });
  };
  const frames = (n) => page.evaluate((n) => new Promise((r) => { const go = () => (n-- > 0 ? requestAnimationFrame(go) : r()); go(); }), n);
  const build = (text) => page.evaluate((t) => CurioRigScene.build(CurioRig.current().ctx, t).then(() => true), text);
  const play = () => page.evaluate(() => CurioRigScene.play(CurioRig.current().ctx));
  const waitDone = () => page.waitForFunction(() => !CurioRigScene.state(CurioRig.current().ctx).playing, null, { timeout: 60000, polling: 200 });
  const mem = () => page.evaluate(() => Object.assign({ programs: (CurioRig.current().ctx.renderer.info.programs || []).length }, CurioRig.current().ctx.renderer.info.memory));
  /* where everyone is, what each is doing, and what the set did */
  const look = () =>
    page.evaluate(() => {
      const ctx = CurioRig.current().ctx;
      const list = CurioRigStaging.actors({ ctx }) || [{ i: 0, name: "one", x: 0, z: 0, yaw: 0, loaded: !!ctx.model, ctx }];
      const set = CurioRigSets.state(ctx);
      const snap = CurioRigSnapshot.state(ctx);
      return {
        actors: list.map((a) => {
          let parts = 0;
          let drawn = 0;
          let hulls = 0;
          if (a.ctx && a.ctx.model)
            a.ctx.model.traverse((o) => {
              if (o.userData.sketchHull) return hulls++;
              if (!o.isMesh || o.userData.faceMade) return;
              parts++;
              if ([].concat(o.material).every((m) => /^sketch /.test(m.name || ""))) drawn++;
              if (o.children.some((k) => k.userData.sketchHull)) hulls += 0;
            });
          const g = CurioRig.gestures.state({ ctx: a.ctx }) || {};
          const v = a.ctx.prefs.values;
          return { i: a.i, name: a.name, x: a.x, z: a.z, loaded: a.loaded, parts, drawn, hulls, played: g.played || 0, playing: g.playing, happy: v["feelingFaceLens.happy"] || 0, surprised: v["feelingFaceLens.surprised"] || 0 };
        }),
        set,
        snap: { look: snap.look, hulls: snap.hulls, wrapped: snap.wrapped },
        scene: (() => {
          const s = CurioRigScene.state(ctx);
          return { report: s.report, plays: s.plays, left: s.left, said: s.said, plan: { cast: s.plan.cast, preset: s.plan.preset, sitters: s.plan.sitters, steps: s.plan.steps.length, setText: s.plan.setText } };
        })(),
      };
    });
  /* every set piece that stands on the floor keeps clear of each actor's spot (seats and the table of the ones
     sitting are theirs); returns the pieces in the way */
  const inTheWay = (L, sitters) => {
    const hits = [];
    const own = new Set(["booth", "chair", "table", "bar stool", "sofa", "bench", "armchair"]);
    L.actors.forEach((a) => {
      L.set.pieces.forEach((p) => {
        if (!p.box || p.flat || p.mount || p.on) return;
        if (sitters.includes(a.i) && own.has(p.kind)) return;
        const [x0, y0, z0, x1, y1, z1] = p.box;
        if (y1 < 0.08 || y0 > 1.6) return;
        const r = 0.16;
        if (a.x + r > x0 && a.x - r < x1 && a.z + r > z0 && a.z - r < z1) hits.push(`${p.kind} on ${a.name}`);
      });
    });
    return hits;
  };
  try {
    await page.goto(base + "index.html?screen=0");
    await page.evaluate(() => {
      ["curiosities-rig3d-made-v1", "curiosities-rig3d-sets-v1", "curiosities-rig3d-v1", "curiosities-storyboard-v1"].forEach((k) => localStorage.removeItem(k));
    });
    await page.reload();
    /* the 3D files load on first use (rig/load.js): fetch them before using the add-ons */
    await page.waitForFunction(() => window.CurioRig && window.CurioRig.load, null, { timeout: 15000 });
    await page.evaluate(() => CurioRig.load());
    await page.waitForFunction(() => window.CurioRig && window.CurioRigScene && window.CuriosityStoryboard && document.querySelector("#lib-menu [data-rig3d]"), null, { timeout: 15000 });
    ok(await page.evaluate(() => CurioRig.extensions().some((x) => x.id === "scene") && typeof CurioRig.maker.remember === "function"), "Make a whole scene from words is part of the 3D view, and the maker keeps characters by name (CurioRig.maker.remember)");

    /* reading the words, before any 3D */
    const r0 = await page.evaluate(() => CurioRigScene.read(CurioRigScene.EXAMPLE));
    ok(r0.cast.map((c) => c.name + "=" + c.look).join("|") === "Ida=spiky red hair, overalls|Nessa=curly black hair, yellow hoodie", "the example: two named characters with their looks (" + r0.cast.map((c) => c.name).join(", ") + ")");
    ok(/diner/.test(r0.setText) && /night/.test(r0.setText) && /sitting/.test(r0.setText) && r0.sitters.join() === "0,1", `the set words are the place, the time and sitting ("${r0.setText}"), and both sit`);
    ok(r0.preset === "face to face", "across from: face to face");
    ok(r0.steps.length === 3 && r0.steps[0].say && r0.steps[0].who.join() === "1" && r0.steps[1].move === "double take" && r0.steps[1].who.join() === "0" && r0.steps[2].feel.some((f) => f[0] === "happy" && f[1] === 1), "in order: Nessa speaks; Ida does a double take; then Ida laughs (very happy)");
    const r3 = await page.evaluate((t) => CurioRigScene.read(t), OTHERS[2]);
    ok(r3.cast.length === 3 && r3.preset === "huddle" && r3.cast[0].look.indexOf("Mario") < 0 && r3.famous.some((f) => f.name === "Mario"), `a famous name in a look is left out (Mario's look: "${r3.cast[0].look}")`);
    ok(r3.ignored.some((x) => /rains/.test(x)), `words it cannot use are listed as ignored (${r3.ignored.join(", ")})`);
    const r2 = await page.evaluate((t) => CurioRigScene.read(t), OTHERS[1]);
    ok(r2.steps[0].walk && r2.steps[0].walk.to === 1 && r2.steps[0].move === "point" && r2.steps.length === 2, "walks over to Juno and points: one walk that ends with the point");

    /* a move after a walk waits for the walk: on the timeline the walk's step lasts as many moments as the walk
       takes (worked out here on its own, from staging.js's marks and its 1.15 m a second), and the shrug starts
       on a moment after they arrive, never at the start of the walk; the lanes stay the same ones */
    const WALKS = [
      "Ida (red hair) and Nessa (black hair) stand far apart. Ida walks over to Nessa and shrugs.",
      "Ida (red hair) and Nessa (black hair) stand far apart. Ida walks over to Nessa, then shrugs.",
      "Ida (red hair) walks over to Nessa (black hair) and shrugs.",
      "Ida (red hair) walks over to Nessa (black hair), then shrugs.",
    ];
    const wk = await page.evaluate((list) => {
      const B = CurioRigScene;
      const St = CurioRigStaging;
      return list.map((t) => {
        const p = B.read(t);
        const L = B.lanesOf(p);
        const ida = L.chars[0].lanes;
        const walkAt = ida["characterPath.to"].indexOf("@1");
        const shrugAt = ida["actingLens.move"].findIndex((v, j) => v === "shrug" && ida["actingLens.cue"][j] === "go");
        const pr = St.PRESETS.find((x) => x.id === (p.preset || "face to face"));
        const scale = St.SLIDERS[0].scale;
        const d = St.meters(scale.indexOf(pr.dist) / (scale.length - 1));
        const m = St.layout(pr.id, 2, d, false);
        const gap = Math.hypot(m[0].x - m[1].x, m[0].z - m[1].z);
        const secs = Math.max(0, gap - Math.min(d, St.meters(scale.indexOf("personal") / (scale.length - 1)))) / 1.15;
        return { preset: p.preset, steps: p.steps.length, n: L.n, walkAt, shrugAt, at: L.steps, arrive: walkAt * L.moment + secs, shrug: shrugAt * L.moment, walks: ida["characterPath.to"].filter((v) => v !== "stays put").length, shrugs: ida["actingLens.move"].filter((v) => v === "shrug").length, ids: Object.keys(ida).sort().join() };
      });
    }, WALKS);
    wk.forEach((w, k) =>
      ok(w.walkAt === 0 && w.shrugAt > w.walkAt && w.shrug >= w.arrive && w.walks === 1 && w.shrugs === 1, `"${WALKS[k].replace(/ \([a-z ]+\)/g, "")}": the walk starts at moment ${w.walkAt + 1}, Ida gets there at ${w.arrive.toFixed(1)} s, the shrug starts at moment ${w.shrugAt + 1} (${w.shrug.toFixed(1)} s), after she arrives (${w.n} moments, ${w.preset || "no staging words"})`)
    );
    ok(wk[0].shrugAt >= 4 && wk[1].shrugAt === wk[0].shrugAt && wk[1].at[1].at === wk[1].shrugAt, `far apart, the walk lasts ${wk[0].shrugAt} moments in both wordings, and "then shrugs" is its own step starting when she arrives`);
    ok(wk.every((w) => w.ids === "actingLens.cue,actingLens.move,characterPath.to"), `the lanes are the same ones (${wk[0].ids})`);

    /* a sit or a feeling after a far walk by the same walker waits too: Ida sits, or smiles, on a moment after she
       gets to Nessa, never while she walks; someone else's feeling does not wait for her walk */
    const AFTER = [
      ["Ida (red hair) and Nessa (black hair) stand far apart. Ida walks over to Nessa and sits.", "sit"],
      ["Ida (red hair) and Nessa (black hair) stand far apart. Ida walks over to Nessa, then sits.", "sit"],
      ["Ida (red hair) and Nessa (black hair) stand far apart. Ida walks over to Nessa and smiles.", "feel"],
      ["Ida (red hair) and Nessa (black hair) stand far apart. Ida walks over to Nessa, then smiles.", "feel"],
      ["Ida (red hair) and Nessa (black hair) stand far apart. Ida walks over to Nessa. Nessa smiles.", "other"],
    ];
    const af = await page.evaluate((list) => {
      const B = CurioRigScene;
      const St = CurioRigStaging;
      return list.map(([t, kind]) => {
        const p = B.read(t);
        const L = B.lanesOf(p);
        const lane = (c, id) => L.chars[c].lanes[id] || [];
        const walkAt = lane(0, "characterPath.to").indexOf("@1");
        const at =
          kind === "sit" ? lane(0, "blocking.seated").indexOf("sitting") : kind === "feel" ? lane(0, "feelingFaceLens.happy").findIndex((v) => v !== "not at all") : lane(1, "feelingFaceLens.happy").findIndex((v) => v !== "not at all");
        const pr = St.PRESETS.find((x) => x.id === (p.preset || "face to face"));
        const scale = St.SLIDERS[0].scale;
        const d = St.meters(scale.indexOf(pr.dist) / (scale.length - 1));
        const m = St.layout(pr.id, 2, d, false);
        const gap = Math.hypot(m[0].x - m[1].x, m[0].z - m[1].z);
        const secs = Math.max(0, gap - Math.min(d, St.meters(scale.indexOf("personal") / (scale.length - 1)))) / 1.15;
        return { kind, n: L.n, walkAt, at, arrive: walkAt * L.moment + secs, start: at * L.moment, before: kind === "sit" ? lane(0, "blocking.seated").slice(0, Math.max(0, at)) : lane(0, "feelingFaceLens.happy").slice(0, Math.max(0, at)), ids: L.chars.map((c) => Object.keys(c.lanes).sort().join()).join(" / ") };
      });
    }, AFTER);
    af.forEach((w, k) => {
      const words = AFTER[k][0].replace(/ \([a-z ]+\)/g, "");
      if (w.kind === "other") ok(w.walkAt === 0 && w.at === 1 && w.n === 2, `"${words}": Nessa's smile does not wait for Ida's walk (moment ${w.at + 1} of ${w.n})`);
      else
        ok(
          w.walkAt === 0 && w.at >= 3 && w.start >= w.arrive && w.before.every((v) => v === (w.kind === "sit" ? "standing" : "not at all")),
          `"${words}": the walk starts at moment ${w.walkAt + 1}, Ida gets there at ${w.arrive.toFixed(1)} s, she ${w.kind === "sit" ? "sits" : "smiles"} from moment ${w.at + 1} (${w.start.toFixed(1)} s), after she arrives (${w.n} moments)`
        );
    });
    ok(af[1].at === af[0].at && af[3].at === af[2].at, `"and sits" and "then sits" land on the same moment (${af[0].at + 1}), as do "and smiles" and "then smiles" (${af[2].at + 1})`);
    ok(af[0].ids === "blocking.seated,characterPath.to / blocking.seated,characterPath.to" && af[2].ids === "characterPath.to,feelingFaceLens.happy / characterPath.to,feelingFaceLens.happy", `the lanes are the same ones (${af[0].ids}; ${af[2].ids})`);

    await page.evaluate(() => document.querySelector("#lib-menu [data-rig3d]").click());
    await page.waitForSelector(".rig-dlg[open] canvas");
    await page.evaluate(() => CurioRig.current().ready);
    const err = await page.evaluate(() => CurioRig.current().error());
    if (!THREE_FILE && err) {
      ok(/three\.js/.test(err), "without three.js the window says it is needed (" + err + ")");
    } else {
      ok(!err, "the 3D view loads" + (err ? ": " + err : ""));
      const panel = await page.evaluate(() => {
        const b = document.querySelector('.rig-dlg [data-ext="scene"]');
        return { box: !!b, text: b ? b.textContent : "", words: b ? b.querySelector('[data-scene="text"]').value : "" };
      });
      ok(panel.box && /Play the beat/.test(panel.text) && /Send to the storyboard as a flip book/.test(panel.text), "the panel has the box, Play the beat and Send to the storyboard as a flip book");
      ok(/Ida \(spiky red hair/.test(panel.words), "the box starts with the diner example");
      await page.click('.rig-dlg [data-rig="front"]');

      /* 1. the example, from the panel's own button */
      await page.click('.rig-dlg [data-ext="scene"] [data-scene="play"]');
      await page.waitForFunction(() => CurioRigScene.state(CurioRig.current().ctx).plays === 1, null, { timeout: 90000, polling: 200 });
      await waitDone();
      await frames(4);
      let L = await look();
      ok(L.actors.length === 2 && L.actors.every((a) => a.loaded) && L.actors.map((a) => a.name).join() === "Ida,Nessa", "the example builds two actors, Ida and Nessa, made from their words");
      const madeList = await page.evaluate(() => CurioRig.maker.store().list.map((m) => m.name));
      ok(madeList.includes("Ida") && madeList.includes("Nessa"), "both are kept in the made-from-words list (" + madeList.join(", ") + ")");
      ok(L.set.on && L.set.place === "diner" && L.set.time === "night", "the set is a diner at night");
      ok(L.set.seats.length === 2 && L.set.seats.every((s) => s.sitting) && L.set.seats.every((s) => s.shared), "both sit, across one shared table (" + JSON.stringify(L.set.seats.map((s) => [s.name, s.sitting, s.shared])) + ")");
      ok(L.actors[0].played >= 1 && L.actors[0].happy === 1, `Ida did the double take and ends very happy (moves ${L.actors[0].played}, happy ${L.actors[0].happy})`);
      ok((await page.evaluate(() => CurioRigStaging.state().speaker)) === 1, "Nessa is the one speaking: the others look at her");
      ok(inTheWay(L, [0, 1]).length === 0, "the set keeps clear of both actors" + (inTheWay(L, [0, 1]).length ? ": " + inTheWay(L, [0, 1]).join(", ") : ""));
      const rep = L.scene.report.map((x) => x[0]);
      ok(["Characters", "Set", "Staging", "Feelings", "Moves in order"].every((k) => rep.includes(k)), "Read as lists the characters, the set, the staging, the feelings and the moves in order");
      ok(/Read as:/.test(await page.evaluate(() => document.querySelector('.rig-dlg [data-ext="scene"] [data-scene="read"]').textContent)), "the Read as list shows in the panel");

      /* the set is laid out again when the staging changes */
      const relaid = L.set.relaid;
      await page.evaluate(() => CurioRigStaging.preset("standoff"));
      await page.waitForFunction((n) => CurioRigSets.state(CurioRig.current().ctx).relaid > n, relaid, { timeout: 10000 });
      await frames(4);
      L = await look();
      ok(inTheWay(L, [0, 1]).length === 0 && L.set.seats.length === 2, `standoff: the set is laid out again around where they stand now (${Math.abs(L.actors[1].x - L.actors[0].x).toFixed(1)} m apart)`);
      await page.evaluate(() => CurioRigStaging.preset("face to face"));

      /* the pictures: mid double take, in color and in pencil */
      await play();
      await page.waitForFunction(() => {
        const g = CurioRig.gestures.state();
        return g.playing === "double take" && (g.phase === "pay" || g.phase === "hold");
      }, null, { timeout: 30000, polling: 30 });
      await page.evaluate(() => {
        const ctx = CurioRig.current().ctx;
        CurioRigScene.hold(ctx, true);
        CurioRig.gestures.seek(CurioRig.current(), ctx.clock - ctx.data("gestures").run.t0);
      });
      await frames(6);
      await shot("scene-diner-double-take");
      await page.evaluate(() => CurioRigSnapshot.setLook(CurioRig.current().ctx, "pencil"));
      await frames(8);
      L = await look();
      ok(L.actors.every((a) => a.parts > 0 && a.drawn === a.parts && a.hulls > 0), "the pencil look reaches every actor, outlines and all (" + L.actors.map((a) => `${a.name} ${a.drawn}/${a.parts} parts, ${a.hulls} outlines`).join("; ") + ")");
      await shot("scene-diner-double-take-pencil");
      await page.evaluate(() => {
        CurioRig.gestures.seek(CurioRig.current(), null);
        CurioRigScene.hold(CurioRig.current().ctx, false);
      });
      await waitDone();

      /* 2 to 4: three other beats */
      for (let k = 0; k < OTHERS.length; k++) {
        await build(OTHERS[k]);
        await play();
        await waitDone();
        await frames(4);
        L = await look();
        const want = [2, 2, 3][k];
        const movers = [[0, 1], [0, 1], []][k];
        ok(L.actors.length === want && L.actors.every((a) => a.loaded) && L.scene.left === 0, `beat ${k + 2} builds ${want} actors and plays to the end (${L.actors.map((a) => a.name).join(", ")}; ${L.scene.plan.preset})`);
        ok(movers.every((i) => L.actors[i].played >= 1), `beat ${k + 2}: every acting move played (${L.actors.map((a) => a.name + " " + a.played).join(", ")})`);
        ok(L.set.on && !L.set.seats.length, `beat ${k + 2}: the set is ${L.set.place}, nobody sits`);
        const hit = inTheWay(L, []);
        ok(hit.length === 0, `beat ${k + 2}: the set keeps clear of all ${want} actors` + (hit.length ? ": " + hit.join(", ") : ""));
        ok(L.actors.every((a) => a.parts > 0 && a.drawn === a.parts), `beat ${k + 2}: the pencil look is on every actor`);
        if (k === 2) ok(L.actors.every((a) => a.happy === 1), "everyone laughs: all three end very happy");
      }

      /* a walk then a shrug, played in the view: the shrug starts once Ida has got to Nessa */
      await build(WALKS[1]);
      const timing = await page.evaluate(
        () =>
          new Promise((done) => {
            const ctx = CurioRig.current().ctx;
            CurioRigScene.play(ctx);
            let walked = false;
            let arrive = null;
            let shrug = null;
            const t0 = performance.now();
            const go = () => {
              const a = CurioRigStaging.actors({ ctx });
              const g = CurioRig.gestures.state({ ctx }) || {};
              if (a && a[0].walking) walked = true;
              if (walked && arrive == null && a && !a[0].walking) arrive = ctx.clock;
              if (shrug == null && g.playing === "shrug") shrug = ctx.clock;
              if ((shrug != null && arrive != null) || performance.now() - t0 > 30000) return done({ walked, arrive, shrug, gap: a ? Math.hypot(a[0].x - a[1].x, a[0].z - a[1].z) : 0 });
              requestAnimationFrame(go);
            };
            go();
          })
      );
      ok(timing.walked && timing.arrive != null && timing.shrug != null && timing.shrug >= timing.arrive && timing.gap < 1.5, `played in the view, Ida walks over to Nessa (${timing.gap.toFixed(2)} m apart at the end), then shrugs once she is there (the shrug starts ${timing.arrive != null && timing.shrug != null ? (timing.shrug - timing.arrive).toFixed(2) : "?"} s after she arrives)`);
      await waitDone();

      /* a walk then a sit, and a walk then a smile, played in the view: both come once Ida has got to Nessa */
      for (const kind of ["sit", "feel"]) {
        await build(AFTER[kind === "sit" ? 1 : 3][0]);
        const tm = await page.evaluate(
          (kind) =>
            new Promise((done) => {
              const ctx = CurioRig.current().ctx;
              CurioRigScene.play(ctx);
              let walked = false;
              let arrive = null;
              let when = null;
              const t0 = performance.now();
              const go = () => {
                const a = CurioRigStaging.actors({ ctx });
                if (a && a[0].walking) walked = true;
                if (walked && arrive == null && a && !a[0].walking) arrive = ctx.clock;
                const set = CurioRigSets.state(ctx) || {};
                const did = kind === "sit" ? (set.seats || []).some((x) => x.i === 0 && x.sitting) : a && (a[0].ctx.prefs.values["feelingFaceLens.happy"] || 0) > 0;
                if (when == null && did) when = ctx.clock;
                if ((when != null && arrive != null) || performance.now() - t0 > 30000) return done({ walked, arrive, when, gap: a ? Math.hypot(a[0].x - a[1].x, a[0].z - a[1].z) : 0 });
                requestAnimationFrame(go);
              };
              go();
            }),
          kind
        );
        ok(tm.walked && tm.arrive != null && tm.when != null && tm.when >= tm.arrive && tm.gap < 1.5, `played in the view, Ida walks over to Nessa (${tm.gap.toFixed(2)} m apart at the end), then ${kind === "sit" ? "sits" : "smiles"} once she is there (${tm.arrive != null && tm.when != null ? (tm.when - tm.arrive).toFixed(2) : "?"} s after she arrives)`);
        await waitDone();
      }

      /* 5: the example again; nothing left behind */
      await build(await page.evaluate(() => CurioRigScene.EXAMPLE));
      await page.evaluate(() => CurioRigSnapshot.setLook(CurioRig.current().ctx, "off"));
      await play();
      await waitDone();
      await frames(6);
      await page.evaluate(() => CurioRigSnapshot.setLook(CurioRig.current().ctx, "off"));
      await frames(4);
      L = await look();
      ok(L.actors.length === 2 && L.set.seats.length === 2, "the example builds again after the others");
      /* every scene has been drawn once now (the Light add-on keeps its own few shapes from the first time a
         kind of light is used); 5 more scenes must leave the memory where it is */
      const mem1 = await mem();
      for (const t of OTHERS.concat([OTHERS[0], await page.evaluate(() => CurioRigScene.EXAMPLE)])) {
        await build(t);
        await frames(4);
      }
      await frames(6);
      const mem5 = await mem();
      ok(mem5.geometries <= mem1.geometries && mem5.textures <= mem1.textures && mem5.programs <= mem1.programs + 2, `no WebGL leaks after building 5 more scenes (geometries ${mem1.geometries}→${mem5.geometries}, textures ${mem1.textures}→${mem5.textures}, programs ${mem1.programs}→${mem5.programs})`);

      /* the flip book of the beat, into the storyboard */
      await page.evaluate(() => CurioRigSnapshot.setLook(CurioRig.current().ctx, "clean"));
      await page.click('.rig-dlg [data-ext="scene"] [data-scene="flip"]');
      await page.waitForFunction(() => CuriosityStoryboard.data().scenes.length === 1, null, { timeout: 60000 });
      const flip = await page.evaluate(() => {
        const s = CuriosityStoryboard.data().scenes[0];
        return { n: s.panels.length, unique: new Set(s.panels.map((p) => p.pic)).size, secs: s.panels.map((p) => p.seconds), said: document.querySelector('.rig-dlg [data-ext="scene"] [data-scene="said"]').textContent };
      });
      ok(flip.n >= 8 && flip.unique >= flip.n / 2, `the beat lands in the storyboard as a flip book of ${flip.n} drawings (${flip.unique} different)`);
      ok(/flip book/.test(flip.said), `the panel says where it went ("${flip.said}")`);
      await page.evaluate(() => document.querySelector(".rig-dlg").close());
      await page.click('#tabs button[data-ws="storyboard"]');
      await page.waitForSelector('[data-sb="view-flip"]');
      await page.click('[data-sb="view-flip"]');
      await page.click('[data-go="0"]');
      await page.waitForTimeout(600);
      if (SHOTS) await page.locator('[data-sb="viewer"]').screenshot({ path: path.join(SHOTS, "scene-storyboard.png") });
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
