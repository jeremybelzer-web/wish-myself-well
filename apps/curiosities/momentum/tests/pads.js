/* Momentum pads (momentum/pads.js): node apps/curiosities/momentum/tests/pads.js [--browser] [--three <three.min.js>] [--shots <dir>]
   1. With no page: padPlan says who holds attention at a moment and what a press means (pure, nothing changes),
      the pads come in order with keys and notes, a press moves attention to that family as one undo step, a take
      of three presses becomes one undo step (and stays separate when something else changed the film), and a
      MIDI note presses its pad or is learned.
   2. With --browser (needs Playwright and Chromium; set NODE_PATH): the app, Momentum, the "Pads" tab right
      before Perform, presses by click, key and MIDI note, the undo button, a recorded take of 3 presses taken
      back by one undo, Learn note, no page errors, no sideways scroll at 375px, and screenshots in --shots. */
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
["notes.js", "attention.js", "rates.js", "compass.js", "engine-lanes.js", "pads.js"].forEach((f) => {
  const file = path.join(ROOT, "momentum", f);
  vm.runInContext(fs.readFileSync(file, "utf8"), vm.isContext(ctx) ? ctx : vm.createContext(ctx), { filename: file });
});
const E = ctx.CurioEngine;
const P = ctx.CurioPads;
const A = ctx.CurioAttention;
const ME = ctx.CurioMomentumEngine;
const M = ctx.CurioMomentum;
let n = 0;
const ok = (name, fn) => {
  fn();
  n++;
  console.log("ok", name);
};
const famAt = (rowId) => {
  const r = P.readFilm();
  return P.padPlan(r, null, rowId).now;
};

ok("padPlan is pure: who holds attention at a moment, how long, its status, and what a press means", () => {
  assert(E.send({ type: "importFilm", film: ctx.CurioSeeds.starter() }).ok);
  const fp = E.fingerprint();
  const r = P.readFilm({ limit: 6 });
  const rows = E.state().rows;
  const last = rows.length - 1;
  const byIndex = P.padPlan(r, "comedy", last);
  const byId = P.padPlan(r, "comedy", rows[last].id);
  assert.deepStrictEqual(byIndex, byId, "a row id and its index give the same plan");
  assert.strictEqual(E.fingerprint(), fp, "the engine is untouched");
  assert(byIndex.now && byIndex.now.family, "something holds attention at the end of the starter film");
  /* The same count as the engine's own lanes. */
  const lane = ME.lanes({ limit: 6 }).attention[last];
  assert.strictEqual(byIndex.now.family, lane.family);
  assert.strictEqual(byIndex.now.held, lane.seconds);
  assert.strictEqual(byIndex.now.status.text, lane.seconds / 6 < 0.75 ? "Fresh" : lane.seconds <= 6 ? "Getting long" : "Too long");
  assert(["●", "▲", "■"].includes(byIndex.now.status.icon));
  const same = P.padPlan(r, byIndex.now.family, last);
  assert(same.same && /already holds attention/.test(same.text), same.text);
  const other = M.FAMILIES.map((f) => f.id).find((f) => f !== byIndex.now.family);
  const move = P.padPlan(r, other, last);
  assert(!move.same && /Pressing .+ moves it to/.test(move.text), move.text);
  assert(move.letter && move.color && move.ink, "a letter and a color, never color alone");
  const empty = P.padPlan(A.read([], {}), "camera", 0);
  assert(!empty.now && /Nothing holds attention yet/.test(empty.text));
  [byIndex, same, move, empty].forEach((p) => assert(!/—/.test(p.text), "no em-dash"));
});
ok("the pads: 13 (or the 8 with their own color), keys 1 to 9, 0, - and =, notes from 36", () => {
  const all = P.pads("all");
  const main = P.pads("main");
  assert.strictEqual(all.length, 13);
  assert.strictEqual(main.length, 8);
  assert.deepStrictEqual(Array.from(all.slice(0, 12), (p) => p.key), ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "="]);
  assert.strictEqual(all[12].key, null);
  assert.deepStrictEqual(Array.from(all, (p) => p.note), Array.from(all, (_, i) => 36 + i));
  assert.strictEqual(new Set(all.map((p) => p.letter)).size, 13, "every letter different");
  assert(main.every((p) => p.color !== "#a8a39a"), "the main 8 have their own color");
});
ok("a press moves attention to that family at that moment, one undo step, with the family's strongest curiosity", () => {
  const rows = E.state().rows;
  const fp = E.fingerprint();
  const undo = E.history().undo.length;
  let landed = 0;
  M.FAMILIES.forEach((f) => {
    const row = rows[3].id;
    const mv = P.pick(f.id, row);
    if (!mv) return;
    assert.strictEqual(M.familyOf(mv.curiosity), f.id, "the move belongs to the family");
    const was = rows.map((r) => String(E.value(r.id, mv.track, mv.curiosity)));
    const res = P.press(f.id, row);
    assert(res.ok, res.text);
    /* The press latches: earlier moments keep their values, and the value changes AT the moment. */
    if (!mv.commands.some((c) => c.type === "addCuriosity")) {
      for (let i = 0; i < 3; i++) assert.strictEqual(String(E.value(rows[i].id, mv.track, mv.curiosity)), was[i], f.id + ": moment " + (i + 1) + " kept");
      assert.notStrictEqual(String(E.value(rows[2].id, mv.track, mv.curiosity)), String(E.value(row, mv.track, mv.curiosity)), f.id + ": it changes at the moment");
    }
    assert.strictEqual(E.history().undo.length, undo + 1, "one undo step");
    assert(/^Momentum: move attention to /.test(E.history().undo.slice(-1)[0]));
    assert.strictEqual(String(E.value(row, mv.track, mv.curiosity)), String(mv.value), "the node is at that moment");
    if (famAt(row).family === f.id) landed++;
    E.undo();
    assert.strictEqual(E.fingerprint(), fp, "undo takes it back");
  });
  assert(landed >= 8, "attention lands on the pressed family for most families: " + landed);
});
ok("a take of three presses becomes one undo step, named for the take", () => {
  const rows = E.state().rows;
  const fp = E.fingerprint();
  const undo = E.history().undo.length;
  P.take.start();
  assert(P.take.active());
  assert(P.press("camera", rows[1].id).ok);
  assert(P.press("voice", rows[3].id).ok);
  assert(P.press("comedy", rows[5].id).ok);
  assert.strictEqual(P.take.presses(), 3);
  assert.strictEqual(E.history().undo.length, undo + 3, "each press is in the film while you play");
  const after = rows.map((r) => JSON.stringify(ME.flatBeats().find((b) => b.row === r.id).values));
  const res = P.take.stop();
  assert(res.ok && res.collapsed && res.presses === 3, res.text);
  assert.strictEqual(E.history().undo.length, undo + 1, "one step");
  assert.strictEqual(E.history().undo.slice(-1)[0], "Momentum pads: a take of 3 presses");
  assert.deepStrictEqual(rows.map((r) => JSON.stringify(ME.flatBeats().find((b) => b.row === r.id).values)), after, "the film is the same as during the take");
  E.undo();
  assert.strictEqual(E.fingerprint(), fp, "one undo takes the whole take back");
  assert(!P.take.active());
});
ok("a take stays as separate steps when something else changed the film during it", () => {
  const rows = E.state().rows;
  const undo = E.history().undo.length;
  P.take.start();
  assert(P.press("camera", rows[1].id).ok);
  const other = E.state().tracks[0];
  assert(E.send({ type: "setPoint", row: rows[2].id, track: other.id, curiosity: other.curiosities[0], value: ctx.CurioScale.step(other.curiosities[0], ctx.CurioScale.start(other.curiosities[0]), 1) }).ok);
  assert(P.press("voice", rows[3].id).ok);
  const res = P.take.stop();
  assert(!res.collapsed && /separate steps/.test(res.text), res.text);
  assert.strictEqual(E.history().undo.length, undo + 3);
  E.undo();
  E.undo();
  E.undo();
  const empty = (P.take.start(), P.take.stop());
  assert.strictEqual(empty.presses, 0);
});
ok("a MIDI note presses its pad; Learn note gives a pad a new note and saves it", () => {
  const got = [];
  const off = P.midi.listen((ev) => got.push(ev));
  P.midi.message([0x90, 37, 100]);
  P.midi.message([0x90, 38, 0]); /* a note on with velocity 0 is a note off */
  P.midi.message([0x80, 39, 0]);
  assert.strictEqual(JSON.stringify(got.map((e) => [e.type, e.family])), JSON.stringify([["note", P.pads()[1].family]]));
  P.midi.learn("plot");
  P.midi.message([0x99, 50, 90]);
  assert.strictEqual(P.midi.learning(), null);
  assert.strictEqual(P.pads().find((p) => p.family === "plot").note, 50);
  assert.strictEqual(P.settings().notes.plot, 50);
  P.midi.message([0x90, 50, 90]);
  assert.strictEqual(JSON.stringify(got.slice(-1)[0]), JSON.stringify({ type: "note", family: "plot", note: 50 }));
  off();
  P.set({ notes: {} });
});
console.log(`\n${n} pads checks passed`);

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
      await page.waitForFunction(() => window.CurioMomentumUI && window.CurioPads && window.CurioEngine, null, { timeout: 10000 });
      await page.evaluate(() => window.CurioEngine.send({ type: "importFilm", film: window.CurioSeeds.starter() }));
      await page.evaluate(() => document.getElementById("lib-btn").click());
      await page.click("#lib-menu [data-momentum]");
      await page.waitForSelector(".mo-dlg[open]");
      await page.click('.mo-dlg [data-tab="pads"]');
      await page.waitForSelector(".mo-dlg .pd-root");
      return page;
    }
    const page = await open({ width: 1360, height: 900 });
    const E = (fn) => page.evaluate(fn);
    const tabs = await page.$$eval(".mo-dlg [data-tab]", (b) => b.map((x) => x.dataset.tab));
    check(tabs.indexOf("pads") > tabs.indexOf("engine") && tabs.indexOf("pads") < tabs.indexOf("perform"), "the Pads tab sits with the added tabs before Perform: " + tabs.join(", "));
    const padCount = (await page.$$(".mo-dlg .pd-pad")).length;
    check(padCount === 13, "13 pads: " + padCount);
    check(await page.$$eval(".mo-dlg .pd-pad", (p) => p.every((x) => x.querySelector(".pd-letter").textContent.trim() && x.querySelector(".pd-name").textContent.trim())), "every pad has a letter and a name, not color alone");
    check(await page.$eval(".mo-dlg .pd-baro", (b) => /● Fresh|▲ Getting long|■ Too long|● Nothing yet/.test(b.textContent)), "the barometer shows its status in words");
    check((await page.$$(".mo-dlg .pd-next")).length <= 1 && (await page.$$(".mo-dlg .pd-tag-next")).length === (await page.$$(".mo-dlg .pd-next")).length, "at most one pad is lit as the suggested next, with ★ words");
    await page.screenshot({ path: path.join(SHOTS, "pads.png") });

    const fp0 = await E(() => window.CurioEngine.fingerprint());
    const n0 = await E(() => window.CurioEngine.history().undo.length);
    /* Click: the first pad (Feeling). */
    const fam0 = await page.$eval(".mo-dlg .pd-pad", (b) => b.dataset.pdPad);
    await page.click(".mo-dlg .pd-pad");
    const a1 = await E(() => [window.CurioEngine.history().undo.length, window.CurioEngine.history().undo.slice(-1)[0], window.CurioEngine.fingerprint()]);
    check(a1[0] === n0 + 1 && /^Momentum: move attention to /.test(a1[1]) && a1[2] !== fp0, `a click on a pad is one undo step (${a1[1]})`);
    const flash1 = await page.$eval(".mo-dlg .mo-flash", (f) => f.textContent);
    check(/at moment \d+/.test(flash1) && !/—/.test(flash1), "it says what changed: " + flash1);
    /* Key 2: the second pad. */
    await page.focus(".mo-dlg .pd-pad");
    await page.keyboard.press("2");
    const a2 = await E(() => [window.CurioEngine.history().undo.length, window.CurioEngine.history().undo.slice(-1)[0]]);
    check(a2[0] === n0 + 2, `key 2 presses the second pad (${a2[1]})`);
    const baroNow = await page.$eval(".mo-dlg .pd-baro", (b) => b.textContent);
    check(/attention is on/.test(baroNow), "the barometer reads the film after the press: " + baroNow.replace(/\s+/g, " ").slice(0, 120));
    await page.screenshot({ path: path.join(SHOTS, "pads-pressed.png") });
    /* Undo, twice: the film is back. */
    await page.click('.mo-dlg [data-pd="undo"]');
    await page.click('.mo-dlg [data-pd="undo"]');
    check((await E(() => window.CurioEngine.fingerprint())) === fp0, "the undo button takes both presses back");

    /* Record a take of three presses: a click, a key and a MIDI note, at three moments of the Screen's playhead. */
    const screen = await E(() => !!(window.CurioScreen && window.CurioScreen.row));
    await page.click('.mo-dlg [data-pd="record"]');
    check(await page.$eval('.mo-dlg [data-pd="record"]', (b) => b.getAttribute("aria-pressed") === "true" && /Stop recording/.test(b.textContent)), "Record is on");
    const setMoment = async (i) => {
      if (screen) await E(`window.CurioScreen.setRow(${i})`);
      else await page.selectOption('.mo-dlg select[data-pd="moment"]', String(i));
    };
    await setMoment(1);
    await page.click(`.mo-dlg [data-pd-pad="${fam0}"]`);
    await setMoment(3);
    await page.keyboard.press("3");
    await setMoment(5);
    await E(() => window.CurioPads.midi.message([0x90, window.CurioPads.pads()[3].note, 100]));
    const during = await E(() => [window.CurioEngine.history().undo.length, window.CurioPads.take.presses()]);
    check(during[0] === n0 + 3 && during[1] === 3, `three presses during the take (${during.join(", ")})`);
    await page.screenshot({ path: path.join(SHOTS, "pads-recording.png") });
    await page.click('.mo-dlg [data-pd="record"]');
    const took = await E(() => [window.CurioEngine.history().undo.length, window.CurioEngine.history().undo.slice(-1)[0]]);
    check(took[0] === n0 + 1 && took[1] === "Momentum pads: a take of 3 presses", `stopping makes the take one undo step (${took[1]})`);
    check(/one step/.test(await page.$eval(".mo-dlg .mo-flash", (f) => f.textContent)), "it says so");
    await E(() => window.CurioEngine.undo());
    check((await E(() => window.CurioEngine.fingerprint())) === fp0, "one undo removes the whole take");

    /* Learn note. */
    await page.click('.mo-dlg [data-pd-learn="plot"]');
    check(await page.$eval('.mo-dlg [data-pd-learn="plot"]', (b) => b.getAttribute("aria-pressed") === "true"), "Learn note waits for a note");
    await E(() => window.CurioPads.midi.message([0x90, 60, 100]));
    const saved = await E(() => JSON.parse(localStorage.getItem("curiosities-momentum-pads-v1")).notes.plot);
    check(saved === 60, "the learned note is saved: " + saved);
    check(/Note 60/.test(await page.$eval('.mo-dlg [data-pd-pad="plot"]', (b) => b.textContent)), "the pad shows its new note");
    await page.screenshot({ path: path.join(SHOTS, "pads-learned.png") });
    await E(() => window.CurioPads.set({ notes: {} }));

    const phone = await open({ width: 375, height: 800 });
    await phone.click(".mo-dlg .pd-pad");
    const wide = await phone.evaluate(() => {
      const d = document.querySelector(".mo-dlg");
      return [document.documentElement.scrollWidth - window.innerWidth, d.scrollWidth - d.clientWidth];
    });
    check(wide[0] <= 0 && wide[1] <= 0, `no sideways scroll at 375px (page ${wide[0]}px, window ${wide[1]}px over)`);
    await phone.screenshot({ path: path.join(SHOTS, "pads-phone.png") });
    await phone.evaluate(() => (document.querySelector(".mo-dlg").scrollTop = 600));
    await phone.screenshot({ path: path.join(SHOTS, "pads-phone-2.png") });

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
