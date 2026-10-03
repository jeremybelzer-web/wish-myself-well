/* Three films, with no page and in a real browser:
     node apps/curiosities/momentum/tests/three.js
     NODE_PATH=/opt/node22/lib/node_modules node apps/curiosities/momentum/tests/three.js --browser [--three <three.min.js>] [--shots <dir>]
   With no page: loads the shared core and the curiosity database (as tests/run.js does), the momentum core and
   three.js, then checks the three ribbons (Same length and Real time), the meter numbers, the shared cursor's
   lines, and Blend (made-up films where both agree and where they disagree, then curated films against the
   engine's film, where a Blend move is one undo step).
   With --browser: opens the app's index.html, opens Momentum, the "Three films" tab, checks the three ribbons,
   the shared cursor on all three, a Blend move and one Undo, no page errors, and a phone width with no sideways
   scroll. Screenshots go to --shots (default: the system temp folder). */
const path = require("path");
const fs = require("fs");
const vm = require("vm");
const os = require("os");
const assert = require("assert");

const args = process.argv.slice(2);
const arg = (n, d) => (args.includes(n) ? args[args.indexOf(n) + 1] : d);
const ROOT = path.join(__dirname, "..", "..");

function nodeChecks() {
  const core = require(path.join(ROOT, "core", "headless.js")).load();
  const ctx = core.window;
  ["notes.js", "attention.js", "rates.js", "compass.js", "engine-lanes.js", "three.js"].forEach((f) => {
    const file = path.join(ROOT, "momentum", f);
    vm.runInContext(fs.readFileSync(file, "utf8"), vm.isContext(ctx) ? ctx : vm.createContext(ctx), { filename: file });
  });
  const T = ctx.CurioThree;
  const A = ctx.CurioAttention;
  let n = 0;
  const ok = (name, fn) => {
    fn();
    n++;
    console.log("ok", name);
  };
  const studies = core.CuriosityDB.studiesExport().studies;
  const same = (a, b) => assert.strictEqual(JSON.stringify(a), JSON.stringify(b));
  const noDash = (s) => assert(!/—|–/.test(s), "a dash in: " + s);

  /* A made-up reading: segments as [family, from, to, cue] (the first cue is ignored). */
  function fake(list, opts) {
    const segments = list.map(([family, from, to, cue, label], i) => ({ curiosity: family + "X", label: label || family + " thing", family, cue: cue || "visual", quiet: false, from, to, dur: to - from, beat: i }));
    const moves = segments.slice(1).filter((s, i) => s.family !== segments[i].family).map((s) => ({ from: segments[segments.indexOf(s) - 1].family, to: s.family, cue: s.cue, quiet: false, at: s.from, curiosity: s.curiosity, label: s.label }));
    const seconds = segments[segments.length - 1].to;
    const runs = A.familyRuns(segments);
    return { segments, seconds, beats: (opts && opts.beats) || segments.length, limit: 20, warnings: [], stats: { switchesPerMinute: Math.round((moves.length / seconds) * 600) / 10, medianDwell: 5, longestDwell: 10, momentum: 2.5, moves, familyRuns: runs } };
  }

  ok("three.js loads as part of the core with no page", () => {
    assert(T && typeof T.three === "function" && typeof T.at === "function" && typeof T.blend === "function");
    same(Array.from(T.WINDOWS), [0.06, 0.1, 0.15]);
  });
  ok("status marks: ● Fresh, ▲ Getting long, ■ Too long, against the limit", () => {
    assert.strictEqual(T.status(5, 20).icon + T.status(5, 20).text, "●Fresh");
    assert.strictEqual(T.status(18, 20).icon + T.status(18, 20).text, "▲Getting long");
    assert.strictEqual(T.status(30, 20).icon + T.status(30, 20).text, "■Too long");
  });

  const ra = A.fromStudy(studies[0], {});
  const rb = A.fromStudy(studies[1], {});
  const rc = A.fromStudy(studies[2], {});
  ok("Same length: three ribbons, each from 0 to 1, segments in order, with their meter numbers", () => {
    const r = T.three([ra, rb, rc], { names: ["A film", "B film", "Mine"] });
    assert.strictEqual(r.mode, "same");
    assert.strictEqual(r.films.length, 3);
    same(r.films.map((f) => f.role), ["a", "b", "mine"]);
    same(r.films.map((f) => f.name), ["A film", "B film", "Mine"]);
    r.films.forEach((f, i) => {
      const rd = [ra, rb, rc][i];
      assert.strictEqual(f.width, 1);
      assert.strictEqual(f.segments.length, rd.segments.length);
      assert.strictEqual(f.segments[0].x0, 0);
      assert(Math.abs(f.segments[f.segments.length - 1].x1 - 1) < 0.001, "ends at the right edge");
      f.segments.forEach((g, k) => assert(g.x1 >= g.x0 && (k === 0 || g.x0 >= f.segments[k - 1].x0)));
      assert.strictEqual(f.meter.movesPerMinute, rd.stats.switchesPerMinute);
      assert.strictEqual(f.meter.usualHold, rd.stats.medianDwell);
      assert.strictEqual(f.meter.longestHold, Math.round(Math.max(...rd.stats.familyRuns.map((g) => g.dur)) * 10) / 10);
      assert(["●", "▲", "■"].includes(f.meter.status.icon));
      assert(f.meter.momentum >= 0 && f.meter.momentum <= 5);
    });
  });
  ok("Real time: one clock, the longest film fills the width and shorter ones end early", () => {
    const short = A.fromStudy(studies.find((s) => s.id === "model-kitchen-disaster") || studies[4], {});
    const r = T.three([ra, rb, short], { mode: "real" });
    assert.strictEqual(r.mode, "real");
    assert.strictEqual(r.span, Math.max(ra.seconds, rb.seconds, short.seconds));
    assert.strictEqual(r.films[0].width, 1);
    assert(Math.abs(r.films[2].width - short.seconds / r.span) < 0.001);
    const last = r.films[2].segments[r.films[2].segments.length - 1];
    assert(Math.abs(last.x1 - r.films[2].width) < 0.001, "the short film's ribbon ends at its own width");
  });
  ok("the shared cursor: one line per film at the same point, naming what holds attention and its cue", () => {
    const lines = T.at([ra, rb, rc], 0.5, { names: ["A film", "B film", "Mine"] });
    assert.strictEqual(lines.length, 3);
    lines.forEach((l, i) => {
      const rd = [ra, rb, rc][i];
      assert(Math.abs(l.t - rd.seconds / 2) < 0.1, "the same share of the way in");
      assert(l.label && l.family && !l.ended);
      const seg = rd.segments.find((g) => rd.seconds / 2 >= g.from && rd.seconds / 2 < g.to);
      assert.strictEqual(l.label, seg.label);
      assert(l.text.includes(seg.label) && /50% in/.test(l.text) && /(brought by an? [a-z ]+ cue|since the start)/.test(l.text), l.text);
      assert(["●", "▲", "■"].includes(l.status.icon));
      noDash(l.text);
    });
    const real = T.at([ra, rb, A.fromStudy(studies.find((s) => s.id === "model-kitchen-disaster") || studies[4], {})], 0.9, { mode: "real", names: ["A", "B", "Short"] });
    assert(real[2].ended && /has ended/.test(real[2].text), real[2].text);
    assert.strictEqual(real[0].t, real[1].t, "one clock for all three");
  });

  ok("Blend: both films move to the same family where yours holds, so it suggests that move and its cue", () => {
    const a = fake([["feeling", 0, 50], ["comedy", 50, 100, "thought"]]);
    const b = fake([["voice", 0, 27], ["comedy", 27, 52, "thought"], ["voice", 52, 54, "audio"]]);
    const mine = fake([["feeling", 0, 100]], { beats: 10 });
    const out = T.blend([a, b, mine], { names: ["Alpha", "Beta"], rows: ["r1", "r2", "r3", "r4", "r5", "r6", "r7", "r8", "r9", "r10"] });
    const s = out.find((x) => Math.abs(x.p - 0.5) < 0.02);
    assert(s, "a suggestion halfway: " + JSON.stringify(out.map((x) => x.p)));
    assert.strictEqual(s.agree, "same");
    assert(s.together);
    assert.strictEqual(s.options.length, 1);
    assert.strictEqual(s.options[0].family, "comedy");
    assert.strictEqual(s.options[0].cue, "thought");
    same(s.options[0].by, ["a", "b"]);
    assert.strictEqual(s.holding.family, "feeling");
    assert.strictEqual(s.row, "r6");
    assert(/both Alpha and Beta move attention to Comedy with a thought cue/.test(s.text) && /Move it to Comedy here/.test(s.text), s.text);
    noDash(s.text);
  });
  ok("Blend: when the two films move to different families, it says so and offers both", () => {
    const a = fake([["feeling", 0, 40], ["comedy", 40, 100, "thought"]]);
    const b = fake([["feeling", 0, 42], ["music", 42, 100, "audio"]]);
    const mine = fake([["voice", 0, 100]]);
    const out = T.blend([a, b, mine], { names: ["Alpha", "Beta"] });
    const s = out.find((x) => x.together);
    assert(s && s.agree === "split", JSON.stringify(out));
    same(s.options.map((o) => o.family), ["comedy", "music"]);
    assert(/disagree/.test(s.text) && /try Comedy or Music/.test(s.text), s.text);
  });
  ok("Blend: no suggestion where your film already moves, or toward the family it already holds", () => {
    const a = fake([["feeling", 0, 50], ["comedy", 50, 100, "thought"]]);
    const b = fake([["feeling", 0, 50], ["comedy", 50, 100, "thought"]]);
    const moving = fake([["feeling", 0, 49], ["voice", 49, 100, "audio"]]);
    assert(!T.blend([a, b, moving], {}).some((s) => Math.abs(s.p - 0.5) < 0.1), "your film moves there");
    const holdsComedy = fake([["comedy", 0, 100]]);
    assert.strictEqual(T.blend([a, b, holdsComedy], {}).length, 0, "your film already holds on Comedy");
    same(T.blend([a, b, { segments: [], seconds: 0, stats: {} }], {}), []);
  });
  ok("Blend on curated films: at most 5 suggestions in time order, each where your film holds", () => {
    let checked = 0;
    for (let i = 0; i < studies.length; i++)
      for (let j = 0; j < studies.length; j++) {
        if (i === j) continue;
        const k = studies.findIndex((s, x) => x !== i && x !== j && A.fromStudy(s, {}).segments.length);
        const read = [i, j, k].map((x) => A.fromStudy(studies[x], {}));
        const out = T.blend(read, { names: ["A", "B"] });
        assert(out.length <= 5);
        out.forEach((s, x) => {
          assert(x === 0 || s.p >= out[x - 1].p, "in time order");
          assert(s.p > 0 && s.p < 1);
          assert(["same", "family", "split", "one"].includes(s.agree));
          s.options.forEach((o) => assert(o.family !== s.holding.family));
          const mineMoves = read[2].stats.moves.map((m) => m.at / read[2].seconds);
          assert(!mineMoves.some((m) => Math.abs(m - s.p) <= 0.06 - 1e-9), "your film moves near " + s.p);
          noDash(s.text);
        });
        checked++;
      }
    assert(checked > 10);
  });

  ok("Blend against the engine's film: 3 to 5 suggestions with engine rows, and a move is one undo step", () => {
    const E = ctx.CurioEngine;
    const ME = ctx.CurioMomentumEngine;
    assert(E.send({ type: "importFilm", film: ctx.CurioSeeds.starter() }).ok);
    const rows = ME.beats().map((b) => b.row);
    const r = T.three([ra, rb, ME.reading({})], { names: ["A", "B", "My film"], rows });
    assert(r.blend.length >= 3 && r.blend.length <= 5, "count " + r.blend.length);
    r.blend.forEach((s) => assert(rows.includes(s.row), "row " + s.row));
    const s = r.blend[0];
    const before = JSON.stringify(ME.beats());
    const u0 = E.history().undo.length;
    const mv = ME.moveAt({ family: s.options[0].family, curiosity: s.options[0].curiosity }, s.row);
    assert(mv, "the engine has a move for " + s.options[0].family);
    assert(ME.applyMove(mv).ok !== false);
    assert.strictEqual(E.history().undo.length, u0 + 1, "one undo step");
    assert.notStrictEqual(JSON.stringify(ME.beats()), before);
    E.undo();
    assert.strictEqual(JSON.stringify(ME.beats()), before, "Undo takes it back");
  });
  console.log(`\n${n} three films checks passed`);
}

async function browserChecks() {
  const http = require("http");
  const { chromium } = require("playwright");
  const SHOTS = arg("--shots", os.tmpdir());
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
  let failed = 0;
  const ok = (cond, text) => {
    console.log((cond ? "ok   " : "FAIL ") + text);
    if (!cond) failed++;
  };
  fs.mkdirSync(SHOTS, { recursive: true });
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
    await page.waitForFunction(() => window.CurioMomentumUI && window.CurioThree && window.CurioEngine, null, { timeout: 10000 });
    /* The engine's film, so "Your film" defaults to it. */
    await page.evaluate(() => {
      if (!window.CurioMomentumEngine.available()) window.CurioEngine.send({ type: "importFilm", film: window.CurioSeeds.starter() });
    });
  }

  const page = await newPage({ width: 1360, height: 900 });
  await openApp(page);
  await page.evaluate(() => document.getElementById("lib-btn").click());
  await page.click("#lib-menu [data-momentum]");
  await page.waitForSelector(".mo-dlg[open]");
  ok(!!(await page.$('.mo-dlg [data-tab="three"]')), 'Momentum has a "Three films" tab');
  await page.click('.mo-dlg [data-tab="three"]');
  await page.waitForSelector(".mo-dlg .m3");
  const first = await page.evaluate(() => ({
    ribs: document.querySelectorAll(".mo-dlg .m3-rib").length,
    segs: [...document.querySelectorAll(".mo-dlg .m3-rib")].map((r) => r.querySelectorAll(".m3-seg").length),
    picks: [...document.querySelectorAll(".mo-dlg [data-m3-pick]")].map((s) => s.value),
    nums: document.querySelectorAll(".mo-dlg .m3-nums").length,
    marks: [...document.querySelectorAll(".mo-dlg .m3-nums .mo-status")].map((s) => s.textContent.trim()),
    sugg: document.querySelectorAll(".mo-dlg .m3-sugg").length,
    moves: document.querySelectorAll(".mo-dlg [data-m3-move]").length,
    text: document.querySelector(".mo-dlg .m3").textContent,
  }));
  ok(first.ribs === 3 && first.segs.every((n) => n > 0), `three ribbons with segments (${first.segs.join(", ")})`);
  ok(first.picks[0].startsWith("study:") && first.picks[1].startsWith("study:") && first.picks[0] !== first.picks[1] && first.picks[2] === "engine", "defaults: two curated films and the engine's film: " + first.picks.join(", "));
  ok(first.nums === 3 && first.marks.length === 3 && first.marks.every((m) => /^(● Fresh|▲ Getting long|■ Too long)$/.test(m)), "meter numbers under each ribbon: " + first.marks.join(" / "));
  ok(first.sugg >= 3 && first.sugg <= 5 && first.moves >= first.sugg, `Blend lists ${first.sugg} suggestions with ${first.moves} buttons`);
  ok(!/—/.test(first.text), "no em-dashes in the tab");

  /* The shared cursor: hover the middle ribbon. */
  const box = await page.$eval(".mo-dlg .m3-rib[data-m3-rib='1']", (r) => {
    r.scrollIntoView({ block: "center" });
    const b = r.getBoundingClientRect();
    return { x: b.left, y: b.top, w: b.width, h: b.height };
  });
  await page.mouse.move(box.x + box.w * 0.4, box.y + box.h / 2);
  const cur = await page.evaluate(() => ({
    shown: [...document.querySelectorAll(".mo-dlg .m3-cur")].map((c) => !c.hidden && getComputedStyle(c).display !== "none"),
    lefts: [...document.querySelectorAll(".mo-dlg .m3-cur")].map((c) => Math.round(c.getBoundingClientRect().left)),
    lines: [...document.querySelectorAll(".mo-dlg .m3-lines li")].map((l) => l.textContent.replace(/\s+/g, " ").trim()),
  }));
  ok(cur.shown.length === 3 && cur.shown.every(Boolean), "hovering one ribbon shows the cursor on all three");
  ok(Math.max(...cur.lefts) - Math.min(...cur.lefts) <= 1, "the cursor sits at the same point on all three: " + cur.lefts.join(", "));
  ok(cur.lines.length === 3 && cur.lines.every((l) => /40% in/.test(l) && /holds attention/.test(l)), "one line of text per film:\n    " + cur.lines.join("\n    "));
  await page.screenshot({ path: path.join(SHOTS, "three-cursor.png") });

  /* Real time. */
  await page.click(".mo-dlg [data-m3-mode='real']");
  await page.waitForSelector(".mo-dlg [data-m3-mode='real'][aria-pressed='true']");
  const widths = await page.$$eval(".mo-dlg .m3-rib", (rs) => rs.map((r) => Math.max(...[...r.querySelectorAll(".m3-seg")].map((s) => s.getBoundingClientRect().right)) - r.getBoundingClientRect().left));
  const full = await page.$eval(".mo-dlg .m3-rib", (r) => r.clientWidth);
  ok(Math.max(...widths) >= full - 3 && Math.min(...widths) < full * 0.5, `Real time: the longest film fills the width, the engine's short film ends early (${widths.map(Math.round).join(", ")} of ${full})`);
  await page.evaluate(() => (document.querySelector(".mo-dlg").scrollTop = 0));
  await page.screenshot({ path: path.join(SHOTS, "three-real-time.png") });
  await page.click(".mo-dlg [data-m3-mode='same']");

  /* Blend: make a move, then one undo. */
  const beats = () => page.evaluate(() => JSON.stringify(window.CurioMomentumEngine.beats()));
  const b0 = await beats();
  const u0 = await page.evaluate(() => window.CurioEngine.history().undo.length);
  await page.$eval(".mo-dlg [data-m3-move]", (b) => b.scrollIntoView({ block: "center" }));
  await page.screenshot({ path: path.join(SHOTS, "three-blend.png") });
  await page.click(".mo-dlg [data-m3-move]");
  const u1 = await page.evaluate(() => window.CurioEngine.history().undo.length);
  const flash = await page.evaluate(() => (document.querySelector(".mo-dlg .mo-flash") || {}).textContent || "");
  ok(u1 === u0 + 1, `Make this move here is one undo step (${u0} to ${u1})`);
  ok((await beats()) !== b0, "the engine's film changed");
  ok(/Undo takes it back/.test(flash), "it says what changed: " + flash);
  await page.evaluate(() => (document.querySelector(".mo-dlg").scrollTop = 0));
  await page.screenshot({ path: path.join(SHOTS, "three-after-move.png") });
  await page.evaluate(() => window.CurioEngine.undo());
  ok((await beats()) === b0, "one Undo restores the film");

  /* Phone width: the ribbons stack and stay readable, no sideways scroll. */
  const phone = await newPage({ width: 375, height: 800 });
  await openApp(phone);
  await phone.evaluate(() => window.CurioMomentumUI.open("three"));
  await phone.waitForSelector(".mo-dlg .m3-rib");
  const rb = await phone.$eval(".mo-dlg .m3-rib[data-m3-rib='2']", (r) => {
    r.scrollIntoView({ block: "center" });
    const b = r.getBoundingClientRect();
    return { x: b.left, y: b.top, w: b.width, h: b.height };
  });
  await phone.mouse.click(rb.x + rb.w * 0.6, rb.y + rb.h / 2);
  const fit = await phone.evaluate(() => {
    const d = document.querySelector(".mo-dlg");
    return { page: document.documentElement.scrollWidth - window.innerWidth, dlg: d.scrollWidth - d.clientWidth, ribs: [...document.querySelectorAll(".mo-dlg .m3-rib")].map((r) => Math.round(r.getBoundingClientRect().width)), lines: document.querySelectorAll(".mo-dlg .m3-lines li").length };
  });
  ok(fit.page <= 0 && fit.dlg <= 0, `no sideways scroll at phone width (page ${fit.page}px, window ${fit.dlg}px over)`);
  ok(fit.ribs.length === 3 && fit.ribs.every((w) => w >= 250), "the ribbons stay wide enough to read: " + fit.ribs.join(", "));
  ok(fit.lines === 3, "tapping a ribbon reads all three films");
  await phone.$eval(".mo-dlg .m3-stack", (r) => r.scrollIntoView({ block: "start" }));
  await phone.screenshot({ path: path.join(SHOTS, "three-phone.png") });
  await phone.$eval(".mo-dlg .m3-read", (r) => r.scrollIntoView({ block: "start" }));
  await phone.screenshot({ path: path.join(SHOTS, "three-phone-more.png") });

  ok(errors.length === 0, "no page errors" + (errors.length ? ": " + errors.slice(0, 3).join(" | ") : ""));
  await browser.close();
  server.close();
  console.log(failed ? `\n${failed} failed` : "\nall three films browser checks passed");
  return failed;
}

if (args.includes("--browser"))
  browserChecks()
    .then((f) => process.exit(f ? 1 : 0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
else nodeChecks();
