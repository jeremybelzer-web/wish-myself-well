/* From your script (momentum/from-script.js): node momentum/tests/from-script.js [--browser [--three <three.min.js>] [--shots <dir>]]
   With no page: the text is cut into moments with the right line numbers (paragraphs, lines with a speaker's
      name kept with its line, a shot list with a heading row), the engine's analysis reads the sample scene,
      the plain guess takes over (and says why) when the engine is missing or the text is too short, the
      keywords guess the right family, every weak spot names its lines and a Try this from a momentum note, and
      Send these moments to the engine film is one batch that one Undo takes back, with no script words in the
      engine.
   With --browser (NODE_PATH=/opt/node22/lib/node_modules): opens the app's index.html, opens Momentum, the tab
      sits in See it and Report stays last, Try a sample reads the sample scene (strip, weak spots, the method
      said), the plain guess can be picked, Send these moments to the engine film fills My film and Undo takes
      it back, the text is kept under curiosities-momentum-script-v1 only, no page errors, no sideways scroll at
      375 pixels wide. Screenshots go to --shots. */
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
["notes.js", "attention.js", "rates.js", "compass.js", "engine-lanes.js", "from-script.js"].forEach((f) => {
  const file = path.join(ROOT, "momentum", f);
  vm.runInContext(fs.readFileSync(file, "utf8"), vm.isContext(ctx) ? ctx : vm.createContext(ctx), { filename: file });
});
const F = ctx.CurioFromScript;
const M = ctx.CurioMomentum;
const E = ctx.CurioEngine;
let n = 0;
const ok = (name, fn) => {
  fn();
  n++;
  console.log("ok", name);
};
const lines = (t) => t.split("\n");
/* Arrays made inside the vm context are another realm's: compare them as JSON. */
const same = (a, b, msg) => assert.strictEqual(JSON.stringify(a), JSON.stringify(b), msg);

ok("the sample is original practice text with no em-dash and no 'beat'", () => {
  assert(F.SAMPLE.length > 400);
  assert(!/—|\bbeats?\b/i.test(F.SAMPLE));
  assert(/^curiosities-momentum-/.test(F.STORE));
});

ok("paragraphs are moments; headings are not; line numbers point at the text", () => {
  const c = F.cut(F.SAMPLE);
  assert.strictEqual(c.kind, "blocks");
  const L = lines(F.SAMPLE);
  c.units.forEach((u) => {
    assert(!/^(INT|EXT)\./.test(u.text), "a heading became a moment");
    assert.strictEqual(u.text, L.slice(u.from - 1, u.to).map((x) => x.trim()).join("\n"));
  });
  assert.strictEqual(c.units[0].heading, "INT. FERRY TICKET BOOTH - NIGHT");
  assert(c.units.some((u) => u.heading === "EXT. PIER - CONTINUOUS"));
  assert(c.units.some((u) => /^PIP\nIt's a ticket/.test(u.text)), "a speech keeps its speaker");
});

ok("without empty lines each line is a moment, and a speaker's name stays with its line", () => {
  const c = F.cut("EXT. ROOF - DAY\nMara climbs onto the ledge.\nJONAS\nCome back inside.\nShe laughs.\nWide shot of the city.");
  assert.strictEqual(c.kind, "lines");
  same(
    c.units.map((u) => [u.from, u.to]),
    [[2, 2], [3, 4], [5, 5], [6, 6]]
  );
});

ok("a shot list with a heading row is one moment per shot", () => {
  const c = F.cut("Shot,Size,Angle,Move,Duration\n1,WS,eye,static,4\n2,CU,low,push in,2\n3,MS,high,pan,3");
  assert.strictEqual(c.kind, "shotList");
  same(c.units.map((u) => u.from), [2, 3, 4]);
  const r = F.readScript("Shot,Size,Angle,Move,Duration\n1,WS,eye,static,4\n2,CU,low,push in,2\n3,MS,high,pan,3\n4,CU,eye,handheld,6", {});
  assert.notStrictEqual(r.method, "plain", r.why);
  assert(r.cells.some((x) => x.family === "camera"), "the shot columns reach Camera");
});

ok("the engine's analysis reads the sample scene into moments that add up", () => {
  const r = F.readScript(F.SAMPLE, { limit: 20 });
  assert.strictEqual(r.method, "both");
  assert.strictEqual(r.cells.length, F.cut(F.SAMPLE).units.length);
  const sum = r.reading.segments.reduce((a, s) => a + s.dur, 0);
  assert(Math.abs(sum - r.seconds) < 0.05);
  assert(Math.abs(r.cells.reduce((a, c) => a + c.dur, 0) - r.seconds) < 0.05);
  assert(r.cells.every((c) => c.family && M.family(c.family)), "every moment has a family");
  assert(new Set(r.cells.map((c) => c.family)).size >= 3, "attention moves between several families");
  const engineOnly = F.readScript(F.SAMPLE, { how: "engine" });
  assert.strictEqual(engineOnly.method, "engine");
  /* Deterministic. */
  assert.strictEqual(JSON.stringify(F.readScript(F.SAMPLE, {}).cells), JSON.stringify(r.cells));
});

ok("each weak spot names its lines, its status and a Try this from a momentum note", () => {
  ["both", "plain"].forEach((how) => {
    const r = F.readScript(F.SAMPLE, { how, limit: 20 });
    assert(r.weak.length >= 1, how + ": the long talk should rest too long");
    r.weak.forEach((w) => {
      assert(["long", "over"].includes(w.status.key));
      same(w.status, M.status(w.dur, 20));
      const cells = r.cells.filter((c) => w.moments.includes(c.i));
      assert(cells.every((c) => c.family === w.family));
      assert.strictEqual(w.lines[0], cells[0].from);
      assert.strictEqual(w.lines[1], cells[cells.length - 1].to);
      assert.notStrictEqual(w.suggest.family, w.family);
      assert.strictEqual(w.suggest.tryThis, M.plain(M.note(w.suggest.curiosity).tryThis));
      assert(w.suggest.text.includes("line " + w.longAt) && w.suggest.text.includes(w.suggest.tryThis));
      assert(!/—|\bbeats?\b|undefined|NaN/.test(w.suggest.text), w.suggest.text);
    });
  });
  /* A bigger limit: nothing rests too long. */
  assert.strictEqual(F.readScript(F.SAMPLE, { limit: 300 }).weak.length, 0);
});

ok("the plain guess takes over, and says why, when the engine cannot read it", () => {
  const short = F.readScript("Mara runs.\nThe lamp flickers.", {});
  assert.strictEqual(short.method, "plain");
  assert(/at least three moments/.test(short.why), short.why);
  same(short.cells.map((c) => c.family), ["movement", "light"]);
  const keep = ctx.CurioAnalyze;
  ctx.CurioAnalyze = undefined;
  try {
    const r = F.readScript(F.SAMPLE, {});
    assert.strictEqual(r.method, "plain");
    assert(/not loaded/.test(r.why), r.why);
    assert(r.cells.length > 5);
  } finally {
    ctx.CurioAnalyze = keep;
  }
  assert.strictEqual(F.readScript(F.SAMPLE, { how: "plain" }).method, "plain");
});

ok("the keywords guess the family of a line", () => {
  const g = F.guessFamily;
  assert.strictEqual(g("Pip runs down the pier, his boots slapping the wet boards."), "movement");
  assert.strictEqual(g("A single lamp flickers on at the end of the pier."), "light");
  assert.strictEqual(g("ODILE\nIt's my favorite one."), "voice");
  assert.strictEqual(g("Close up: the paper boat."), "camera");
  assert.strictEqual(g("She finally reveals the secret letter."), "plot");
  assert.strictEqual(g("He trips over the cat and laughs."), "comedy");
  assert.strictEqual(g("Nothing to see.", "music"), "music", "no keyword keeps the family before");
  M.FAMILIES.forEach((f) => assert(F.standIn(f.id) && M.note(F.standIn(f.id)).family === f.id, "stand-in for " + f.id));
});

ok("timing: as long as the words, or Seconds per panel", () => {
  const even = F.readScript(F.SAMPLE, { timing: "even", secondsPerBeat: 4 });
  assert(even.cells.every((c) => c.dur === 4));
  const words = F.readScript(F.SAMPLE, {});
  assert(words.cells.every((c) => c.dur >= 2 && c.dur <= 12));
  assert(new Set(words.cells.map((c) => c.dur)).size > 2);
});

ok("Send these moments to the engine film: one batch, one Undo, values only", () => {
  E.reset && E.reset();
  const r = F.readScript(F.SAMPLE, {});
  const before = E.state();
  const undoBefore = E.history().undo.length;
  const out = F.send(r);
  assert(out.ok, out.error);
  assert.strictEqual(E.history().undo.length, undoBefore + 1);
  assert.strictEqual(E.history().undo.slice(-1)[0], "Momentum: moments from your script");
  const st = E.state();
  assert.strictEqual(st.rows.length, r.cells.length);
  st.rows.forEach((row, i) => assert.strictEqual(row.label, `Moment ${i + 1} (line ${r.cells[i].from})`));
  /* The engine holds no words from the script. */
  const text = JSON.stringify(st);
  ["ticket", "ferry", "Odile", "ODILE", "favorite", "drawing"].forEach((w) => assert(!text.includes(w), "the engine kept " + w));
  /* The values reached the cells: My film read in the engine moves attention at the same moments. */
  const host = st.tracks.find((t) => t.kind === "master") || st.tracks[0];
  r.beats.forEach((b, i) =>
    Object.keys(b.values).forEach((id) => {
      if (!host.curiosities.includes(id)) return;
      assert.strictEqual(String(E.value(st.rows[i].id, host.id, id)), String(ctx.CurioScale.fix(id, b.values[id])), id + " at moment " + (i + 1));
    })
  );
  const engineReading = ctx.CurioMomentumEngine.reading({ secondsPerBeat: 3 });
  assert(engineReading.segments.length >= 3, "the other tabs can read it");
  E.undo();
  assert.strictEqual(JSON.stringify(E.state()), JSON.stringify(before), "one Undo takes it back");
  /* Over an existing film: its tracks stay, its rows are replaced. */
  const starter = ctx.CurioSeeds && ctx.CurioSeeds.starter ? ctx.CurioSeeds.starter() : null;
  if (starter) {
    E.send({ type: "batch", label: "Start", commands: [{ type: "importFilm", film: starter }] });
    const tracks = E.state().tracks.map((t) => t.id);
    assert(F.send(r).ok);
    same(E.state().tracks.map((t) => t.id).slice(0, tracks.length), tracks);
    assert.strictEqual(E.state().rows.length, r.cells.length);
    E.undo();
  }
});

console.log(`\n${n} from your script checks passed`);

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
      await page.waitForFunction(() => window.CurioMomentumUI && window.CurioFromScript && window.CurioEngine, null, { timeout: 15000 });
    }
    const sideways = (page) => page.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - window.innerWidth);
    const visible = (page) => page.evaluate(() => document.querySelector(".mo-dlg .msc").innerText);

    const page = await newPage({ width: 1360, height: 900 });
    await openApp(page);
    await page.evaluate(() => document.getElementById("lib-btn").click());
    await page.click("#lib-menu [data-momentum]");
    await page.waitForSelector(".mo-dlg[open]");
    const where = await page.evaluate(() => {
      const b = document.querySelector('.mo-dlg [data-tab="script"]');
      return b ? b.closest("[data-tabgroup]").dataset.tabgroup + " / " + b.textContent : "";
    });
    check(where === "see / From your script", "the tab sits in See it: " + where);
    const lastTab = await page.$$eval(".mo-dlg .mo-tabs button[data-tab]", (b) => b[b.length - 1].dataset.tab);
    check(lastTab === "report", "Report stays the last tab");
    await page.click('.mo-dlg [data-tab="script"]');
    await page.waitForSelector(".mo-dlg .msc");
    check(/Nothing read yet/.test(await visible(page)), "before reading, it says what to do");
    await page.screenshot({ path: path.join(SHOTS, "script-empty.png") });

    /* Try a sample. */
    await page.click('.mo-dlg [data-msc="sample"]');
    await page.waitForSelector(".mo-dlg .msc-strip");
    const read = await page.evaluate(() => ({
      cells: document.querySelectorAll(".mo-dlg .msc-cell").length,
      units: window.CurioFromScript.cut(window.CurioFromScript.SAMPLE).units.length,
      weak: [...document.querySelectorAll(".mo-dlg .msc-weak > li")].map((l) => l.innerText.replace(/\s+/g, " ")),
      method: document.querySelector(".mo-dlg .msc-sec .mo-small").innerText,
      textarea: document.querySelector(".mo-dlg .msc-text").value,
      stored: JSON.parse(localStorage.getItem("curiosities-momentum-script-v1") || "{}").text || "",
      keys: Object.keys(localStorage).filter((k) => (localStorage.getItem(k) || "").includes("never o'clock")),
    }));
    check(read.cells === read.units && read.cells > 5, `one strip cell per moment (${read.cells})`);
    check(read.weak.length >= 1 && /(Getting long|Too long)/.test(read.weak[0]) && /lines? \d+/.test(read.weak[0]) && /Try this:/.test(read.weak[0]), "a weak spot with its mark, lines and Try this: " + (read.weak[0] || "").slice(0, 160));
    check(/engine's analysis/.test(read.method) && /keywords/.test(read.method), "it says the engine's analysis was used: " + read.method.slice(0, 90));
    check(read.textarea.includes("never o'clock") && read.stored.includes("never o'clock"), "the sample is in the box and kept on this device");
    check(read.keys.length === 1 && read.keys[0] === "curiosities-momentum-script-v1", "the text is kept under curiosities-momentum-script-v1 only: " + read.keys.join(", "));
    const text1 = await visible(page);
    check(!/—|\bbeats?\b|undefined|NaN|\[object/.test(text1), "no em-dashes, beats, undefined or NaN");
    await page.screenshot({ path: path.join(SHOTS, "script-sample.png") });
    await page.evaluate(() => (document.querySelector(".mo-dlg").scrollTop = 700));
    await page.screenshot({ path: path.join(SHOTS, "script-weak.png") });

    /* The plain guess. */
    await page.selectOption('.mo-dlg [data-msc="how"]', "plain");
    await page.waitForFunction(() => /plain guess/.test((document.querySelector(".mo-dlg .msc-sec .mo-small") || {}).innerText || ""));
    check(true, "the plain guess can be picked, and says so");

    /* Send these moments to the engine film, then Undo. */
    const before = await page.evaluate(() => ({ rows: window.CurioEngine.state().rows.length, undo: window.CurioEngine.history().undo.length }));
    await page.click('.mo-dlg [data-msc="send"]');
    await page.waitForSelector(".mo-dlg .msc .mo-flash");
    const sent = await page.evaluate(() => ({ rows: window.CurioEngine.state().rows.length, undo: window.CurioEngine.history().undo, flash: document.querySelector(".mo-dlg .msc .mo-flash").innerText, engineText: JSON.stringify(window.CurioEngine.state()) }));
    check(sent.rows === read.units && sent.undo.length === before.undo + 1 && sent.undo[sent.undo.length - 1] === "Momentum: moments from your script", `My film now has ${sent.rows} moments, one undo step`);
    check(!/never o'clock|ticket/.test(sent.engineText), "the engine holds no words of the script");
    check(/The engine's timeline/.test(sent.flash), "it says where to read it: " + sent.flash);
    const sourceOk = await page.evaluate(() => window.CurioMomentumUI.context().sources().some((s) => s.id === "engine"));
    check(sourceOk, "the other tabs can pick the engine's timeline");
    await page.screenshot({ path: path.join(SHOTS, "script-sent.png") });
    await page.click('.mo-dlg [data-msc="undo"]');
    const undone = await page.evaluate(() => window.CurioEngine.state().rows.length);
    check(undone === before.rows, `Undo takes it back (${undone} rows)`);

    /* A phone. */
    const phone = await newPage({ width: 375, height: 800 });
    await openApp(phone);
    await phone.evaluate(() => window.CurioMomentumUI.open("script"));
    await phone.waitForSelector(".mo-dlg[open] .msc");
    if (!(await phone.$(".mo-dlg .msc-strip"))) {
      await phone.click('.mo-dlg [data-msc="sample"]');
      await phone.waitForSelector(".mo-dlg .msc-strip");
    }
    check((await sideways(phone)) <= 0, "no sideways scroll at 375 pixels wide");
    const wide = await phone.evaluate(() => [...document.querySelectorAll(".mo-dlg .msc *")].filter((e) => e.getBoundingClientRect().right > window.innerWidth + 1).map((e) => e.className || e.tagName).slice(0, 5));
    check(wide.length === 0, "nothing in the tab is wider than the phone" + (wide.length ? ": " + wide.join(", ") : ""));
    await phone.screenshot({ path: path.join(SHOTS, "script-phone.png") });
    await phone.evaluate(() => (document.querySelector(".mo-dlg").scrollTop = 900));
    await phone.screenshot({ path: path.join(SHOTS, "script-phone-more.png") });

    check(errors.length === 0, "no page errors" + (errors.length ? ": " + errors.join(" | ") : ""));
    await browser.close();
    server.close();
    console.log(failed ? `\n${failed} browser checks FAILED` : "\nall browser checks passed");
    process.exit(failed ? 1 : 0);
  })().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
