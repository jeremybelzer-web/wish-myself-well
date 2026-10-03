/* The attention strip on the Storyboard (momentum/storyboard-strip.js).
   node momentum/tests/storyboard-strip.js                     checks with no page
   NODE_PATH=/opt/node22/lib/node_modules node momentum/tests/storyboard-strip.js --browser [--three <three.min.js>] [--shots <dir>]
     also opens the app in Chromium: puts two scenes on the Storyboard, checks one cell per panel in Flip through
     and in All scenes (lined up under the panels), that the meter follows the arrows and playback, that a cell
     jumps the flip book, the Momentum window's seconds per panel, phone width with no sideways scroll, print,
     and no page errors. */
const path = require("path");
const fs = require("fs");
const os = require("os");
const vm = require("vm");
const assert = require("assert");

const ROOT = path.join(__dirname, "..", "..");
const args = process.argv.slice(2);
const arg = (n, d) => (args.includes(n) ? args[args.indexOf(n) + 1] : d);

/* ---------- with no page ---------- */
const core = require(path.join(ROOT, "core", "headless.js")).load();
const ctx = core.window;
["notes.js", "attention.js", "rates.js", "storyboard-strip.js"].forEach((f) => {
  const file = path.join(ROOT, "momentum", f);
  vm.runInContext(fs.readFileSync(file, "utf8"), vm.isContext(ctx) ? ctx : vm.createContext(ctx), { filename: file });
});
const M = ctx.CurioMomentum;
const S = ctx.CurioMomentumStoryboard;
let n = 0;
const ok = (name, fn) => {
  fn();
  n++;
  console.log("ok", name);
};
const optsOf = (id) => {
  const c = M.find(id);
  return (c.options || (c.sliders && c.sliders[0] && c.sliders[0].scale) || ["a", "b"]).slice(0, 2);
};
const still = { panels: Array.from({ length: 10 }, (_, i) => ({ v: { emotion: i % 2 ? "angry" : "melancholy" } })) };
const varied = {
  panels: ["emotion", "shotSize", "music", "characterPath", "setting", "comedyDevice"].map((id) => {
    const o = optsOf(id);
    return { v: { [id]: o[1] || o[0] } };
  }),
};

ok("Node has the strip's pure part and no page part", () => {
  assert.strictEqual(typeof S.model, "function");
  assert.strictEqual(typeof S.attach, "undefined");
});
ok("one cell per panel; one family held climbs by the seconds per panel and turns ▲ then ■", () => {
  const m = S.model(still, { secondsPerPanel: 3, limit: 20 });
  assert.strictEqual(m.cells.length, 10);
  const fam = m.cells[0].family;
  assert(m.cells.every((c) => c.family === fam), "one family throughout");
  assert.deepStrictEqual(m.cells.map((c) => c.held), [3, 6, 9, 12, 15, 18, 21, 24, 27, 30]);
  assert.deepStrictEqual(m.cells.map((c) => c.status.icon).join(""), "●●●●▲▲■■■■");
  assert.strictEqual(m.cells[6].status.text, "Too long");
  assert(m.cells.every((c) => !c.moved), "attention never moved");
});
ok("seconds per panel changes how long each panel lasts", () => {
  const m = S.model(still, { secondsPerPanel: 1, limit: 20 });
  assert.strictEqual(m.cells[9].held, 10);
  assert(m.cells.every((c) => c.status.icon === "●"));
});
ok("a move to another family is marked with its cue and where it came from", () => {
  const m = S.model(varied, { secondsPerPanel: 3, limit: 20 });
  assert.strictEqual(m.cells.length, varied.panels.length);
  const r = m.reading;
  const moves = m.cells.filter((c) => c.moved);
  assert.strictEqual(moves.length, r.stats.moves.length, "one mark per move in the reading");
  moves.forEach((c) => {
    assert(c.moved.from !== c.family);
    assert(M.CUES.some((k) => k.id === c.moved.cue), c.moved.cue);
    assert(c.held <= 3 + 1e-9, "a fresh family starts its count again");
  });
  assert(moves.length >= 3, "the varied scene moves attention several times");
});
ok("empty panels hold nothing and an empty scene draws no cells", () => {
  const m = S.model({ panels: [{ v: {} }, { v: {} }] }, {});
  assert.strictEqual(m.cells.length, 2);
  assert(m.cells.every((c) => c.family === null && c.held === null));
  assert.strictEqual(S.model({ panels: [] }, {}).cells.length, 0);
});
ok("settings: the Momentum window's seconds per panel and limit, with its defaults", () => {
  const d = S.settings(null, ctx.CurioRates);
  assert.strictEqual(d.spb, 3);
  assert(d.limit > 0);
  assert.strictEqual(JSON.stringify(S.settings({ secondsPerPanel: 5, limit: 12 }, ctx.CurioRates)), JSON.stringify({ spb: 5, limit: 12 }));
  assert.strictEqual(S.settings({}, null).limit, 20);
});
console.log(n + " storyboard strip checks passed with no page.");

/* ---------- in a browser ---------- */
if (args.includes("--browser")) browserCheck();

function browserCheck() {
  const http = require("http");
  const { chromium } = require("playwright");
  const SHOTS = arg("--shots", os.tmpdir());
  const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".webmanifest": "application/manifest+json" };
  const server = http.createServer((req, res) => {
    const p = path.join(ROOT, decodeURIComponent(req.url.split("?")[0]).replace(/^\/+/, ""));
    if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) {
      res.writeHead(404);
      return res.end();
    }
    res.writeHead(200, { "content-type": TYPES[path.extname(p)] || "application/octet-stream" });
    fs.createReadStream(p).pipe(res);
  });
  let failed = 0;
  const check = (cond, text) => {
    console.log((cond ? "ok   " : "FAIL ") + text);
    if (!cond) failed++;
  };
  server.listen(0, "127.0.0.1", async () => {
    const base = "http://127.0.0.1:" + server.address().port + "/";
    const browser = await chromium.launch();
    const errors = [];
    const three = arg("--three", "");
    async function open(viewport) {
      const page = await browser.newPage({ viewport });
      page.on("pageerror", (e) => errors.push(String(e && e.message)));
      page.on("console", (m) => m.type() === "error" && !/Failed to load resource|favicon|fonts\.g/.test(m.text()) && errors.push(m.text()));
      await page.route(/three\.min\.js$/, (r) => r.fulfill({ contentType: "text/javascript", body: three ? fs.readFileSync(three, "utf8") : "" }));
      await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
      await page.goto(base + "index.html");
      await page.evaluate(() => {
        if (document.querySelector('script[src="momentum/load.js"]')) return;
        const s = document.createElement("script");
        s.src = "momentum/load.js";
        document.body.appendChild(s);
      });
      await page.waitForFunction(() => window.CurioMomentumStoryboard && window.CurioMomentumStoryboard.attached && window.CuriosityStoryboard, null, { timeout: 10000 });
      return page;
    }
    try {
      const page = await open({ width: 1280, height: 900 });
      /* Two scenes: one where a single feeling holds on (it goes past the limit), one that keeps moving. */
      const put = (pg) => pg.evaluate(() => {
        const M = window.CurioMomentum;
        const opt = (id) => {
          const c = M.find(id);
          const o = (c.options || (c.sliders && c.sliders[0] && c.sliders[0].scale) || ["a", "b"]).slice(0, 2);
          return o[1] || o[0];
        };
        const still = { name: "One feeling held", panels: Array.from({ length: 12 }, (_, i) => ({ v: { emotion: i % 2 ? "angry" : "melancholy" }, line: { who: "", text: "—" } })) };
        const varied = { name: "Always moving", panels: ["emotion", "shotSize", "music", "characterPath", "setting", "comedyDevice"].map((id) => ({ v: { [id]: opt(id) }, line: { who: "", text: "—" } })) };
        try {
          localStorage.removeItem("curiosities-momentum-v1");
          const v = JSON.parse(localStorage.getItem("curiosities-storyboard-view-v1") || "{}");
          localStorage.setItem("curiosities-storyboard-view-v1", JSON.stringify(Object.assign(v, { view: "flip", speed: 6 })));
        } catch (e) {}
        window.CuriosityStoryboard.putScenes("momentumtest", [still, varied]);
        window.CuriosityWorkspaces.open("storyboard");
        return window.CuriosityStoryboard.data().scenes.reduce((a, s) => a + s.panels.length, 0);
      });
      const total = await put(page);
      await page.waitForSelector(".sb [data-sb=thumbs] .mo-sbs .mo-sbs-cell", { timeout: 5000 });
      const flip = await page.evaluate(() => {
        const reel = document.querySelector("[data-sb=thumbs]");
        const cells = reel.querySelectorAll(".mo-sbs .mo-sbs-cell");
        const thumbs = reel.querySelectorAll(".sb-thumb");
        const lined = [...thumbs].every((t, k) => cells[k] && Math.abs(cells[k].getBoundingClientRect().left - t.getBoundingClientRect().left) < 1.5);
        return { cells: cells.length, thumbs: thumbs.length, lined, crit: reel.querySelectorAll(".mo-sbs-st.crit").length, cues: reel.querySelectorAll(".mo-sbs-cue").length, meter: !!document.querySelector("[data-sb=viewer] > .mo-sbm .mo-sbm-bar"), title: cells[8] && cells[8].title };
      });
      check(flip.cells === total && flip.cells === flip.thumbs, `Flip through: one cell per panel (${flip.cells} cells, ${total} panels)`);
      check(flip.lined, "each cell sits right under its small picture");
      check(flip.crit > 0 && /Too long/.test(flip.title), "the held feeling is marked ■ Too long, with the words in the title");
      check(flip.cues > 0, "moves are marked with their cue letter");
      check(flip.meter, "the compact meter sits under the flip book");
      const atOf = () => page.evaluate(() => ({ meter: document.querySelector(".mo-sbm").dataset.at, on: document.querySelector(".sb-thumb.on").dataset.go, cell: (document.querySelector(".mo-sbs-cell.on") || {}).dataset }));
      await page.click("[data-sb=next]");
      await page.waitForTimeout(80);
      let a = await atOf();
      check(a.meter === "1" && a.on === "1" && a.cell && a.cell.moK === "1", "the meter and the strip follow ▶ to panel 2");
      await page.screenshot({ path: path.join(SHOTS, "storyboard-strip-flip.png") });
      await page.click("[data-sb=play]");
      const seen = new Set();
      for (let i = 0; i < 8; i++) {
        await page.waitForTimeout(120);
        const x = await atOf();
        if (x.meter === x.on) seen.add(x.meter);
      }
      await page.click("[data-sb=play]");
      await page.waitForTimeout(80); /* the meter redraws after the page does; give it the same pause as after ▶ */
      check(seen.size >= 3, `the meter follows playback (${seen.size} panels seen, always the one on show)`);
      a = await atOf();
      check(a.meter === a.on, "after pausing the meter shows the panel on show");
      /* Clicking a cell jumps the flip book (the storyboard's own data-go). */
      await page.evaluate(() => document.querySelector('.mo-sbs-cell[data-mo-k="8"]').click());
      await page.waitForTimeout(80);
      a = await atOf();
      check(a.on === "8" && a.meter === "8", "a cell jumps the flip book to that panel");
      const meterText = await page.evaluate(() => document.querySelector(".mo-sbm").textContent.replace(/\s+/g, " "));
      check(/Too long/.test(meterText) && /27 s of/.test(meterText), "panel 9 of the held feeling reads 27 s and ■ Too long: " + meterText.trim().slice(0, 90));
      await page.screenshot({ path: path.join(SHOTS, "storyboard-strip-flip-crit.png") });

      /* The Momentum window's seconds per panel. */
      await page.evaluate(() => {
        localStorage.setItem("curiosities-momentum-v1", JSON.stringify({ secondsPerPanel: 1 }));
        window.CurioMomentumStoryboard.refresh();
      });
      await page.waitForFunction(() => /A panel lasts 1 s/.test((document.querySelector(".mo-sbs-label") || {}).textContent || ""), null, { timeout: 3000 });
      check(await page.evaluate(() => /9 s of/.test(document.querySelector(".mo-sbm").textContent)), "1 second per panel: panel 9 has held 9 s");
      await page.evaluate(() => {
        localStorage.removeItem("curiosities-momentum-v1");
        window.CurioMomentumStoryboard.refresh();
      });

      /* All scenes: one strip per scene, cells under the panels. */
      await page.click("[data-sb=view-grid]");
      await page.waitForSelector(".sb-scene .mo-sbs", { timeout: 5000 });
      const grid = await page.evaluate(() =>
        [...document.querySelectorAll(".sb-scene[data-scene]")].map((sec) => {
          const panels = sec.querySelectorAll(".sb-strip > .panel");
          const cells = sec.querySelectorAll(".mo-sbs .mo-sbs-cell");
          const lined = [...panels].every((p, k) => cells[k] && Math.abs(cells[k].getBoundingClientRect().left - p.getBoundingClientRect().left) < 1.5);
          const order = sec.querySelector(".sb-reel > .sb-strip + .mo-sbs") != null;
          return { panels: panels.length, cells: cells.length, lined, order };
        })
      );
      const mine = grid.slice(-2);
      check(mine.length === 2 && mine.every((g) => g.cells === g.panels && g.cells > 0), `All scenes: one cell per panel in each scene (${mine.map((g) => g.cells + "/" + g.panels).join(", ")})`);
      check(mine.every((g) => g.lined && g.order), "each scene's cells sit right under its panels, above the bands");
      await page.evaluate(() => document.querySelectorAll(".sb-scene")[document.querySelectorAll(".sb-scene").length - 2].scrollIntoView());
      await page.waitForTimeout(200);
      await page.screenshot({ path: path.join(SHOTS, "storyboard-strip-grid.png") });
      /* A cell opens the flip book at that panel. */
      await page.evaluate(() => {
        const secs = document.querySelectorAll(".sb-scene");
        secs[secs.length - 1].querySelectorAll(".mo-sbs-cell")[2].click();
      });
      await page.waitForSelector("[data-sb=viewer] .mo-sbm", { timeout: 3000 });
      a = await atOf();
      check(Number(a.on) === total - 6 + 2 && a.meter === a.on, "a cell in All scenes opens the flip book at its panel");

      /* Print keeps the strip and does not widen the page. */
      await page.emulateMedia({ media: "print" });
      const pr = await page.evaluate(() => ({ strip: !!document.querySelector(".mo-sbs") && getComputedStyle(document.querySelector(".mo-sbs")).display !== "none", wide: document.documentElement.scrollWidth > window.innerWidth + 1 }));
      check(pr.strip && !pr.wide, "print: the strip shows and the page does not grow sideways");
      await page.emulateMedia({ media: "screen" });

      /* Phone width. */
      const phone = await open({ width: 375, height: 800 });
      await put(phone);
      await phone.waitForSelector("[data-sb=thumbs] .mo-sbs", { timeout: 5000 });
      const wide = await phone.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      check(wide <= 1, `375 px wide, Flip through: no sideways scroll (${wide})`);
      await phone.evaluate(() => document.querySelector(".mo-sbm").scrollIntoView({ block: "center" }));
      await phone.screenshot({ path: path.join(SHOTS, "storyboard-strip-phone.png") });
      await phone.click("[data-sb=view-grid]");
      await phone.waitForSelector(".sb-scene .mo-sbs", { timeout: 5000 });
      const wide2 = await phone.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      check(wide2 <= 1, `375 px wide, All scenes: no sideways scroll (${wide2})`);
      await phone.evaluate(() => {
        const s = document.querySelectorAll(".sb-scene");
        s[s.length - 2].scrollIntoView();
      });
      await phone.screenshot({ path: path.join(SHOTS, "storyboard-strip-phone-grid.png") });
      /* Leave the storyboard as it was. */
      await phone.evaluate(() => window.CuriosityStoryboard.putScenes("momentumtest", []));
      check(errors.length === 0, "no page errors" + (errors.length ? ": " + errors.slice(0, 3).join(" | ") : ""));
    } catch (e) {
      console.log("FAIL " + (e && e.stack));
      failed++;
    }
    await browser.close();
    server.close();
    console.log(failed ? failed + " browser check(s) failed." : "Storyboard strip browser checks passed. Screenshots in " + SHOTS);
    process.exit(failed ? 1 : 0);
  });
}
