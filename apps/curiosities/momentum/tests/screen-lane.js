/* The Attention lane on the Screen's timeline (momentum/screen-lane.js).
   node momentum/tests/screen-lane.js                      the pure part, no page
   node momentum/tests/screen-lane.js --browser [--three <three.min.js>] [--shots <dir>]
                                                           also the lane in the real app (needs Playwright; set NODE_PATH)
   No page: one cell per moment, the family and its letter where attention moved, the seconds held and the
   Fresh / Getting long / Too long marks, the Too long stretches, the hover sentence.
   In the app: the Screen opens with the lane on its timeline, one cell per moment; its cells sit over the
   timeline's moment columns (bounding boxes), also after scrolling and zooming the timeline; clicking a cell
   moves the playhead; an engine change redraws it; "Fix this" opens the Compass tab; it folds; no page
   errors; no sideways scroll at 375px; screenshots at 1440 and 375. */
const path = require("path");
const fs = require("fs");
const vm = require("vm");
const assert = require("assert");
const os = require("os");
const http = require("http");

const ROOT = path.join(__dirname, "..", "..");
const args = process.argv.slice(2);
const arg = (n, d) => (args.includes(n) ? args[args.indexOf(n) + 1] : d);

const core = require(path.join(ROOT, "core", "headless.js")).load();
const ctx = core.window;
["notes.js", "attention.js", "screen-lane.js"].forEach((f) => {
  const file = path.join(ROOT, "momentum", f);
  vm.runInContext(fs.readFileSync(file, "utf8"), vm.isContext(ctx) ? ctx : vm.createContext(ctx), { filename: file });
});
const M = ctx.CurioMomentum;
const A = ctx.CurioAttention;
const Lane = require(path.join(ROOT, "momentum", "screen-lane.js"));
let n = 0;
const ok = (name, fn) => {
  fn();
  n++;
  console.log("ok", name);
};

ok("screen-lane.js works in Node through require and on the page's global", () => {
  ["cells", "stretches", "tip"].forEach((k) => assert.strictEqual(typeof Lane[k], "function", k));
  assert.strictEqual(typeof ctx.CurioMomentumLane.cells, "function");
});

/* A made-up reading: nothing for moment 1, camera from moment 2 to 9, then feeling. 3 s a moment, limit 12 s. */
const fake = {
  beats: 12,
  segments: [
    { family: "camera", beat: 1, from: 3, to: 15 },
    { family: "camera", beat: 5, from: 15, to: 27 },
    { family: "feeling", beat: 9, from: 27, to: 36 },
  ],
};
const list = Lane.cells(fake, { n: 12, secondsPerBeat: 3, limit: 12, status: M.status });

ok("one cell per moment, nothing before attention lands", () => {
  assert.strictEqual(list.length, 12);
  assert.strictEqual(list[0].family, null);
  assert.strictEqual(list[0].held, null);
  assert.deepStrictEqual(list.map((c) => c.family).slice(1), ["camera", "camera", "camera", "camera", "camera", "camera", "camera", "camera", "feeling", "feeling", "feeling"]);
});

ok("the letter goes where a family's stretch starts; two curiosities of one family are one stretch", () => {
  assert.deepStrictEqual(list.filter((c) => c.start).map((c) => c.i), [1, 9]);
  assert.deepStrictEqual(list.filter((c) => c.moved).map((c) => c.i), [9], "attention moved only once, to feeling");
});

ok("seconds held grow by a moment's length and start again when attention moves", () => {
  assert.deepStrictEqual(list.map((c) => c.held), [null, 3, 6, 9, 12, 15, 18, 21, 24, 3, 6, 9]);
});

ok("the marks follow the limit: Fresh, Getting long, Too long", () => {
  assert.deepStrictEqual(list.map((c) => (c.status ? c.status.icon : "")).join(""), "●●▲▲■■■■●●▲");
});

ok("the Too long stretches are found for the Fix this links", () => {
  assert.deepStrictEqual(JSON.parse(JSON.stringify(Lane.stretches(list))), [{ from: 5, to: 8, family: "camera" }]);
  assert.deepStrictEqual(Lane.stretches([]), []);
});

ok("the hover sentence is plain words", () => {
  assert.strictEqual(Lane.tip(list[3], M.mark("camera")), "Moment 4: Camera holds attention, 9 s so far, Getting long");
  assert.strictEqual(Lane.tip(list[0], M.mark(null)), "Moment 1: Nothing holds attention yet.");
  assert.strictEqual(Lane.tip(list[9], M.mark("feeling")), "Moment 10: Feeling holds attention, 3 s so far, Fresh. Attention moved here.");
  assert(!/—/.test(Lane.tip(list[6], M.mark("camera"))), "no em-dashes");
});

ok("a real film's reading gives one cell per beat, agreeing with the reading's families", () => {
  const scene = (core.CuriosityDB.data.scenes || []).find((s) => s && Array.isArray(s.beats) && s.beats.length > 4);
  assert(scene, "no practice scene");
  const beats = scene.beats.map((b) => ({ values: b.values || b }));
  const r = A.read(beats, { secondsPerBeat: 3, limit: 20 });
  const cs = Lane.cells(r, { n: beats.length, secondsPerBeat: 3, limit: 20, status: M.status });
  assert.strictEqual(cs.length, beats.length);
  r.segments.forEach((s) => assert.strictEqual(cs[s.beat].family, s.family, "beat " + s.beat));
  const runs = A.familyRuns(r.segments);
  assert.strictEqual(cs.filter((c) => c.start).length, runs.length);
  const last = runs[runs.length - 1];
  if (last) assert(Math.abs(cs[cs.length - 1].held - last.dur) < 0.11, `last hold ${cs[cs.length - 1].held} vs ${last.dur}`);
});

ok("no reading, no moments: an empty lane, no errors", () => {
  assert.deepStrictEqual(Lane.cells(null, { n: 0 }), []);
  assert.strictEqual(Lane.cells({ segments: [] }, { n: 3 }).filter((c) => c.family).length, 0);
});

console.log(`${n} attention lane checks passed`);

if (args.includes("--browser")) browser().catch((e) => {
  console.error(e);
  process.exit(1);
});

async function browser() {
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
  const b = await chromium.launch();
  const errors = [];
  let failed = 0;
  const check = (cond, text) => {
    console.log((cond ? "ok   " : "FAIL ") + text);
    if (!cond) failed++;
  };
  async function open(viewport) {
    const page = await b.newPage({ viewport });
    page.on("pageerror", (e) => errors.push(String(e && e.message)));
    page.on("console", (m) => m.type() === "error" && !/Failed to load resource|favicon|fonts\.g/.test(m.text()) && errors.push(m.text()));
    await page.route(/three\.min\.js$/, (r) => r.fulfill({ contentType: "text/javascript", body: three ? fs.readFileSync(three, "utf8") : "" }));
    await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
    await page.goto(base + "index.html?screen=1");
    await page.waitForFunction(() => window.CurioScreen && window.CurioMomentumLane && window.CurioEngine, null, { timeout: 15000 });
    await page.evaluate(() => !window.CurioScreen.isOpen() && window.CurioScreen.open());
    await page.waitForSelector(".sc-timeline .mo-al .mo-al-c", { timeout: 10000 });
    await page.waitForTimeout(200);
    return page;
  }
  /* How far each cell's edges are from the timeline's moment columns (the drawing's width split by moment). */
  const alignment = (page) =>
    page.evaluate(() => {
      const svg = document.querySelector(".sc-timeline .sl-scroll .sl-svg") || document.querySelector(".sc-timeline .sl-scroll .sl-topsvg");
      const sc = document.querySelector(".sc-timeline .sl-scroll");
      const hw = sc.querySelector(".sl-heads").offsetWidth;
      const visL = sc.getBoundingClientRect().left + hw;
      const visR = sc.getBoundingClientRect().left + sc.clientWidth;
      const r = svg.getBoundingClientRect();
      const n = window.CurioEngine.state().rows.length;
      const cells = [...document.querySelectorAll(".mo-al .mo-al-c")];
      const colW = r.width / n;
      let worst = 0;
      let seen = 0;
      cells.forEach((c, j) => {
        const b = c.getBoundingClientRect();
        const x0 = r.left + j * colW;
        if (x0 + colW < visL || x0 > visR) return;
        seen++;
        worst = Math.max(worst, Math.abs(b.left - x0), Math.abs(b.width - colW));
      });
      const view = document.querySelector(".mo-al-view").getBoundingClientRect();
      return { n, cells: cells.length, worst, seen, colW, clip: [Math.abs(view.left - visL), Math.abs(view.right - visR)] };
    });

  const page = await open({ width: 1440, height: 900 });
  const a0 = await alignment(page);
  check(a0.cells === a0.n && a0.n > 0, `one cell per moment (${a0.cells} cells, ${a0.n} moments)`);
  check(a0.worst < 1.5 && a0.seen > 0, `cells sit over the timeline's moment columns (worst ${a0.worst.toFixed(2)}px over ${a0.seen} columns of ${a0.colW.toFixed(1)}px)`);
  check(a0.clip[0] < 1.5 && a0.clip[1] < 1.5, `the lane shows the same stretch of the film as the timeline (${a0.clip.map((x) => x.toFixed(1)).join(", ")})`);

  const target = Math.min(a0.n - 1, 3);
  await page.click(`.mo-al-c[data-mo-al-row="${target}"]`);
  await page.waitForTimeout(150);
  const after = await page.evaluate(() => [window.CurioScreen.row(), document.querySelector(".mo-al-c.on") && Number(document.querySelector(".mo-al-c.on").dataset.moAlRow)]);
  check(after[0] === target && after[1] === target, `clicking a cell moves the playhead (to moment ${after[0] + 1}, outlined ${after[1] + 1})`);
  const tipText = await page.evaluate(() => document.querySelector(".mo-al-c.on").getAttribute("title"));
  check(/^Moment \d+: /.test(tipText), `hover sentence: "${tipText}"`);

  /* An engine change redraws it: put a new Camera value on every other moment. */
  const before = await page.evaluate(() => document.querySelector(".mo-al-cells").innerHTML);
  const sent = await page.evaluate(() => {
    const E = window.CurioEngine;
    const st = E.state();
    const t = st.tracks.find((x) => x.kind === "master") || st.tracks[0];
    const S = window.CurioScale;
    const cur = ["mood", "emotion", "shotSize", "music"].find((c) => S.known(c)) || t.curiosities[0];
    const cmds = [];
    if (!t.curiosities.includes(cur)) cmds.push({ type: "addCuriosity", track: t.id, curiosity: cur });
    st.rows.forEach((r, j) => cmds.push({ type: "setPoint", row: r.id, track: t.id, curiosity: cur, value: S.step(cur, S.start(cur), j % 2 ? 2 : -2) }));
    return [cur, E.send({ type: "batch", label: "lane test", commands: cmds }).ok];
  });
  await page.waitForTimeout(250);
  const changed = await page.evaluate(() => document.querySelector(".mo-al-cells").innerHTML);
  check(sent[1] && changed !== before, `an engine change redraws the lane (${sent[0]} changed)`);
  const a1 = await alignment(page);
  check(a1.worst < 1.5, `still lined up after the change (worst ${a1.worst.toFixed(2)}px)`);

  /* Zoom in, then scroll the timeline sideways: the cells follow. */
  await page.click('.sc-timeline [data-act="zoom-in"]');
  await page.click('.sc-timeline [data-act="zoom-in"]');
  await page.waitForTimeout(250);
  await page.evaluate(() => {
    const sc = document.querySelector(".sc-timeline .sl-scroll");
    sc.scrollLeft = Math.round((sc.scrollWidth - sc.clientWidth) / 2);
  });
  await page.waitForTimeout(150);
  const a2 = await alignment(page);
  const scrolled = await page.evaluate(() => document.querySelector(".sc-timeline .sl-scroll").scrollLeft);
  check(a2.worst < 1.5 && scrolled > 0, `zoomed in and scrolled ${scrolled}px: still over the columns (worst ${a2.worst.toFixed(2)}px, ${a2.colW.toFixed(1)}px columns)`);
  await page.screenshot({ path: path.join(SHOTS, "lane-1440-zoomed.png") });
  await page.click('.sc-timeline [data-act="zoom-fit"]');
  await page.waitForTimeout(250);
  const a3 = await alignment(page);
  check(a3.worst < 1.5, `zoomed back to fit, still lined up (worst ${a3.worst.toFixed(2)}px)`);
  await page.evaluate(() => document.querySelector(".mo-al").scrollIntoView({ block: "end" }));
  await page.screenshot({ path: path.join(SHOTS, "lane-1440.png") });

  /* Fix this opens the Compass, when the film has a Too long stretch. */
  const fix = await page.$(".mo-al-fix");
  if (fix) {
    await fix.click();
    await page.waitForTimeout(250);
    const tab = await page.evaluate(() => {
      const d = document.querySelector(".mo-dlg");
      const on = d && d.querySelector('[data-tab].on, [data-tab][aria-selected="true"]');
      return [!!(d && d.open), on && on.dataset.tab];
    });
    check(tab[0] && tab[1] === "compass", `"Fix this" opens the Momentum window on the Compass tab (${tab[1]})`);
    await page.evaluate(() => window.CurioMomentumUI.close());
  } else console.log("skip no Too long stretch in this film, so no Fix this link");

  /* Fold and unfold. */
  await page.click('.mo-al [data-mo-al="fold"]');
  check(await page.evaluate(() => !document.querySelector(".mo-al-c") && /Attention/.test(document.querySelector(".mo-al").textContent)), "the lane folds to its name");
  await page.click('.mo-al [data-mo-al="fold"]');
  check(await page.evaluate(() => document.querySelectorAll(".mo-al-c").length === window.CurioEngine.state().rows.length), "and unfolds");

  /* Closed Screen: no work. */
  const quiet = await page.evaluate(() => {
    window.CurioScreen.close();
    const html = document.querySelector(".mo-al").innerHTML;
    const E = window.CurioEngine;
    E.undo();
    return html === document.querySelector(".mo-al").innerHTML;
  });
  await page.waitForTimeout(150);
  const still = await page.evaluate(() => document.querySelector(".mo-al-cells").innerHTML);
  check(quiet && still === changed, "with the Screen closed the lane does not redraw");
  await page.evaluate(() => window.CurioScreen.open());
  await page.waitForTimeout(250);
  const back = await page.evaluate(() => document.querySelector(".mo-al-cells").innerHTML);
  check(back === before, "when the Screen opens again the lane catches up (the undo shows)");
  await page.close();

  const phone = await open({ width: 375, height: 800 });
  const side = await phone.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth, document.querySelector(".sc-page").scrollWidth, document.querySelector(".sc-page").clientWidth]);
  check(side[0] <= side[1] && side[2] <= side[3] + 1, `no sideways scroll at 375px (page ${side[0]}/${side[1]}, Screen ${side[2]}/${side[3]})`);
  const ap = await alignment(phone);
  check(ap.cells === ap.n && ap.worst < 1.5, `on a phone, still one cell per moment over the columns (worst ${ap.worst.toFixed(2)}px)`);
  await phone.evaluate(() => document.querySelector(".mo-al").scrollIntoView({ block: "center" }));
  await phone.waitForTimeout(100);
  await phone.screenshot({ path: path.join(SHOTS, "lane-375.png") });
  await phone.close();

  check(!errors.length, "no page errors" + (errors.length ? ": " + errors.slice(0, 3).join(" | ") : ""));
  await b.close();
  server.close();
  console.log(failed ? `${failed} browser checks failed` : "browser checks passed");
  process.exit(failed ? 1 : 0);
}
