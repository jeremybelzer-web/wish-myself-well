/* Audiences (momentum/audience.js): node apps/curiosities/momentum/tests/audience.js [--browser] [--three <three.min.js>] [--shots <dir>]
   1. With no page: loads the app core like tests/run.js, then the momentum core and audience.js, and checks
      readFor() on a hand-made reading (the limit multiplier and the patience per family move the limits, the
      tired stretches start at each audience's own limit, the share past the limit, the plain sentence), that
      the reading itself is never changed, your own audience (clamped, saved and loaded back), and rank().
   2. With --browser (needs Playwright and Chromium; set NODE_PATH): the app, Momentum, the "Audiences" tab:
      three audiences side by side, switching one, a slider changing the result, Make my own audience kept
      after a reload; no page errors; no sideways scroll at 375px; screenshots in --shots. */
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
const context = vm.isContext(ctx) ? ctx : vm.createContext(ctx);
["notes.js", "attention.js", "rates.js", "compass.js", "engine-lanes.js", "audience.js"].forEach((f) => {
  const file = path.join(ROOT, "momentum", f);
  vm.runInContext(fs.readFileSync(file, "utf8"), context, { filename: file });
});
const AU = ctx.CurioAudience;
const A = ctx.CurioAttention;
let n = 0;
const same = (a, b, msg) => assert.strictEqual(JSON.stringify(a), JSON.stringify(b), msg);
const ok = (name, fn) => {
  fn();
  n++;
  console.log("ok", name);
};
const prof = (id) => AU.PROFILES.find((p) => p.id === id);

/* A reading by hand, limit 20: Camera 0 to 30, Lines & voice 30 to 40, Comedy 40 to 70. */
const seg = (family, from, to) => ({ curiosity: family + "X", label: family, family, cue: "visual", quiet: false, push: 2, from, to, dur: to - from });
const reading = { segments: [seg("camera", 0, 30), seg("voice", 30, 40), seg("comedy", 40, 70)], beats: 10, seconds: 70, limit: 20 };

ok("six starting guesses, each with a limit and patience per family, all inside the slider ends", () => {
  same(AU.PROFILES.map((p) => p.label), ["Young kids", "Film students", "Festival crowd", "Family audience", "Phone scrollers", "Theater crowd"]);
  const fams = ctx.CurioMomentum.FAMILIES.map((f) => f.id);
  AU.PROFILES.forEach((p) => {
    same(AU.normalize(p).patience, p.patience, p.label + " is already inside the ends");
    assert.strictEqual(AU.normalize(p).limit, p.limit);
    Object.keys(p.patience).forEach((f) => assert(fams.includes(f), p.label + " names an unknown family " + f));
    assert(p.about && !/[—–]/.test(p.about));
  });
  assert(prof("kids").limit < 1 && prof("kids").patience.comedy > 1 && prof("kids").patience.movement > 1 && prof("kids").patience.voice < 1);
  assert(prof("students").limit > 1 && prof("students").patience.camera > 1 && prof("students").patience.light > 1);
  assert(prof("phone").limit <= 0.4, "phone scrollers have a very short limit");
  assert(prof("theater").patience.voice > 1);
});

ok("an ordinary audience (all 1) tires exactly where the film's own limit says", () => {
  const r = AU.readFor(reading, { id: "plain", label: "Anyone", limit: 1, patience: {} });
  assert.strictEqual(r.limit, 20);
  assert.strictEqual(r.limits.camera, 20);
  same(r.tired.map((t) => [t.family, t.from, t.to]), [["camera", 20, 30], ["comedy", 60, 70]]);
  /* The same stretches attention.js warns about. */
  const real = A.read([{ at: 0, values: { shotSize: "wide" } }, { at: 30, values: { shotSize: "wide", volume: 4 } }], { limit: 20, end: 25 });
  const mine = AU.readFor(real, { limit: 1 });
  assert.strictEqual(mine.tiredCount, real.warnings.length);
  assert.strictEqual(r.tiredSeconds, 20);
  assert.strictEqual(r.share, Math.round((20 / 70) * 1000) / 1000);
  assert.strictEqual(r.sentence, "Anyone lose interest 2 times, first at 0:20 on Camera.");
});

ok("the limit multiplier and the patience per family move each family's limit", () => {
  const kids = AU.readFor(reading, prof("kids"));
  assert.strictEqual(kids.limit, 12);
  assert.strictEqual(kids.limits.comedy, 19.2, "0.6 times 20, times 1.6 patience for Comedy");
  assert.strictEqual(kids.limits.voice, 7.2, "0.6 times 20, times 0.6 patience for Lines & voice");
  assert.strictEqual(kids.limits.camera, 12);
  same(kids.tired.map((t) => [t.family, t.from]), [["camera", 12], ["voice", 37.2], ["comedy", 59.2]]);
  const students = AU.readFor(reading, prof("students"));
  assert.strictEqual(students.limits.camera, 47.6, "1.4 times 20, times 1.7 for Camera");
  same(students.tired.map((t) => t.family), ["comedy"], "only Comedy (0.9 patience) runs past 25.2 seconds");
  assert.strictEqual(students.sentence, "Film students lose interest once, at 1:05 on Comedy.");
  const phone = AU.readFor(reading, prof("phone"));
  assert.strictEqual(phone.tiredCount, 3);
  assert(phone.share > kids.share && kids.share > students.share);
  assert.strictEqual(phone.sentence, "Phone scrollers lose interest 3 times, first at 0:07 on Camera.");
  /* Statuses come from CurioMomentum.status against each family's own limit. */
  same(students.runs.map((x) => x.status), ["fresh", "fresh", "over"]);
  same(phone.runs.map((x) => x.status), ["over", "over", "over"]);
});

ok("the film is not changed: the reading's segments stay as they were", () => {
  const before = JSON.stringify(reading);
  AU.PROFILES.forEach((p) => AU.readFor(reading, p));
  AU.rank(reading, AU.PROFILES);
  assert.strictEqual(JSON.stringify(reading), before);
});

ok("a patient audience on a short film never tires; an empty film says so", () => {
  const r = AU.readFor({ segments: [seg("voice", 0, 10), seg("camera", 10, 20)], seconds: 20, limit: 20 }, prof("theater"));
  assert.strictEqual(r.tiredCount, 0);
  assert.strictEqual(r.share, 0);
  assert.strictEqual(r.sentence, "Theater crowd stay with this film the whole way: nothing runs past their limit.");
  const e = AU.readFor({ segments: [], seconds: 0, limit: 20 }, prof("kids"));
  assert.strictEqual(e.tiredCount, 0);
  assert(/nothing that holds attention/.test(e.sentence));
});

ok("your own audience: clamped to the slider ends, saved and loaded back", () => {
  const own = AU.normalize({ id: "anything", label: "  Grandma's book club", limit: 9, patience: { voice: 5, effects: 0.01, camera: 1, mind: "x" } });
  assert.strictEqual(own.limit, AU.LIMIT_RANGE.max);
  same(own.patience, { voice: 2, effects: 0.5 }, "kept inside the ends; plain 1 and nonsense dropped");
  const st = { own: Object.assign({}, own, { id: "own" }), edits: { kids: Object.assign({}, prof("kids"), { limit: 0.8 }) }, picked: ["own", "kids", "nobody"], editing: "own" };
  assert(AU.save(st));
  const back = AU.load();
  assert.strictEqual(back.own.label, "  Grandma's book club");
  assert.strictEqual(back.own.id, "own");
  same(back.picked, ["own", "kids"], "unknown audiences are dropped");
  assert.strictEqual(back.edits.kids.limit, 0.8);
  const list = AU.all(back);
  assert.strictEqual(list.length, 7);
  assert.strictEqual(list[0].limit, 0.8, "the edit replaces the starting guess");
  assert.strictEqual(list[6].id, "own");
  const r = AU.readFor(reading, list[6]);
  assert.strictEqual(r.limits.voice, 80, "2 times 20, times 2 for Lines & voice");
  assert.strictEqual(r.tiredCount, 0);
  /* A broken or missing store gives the starting picks. */
  ctx.localStorage.setItem(AU.KEY, "{not json");
  const fresh = AU.load();
  same(fresh.picked, ["kids", "students", "phone"]);
  assert.strictEqual(fresh.own, null);
  ctx.localStorage.removeItem(AU.KEY);
});

ok("rank: fewest tired stretches first, then the smaller share, with a plain sentence", () => {
  const ranked = AU.rank(reading, AU.PROFILES);
  same(ranked.map((r) => r.place), [1, 2, 3, 4, 5, 6]);
  for (let i = 1; i < ranked.length; i++) {
    const a = ranked[i - 1];
    const b = ranked[i];
    assert(a.tiredCount < b.tiredCount || (a.tiredCount === b.tiredCount && a.share <= b.share), a.label + " before " + b.label);
  }
  assert.strictEqual(ranked[ranked.length - 1].label, "Phone scrollers");
  const s = AU.forSentence(ranked);
  assert(s.startsWith("This film suits ") && /Phone scrollers tire most often \(3 times\)/.test(s), s);
  assert(!/[—–]/.test(s));
  const own = AU.rank(reading, AU.PROFILES.concat([{ id: "own", label: "Night owls", limit: 2, patience: { camera: 2, comedy: 2, voice: 2 } }]));
  assert.strictEqual(own[0].label, "Night owls");
  assert(/suits Night owls best: they never tire of it/.test(AU.forSentence(own)));
});

console.log(`\n${n} audience checks passed`);

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
    fs.mkdirSync(SHOTS, { recursive: true });
    const server = await serve();
    const base = "http://127.0.0.1:" + server.address().port + "/";
    const browser = await chromium.launch();
    const errors = [];
    const three = arg("--three", "");
    async function open(viewport, page) {
      page = page || (await browser.newPage({ viewport }));
      if (!page.__wired) {
        page.__wired = true;
        page.on("pageerror", (e) => errors.push(String(e && e.message)));
        page.on("console", (m) => m.type() === "error" && !/Failed to load resource|favicon|fonts\.g/.test(m.text()) && errors.push(m.text()));
        await page.route(/three\.min\.js$/, (r) => (three ? r.fulfill({ contentType: "text/javascript", body: fs.readFileSync(three, "utf8") }) : r.fulfill({ contentType: "text/javascript", body: "" })));
        await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
      }
      await page.goto(base + "index.html");
      if (!(await page.evaluate(() => !!document.querySelector('script[src="momentum/load.js"]'))))
        await page.evaluate(() => {
          const s = document.createElement("script");
          s.src = "momentum/load.js";
          document.body.appendChild(s);
        });
      await page.waitForFunction(() => window.CurioMomentumUI && window.CurioAudience, null, { timeout: 15000 });
      return page;
    }
    /* Pick the first curated film as the source. */
    async function pickFilm(page) {
      const v = await page.evaluate(() => {
        const o = [...document.querySelectorAll(".mo-dlg select[data-au-source] option")].find((x) => x.value.startsWith("study:"));
        return o ? o.value : null;
      });
      if (v) await page.selectOption(".mo-dlg select[data-au-source]", v);
      await page.waitForSelector(".mo-dlg .mo-au-card");
      return v;
    }
    const cards = (page) =>
      page.evaluate(() =>
        [...document.querySelectorAll(".mo-dlg .mo-au-card")].map((c) => ({
          id: c.dataset.auCard,
          say: c.querySelector(".mo-au-say").textContent,
          share: c.querySelector(".mo-au-share").textContent,
          tired: c.querySelectorAll(".mo-au-tired").length,
          cells: c.querySelectorAll(".mo-au-cell").length,
        }))
      );

    /* 1. The tab, three audiences side by side. */
    const page = await open({ width: 1280, height: 900 });
    await page.evaluate(() => document.getElementById("lib-btn").click());
    await page.click("#lib-menu [data-momentum]");
    await page.waitForSelector(".mo-dlg[open]");
    const tab = await page.evaluate(() => {
      const b = document.querySelector('.mo-dlg [data-tab="audience"]');
      return b ? { label: b.textContent, group: b.closest(".mo-tabgroup").dataset.tabgroup } : null;
    });
    check(tab && tab.label === "Audiences" && tab.group === "see", 'an "Audiences" tab under See it: ' + JSON.stringify(tab));
    await page.click('.mo-dlg [data-tab="audience"]');
    await page.waitForSelector(".mo-dlg .mo-au");
    const film = await pickFilm(page);
    check(!!film, "a curated film is picked: " + film);
    const c1 = await cards(page);
    check(c1.length === 3 && c1.map((c) => c.id).join() === "kids,students,phone", "three audiences side by side: " + c1.map((c) => c.id).join(", "));
    check(c1.every((c) => c.cells > 0 && /Past their limit: \d+% of the film/.test(c.share)), "each has the ribbon and the share past its limit");
    check(c1.every((c) => /lose interest|stay with this film/.test(c.say)), "each has a plain sentence: " + c1.map((c) => c.say).join(" | "));
    const phone1 = c1.find((c) => c.id === "phone");
    const stud1 = c1.find((c) => c.id === "students");
    check(phone1.tired >= stud1.tired, `phone scrollers tire at least as often as film students (${phone1.tired} and ${stud1.tired})`);
    const text = await page.evaluate(() => document.querySelector(".mo-dlg .mo-ext").textContent);
    check(/starting guesses/.test(text) && /Who is this film for\?/.test(text), "says the audiences are starting guesses, and asks who the film is for");
    check(!/[—–]/.test(text), "no dashes in the tab's text");
    const rankN = await page.evaluate(() => document.querySelectorAll(".mo-dlg .mo-au-rank li").length);
    check(rankN === 6, "all six audiences are ranked: " + rankN);
    await page.screenshot({ path: path.join(SHOTS, "audience-wide.png") });

    /* 2. Switch audiences: drop Young kids, add Theater crowd. */
    await page.click('.mo-dlg input[data-au-pick][value="theater"]');
    const c2 = await cards(page);
    check(c2.length === 3 && c2.some((c) => c.id === "theater") && !c2.some((c) => c.id === "kids"), "picking a fourth swaps out the oldest: " + c2.map((c) => c.id).join(", "));
    await page.click('.mo-dlg input[data-au-pick][value="students"]');
    const c3 = await cards(page);
    check(c3.length === 2 && !c3.some((c) => c.id === "students"), "unticking leaves two: " + c3.map((c) => c.id).join(", "));

    /* 3. Edit a slider: Phone scrollers get a longer limit; their result changes. */
    await page.selectOption(".mo-dlg select[data-au-editing]", "phone");
    const sliders = await page.evaluate(() => document.querySelectorAll(".mo-dlg .mo-au-slider input[type=range]").length);
    check(sliders === 14, "a limit slider and one per family: " + sliders);
    const phoneBefore = (await cards(page)).find((c) => c.id === "phone");
    await page.evaluate(() => {
      const s = document.querySelector('.mo-dlg input[data-au-set="limit"]');
      s.value = "2";
      s.dispatchEvent(new Event("input", { bubbles: true }));
      s.dispatchEvent(new Event("change", { bubbles: true }));
    });
    const phoneAfter = (await cards(page)).find((c) => c.id === "phone");
    check(phoneAfter.tired < phoneBefore.tired && phoneAfter.say !== phoneBefore.say, `a longer limit means fewer tired stretches (${phoneBefore.tired} to ${phoneAfter.tired}): ${phoneAfter.say}`);
    const changed = await page.evaluate(() => ({ chip: document.querySelector('.mo-dlg input[data-au-pick][value="phone"]').parentElement.textContent, reset: !document.querySelector('.mo-dlg button[data-au="reset"]').disabled, out: document.querySelector('.mo-dlg input[data-au-set="limit"]').parentElement.querySelector("output").textContent }));
    check(/changed/.test(changed.chip) && changed.reset && /2 times/.test(changed.out), "it is marked changed, can be put back, and the slider says its value: " + changed.out);
    await page.screenshot({ path: path.join(SHOTS, "audience-edited.png") });
    await page.click('.mo-dlg button[data-au="reset"]');
    const phoneReset = (await cards(page)).find((c) => c.id === "phone");
    check(phoneReset.tired === phoneBefore.tired, "Put back the starting guess restores it");

    /* 4. Make my own audience, then a family slider on it, kept after a reload. */
    await page.fill(".mo-dlg input[data-au-new]", "Night owls");
    await page.click('.mo-dlg button[data-au="own"]');
    await page.evaluate(() => {
      const s = document.querySelector('.mo-dlg input[data-au-set="camera"]');
      s.value = "2";
      s.dispatchEvent(new Event("input", { bubbles: true }));
      s.dispatchEvent(new Event("change", { bubbles: true }));
    });
    const kept = await page.evaluate(() => JSON.parse(localStorage.getItem("curiosities-momentum-audience-v1") || "null"));
    check(kept && kept.own && kept.own.label === "Night owls" && kept.own.patience.camera === 2 && kept.picked.includes("own"), "your own audience is saved: " + JSON.stringify(kept && kept.own));
    const ownCard = (await cards(page)).find((c) => c.id === "own");
    check(!!ownCard && /Night owls/.test(ownCard.say), "and shows beside the others: " + (ownCard && ownCard.say));
    await page.screenshot({ path: path.join(SHOTS, "audience-own.png") });
    await page.evaluate(() => (document.querySelector(".mo-dlg").scrollTop = 99999));
    await page.screenshot({ path: path.join(SHOTS, "audience-sliders.png") });
    await open(null, page);
    await page.evaluate(() => window.CurioMomentumUI.open("audience"));
    await page.waitForSelector(".mo-dlg .mo-au-card");
    const after = await page.evaluate(() => ({ cards: [...document.querySelectorAll(".mo-dlg .mo-au-card")].map((c) => c.dataset.auCard), rank: document.querySelector(".mo-dlg .mo-au-rank").textContent }));
    check(after.cards.includes("own") && /Night owls/.test(after.rank), "after a reload it is still there and ranked: " + after.cards.join(", "));

    /* 5. Phone width. */
    const phone = await open({ width: 375, height: 800 });
    await phone.evaluate(() => window.CurioMomentumUI.open("audience"));
    await phone.waitForSelector(".mo-dlg .mo-au");
    await pickFilm(phone);
    const wide = await phone.evaluate(() => {
      const d = document.querySelector(".mo-dlg");
      return Math.max(document.documentElement.scrollWidth - window.innerWidth, d.scrollWidth - d.clientWidth);
    });
    check(wide <= 0, `no sideways scroll at 375px (${wide}px over)`);
    await phone.evaluate(() => document.querySelector(".mo-dlg .mo-au-cards").scrollIntoView());
    await phone.screenshot({ path: path.join(SHOTS, "audience-phone.png") });
    await phone.evaluate(() => document.querySelector(".mo-dlg .mo-au-sliders").scrollIntoView());
    await phone.screenshot({ path: path.join(SHOTS, "audience-phone-2.png") });

    check(errors.length === 0, "no page errors" + (errors.length ? ": " + errors.slice(0, 5).join(" | ") : ""));
    await browser.close();
    server.close();
    console.log(failed ? `\n${failed} browser checks FAILED` : "\nbrowser checks passed");
    process.exit(failed ? 1 : 0);
  })().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
