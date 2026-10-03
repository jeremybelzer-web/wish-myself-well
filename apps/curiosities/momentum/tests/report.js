/* The momentum report: node apps/curiosities/momentum/tests/report.js [--browser] [--three <three.min.js>] [--shots <dir>]
   With no page: loads the shared core and the curiosity database (as tests/run.js does), the momentum core and
   report.js, then checks that reportHtml makes a self-contained page (no scripts, no links outside the file)
   that holds the film's numbers, that it never carries notes or script lines, the top three warnings, the
   Compass's next move, and the curve with and without curve.js.
   With --browser (needs Playwright and Chromium; set NODE_PATH to where Playwright is installed): the app's page,
   the Momentum window's Report tab, the download (a real download event), print (only the report shows in print
   media), copy, and a phone width. Screenshots go to --shots (default: the system temp folder). */
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
const run = (f) => {
  const file = path.join(ROOT, "momentum", f);
  vm.runInContext(fs.readFileSync(file, "utf8"), vm.isContext(ctx) ? ctx : vm.createContext(ctx), { filename: file });
};
["notes.js", "attention.js", "rates.js", "compass.js", "engine-lanes.js", "report.js"].forEach(run);
const RP = ctx.CurioMomentumReport;
const A = ctx.CurioAttention;
const R = ctx.CurioRates;
const M = ctx.CurioMomentum;
let n = 0;
const ok = (name, fn) => {
  fn();
  n++;
  console.log("ok", name);
};
const studies = core.CuriosityDB.studiesExport().studies;
const profiles = R.DEFAULT_FILMS.slice(0, 2);
const pct = (x) => Math.round(x * 100) + "%";

/* Self-contained: nothing that reaches outside the file, and nothing that runs. */
function selfContained(html, label) {
  assert(/^<!doctype html>/i.test(html), label + ": not a whole page");
  assert(!/<script/i.test(html), label + ": has a script");
  assert(!/https?:|\/\/[a-z0-9]/i.test(html), label + ": has a web address");
  assert(!/<(link|img|iframe|object|embed|use)\b/i.test(html), label + ": loads something");
  assert(!/url\(|@import/i.test(html), label + ": points at a file");
  const tags = html.match(/<[a-z][^>]*>/gi) || [];
  assert(!tags.some((t) => /\s(src|href|xlink:href)=/i.test(t)), label + ": a tag points at a file");
  assert(!tags.some((t) => /\son[a-z]+=/i.test(t)), label + ": has an event handler");
  assert(/<style>/.test(html) && /<svg /.test(html), label + ": inline CSS and SVG");
}

ok("report.js loads as part of the core with no page, and adds no tab without the window", () => {
  assert(RP && typeof RP.reportHtml === "function" && typeof RP.build === "function" && typeof RP.summaryText === "function");
  assert.strictEqual(RP.addTab(), false);
});
ok("every practice scene makes a self-contained page with its numbers in it", () => {
  studies.forEach((s) => {
    const reading = A.read(s.beats, { limit: 20 });
    const html = RP.reportHtml(reading, profiles, { title: s.title, beats: s.beats });
    selfContained(html, s.id);
    const st = reading.stats;
    const runs = st.familyRuns;
    const longest = Math.round(Math.max(...runs.map((r) => r.dur)));
    const [topFam, topShare] = Object.entries(st.familyShare)[0];
    assert(html.includes(`>${st.switchesPerMinute}<`), s.id + ": moves a minute");
    assert(html.includes(`${st.momentum.toFixed(1)} <small>of 5</small>`), s.id + ": momentum reading");
    assert(html.includes(`${st.medianDwell} s`), s.id + ": usual rest");
    assert(html.includes(`${longest} s<`), s.id + ": longest hold");
    assert(html.includes(`${M.family(topFam).label} holds attention most, ${pct(topShare)} of the time`), s.id + ": top family share");
    assert(html.includes(`${reading.beats} moment`), s.id + ": moments");
    assert(html.includes("Pulp Fiction"), s.id + ": compared with");
    assert(!/—/.test(html) && !/cue cue/i.test(html), s.id + ": em-dash or a doubled word");
  });
});
ok("the summary is one plain paragraph, and the copied text has no HTML", () => {
  const s = studies[0];
  const d = RP.build(A.read(s.beats, {}), profiles, { title: s.title, beats: s.beats });
  const p = RP.summaryParagraph(d);
  assert(p.startsWith(s.title) && /times a minute/.test(p) && /of 5/.test(p) && !/[<>]/.test(p), p);
  const t = RP.summaryText(d);
  assert(t.startsWith("Momentum report: " + s.title) && !/<[a-z]/i.test(t) && t.includes(p));
});
ok("counts and ids only: notes, script lines and free text in values never reach the report", () => {
  const SECRET = "ZZ-private-note-ZZ";
  const LINE = "ZZ-script-line-ZZ";
  const beats = studies[0].beats.map((b, i) => Object.assign({}, b, { note: SECRET, notes: SECRET, line: LINE, text: LINE, values: Object.assign({}, b.values, i % 3 ? {} : { dialogue: LINE }) }));
  const study = { id: "x", title: "Private test", notes: SECRET, beats };
  const html = RP.reportHtml(A.fromStudy(study, {}), profiles, { title: study.title, beats });
  const text = RP.summaryText(RP.build(A.fromStudy(study, {}), profiles, { title: study.title, beats }));
  [html, text].forEach((x) => assert(!x.includes(SECRET) && !x.includes(LINE), "leaked"));
});
ok("a title with HTML in it is shown as text", () => {
  const html = RP.reportHtml(A.read(studies[0].beats, {}), [], { title: '<img src=x onerror="alert(1)">' });
  selfContained(html, "title");
  assert(html.includes("&lt;img"));
});
/* A film that holds one family too long three, then four times, each a different length. */
function stuck() {
  const beats = [];
  let t = 0;
  const holds = [30, 55, 24, 41];
  const ids = ["emotion", "plotTwist", "music", "angle"].filter((id) => M.find(id));
  holds.forEach((h, k) => {
    const id = ids[k % ids.length];
    const opts = (M.find(id).options || ["a", "b", "c"]).slice(0, 3);
    beats.push({ at: t, values: { [id]: opts[k % opts.length] } });
    t += h;
  });
  beats.push({ at: t, values: { [ids[0]]: (M.find(ids[0]).options || ["a", "b"])[2] || "b" } });
  return beats;
}
ok("the three warnings that matter most are the three longest, longest first", () => {
  const reading = A.read(stuck(), { limit: 20 });
  assert(reading.warnings.length >= 4, "warnings: " + reading.warnings.length);
  const d = RP.build(reading, profiles, { title: "Stuck" });
  assert.strictEqual(d.warnings.length, 3);
  const want = reading.warnings.map((w) => w.dur).sort((a, b) => b - a).slice(0, 3);
  assert.deepStrictEqual(d.warnings.map((w) => w.dur), want);
  const html = RP.sheetHtml(d);
  assert(html.includes(`The 3 longest of ${reading.warnings.length}.`));
  assert(html.includes("■ Too long"), "status as icon plus words");
});
ok("the barometer gives the hold at the end and the longest hold, with their status", () => {
  const reading = A.read(stuck(), { limit: 20 });
  const d = RP.build(reading, [], {});
  assert.strictEqual(d.barometer.longest.seconds, Math.max(...reading.stats.familyRuns.map((r) => r.dur)));
  assert.strictEqual(d.barometer.longest.status.text, "Too long");
  assert.strictEqual(d.barometer.now.family, reading.stats.currentRun.family);
});
ok("the next move is the Compass's top option, with its cue and a curiosity to try", () => {
  const s = studies[0];
  const reading = A.read(s.beats, {});
  const d = RP.build(reading, profiles, { title: s.title });
  const best = ctx.CurioCompass.point(reading, profiles).options[0];
  assert.strictEqual(d.next.family, best.family);
  assert.strictEqual(d.next.cue, best.cue);
  assert(RP.sheetHtml(d).includes("The next move"));
});
ok("the top moves are counted from stats.moves, most common first, with their cues", () => {
  studies.forEach((s) => {
    const reading = A.read(s.beats, {});
    const d = RP.build(reading, [], {});
    const mv = reading.stats.moves;
    d.moves.forEach((m, i) => {
      assert.strictEqual(m.n, mv.filter((x) => x.from === m.from && x.to === m.to).length, s.id);
      assert(i === 0 || d.moves[i - 1].n >= m.n, s.id + " order");
      assert(M.CUES.some((c) => c.id === m.cue));
    });
    assert(d.moves.length <= 5);
  });
});
ok("without curve.js the curve is a simple line from the reading; with it, CurioCurve's own", () => {
  const s = studies[0];
  const reading = A.read(s.beats, {});
  const d0 = RP.build(reading, [], { beats: s.beats });
  assert.strictEqual(d0.curve.from, "reading");
  assert(d0.curve.points.length > 10 && d0.curve.points.every((p) => p.value >= 0 && p.value <= 5));
  run("curve.js");
  const d1 = RP.build(reading, [], { beats: s.beats });
  assert.strictEqual(d1.curve.from, "curve");
  const c = ctx.CurioCurve.curve(s.beats, { limit: reading.limit });
  assert.deepStrictEqual(d1.curve.points.map((p) => p.value), c.points.map((p) => p.value));
  assert(RP.reportHtml(reading, [], { beats: s.beats }).includes('class="mrp-curve"'));
  /* No beats given: the reading's line still draws. */
  assert.strictEqual(RP.build(reading, [], {}).curve.from, "reading");
});
ok("an empty film makes a short page and does not throw", () => {
  const html = RP.reportHtml(A.read([], {}), [], { title: "Nothing" });
  selfContained(html.replace("<style>", "<style><svg "), "empty");
  assert(/has nothing to read yet/.test(html));
  RP.summaryText(RP.build(null, null, null));
});
ok("file names are plain", () => {
  assert.strictEqual(RP.fileName("The Diner: standoff!"), "the-diner-standoff-momentum-report.html");
  assert.strictEqual(RP.fileName(""), "film-momentum-report.html");
  assert.strictEqual(RP.titleOf("My film, live (follows what you play or perform)"), "My film, live");
  assert.strictEqual(RP.titleOf("Model scene: Diner (made-up practice scene)"), "Diner");
});
ok("the words are plain: no em-dashes in report.js", () => {
  assert(!/—/.test(fs.readFileSync(path.join(ROOT, "momentum", "report.js"), "utf8")));
});
console.log(`\n${n} report checks passed`);

/* ---------------------------------------------------------------- in a real browser */
async function browserChecks() {
  const http = require("http");
  const { chromium } = require("playwright");
  const SHOTS = arg("--shots", os.tmpdir());
  const three = arg("--three", "");
  const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".webmanifest": "application/manifest+json" };
  fs.mkdirSync(SHOTS, { recursive: true });
  const server = await new Promise((resolve) => {
    const sv = http.createServer((req, res) => {
      const p = path.join(ROOT, decodeURIComponent(req.url.split("?")[0]).replace(/^\/+/, ""));
      if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) {
        res.writeHead(404);
        return res.end();
      }
      res.writeHead(200, { "content-type": TYPES[path.extname(p)] || "application/octet-stream" });
      fs.createReadStream(p).pipe(res);
    });
    sv.listen(0, "127.0.0.1", () => resolve(sv));
  });
  const base = "http://127.0.0.1:" + server.address().port + "/";
  const browser = await chromium.launch();
  const errors = [];
  let failed = 0;
  const check = (cond, text) => {
    console.log((cond ? "ok   " : "FAIL ") + text);
    if (!cond) failed++;
  };
  async function newPage(viewport) {
    const context = await browser.newContext({ viewport, acceptDownloads: true });
    await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: base.replace(/\/$/, "") }).catch(() => {});
    const page = await context.newPage();
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
    await page.waitForFunction(() => window.CurioMomentumUI && window.CurioMomentumReport && window.CurioCurve, null, { timeout: 10000 });
  }

  const page = await newPage({ width: 1280, height: 900 });
  await openApp(page);
  await page.evaluate(() => document.getElementById("lib-btn").click());
  await page.click("#lib-menu [data-momentum]");
  await page.waitForSelector(".mo-dlg[open]");
  const tabs = await page.$$eval(".mo-dlg [role=tab]", (b) => b.map((x) => x.dataset.tab));
  check(tabs[tabs.length - 1] === "report", 'Momentum has a "Report" tab at the end: ' + tabs.join(", "));
  await page.click('.mo-dlg [data-tab="report"]');
  await page.waitForSelector(".mo-dlg .mrp-sheet");
  const study = await page.$$eval(".mo-dlg [data-rp-source] option", (o) => o.map((x) => x.value).filter((v) => v.startsWith("study:")));
  check(study.length >= 1, "curated films to report on: " + study.length);
  await page.selectOption(".mo-dlg [data-rp-source]", study.find((s) => /diner/.test(s)) || study[0]);
  await page.waitForSelector(".mo-dlg .mrp-sheet .mrp-curve");
  const shown = await page.evaluate(() => {
    const q = (s) => document.querySelector(".mo-dlg " + s);
    return {
      title: q(".mrp-sheet h1").textContent,
      ring: !!q(".mrp-ring path"),
      gauges: document.querySelectorAll(".mo-dlg .mrp-gauge").length,
      curve: !!q(".mrp-curve"),
      summary: q(".mrp-summary").textContent,
      status: q(".mrp-status").textContent,
      sections: [...document.querySelectorAll(".mo-dlg .mrp-sheet h2")].map((h) => h.textContent),
    };
  });
  check(shown.title && !/\(/.test(shown.title), "the report has the film's title: " + shown.title);
  check(shown.ring && shown.gauges === 2 && shown.curve, "the ring, two barometer gauges and the curve are drawn");
  check(/times a minute/.test(shown.summary), "one plain summary paragraph");
  check(/^[●▲■] /.test(shown.status), "status is an icon plus words: " + shown.status);
  check(["Where attention went", "The barometer", "The momentum curve", "How attention moves", "Held too long", "The next move"].every((h) => shown.sections.includes(h)), "every part is there: " + shown.sections.join(", "));
  await page.screenshot({ path: path.join(SHOTS, "report-tab.png") });
  await page.evaluate(() => (document.querySelector(".mo-dlg").scrollTop = 700));
  await page.screenshot({ path: path.join(SHOTS, "report-tab-lower.png") });

  /* Download: a real download of a self-contained page. */
  const [dl] = await Promise.all([page.waitForEvent("download"), page.click('.mo-dlg [data-rp="download"]')]);
  const name = dl.suggestedFilename();
  const file = path.join(SHOTS, name);
  await dl.saveAs(file);
  const html = fs.readFileSync(file, "utf8");
  check(/-momentum-report\.html$/.test(name), "the download is a web page: " + name);
  let selfOk = true;
  try {
    selfContained(html, "download");
  } catch (e) {
    selfOk = e.message;
  }
  check(selfOk === true, "the downloaded page is self-contained: " + selfOk);
  check(html.includes(shown.title) && html.includes(shown.summary.slice(0, 40).replace(/&/g, "&amp;")), "the download holds the same report");
  const view = await newPage({ width: 900, height: 900 });
  await view.goto("file://" + file);
  await view.screenshot({ path: path.join(SHOTS, "report-download.png"), fullPage: true });
  await view.context().close();

  /* Copy the summary. */
  await page.click('.mo-dlg [data-rp="copy"]');
  await page.waitForFunction(() => !document.querySelector(".mo-dlg .mrp-said").hidden);
  const clip = await page.evaluate(() => navigator.clipboard.readText().catch(() => ""));
  check(clip.startsWith("Momentum report: " + shown.title) && !/<[a-z]/.test(clip), "copy puts the plain summary on the clipboard");
  /* With no clipboard API, the fallback still copies or shows the text to copy. */
  await page.evaluate(() => Object.defineProperty(navigator, "clipboard", { value: undefined, configurable: true }));
  await page.click('.mo-dlg [data-rp="copy"]');
  const fb = await page.evaluate(() => ({ said: document.querySelector(".mo-dlg .mrp-said").textContent, box: !!document.querySelector(".mo-dlg .mrp-copybox") }));
  check(/Copied/.test(fb.said) || fb.box, "with no clipboard the fallback works: " + fb.said);

  /* Print: only the report shows in print media, and printing is back to normal afterwards. */
  await page.evaluate(() => {
    window.__printed = 0;
    window.print = () => window.__printed++;
  });
  await page.click('.mo-dlg [data-rp="print"]');
  check((await page.evaluate(() => window.__printed)) === 1, "Print opens the print window");
  const onScreen = await page.evaluate(() => ({ copy: getComputedStyle(document.querySelector(".mrp-print-copy")).display, dlg: getComputedStyle(document.querySelector(".mo-dlg")).display }));
  check(onScreen.copy === "none" && onScreen.dlg !== "none", "on screen nothing changes while printing is set up");
  await page.emulateMedia({ media: "print" });
  const printed = await page.evaluate(() => {
    const vis = (el) => {
      const r = el.getBoundingClientRect();
      return getComputedStyle(el).display !== "none" && getComputedStyle(el).visibility !== "hidden" && r.width > 0 && r.height > 0;
    };
    const others = [...document.body.children].filter((el) => !el.classList.contains("mrp-print-copy") && vis(el)).map((el) => el.tagName + "." + el.className);
    const copy = document.querySelector(".mrp-print-copy");
    return { others, copy: !!copy && vis(copy), sheet: !!copy && !!copy.querySelector(".mrp-sheet .mrp-curve"), title: copy && copy.querySelector("h1").textContent };
  });
  check(printed.copy && printed.sheet && printed.others.length === 0, "in print media only the report shows" + (printed.others.length ? ": also " + printed.others.join(", ") : ""));
  check(printed.title === shown.title, "the printed report is this film's");
  await page.screenshot({ path: path.join(SHOTS, "report-print.png"), fullPage: true });
  await page.pdf({ path: path.join(SHOTS, "report-print.pdf"), format: "A4" }).catch(() => {});
  await page.evaluate(() => window.dispatchEvent(new Event("afterprint")));
  const after = await page.evaluate(() => ({ cls: document.documentElement.classList.contains("mrp-printing"), copy: !!document.querySelector(".mrp-print-copy"), dlg: getComputedStyle(document.querySelector(".mo-dlg")).display }));
  check(!after.cls && !after.copy && after.dlg !== "none", "after printing, printing the app works as before (the scope is gone)");
  await page.emulateMedia({ media: "screen" });

  /* The engine's film reports too. */
  await page.evaluate(() => window.CurioEngine.send({ type: "importFilm", film: window.CurioSeeds.starter() }));
  await page.evaluate(() => window.CurioMomentumUI.draw());
  await page.selectOption(".mo-dlg [data-rp-source]", "engine");
  await page.waitForSelector(".mo-dlg .mrp-sheet");
  check(/engine/i.test(await page.$eval(".mo-dlg .mrp-sheet h1", (h) => h.textContent)), "the engine's film has a report");

  /* Phone width. */
  const phone = await newPage({ width: 375, height: 800 });
  await openApp(phone);
  await phone.evaluate(() => window.CurioMomentumUI.open("report"));
  await phone.waitForSelector(".mo-dlg .mrp-sheet");
  const first = await phone.$$eval(".mo-dlg [data-rp-source] option", (o) => o.map((x) => x.value).find((v) => v.startsWith("study:")));
  await phone.selectOption(".mo-dlg [data-rp-source]", first);
  await phone.waitForSelector(".mo-dlg .mrp-curve");
  const fit = await phone.evaluate(() => {
    const d = document.querySelector(".mo-dlg");
    const right = Math.max(...[...document.querySelectorAll(".mo-dlg .mrp-sheet *")].map((e) => e.getBoundingClientRect().right));
    return { page: document.documentElement.scrollWidth - window.innerWidth, dlg: d.scrollWidth - d.clientWidth, right, w: window.innerWidth };
  });
  check(fit.page <= 0 && fit.dlg <= 0, `no sideways scroll at phone width (page ${fit.page}px, window ${fit.dlg}px over)`);
  check(fit.right <= fit.w, `the report fits the phone (${Math.round(fit.right)} of ${fit.w})`);
  await phone.screenshot({ path: path.join(SHOTS, "report-phone.png"), fullPage: true });
  await phone.evaluate(() => (document.querySelector(".mo-dlg").scrollTop = 900));
  await phone.screenshot({ path: path.join(SHOTS, "report-phone-lower.png") });

  check(errors.length === 0, "no page errors" + (errors.length ? ": " + errors.slice(0, 3).join(" | ") : ""));
  await browser.close();
  server.close();
  if (failed) {
    console.log(failed + " report browser checks failed");
    process.exit(1);
  }
  console.log("report browser checks passed; screenshots in " + SHOTS);
}
if (args.includes("--browser"))
  browserChecks().catch((e) => {
    console.error(e);
    process.exit(1);
  });
