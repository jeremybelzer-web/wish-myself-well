/* The Cue lab (momentum/cuelab.js): node momentum/tests/cuelab.js [--browser [--three <three.min.js>] [--shots <dir>]]
   With no page: every curated film with a trace gets a row whose cue counts match attention.js, stops and
      actions add up to the moves, films with only an estimate get no numbers ("no trace yet"), the verdicts
      use the 0.75 and 1.33 lines, the moves to steal are ones My film never makes (most made first, at most 5),
      and "Make this move here" on the engine's film is one undo step.
   With --browser (NODE_PATH=/opt/node22/lib/node_modules): opens the app's index.html, opens Momentum and the
      Cue lab tab, checks the table (at least two curated films and My film marked), the sentences, the chart,
      clicks a "Make this move here" button (the engine changes, one Undo restores it), no page errors, and no
      sideways scroll at 375 pixels wide. Screenshots go to --shots (default: the system temp folder). */
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
["notes.js", "attention.js", "rates.js", "compass.js", "engine-lanes.js", "cuelab.js"].forEach((f) => {
  const file = path.join(ROOT, "momentum", f);
  vm.runInContext(fs.readFileSync(file, "utf8"), vm.isContext(ctx) ? ctx : vm.createContext(ctx), { filename: file });
});
const L = ctx.CurioCueLab;
const A = ctx.CurioAttention;
const R = ctx.CurioRates;
const E = ctx.CurioEngine;
const ME = ctx.CurioMomentumEngine;
let n = 0;
const ok = (name, fn) => {
  fn();
  n++;
  console.log("ok", name);
};
const studies = core.CuriosityDB.studiesExport().studies;
const readingsWith = (mine) => {
  const out = [{ id: "mine", title: "Your film", reading: mine, mine: true }];
  studies.forEach((s) => out.push({ id: "study:" + s.id, title: s.title, reading: A.fromStudy(s, {}) }));
  out.push({ id: "jaws", title: "Jaws", estimate: true });
  return out;
};
/* A made-up reading: only what the lab reads (moves, moveCues, runs, seconds). */
const fake = (cues, seconds) => {
  const moves = cues.map((c, i) => ({ from: i % 2 ? "camera" : "feeling", to: i % 2 ? "feeling" : "camera", cue: c.replace(/^quiet-/, ""), quiet: /^quiet-/.test(c), at: i * 5 }));
  return { seconds: seconds || 60, beats: moves.length, stats: { moves, moveCues: {}, familyRuns: [] } };
};

ok("cuelab.js loads with no page, with the five cues and the compare lines", () => {
  assert(L && typeof L.lab === "function");
  assert.deepStrictEqual(Array.from(L.CUES), ["visual", "audio", "thought", "movement", "plot"]);
  assert.strictEqual(L.LOW, 0.75);
  assert.strictEqual(L.HIGH, 1.33);
});

ok("every curated film with a trace gets a row whose counts match attention.js", () => {
  const res = L.lab(readingsWith(A.fromStudy(studies[0], {})), {});
  assert.strictEqual(res.rows.length, studies.length + 1);
  assert(res.rows.length >= 3, "My film and at least two curated films");
  res.rows.forEach((r, i) => {
    const moves = i === 0 ? A.fromStudy(studies[0], {}).stats.moves : A.fromStudy(studies[i - 1], {}).stats.moves;
    assert.strictEqual(r.moves, moves.length, r.title);
    assert.strictEqual(L.CUES.reduce((a, c) => a + r.cues[c].n, 0), r.moves, r.title + " cue counts add up");
    L.CUES.forEach((c) => assert.strictEqual(r.cues[c].n, moves.filter((m) => m.cue === c).length));
    assert.strictEqual(r.quiet + r.action, r.moves);
    assert.strictEqual(r.quiet, moves.filter((m) => m.quiet).length);
    if (r.moves) assert(Math.abs(L.CUES.reduce((a, c) => a + r.cues[c].share, 0) - 1) < 0.01);
  });
  assert.strictEqual(res.rows.filter((r) => r.mine).length, 1);
  assert(res.mine && res.mine.mine);
});

ok("a film with only an estimate gets no numbers: it is listed as no trace yet", () => {
  const res = L.lab(readingsWith(A.fromStudy(studies[0], {})), {});
  assert.deepStrictEqual(JSON.parse(JSON.stringify(res.noTrace)), [{ id: "jaws", title: "Jaws" }]);
  assert(!res.rows.some((r) => r.title === "Jaws"));
});

ok("stops and actions, and moves a minute", () => {
  const res = L.lab([{ id: "m", title: "Mine", mine: true, reading: fake(["visual", "quiet-audio", "quiet-audio", "plot"], 120) }], {});
  const r = res.rows[0];
  assert.strictEqual(r.quiet, 2);
  assert.strictEqual(r.action, 2);
  assert.strictEqual(r.cues.audio.n, 2);
  assert.strictEqual(r.cues.audio.share, 0.5);
  assert.strictEqual(r.perMinute, 2);
});

ok("your film versus your favorites uses the 0.75 and 1.33 lines, in plain sentences", () => {
  /* Mine: 50% visual, 30% audio, 20% thought, no movement, no plot. */
  const mine = fake(["visual", "visual", "visual", "visual", "visual", "audio", "audio", "audio", "thought", "thought"]);
  const fav = { id: "fav", title: "Fav", estimate: false, moveCues: { feeling: { camera: { n: 10, quiet: 0, cues: { visual: 2, audio: 3, thought: 2, movement: 3 } } } } };
  const res = L.lab([{ id: "m", title: "Mine", mine: true, reading: mine }], { profiles: [fav] });
  const v = Object.fromEntries(res.versus.cues.map((c) => [c.cue, c]));
  assert.strictEqual(v.visual.verdict, "more", "50% against 20%");
  assert.strictEqual(v.audio.verdict, "same", "30% against 30%");
  assert.strictEqual(v.thought.verdict, "same", "20% against 20%");
  assert.strictEqual(v.movement.verdict, "less", "0% against 30%");
  assert.strictEqual(v.plot.verdict, "none", "nobody uses plot");
  assert(/^You use visual cues much more than your favorites: 50% of your moves against about 20% of theirs\.$/.test(v.visual.text), v.visual.text);
  assert(/much less/.test(v.movement.text) && /Try moving attention with one\./.test(v.movement.text));
  assert(/about as much/.test(v.audio.text));
  assert(/^Neither your film nor your favorites move attention with a plot cue\.$/.test(v.plot.text), v.plot.text);
  assert(!res.versus.estimate);
  /* Just under and just over the lines. */
  const edge = (m, t) => L.lab([{ id: "m", mine: true, title: "m", reading: fake(Array(m).fill("visual").concat(Array(100 - m).fill("audio"))) }], { profiles: [{ id: "p", moveCues: { a: { b: { n: 100, quiet: 0, cues: { visual: t, audio: 100 - t } } } } }] }).versus.cues[0].verdict;
  assert.strictEqual(edge(29, 40), "less");
  assert.strictEqual(edge(30, 40), "same");
  assert.strictEqual(edge(53, 40), "same");
  assert.strictEqual(edge(54, 40), "more");
  res.versus.cues.forEach((c) => assert(!/—/.test(c.text)));
});

ok("an estimated film compares by its cue shares and is marked as an estimate", () => {
  const res = L.lab([{ id: "m", title: "Mine", mine: true, reading: A.fromStudy(studies[0], {}) }], { profiles: [R.DEFAULT_FILMS[0]] });
  assert(res.versus.estimate);
  assert.strictEqual(res.versus.cues.length, 5);
  assert.strictEqual(res.versus.avg.audio, R.DEFAULT_FILMS[0].cueShare.audio);
  const none = L.lab([{ id: "m", title: "Mine", mine: true, reading: A.fromStudy(studies[0], {}) }], { profiles: [] });
  assert.strictEqual(none.versus.cues.length, 0);
  assert(/Pick films/.test(none.versus.text));
});

ok("steal this move: the moves the curated films make most that My film never makes", () => {
  const mineReading = A.fromStudy(studies[0], {});
  const res = L.lab(readingsWith(mineReading), { beats: studies[0].beats });
  assert(res.steal.length >= 1 && res.steal.length <= 5, "1 to 5 moves: " + res.steal.length);
  const made = mineReading.stats.moveCues;
  res.steal.forEach((s, i) => {
    assert(!(made[s.from] && made[s.from][s.to]), `${s.from} to ${s.to} is never made in My film`);
    if (i) assert(res.steal[i - 1].n >= s.n, "most made first");
    assert(L.CUES.includes(s.cue));
    assert(s.films.length >= 1);
    assert(s.option && s.option.family === s.to && s.curiosity, "a curiosity to make it with");
    assert(s.hold && s.hold.dur > 0, "a moment where attention has held long");
    assert(/Your film never makes this move\.$/.test(s.text) && !/—/.test(s.text) && !/ a audio/.test(s.text), s.text);
  });
  /* Counted over the curated films. */
  const s0 = res.steal[0];
  const count = studies.slice(1).reduce((a, s) => {
    const c = (A.fromStudy(s, {}).stats.moveCues[s0.from] || {})[s0.to];
    return a + (c ? c.n : 0);
  }, 0);
  assert.strictEqual(s0.n, count, "the count is the curated films' own");
  /* A film that makes every move has nothing to steal. */
  const self = L.lab([{ id: "a", title: "A", mine: true, reading: mineReading }, { id: "b", title: "B", reading: mineReading }], {});
  assert.strictEqual(self.steal.length, 0);
});

ok("Make this move here on the engine's film: one undo step, and Undo restores it", () => {
  assert(E.send({ type: "importFilm", film: ctx.CurioSeeds.starter() }).ok);
  const beats = ME.beats();
  const rs = readingsWith(A.read(beats, { secondsPerBeat: 3 }));
  const res = L.lab(rs, { beats, secondsPerBeat: 3 });
  const s = res.steal.find((x) => x.hold && x.hold.row != null);
  assert(s, "a move with an engine moment");
  assert(beats.some((b) => b.row === s.hold.row));
  const mv = ME.moveAt(s.option, s.hold.row);
  assert(mv, "the engine has a move for " + s.to);
  const before = JSON.stringify(ME.beats());
  const undo = E.history().undo.length;
  assert(ME.applyMove(mv).ok);
  assert.strictEqual(E.history().undo.length, undo + 1, "one undo step");
  assert.notStrictEqual(JSON.stringify(ME.beats()), before, "the engine's film changed");
  E.undo();
  assert.strictEqual(JSON.stringify(ME.beats()), before, "Undo takes it back");
});

console.log(`\n${n} cue lab checks passed`);

/* ---------- in a real browser ---------- */
if (args.includes("--browser")) {
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
  (async () => {
    fs.mkdirSync(SHOTS, { recursive: true });
    const server = await serve();
    const base = "http://127.0.0.1:" + server.address().port + "/";
    const browser = await chromium.launch();
    const errors = [];
    const three = arg("--three", "");
    async function newPage(viewport) {
      const page = await browser.newPage({ viewport });
      page.on("pageerror", (e) => errors.push(String(e && e.message)));
      page.on("console", (m) => m.type() === "error" && !/Failed to load resource|favicon|fonts\.g/.test(m.text()) && errors.push(m.text()));
      await page.route(/three\.min\.js$/, (r) => (three ? r.fulfill({ contentType: "text/javascript", body: fs.readFileSync(three, "utf8") }) : r.fulfill({ contentType: "text/javascript", body: "" })));
      await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
      return page;
    }
    async function openApp(page) {
      await page.goto(base + "index.html");
      if (!(await page.evaluate(() => !!document.querySelector('script[src="momentum/load.js"]')))) {
        await page.evaluate(() => {
          const s = document.createElement("script");
          s.src = "momentum/load.js";
          document.body.appendChild(s);
        });
      }
      await page.waitForFunction(() => window.CurioMomentumUI && window.CurioCueLab && window.CurioEngine, null, { timeout: 10000 });
      await page.evaluate(() => window.CurioEngine.send({ type: "importFilm", film: window.CurioSeeds.starter() }));
    }

    const page = await newPage({ width: 1360, height: 900 });
    await openApp(page);
    await page.evaluate(() => document.getElementById("lib-btn").click());
    await page.click("#lib-menu [data-momentum]");
    await page.waitForSelector(".mo-dlg[open]");
    const tabs = await page.$$eval(".mo-dlg .mo-tabs button", (b) => b.map((x) => x.textContent));
    check(tabs[tabs.length - 1] === "Cue lab" || tabs.includes("Cue lab"), "Momentum has a Cue lab tab: " + tabs.join(" / "));
    await page.click('.mo-dlg [data-tab="cuelab"]');
    await page.waitForSelector(".mo-dlg .mcl");
    await page.selectOption(".mo-dlg [data-cl-source]", "engine");
    await page.waitForSelector(".mo-dlg [data-cl-steal]");
    const read = await page.evaluate(() => ({
      rows: [...document.querySelectorAll(".mo-dlg .mcl-table tbody tr")].map((r) => ({ me: r.classList.contains("mcl-me"), text: r.textContent.replace(/\s+/g, " ").trim() })),
      vs: [...document.querySelectorAll(".mo-dlg .mcl-vs li")].map((l) => l.textContent.replace(/\s+/g, " ").trim()),
      steal: document.querySelectorAll(".mo-dlg .mcl-steal li").length,
      buttons: document.querySelectorAll(".mo-dlg [data-cl-steal]").length,
      bars: document.querySelectorAll(".mo-dlg .mcl-chart rect").length,
      labels: [...document.querySelectorAll(".mo-dlg .mcl-chart .mcl-bar-v")].map((t) => t.textContent),
      none: (document.querySelector(".mo-dlg .mcl-none") || {}).textContent || "",
      text: document.querySelector(".mo-dlg .mcl").textContent,
    }));
    check(read.rows.length >= 3 && read.rows.filter((r) => !r.me).length >= 2, `the table has My film and at least two curated films (${read.rows.length} rows)`);
    check(read.rows[0].me && /Your film/.test(read.rows[0].text) && read.rows.filter((r) => r.me).length === 1, "My film's row is marked: " + read.rows[0].text);
    check(read.vs.length === 5 && read.vs.every((t) => /(Much less|About the same|Much more|Neither)/.test(t) && /\.$/.test(t)), "five plain sentences, one per cue: " + read.vs[0]);
    check(read.steal >= 1 && read.steal <= 5 && read.buttons >= 1, `moves to steal (${read.steal}) with buttons (${read.buttons})`);
    check(read.bars === read.rows.length && read.labels.every((l) => /^\d+(\.\d)? a minute$/.test(l)), `a labeled bar for every film (${read.bars})`);
    check(/No trace yet/.test(read.none) && /Pulp Fiction/.test(read.none), "estimated films are listed with no trace yet");
    check(!/—/.test(read.text), "no em-dashes in the tab");
    await page.screenshot({ path: path.join(SHOTS, "cuelab-top.png") });
    await page.evaluate(() => (document.querySelector(".mo-dlg").scrollTop = 900));
    await page.screenshot({ path: path.join(SHOTS, "cuelab-more.png") });

    const film = () => page.evaluate(() => JSON.stringify(window.CurioMomentumEngine.beats()));
    const f0 = await film();
    const u0 = await page.evaluate(() => window.CurioEngine.history().undo.length);
    await page.click(".mo-dlg [data-cl-steal]");
    const f1 = await film();
    const u1 = await page.evaluate(() => window.CurioEngine.history().undo.length);
    const flash = await page.evaluate(() => (document.querySelector(".mo-dlg .mo-flash") || {}).textContent || "");
    check(f1 !== f0, "Make this move here changes the engine's film");
    check(u1 === u0 + 1, `it is one undo step (${u0} to ${u1})`);
    check(/Undo takes it back/.test(flash), "it says what changed: " + flash);
    await page.evaluate(() => (document.querySelector(".mo-dlg").scrollTop = 0));
    await page.screenshot({ path: path.join(SHOTS, "cuelab-after.png") });
    await page.evaluate(() => window.CurioEngine.undo());
    check((await film()) === f0, "one Undo restores the engine's film");

    /* Phone width: no sideways scroll. */
    const phone = await newPage({ width: 375, height: 800 });
    await openApp(phone);
    await phone.evaluate(() => window.CurioMomentumUI.open("cuelab"));
    await phone.waitForSelector(".mo-dlg .mcl");
    await phone.selectOption(".mo-dlg [data-cl-source]", "engine");
    await phone.waitForSelector(".mo-dlg [data-cl-steal]");
    const fit = await phone.evaluate(() => {
      const d = document.querySelector(".mo-dlg");
      return { page: document.documentElement.scrollWidth - window.innerWidth, dlg: d.scrollWidth - d.clientWidth };
    });
    check(fit.page <= 0 && fit.dlg <= 0, `no sideways scroll at phone width (page ${fit.page}px, window ${fit.dlg}px over)`);
    await phone.screenshot({ path: path.join(SHOTS, "cuelab-phone.png") });
    await phone.evaluate(() => (document.querySelector(".mo-dlg").scrollTop = 1000));
    await phone.screenshot({ path: path.join(SHOTS, "cuelab-phone-more.png") });
    await phone.evaluate(() => (document.querySelector(".mo-dlg").scrollTop = 99999));
    await phone.screenshot({ path: path.join(SHOTS, "cuelab-phone-end.png") });

    check(errors.length === 0, "no page errors" + (errors.length ? ": " + errors.slice(0, 3).join(" | ") : ""));
    await browser.close();
    server.close();
    console.log(failed ? `\n${failed} failed` : "\nall cue lab browser checks passed");
    process.exit(failed ? 1 : 0);
  })().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
