/* Momentum stays quick (momentum/PERFORMANCE.md): node apps/curiosities/momentum/tests/speed.js [--browser] [--three <three.min.js>]
   1. With no page: CurioMomentum.all() (asked for on many tabs, once per idea on Cue lab) keeps its list
      between calls, hands each caller its own array, and builds the list again when a curiosity is added.
   2. With --browser (needs Playwright and Chromium; set NODE_PATH): the app with Momentum.
      - Opening the window and then every tab once stays under a generous budget (BUDGET_MS, a few times
        what it takes on a laptop, so only a real slowdown fails it).
      - Opening every tab 5 more times adds no listeners: window and document listeners, MutationObservers and
        engine subscriptions are the same after the fifth round as after the first.
      - A tab that listens to the engine (Who we watch) stops listening when another tab opens or the window
        closes.
      - The Screen's momentum panel reads only My film on an engine change (the inspiration films are kept),
        and reads nothing while the Screen is closed; it is fresh again when the Screen reopens.
      - No page errors. */
const path = require("path");
const fs = require("fs");
const vm = require("vm");
const assert = require("assert");

const args = process.argv.slice(2);
const arg = (n, d) => (args.includes(n) ? args[args.indexOf(n) + 1] : d);
const ROOT = path.join(__dirname, "..", "..");
const BUDGET_MS = 2500; /* every tab once, plus opening the window */

const core = require(path.join(ROOT, "core", "headless.js")).load();
const ctx = core.window;
const file = path.join(ROOT, "momentum", "notes.js");
vm.runInContext(fs.readFileSync(file, "utf8"), vm.isContext(ctx) ? ctx : vm.createContext(ctx), { filename: file });
const M = ctx.CurioMomentum;
let n = 0;
const ok = (name, fn) => {
  fn();
  n++;
  console.log("ok", name);
};

ok("all() keeps its list and gives each caller its own array", () => {
  const a = M.all();
  const b = M.all();
  assert(a.length > 50, "too few curiosities: " + a.length);
  assert.notStrictEqual(a, b);
  assert.strictEqual(JSON.stringify(a), JSON.stringify(b));
  a.length = 0;
  assert.strictEqual(M.all().length, b.length, "emptying one caller's array changed the list");
  assert.strictEqual(a.length, 0);
});

ok("all() is much quicker the second time", () => {
  const t0 = process.hrtime.bigint();
  for (let i = 0; i < 20; i++) M.all();
  const ms = Number(process.hrtime.bigint() - t0) / 1e6;
  assert(ms < 200, "20 calls took " + ms.toFixed(1) + " ms");
});

ok("all() builds the list again when a curiosity is added", () => {
  const D = ctx.CuriosityDB;
  const before = M.all().length;
  if (D && D.data && D.curiosity) D.curiosity({ id: "speedTestThing", label: "Speed test thing", workspace: "story", group: "Story" });
  else (ctx.CURIOSITIES || []).push({ id: "speedTestThing", label: "Speed test thing", workspace: "story" });
  const after = M.all();
  assert.strictEqual(after.length, before + 1);
  assert(after.some((x) => x.id === "speedTestThing"));
});

console.log(`\n${n} speed checks passed`);

if (args.includes("--browser")) browserCheck();

function browserCheck() {
  const http = require("http");
  const { chromium } = require("playwright");
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
  /* Counts, installed before any page script: window and document listeners, MutationObservers that are
     observing, engine subscriptions (CurioEngine.on not yet stopped) and CurioAttention.read calls. */
  const HOOKS = `(() => {
    const P = (window.__speed = { win: 0, doc: 0, mo: 0, eng: 0, reads: 0, readers: {} });
    const add = EventTarget.prototype.addEventListener, rem = EventTarget.prototype.removeEventListener;
    const seen = new WeakMap();
    const keyOf = (t, f, o) => t + "|" + !!(o === true || (o && o.capture));
    EventTarget.prototype.addEventListener = function (t, f, o) {
      if ((this === window || this === document) && f) {
        let m = seen.get(this);
        if (!m) seen.set(this, (m = new Map()));
        const k = keyOf(t, f, o);
        let s = m.get(f);
        if (!s) m.set(f, (s = new Set()));
        if (!s.has(k)) { s.add(k); P[this === window ? "win" : "doc"]++; }
      }
      return add.call(this, t, f, o);
    };
    EventTarget.prototype.removeEventListener = function (t, f, o) {
      const m = (this === window || this === document) && seen.get(this);
      const s = m && m.get(f);
      if (s && s.delete(keyOf(t, f, o))) P[this === window ? "win" : "doc"]--;
      return rem.call(this, t, f, o);
    };
    const MO = window.MutationObserver;
    window.MutationObserver = class extends MO {
      observe(n, o) { if (!this.__on) { P.mo++; this.__on = true; } return super.observe(n, o); }
      disconnect() { if (this.__on) { P.mo--; this.__on = false; } return super.disconnect(); }
    };
    let eng, att;
    Object.defineProperty(window, "CurioEngine", { configurable: true, get: () => eng, set(v) {
      if (v && v.on && !v.__speed) {
        const on = v.on;
        v.on = function (fn) { P.eng++; const u = on.call(this, fn); let done = false; return function () { if (!done) { done = true; P.eng--; } return u && u.apply(this, arguments); }; };
        v.__speed = true;
      }
      eng = v;
    } });
    Object.defineProperty(window, "CurioAttention", { configurable: true, get: () => att, set(v) {
      if (v && v.read && !v.__speed) {
        const r = v.read;
        v.read = function () {
          P.reads++;
          const at = (new Error().stack.split("\\n")[2] || "").match(/momentum\\/([a-z-]+\\.js)/);
          if (at) P.readers[at[1]] = (P.readers[at[1]] || 0) + 1;
          return r.apply(this, arguments);
        };
        v.__speed = true;
      }
      att = v;
    } });
  })();`;
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
    const context = await browser.newContext({ viewport: { width: 1360, height: 900 } });
    await context.addInitScript(HOOKS);
    const page = await context.newPage();
    page.on("pageerror", (e) => errors.push(String(e && e.message)));
    page.on("console", (m) => m.type() === "error" && !/Failed to load resource|favicon|fonts\.g/.test(m.text()) && errors.push(m.text()));
    await page.route(/three\.min\.js$/, (r) => r.fulfill({ contentType: "text/javascript", body: three ? fs.readFileSync(three, "utf8") : "" }));
    await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
    await page.goto(base + "index.html");
    if (!(await page.evaluate(() => !!document.querySelector('script[src="momentum/load.js"]'))))
      await page.evaluate(() => {
        const s = document.createElement("script");
        s.src = "momentum/load.js";
        document.body.appendChild(s);
      });
    await page.waitForFunction(() => window.CurioMomentumUI, null, { timeout: 10000 });
    await page.waitForTimeout(400); /* tabs that register a moment later */

    /* Every tab once, timed from the click to the tab being drawn. */
    const first = await page.evaluate(() => {
      const t0 = performance.now();
      window.CurioMomentumUI.open("attention");
      const open = performance.now() - t0;
      const ids = [...document.querySelectorAll(".mo-dlg [role=tab]")].map((b) => b.dataset.tab);
      const each = {};
      ids.forEach((id) => {
        const t = performance.now();
        document.querySelector(`.mo-dlg [data-tab="${id}"]`).click();
        each[id] = Math.round((performance.now() - t) * 10) / 10;
      });
      return { open, ids, each, total: performance.now() - t0 };
    });
    const slowest = Object.entries(first.each).sort((a, b) => b[1] - a[1])[0];
    check(first.ids.length >= 16, `the window has every tab (${first.ids.length})`);
    check(first.total < BUDGET_MS, `opening the window and every tab once takes ${Math.round(first.total)} ms (budget ${BUDGET_MS} ms; slowest ${slowest[0]} ${slowest[1]} ms)`);

    /* Five rounds of every tab: nothing left listening from tabs that are gone. */
    const counts = () => page.evaluate(() => ({ win: window.__speed.win, doc: window.__speed.doc, mo: window.__speed.mo, eng: window.__speed.eng }));
    const round = () =>
      page.evaluate((ids) => {
        ids.forEach((id) => document.querySelector(`.mo-dlg [data-tab="${id}"]`).click());
        document.querySelector('.mo-dlg [data-tab="attention"]').click();
      }, first.ids);
    await round();
    const c1 = await counts();
    for (let i = 0; i < 4; i++) await round();
    const c5 = await counts();
    const grew = Object.keys(c1).filter((k) => c5[k] > c1[k]);
    check(!grew.length, `no listeners pile up after opening every tab 5 times (window ${c5.win}, document ${c5.doc}, observers ${c5.mo}, engine ${c5.eng})` + (grew.length ? ": grew " + grew.map((k) => `${k} ${c1[k]} to ${c5[k]}`).join(", ") : ""));

    /* A tab listening to the engine lets go when it is left and when the window closes. */
    const watch = await page.evaluate(() => {
      const P = window.__speed;
      window.CurioMomentumUI.open("attention");
      const base = P.eng;
      window.CurioMomentumUI.open("watch");
      const on = P.eng;
      window.CurioMomentumUI.open("attention");
      const left = P.eng;
      window.CurioMomentumUI.open("watch");
      window.CurioMomentumUI.close();
      return { base, on, left, closed: P.eng };
    });
    check(watch.on === watch.base + 1 && watch.left === watch.base && watch.closed === watch.base, `Who we watch listens to the engine only while it is open (${watch.base}, open ${watch.on}, left ${watch.left}, closed ${watch.closed})`);

    /* The Screen's panel: on an engine change it reads My film only, and nothing while the Screen is closed. */
    const hasScreen = await page.evaluate(() => !!(window.CurioScreen && window.CurioScreen.open));
    if (!hasScreen) console.log("skip the app has no Screen here");
    else {
      await page.evaluate(() => !window.CurioScreen.isOpen() && window.CurioScreen.open());
      const docked = await page.waitForSelector(".mo-sp .mo-sp-film", { timeout: 8000 }).then(() => true, () => false);
      if (!docked) console.log("skip the Screen has no momentum panel here");
      else {
        const change = (dir) =>
          page.evaluate(async (dir) => {
            const E = window.CurioEngine;
            const st = E.state();
            const tr = st.tracks.find((t) => t.curiosities && t.curiosities.length);
            const row = st.rows[Math.min(1, st.rows.length - 1)];
            const c = tr.curiosities[0];
            const v = E.value(row.id, tr.id, c);
            const nv = window.CurioScale.step(c, v, dir);
            const P = window.__speed;
            P.readers = {};
            E.send({ type: "batch", label: "Speed check", commands: [{ type: "setPoint", row: row.id, track: tr.id, curiosity: c, value: nv === v ? window.CurioScale.step(c, v, -dir) : nv }] });
            await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
            await new Promise((r) => setTimeout(r, 60));
            return { panel: P.readers["screen-panel.js"] || 0, films: document.querySelectorAll(".mo-sp .mo-sp-film").length, sub: (document.querySelector('.mo-sp .mo-sp-film[data-kind="mine"] .mo-sp-name small') || {}).textContent };
          }, dir);
        await change(1); /* the first change may fill the films' readings */
        const open = await change(-1);
        check(open.panel === 2, `with the Screen open, an engine change makes the panel read My film only (${open.panel} readings, ${open.films} films on show)`);
        await page.evaluate(() => window.CurioScreen.close());
        const closed = await change(1);
        check(closed.panel === 0, `with the Screen closed, the panel reads nothing on an engine change (${closed.panel} readings)`);
        const fresh = await page.evaluate(async () => {
          window.__speed.readers = {};
          window.CurioScreen.open();
          await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
          await new Promise((r) => setTimeout(r, 100));
          return [window.__speed.readers["screen-panel.js"] || 0, !!document.querySelector(".mo-sp .mo-sp-film")];
        });
        check(fresh[1] && fresh[0] >= 2, `when the Screen opens again the panel reads My film afresh (${fresh[0]} readings)`);
      }
    }

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
