/* Comedy timing checks: node apps/curiosities/momentum/tests/comedy-timing.js [--browser] [--three <three.min.js>] [--shots <dir>]

   With no page: loads the shared core and the curiosity database (core/headless.js), then the momentum core and
   comedy-timing.js, and checks setups, payoffs, the gap between them, the beat before the punchline, how long a
   laugh lands, callbacks, setups that never pay off, the plain sentences, the estimates, and that a pause written
   on the engine is one undo step.

   With --browser (needs Playwright and Chromium; set NODE_PATH to where Playwright is installed): the app's page,
   Momentum, the Comedy timing tab on a practice scene, measuring another film, the engine's film with "Add this
   pause on the engine" and its undo, and a phone width with no sideways scroll. Screenshots go to --shots. */
const path = require("path");
const fs = require("fs");
const vm = require("vm");
const os = require("os");
const assert = require("assert");

const ROOT = path.join(__dirname, "..", "..");
const args = process.argv.slice(2);
const arg = (n, d) => (args.includes(n) ? args[args.indexOf(n) + 1] : d);

function nodeChecks() {
  const core = require(path.join(ROOT, "core", "headless.js")).load();
  const ctx = core.window;
  ["notes.js", "attention.js", "rates.js", "compass.js", "engine-lanes.js", "comedy-timing.js"].forEach((f) => {
    const file = path.join(ROOT, "momentum", f);
    vm.runInContext(fs.readFileSync(file, "utf8"), vm.isContext(ctx) ? ctx : vm.createContext(ctx), { filename: file });
  });
  const T = ctx.CurioComedyTiming;
  let n = 0;
  const ok = (name, fn) => {
    fn();
    n++;
    console.log("ok", name);
  };

  /* A small made-up film, ten seconds a beat. */
  const film = [
    { at: 0, values: { shotSize: "wide", comicBeat: "setup planted" } },
    { at: 10, values: { shotSize: "close", music: "featured" } },
    { at: 20, values: { music: "none" } },
    { at: 30, values: { comicBeat: "payoff lands" } },
    { at: 40, values: { comicReaction: "a double take" } },
    { at: 50, values: { emotion: "anxious" } },
    { at: 60, values: { comicBeat: "setup planted", shotSize: "medium" } },
    { at: 70, values: { comicBeat: "payoff lands", shotSize: "close" } },
    { at: 75, values: { topper: 2 } },
    { at: 80, values: { emotion: "joyful" } },
    { at: 90, values: { comicBeat: "setup planted", setUpkeep: "spotless" } },
    { at: 100, values: { emotion: "melancholy" } },
    { at: 110, values: { callback: 5, shotSize: "wide" } },
    { at: 120, values: { emotion: "anxious" } },
  ];

  ok("finds setups and payoffs, pairs each payoff with the setup waiting, and measures the gap", () => {
    const r = T.timing(film, { secondsPerBeat: 10 });
    const pay = r.jokes.filter((j) => j.kind === "payoff");
    assert.strictEqual(pay.length, 2);
    assert.strictEqual(pay[0].setupAt, 0);
    assert.strictEqual(pay[0].payoffAt, 30);
    assert.strictEqual(pay[0].gap, 30);
    assert.strictEqual(pay[1].gap, 10);
    assert.strictEqual(r.medianGap, 20);
  });
  ok("a pause or a quiet cue right before a payoff is the beat before the punchline", () => {
    const r = T.timing(film, { secondsPerBeat: 10 });
    const [a, b] = r.jokes.filter((j) => j.kind === "payoff");
    assert(a.pauseBefore && a.pauseBefore.kind === "quiet", "the music cut out before the first payoff");
    assert.strictEqual(b.pauseBefore, null, "nothing goes still before the second");
    assert(r.suggestions.some((s) => s.kind === "pause" && s.at === 70), "suggests a pause before the second payoff");
    const still = T.timing([{ at: 0, values: { comicBeat: "setup planted" } }, { at: 5, values: { shotSize: "close" } }, { at: 10, values: {} }, { at: 15, values: { comicBeat: "payoff lands" } }]);
    assert.strictEqual(still.jokes[0].pauseBefore.kind, "still", "a moment where nothing changes");
    const written = T.timing([{ at: 0, values: { comicBeat: "setup planted" } }, { at: 9, values: { comicBeat: "payoff lands", comicTiming: 2 } }]);
    assert.strictEqual(written.jokes[0].pauseBefore.kind, "timing", "a written pause before the punchline");
  });
  ok("the laugh lands until attention moves to something that is not comedy, or the next joke", () => {
    const r = T.timing(film, { secondsPerBeat: 10 });
    const [a, b] = r.jokes.filter((j) => j.kind === "payoff");
    assert.strictEqual(a.landing, 20, "the reaction keeps the laugh until the feeling at 0:50");
    assert.strictEqual(b.landing, 5, "the topper comes five seconds later");
    const top = r.jokes.find((j) => j.kind === "topper");
    assert(top && top.at === 75 && top.landing === 5);
  });
  ok("a callback returns to an earlier joke; a setup with no payoff is listed, with a suggestion", () => {
    const r = T.timing(film, { secondsPerBeat: 10 });
    const cb = r.jokes.find((j) => j.callback);
    assert(cb && cb.at === 110 && cb.callback.at <= 80, "callback at 1:50 to an earlier joke");
    assert.strictEqual(cb.setupAt, 90, "the callback pays off the setup at 1:30");
    const r2 = T.timing(film.slice(0, 11), { secondsPerBeat: 10 });
    assert.strictEqual(r2.unpaid.length, 1);
    assert.strictEqual(r2.unpaid[0].at, 90);
    assert(r2.suggestions.some((s) => s.kind === "unpaid" && /never pays off/.test(s.text)));
    /* The same particular comedy curiosity coming back after a while is a callback too. */
    const back = T.timing([
      { at: 0, values: { cutawayGag: 3 } },
      { at: 20, values: { emotion: "anxious" } },
      { at: 30, values: { topper: 1 } },
      { at: 40, values: { emotion: "joyful" } },
      { at: 60, values: { cutawayGag: 0 } },
      { at: 70, values: { cutawayGag: 4 } },
    ]);
    const c = back.jokes.find((j) => j.callback);
    assert(c && c.at === 70 && c.callback.at === 0 && !c.callback.guess);
  });
  ok("only comedy rows or plain words mark a setup (setUpkeep is how well a place is kept)", () => {
    assert.strictEqual(T.markerOf("setUpkeep", "spotless"), null);
    assert.strictEqual(T.markerOf("comicBeat@char1", "setup planted"), "setup");
    assert.strictEqual(T.markerOf("comicBeat.twist", "turned upside down"), null);
    assert.strictEqual(T.markerOf("comedyDevice", "running gag"), "callback");
    assert.strictEqual(T.markerOf("topper", 2, 1), "topper");
    assert.strictEqual(T.markerOf("topper", 1, 2), null);
    assert.strictEqual(T.markerOf("comicTiming", 3), null);
  });
  ok("jokes a minute and plain sentences, compared with the estimated comedies", () => {
    const r = T.timing(film, { secondsPerBeat: 10 });
    assert.strictEqual(r.seconds, 130);
    assert.strictEqual(r.perMinute, Math.round((r.jokes.length / 130) * 600) / 10);
    assert(/^Your jokes come every \d+ seconds .*Hot Fuzz is estimated at about one every 15/.test(r.sentences[0]), r.sentences[0]);
    assert(r.sentences.some((s) => /pause before the punchline/.test(s)));
    assert(r.sentences.every((s) => !/—/.test(s)), "no em-dashes");
    const none = T.timing([{ values: { shotSize: "wide" } }, { values: { shotSize: "close" } }]);
    assert.strictEqual(none.jokes.length, 0);
    assert(/has no jokes yet/.test(none.sentences[0]));
  });
  ok("the comedy estimates are marked, cover the comedies in the default list, and stay out of rates.js", () => {
    const ids = ctx.CurioRates.DEFAULT_FILMS.map((p) => p.id);
    ["paddington-2", "hot-fuzz", "grand-budapest"].forEach((id) => assert(ids.includes(id), id));
    T.COMEDY_FILMS.forEach((p) => {
      assert(p.estimate === true && /estimate/.test(p.source), p.id);
      assert(ids.includes(p.id), p.id + " is in the default list");
      ["secondsPerJoke", "medianGap", "pauseShare", "landing", "callbackShare"].forEach((k) => assert(typeof p[k] === "number", p.id + " " + k));
    });
    assert(!/secondsPerJoke|COMEDY_FILMS/.test(fs.readFileSync(path.join(ROOT, "momentum", "rates.js"), "utf8")));
  });
  ok("every practice scene reads, and the bookshop scene's two setups both pay off", () => {
    const list = core.CuriosityDB.studiesExport().studies;
    list.forEach((s) => {
      const r = T.timing(s.beats);
      assert(r.sentences.length >= 1, s.title);
      r.jokes.forEach((j) => assert(j.landing >= 0 && (j.gap == null || j.gap >= 0), s.title));
      const p = T.profile(r, { title: s.title });
      assert.strictEqual(p.estimate, false);
    });
    const book = list.find((s) => s.id === "model-bookshop-meet-cute");
    const r = T.timing(book.beats);
    assert.strictEqual(r.setups.length, 2);
    assert.strictEqual(r.unpaid.length, 0);
  });
  ok("on the engine, a pause before a payoff is one undo step", () => {
    const E = ctx.CurioEngine;
    const ME = ctx.CurioMomentumEngine;
    assert(E.send({ type: "importFilm", film: ctx.CurioSeeds.starter() }).ok);
    const st = E.state();
    const tr = st.tracks.find((t) => t.kind === "character") || st.tracks[0];
    assert(E.send({ type: "batch", label: "test comedy", commands: [{ type: "addCuriosity", track: tr.id, curiosity: "comicBeat" }, { type: "setPoint", row: st.rows[1].id, track: tr.id, curiosity: "comicBeat", value: "setup planted" }, { type: "setPoint", row: st.rows[4].id, track: tr.id, curiosity: "comicBeat", value: "payoff lands" }, { type: "laneMode", track: tr.id, curiosity: "comicBeat", mode: "hold" }] }).ok);
    const r = T.timing(ME.beats(), { secondsPerBeat: 3 });
    const j = r.jokes.find((x) => x.kind === "payoff" && x.row === st.rows[4].id);
    assert(j, "the engine payoff is found at its moment");
    const mv = T.pauseMove(j);
    assert(mv && mv.commands.some((c) => c.type === "setPoint" && c.curiosity === "comicTiming" && c.row === j.row));
    const before = E.history().undo.length;
    assert(T.applyPause(j).ok);
    assert.strictEqual(E.history().undo.length, before + 1);
    const after = T.timing(ME.beats(), { secondsPerBeat: 3 }).jokes.find((x) => x.row === j.row);
    assert(after.pauseBefore && after.pauseBefore.kind === "timing", "the payoff now has a written pause");
    E.undo();
    assert.strictEqual(E.history().undo.length, before, "one undo step");
  });
  console.log(`${n} comedy timing checks passed`);
}

async function browserChecks() {
  const http = require("http");
  const { chromium } = require("playwright");
  const SHOTS = arg("--shots", os.tmpdir());
  const three = arg("--three", "");
  const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".webmanifest": "application/manifest+json" };
  const server = await new Promise((resolve) => {
    const s = http.createServer((req, res) => {
      const p = path.join(ROOT, decodeURIComponent(req.url.split("?")[0]).replace(/^\/+/, ""));
      if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) {
        res.writeHead(404);
        return res.end();
      }
      res.writeHead(200, { "content-type": TYPES[path.extname(p)] || "application/octet-stream" });
      fs.createReadStream(p).pipe(res);
    });
    s.listen(0, "127.0.0.1", () => resolve(s));
  });
  const base = "http://127.0.0.1:" + server.address().port + "/";
  const browser = await chromium.launch();
  const errors = [];
  let failed = 0;
  const ok = (cond, text) => {
    console.log((cond ? "ok   " : "FAIL ") + text);
    if (!cond) failed++;
  };
  async function newPage(viewport) {
    const page = await browser.newPage({ viewport });
    page.on("pageerror", (e) => errors.push(String(e && e.message)));
    page.on("console", (m) => m.type() === "error" && !/Failed to load resource|favicon|fonts\.g/.test(m.text()) && errors.push(m.text()));
    await page.route(/three\.min\.js$/, (r) => (three ? r.fulfill({ contentType: "text/javascript", body: fs.readFileSync(three, "utf8") }) : r.fulfill({ contentType: "text/javascript", body: "" })));
    await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
    await page.goto(base + "index.html");
    const hasLine = await page.evaluate(() => !!document.querySelector('script[src="momentum/load.js"]'));
    if (!hasLine)
      await page.evaluate(() => {
        const s = document.createElement("script");
        s.src = "momentum/load.js";
        document.body.appendChild(s);
      });
    await page.waitForFunction(() => window.CurioMomentumUI && window.CurioComedyTiming, null, { timeout: 15000 });
    return page;
  }
  try {
    const page = await newPage({ width: 1360, height: 900 });
    await page.evaluate(() => document.getElementById("lib-btn").click());
    await page.click("#lib-menu [data-momentum]");
    await page.waitForSelector(".mo-dlg[open]");
    await page.click('.mo-dlg [data-tab="comedy"]');
    await page.waitForSelector(".mo-dlg .ct-root");
    ok(true, "the Comedy timing tab opens");
    await page.selectOption(".mo-dlg select[data-ct-source]", "study:model-bookshop-meet-cute");
    const drawn = await page.evaluate(() => ({
      arcs: document.querySelectorAll(".mo-dlg .ct-strip .ct-arc").length,
      marks: document.querySelectorAll(".mo-dlg .ct-strip .ct-mark").length,
      sent: [...document.querySelectorAll(".mo-dlg .ct-sent li")].map((x) => x.textContent),
      rows: document.querySelectorAll(".mo-dlg .ct-table tbody tr").length,
    }));
    ok(drawn.arcs >= 2 && drawn.marks >= 4, `the strip marks setups and payoffs with arcs (${drawn.marks} marks, ${drawn.arcs} arcs)`);
    ok(/^Your jokes come every \d+ seconds/.test(drawn.sent[0] || ""), "plain sentence: " + drawn.sent[0]);
    ok(drawn.rows === 4, "compared with this film and the three estimated comedies");
    await page.screenshot({ path: path.join(SHOTS, "comedy-timing.png") });
    await page.evaluate(() => document.querySelector(".mo-dlg .ct-table").scrollIntoView());
    await page.screenshot({ path: path.join(SHOTS, "comedy-timing-2.png") });

    await page.selectOption(".mo-dlg select[data-ct-other]", "study:model-deadpan-office");
    await page.click(".mo-dlg [data-ct-measure]");
    const rows = await page.$$eval(".mo-dlg .ct-table tbody tr", (r) => r.length);
    ok(rows === 5, `measuring another film adds a row (${rows})`);
    ok(await page.evaluate(() => /Measured the comedy/.test((document.querySelector(".mo-dlg .mo-flash") || {}).textContent || "")), "says it measured it");

    /* The engine's film: a payoff with no pause gets "Add this pause on the engine", one undo step. */
    await page.evaluate(() => {
      const E = window.CurioEngine;
      E.send({ type: "importFilm", film: window.CurioSeeds.starter() });
      const st = E.state();
      const tr = st.tracks.find((t) => t.kind === "character") || st.tracks[0];
      E.send({ type: "batch", label: "test comedy", commands: [{ type: "addCuriosity", track: tr.id, curiosity: "comicBeat" }, { type: "setPoint", row: st.rows[1].id, track: tr.id, curiosity: "comicBeat", value: "setup planted" }, { type: "setPoint", row: st.rows[4].id, track: tr.id, curiosity: "comicBeat", value: "payoff lands" }, { type: "laneMode", track: tr.id, curiosity: "comicBeat", mode: "hold" }] });
    });
    await page.click('.mo-dlg [data-tab="attention"]');
    await page.click('.mo-dlg [data-tab="comedy"]');
    await page.selectOption(".mo-dlg select[data-ct-source]", "engine");
    const n0 = await page.evaluate(() => window.CurioEngine.history().undo.length);
    const btn = await page.$(".mo-dlg [data-ct-pause]");
    ok(!!btn, "the engine's payoff offers a pause");
    if (btn) {
      await btn.click();
      const res = await page.evaluate(() => [window.CurioEngine.history().undo.length, (document.querySelector(".mo-dlg .mo-flash") || {}).textContent || ""]);
      ok(res[0] === n0 + 1 && /Added a pause/.test(res[1]), "the pause is one engine undo step: " + res[1]);
      await page.screenshot({ path: path.join(SHOTS, "comedy-timing-engine.png") });
      await page.evaluate(() => window.CurioEngine.undo());
      ok((await page.evaluate(() => window.CurioEngine.history().undo.length)) === n0, "undo takes it back");
    }
    await page.close();

    const phone = await newPage({ width: 375, height: 800 });
    await phone.evaluate(() => {
      try {
        const k = "curiosities-momentum-v1";
        const p = JSON.parse(localStorage.getItem(k) || "{}");
        p.source = "study:model-bookshop-meet-cute";
        localStorage.setItem(k, JSON.stringify(p));
      } catch (e) {}
    });
    await phone.reload();
    await phone.waitForFunction(() => window.CurioMomentumUI && window.CurioComedyTiming, null, { timeout: 15000 });
    await phone.evaluate(() => window.CurioMomentumUI.open("comedy"));
    await phone.waitForSelector(".mo-dlg .ct-strip");
    const wide = await phone.evaluate(() => {
      const d = document.querySelector(".mo-dlg");
      return [document.documentElement.scrollWidth - window.innerWidth, d.scrollWidth - d.clientWidth];
    });
    ok(wide[0] <= 0 && wide[1] <= 0, `no sideways scroll at 375 px (page ${wide[0]}, window ${wide[1]})`);
    await phone.screenshot({ path: path.join(SHOTS, "comedy-timing-phone.png") });
    await phone.evaluate(() => (document.querySelector(".mo-dlg").scrollTop = 700));
    await phone.screenshot({ path: path.join(SHOTS, "comedy-timing-phone-2.png") });
    ok(errors.length === 0, "no page errors" + (errors.length ? ": " + errors.slice(0, 3).join(" | ") : ""));
  } finally {
    await browser.close();
    server.close();
  }
  if (failed) {
    console.log(failed + " browser checks failed");
    process.exit(1);
  }
  console.log("comedy timing browser checks passed; screenshots in " + SHOTS);
}

nodeChecks();
if (args.includes("--browser")) browserChecks().catch((e) => {
  console.error(e);
  process.exit(1);
});
