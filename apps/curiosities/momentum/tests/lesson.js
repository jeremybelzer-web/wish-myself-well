/* The "Learn it" lesson: node momentum/tests/lesson.js [--browser [--three <three.min.js>] [--shots <dir>]]
   With no page: loads the shared core and the curiosity database (as tests/run.js does), the momentum core and
   lesson.js, then checks lessonSteps on every practice scene and on made-up films (kinds of step, times, the
   barometer, the sentences, the quick checks and their kind words).
   With --browser (NODE_PATH=/opt/node22/lib/node_modules): opens the app's index.html, opens Momentum and the
   "Learn it" tab, steps with Next, Back and the arrow keys, answers a quick check, skips the quiet holds, jumps
   from the list, checks the step is remembered, watches a moment of the engine's film on the Screen, and checks
   a phone width. The page must report no errors. Screenshots go to --shots (default: the system temp folder). */
const path = require("path");
const fs = require("fs");
const vm = require("vm");
const os = require("os");
const assert = require("assert");

const args = process.argv.slice(2);
const arg = (n, d) => (args.includes(n) ? args[args.indexOf(n) + 1] : d);
const ROOT = path.join(__dirname, "..", "..");

/* ---------- with no page ---------- */
const core = require(path.join(ROOT, "core", "headless.js")).load();
const ctx = core.window;
["notes.js", "attention.js", "rates.js", "compass.js", "engine-lanes.js", "lesson.js"].forEach((f) => {
  const file = path.join(ROOT, "momentum", f);
  vm.runInContext(fs.readFileSync(file, "utf8"), vm.isContext(ctx) ? ctx : vm.createContext(ctx), { filename: file });
});
const L = ctx.CurioLesson;
const A = ctx.CurioAttention;
const M = ctx.CurioMomentum;
let n = 0;
const ok = (name, fn) => {
  fn();
  n++;
  console.log("ok", name);
};
const studies = core.CuriosityDB.studiesExport().studies;
const lessonOf = (beats, o) => {
  const opts = Object.assign({ secondsPerBeat: 3, limit: 20 }, o || {});
  return L.lessonSteps(A.read(beats, opts), Object.assign({ beats }, opts));
};

ok("lesson.js loads with no page and exports a pure lessonSteps", () => {
  assert(L && typeof L.lessonSteps === "function" && typeof L.check === "function");
  assert.strictEqual(L.KEY, "curiosities-momentum-lesson-v1");
  const empty = L.lessonSteps(A.read([], {}), {});
  assert.strictEqual(empty.steps.length, 0);
});
ok("every family has its own letter, and every cue has plain words", () => {
  const letters = M.FAMILIES.map((f) => L.LETTERS[f.id]);
  letters.forEach((x, i) => assert(x, M.FAMILIES[i].id + " has no letter"));
  assert.strictEqual(new Set(letters).size, letters.length, "letters repeat");
  M.CUES.forEach((c) => assert(L.CUE_WORDS[c.id] && L.CUE_WORDS[c.id].short, c.id + " has no words"));
});
ok("every practice scene gives one step per beat, in time order, with two or three plain sentences", () => {
  studies.forEach((s) => {
    const les = lessonOf(s.beats);
    assert.strictEqual(les.steps.length, s.beats.length, s.id);
    les.steps.forEach((st, i) => {
      assert.strictEqual(st.beat, i);
      assert(i === 0 || st.at >= les.steps[i - 1].at, s.id + " time goes backwards");
      assert(["start", "move", "shift", "hold", "empty"].includes(st.kind));
      assert(st.sentences.length >= 2 && st.sentences.length <= 3, s.id + " sentence count");
      st.sentences.forEach((t) => {
        assert(/^[A-Z]/.test(t) && /[.!?:]$/.test(t.trim()) || /Try this/.test(t), "a full sentence: " + t);
        assert(!/—/.test(t), "no em-dashes: " + t);
        assert(!/undefined|NaN|null/.test(t), "no gaps: " + t);
      });
      if (st.family) {
        assert(st.letter && st.familyLabel && st.label);
        assert(["Fresh", "Getting long", "Too long"].includes(st.status.text));
      }
    });
    assert.strictEqual(les.steps[0].kind, "start", s.id + " starts with the first thing");
    assert.strictEqual(les.moves, les.steps.filter((x) => x.kind === "move").length);
  });
});
ok("times come from the film's own beats (the diner scene's clock)", () => {
  const s = studies.find((x) => x.id === "model-diner-standoff") || studies[0];
  const les = lessonOf(s.beats);
  const r = A.read(s.beats, { secondsPerBeat: 3, limit: 20 });
  r.segments.forEach((seg) => assert.strictEqual(les.steps[seg.beat].at, seg.from));
  /* Without the beats, segment starts are still exact. */
  const guess = L.lessonSteps(r, { limit: 20 });
  r.segments.forEach((seg) => assert.strictEqual(guess.steps[seg.beat].at, seg.from));
});

/* A made-up film: a camera move for three beats, a joke setup held for eight beats (too long), then a feeling. */
const film = [
  { values: { cameraMove: "push in" } },
  { values: { cameraMove: "push in" } },
  { values: { cameraMove: "push in" } },
  { values: { comicBeat: "setup" } },
  ...Array.from({ length: 7 }, () => ({ values: {} })),
  { values: { emoRoadCharacter: "lowest" } },
  { values: {} },
];
ok("a made-up film: start, holds, a move with the last stretch, and a too-long barometer", () => {
  const les = lessonOf(film, { limit: 12 });
  const k = les.steps.map((s) => s.kind);
  assert.strictEqual(k[0], "start");
  assert.strictEqual(k[1], "hold");
  const mv = les.steps.filter((s) => s.kind === "move");
  assert(mv.length >= 1, "a move: " + k.join(","));
  const first = mv[0];
  assert(first.before && first.before.held > 0);
  assert(/Before that, .+ held attention for \d+ seconds/.test(first.sentences[1]), first.sentences[1]);
  assert(/At \d+:\d\d, .+ takes attention away from .+, with .+ \(an? \w+ cue\)\./.test(first.sentences[0]), first.sentences[0]);
  /* A long hold climbs through the barometer to too long. */
  const statuses = les.steps.map((s) => s.status.text);
  assert(statuses.includes("Too long"), statuses.join(","));
  const tooLong = les.steps.find((s) => s.status.text === "Too long");
  assert.strictEqual(tooLong.status.icon, "■");
  assert(tooLong.held > 12);
  assert(/too long: the audience starts to drift/.test(tooLong.sentences[1]), tooLong.sentences[1]);
  /* A move after a long stretch says it came late. */
  const late = mv.find((s) => s.before.held > 12);
  if (late) assert(/came late/.test(late.sentences[1]), late.sentences[1]);
});
ok("Try this comes from the curiosity's momentum note", () => {
  const s = studies[0];
  const les = lessonOf(s.beats);
  les.steps.filter((st) => st.family).forEach((st) => {
    const note = M.note(st.curiosity);
    if (note.tryThis) {
      assert.strictEqual(st.tryThis, note.tryThis);
      assert.strictEqual(st.sentences[2], "Try this in your film: " + note.tryThis);
    }
  });
});
ok("a quick check every few moments, three choices, exactly one right, the same each time", () => {
  studies.forEach((s) => {
    const les = lessonOf(s.beats);
    const qs = les.steps.filter((st) => st.quiz);
    assert(qs.length >= 1 || s.beats.length < 3, s.id + " has a quick check");
    assert.strictEqual(qs.length, les.quizzes);
    qs.forEach((st) => {
      const q = st.quiz;
      assert.strictEqual(q.choices.length, 3);
      assert.strictEqual(q.choices.map((c) => c.key).join(), "a,b,c");
      assert.strictEqual(new Set(q.choices.map((c) => c.id)).size, 3, "choices repeat");
      assert.strictEqual(q.choices.filter((c) => c.id === q.answer).length, 1, "one right answer");
      if (q.kind === "cue") assert.strictEqual(q.answer, st.cue);
      if (q.kind === "family") assert.strictEqual(q.answer, st.family);
      if (q.kind === "status") assert.strictEqual(q.answer, st.status.text);
      if (q.kind !== "status") assert(st.moved, "cue and family questions only where attention moved");
    });
    const again = lessonOf(s.beats);
    assert.strictEqual(JSON.stringify(again.steps.map((x) => x.quiz)), JSON.stringify(les.steps.map((x) => x.quiz)), s.id + " asks the same way each time");
  });
  const les = lessonOf(studies[0].beats, { quizEvery: 2 });
  assert(les.quizzes >= Math.floor(studies[0].beats.length / 2) - 1, "quizEvery sets how often");
});
ok("the cue question offers a sound, a movement, a thought style answers", () => {
  const all = [].concat(...studies.map((s) => lessonOf(s.beats).steps.filter((st) => st.quiz && st.quiz.kind === "cue")));
  assert(all.length >= 1);
  const q = all[0].quiz;
  assert.strictEqual(q.question, "What took attention here?");
  const words = Object.values(L.CUE_WORDS).map((w) => w.short);
  q.choices.forEach((c) => assert(words.includes(c.text), c.text));
});
ok("check() answers kindly, right or wrong", () => {
  const st = lessonOf(studies[0].beats).steps.find((x) => x.quiz);
  const right = L.check(st.quiz, st.quiz.answer);
  assert(right.right && /^Right\./.test(right.text));
  const wrongId = st.quiz.choices.find((c) => c.id !== st.quiz.answer).id;
  const wrong = L.check(st.quiz, wrongId);
  assert(!wrong.right && /^Not quite, and that is fine: the answer is [abc]\) /.test(wrong.text), wrong.text);
});
ok("a film whose first beat changes nothing starts with an empty step", () => {
  const les = lessonOf([{ values: { musicMood: "" } }, { values: { musicMood: "tense" } }]);
  assert.strictEqual(les.steps[0].kind, "empty");
  assert.strictEqual(les.steps[1].kind, "start");
});
console.log(`\n${n} lesson checks passed with no page`);

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
      await page.waitForFunction(() => window.CurioMomentumUI && window.CurioLesson, null, { timeout: 10000 });
    }
    const pos = (page) => page.$eval(".mo-dlg .mls-pos", (e) => Number(/Moment (\d+)/.exec(e.textContent)[1]));

    const page = await newPage({ width: 1360, height: 900 });
    await openApp(page);
    await page.evaluate(() => {
      try {
        localStorage.removeItem("curiosities-momentum-lesson-v1");
      } catch (e) {}
      document.getElementById("lib-btn").click();
    });
    await page.click("#lib-menu [data-momentum]");
    await page.waitForSelector(".mo-dlg[open]");
    const tabs = await page.$$eval(".mo-dlg .mo-tabs button", (b) => b.map((x) => x.textContent));
    check(tabs.includes("Learn it") && tabs.indexOf("Learn it") < tabs.indexOf("Perform"), "Momentum has a Learn it tab before Perform: " + tabs.join(" / "));
    await page.click('.mo-dlg [data-tab="lesson"]');
    await page.waitForSelector(".mo-dlg .mls-card");
    const first = await page.evaluate(() => ({
      src: document.querySelector(".mo-dlg [data-ls-source]").value,
      title: document.querySelector(".mo-dlg .mls-title").textContent,
      chip: document.querySelector(".mo-dlg .mls-top .mls-chip").textContent,
      letter: (document.querySelector(".mo-dlg .mls-top .mls-letter") || {}).textContent,
      status: document.querySelector(".mo-dlg .mls-baro .mo-status").textContent,
      text: document.querySelector(".mo-dlg .mls-text").textContent,
      back: document.querySelector('.mo-dlg [data-ls="back"]').disabled,
    }));
    check(/^study:/.test(first.src), "it starts on the first curated film: " + first.src);
    check(!!first.letter && first.chip.length > first.letter.length, `the family chip has its letter and its name: ${first.chip}`);
    check(/[●▲■] (Fresh|Getting long|Too long)/.test(first.status), "the barometer says how long, in words: " + first.status);
    check(/takes the audience's attention first/.test(first.text) && /Try this in your film:/.test(first.text), "the first moment explains itself in plain sentences");
    check(first.back, "Back is off on the first moment");
    await page.screenshot({ path: path.join(SHOTS, "lesson-first.png") });

    await page.click('.mo-dlg [data-ls="next"]');
    check((await pos(page)) === 2, "Next goes to moment 2");
    await page.keyboard.press("ArrowRight");
    check((await pos(page)) === 3, "the right arrow key steps on while the tab has focus");
    await page.keyboard.press("ArrowLeft");
    check((await pos(page)) === 2, "the left arrow key steps back");
    await page.click('.mo-dlg [data-ls="back"]');
    check((await pos(page)) === 1, "Back goes back");

    /* Find the first quick check and answer it wrong, then the next one right. */
    let answered = 0;
    for (let i = 0; i < 40 && answered < 2; i++) {
      if (await page.$(".mo-dlg .mls-quiz")) {
        await page.click(".mo-dlg [data-ls-answer]");
        answered++;
        const said = await page.$eval(".mo-dlg .mls-said", (e) => e.textContent);
        check(/^(Right\.|Not quite, and that is fine)/.test(said), "a quick check answers kindly: " + said.slice(0, 80));
        if (answered === 1) await page.screenshot({ path: path.join(SHOTS, "lesson-quiz.png") });
      }
      const nb = await page.$('.mo-dlg [data-ls="next"]:not([disabled])');
      if (!nb) break;
      await nb.click();
    }
    const score = await page.$eval(".mo-dlg .mls-score", (e) => e.textContent);
    check(answered >= 1 && new RegExp(`\\d of ${answered}`).test(score), `the score counts the session's answers (${score})`);

    /* Skip the quiet holds: the list and Next only visit moments where attention moved. */
    const diner = await page.$$eval(".mo-dlg [data-ls-source] option", (o) => o.map((x) => x.value).find((v) => /diner/.test(v)));
    if (diner) await page.selectOption(".mo-dlg [data-ls-source]", diner);
    await page.waitForSelector(".mo-dlg .mls-card");
    const all = await page.$$eval(".mo-dlg .mls-list li", (l) => l.length);
    await page.check(".mo-dlg [data-ls-skip]");
    const moved = await page.$$eval(".mo-dlg .mls-list li button", (l) => l.filter((b) => b.classList.contains("moved")).length);
    const shown = await page.$$eval(".mo-dlg .mls-list li", (l) => l.length);
    check(shown < all && shown <= moved + 1, `skipping quiet holds leaves ${shown} of ${all} moments`);
    await page.evaluate(() => (document.querySelector(".mo-dlg .mls-list").open = true));
    const target = await page.$$eval(".mo-dlg .mls-list li button", (l) => Number(l[Math.min(2, l.length - 1)].dataset.lsGo));
    await page.click(`.mo-dlg [data-ls-go="${target}"]`);
    check((await pos(page)) === target + 1, `the list jumps to moment ${target + 1}`);
    await page.screenshot({ path: path.join(SHOTS, "lesson-list.png") });
    await page.uncheck(".mo-dlg [data-ls-skip]");

    /* The step is remembered per film. */
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("curiosities-momentum-lesson-v1")));
    check(saved && saved.steps && saved.steps[saved.source] === target, "the last moment is saved for this film");
    await page.evaluate(() => window.CurioMomentumUI.draw());
    check((await pos(page)) === target + 1, "drawing the tab again comes back to the same moment");

    /* The engine's film: Watch this moment moves the Screen's playhead there. */
    await page.evaluate(() => window.CurioEngine.send({ type: "importFilm", film: window.CurioSeeds.starter() }));
    await page.evaluate(() => window.CurioMomentumUI.draw());
    await page.selectOption(".mo-dlg [data-ls-source]", "engine");
    await page.waitForSelector(".mo-dlg .mls-card");
    for (let i = 0; i < 3; i++) await page.click('.mo-dlg [data-ls="next"]');
    const want = (await pos(page)) - 1;
    const watch = await page.$('.mo-dlg [data-ls="watch"]');
    check(!!watch, "the engine's film has a Watch this moment button");
    await page.screenshot({ path: path.join(SHOTS, "lesson-engine.png") });
    if (watch) {
      await watch.click();
      const after = await page.evaluate(() => ({ row: window.CurioScreen.row(), open: !!document.querySelector(".mo-dlg[open]") }));
      check(after.row === want && !after.open, `Watch this moment closes Momentum and puts the Screen's playhead on moment ${want + 1} (now ${after.row + 1})`);
      await page.screenshot({ path: path.join(SHOTS, "lesson-watched.png") });
    }
    /* My film's panels have no Screen hook: no button. */
    await page.evaluate(() => window.CurioMomentumUI.open("lesson"));
    await page.selectOption(".mo-dlg [data-ls-source]", "board");
    await page.waitForSelector(".mo-dlg .mls-card, .mo-dlg .mo-empty");
    check(!(await page.$('.mo-dlg [data-ls="watch"]')), "My film's panels have no Watch button (the Screen cannot seek them)");

    /* Phone width: no sideways scroll. */
    const phone = await newPage({ width: 375, height: 800 });
    await openApp(phone);
    await phone.evaluate(() => window.CurioMomentumUI.open("lesson"));
    await phone.waitForSelector(".mo-dlg .mls-card");
    const studyId = await phone.$$eval(".mo-dlg [data-ls-source] option", (o) => o.map((x) => x.value).find((v) => v.startsWith("study:")));
    await phone.selectOption(".mo-dlg [data-ls-source]", studyId);
    await phone.waitForSelector(".mo-dlg .mls-card");
    for (let i = 0; i < 2; i++) await phone.click('.mo-dlg [data-ls="next"]');
    const fit = await phone.evaluate(() => {
      const d = document.querySelector(".mo-dlg");
      return { page: document.documentElement.scrollWidth - window.innerWidth, dlg: d.scrollWidth - d.clientWidth, card: document.querySelector(".mo-dlg .mls-card").getBoundingClientRect().right, w: window.innerWidth };
    });
    check(fit.page <= 0 && fit.dlg <= 0, `no sideways scroll at phone width (page ${fit.page}px, window ${fit.dlg}px over)`);
    check(fit.card <= fit.w, `the card fits the phone (${Math.round(fit.card)} of ${fit.w})`);
    await phone.screenshot({ path: path.join(SHOTS, "lesson-phone.png"), fullPage: true });

    check(errors.length === 0, "no page errors" + (errors.length ? ": " + errors.slice(0, 3).join(" | ") : ""));
    await browser.close();
    server.close();
    console.log(failed ? `\n${failed} failed` : "\nall lesson browser checks passed");
    process.exit(failed ? 1 : 0);
  })().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
