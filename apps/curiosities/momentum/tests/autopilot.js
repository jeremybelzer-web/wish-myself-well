/* Autopilot (momentum/autopilot.js): automation patches that move attention off a stretch that runs too long.
   node momentum/tests/autopilot.js                     checks with no page
   NODE_PATH=/opt/node22/lib/node_modules node momentum/tests/autopilot.js --browser --three <three.min.js> --shots <dir>

   With no page: loads the shared core (core/headless.js, the automation and the engine included) and the momentum
   core, sources.js and autopilot.js. Checks that plan() finds every stretch past the limit and proposes one patch
   for each, of another family, that really moves attention there when its values are laid on the film (and that
   the time past the limit goes down); that plan() is pure (the film and the automation are untouched); that
   apply() makes real running CurioAuto patches in one step, undo() puts back the last apply and removeAll()
   every apply, exactly as the patches were; that a Momentum source can drive a patch; and the strip.

   With --browser: the app's page, Momentum, Fix it, Autopilot: the cards, Preview all (two strips), Apply all
   (real running patches), Undo, Apply one, Remove these; no page errors; no sideways scroll at 375 px; no "beat"
   in the tab's text. Screenshots go to --shots. */
const path = require("path");
const fs = require("fs");
const os = require("os");
const vm = require("vm");
const assert = require("assert");

const ROOT = path.join(__dirname, "..", "..");
const args = process.argv.slice(2);
const arg = (n, d) => (args.includes(n) ? args[args.indexOf(n) + 1] : d);

function load(ctx, files) {
  files.forEach((f) => {
    const file = path.join(ROOT, "momentum", f);
    vm.runInContext(fs.readFileSync(file, "utf8"), vm.isContext(ctx) ? ctx : vm.createContext(ctx), { filename: file });
  });
}

function nodeChecks() {
  const core = require(path.join(ROOT, "core", "headless.js")).load();
  const ctx = core.window;
  load(ctx, ["notes.js", "attention.js", "rates.js", "compass.js", "engine-lanes.js", "perform.js", "sources.js", "autopilot.js"]);
  const AP = ctx.CurioAutopilot;
  const Au = ctx.CurioAuto;
  const E = ctx.CurioEngine;
  const A = ctx.CurioAttention;
  const M = ctx.CurioMomentum;
  const ME = ctx.CurioMomentumEngine;
  let n = 0;
  const ok = (name, fn) => {
    fn();
    n++;
    console.log("ok", name);
  };
  assert(E.send({ type: "importFilm", film: ctx.CurioSeeds.starter() }).ok);
  const beats = ME.beats();
  const opts = { secondsPerBeat: 3, limit: 9 };
  const before = A.read(beats, opts);
  assert(before.warnings.length >= 1, "the starter film has a stretch past a 9 second limit");

  /* A made-up film: feeling holds for 15 moments (45 seconds), then plot, then feeling again for 10. */
  const long = [];
  const feel = ["calm", "curious", "tense", "afraid", "angry"];
  for (let i = 0; i < 30; i++) {
    const v = { emotion: feel[i % feel.length], shotSize: "medium" };
    if (i >= 15 && i < 18) v.emotion = "calm";
    long.push({ values: v });
  }
  long[15].values.stakes = 3;

  ok("plan: one proposal for each stretch past the limit, of another family, that moves attention there", () => {
    const p = AP.plan(beats, opts);
    assert(p.proposals.length >= 1, "no proposals");
    p.proposals.forEach((x) => {
      assert(x.run.dur > 9, "each patch answers a stretch past the limit");
      assert(before.warnings.some((w) => x.run.from >= w.from && x.run.from < w.to), "inside a stretch the film has past the limit");
      assert.notStrictEqual(x.family, x.holding, "a different family");
      assert.strictEqual(M.familyOf(x.curiosity), x.family, x.curiosity + " is of " + x.family);
      assert(Au.param(x.key) && Au.param(x.key).level === "curiosity", x.key + " is an automation parameter");
      assert(x.end >= x.at && x.at > 0, "a span of moments inside the film");
      assert(String(x.from) !== String(x.to), "from and to differ");
      assert(!/beat|—|undefined|NaN/.test(x.text + x.why), x.text + " " + x.why);
      const after = A.read(AP.overlay(beats, [x]), opts);
      assert(after.segments.some((g) => g.beat === x.at && g.family === x.family), "attention moves to " + x.family + " at moment " + (x.at + 1));
    });
    assert(p.after.pastLimit < p.before.pastLimit, `less time past the limit (${p.before.pastLimit} then ${p.after.pastLimit})`);
  });
  ok("plan: several stretches get several patches, on different curiosities, checked together", () => {
    const p = AP.plan(long, { secondsPerBeat: 3, limit: 15 });
    const r = A.read(long, { secondsPerBeat: 3, limit: 15 });
    assert(r.warnings.length >= 2, "the made-up film has two long stretches: " + r.warnings.length);
    assert(p.proposals.length >= 2, "two proposals: " + p.proposals.length);
    assert.strictEqual(new Set(p.proposals.map((x) => x.curiosity)).size, p.proposals.length, "one curiosity per patch");
    const all = AP.preview(long, p.proposals, { secondsPerBeat: 3, limit: 15 });
    assert.deepStrictEqual(all.afterNumbers, p.after, "preview of all agrees with the plan");
    assert(all.afterNumbers.pastLimit < all.beforeNumbers.pastLimit);
  });
  ok("plan: a film with nothing past the limit gets no proposals; an empty film neither", () => {
    assert.strictEqual(AP.plan(beats, { secondsPerBeat: 3, limit: 200 }).proposals.length, 0);
    assert.strictEqual(AP.plan([], opts).proposals.length, 0);
  });
  ok("plan is pure: the film, the engine and the automation are untouched", () => {
    const film = JSON.stringify(beats);
    const eng = JSON.stringify(E.state());
    const running = Au.running().length;
    AP.plan(beats, opts);
    AP.preview(beats, AP.plan(beats, opts).proposals, opts);
    assert.strictEqual(JSON.stringify(beats), film);
    assert.strictEqual(JSON.stringify(E.state()), eng);
    assert.strictEqual(Au.running().length, running);
  });
  ok("plan works with stand-ins for the automation (param, domain, between)", () => {
    const p = AP.plan(long, { secondsPerBeat: 3, limit: 15, param: (id) => id === "stakes" || id === "shotSize", domain: (id) => (id === "stakes" ? { kind: "range", min: 0, max: 5 } : { kind: "choice", options: ["insert", "close", "medium", "wide"] }), between: (id, a, b, c) => (c >= 0.5 ? b : a) });
    p.proposals.forEach((x) => assert(["stakes", "shotSize"].includes(x.curiosity)));
  });
  ok("farEnd: the far end of the scale from where it is", () => {
    assert.strictEqual(AP.farEnd({ kind: "range", min: 0, max: 5 }, 1), 5);
    assert.strictEqual(AP.farEnd({ kind: "range", min: 0, max: 5 }, 4), 0);
    assert.strictEqual(AP.farEnd({ kind: "choice", options: ["a", "b", "c"] }, "c"), "a");
    assert.strictEqual(AP.farEnd({ kind: "choice", options: ["a", "b", "c"] }, "zz"), "c");
    assert.strictEqual(AP.farEnd({ kind: "choice", options: ["a"] }, "a"), null);
  });
  ok("strip: one cell per moment with the shared family mark and status", () => {
    const cells = AP.strip(before, beats.length);
    assert.strictEqual(cells.length, beats.length);
    cells.filter((c) => c.family).forEach((c) => {
      const mk = M.mark(c.family);
      assert.strictEqual(c.color, mk.color);
      assert.strictEqual(c.letter, mk.letter);
      assert.strictEqual(c.status.key, M.status(c.held, 9).key);
    });
    assert(cells.some((c) => c.status.key === "over"), "a Too long cell in the starter film");
    const after = AP.preview(beats, AP.plan(beats, opts).proposals, opts);
    assert(after.afterStrip.filter((c) => c.status.key === "over").length < cells.filter((c) => c.status.key === "over").length, "fewer Too long cells with the patches");
    if (after.afterNumbers.overLimit === 0) assert(!after.afterStrip.some((c) => c.status.key === "over"), "no Too long cell when nothing is past the limit");
    /* A family that just took attention has held it for one moment. */
    after.after.segments.forEach((g, k) => k && g.family !== after.after.segments[k - 1].family && assert.strictEqual(after.afterStrip[g.beat].held, 3, "moment " + (g.beat + 1)));
  });
  ok("settings: steady holds the new setting over the moments; a source drives it", () => {
    const x = AP.plan(beats, opts).proposals[0];
    const s = AP.settings(x, "steady");
    assert.deepStrictEqual([s.a, s.b, s.mod, s.manual, s.where.from, s.where.to], [x.from, x.to, "manual", 1, x.at, x.end]);
    assert.strictEqual(AP.settings(x, "momentum:over").mod, "source:momentum:over");
    const d = AP.drivers();
    assert.strictEqual(d[0].id, "steady");
    ["momentum:attention", "momentum:level", "momentum:over"].forEach((id) => assert(d.some((y) => y.id === id), id));
  });
  ok("apply makes real running patches in one step; the patch plays the planned values on its moments", () => {
    AP.removeAll();
    const p = AP.plan(beats, opts);
    const x = p.proposals[0];
    const was = JSON.stringify(Au.patch(x.key));
    const res = AP.apply([x]);
    assert(res.ok && res.keys[0] === x.key);
    assert(Au.running().includes(x.key), "the patch runs");
    const pt = Au.patch(x.key);
    assert.deepStrictEqual([pt.a, pt.b, pt.where.from, pt.where.to], [x.from, x.to, x.at, x.end]);
    const played = Au.resolve(beats.length, 0, {}).panels;
    for (let i = 0; i < beats.length; i++) {
      if (i >= x.at && i <= x.end) assert.strictEqual(String(played[i][x.curiosity]), String(x.to), "moment " + (i + 1));
      else assert.strictEqual(played[i][x.curiosity], undefined, "outside its moments it plays nothing");
    }
    assert.strictEqual(AP.history().length, 1);
    assert.strictEqual(AP.applied()[0].key, x.key);
    assert(AP.undo().ok);
    assert(!Au.running().includes(x.key), "undo stops it");
    assert.strictEqual(JSON.stringify(Au.patch(x.key)), was, "and puts the patch back exactly");
    assert.strictEqual(AP.history().length, 0);
    assert(!AP.undo().ok, "nothing left to undo");
  });
  ok("apply all is one step; undo takes all back; remove these takes back every apply", () => {
    const p = AP.plan(long, { secondsPerBeat: 3, limit: 15 });
    const was = p.proposals.map((x) => JSON.stringify(Au.patch(x.key)));
    assert(AP.apply(p.proposals).ok);
    assert.strictEqual(AP.history().length, 1, "one step");
    p.proposals.forEach((x) => assert(Au.running().includes(x.key)));
    assert(AP.undo().ok);
    p.proposals.forEach((x, i) => assert.strictEqual(JSON.stringify(Au.patch(x.key)), was[i]));
    AP.apply([p.proposals[0]]);
    AP.apply(p.proposals.slice(1), { driver: "momentum:attention" });
    assert.strictEqual(AP.history().length, 2);
    assert.strictEqual(Au.patch(p.proposals[1].key).mod, "source:momentum:attention", "a source drives it");
    const r = AP.removeAll();
    assert(r.ok && r.removed === p.proposals.length);
    p.proposals.forEach((x, i) => {
      assert.strictEqual(JSON.stringify(Au.patch(x.key)), was[i]);
      assert(!Au.running().includes(x.key));
    });
    assert.strictEqual(AP.history().length, 0);
  });
  ok("a patch that was already running before is running again after undo", () => {
    const x = AP.plan(beats, opts).proposals[0];
    Au.set(x.key, { mod: "lfo" });
    Au.start(x.key);
    AP.apply([x]);
    AP.undo();
    assert(Au.running().includes(x.key));
    assert.strictEqual(Au.patch(x.key).mod, "lfo");
    Au.stop(x.key);
  });
  ok("the undo list survives a reload (localStorage)", () => {
    const x = AP.plan(beats, opts).proposals[0];
    AP.apply([x]);
    const saved = JSON.parse(ctx.localStorage.getItem(AP.KEY));
    assert.strictEqual(saved.steps.length, 1);
    assert.strictEqual(saved.steps[0].items[0].key, x.key);
    AP.removeAll();
  });
  ok("plain words in the sentences: no beat, no em-dash (the tab's own text is checked in --browser)", () => {
    AP.plan(long, { secondsPerBeat: 3, limit: 15 }).proposals.forEach((x) => assert(!/\bbeats?\b|—/i.test(x.text + x.why), x.text));
  });
  console.log(`${n} autopilot checks passed`);
}

async function browserChecks() {
  const http = require("http");
  const { chromium } = require("playwright");
  const SHOTS = arg("--shots", os.tmpdir());
  const three = arg("--three", "");
  fs.mkdirSync(SHOTS, { recursive: true });
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
  async function open(viewport) {
    const page = await browser.newPage({ viewport });
    page.on("pageerror", (e) => errors.push(String(e && e.message)));
    page.on("console", (m) => m.type() === "error" && !/Failed to load resource|favicon|fonts\.g/.test(m.text()) && errors.push(m.text()));
    await page.route(/three\.min\.js$/, (r) => r.fulfill({ contentType: "text/javascript", body: three ? fs.readFileSync(three, "utf8") : "" }));
    await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
    await page.goto(base + "index.html");
    if (!(await page.evaluate(() => !!document.querySelector('script[src="momentum/load.js"]'))))
      await page.evaluate(() => {
        const s = document.createElement("script");
        s.src = "momentum/load.js";
        document.body.appendChild(s);
      });
    await page.waitForFunction(() => window.CurioMomentumUI && window.CurioAutopilot && window.CurioEngine && window.CurioAuto, null, { timeout: 15000 });
    /* My film (the engine's example film) read with a 9 second limit, so it has a stretch to fix. */
    await page.evaluate(() => {
      if (!window.CurioEngine.state().rows.length) window.CurioEngine.send({ type: "importFilm", film: window.CurioSeeds.starter() });
      localStorage.removeItem("curiosities-momentum-autopilot-v1");
    });
    await page.evaluate(() => document.getElementById("lib-btn").click());
    await page.click("#lib-menu [data-momentum]");
    await page.waitForSelector(".mo-dlg[open]");
    /* A 9 second limit (set in Attention) so the eight-moment example film has a stretch to fix. */
    await page.click('.mo-dlg [data-tab="attention"]');
    await page.evaluate(() => {
      const el = document.querySelector('.mo-dlg input[data-m="limit"]');
      el.value = "9";
      el.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await page.click('.mo-dlg [data-tab="autopilot"]');
    await page.waitForSelector(".mo-dlg .ap-root");
    await page.selectOption(".mo-dlg [data-ap-source]", "engine");
    await page.waitForSelector(".mo-dlg .ap-card");
    return page;
  }
  const wide = (page) => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  const tabText = (page) => page.evaluate(() => document.querySelector(".mo-dlg .ap-root").innerText);
  try {
    const page = await open({ width: 1360, height: 900 });
    const where = await page.evaluate(() => {
      const b = document.querySelector('.mo-dlg [data-tab="autopilot"]');
      const g = b.closest(".mo-tabgroup");
      return { label: b.textContent.trim(), group: g ? g.textContent : "" };
    });
    ok(where.label === "Autopilot" && /Fix it/.test(where.group), "Autopilot sits in Fix it: " + JSON.stringify(where.label));
    const cards = await page.$$eval(".mo-dlg .ap-card", (l) => l.length);
    ok(cards >= 1, cards + " proposal cards for My film");
    let text = await tabText(page);
    ok(!/\bbeats?\b/i.test(text) && !/undefined|NaN|\[object|—/.test(text), "plain words in the tab");
    await page.click('.mo-dlg [data-ap="look-all"]');
    await page.waitForSelector(".mo-dlg .ap-preview");
    const strips = await page.$$eval(".mo-dlg .ap-preview .ap-strip", (l) => l.map((s) => s.children.length));
    ok(strips.length === 2 && strips[0] === strips[1] && strips[0] > 1, "Preview shows the before and after strips: " + strips.join(" and "));
    const tooLong = await page.$$eval(".mo-dlg .ap-preview .ap-strip", (l) => l.map((s) => (s.textContent.match(/■/g) || []).length));
    ok(tooLong[1] < tooLong[0], `fewer Too long moments with the patches (${tooLong[0]} then ${tooLong[1]})`);
    await page.screenshot({ path: path.join(SHOTS, "autopilot-preview.png"), fullPage: false });
    await page.evaluate(() => document.querySelector(".mo-dlg .ap-list").scrollIntoView());
    await page.screenshot({ path: path.join(SHOTS, "autopilot-cards.png") });

    await page.click('.mo-dlg [data-ap="all"]');
    await page.waitForSelector(".mo-dlg .ap-made li");
    const made = await page.evaluate(() => ({ running: window.CurioAuto.running(), applied: window.CurioAutopilot.applied().map((x) => x.key), flash: (document.querySelector(".mo-dlg .mo-flash") || {}).textContent || "" }));
    ok(made.applied.length === cards && made.applied.every((k) => made.running.includes(k)), "Apply all made real running patches: " + made.applied.join(", "));
    ok(/one step/.test(made.flash), "it says so: " + made.flash);
    await page.screenshot({ path: path.join(SHOTS, "autopilot-applied.png") });
    await page.click('.mo-dlg [data-ap="undo"]');
    await page.waitForTimeout(100);
    const undone = await page.evaluate(() => ({ running: window.CurioAuto.running().length, applied: window.CurioAutopilot.applied().length }));
    ok(undone.running === 0 && undone.applied === 0, "Undo took them back: " + JSON.stringify(undone));
    await page.click('.mo-dlg [data-ap="one"]');
    await page.waitForSelector(".mo-dlg [data-ap='remove']");
    ok((await page.evaluate(() => window.CurioAuto.running().length)) === 1, "Apply this one made one patch");
    await page.click('.mo-dlg [data-ap="remove"]');
    await page.waitForTimeout(100);
    ok((await page.evaluate(() => window.CurioAuto.running().length + window.CurioAutopilot.applied().length)) === 0, "Remove these took it back");
    await page.close();

    const phone = await open({ width: 375, height: 800 });
    await phone.click('.mo-dlg [data-ap="look-all"]');
    await phone.waitForSelector(".mo-dlg .ap-preview");
    const w = await wide(phone);
    ok(w <= 1, `no sideways scroll at 375 px (${w})`);
    await phone.screenshot({ path: path.join(SHOTS, "autopilot-phone.png") });
    await phone.evaluate(() => document.querySelector(".mo-dlg .ap-preview").scrollIntoView());
    await phone.screenshot({ path: path.join(SHOTS, "autopilot-phone-preview.png") });
    /* A curated film: the cards or the nothing-to-do line, and the plain note that it does not play the automation. */
    await phone.evaluate(() => {
      const s = document.querySelector(".mo-dlg [data-ap-source]");
      const opt = [...s.options].find((o) => o.value.startsWith("study:"));
      if (opt) {
        s.value = opt.value;
        s.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });
    text = await tabText(phone);
    ok(/does not play the automation/.test(text) && !/\bbeats?\b/i.test(text), "a curated film says plainly the preview is what would happen");
    ok((await wide(phone)) <= 1, "no sideways scroll with a curated film");
    await phone.screenshot({ path: path.join(SHOTS, "autopilot-phone-study.png") });
    ok(errors.length === 0, "no page errors" + (errors.length ? ": " + errors.slice(0, 3).join(" | ") : ""));
  } catch (e) {
    console.log("FAIL " + (e && e.stack));
    failed++;
  } finally {
    await browser.close();
    server.close();
  }
  if (failed) {
    console.log(failed + " browser checks failed");
    process.exit(1);
  }
  console.log("autopilot browser checks passed");
}

nodeChecks();
if (args.includes("--browser")) browserChecks();
