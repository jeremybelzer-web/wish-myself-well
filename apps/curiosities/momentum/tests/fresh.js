/* Momentum on a fresh browser: NODE_PATH=/opt/node22/lib/node_modules node apps/curiosities/momentum/tests/fresh.js
   [--three <three.min.js>] [--shots <dir>]

   Jeremy opens the app for the first time (empty localStorage). At 1440 and at 375 pixels wide it opens the
   Momentum window from the Library menu and every tab in every group, then the Screen (its Momentum panel beside
   the Player, the Attention lane and the Momentum section in Details) and the Storyboard. It checks:
   - the page reports no errors;
   - at 375, no element on show is wider than the window, and the page does not scroll sideways;
   - no visible text has an em-dash;
   - every tab shows some text of its own, and the line of plain words sits under the tabs;
   - "Start the example film" on an empty My film starts one, as one undo step.
   Screenshots go to --shots (default: the system temp folder). */
const http = require("http");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { chromium } = require("playwright");

const args = process.argv.slice(2);
const arg = (n, d) => (args.includes(n) ? args[args.indexOf(n) + 1] : d);
const SHOTS = arg("--shots", os.tmpdir());
const three = arg("--three", "");
const ROOT = path.join(__dirname, "..", "..");
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".webmanifest": "application/manifest+json" };

function serve() {
  return new Promise((resolve) => {
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
}
let failed = 0;
const ok = (cond, text) => {
  console.log((cond ? "ok   " : "FAIL ") + text);
  if (!cond) failed++;
};

/* Runs in the page: every element on show inside the given roots that is wider than the window. */
function wideOnes(selectors) {
  const W = window.innerWidth;
  const out = [];
  document.querySelectorAll(selectors).forEach((root) =>
    [root, ...root.querySelectorAll("*")].forEach((el) => {
      const r = el.getBoundingClientRect();
      if (!r.width || !el.getClientRects().length) return;
      if (r.width > W + 1) out.push(`${el.tagName.toLowerCase()}.${String(el.className && el.className.baseVal != null ? el.className.baseVal : el.className).split(" ")[0]} (${Math.round(r.width)}px)`);
    })
  );
  return [...new Set(out)].slice(0, 6);
}

(async () => {
  const server = await serve();
  const base = "http://127.0.0.1:" + server.address().port + "/";
  const browser = await chromium.launch();
  try {
    for (const vp of [{ width: 1440, height: 900 }, { width: 375, height: 800 }]) {
      const phone = vp.width < 600;
      /* A new browser context: nothing in localStorage. */
      const ctx = await browser.newContext({ viewport: vp });
      const page = await ctx.newPage();
      const errors = [];
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
      await page.waitForFunction(() => window.CurioMomentumUI && window.CurioLesson && window.CurioPads, null, { timeout: 15000 });
      ok(await page.evaluate(() => localStorage.length === 0 || !Object.keys(localStorage).some((k) => k.startsWith("curiosities-momentum"))), `${vp.width}px: no Momentum settings saved yet`);
      await page.click("#lib-btn");
      await page.click("#lib-menu [data-momentum]");
      await page.waitForSelector(".mo-dlg[open]");
      const tabs = await page.$$eval(".mo-dlg [role=tab]", (t) => t.map((x) => [x.dataset.tab, x.textContent]));
      ok(tabs.length >= 18, `${vp.width}px: ${tabs.length} tabs to open`);
      const words = await page.evaluate(() => (document.querySelector(".mo-dlg .mo-words summary") || {}).innerText || "");
      ok(/family/.test(words) && /cue/.test(words) && /moment/.test(words), `${vp.width}px: the plain words line explains family, cue and moment`);
      for (const [id, label] of tabs) {
        await page.click(`.mo-dlg [data-tab="${id}"]`);
        await page.waitForTimeout(120);
        const seen = await page.evaluate((wide) => {
          const body = document.querySelector(".mo-dlg .mo-body");
          const own = body.cloneNode(true);
          own.querySelectorAll("select, option").forEach((x) => x.remove());
          return {
            text: body.innerText,
            ownText: (own.textContent || "").replace(/\s+/g, " ").trim(),
            words: !!document.querySelector(".mo-dlg .mo-words"),
            wide: new Function("return (" + wide + ")")()(".mo-dlg"),
            over: document.documentElement.scrollWidth - innerWidth,
            dlgOver: document.querySelector(".mo-dlg").scrollWidth - document.querySelector(".mo-dlg").clientWidth,
            all: document.querySelector(".mo-dlg").innerText,
          };
        }, wideOnes.toString());
        ok(seen.ownText.length >= 40 && seen.words, `${vp.width}px ${label}: shows text of its own (${seen.ownText.slice(0, 60)}...)`);
        ok(!/—/.test(seen.all), `${vp.width}px ${label}: no em-dash in what shows`);
        if (phone) ok(!seen.wide.length && seen.over <= 0 && seen.dlgOver <= 0, `${vp.width}px ${label}: nothing wider than the window${seen.wide.length ? ": " + seen.wide.join(", ") : ""}`);
        if (id === "pads" || id === "attention" || id === "lesson") await page.screenshot({ path: path.join(SHOTS, `fresh-${vp.width}-${id}.png`) });
      }

      /* An empty My film: Pads offers to start the example film, one undo step. */
      await page.click('.mo-dlg [data-tab="pads"]');
      const rows0 = await page.evaluate(() => window.CurioEngine.state().rows.length);
      if (!rows0) {
        const btn = await page.$('.mo-dlg [data-m="start-film"]');
        ok(!!btn, `${vp.width}px: an empty My film offers "Start the example film"`);
        if (btn) {
          const undo0 = await page.evaluate(() => window.CurioEngine.history().undo.length);
          await btn.click();
          await page.waitForTimeout(150);
          const after = await page.evaluate(() => ({ rows: window.CurioEngine.state().rows.length, undo: window.CurioEngine.history().undo.length, pads: document.querySelectorAll(".mo-dlg [data-pad], .mo-dlg .mpd-pad, .mo-dlg button[data-family]").length }));
          ok(after.rows > 0 && after.undo > undo0, `${vp.width}px: it starts My film (${after.rows} moments) as an undoable step`);
          await page.screenshot({ path: path.join(SHOTS, `fresh-${vp.width}-pads-started.png`) });
        }
      }

      /* The Screen: the panel beside the Player, the Attention lane and the Momentum section in Details. */
      await page.evaluate(() => window.CurioMomentumUI.close());
      await page.evaluate(() => !window.CurioScreen.isOpen() && window.CurioScreen.open());
      await page.waitForSelector(".mo-sp .mo-sp-film", { timeout: 8000 }).catch(() => {});
      await page.waitForTimeout(300);
      const sc = await page.evaluate((wide) => {
        const t = (s) => (document.querySelector(s) || {}).innerText || "";
        const pg = document.querySelector(".sc-page");
        return { sp: t(".mo-sp"), sd: t(".mo-sd"), lane: t(".mo-al-row"), wide: new Function("return (" + wide + ")")()(".mo-sp, .mo-sd, .mo-al-row"), over: pg ? pg.scrollWidth - pg.clientWidth : 0 };
      }, wideOnes.toString());
      ok(sc.sp.length > 20 && sc.sd.length > 20 && sc.lane.length > 5, `${vp.width}px Screen: the Momentum panel, the Details section and the Attention lane show`);
      ok(!/—/.test(sc.sp + sc.sd + sc.lane), `${vp.width}px Screen: no em-dash`);
      ok(!/\bbeat \d/.test(sc.sp), `${vp.width}px Screen: the panel says "moment", like the rest`);
      if (phone) ok(!sc.wide.length && sc.over <= 0, `${vp.width}px Screen: nothing wider than the window${sc.wide.length ? ": " + sc.wide.join(", ") : ""}`);
      await page.screenshot({ path: path.join(SHOTS, `fresh-${vp.width}-screen.png`) });
      await page.evaluate(() => window.CurioScreen.close && window.CurioScreen.close());

      /* The Storyboard, empty: the strip adds nothing broken. */
      await page.evaluate(() => window.CuriosityWorkspaces && window.CuriosityWorkspaces.open("storyboard"));
      await page.waitForTimeout(300);
      const sb = await page.evaluate(() => [...document.querySelectorAll(".mo-sbs, .mo-sbm")].map((e) => e.innerText).join(" "));
      ok(!/—/.test(sb), `${vp.width}px Storyboard: no em-dash in the momentum strip`);
      await page.screenshot({ path: path.join(SHOTS, `fresh-${vp.width}-storyboard.png`) });

      ok(errors.length === 0, `${vp.width}px: no page errors` + (errors.length ? ": " + errors.slice(0, 4).join(" | ") : ""));
      await ctx.close();
    }
  } finally {
    await browser.close();
    server.close();
  }
  console.log(failed ? `\n${failed} failed` : "\nall passed; screenshots in " + SHOTS);
  process.exit(failed ? 1 : 0);
})();
