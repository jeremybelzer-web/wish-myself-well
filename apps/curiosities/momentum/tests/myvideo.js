/* Your videos' rates (momentum/myvideo.js): node momentum/tests/myvideo.js [--browser [--three <three.min.js>] [--shots <dir>]]
   With no page: a made-up "my video" study (values like the ones media/media.js measures, no real video) is
      found among the curated films, its rates match CurioAttention and CurioRates.measure, the plain sentences
      compare it with curated films ("about every N seconds"), the closest film is the nearest in pace, and the
      table has the video first and every curated estimate after it.
   With --browser (NODE_PATH=/opt/node22/lib/node_modules): opens the app's index.html with no video brought in
      (the empty state says Library, Bring in a video, and its button opens the import window), then adds the
      made-up study in the page, opens the tab, checks the tiles, sentences and table, presses "Use this film's
      rates as my limit" (the Momentum limit changes and is saved), switches to another film with the picker, no
      page errors, and no sideways scroll at 375 pixels wide. Screenshots go to --shots. */
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
["notes.js", "attention.js", "rates.js", "myvideo.js"].forEach((f) => {
  const file = path.join(ROOT, "momentum", f);
  vm.runInContext(fs.readFileSync(file, "utf8"), vm.isContext(ctx) ? ctx : vm.createContext(ctx), { filename: file });
});
const V = ctx.CurioMyVideo;
const A = ctx.CurioAttention;
const R = ctx.CurioRates;
let n = 0;
const ok = (name, fn) => {
  fn();
  n++;
  console.log("ok", name);
};

/* A made-up video: 30 moments of 2 seconds, with the curiosities media.js measures. No real file is read. */
function fakeVideo() {
  const cut = ["slow", "medium", "fast"];
  const shot = ["short", "medium", "long"];
  const key = ["low key", "mid", "high key"];
  const warm = ["very warm", "warm", "neutral", "cool", "very cool"];
  const color = ["muted color", "natural color", "vivid color"];
  const beats = [];
  for (let i = 0; i < 30; i++) {
    const t = i * 2;
    beats.push({
      id: "fake-" + (i + 1),
      at: Math.floor(t / 60) + ":" + String(t % 60).padStart(2, "0"),
      note: "",
      values: { cutRate: cut[Math.floor(i / 4) % 3], shotDuration: shot[Math.floor(i / 5) % 3], valueKey: key[Math.floor(i / 3) % 3], warmCool: warm[Math.floor(i / 6) % 5], saturation: Math.floor(i / 7) % 5, contrast: 2 + (Math.floor(i / 8) % 3), colorRange: color[Math.floor(i / 9) % 3] },
    });
  }
  return { id: "video-fake", title: "Beach walk", kind: "film", camera: "measured", source: "my video", note: "made up for a test", media: { videoId: "fake", name: "Beach walk.mp4", duration: 60, step: 2 }, beats };
}
const video = fakeVideo();
const studies = core.CuriosityDB.studiesExport().studies;

ok("myvideo.js loads with no page", () => {
  assert(V && typeof V.rates === "function" && typeof V.versus === "function");
});

ok("only studies whose source is my video are yours", () => {
  const list = [video].concat(studies);
  assert.strictEqual(V.mine(list).map((s) => s.id).join(), "video-fake");
  assert(V.isMine({ source: "My video" }));
  assert(!V.isMine(studies[0]));
  assert(!V.isMine(null));
});

ok("its rates match CurioAttention and CurioRates.measure", () => {
  const r = V.rates(video, { secondsPerBeat: 3, limit: 20 });
  const reading = A.fromStudy(video, { secondsPerBeat: 3, limit: 20 });
  const s = reading.stats;
  assert(r.mine);
  assert.strictEqual(r.title, "Beach walk");
  assert.strictEqual(r.moments, 30);
  assert.strictEqual(r.seconds, reading.seconds);
  assert(r.seconds >= 58 && r.seconds <= 62, "about a minute: " + r.seconds);
  assert(r.moves > 3, "attention moves: " + r.moves);
  assert.strictEqual(r.perMinute, s.switchesPerMinute);
  assert.strictEqual(r.every, Math.round((60 / s.switchesPerMinute) * 10) / 10);
  assert.strictEqual(r.usualHold, s.medianDwell);
  assert.strictEqual(r.longestHold, s.longestDwell);
  assert.strictEqual(r.usualRun, s.medianFamilyRun);
  assert.strictEqual(r.longestRun, Math.max(...s.familyRuns.map((x) => Math.round(x.dur * 10) / 10)));
  assert(["camera", "light"].includes(r.longestFamily));
  assert(r.topCue && V.CUES.includes(r.topCue.cue), "a cue moves it");
  assert.strictEqual(r.topCue.cue, Object.entries(s.cueShare).sort((a, b) => b[1] - a[1])[0][0]);
  const p = R.measure(video, { secondsPerBeat: 3, limit: 20 });
  assert.strictEqual(r.profile.switchesPerMinute, p.switchesPerMinute);
  assert.strictEqual(r.limit, R.limitFor(p));
  assert(r.measuredFamilies.every((f) => ["camera", "light"].includes(f)), "a video is measured from its picture: " + r.measuredFamilies.join(" "));
});

ok("plain sentences side by side: about every N seconds, no em-dashes, no beats", () => {
  const r = V.rates(video, {});
  const pulp = R.DEFAULT_FILMS.find((p) => p.id === "pulp-fiction");
  const out = V.versus(r, [pulp]);
  assert(out.length >= 2);
  assert(new RegExp(`^Your video moves attention about every ${r.every >= 10 ? Math.round(r.every) : r.every} seconds?; Pulp Fiction \\(estimated\\) about every 6\\.7 seconds\\. `).test(out[0]), out[0]);
  assert(/usually holds attention for .* in your video, against about 9 seconds in Pulp Fiction\.$/.test(out[1]), out[1]);
  out.forEach((t) => assert(!/—|\bbeats?\b|undefined|NaN/.test(t), t));
  /* A faster film: "slower than". */
  const fury = R.DEFAULT_FILMS.find((p) => p.id === "fury-road");
  const ratio = r.perMinute / fury.switchesPerMinute;
  assert(ratio < 0.75 ? /slower than Mad Max/.test(V.versus(r, [fury])[0]) : true);
  /* A study that is not yours is called by its title. */
  const other = V.rates(studies[0], {});
  assert(!other.mine);
  if (other.every) assert(V.versus(other, [pulp])[0].startsWith(other.title + " moves attention"));
  assert.strictEqual(V.versus(null, [pulp]).length, 0);
});

ok("the closest curated film is the nearest in pace", () => {
  const r = V.rates(video, {});
  const c = V.closest(r, R.DEFAULT_FILMS);
  const d = (p) => Math.abs(Math.log(p.switchesPerMinute / r.perMinute));
  assert(R.DEFAULT_FILMS.every((p) => d(c) <= d(p)));
  assert.strictEqual(V.closest({ perMinute: 0 }, R.DEFAULT_FILMS), null);
});

ok("the table has the video first, then every curated estimate", () => {
  const r = V.rates(video, {});
  const rows = V.rows(r, R.DEFAULT_FILMS);
  assert.strictEqual(rows.length, R.DEFAULT_FILMS.length + 1);
  assert(rows[0].mine && !rows[0].estimate);
  rows.slice(1).forEach((x, i) => {
    assert(x.estimate && !x.mine);
    assert.strictEqual(x.every, Math.round((60 / R.DEFAULT_FILMS[i].switchesPerMinute) * 10) / 10);
    assert.strictEqual(x.limit, R.limitFor(R.DEFAULT_FILMS[i]));
  });
});

ok("every(): seconds between moves", () => {
  assert.strictEqual(V.every(12), 5);
  assert.strictEqual(V.every(0), null);
});

console.log(`\n${n} your videos' rates checks passed`);

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
      await page.waitForFunction(() => window.CurioMomentumUI && window.CurioMyVideo && window.CuriosityStudy, null, { timeout: 15000 });
    }
    async function openTab(page) {
      await page.evaluate(() => window.CurioMomentumUI.open("myvideo"));
      await page.waitForSelector(".mo-dlg[open] .myv");
    }
    const sideways = (page) => page.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - window.innerWidth);

    const page = await newPage({ width: 1360, height: 900 });
    await openApp(page);
    /* No video yet: the empty state, and its button opens the import window. */
    await page.evaluate(() => document.getElementById("lib-btn").click());
    await page.click("#lib-menu [data-momentum]");
    await page.waitForSelector(".mo-dlg[open]");
    const tabInLearn = await page.evaluate(() => {
      const b = document.querySelector('.mo-dlg [data-tab="myvideo"]');
      return b ? b.closest("[data-tabgroup]").dataset.tabgroup + " / " + b.textContent : "";
    });
    check(tabInLearn === "learn / Your videos' rates", "the tab sits in Learn it: " + tabInLearn);
    const lastTab = await page.$$eval(".mo-dlg .mo-tabs button[data-tab]", (b) => b[b.length - 1].dataset.tab);
    check(lastTab === "report", "Report stays the last tab");
    await page.click('.mo-dlg [data-tab="myvideo"]');
    await page.waitForSelector(".mo-dlg .myv");
    const empty = await page.evaluate(() => (document.querySelector(".mo-dlg .myv-empty") || {}).textContent || "");
    check(/not brought in a video yet/.test(empty) && /Library/.test(empty) && /Bring in a video/.test(empty), "the empty state says how to bring in a video");
    check(await page.evaluate(() => !!document.querySelector(".mo-dlg .myv-tiles")), "with no video the tab still studies a curated film");
    await page.screenshot({ path: path.join(SHOTS, "myvideo-empty.png") });
    await page.click(".mo-dlg [data-myv-bring]");
    await page.waitForSelector(".cm-media[open]", { timeout: 5000 }).catch(() => {});
    check(await page.evaluate(() => !!document.querySelector(".cm-media[open]") && !document.querySelector(".mo-dlg[open]")), "Bring in a video opens the import window");
    await page.screenshot({ path: path.join(SHOTS, "myvideo-bring.png") });
    await page.keyboard.press("Escape");

    /* A made-up video, added in the page the way media.js adds one. */
    await page.evaluate((s) => window.CuriosityStudy.add(s), video);
    await openTab(page);
    const read = await page.evaluate(() => ({
      list: [...document.querySelectorAll(".mo-dlg .myv-list li")].map((l) => l.textContent.replace(/\s+/g, " ").trim()),
      tiles: [...document.querySelectorAll(".mo-dlg .myv-tiles .mo-tile")].map((t) => t.textContent.replace(/\s+/g, " ").trim()),
      vs: [...document.querySelectorAll(".mo-dlg .myv-vs li")].map((l) => l.textContent),
      rows: [...document.querySelectorAll(".mo-dlg .myv-table tbody tr")].map((r) => ({ me: r.classList.contains("myv-me"), text: r.textContent.replace(/\s+/g, " ").trim() })),
      picker: [...document.querySelectorAll(".mo-dlg [data-myv-pick] optgroup")].map((g) => g.label + ":" + g.children.length),
      text: document.querySelector(".mo-dlg .myv").innerText,
      limitBtn: (document.querySelector(".mo-dlg [data-myv-limit]") || {}).dataset,
    }));
    check(read.list.length === 1 && /Beach walk/.test(read.list[0]) && /about every/.test(read.list[0]), "the video is listed: " + read.list[0]);
    check(read.tiles.length === 5 && /Attention moves\s*every/.test(read.tiles[0]) && /(Fresh|Getting long|Too long)/.test(read.tiles[3]), "five tiles, with a status mark: " + read.tiles[3]);
    check(read.vs.length >= 2 && /^Your video moves attention about every [\d.]+ seconds?; .+ about every [\d.]+ seconds?\./.test(read.vs[0]), "a plain side-by-side sentence: " + read.vs[0]);
    check(read.rows.length === 13 && read.rows[0].me && read.rows.slice(1).every((r) => /estimate/.test(r.text)), `the table has the video and 12 estimates (${read.rows.length})`);
    check(read.picker[0] === "Your videos:1" && /Other curated films/.test(read.picker[1] || ""), "the picker lists your videos first: " + read.picker.join(", "));
    check(!/—|\bbeats?\b|undefined|NaN/.test(read.text), "no em-dashes, beats, undefined or NaN");
    await page.screenshot({ path: path.join(SHOTS, "myvideo-top.png") });
    await page.evaluate(() => (document.querySelector(".mo-dlg").scrollTop = 1200));
    await page.screenshot({ path: path.join(SHOTS, "myvideo-more.png") });

    /* Use this film's rates as my limit. */
    const want = Number(read.limitBtn && read.limitBtn.myvLimit);
    await page.click(".mo-dlg [data-myv-limit]");
    await page.waitForSelector(".mo-dlg .myv .mo-flash");
    const after = await page.evaluate(() => ({
      ctxLimit: window.CurioMomentumUI.context().limit(),
      saved: JSON.parse(localStorage.getItem("curiosities-momentum-v1")).limit,
      flash: document.querySelector(".mo-dlg .myv .mo-flash").textContent,
      disabled: document.querySelector(".mo-dlg [data-myv-limit]").disabled,
    }));
    check(want > 0 && after.ctxLimit === want && after.saved === want, `the limit is now ${after.ctxLimit} and saved (${after.saved}), as the video suggests (${want})`);
    check(/Your limit is now/.test(after.flash) && after.disabled, "it says so, and the button rests: " + after.flash);
    /* Add it to the films you compare with (the Momentum window's own Measure). */
    await page.click(".mo-dlg .myv [data-measure]");
    const cmp = await page.evaluate(() => JSON.parse(localStorage.getItem("curiosities-momentum-v1")).compare);
    check(cmp.includes("measured-video-fake"), "the video joins the films to compare with");
    await page.waitForSelector(".mo-dlg .myv");
    if (!(await page.evaluate(() => !!document.querySelector('.mo-dlg [data-tab="myvideo"][aria-selected="true"]')))) await openTab(page);

    /* The picker: any other film. */
    const other = await page.$$eval(".mo-dlg [data-myv-pick] option", (o) => o.map((x) => x.value).find((v) => v !== "video-fake"));
    await page.selectOption(".mo-dlg [data-myv-pick]", other);
    await page.waitForFunction((v) => document.querySelector(".mo-dlg [data-myv-pick]") && document.querySelector(".mo-dlg [data-myv-pick]").value === v, other);
    const otherHead = await page.evaluate(() => document.querySelector(".mo-dlg .myv h3:not(:first-child), .mo-dlg .myv section:nth-of-type(2) h3").textContent);
    check(!/^Your video/.test(otherHead), "another film is studied by its own name: " + otherHead);

    /* A phone. */
    const phone = await newPage({ width: 375, height: 800 });
    await openApp(phone);
    await phone.evaluate((s) => window.CuriosityStudy.add(s), video);
    await openTab(phone);
    check((await sideways(phone)) <= 0, "no sideways scroll at 375 pixels wide");
    await phone.screenshot({ path: path.join(SHOTS, "myvideo-phone.png"), fullPage: false });
    await phone.evaluate(() => (document.querySelector(".mo-dlg").scrollTop = 1400));
    await phone.screenshot({ path: path.join(SHOTS, "myvideo-phone-more.png") });

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
