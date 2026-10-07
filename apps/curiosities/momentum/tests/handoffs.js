/* Hand-offs (momentum/handoffs.js): node apps/curiosities/momentum/tests/handoffs.js [--browser] [--three <three.min.js>] [--shots <dir>]
   1. With no page: classifying a hand-off as moving attention to a new family or letting it rest, counting how
      often a proximity happens, the engine's links counted from its events, the share, the stretches that need a
      hand-off, the suggestions (Compass first, else the least-used family), and adding one as one undo step that
      reads exactly as the preview promised.
   2. With --browser (needs Playwright and Chromium; set NODE_PATH): the app, Momentum, the "Hand-offs" tab under
      Fix it, Add this hand-off as one undo step, the before and after table, Undo, a curated film, no page
      errors, no sideways scroll at 375px, and screenshots in --shots (default: the system temp folder). */
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
["notes.js", "attention.js", "rates.js", "compass.js", "engine-lanes.js", "handoffs.js"].forEach((f) => {
  const file = path.join(ROOT, "momentum", f);
  vm.runInContext(fs.readFileSync(file, "utf8"), vm.isContext(ctx) ? ctx : vm.createContext(ctx), { filename: file });
});
const E = ctx.CurioEngine;
const H = ctx.CurioHandoffs;
const A = ctx.CurioAttention;
const M = ctx.CurioMomentum;
const ME = ctx.CurioMomentumEngine;
const PROX = vm.runInContext("PROXIMITIES", ctx);
let n = 0;
const eq = (a, b, m) => assert.deepStrictEqual(JSON.parse(JSON.stringify(a)), JSON.parse(JSON.stringify(b)), m);
const ok = (name, fn) => {
  fn();
  n++;
  console.log("ok", name);
};

ok("handoffs.js also loads through require with the same functions", () => {
  const R = require(path.join(ROOT, "momentum", "handoffs.js"));
  ["classify", "count", "fromProximities", "fromLinks", "summary", "stretches", "suggest", "plan", "add"].forEach((k) => assert.strictEqual(typeof R[k], "function", k));
});

ok("a hand-off to a different family moves attention on, one to the same family lets it rest", () => {
  const close = H.classify({ curiosity: "shotSize", is: "close" }, { curiosity: "volume", change: "drops" });
  eq([close.from, close.to, close.kind], [M.familyOf("shotSize"), M.familyOf("volume"), "moves"]);
  assert.notStrictEqual(close.from, close.to);
  const setup = H.classify({ curiosity: "comicBeat" }, { curiosity: "comicBeat" });
  assert.strictEqual(setup.kind, "rests");
  assert.strictEqual(H.classify({ curiosity: "nothing-like-this" }, { curiosity: "volume" }).kind, "unknown");
  /* A suite end takes the family most of its members belong to. */
  const f = H.endFamily({ suite: "aggressive-camera" });
  assert.strictEqual(f, "camera");
  assert(/look$/.test(H.endLabel({ suite: "noir" })));
});

ok("count: X happening, and Y following within N moments, as Study counts it", () => {
  const p = { x: { curiosity: "shotSize", is: "close" }, y: { curiosity: "volume", change: "drops" }, within: 1 };
  const beats = [
    { values: { shotSize: "wide", volume: 4 } },
    { values: { shotSize: "close", volume: 4 } },
    { values: { shotSize: "close", volume: 2 } },
    { values: { shotSize: "wide", volume: 2 } },
    { values: { shotSize: "close", volume: 2 } },
  ];
  eq(H.count(p, beats), { n: 3, fired: 2, at: [1, 2] });
  /* "curiosity@track" keys read as the curiosity, the first track winning. */
  const flat = H.flatten([{ values: { "volume@char1": 3, "volume@char2": 1, shotSize: "close" } }]);
  eq(flat[0].values, { volume: 3, shotSize: "close" });
});

ok("a curated film lists the app's proximities its moments show, and the share that move to a new family", () => {
  const studies = ctx.CuriosityDB.studiesExport().studies;
  assert(studies.length >= 3);
  let some = 0;
  studies.forEach((st) => {
    const rows = H.fromProximities(PROX, st.beats, { source: "study" });
    rows.forEach((r) => {
      assert(r.fired >= 1 && ["moves", "rests"].includes(r.kind), r.id);
      assert(r.when && r.then && !/\bbeats?\b/i.test(r.when + r.then), r.when);
      assert.strictEqual(r.source, "study");
    });
    const s = H.summary(rows);
    assert.strictEqual(s.moving + s.resting, s.fired);
    if (s.fired) assert.strictEqual(s.share, Math.round((s.moving / s.fired) * 100) / 100);
    some += rows.length;
    /* all: also the ones whose curiosities are there but that never happened. */
    assert(H.fromProximities(PROX, st.beats, { all: true }).length >= rows.length);
  });
  assert(some >= 5, "the practice scenes show several proximities: " + some);
  eq(H.summary([]), { fired: 0, moving: 0, resting: 0, share: null, total: 0, movingRows: 0 });
});

ok("the engine's links are hand-offs too, each fired as often as the engine's events say", () => {
  assert(E.send({ type: "importFilm", film: ctx.CurioSeeds.starter() }).ok);
  assert(E.send({ type: "batch", label: "Add the letter's links", commands: ctx.CurioSeeds.letterLinks(E.state()) }).ok);
  const st = E.state();
  const rows = H.fromLinks(st, E.result().events);
  assert.strictEqual(rows.length, st.links.length);
  rows.forEach((r, i) => {
    const l = st.links[i];
    assert.strictEqual(r.link, l.id);
    assert.strictEqual(r.fired, E.result().events.filter((e) => e.link === l.id).length);
    assert.strictEqual(r.kind, M.familyOf(l.from.curiosity) === M.familyOf(l.to.curiosity) ? "rests" : "moves");
    assert(/ on /.test(r.when), r.when);
  });
  assert(rows.some((r) => r.fired > 0));
});

ok("stretches: only those Getting long or Too long by CurioMomentum.status, too long first", () => {
  const r = ME.reading({ limit: 4, secondsPerBeat: 3 });
  const list = H.stretches(r);
  assert(list.length >= 2);
  list.forEach((s) => assert(["long", "over"].includes(s.status.key) && s.status.key === M.status(s.dur, 4).key));
  const keys = list.map((s) => s.status.key);
  eq(keys, keys.slice().sort((a, b) => (a === b ? 0 : a === "over" ? -1 : 1)));
  assert.strictEqual(H.stretches(ME.reading({ limit: 60, secondsPerBeat: 3 })).length, 0);
});

ok("suggest: the Compass's family when it has one, else the family the film uses least, never the holder's", () => {
  const r = ME.reading({ limit: 5, secondsPerBeat: 3 });
  const cands = H.candidatesFor(E.state());
  const plainList = H.suggest(r, { candidates: cands });
  assert(plainList.length >= 1);
  plainList.forEach((s) => {
    assert.notStrictEqual(s.target.family, s.holder.family);
    assert.strictEqual(s.why, "least");
    assert.strictEqual(s.text, `When ${s.holder.label} happens, ${s.target.label} follows within 1 moment.`);
    assert(s.reason.length > 40 && !/—/.test(s.reason + s.text));
    /* The least-used family among those already in the film. */
    const share = r.stats.familyShare;
    const onFilm = [...new Set(cands.filter((c) => c.onTrack && c.family !== s.holder.family).map((c) => c.family))];
    const least = Math.min(...onFilm.map((f) => share[f] || 0));
    if (s === plainList[0]) assert.strictEqual(share[s.target.family] || 0, least);
  });
  const fam = cands.find((c) => c.family !== plainList[0].holder.family && c.family !== plainList[0].target.family).family;
  const withCompass = H.suggest(r, { candidates: cands, compass: [{ family: plainList[0].holder.family }, { family: fam }] });
  assert.strictEqual(withCompass[0].target.family, fam);
  assert.strictEqual(withCompass[0].why, "compass");
  assert(/Compass/.test(withCompass[0].reason));
  eq(H.suggest(r, { candidates: [] }), []);
});

ok("plan never touches the engine; adding one is one undo step and the film reads as the preview said", () => {
  const fp = E.fingerprint();
  const undo = E.history().undo.length;
  const p = H.plan(E, { limit: 5, secondsPerBeat: 3 });
  assert.strictEqual(E.fingerprint(), fp);
  assert.strictEqual(E.history().undo.length, undo);
  assert(p.suggestions.length >= 1);
  const s = p.suggestions.find((x) => x.helps) || p.suggestions[0];
  assert(s.helps, "at least one suggestion helps the starter film");
  assert(s.preview.over < p.numbers.over, `fewer stretches too long (${p.numbers.over} to ${s.preview.over})`);
  assert.strictEqual(s.commands[s.commands.length - 1].type, "addLink");
  assert.strictEqual(s.link.within, 1);
  const res = H.add(s);
  assert(res.ok, res.error);
  assert.strictEqual(E.history().undo.length, undo + 1, "one undo step");
  const now = H.numbers(ME.reading({ limit: 5, secondsPerBeat: 3 }), H.fromLinks(E.state(), E.result().events));
  eq(now, s.preview);
  E.undo();
  assert.strictEqual(E.fingerprint(), fp, "undo takes it back");
  assert.strictEqual(H.plan({ rows: [], tracks: [] }, {}), null);
  assert.strictEqual(H.add(null).ok, false);
});

ok("a family not yet in My film comes in with its curiosity, in the same one step", () => {
  const st = E.state();
  const cands = H.candidatesFor(st);
  const off = cands.filter((c) => c.onTrack === false);
  assert(off.length >= 1, "some family has no curiosity on a track");
  off.forEach((c) => assert(!st.tracks.some((t) => t.curiosities.includes(c.curiosity)) && st.tracks.some((t) => t.id === c.track)));
  const r = ME.reading({ limit: 5, secondsPerBeat: 3 });
  const holder = H.suggest(r, { candidates: cands })[0].holder.family;
  const only = cands.filter((c) => c.family === holder || c.onTrack === false);
  const p = H.suggest(r, { candidates: only });
  assert.strictEqual(p[0].target.onTrack, false);
  /* A film of one family only (the cutting rate and the shot size keep changing): every hand-off has to bring
     a new curiosity in, and it comes as one batch, one undo step. */
  const fp = E.fingerprint();
  const rows = ["a", "b", "c", "d", "e", "f"].map((id, i) => ({ id: "r" + i, label: "Moment " + (i + 1) }));
  const cut = ["slow", "medium", "fast"];
  const size = ["wide", "medium", "close"];
  const source = {};
  rows.forEach((r, i) => {
    source[r.id + "|master|cutRate"] = cut[i % 3];
    source[r.id + "|camera|shotSize"] = size[(i + 1) % 3];
  });
  const film = { rows, tracks: [{ id: "master", kind: "master", label: "Master", curiosities: ["cutRate"] }, { id: "camera", kind: "camera", label: "Camera", curiosities: ["shotSize"] }], source };
  assert(E.send({ type: "importFilm", film }).ok, "the one-family film loads");
  assert.strictEqual(new Set(["cutRate", "shotSize"].map((c) => M.familyOf(c))).size, 1, "both are one family");
  const undo = E.history().undo.length;
  const plan = H.plan(E, { limit: 5, secondsPerBeat: 3 });
  assert(plan.suggestions.length >= 1);
  const sug = plan.suggestions[0];
  assert.strictEqual(sug.target.onTrack, false);
  eq(sug.commands.map((c) => c.type), ["addCuriosity", "addLink"]);
  assert(H.add(sug).ok);
  assert.strictEqual(E.history().undo.length, undo + 1);
  assert(E.state().tracks.some((t) => t.curiosities.includes(sug.target.curiosity)));
  eq(H.numbers(ME.reading({ limit: 5, secondsPerBeat: 3 }), H.fromLinks(E.state(), E.result().events)), sug.preview);
  E.undo();
  E.undo();
  assert.strictEqual(E.fingerprint(), fp);
});

console.log(`\n${n} hand-off checks passed`);

if (args.includes("--browser")) browserCheck();

function browserCheck() {
  const http = require("http");
  const { chromium } = require("playwright");
  const SHOTS = arg("--shots", os.tmpdir());
  fs.mkdirSync(SHOTS, { recursive: true });
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
    const server = await serve();
    const base = "http://127.0.0.1:" + server.address().port + "/";
    const browser = await chromium.launch();
    const errors = [];
    const three = arg("--three", "");
    async function open(viewport) {
      const page = await browser.newPage({ viewport });
      page.on("pageerror", (e) => errors.push(String(e && e.message)));
      page.on("console", (m) => m.type() === "error" && !/Failed to load resource|favicon|fonts\.g/.test(m.text()) && errors.push(m.text()));
      await page.route(/three\.min\.js$/, (r) => (three ? r.fulfill({ contentType: "text/javascript", body: fs.readFileSync(three, "utf8") }) : r.fulfill({ contentType: "text/javascript", body: "" })));
      await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
      await page.goto(base + "index.html");
      if (!(await page.evaluate(() => !!document.querySelector('script[src="momentum/load.js"]'))))
        await page.evaluate(() => {
          const s = document.createElement("script");
          s.src = "momentum/load.js";
          document.body.appendChild(s);
        });
      await page.waitForFunction(() => window.CurioMomentumUI && window.CurioHandoffs && window.CurioEngine, null, { timeout: 10000 });
      await page.evaluate(() => {
        const E = window.CurioEngine;
        E.send({ type: "importFilm", film: window.CurioSeeds.starter() });
        E.send({ type: "batch", label: "Add the letter's links", commands: window.CurioSeeds.letterLinks(E.state()) });
      });
      await page.evaluate(() => document.getElementById("lib-btn").click());
      await page.click("#lib-menu [data-momentum]");
      await page.waitForSelector(".mo-dlg[open]");
      /* A short limit (5 seconds, set in Attention) so the eight-moment starter film has stretches that are too long. */
      await page.click('.mo-dlg [data-tab="attention"]');
      await page.evaluate(() => {
        const el = document.querySelector('.mo-dlg input[data-m="limit"]');
        el.value = "5";
        el.dispatchEvent(new Event("change", { bubbles: true }));
      });
      await page.click('.mo-dlg [data-tab="handoffs"]');
      await page.waitForSelector(".mo-dlg .ho-root");
      const src = await page.$eval('.mo-dlg select[data-ho="source"]', (s) => s.value);
      if (src !== "engine") {
        await page.selectOption('.mo-dlg select[data-ho="source"]', "engine");
        await page.waitForSelector(".mo-dlg .ho-root");
      }
      return page;
    }
    const page = await open({ width: 1360, height: 900 });
    const tab = await page.evaluate(() => {
      const b = document.querySelector('.mo-dlg [data-tab="handoffs"]');
      const grp = b.closest("[data-tabgroup]");
      return [b.textContent, grp ? grp.dataset.tabgroup : ""];
    });
    check(tab[0] === "Hand-offs", 'the Momentum window has a "Hand-offs" tab');
    check(tab[1] === "fix", "it sits under Fix it: " + tab[1]);
    const top = await page.$eval(".mo-dlg .ho-big", (e) => e.textContent);
    check(/\d+% of the hand-offs in this film move attention to a new family/.test(top), "the summary says the share: " + top);
    const rows = await page.$$eval(".mo-dlg .ho-row", (r) => r.map((x) => x.textContent));
    check(rows.length >= 3 && rows.every((t) => /(Moves on|Rests)/.test(t) && /happened (once|\d+ times)/.test(t)), `the film's hand-offs are listed with their kind and count (${rows.length})`);
    const letters = await page.$$eval(".mo-dlg .ho-row .ho-letter", (r) => r.length);
    check(letters >= rows.length * 2, "each shows the family marks of both ends");
    const sugg = await page.$$(".mo-dlg [data-ho-add]");
    check(sugg.length >= 1, `a stretch that is too long gets a hand-off to add (${sugg.length})`);
    const text = await page.$eval(".mo-dlg .ho-sug .ho-say", (e) => e.textContent);
    check(/^Try: When .+ happens, .+ follows within 1 moment\.$/.test(text), "the suggestion reads: " + text);
    await page.screenshot({ path: path.join(SHOTS, "handoffs-wide.png") });
    const n0 = await page.evaluate(() => window.CurioEngine.history().undo.length);
    const links0 = await page.evaluate(() => window.CurioEngine.state().links.length);
    await page.click(".mo-dlg [data-ho-add]");
    const after = await page.evaluate(() => [window.CurioEngine.history().undo.length, window.CurioEngine.state().links.length, (document.querySelector(".mo-dlg .mo-flash") || {}).textContent || ""]);
    check(after[0] === n0 + 1 && after[1] === links0 + 1, `adding is one undo step and one new link (${after[0] - n0} step, ${after[1] - links0} link)`);
    check(/one step/.test(after[2]), "it says so: " + after[2]);
    const table = await page.$$eval(".mo-dlg .ho-nums tbody tr", (r) => r.map((x) => [x.children[0].textContent, x.children[1].textContent, x.children[2].textContent]));
    check(table.length === 5, "a before and after table shows");
    const tooLong = table.find((r) => /too long/.test(r[0]));
    check(tooLong && Number(tooLong[2]) < Number(tooLong[1]), "fewer stretches are too long after: " + (tooLong || []).join(" "));
    await page.screenshot({ path: path.join(SHOTS, "handoffs-added.png"), fullPage: false });
    await page.evaluate(() => (document.querySelector(".mo-dlg").scrollTop = 600));
    await page.screenshot({ path: path.join(SHOTS, "handoffs-list.png"), fullPage: false });
    await page.evaluate(() => window.CurioEngine.undo());
    check((await page.evaluate(() => window.CurioEngine.state().links.length)) === links0, "undo takes the hand-off back");
    /* A curated film: its hand-offs, and suggestions without an Add button. */
    const study = await page.$$eval('.mo-dlg select[data-ho="source"] option', (o) => (o.find((x) => x.value.startsWith("study:")) || {}).value);
    if (study) {
      await page.selectOption('.mo-dlg select[data-ho="source"]', study);
      await page.waitForSelector(".mo-dlg .ho-root");
      const st = await page.evaluate(() => [document.querySelectorAll(".mo-dlg .ho-row").length, document.querySelectorAll(".mo-dlg [data-ho-add]").length, document.querySelector(".mo-dlg .ho-root").textContent]);
      check(st[0] >= 1 && st[1] === 0, `a curated film lists its hand-offs (${st[0]}) and offers none to add`);
      check(!/\bbeats?\b|undefined|NaN/.test(st[2]), "no stray words on the curated film");
      await page.screenshot({ path: path.join(SHOTS, "handoffs-curated.png") });
    } else check(false, "a curated film is in the picker");

    const phone = await open({ width: 375, height: 800 });
    const wide = await phone.evaluate(() => {
      const d = document.querySelector(".mo-dlg");
      return [document.documentElement.scrollWidth - window.innerWidth, d.scrollWidth - d.clientWidth];
    });
    check(wide[0] <= 0 && wide[1] <= 0, `no sideways scroll at 375px (page ${wide[0]}px, window ${wide[1]}px over)`);
    await phone.screenshot({ path: path.join(SHOTS, "handoffs-phone.png"), fullPage: false });
    await phone.click(".mo-dlg [data-ho-add]");
    await phone.evaluate(() => {
      const t = document.querySelector(".mo-dlg .ho-nums");
      if (t) t.scrollIntoView();
    });
    const wide2 = await phone.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    check(wide2 <= 0, "still no sideways scroll at 375px with the before and after table");
    await phone.screenshot({ path: path.join(SHOTS, "handoffs-phone-added.png"), fullPage: false });

    check(errors.length === 0, "no page errors" + (errors.length ? ": " + errors.join(" | ") : ""));
    await browser.close();
    server.close();
    console.log(failed ? `\n${failed} browser checks FAILED` : "\nbrowser checks passed");
    process.exit(failed ? 1 : 0);
  })().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
