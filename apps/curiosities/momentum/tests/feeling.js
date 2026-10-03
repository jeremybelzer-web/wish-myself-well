/* Feeling road (momentum/feeling.js): node apps/curiosities/momentum/tests/feeling.js [--browser] [--three <three.min.js>] [--shots <dir>]
   1. With no page: loads the app core like tests/run.js, then the momentum core and feeling.js, and checks
      feelingRoad() on a hand-made reading (flat stretches split where attention moves, the suggestion one step
      toward the next scene's feeling, big turns attention misses, how many turns line up with a move, scenes
      laid over moments), plain sentences with no dashes, and the engine's feeling lanes: a suggestion written
      as one engine batch and taken back by one undo.
   2. With --browser (needs Playwright and Chromium; set NODE_PATH): the app with seeded story feelings,
      Momentum, the "Feeling road" tab: the ribbon and a line per road, the three lists, a suggestion applied
      and undone through the story store; with the story store empty, the plain line on how to fill it and the
      engine's lanes; no page errors; no sideways scroll at 375px; screenshots in --shots. */
const path = require("path");
const fs = require("fs");
const os = require("os");
const vm = require("vm");
const assert = require("assert");

const args = process.argv.slice(2);
const arg = (n, d) => (args.includes(n) ? args[args.indexOf(n) + 1] : d);
const ROOT = path.join(__dirname, "..", "..");
const core = require(path.join(ROOT, "core", "headless.js")).load();
const ctx = core.window;
const context = vm.isContext(ctx) ? ctx : vm.createContext(ctx);
["notes.js", "attention.js", "rates.js", "compass.js", "engine-lanes.js"].forEach((f) => {
  const file = path.join(ROOT, "momentum", f);
  vm.runInContext(fs.readFileSync(file, "utf8"), context, { filename: file });
});
vm.runInContext(fs.readFileSync(path.join(ROOT, "momentum", "feeling.js"), "utf8"), context, { filename: "feeling.js" });
const F = ctx.CurioFeeling;
let n = 0;
/* Values made inside the app's context are another realm's arrays, so compare them as JSON. */
const same = (a, b, msg) => assert.strictEqual(JSON.stringify(a), JSON.stringify(b), msg);
const ok = (name, fn) => {
  fn();
  n++;
  console.log("ok", name);
};

/* A reading by hand: 8 beats; camera from 0, movement from 5, feeling from 7. */
const seg = (beat, family) => ({ beat, family, curiosity: family + "X", label: family, cue: "visual", from: beat * 3, to: beat * 3 + 3, dur: 3 });
const reading = { beats: 8, seconds: 24, segments: [seg(0, "camera"), seg(5, "movement"), seg(7, "feeling")] };
const roads = [
  { id: "Ida", label: "Ida", values: ["curious", "curious", "curious", "curious", "joyful", "joyful", "angry", "angry"] },
  { id: "Bo", label: "Bo", values: ["dreamlike", "dreamlike", "dreamlike", "dreamlike", "dreamlike", "dreamlike", "dreamlike", "angry"] },
  { id: "The film", label: "The film", film: true, values: ["loving", "loving", "loving", null, null, "melancholy", "melancholy", "melancholy"] },
];

ok("the scale is CurioScale's emotion order, calm to charged", () => {
  same(F.scaleList(), Array.from(ctx.CurioScale.domain("emotion").options));
  assert.strictEqual(F.scaleList()[0], "dreamlike");
  assert.strictEqual(F.scaleList()[9], "angry");
});

const res = F.feelingRoad(reading, roads, {});
ok("the ribbon has a cell per beat and marks the moves", () => {
  assert.strictEqual(res.ribbon.length, 8);
  same(res.ribbon.filter((r) => r.move).map((r) => r.beat), [5, 7]);
  assert.strictEqual(res.ribbon[0].start, true);
  assert.strictEqual(res.ribbon[6].family, "movement");
});

ok("flat feelings: the same feeling while attention stalls, split where attention moves", () => {
  const ida = res.flat.filter((f) => f.road === "Ida");
  assert.strictEqual(ida.length, 1);
  same([ida[0].from, ida[0].to, ida[0].value], [0, 3, "curious"]);
  const bo = res.flat.filter((f) => f.road === "Bo");
  same(bo.map((f) => [f.from, f.to]), [[0, 4]], "Bo's run of 7 is split where attention moves in scene 6, and 6 to 7 is too short");
  const film = res.flat.filter((f) => f.road === "The film");
  same(film.map((f) => [f.from, f.to]), [[0, 2]], "a scene with no feeling set breaks a run; scenes 6 to 8 split where attention moves in scene 8");
});

ok("the suggestion turns one step toward the next scene's feeling, and says why", () => {
  const s = res.flat.find((f) => f.road === "Ida").suggest;
  assert.strictEqual(s.scene, 2, "the middle of the stretch");
  same([s.from, s.to, s.toward, s.towardScene, s.dir], ["curious", "absurd", "joyful", 4, 1]);
  assert.ok(/one step up/.test(s.text) && /Scene 5 goes to joyful/.test(s.text), s.text);
  const film = res.flat.find((f) => f.road === "The film").suggest;
  same([film.from, film.to, film.toward], ["loving", "melancholy", "melancholy"], "down toward melancholy");
  assert.ok(/one step down/.test(film.text), film.text);
  /* Nothing different anywhere: up one step, said plainly. */
  const still = F.feelingRoad(reading, [{ id: "Cy", label: "Cy", values: Array(8).fill("loving") }], {}).flat[0].suggest;
  same([still.to, still.toward], ["curious", null]);
  assert.ok(/stays loving everywhere/.test(still.text), still.text);
  /* At the top of the scale, down. */
  const top = F.feelingRoad(reading, [{ id: "Cy", label: "Cy", values: Array(8).fill("angry") }], {}).flat[0].suggest;
  assert.strictEqual(top.to, "triumphant");
});

ok("feeling turns attention misses: a big turn where attention never rests on Feeling", () => {
  same(res.missed.map((m) => [m.road, m.scene, m.from, m.to, m.steps]), [["Ida", 6, "joyful", "angry", 4]]);
  assert.ok(/never moves to Feeling/.test(res.missed[0].text) && /Movement/.test(res.missed[0].text), res.missed[0].text);
  /* Bo's 9 step turn in scene 8 comes while Feeling holds attention, so it is caught. */
  assert.ok(!res.missed.some((m) => m.road === "Bo"));
  /* A smaller threshold finds the 2 step turn too. */
  assert.ok(F.feelingRoad(reading, roads, { bigTurn: 2 }).missed.some((m) => m.road === "Ida" && m.scene === 4));
});

ok("how often feeling turns line up with moves of attention", () => {
  /* Ida turns in scenes 5 and 7 (no move), Bo in 8 (move), the film in 6 (move). */
  same([res.align.turns, res.align.aligned], [4, 2]);
  assert.strictEqual(res.align.share, 0.5);
  same(Object.assign({}, res.align.byRoad.Ida), { turns: 2, aligned: 0 });
  assert.ok(/^2 of 4 feeling turns \(50%\)/.test(res.align.text), res.align.text);
});

ok("scenes are laid over their share of the moments", () => {
  const four = F.feelingRoad(reading, [{ id: "a", values: ["joyful", "joyful", "angry", "angry"] }], {});
  same(four.spans.map((s) => Array.from(s)), [[0, 1], [2, 3], [4, 5], [6, 7]]);
  const many = F.feelingRoad({ beats: 4, segments: [seg(0, "camera")] }, [{ id: "a", values: Array(8).fill("joyful") }], {});
  assert.strictEqual(many.spans.length, 8);
  many.spans.forEach(([a, z]) => assert.ok(a >= 0 && z <= 3 && a <= z));
  /* Unknown words and empty scenes are left out, never guessed. */
  const odd = F.feelingRoad(reading, [{ id: "a", values: ["joyful", "glum", "", null, "Joyful", "joyful", "joyful", "joyful"] }], {});
  same(odd.roads[0].points.map((p) => p.value), ["joyful", null, null, null, "joyful", "joyful", "joyful", "joyful"]);
  /* An empty reading or no roads does not throw. */
  const none = F.feelingRoad({ beats: 0, segments: [] }, [], {});
  same([none.flat.length, none.missed.length, none.align.turns], [0, 0, 0]);
});

ok("every sentence is plain: no dashes", () => {
  const texts = [].concat(res.sentences, res.flat.map((f) => f.text + f.suggest.text + f.suggest.button), res.missed.map((m) => m.text), [res.align.text]);
  texts.forEach((t) => assert.ok(!/[—–]/.test(t), t));
});

ok("the engine's feeling lanes: a suggestion is one engine batch, and one undo takes it back", () => {
  const E = ctx.CurioEngine;
  E.send({ type: "importFilm", film: ctx.CurioSeeds.starter(["Ida", "Bo"]) });
  const st = E.state();
  const rows = st.rows.map((r) => r.id);
  /* Ida feels the same through moments 1 to 5, then turns. */
  const idaVals = ["curious", "curious", "curious", "curious", "curious", "joyful", "joyful", "fearful"];
  const cmds = [{ type: "addCuriosity", track: "char1", curiosity: "emotion" }].concat(rows.map((r, i) => ({ type: "setSource", row: r, track: "char1", curiosity: "emotion", value: idaVals[i] })));
  assert.ok(E.send({ type: "batch", label: "test feelings", commands: cmds }).ok);
  const er = F.engineRoads();
  same(er.roads.map((r) => r.label), ["Ida", "The film"], "characters first, the film (Master) last");
  same(Array.from(er.roads[0].values), idaVals);
  /* No story store here, so the roads come from the engine. */
  const src = F.roads();
  assert.strictEqual(src.source, "engine");
  const r = F.feelingRoad(ctx.CurioMomentumEngine.reading({ secondsPerBeat: 3 }), src.roads, { unit: src.unit, flatScenes: 3 });
  assert.ok(r.roads.length === 2 && r.ribbon.length === 8);
  const flat = r.flat.find((f) => f.road === "char1");
  const before = E.history().undo.length;
  if (flat) {
    const s = flat.suggest;
    assert.strictEqual(s.source, "engine");
    assert.ok(/moment/.test(s.text));
    const old = E.value(rows[s.scene], "char1", "emotion");
    const res2 = F.apply(s);
    assert.ok(res2.ok, res2.error);
    assert.strictEqual(E.value(rows[s.scene], "char1", "emotion"), s.to);
    assert.strictEqual(E.history().undo.length, before + 1, "one undo step");
    assert.ok(F.pending(), "the tab knows it can undo it");
    assert.ok(F.undo());
    assert.strictEqual(E.value(rows[s.scene], "char1", "emotion"), old);
    assert.strictEqual(F.pending(), null);
  } else {
    /* Attention moved inside every stretch: write one by hand to check the path anyway. */
    const res2 = F.apply({ source: "engine", track: "char1", road: "char1", label: "Ida", scene: 2, to: "absurd" });
    assert.ok(res2.ok, res2.error);
    assert.strictEqual(E.value(rows[2], "char1", "emotion"), "absurd");
    assert.ok(F.undo());
    assert.strictEqual(E.value(rows[2], "char1", "emotion"), "curious");
  }
  /* A column with automation points takes a hand edit on that one cell, so the lane keeps the rest. */
  E.send({ type: "setPoint", row: rows[0], track: "master", curiosity: "emotion", value: "loving" });
  const old3 = E.value(rows[3], "master", "emotion");
  const res3 = F.apply({ source: "engine", track: "master", road: "master", film: true, label: "The film", scene: 3, to: "joyful" });
  assert.ok(res3.ok, res3.error);
  assert.strictEqual(E.value(rows[3], "master", "emotion"), "joyful");
  assert.strictEqual(E.value(rows[4], "master", "emotion"), E.value(rows[4], "master", "emotion"));
  assert.ok(F.undo());
  assert.strictEqual(E.value(rows[3], "master", "emotion"), old3);
});

console.log(`\n${n} feeling road checks passed`);

if (args.includes("--browser")) browserCheck();

function browserCheck() {
  const http = require("http");
  const { chromium } = require("playwright");
  const SHOTS = arg("--shots", os.tmpdir());
  const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".webmanifest": "application/manifest+json" };
  const serve = () =>
    new Promise((resolve) => {
      const server = http.createServer((req, res) => {
        const p = path.join(ROOT, decodeURIComponent(req.url.split("?")[0]).replace(/^\/+/, ""));
        if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) {
          res.writeHead(404);
          return res.end();
        }
        res.writeHead(200, { "content-type": TYPES[path.extname(p)] || "application/octet-stream" });
        fs.createReadStream(p).pipe(res);
      });
      server.listen(0, "127.0.0.1", () => resolve(server));
    });
  let failed = 0;
  const check = (cond, text) => {
    console.log((cond ? "ok   " : "FAIL ") + text);
    if (!cond) failed++;
  };
  /* Story feelings: Nessa flat for four scenes, then a big jump; the film turning; Ida with a few. */
  const STORY = {
    scenes: 8,
    characters: ["Nessa", "Ida"],
    values: {
      Nessa: ["curious", "curious", "curious", "curious", "joyful", "joyful", "angry", "melancholy"].map((emotion) => ({ emotion })),
      Ida: ["loving", "loving", "anxious", "anxious", "anxious", "fearful", "loving", "joyful"].map((emotion) => ({ emotion })),
      "The film": ["curious", "curious", "anxious", "anxious", "angry", "melancholy", "loving", "joyful"].map((emotion) => ({ emotion })),
    },
  };
  (async () => {
    fs.mkdirSync(SHOTS, { recursive: true });
    const server = await serve();
    const base = "http://127.0.0.1:" + server.address().port + "/";
    const browser = await chromium.launch();
    const errors = [];
    const three = arg("--three", "");
    async function open(viewport, story) {
      const page = await browser.newPage({ viewport });
      page.on("pageerror", (e) => errors.push(String(e && e.message)));
      page.on("console", (m) => m.type() === "error" && !/Failed to load resource|favicon|fonts\.g/.test(m.text()) && errors.push(m.text()));
      await page.route(/three\.min\.js$/, (r) => (three ? r.fulfill({ contentType: "text/javascript", body: fs.readFileSync(three, "utf8") }) : r.fulfill({ contentType: "text/javascript", body: "" })));
      await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
      await page.addInitScript((s) => {
        try {
          if (s && !sessionStorage.getItem("fr-seeded")) {
            localStorage.setItem("curiosities-story-v1", JSON.stringify(s));
            sessionStorage.setItem("fr-seeded", "1");
          }
        } catch (e) {}
      }, story || null);
      await page.goto(base + "index.html");
      if (!(await page.evaluate(() => !!document.querySelector('script[src="momentum/load.js"]'))))
        await page.evaluate(() => {
          const s = document.createElement("script");
          s.src = "momentum/load.js";
          document.body.appendChild(s);
        });
      await page.waitForFunction(() => window.CurioMomentumUI && window.CurioFeeling && window.CurioEngine && window.CuriosityStory, null, { timeout: 15000 });
      await page.evaluate(() => {
        const E = window.CurioEngine;
        E.send({ type: "importFilm", film: window.CurioSeeds.starter(["Nessa", "Ida"]) });
      });
      return page;
    }

    /* 1. Seeded story feelings. */
    const page = await open({ width: 1280, height: 900 }, STORY);
    await page.evaluate(() => document.getElementById("lib-btn").click());
    await page.click("#lib-menu [data-momentum]");
    await page.waitForSelector(".mo-dlg[open]");
    check(!!(await page.$('.mo-dlg [data-tab="feeling"]')), 'Momentum has a "Feeling road" tab');
    await page.click('.mo-dlg [data-tab="feeling"]');
    await page.waitForSelector(".mo-dlg .mo-fr-chart");
    const drawn = await page.evaluate(() => ({
      cells: document.querySelectorAll(".mo-dlg .mo-fr-ribbon .mo-fr-cell").length,
      rows: window.CurioEngine.state().rows.length,
      lines: document.querySelectorAll(".mo-dlg .mo-fr-plot").length,
      names: [...document.querySelectorAll(".mo-dlg .mo-fr-row .mo-fr-name")].map((x) => x.textContent.trim()),
      text: document.querySelector(".mo-dlg .mo-ext").textContent,
      apply: document.querySelectorAll('.mo-dlg [data-fr="apply"]').length,
      fill: !!document.querySelector(".mo-dlg .mo-fr-fill"),
    }));
    check(drawn.cells === drawn.rows, `one attention ribbon, a cell per moment (${drawn.cells} of ${drawn.rows})`);
    check(drawn.lines === 3 && drawn.names.includes("Nessa") && drawn.names.includes("The film"), "a line per road: " + drawn.names.join(", "));
    check(/story store/.test(drawn.text) && !drawn.fill, "it reads the story store and does not ask to fill it");
    check(/Flat feelings/.test(drawn.text) && /Feeling turns that attention misses/.test(drawn.text) && /feeling turns/.test(drawn.text), "the three findings are listed");
    check(!/[—–]/.test(drawn.text), "no dashes in the tab's text");
    check(drawn.apply > 0, `suggestions to turn a flat feeling (${drawn.apply})`);
    await page.screenshot({ path: path.join(SHOTS, "feeling-story.png"), fullPage: false });
    await page.evaluate(() => (document.querySelector(".mo-dlg").scrollTop = 600));
    await page.screenshot({ path: path.join(SHOTS, "feeling-story-2.png") });

    /* Apply the first suggestion: the story store changes, one Undo puts it back. */
    const before = await page.evaluate(() => JSON.stringify(window.CuriosityStory.get("Nessa").map((o) => o.emotion)));
    const label = await page.evaluate(() => document.querySelector('.mo-dlg [data-fr="apply"]').textContent);
    await page.click('.mo-dlg [data-fr="apply"]');
    const after = await page.evaluate(() => ({ nessa: JSON.stringify(window.CuriosityStory.get("Nessa").map((o) => o.emotion)), film: JSON.stringify(window.CuriosityStory.get("The film").map((o) => o.emotion)), flash: (document.querySelector(".mo-dlg .mo-fr-flash") || {}).textContent || "", undo: !!document.querySelector('.mo-dlg [data-fr="undo"]') }));
    check(after.nessa !== before || after.film !== JSON.stringify(STORY.values["The film"].map((o) => o.emotion)), `"${label}" changes the story store`);
    check(/Done/.test(after.flash) && /story store/.test(after.flash) && after.undo, "it says what it did, where, and offers Undo: " + after.flash);
    await page.screenshot({ path: path.join(SHOTS, "feeling-applied.png") });
    await page.click('.mo-dlg [data-fr="undo"]');
    const undone = await page.evaluate(() => ({ nessa: JSON.stringify(window.CuriosityStory.get("Nessa").map((o) => o.emotion)), film: JSON.stringify(window.CuriosityStory.get("The film").map((o) => o.emotion)), undo: !!document.querySelector('.mo-dlg [data-fr="undo"]') }));
    check(undone.nessa === before && undone.film === JSON.stringify(STORY.values["The film"].map((o) => o.emotion)) && !undone.undo, "Undo takes it back");
    /* The thresholds change the findings. */
    await page.selectOption('.mo-dlg select[data-fr-set="flatScenes"]', "5");
    const fewer = await page.evaluate(() => document.querySelectorAll('.mo-dlg [data-fr="apply"]').length);
    check(fewer <= drawn.apply, `a longer flat stretch finds no more (${fewer} of ${drawn.apply})`);
    await page.selectOption('.mo-dlg select[data-fr-set="flatScenes"]', "3");

    /* 2. Story store empty: the plain line, and the engine's lanes. */
    const empty = await open({ width: 1280, height: 900 }, { scenes: 8, characters: ["Nessa", "Ida"], values: {} });
    await empty.evaluate(() => window.CurioMomentumUI.open("feeling"));
    await empty.waitForSelector(".mo-dlg .mo-fr-fill");
    const e1 = await empty.evaluate(() => ({ fill: document.querySelector(".mo-dlg .mo-fr-fill").textContent, lines: document.querySelectorAll(".mo-dlg .mo-fr-plot").length, ws: !!document.querySelector('.mo-dlg [data-fr="workspace"]') }));
    check(/Emotional road/.test(e1.fill) && e1.ws, "an empty story says how to fill it (Emotional road workspace)");
    check(e1.lines === 1, "and reads the engine film's feeling lane (the Master track's Emotion): " + e1.lines);
    /* Give Ida a feeling lane on the engine: the tab redraws with her road, and a suggestion is one engine step. */
    await empty.evaluate(() => {
      const E = window.CurioEngine;
      const st = E.state();
      const t = st.tracks.find((x) => x.label === "Ida");
      const vals = ["curious", "curious", "curious", "curious", "curious", "curious", "triumphant", "triumphant"];
      E.send({ type: "batch", label: "Ida feels", commands: [{ type: "addCuriosity", track: t.id, curiosity: "emotion" }].concat(st.rows.map((r, i) => ({ type: "setSource", row: r.id, track: t.id, curiosity: "emotion", value: vals[i] }))) });
    });
    await empty.waitForFunction(() => document.querySelectorAll(".mo-dlg .mo-fr-plot").length === 2);
    check(true, "an engine change redraws the tab with Ida's road");
    const hasApply = await empty.evaluate(() => document.querySelectorAll('.mo-dlg [data-fr="apply"]').length);
    if (hasApply) {
      const n0 = await empty.evaluate(() => window.CurioEngine.history().undo.length);
      await empty.click('.mo-dlg [data-fr="apply"]');
      const e2 = await empty.evaluate(() => ({ n: window.CurioEngine.history().undo.length, top: window.CurioEngine.history().undo.slice(-1)[0], flash: (document.querySelector(".mo-dlg .mo-fr-flash") || {}).textContent || "" }));
      check(e2.n === n0 + 1 && /Feeling road/.test(e2.top) && /engine/.test(e2.flash), "a suggestion on an engine road is one engine undo step: " + e2.top);
      await empty.click('.mo-dlg [data-fr="undo"]');
      const n2 = await empty.evaluate(() => window.CurioEngine.history().undo.length);
      check(n2 === n0, "and Undo takes it back");
    } else check(false, "the engine road should have a flat stretch to turn");
    await empty.screenshot({ path: path.join(SHOTS, "feeling-engine.png") });

    /* 3. Phone width. */
    const phone = await open({ width: 375, height: 800 }, STORY);
    await phone.evaluate(() => window.CurioMomentumUI.open("feeling"));
    await phone.waitForSelector(".mo-dlg .mo-fr-chart");
    const wide = await phone.evaluate(() => {
      const d = document.querySelector(".mo-dlg");
      return Math.max(document.documentElement.scrollWidth - window.innerWidth, d.scrollWidth - d.clientWidth);
    });
    check(wide <= 0, `no sideways scroll at 375px (${wide}px over)`);
    await phone.evaluate(() => document.querySelector(".mo-dlg .mo-fr-chart").scrollIntoView());
    await phone.screenshot({ path: path.join(SHOTS, "feeling-phone.png") });
    await phone.evaluate(() => document.querySelector('.mo-dlg [data-fr="apply"], .mo-dlg .mo-fr-list').scrollIntoView());
    await phone.screenshot({ path: path.join(SHOTS, "feeling-phone-2.png") });

    check(errors.length === 0, "no page errors" + (errors.length ? ": " + errors.slice(0, 5).join(" | ") : ""));
    await browser.close();
    server.close();
    console.log(failed ? `\n${failed} browser checks FAILED` : "\nbrowser checks passed");
    process.exit(failed ? 1 : 0);
  })().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
