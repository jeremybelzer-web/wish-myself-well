/* Watch and tap (momentum/tap.js): node momentum/tests/tap.js [--browser [--three <three.min.js>] [--shots <dir>]]
   With no page: taps become beats at the chosen beat length (beat boundaries: the family held longest in a
      beat wins), CurioAttention.read gives back exactly the tapped families, cues and stops, CurioRates.measure
      measures the trace, and mergeTaps takes the family most tappings chose at each beat.
   With --browser (NODE_PATH=/opt/node22/lib/node_modules): opens the app's index.html, opens Momentum and the
      Watch and tap tab, runs the stopwatch, taps by click and by key (with a cue and a stop), checks the ribbon
      grows, Undo, saves as a curated film (it appears in the film picker), averages a second tapping of the same
      title, no page errors, and no sideways scroll at 375 pixels wide. Screenshots go to --shots. */
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
["notes.js", "attention.js", "rates.js", "tap.js"].forEach((f) => {
  const file = path.join(ROOT, "momentum", f);
  vm.runInContext(fs.readFileSync(file, "utf8"), vm.isContext(ctx) ? ctx : vm.createContext(ctx), { filename: file });
});
const T = ctx.CurioTap;
const A = ctx.CurioAttention;
const R = ctx.CurioRates;
const M = ctx.CurioMomentum;
let n = 0;
const ok = (name, fn) => {
  fn();
  n++;
  console.log("ok", name);
};
const fams = (beats) => beats.map((b) => b.family);
const plain = (x) => JSON.parse(JSON.stringify(x));
const deq = (a, b, m) => assert.deepStrictEqual(plain(a), plain(b), m);

ok("tap.js loads with no page: 13 families, each with its own key", () => {
  assert(T && typeof T.tapsToBeats === "function" && typeof T.mergeTaps === "function");
  assert.strictEqual(T.families().length, 13);
  assert.strictEqual(new Set(T.FAMILY_KEYS).size, 13);
  T.families().forEach((f) => {
    const m = T.mark(f);
    assert(/^#[0-9a-f]{6}$/i.test(m.color) && m.letter, f);
  });
});

ok("beat boundaries: one beat per beat length from 0, the family held longest in a beat wins", () => {
  const taps = [
    { t: 0.5, family: "camera" },
    { t: 4.0, family: "voice" }, /* beat 1 (3 to 6): camera 1 s, voice 2 s */
    { t: 8.9, family: "plot" }, /* beat 2 (6 to 9): voice 2.9 s, plot 0.1 s */
  ];
  const b = T.tapsToBeats(taps, { beat: 3, end: 12 });
  assert.strictEqual(b.length, 4);
  deq(b.map((x) => x.at), ["0:00", "0:03", "0:06", "0:09"]);
  deq(fams(b), ["camera", "voice", "voice", "plot"]);
  deq(b.map((x) => x.move), [true, true, false, true]);
  /* Time before the first tap is not a family: the first beat with any tap in it takes that family. */
  const b2 = T.tapsToBeats([{ t: 2, family: "camera" }], { beat: 3, end: 6 });
  deq(fams(b2), ["camera", "camera"]);
  deq(fams(T.tapsToBeats([{ t: 7, family: "camera" }], { beat: 3 })), [null, null, "camera"]);
  /* A tie inside one beat goes to the family tapped later. */
  const tie = T.tapsToBeats([{ t: 0, family: "camera" }, { t: 1.5, family: "music" }], { beat: 3, end: 3 });
  deq(fams(tie), ["music"]);
  /* Order of the taps given does not matter, and the end defaults to the last tap plus a little. */
  const shuffled = T.tapsToBeats([taps[2], taps[0], taps[1]], { beat: 3 });
  deq(fams(shuffled), ["camera", "voice", "voice", "plot"]);
  /* Another beat length. */
  deq(fams(T.tapsToBeats(taps, { beat: 2, end: 12 })), ["camera", "camera", "voice", "voice", "plot", "plot"]);
  deq(T.tapsToBeats([], {}), []);
});

ok("the trace reads back exactly: CurioAttention.read gives the tapped families in order", () => {
  const order = ["camera", "voice", "feeling", "camera", "music", "plot", "comedy", "place", "light", "wardrobe", "mind", "effects", "cut", "movement", "voice"];
  const taps = order.map((f, i) => ({ t: i * 6 + 0.2, family: f }));
  const beats = T.tapsToBeats(taps, { beat: 3 });
  const r = A.read(beats, { secondsPerBeat: 3 });
  deq(r.segments.map((s) => s.family), order);
  deq(r.segments.map((s) => s.from), order.map((_, i) => i * 6));
  assert.strictEqual(r.stats.switches, order.length - 1);
  /* Only the beats where attention moved carry a value, and only one. */
  beats.forEach((b) => assert.strictEqual(Object.keys(b.values).length, b.move ? 1 : 0));
});

ok("cues: every cue a family has a curiosity for reads back as that cue", () => {
  let exact = 0;
  T.families().forEach((f) => {
    M.CUES.forEach((c) => {
      const pick = T.standIn(f, c.id);
      assert(pick, `${f} has a stand-in`);
      const beats = T.tapsToBeats([{ t: 0, family: f === "plot" ? "camera" : "plot" }, { t: 3, family: f, cue: c.id }], { beat: 3, end: 6 });
      const s = A.read(beats, { secondsPerBeat: 3 }).segments[1];
      assert.strictEqual(s.family, f);
      assert.strictEqual(beats[1].cue, c.id, "the beat keeps the tapped cue");
      if (pick.exact) {
        exact++;
        assert.strictEqual(s.cue, c.id, `${f} on a ${c.id} cue`);
      } else assert.strictEqual(s.cue, M.family(f).cue, `${f} falls back to its usual cue`);
    });
  });
  assert(exact >= 40, "most family and cue pairs are exact: " + exact);
  /* No cue: the family's usual cue. */
  const b = T.tapsToBeats([{ t: 0, family: "music" }], { beat: 3 });
  assert.strictEqual(A.read(b, {}).segments[0].cue, "audio");
  assert.strictEqual(b[0].cue, null);
});

ok("stops: a tap marked as a stop reads back as a quiet cue, again and again", () => {
  const taps = [];
  for (let i = 0; i < 12; i++) taps.push({ t: i * 3, family: i % 2 ? "music" : "voice", stop: i % 4 === 1 || i % 4 === 2, cue: i % 3 ? "audio" : null });
  const beats = T.tapsToBeats(taps, { beat: 3 });
  const r = A.read(beats, { secondsPerBeat: 3 });
  assert.strictEqual(r.segments.length, 12);
  deq(r.segments.map((s) => s.quiet), taps.map((t) => t.stop));
  deq(beats.map((b) => b.quiet), taps.map((t) => t.stop));
  assert.strictEqual(r.stats.quietShare, Math.round((6 / 12) * 1000) / 1000);
});

ok("taps of the same family in a row are one stretch, and the cue is the one that moved attention there", () => {
  const b = T.tapsToBeats([{ t: 0, family: "camera" }, { t: 3, family: "voice", cue: "audio", stop: true }, { t: 6, family: "voice", cue: "plot" }], { beat: 3, end: 9 });
  deq(b.map((x) => x.move), [true, true, false]);
  assert.strictEqual(b[2].cue, "audio");
  assert.strictEqual(b[2].quiet, true);
  assert.strictEqual(A.read(b, {}).segments.length, 2);
});

ok("CurioRates.measure measures a tapped film like any traced film", () => {
  const taps = [];
  const order = ["voice", "feeling", "voice", "plot", "music", "voice"];
  order.forEach((f, i) => taps.push({ t: i * 9, family: f, cue: i === 4 ? "audio" : "visual", stop: i === 2 }));
  const st = T.study(T.tapsToBeats(taps, { beat: 3, end: 60 }), { title: "  Jaws ", beat: 3 });
  assert.strictEqual(st.title, "Jaws");
  assert.strictEqual(st.source, "watched and tapped");
  assert.strictEqual(st.id, "tapped-jaws");
  assert(!("note" in st) && st.beats.every((b) => !("note" in b)), "no notes");
  const p = R.measure(st, { secondsPerBeat: 3 });
  assert.strictEqual(p.estimate, false);
  assert.strictEqual(p.title, "Jaws");
  assert.strictEqual(p.switchesPerMinute, 5);
  assert.strictEqual(p.familyShare.voice, 0.55, "voice holds 33 of 60 seconds");
  assert.strictEqual(p.moveCues.voice.feeling.n, 1);
  assert.strictEqual(R.howItMoves([p], "plot", "music").cue, "audio");
});

ok("mergeTaps: the family most tappings chose at each beat, ties keep what held before", () => {
  const a = T.tapsToBeats([{ t: 0, family: "camera" }, { t: 6, family: "voice", cue: "audio" }, { t: 12, family: "plot" }], { beat: 3, end: 18 });
  const b = T.tapsToBeats([{ t: 0, family: "camera" }, { t: 3, family: "voice", cue: "audio", stop: true }, { t: 12, family: "music" }], { beat: 3, end: 18 });
  const c = T.tapsToBeats([{ t: 0, family: "feeling" }, { t: 6, family: "voice", cue: "thought", stop: true }, { t: 15, family: "plot" }], { beat: 3, end: 18 });
  const m = T.mergeTaps([a, b, c]);
  /* beat:      0       1        2      3      4                  5 */
  /* a:      camera  camera    voice  voice  plot               plot */
  /* b:      camera  voice     voice  voice  music              music */
  /* c:      feeling feeling   voice  voice  voice              plot */
  deq(fams(m), ["camera", "camera", "voice", "voice", "voice", "plot"]);
  /* Beat 4 is a three-way tie (plot, music, voice): voice held before, so it stays. */
  /* The cue where it moved to voice: of the tappings that moved there at beat 2, a says audio, c says thought,
     a tie, so the earliest tapping's; stops: c only (1 of 2), so not a stop. */
  assert.strictEqual(m[2].cue, "audio");
  assert.strictEqual(m[2].quiet, false);
  const r = A.read(m, { secondsPerBeat: 3 });
  deq(r.segments.map((s) => s.family), ["camera", "voice", "plot"]);
  /* Two tappings that agree give the same trace. */
  deq(fams(T.mergeTaps([a, a])), fams(a));
  /* A study works as a trace too, and a different beat length is resampled. */
  const longer = T.tapsToBeats([{ t: 0, family: "camera" }, { t: 6, family: "voice" }, { t: 12, family: "plot" }], { beat: 6, end: 18 });
  deq(fams(T.mergeTaps([{ beats: a }, longer], { beat: 3 })), ["camera", "camera", "voice", "voice", "plot", "plot"]);
  deq(plain(T.mergeTaps([])), []);
  /* Two against one on a stop. */
  const s1 = T.tapsToBeats([{ t: 0, family: "camera" }, { t: 3, family: "music", stop: true, cue: "audio" }], { beat: 3, end: 6 });
  const s2 = T.tapsToBeats([{ t: 0, family: "camera" }, { t: 3, family: "music", stop: true }], { beat: 3, end: 6 });
  const s3 = T.tapsToBeats([{ t: 0, family: "camera" }, { t: 3, family: "music", cue: "visual" }], { beat: 3, end: 6 });
  const ms = T.mergeTaps([s1, s2, s3]);
  assert.strictEqual(ms[1].quiet, true);
  assert.strictEqual(A.read(ms, {}).segments[1].quiet, true);
  assert.strictEqual(ms[1].cue, "audio", "audio and visual tie, so the earliest tapping's cue");
});

console.log(`\n${n} watch and tap checks passed`);

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
      page.on("dialog", (d) => d.accept());
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
      await page.waitForFunction(() => window.CurioMomentumUI && window.CurioTap && window.CuriosityStudy, null, { timeout: 10000 });
    }
    const ribbon = (page) => page.evaluate(() => ({ cells: document.querySelectorAll(".mo-dlg .mtp-rib .mtp-cell:not(.mtp-none)").length, tally: (document.querySelector(".mo-dlg .mtp-tally") || {}).textContent || "" }));

    const page = await newPage({ width: 1360, height: 900 });
    await openApp(page);
    await page.evaluate(() => document.getElementById("lib-btn").click());
    await page.click("#lib-menu [data-momentum]");
    await page.waitForSelector(".mo-dlg[open]");
    const tabs = await page.$$eval(".mo-dlg .mo-tabs button", (b) => b.map((x) => x.textContent));
    check(tabs.includes("Watch and tap"), "Momentum has a Watch and tap tab");
    await page.click('.mo-dlg [data-tab="tap"]');
    await page.waitForSelector(".mo-dlg .mtp");
    const group = await page.evaluate(() => {
      const b = document.querySelector('.mo-dlg [data-tab="tap"]');
      const g = b && b.closest(".mo-tabgroup");
      return g ? g.textContent : "";
    });
    check(/Learn it/.test(group), "it sits in the Learn it group");
    check((await page.$$eval(".mo-dlg [data-tp-pad]", (b) => b.length)) === 13, "13 family pads");
    check((await page.$$eval(".mo-dlg [data-tp-cue]", (b) => b.length)) === 6, "a cue row: no cue and the five cues");
    await page.screenshot({ path: path.join(SHOTS, "tap-empty.png") });

    /* The stopwatch runs. */
    await page.click(".mo-dlg [data-tp=start]");
    await page.waitForTimeout(700);
    const c1 = await page.textContent(".mo-dlg .mtp-clock");
    check(/^0:00\.[4-9]|^0:01/.test(c1), "the stopwatch runs: " + c1);
    check((await page.textContent(".mo-dlg [data-tp=start]")) === "Pause", "Start becomes Pause");

    /* Tap by click, with a cue. */
    await page.click('.mo-dlg [data-tp-pad="camera"]');
    const r1 = await ribbon(page);
    check(r1.cells === 1, "one tap draws one stretch on the ribbon");
    await page.waitForTimeout(400);
    await page.click('.mo-dlg [data-tp-cue="audio"]');
    check((await page.getAttribute('.mo-dlg [data-tp-cue="audio"]', "aria-pressed")) === "true", "the audio cue is picked");
    await page.click('.mo-dlg [data-tp-pad="voice"]');
    /* Tap by keys: T (thought cue), then Shift+5 (a stop, the fifth pad). */
    await page.waitForTimeout(300);
    await page.evaluate(() => document.activeElement && document.activeElement.blur());
    await page.keyboard.press("t");
    check((await page.getAttribute('.mo-dlg [data-tp-cue="thought"]', "aria-pressed")) === "true", "key T picks the thought cue");
    await page.keyboard.press("Shift+Digit5");
    await page.waitForTimeout(300);
    await page.keyboard.press("Digit6");
    const state = await page.evaluate(() => JSON.parse(localStorage.getItem("curiosities-momentum-tap-v1")));
    const fam5 = await page.evaluate(() => window.CurioTap.families()[4]);
    check(state.taps.length === 4, "four taps kept: " + state.taps.map((t) => t.family).join(", "));
    check(state.taps[1].cue === "audio" && state.taps[2].family === fam5 && state.taps[2].stop && state.taps[2].cue === "thought", "the key tap kept its cue and its stop");
    check(state.taps.every((t, i) => !i || t.t >= state.taps[i - 1].t), "taps are in time order");
    const list = await page.$$eval(".mo-dlg .mtp-taps li", (l) => l.map((x) => x.textContent.replace(/\s+/g, " ").trim()));
    check(list.length === 4 && /something stopped/.test(list[1]), "the last taps are listed: " + list[1]);
    const nowLine = await page.textContent(".mo-dlg .mtp-now");
    check(/has held your attention for/.test(nowLine) && /(Fresh|Getting long|Too long)/.test(nowLine), "it says what holds attention now: " + nowLine.trim());

    /* Ribbon updates as the film goes on, Undo takes a tap back. */
    await page.evaluate(() => window.CuriosityStudy && null);
    await page.selectOption(".mo-dlg [data-tp=beat]", "1");
    const before = await ribbon(page);
    await page.keyboard.press("Backspace");
    const after = await ribbon(page);
    const st2 = await page.evaluate(() => JSON.parse(localStorage.getItem("curiosities-momentum-tap-v1")));
    check(st2.taps.length === 3 && after.cells === before.cells - 1, `Undo takes back the last tap (${before.cells} to ${after.cells} stretches)`);
    await page.click(".mo-dlg [data-tp=undo]");
    await page.click('.mo-dlg [data-tp-pad="plot"]');
    await page.waitForTimeout(1200);
    const later = await ribbon(page);
    check(/3 taps/.test(later.tally) && /beats of 1 second,/.test(later.tally), "the tally follows: " + later.tally);
    await page.screenshot({ path: path.join(SHOTS, "tap-tapping.png") });
    await page.click(".mo-dlg [data-tp=start]");
    check((await page.textContent(".mo-dlg [data-tp=start]")) === "Go on", "Pause stops the clock");

    /* Save as a curated film. */
    await page.click(".mo-dlg [data-tp=save]");
    check(/Type the film's title/.test(await page.textContent(".mo-dlg .mtp-flash")), "saving asks for a title first");
    await page.fill(".mo-dlg [data-tp=title]", "Test Film");
    await page.click(".mo-dlg [data-tp=save]");
    const saved = await page.evaluate(() => {
      const s = window.CuriosityStudy.studies().filter((x) => x.source === "watched and tapped");
      return { n: s.length, s: s[0] && { id: s[0].id, title: s[0].title, beats: s[0].beats.length, tappings: s[0].tappings.length, notes: s[0].beats.some((b) => b.note) || !!s[0].note } };
    });
    check(saved.n === 1 && saved.s.title === "Test Film" && saved.s.beats >= 3 && !saved.s.notes, "saved as a curated film, no notes: " + JSON.stringify(saved.s));
    const flash = await page.textContent(".mo-dlg .mtp-flash");
    check(/Saved "Test Film"/.test(flash) && /Film rates/.test(flash), "it says where to find it: " + flash.slice(0, 80));
    await page.screenshot({ path: path.join(SHOTS, "tap-saved.png") });
    /* The film picker (Cue lab's, the window's own sourcePicker) lists it, and Cue lab reads it as a trace. */
    await page.click('.mo-dlg [data-tab="cuelab"]');
    await page.waitForSelector(".mo-dlg .mcl");
    const picker = await page.$$eval(".mo-dlg [data-cl-source] option", (o) => o.map((x) => x.value + "|" + x.textContent));
    check(picker.some((s) => s.startsWith("study:" + saved.s.id + "|Test Film")), "the saved film is in the film picker");
    const lab = await page.$$eval(".mo-dlg .mcl-table tbody tr", (r) => r.map((x) => x.textContent));
    check(lab.some((t) => /Test Film/.test(t)), "Cue lab reads it as a film with a trace");

    /* Film rates measures it as a measured film. */
    await page.click('.mo-dlg [data-tab="rates"]');
    await page.click(`.mo-dlg [data-measure="${saved.s.id}"]`);
    const rates = await page.evaluate(() => [...document.querySelectorAll(".mo-dlg .mo-rates tbody tr")].map((r) => r.textContent.replace(/\s+/g, " ")).filter((t) => /Test Film/.test(t)));
    check(rates.length === 1 && /measured/.test(rates[0]), "Film rates measures it: " + (rates[0] || "").slice(0, 80));

    /* A second tapping of the same title is averaged in. */
    await page.click('.mo-dlg [data-tab="tap"]');
    await page.waitForSelector(".mo-dlg .mtp");
    await page.click(".mo-dlg [data-tp=start]");
    await page.click('.mo-dlg [data-tp-pad="camera"]');
    await page.waitForTimeout(500);
    await page.click('.mo-dlg [data-tp-pad="music"]');
    await page.waitForTimeout(500);
    await page.click(".mo-dlg [data-tp=start]");
    await page.fill(".mo-dlg [data-tp=title]", "test film");
    check(await page.isVisible(".mo-dlg .mtp-avg"), "it offers to average with the earlier tapping");
    await page.click(".mo-dlg [data-tp=save]");
    const avg = await page.evaluate(() => window.CuriosityStudy.studies().filter((x) => x.source === "watched and tapped").map((s) => ({ id: s.id, tappings: s.tappings.length })));
    check(avg.length === 1 && avg[0].tappings === 2, "averaged into the same film: " + JSON.stringify(avg));
    check(/average of 2 tappings/.test(await page.textContent(".mo-dlg .mtp-flash")), "it says it averaged 2 tappings");

    /* Phone width. */
    const phone = await newPage({ width: 375, height: 800 });
    await openApp(phone);
    await phone.evaluate(() => window.CurioMomentumUI.open("tap"));
    await phone.waitForSelector(".mo-dlg .mtp");
    await phone.click(".mo-dlg [data-tp=start]");
    for (const f of ["voice", "feeling", "comedy"]) {
      await phone.click(`.mo-dlg [data-tp-pad="${f}"]`);
      await phone.waitForTimeout(250);
    }
    const fit = await phone.evaluate(() => {
      const d = document.querySelector(".mo-dlg");
      return { page: document.documentElement.scrollWidth - window.innerWidth, dlg: d.scrollWidth - d.clientWidth };
    });
    check(fit.page <= 0 && fit.dlg <= 0, `no sideways scroll at phone width (page ${fit.page}px, window ${fit.dlg}px over)`);
    await phone.screenshot({ path: path.join(SHOTS, "tap-phone.png") });
    await phone.evaluate(() => (document.querySelector(".mo-dlg").scrollTop = 700));
    await phone.screenshot({ path: path.join(SHOTS, "tap-phone-more.png") });
    await phone.evaluate(() => (document.querySelector(".mo-dlg").scrollTop = 99999));
    await phone.screenshot({ path: path.join(SHOTS, "tap-phone-end.png") });

    const text = await page.evaluate(() => (document.querySelector(".mo-dlg .mtp") || {}).textContent || "");
    check(!/—/.test(text), "no em-dashes in the tab");
    check(errors.length === 0, "no page errors" + (errors.length ? ": " + errors.slice(0, 3).join(" | ") : ""));
    await browser.close();
    server.close();
    console.log(failed ? `\n${failed} failed` : "\nall watch and tap browser checks passed");
    process.exit(failed ? 1 : 0);
  })().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
