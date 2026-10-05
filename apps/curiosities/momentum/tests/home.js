/* Home (momentum/home.js): node apps/curiosities/momentum/tests/home.js [--browser] [--three <three.min.js>] [--shots <dir>]
   1. With no page: the verdict (none, too long, getting long, too fast, moving well) and the "Do this next" cards
      (pure functions) on the practice scenes and on made-up readings; features() reads storage with getItem only.
   2. With --browser (needs Playwright and Chromium; set NODE_PATH): the app on a fresh browser, Momentum opens on
      Home, the first tab; every card button opens the right tab; every tab button of the map opens its tab; the
      Start here line still works; Home writes none of the other tabs' keys; no page errors; no sideways scroll at
      375 pixels. Screenshots go to --shots. */
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
["notes.js", "attention.js", "rates.js", "home.js"].forEach((f) => {
  const file = path.join(ROOT, "momentum", f);
  vm.runInContext(fs.readFileSync(file, "utf8"), vm.isContext(ctx) ? ctx : vm.createContext(ctx), { filename: file });
});
const A = ctx.CurioAttention;
const R = ctx.CurioRates;
const H = ctx.CurioHome;
let n = 0;
const plain = (x) => JSON.parse(JSON.stringify(x));
const ok = (name, fn) => {
  fn();
  n++;
  console.log("ok", name);
};
const BAD = /\bbeats?\b|undefined|NaN|\[object|—/;
const target = R.DEFAULT_FILMS[0];
const opts = { limit: R.limitFor(target), secondsPerBeat: 3 };
const studies = core.CuriosityDB.studiesExport().studies;
const read = (s) => A.fromStudy(s, opts);
/* A made-up film: one family per moment, from a list of families. */
const film = (fams, step) => A.read(fams.map((f, i) => ({ at: i * (step || 3), values: f ? { [f === "voice" ? "lineCadence" : f === "camera" ? "shotSize" : "emotionMood"]: "v" + i } : {} })), { secondsPerBeat: step || 3, limit: 20 });

ok("home.js works through require too", () => {
  const api = require(path.join(ROOT, "momentum", "home.js"));
  assert.strictEqual(typeof api.verdict, "function");
  assert.strictEqual(typeof api.cards, "function");
});

ok("a film with nothing to read says so, and points to the engine for My film", () => {
  const empty = A.read([], opts);
  const v = H.verdict(empty, { target });
  assert.strictEqual(v.key, "none");
  assert.match(v.text, /no moments/);
  assert.strictEqual(v.status.words, "Nothing yet");
  const mine = H.cards(empty, { mine: true });
  assert.strictEqual(mine[0].tab, "engine");
  assert.strictEqual(H.cards(empty, { mine: false })[0].tab, "attention");
  assert(!mine.some((c) => c.tab === "versions"), "no versions card for an empty film");
});

ok("a film with stretches past the limit: the verdict counts them, the first card opens Autopilot", () => {
  const s = studies.find((x) => read(x).warnings.length >= 2);
  const r = read(s);
  const v = H.verdict(r, { target });
  assert.strictEqual(v.key, "over");
  assert.match(v.text, new RegExp(`rests too long in ${r.warnings.length} places`));
  assert.strictEqual(v.status.key, "over");
  assert.strictEqual(v.status.icon, "■");
  const c = H.cards(r, { target });
  assert.strictEqual(c[0].tab, "autopilot");
  const w = r.warnings.reduce((a, x) => (x.dur > a.dur ? x : a));
  assert(c[0].text.includes(`for ${Math.round(w.dur)} seconds at ${A.clock(w.from)}`), c[0].text);
  assert.match(c[0].text, /Autopilot can fix it\./);
  assert.strictEqual(c[0].button, "Open Autopilot");
  assert.match(H.cards(r, { target, autopilot: 2 })[0].text, /Autopilot made changes before/);
  /* Without the Autopilot tab, the Compass takes the card. */
  assert.strictEqual(H.cards(r, { target, tabs: ["compass", "versions", "tap", "attention"] })[0].tab, "compass");
});

ok("one stretch past the limit says 'one place'", () => {
  const s = studies.find((x) => read(x).warnings.length === 1);
  assert.match(H.verdict(read(s), { target }).text, /in one place: the longest is \d+ seconds on /);
});

ok("a film that moves well says so, and offers the Compass", () => {
  const s = studies.find((x) => !read(x).warnings.length && H.verdict(read(x), { target }).key === "good");
  const r = read(s);
  assert.match(H.verdict(r, { target }).text, /^Momentum is moving well: attention moves on about every [\d.]+ seconds/);
  const c = H.cards(r, { target, versions: 3, measured: 1 });
  assert.strictEqual(c.map((x) => x.tab).join(), "compass,attention");
});

ok("getting close to the limit is its own verdict", () => {
  const r = film(["voice", "voice", "voice", "voice", "voice", "voice", "camera", "feeling"]);
  const v = H.verdict(r);
  assert.strictEqual(v.key, "long", v.text);
  assert.strictEqual(v.status.icon, "▲");
  assert.strictEqual(H.cards(r, { versions: 3, measured: 1 })[0].tab, "compass");
});

ok("attention moving far faster than the films you compare with is too fast, and opens Pace it", () => {
  const fams = [];
  for (let i = 0; i < 30; i++) fams.push(["voice", "camera", "feeling"][i % 3]);
  const r = film(fams, 1);
  const v = H.verdict(r, { target });
  assert.strictEqual(v.key, "fast", v.text);
  assert.match(v.text, /too fast/);
  assert.strictEqual(H.cards(r, { target })[0].tab, "pace");
  /* Compared with a fast film, the same pace is fine. */
  assert.notStrictEqual(H.verdict(r, { target: { switchesPerMinute: 40 } }).key, "fast");
});

ok("cards follow what the other tabs keep, at most three, each tab once", () => {
  const r = read(studies[0]);
  const ids = (st) => H.cards(r, Object.assign({ target }, st)).map((c) => c.id);
  assert(ids({ lessonSeen: false }).includes("lesson"));
  assert(!ids({ lessonSeen: true }).includes("lesson"));
  assert(ids({ versions: 0 }).includes("versions"));
  assert(!ids({ versions: 2, measured: 0 }).includes("versions"));
  assert(H.cards(r, { target, versions: 1 }).some((c) => /kept one version/.test(c.text)));
  assert(H.cards(r, { target, versions: 2, measured: 0 }).some((c) => c.tab === "tap" && /No measured film yet: tap one in Watch and tap/.test(c.text)));
  assert(H.cards(r, { target, versions: 2, tapping: true }).some((c) => /You started tapping/.test(c.text)));
  assert(!ids({ versions: 2, measured: 1 }).includes("tap"));
  studies.forEach((s) =>
    [{}, { lessonSeen: false }, { versions: 5, measured: 2 }].forEach((st) => {
      const c = H.cards(read(s), Object.assign({ target }, st));
      assert(c.length >= 1 && c.length <= 3, s.id);
      assert.strictEqual(new Set(c.map((x) => x.tab)).size, c.length, s.id + " repeats a tab");
      c.forEach((x) => assert(!BAD.test(x.text + x.button), x.text));
      assert(!BAD.test(H.verdict(read(s), { target }).text));
    })
  );
  /* Only tabs that exist get a card. */
  assert(H.cards(r, { target, tabs: ["attention"] }).every((c) => c.tab === "attention"));
});

ok("features() reads the other tabs' keys with getItem only, and only the ones there", () => {
  const data = {
    "curiosities-momentum-versions-v1": JSON.stringify({ v: 1, versions: [{ film: "study:a" }, { film: "study:a" }, { film: "study:b" }] }),
    "curiosities-momentum-autopilot-v1": JSON.stringify({ steps: [{}, {}] }),
    "curiosities-momentum-tap-v1": JSON.stringify({ taps: [{ beat: 0 }] }),
    "curiosities-momentum-start-v1": "1",
  };
  const asked = [];
  const storage = { getItem: (k) => (asked.push(k), k in data ? data[k] : null), setItem: () => assert.fail("features wrote storage"), removeItem: () => assert.fail("features removed a key") };
  const f = H.features(storage, { film: "study:a", measured: 1, studies: [{ camera: "measured" }, { camera: "estimate" }] });
  assert.deepStrictEqual(plain(f), { versions: 2, autopilot: 2, tapping: true, measured: 2, lessonSeen: true });
  assert(asked.every((k) => Object.values(H.KEYS).includes(k)));
  const none = H.features({ getItem: () => null, setItem: () => assert.fail("wrote") }, { film: "x" });
  assert.deepStrictEqual(plain(none), { versions: 0, autopilot: 0, tapping: false, measured: 0, lessonSeen: false });
  assert.deepStrictEqual(H.features({ getItem: () => "{broken" }, {}).versions, 0);
  assert.deepStrictEqual(H.features(null, {}).versions, 0);
});

console.log(`${n} home checks passed`);

if (args.includes("--browser")) browser().catch((e) => {
  console.error(e);
  process.exit(1);
});

async function browser() {
  const http = require("http");
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
  const br = await chromium.launch();
  const errors = [];
  let failed = 0;
  const check = (cond, text) => {
    console.log((cond ? "ok   " : "FAIL ") + text);
    if (!cond) failed++;
  };
  async function newPage(viewport) {
    const page = await br.newPage({ viewport });
    page.on("pageerror", (e) => errors.push(String(e && e.message)));
    page.on("console", (m) => m.type() === "error" && !/Failed to load resource|favicon|fonts\.g/.test(m.text()) && errors.push(m.text()));
    await page.route(/three\.min\.js$/, (r) => (three ? r.fulfill({ contentType: "text/javascript", body: fs.readFileSync(three, "utf8") }) : r.fulfill({ contentType: "text/javascript", body: "" })));
    await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
    await page.goto(base + "index.html");
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    if (!(await page.evaluate(() => document.querySelector('script[src="momentum/load.js"]')))) {
      await page.evaluate(() => {
        const s = document.createElement("script");
        s.src = "momentum/load.js";
        document.body.appendChild(s);
      });
    }
    await page.waitForFunction(() => window.CurioMomentumUI && window.CurioHome && window.CurioMomentumReport, null, { timeout: 15000 });
    await page.waitForTimeout(300);
    return page;
  }
  const selected = (page) => page.evaluate(() => (document.querySelector('.mo-dlg [role=tab][aria-selected="true"]') || {}).dataset.tab);
  const otherKeys = (page) => page.evaluate(() => ["curiosities-momentum-versions-v1", "curiosities-momentum-autopilot-v1", "curiosities-momentum-tap-v1", "curiosities-momentum-start-v1"].filter((k) => localStorage.getItem(k) != null));

  for (const vp of [{ width: 1440, height: 900 }, { width: 375, height: 800 }]) {
    const page = await newPage(vp);
    await page.evaluate(() => {
      document.getElementById("lib-btn").click();
      document.querySelector("#lib-menu [data-momentum]").click();
    });
    await page.waitForSelector(".mo-dlg[open] .mh-root");
    const first = await page.evaluate(() => ({
      first: document.querySelector(".mo-dlg [role=tab]").dataset.tab,
      group: document.querySelector('.mo-dlg [data-tab="home"]').closest(".mo-tabgroup").dataset.tabgroup,
      groups: document.querySelectorAll(".mo-dlg .mo-tabgroup").length,
      last: [...document.querySelectorAll(".mo-dlg [role=tab]")].pop().dataset.tab,
      start: !!document.querySelector(".mo-dlg .mo-start"),
      verdict: document.querySelector(".mo-dlg .mh-verdict").textContent,
      strip: document.querySelectorAll(".mo-dlg .mh-strip li").length,
      cards: [...document.querySelectorAll(".mo-dlg .mh-card")].map((c) => c.dataset.card),
      text: document.querySelector(".mo-dlg .mo-body").innerText,
      over: document.documentElement.scrollWidth - window.innerWidth,
      dlgOver: document.querySelector(".mo-dlg").scrollWidth - document.querySelector(".mo-dlg").clientWidth,
    }));
    check(first.first === "home" && (await selected(page)) === "home", `${vp.width}px: a fresh browser opens Momentum on Home, the first tab`);
    check(first.group === "see" && first.groups === 5 && first.last === "report", `${vp.width}px: Home sits first in See it, five groups, Report still last`);
    check(first.start, `${vp.width}px: the Start here line still shows the first time`);
    check(/^(Attention rests too long|Momentum is moving well|Attention moves too fast)/.test(first.verdict) && first.strip > 0, `${vp.width}px: one sentence and the attention strip (${first.strip} stretches): "${first.verdict}"`);
    check(first.cards.length >= 1 && first.cards.length <= 3, `${vp.width}px: ${first.cards.length} cards: ${first.cards.join(", ")}`);
    check(!/\bbeats?\b|undefined|NaN|\[object|—/.test(first.text), `${vp.width}px: plain words only on Home`);
    check(first.over <= 0 && first.dlgOver <= 0, `${vp.width}px: no sideways scroll (${first.over}px, window ${first.dlgOver}px)`);
    check(!(await otherKeys(page)).length, `${vp.width}px: Home wrote none of the other tabs' keys (${(await otherKeys(page)).join(", ")})`);
    await page.screenshot({ path: path.join(SHOTS, `home-${vp.width}.png`) });
    await page.evaluate(() => document.querySelector(".mo-dlg .mh-now").scrollIntoView());
    await page.screenshot({ path: path.join(SHOTS, `home-${vp.width}-now.png`) });
    await page.evaluate(() => (document.querySelector(".mo-dlg").scrollTop = 1e6));
    await page.screenshot({ path: path.join(SHOTS, `home-${vp.width}-map.png`) });

    /* Every card button opens its tab; back to Home each time. Then a film that moves well, and the Start
       here line hidden, so the other cards show too. */
    const clicked = new Set();
    async function clickCards(label) {
      /* Visiting a tab can change the cards (Versions keeps a version, Learn it hides the Start here line),
         so the cards are read again before each click. */
      const count = await page.$$eval(".mo-dlg .mh-card button", (b) => b.length);
      for (let i = 0; i < count; i++) {
        const want = await page.$$eval(".mo-dlg .mh-card button", (b, k) => (b[k] ? b[k].dataset.mhOpen : null), i);
        if (!want) break;
        await page.click(`.mo-dlg .mh-card:nth-child(${i + 1}) button`);
        await page.waitForTimeout(150);
        const tab = await selected(page);
        check(tab === want, `${vp.width}px ${label}: card ${i + 1} opens ${want} (${tab})`);
        clicked.add(want);
        await page.click('.mo-dlg [data-tab="home"]');
        await page.waitForSelector(".mo-dlg .mh-root");
      }
    }
    await clickCards("first film");
    if (await page.$('.mo-dlg [data-m="start-hide"]')) {
      await page.click('.mo-dlg [data-m="start-hide"]');
      await page.waitForSelector(".mo-dlg .mh-root");
    }
    const films = await page.$$eval('.mo-dlg select[data-mh="source"] option', (o) => o.map((x) => x.value).filter((v) => v.startsWith("study:")));
    const done = new Set();
    for (const f of films) {
      await page.selectOption('.mo-dlg select[data-mh="source"]', f);
      await page.waitForSelector(".mo-dlg .mh-root");
      const key = (await page.evaluate(() => document.querySelector(".mo-dlg .mh-verdict").className)).replace(/.*mh-/, "");
      if ((key === "good" || key === "over") && !done.has(key)) {
        done.add(key);
        await clickCards(key === "good" ? "a film that moves well" : "a film that rests too long");
      }
      if (done.size === 2) break;
    }
    await page.selectOption('.mo-dlg select[data-mh="source"]', "engine").catch(() => {});
    await page.waitForSelector(".mo-dlg .mh-root");
    await clickCards("My film");
    check(["autopilot", "versions", "compass"].every((t) => clicked.has(t)), `${vp.width}px: cards opened ${[...clicked].join(", ")}`);

    /* The map: every tab name opens that tab. */
    const map = await page.$$eval(".mo-dlg .mh-map button", (b) => b.map((x) => x.dataset.mhOpen));
    const tabs = await page.$$eval(".mo-dlg [role=tab]", (t) => t.map((x) => x.dataset.tab).filter((x) => x !== "home"));
    check(map.length === tabs.length && tabs.every((t) => map.includes(t)), `${vp.width}px: the map has every tab (${map.length} of ${tabs.length})`);
    const wrong = [];
    for (const id of vp.width < 600 ? map.slice(0, 6) : map) {
      await page.click('.mo-dlg [data-tab="home"]');
      await page.waitForSelector(".mo-dlg .mh-root");
      await page.click(`.mo-dlg .mh-map button[data-mh-open="${id}"]`);
      await page.waitForTimeout(100);
      if ((await selected(page)) !== id) wrong.push(id);
    }
    check(!wrong.length, `${vp.width}px: each map button opens its tab` + (wrong.length ? ": wrong " + wrong.join(", ") : ""));
    /* A picked tab is remembered: the window opens on it next time, not on Home. */
    await page.evaluate(() => {
      window.CurioMomentumUI.close();
      window.CurioMomentumUI.open();
    });
    check((await selected(page)) !== "home", `${vp.width}px: once a tab is picked, the window opens on it (${await selected(page)})`);
    await page.close();
  }
  check(!errors.length, "no page errors" + (errors.length ? ": " + errors.slice(0, 3).join(" | ") : ""));
  await br.close();
  server.close();
  console.log(failed ? `${failed} browser checks FAILED` : "all home browser checks passed");
  if (failed) process.exit(1);
}
