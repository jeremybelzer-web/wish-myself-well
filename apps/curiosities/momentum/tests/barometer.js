/* The attention barometer, the pill on every page (momentum/barometer.js).
   node momentum/tests/barometer.js                      what the pill says, no page
   NODE_PATH=/opt/node22/lib/node_modules node momentum/tests/barometer.js --browser [--three <three.min.js>] [--shots <dir>]
                                                         also the pill in the real app (needs Playwright)
   No page: the family's letter and color from CurioMomentum.mark, the seconds against the limit, the Fresh /
   Getting long / Too long marks from CurioMomentum.status, the bar's share, the sentence, the empty pill, which
   source is read how, and when the pill shows.
   In the app: the pill shows with the Screen closed and hides while the Screen or the Momentum window is open;
   it overlaps nothing (the VCV pill) at 1440 and 375 pixels wide; an engine change redraws it, at most a few
   times a second; clicking it opens Momentum; × hides it and is remembered; the Momentum window then offers
   Show it again; no page errors; no sideways scroll at 375; screenshots. */
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
["notes.js", "attention.js", "barometer.js"].forEach((f) => {
  const file = path.join(ROOT, "momentum", f);
  vm.runInContext(fs.readFileSync(file, "utf8"), vm.isContext(ctx) ? ctx : vm.createContext(ctx), { filename: file });
});
const M = ctx.CurioMomentum;
const Baro = require(path.join(ROOT, "momentum", "barometer.js"));
let n = 0;
const ok = (name, fn) => {
  fn();
  n++;
  console.log("ok", name);
};

ok("barometer.js works in Node through require and on the page's global", () => {
  ["say", "pick", "visible"].forEach((k) => assert.strictEqual(typeof Baro[k], "function", k));
  assert.strictEqual(typeof ctx.CurioMomentumBarometer.say, "function");
  assert.strictEqual(Baro.KEY, "curiosities-momentum-barometer-v1");
});

ok("the family's letter, color and ink come from CurioMomentum.mark", () => {
  const p = Baro.say({ family: "camera", seconds: 6, limit: 20 }, M);
  const m = M.mark("camera");
  assert.deepStrictEqual([p.letter, p.color, p.ink, p.famLabel], [m.letter, m.color, m.ink, m.label]);
  /* The same marks without passing M: found through require. */
  assert.strictEqual(Baro.say({ family: "comedy", seconds: 1, limit: 20 }).letter, M.mark("comedy").letter);
});

ok("seconds held against the limit, with the status marks from CurioMomentum.status", () => {
  const at = (s) => Baro.say({ family: "feeling", seconds: s, limit: 20 }, M);
  assert.deepStrictEqual([at(4).status.key, at(15).status.key, at(20).status.key, at(31).status.key], ["fresh", "long", "long", "over"]);
  assert.deepStrictEqual([at(4).status.icon, at(16).status.icon, at(31).status.icon], ["●", "▲", "■"]);
  assert.deepStrictEqual([at(4).status.words, at(16).status.words, at(31).status.words], ["Fresh", "Getting long", "Too long"]);
  [4, 16, 31].forEach((s) => assert.deepStrictEqual(at(s).status.cls, M.status(s, 20).cls));
  assert.strictEqual(at(12.4).short, "Held 12 s of 20 s");
  assert.strictEqual(at(12.4).held, 12);
});

ok("the bar fills to the limit and stays full past it", () => {
  const at = (s) => Baro.say({ family: "plot", seconds: s, limit: 20 }, M).pct;
  assert.deepStrictEqual([at(0), at(5), at(10), at(20), at(45)], [0, 25, 50, 100, 100]);
});

ok("the sentence says the film, the moment, the family, the seconds and the words, never color alone", () => {
  const p = Baro.say({ family: "camera", seconds: 24, limit: 20, label: "Shot size", film: "My film", moment: 7, n: 12, where: "now" }, M);
  assert.strictEqual(p.title, "My film, moment 7 of 12: Camera (Shot size) has held attention for 24 seconds of the 20 second limit. Too long. Time to move attention to something else. Click to open Momentum.");
  assert.strictEqual(p.text, "Ca Camera, 24 s of 20 s, ■ Too long");
  const end = Baro.say({ family: "voice", seconds: 1, limit: 18, film: "Pulp Fiction", where: "end" }, M);
  assert(/^At the end of Pulp Fiction: Lines & voice has held attention for 1 second of the 18 second limit\. Fresh\./.test(end.title), end.title);
  const live = Baro.say({ family: "music", seconds: 16, limit: 20, where: "live" }, M);
  assert(/^My film, playing now: Music & sound .* Getting long\. Attention will soon want something new\./.test(live.title), live.title);
});

ok("nothing holding attention yet: an empty pill, plain words", () => {
  [null, {}, { family: null, seconds: 3 }, { family: "camera" }].forEach((x) => {
    const p = Baro.say(x, M);
    assert.strictEqual(p.empty, true);
    assert.strictEqual(p.short, "Nothing yet");
    assert.strictEqual(p.pct, 0);
    assert(/nothing holds the audience's attention yet/.test(p.title), p.title);
  });
  assert.strictEqual(Baro.say({}, M).limit, 20, "the limit defaults to 20 seconds");
});

ok("every word the pill shows is plain: no 'beat', no undefined, no em-dash", () => {
  const all = [];
  M.FAMILIES.forEach((f) =>
    [0, 10, 18, 40].forEach((s) => {
      const p = Baro.say({ family: f.id, seconds: s, limit: 20, film: "My film", moment: 3, n: 9 }, M);
      all.push(p.title, p.text, p.short, p.famLabel, p.status.words);
    })
  );
  all.push(Baro.say({}, M).title);
  const text = all.join("\n");
  assert(!/\bbeats?\b/i.test(text), "says beat");
  assert(!/undefined|NaN|\[object|—/.test(text), "bad text");
});

ok("which source is read how: My film, live, panels, or a film read to its end", () => {
  assert.deepStrictEqual(["", "engine", "live", "board", "sb:abc", "sb:all", "study:pulp", "something-else", null].map(Baro.pick), ["engine", "engine", "live", "board", "film", "film", "film", "engine", "engine"]);
});

ok("the pill shows unless hidden, the Screen is open or the Momentum window is open", () => {
  assert.strictEqual(Baro.visible({}), true);
  assert.strictEqual(Baro.visible(), true);
  assert.strictEqual(Baro.visible({ hidden: true }), false);
  assert.strictEqual(Baro.visible({ screenOpen: true }), false);
  assert.strictEqual(Baro.visible({ windowOpen: true }), false);
});

console.log(`${n} barometer checks passed`);

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
  const shown = (page) => page.evaluate(() => {
    const el = document.querySelector(".mo-baro");
    return !!(el && el.getClientRects().length && getComputedStyle(el).display !== "none");
  });
  /* The pill's box against the viewport and the VCV pill. */
  const boxes = (page) =>
    page.evaluate(() => {
      const r = (q) => {
        const e = document.querySelector(q);
        if (!e || !e.getClientRects().length) return null;
        const x = e.getBoundingClientRect();
        return { l: x.left, t: x.top, r: x.right, b: x.bottom };
      };
      return { baro: r(".mo-baro"), vcv: r(".vcv-badge > button") || r(".vcv-badge"), w: innerWidth, h: innerHeight, sw: document.documentElement.scrollWidth };
    });
  const overlap = (a, c) => !!(a && c && a.l < c.r && c.l < a.r && a.t < c.b && c.t < a.b);
  async function open(viewport) {
    const page = await b.newPage({ viewport });
    page.on("pageerror", (e) => errors.push(String(e && e.message)));
    page.on("console", (m) => m.type() === "error" && !/Failed to load resource|favicon|fonts\.g/.test(m.text()) && errors.push(m.text()));
    await page.route(/three\.min\.js$/, (r) => r.fulfill({ contentType: "text/javascript", body: three ? fs.readFileSync(three, "utf8") : "" }));
    await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
    await page.goto(base + "index.html");
    await page.waitForFunction(() => window.CurioScreen && window.CurioMomentumBarometer && window.CurioEngine && window.CurioMomentumUI, null, { timeout: 15000 });
    /* The Screen starts the example film; then close it, as on any other page of the app. */
    await page.evaluate(() => !window.CurioScreen.isOpen() && window.CurioScreen.open());
    await page.waitForFunction(() => window.CurioEngine.state().rows.length > 0, null, { timeout: 10000 });
    await page.waitForTimeout(400);
    return page;
  }

  const page = await open({ width: 1440, height: 900 });
  check(!(await shown(page)), "hidden while the Screen is open (the Player's meter shows it there)");
  await page.evaluate(() => window.CurioScreen.close());
  await page.waitForTimeout(500);
  check(await shown(page), "shows once the Screen is closed");
  const said = await page.evaluate(() => {
    const el = document.querySelector(".mo-baro");
    const sw = el.querySelector(".mo-baro-sw");
    return { text: el.textContent, title: el.querySelector(".mo-baro-open").title, letter: sw.textContent, bg: getComputedStyle(sw).backgroundColor, status: el.dataset.status, bar: !!el.querySelector(".mo-baro-bar span") };
  });
  check(/(● Fresh|▲ Getting long|■ Too long)/.test(said.text) && /\d+ s of \d+ s/.test(said.text), `says seconds against the limit with a mark: "${said.text.trim()}"`);
  check(said.letter.length >= 1 && said.letter.length <= 2 && said.bar, `family letter "${said.letter}" on its color (${said.bg}) and a bar`);
  check(/^My film, moment \d+ of \d+: /.test(said.title), `follows My film at the Screen's playhead: "${said.title}"`);
  check(!/\bbeats?\b|undefined|NaN|—/i.test(said.text + said.title), "plain words only");
  const d1 = await boxes(page);
  check(d1.baro && d1.baro.r <= d1.w && d1.baro.b <= d1.h && d1.baro.l > d1.w / 2, `sits in the bottom right corner (${JSON.stringify(d1.baro)})`);
  check(!overlap(d1.baro, d1.vcv), "does not cover the VCV pill");
  await page.screenshot({ path: path.join(SHOTS, "barometer-1440.png") });
  await page.screenshot({ path: path.join(SHOTS, "barometer-1440-corner.png"), clip: { x: d1.w - 420, y: d1.h - 90, width: 420, height: 90 } });

  /* The playhead moves the pill: each moment reads the film up to there. */
  const moved = await page.evaluate(async () => {
    const out = [];
    for (const r of [0, Math.min(5, window.CurioEngine.state().rows.length - 1)]) {
      window.CurioScreen.setRow(r);
      await new Promise((ok) => setTimeout(ok, 400));
      out.push(document.querySelector(".mo-baro-open").title);
    }
    return out;
  });
  check(/moment 1 of/.test(moved[0]) && moved[0] !== moved[1], `follows the playhead (${moved.map((t) => t.split(":")[0]).join(" then ")})`);

  /* An engine change redraws it, at most a few times a second however many changes come in. */
  const burst = await page.evaluate(async () => {
    const B = window.CurioMomentumBarometer;
    const E = window.CurioEngine;
    const S = window.CurioScale;
    const st = E.state();
    const t = st.tracks.find((x) => x.kind === "master") || st.tracks[0];
    const cur = t.curiosities.find((c) => S.known(c));
    const before = B.stats().reads;
    const t0 = performance.now();
    for (let k = 0; k < 20; k++) E.send({ type: "batch", label: "barometer test", commands: [{ type: "setPoint", row: st.rows[k % st.rows.length].id, track: t.id, curiosity: cur, value: S.step(cur, S.start(cur), k % 2 ? 1 : -1) }] });
    await new Promise((ok) => setTimeout(ok, 700));
    const reads = B.stats().reads - before;
    for (let k = 0; k < 20; k++) E.undo();
    return { reads, ms: performance.now() - t0 };
  });
  check(burst.reads >= 1 && burst.reads <= Math.ceil(burst.ms / 300) + 1, `20 engine changes read the film ${burst.reads} times in ${Math.round(burst.ms)} ms (at most about three a second)`);

  /* Clicking it opens Momentum, and it hides while the window is open. */
  await page.click(".mo-baro-open");
  await page.waitForSelector("dialog.mo-dlg[open]", { timeout: 5000 });
  await page.waitForTimeout(400);
  check(!(await shown(page)), "clicking it opens the Momentum window, and it hides while the window is open");
  await page.evaluate(() => window.CurioMomentumUI.close());
  await page.waitForTimeout(500);
  check(await shown(page), "shows again when the window closes");

  /* × hides it, remembered after a reload; the Momentum window offers it back. */
  await page.click(".mo-baro-x");
  await page.waitForTimeout(400);
  const kept = await page.evaluate(() => localStorage.getItem("curiosities-momentum-barometer-v1"));
  check(!(await shown(page)) && /"hidden":true/.test(kept || ""), `× hides it and remembers (${kept})`);
  await page.reload();
  await page.waitForFunction(() => window.CurioMomentumBarometer && window.CurioScreen, null, { timeout: 15000 });
  await page.evaluate(() => window.CurioScreen.isOpen() && window.CurioScreen.close());
  await page.waitForTimeout(600);
  check(!(await shown(page)), "still hidden after a reload");
  await page.evaluate(() => window.CurioMomentumUI.open());
  await page.waitForSelector("dialog.mo-dlg[open] .mo-baro-line button", { timeout: 5000 });
  const line = await page.evaluate(() => document.querySelector(".mo-baro-line").textContent);
  check(/hidden/.test(line), `the Momentum window says how to show it again: "${line.trim()}"`);
  await page.screenshot({ path: path.join(SHOTS, "barometer-window-line.png") });
  /* The line survives a redraw of the window (a tab change). */
  await page.evaluate(() => window.CurioMomentumUI.open("rates"));
  await page.waitForTimeout(500);
  check(await page.evaluate(() => !!document.querySelector("dialog.mo-dlg[open] .mo-baro-line")), "the line stays after the window redraws");
  await page.click(".mo-baro-line button");
  await page.waitForTimeout(400);
  check(await page.evaluate(() => !document.querySelector(".mo-baro-line")), "Show it again takes the line away");
  await page.evaluate(() => window.CurioMomentumUI.close());
  await page.waitForTimeout(500);
  check(await shown(page), "and the pill is back once the window closes");
  await page.close();

  /* A phone. */
  const phone = await open({ width: 375, height: 800 });
  await phone.evaluate(() => window.CurioScreen.close());
  await phone.waitForTimeout(600);
  check(await shown(phone), "shows on a phone");
  const d2 = await boxes(phone);
  check(d2.sw <= d2.w, `no sideways scroll at 375px (${d2.sw}/${d2.w})`);
  check(d2.baro && d2.baro.l >= 0 && d2.baro.r <= d2.w && d2.baro.b <= d2.h, `fits on the screen (${JSON.stringify(d2.baro)})`);
  check(!overlap(d2.baro, d2.vcv), "does not cover the VCV pill on a phone");
  const ptext = await phone.evaluate(() => document.querySelector(".mo-baro").innerText);
  check(/(Fresh|Getting long|Too long|Nothing yet)/.test(ptext), `the words stay on a phone: "${ptext.replace(/\s+/g, " ").trim()}"`);
  await phone.screenshot({ path: path.join(SHOTS, "barometer-375.png") });
  await phone.screenshot({ path: path.join(SHOTS, "barometer-375-corner.png"), clip: { x: 0, y: d2.h - 80, width: 375, height: 80 } });
  await phone.close();

  check(!errors.length, "no page errors" + (errors.length ? ": " + errors.slice(0, 3).join(" | ") : ""));
  await b.close();
  server.close();
  console.log(failed ? `${failed} browser checks failed` : "browser checks passed");
  process.exit(failed ? 1 : 0);
}
