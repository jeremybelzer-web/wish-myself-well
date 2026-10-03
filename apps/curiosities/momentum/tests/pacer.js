/* Pace it (momentum/pacer.js): node apps/curiosities/momentum/tests/pacer.js [--browser] [--three <three.min.js>] [--shots <dir>]
   1. With no page: the plan for a film that holds one family too long adds moves, the plan for a rushed film
      lets moments rest, plan() never touches the engine, the after numbers are the film read again with the
      changes, any ticked subset previews exactly, and applying is one undo step named "Momentum: pace like ...".
   2. With --browser (needs Playwright and Chromium; set NODE_PATH): the app, Momentum, the "Pace it" tab, a
      strength choice, unticking a change, Apply as one undo step, no page errors, no sideways scroll at 375px,
      and screenshots in --shots (default: the system temp folder). */
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
["notes.js", "attention.js", "rates.js", "compass.js", "engine-lanes.js", "pacer.js"].forEach((f) => {
  const file = path.join(ROOT, "momentum", f);
  vm.runInContext(fs.readFileSync(file, "utf8"), vm.isContext(ctx) ? ctx : vm.createContext(ctx), { filename: file });
});
const E = ctx.CurioEngine;
const P = ctx.CurioPacer;
const R = ctx.CurioRates;
const A = ctx.CurioAttention;
const ME = ctx.CurioMomentumEngine;
const film = (id) => R.DEFAULT_FILMS.find((f) => f.id === id);
const nowNumbers = (o) => P.numbers(A.read(ME.beats(), o));
let n = 0;
const ok = (name, fn) => {
  fn();
  n++;
  console.log("ok", name);
};

ok("a film that holds one family too long gets moves, and planning never touches the engine", () => {
  assert(E.send({ type: "importFilm", film: ctx.CurioSeeds.starter() }).ok);
  const fp = E.fingerprint();
  const undo = E.history().undo.length;
  const p = P.plan(E, [film("fury-road")], { strength: "strong" });
  assert.strictEqual(E.fingerprint(), fp, "the engine is untouched");
  assert.strictEqual(E.history().undo.length, undo);
  assert(p.changes.length >= 1, "some change");
  assert(p.before.overLimit >= 1, "the starter holds a family past Fury Road's limit");
  assert(p.after.overLimit < p.before.overLimit, `fewer stretches past the limit (${p.before.overLimit} to ${p.after.overLimit})`);
  assert(p.after.longestStretch < p.before.longestStretch);
  const rows = E.state().rows.map((r) => r.id);
  p.changes.forEach((c) => {
    assert.strictEqual(c.kind, "move");
    assert(rows.includes(c.row) && c.track && c.curiosity && c.value != null, "change shape");
    assert(/^At .+ \(\d+:\d\d\), /.test(c.text), c.text);
    assert(c.reason.length > 40 && !/—/.test(c.reason + c.text), "plain reason, no em-dash");
    assert(c.commands.every((m) => ["addCuriosity", "setPoint", "laneMode"].includes(m.type)));
  });
  /* The after numbers equal the film read again with every change. */
  assert.deepStrictEqual(P.preview(E, p.changes, { limit: p.limit }), p.after);
});
ok("strength sets how many changes: gentle at most 2, strong at most 8, never fewer than gentle", () => {
  const g = P.plan(E, [film("fury-road")], { strength: "gentle", limit: 6 });
  const s = P.plan(E, [film("fury-road")], { strength: "strong", limit: 6 });
  assert(g.changes.length <= 2 && s.changes.length <= 8 && s.changes.length >= g.changes.length, `${g.changes.length} and ${s.changes.length}`);
});
ok("each change keeps the rest of its column as it was before its moment", () => {
  const p = P.plan(E, [film("fury-road")], { strength: "strong", limit: 6 });
  const st = E.state();
  p.changes.forEach((c) => {
    const one = P.preview(E, [c], {});
    assert(one, "previews");
    const idx = st.rows.findIndex((r) => r.id === c.row);
    if (c.commands[0].type === "addCuriosity") return;
    const was = st.rows.map((r) => String(E.value(r.id, c.track, c.curiosity)));
    E.send({ type: "batch", label: "probe", commands: c.commands });
    for (let i = 0; i < idx; i++) assert.strictEqual(String(E.value(st.rows[i].id, c.track, c.curiosity)), was[i], "row " + i + " kept");
    const last = st.rows.length - 1;
    if (idx < last && was[last] !== was[idx]) assert.strictEqual(String(E.value(st.rows[last].id, c.track, c.curiosity)), was[last], "the column's own later change is kept");
    assert.strictEqual(String(E.value(c.row, c.track, c.curiosity)), String(c.value), "the node is there");
    E.undo();
  });
});
ok("apply sends the ticked changes as one batch, one undo step, and the film then reads as the preview said", () => {
  const p = P.plan(E, [film("fury-road")], { strength: "strong" });
  const fp = E.fingerprint();
  const before = E.history().undo.length;
  const some = p.changes.slice(0, 1);
  const want = P.preview(E, some, { limit: p.limit });
  const res = P.apply(some, p.title);
  assert(res.ok, res.error);
  assert.strictEqual(E.history().undo.length, before + 1);
  assert.strictEqual(E.history().undo.slice(-1)[0], "Momentum: pace like Mad Max: Fury Road");
  assert.deepStrictEqual(nowNumbers({ secondsPerBeat: 3, limit: p.limit }), want);
  E.undo();
  assert.strictEqual(E.fingerprint(), fp, "undo takes it all back");
  assert(!P.apply([], "x").ok, "nothing ticked is refused");
});
ok("a rushed film gets moments to rest, clearly marked, and attention moves less often after", () => {
  const st = ctx.CurioSeeds.starter();
  st.rows = Array.from({ length: 12 }, (_, i) => ({ id: "r" + (i + 1), label: "Moment " + (i + 1) }));
  /* The shot size and a character's movement take turns changing at every moment: attention moves every 3 seconds. */
  const sizes = ["wide", "close"].map((v) => ctx.CurioScale.fix("shotSize", v));
  st.source = {};
  let size = 0;
  let move = 1;
  st.rows.forEach((r, i) => {
    if (i % 2 === 0) size = 1 - size;
    else move = move === 1 ? 4 : 1;
    st.source[r.id + "|camera|shotSize"] = sizes[size];
    st.source[r.id + "|char1|gesture"] = ctx.CurioScale.fix("gesture", move);
  });
  assert(E.send({ type: "importFilm", film: st }).ok);
  const p = P.plan(E, [film("spirited-away")], { strength: "medium" });
  assert(p.before.movesPerMinute > film("spirited-away").switchesPerMinute * 1.33, "the film is rushed: " + p.before.movesPerMinute);
  const rests = p.changes.filter((c) => c.kind === "rest");
  assert(rests.length >= 1, "a moment to rest");
  rests.forEach((c) => {
    assert(/^Let this moment rest: /.test(c.text), c.text);
    assert(/rushed/.test(c.reason));
    assert.notStrictEqual(String(c.value), String(c.from));
  });
  assert(p.after.movesPerMinute < p.before.movesPerMinute, `${p.before.movesPerMinute} to ${p.after.movesPerMinute}`);
  assert(p.after.overLimit <= p.before.overLimit, "resting never makes a stretch too long");
  const res = P.apply(p.changes, p.title);
  assert(res.ok, res.error);
  assert.deepStrictEqual(nowNumbers({ secondsPerBeat: 3, limit: p.limit }), p.after);
  E.undo();
});
ok("a plan works on an engine state too, and with no target or no film it plans nothing", () => {
  const p = P.plan(E.state(), [film("pulp-fiction"), film("jaws")], {});
  assert.strictEqual(p.title, "Average of 2 films");
  assert(p.before && p.after);
  assert.strictEqual(P.plan(E, [], {}).changes.length, 0);
  assert.strictEqual(P.plan({ rows: [], tracks: [] }, [film("jaws")], {}).changes.length, 0);
});
console.log(`\n${n} pace-it checks passed`);

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
  (async () => {
    const server = await serve();
    const base = "http://127.0.0.1:" + server.address().port + "/";
    const browser = await chromium.launch();
    const errors = [];
    const three = arg("--three", "");
    async function open(viewport) {
      const page = await browser.newPage({ viewport });
      page.on("pageerror", (e) => errors.push(String(e && e.message)));
      page.on("console", (m) => m.type() === "error" && !/Failed to load resource|favicon|fonts\.g/.test(m.text()) && errors.push(m.text()));
      await page.route(/three\.min\.js$/, (r) => (three ? r.fulfill({ contentType: "text/javascript", body: fs.readFileSync(three, "utf8") }) : r.fulfill({ contentType: "text/javascript", body: "" })));
      await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
      await page.goto(base + "index.html");
      if (!(await page.evaluate(() => !!document.querySelector('script[src="momentum/load.js"]'))))
        await page.evaluate(() => {
          const s = document.createElement("script");
          s.src = "momentum/load.js";
          document.body.appendChild(s);
        });
      await page.waitForFunction(() => window.CurioMomentumUI && window.CurioPacer && window.CurioEngine, null, { timeout: 10000 });
      await page.evaluate(() => window.CurioEngine.send({ type: "importFilm", film: window.CurioSeeds.starter() }));
      await page.evaluate(() => {
        document.getElementById("lib-btn").click();
      });
      await page.click("#lib-menu [data-momentum]");
      await page.waitForSelector(".mo-dlg[open]");
      /* A short limit (6 seconds, set in Attention) so the eight-moment starter film has stretches to pace. */
      await page.click('.mo-dlg [data-tab="attention"]');
      await page.evaluate(() => {
        const el = document.querySelector('.mo-dlg input[data-m="limit"]');
        el.value = "6";
        el.dispatchEvent(new Event("change", { bubbles: true }));
      });
      await page.click('.mo-dlg [data-tab="pace"]');
      await page.waitForSelector(".mo-dlg .pc-root");
      return page;
    }
    const page = await open({ width: 1360, height: 900 });
    check(await page.evaluate(() => document.querySelector('.mo-dlg [data-tab="pace"]').textContent === "Pace it"), 'the Momentum window has a "Pace it" tab');
    /* A film to pace like that gives changes. */
    const likes = await page.$$eval('.mo-dlg select[data-pc="like"] option', (o) => o.map((x) => x.value));
    let found = false;
    for (const id of likes) {
      await page.selectOption('.mo-dlg select[data-pc="like"]', id);
      await page.click('.mo-dlg input[data-pc="strength"][value="strong"]');
      if ((await page.$$(".mo-dlg .pc-change")).length >= 2) {
        found = id;
        break;
      }
    }
    check(!!found, "a film to pace like gives at least two planned changes: " + found);
    await page.screenshot({ path: path.join(SHOTS, "pacer-plan.png") });
    const gentle = await (async () => {
      await page.click('.mo-dlg input[data-pc="strength"][value="gentle"]');
      const g = (await page.$$(".mo-dlg .pc-change")).length;
      await page.click('.mo-dlg input[data-pc="strength"][value="strong"]');
      return g;
    })();
    check(gentle <= 2, `gentle plans at most two changes (${gentle})`);
    const count = (await page.$$(".mo-dlg .pc-change")).length;
    /* Untick the last one: the after column changes to the preview of the rest. */
    await page.click(`.mo-dlg [data-pc-tick="${count - 1}"]`);
    const label = await page.$eval('.mo-dlg [data-pc="apply"]', (b) => b.textContent);
    check(label === `Apply the ticked changes (${count - 1})`, "unticking a change updates the button: " + label);
    const promised = await page.$$eval(".mo-dlg .pc-nums tbody tr", (rows) => rows.map((r) => r.children[2].textContent));
    const n0 = await page.evaluate(() => window.CurioEngine.history().undo.length);
    await page.click('.mo-dlg [data-pc="apply"]');
    const after = await page.evaluate(() => [window.CurioEngine.history().undo.length, window.CurioEngine.history().undo.slice(-1)[0], (document.querySelector(".mo-dlg .mo-flash") || {}).textContent || ""]);
    check(after[0] === n0 + 1 && /^Momentum: pace like /.test(after[1]), `apply is one undo step (${after[1]})`);
    check(/one step/.test(after[2]), "it says so: " + after[2]);
    const nowCol = await page.$$eval(".mo-dlg .pc-nums tbody tr", (rows) => rows.map((r) => r.children[1].textContent));
    check(nowCol.join("|") === promised.join("|"), `the film now reads as the preview promised (${nowCol.join(", ")})`);
    await page.screenshot({ path: path.join(SHOTS, "pacer-applied.png") });
    await page.evaluate(() => window.CurioEngine.undo());
    check((await page.evaluate(() => window.CurioEngine.history().undo.length)) === n0, "undo takes it back");

    const phone = await open({ width: 375, height: 800 });
    const likes2 = await phone.$$eval('.mo-dlg select[data-pc="like"] option', (o) => o.map((x) => x.value));
    if (found && likes2.includes(found)) await phone.selectOption('.mo-dlg select[data-pc="like"]', found);
    await phone.click('.mo-dlg input[data-pc="strength"][value="strong"]');
    const wide = await phone.evaluate(() => {
      const d = document.querySelector(".mo-dlg");
      return [document.documentElement.scrollWidth - window.innerWidth, d.scrollWidth - d.clientWidth];
    });
    check(wide[0] <= 0 && wide[1] <= 0, `no sideways scroll at 375px (page ${wide[0]}px, window ${wide[1]}px over)`);
    await phone.screenshot({ path: path.join(SHOTS, "pacer-phone.png"), fullPage: false });
    await phone.evaluate(() => (document.querySelector(".mo-dlg").scrollTop = 700));
    await phone.screenshot({ path: path.join(SHOTS, "pacer-phone-2.png"), fullPage: false });

    check(errors.length === 0, "no page errors" + (errors.length ? ": " + errors.join(" | ") : ""));
    await browser.close();
    server.close();
    console.log(failed ? `\n${failed} browser checks FAILED` : "\nbrowser checks passed");
    process.exit(failed ? 1 : 0);
  })().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
