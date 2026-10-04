/* A whole-app QA pass of Momentum: node apps/curiosities/momentum/tests/qa.js [--three <three.min.js>] [--shots <dir>]
   (needs Playwright and Chromium; set NODE_PATH to where Playwright is installed if it is not local).

   At 1440 and 375 pixels wide it opens the app, opens Momentum and, for every tab in every group (read from the
   window itself, so new tabs are checked without editing this file): clicks the tab, waits for it to draw, and
   checks there are no page or console errors, no sideways scroll, and no visible text that says "beat" or
   "beats" (the word is "moment"), "undefined", "NaN" or "[object". It saves a screenshot per tab per width.
   Then it switches the film to two other films and draws every tab once more with each. Last, it opens the
   Screen and checks the Attention lane and the momentum section in Details draw. */
const http = require("http");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { chromium } = require("playwright");

const args = process.argv.slice(2);
const arg = (n, d) => (args.includes(n) ? args[args.indexOf(n) + 1] : d);
const SHOTS = arg("--shots", os.tmpdir());
const ROOT = path.join(__dirname, "..", "..");
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".webmanifest": "application/manifest+json" };
fs.mkdirSync(SHOTS, { recursive: true });

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
/* Words that must never show: the old word "beat", and signs of a value that did not draw. */
const BAD = [/\bbeats?\b/i, /\bundefined\b/, /\bNaN\b/, /\[object/];

(async () => {
  const server = await serve();
  const base = "http://127.0.0.1:" + server.address().port + "/";
  const browser = await chromium.launch();
  const three = arg("--three", "");
  let errors = [];
  async function newPage(viewport) {
    const page = await browser.newPage({ viewport });
    page.on("pageerror", (e) => errors.push(String(e && e.message)));
    page.on("console", (m) => m.type() === "error" && !/Failed to load resource|favicon|fonts\.g/.test(m.text()) && errors.push(m.text()));
    await page.route(/three\.min\.js$/, (r) => (three ? r.fulfill({ contentType: "text/javascript", body: fs.readFileSync(three, "utf8") }) : r.fulfill({ contentType: "text/javascript", body: "" })));
    await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
    return page;
  }
  async function loadMomentum(page, url) {
    await page.goto(base + url);
    if (!(await page.evaluate(() => !!document.querySelector('script[src="momentum/load.js"]')))) {
      await page.evaluate(() => {
        const s = document.createElement("script");
        s.src = "momentum/load.js";
        document.body.appendChild(s);
      });
    }
    await page.waitForFunction(() => window.CurioMomentumUI && window.CurioMomentumReport && window.CurioMomentumDetails, null, { timeout: 15000 });
    await page.waitForTimeout(300);
  }
  /* What the tab shows, checked: sideways scroll and the words that must not show. */
  async function look(page) {
    return page.evaluate((bad) => {
      const dlg = document.querySelector(".mo-dlg");
      const text = dlg ? dlg.innerText : "";
      const found = [];
      bad.map((b) => new RegExp(b[0], b[1])).forEach((re) => {
        const m = text.match(new RegExp(".{0,40}" + re.source + ".{0,40}", re.flags));
        if (m) found.push(m[0].replace(/\s+/g, " ").trim());
      });
      return {
        over: document.documentElement.scrollWidth - window.innerWidth,
        dlgOver: dlg ? dlg.scrollWidth - dlg.clientWidth : 0,
        found,
        body: !!(dlg && dlg.querySelector(".mo-body") && dlg.querySelector(".mo-body").innerText.trim()),
      };
    }, BAD.map((b) => [b.source, b.flags]));
  }
  async function shot(page, file) {
    /* Grow the window to the dialog's full height so the shot shows the whole tab, then put it back. */
    const vp = page.viewportSize();
    const h = await page.evaluate(() => {
      const d = document.querySelector(".mo-dlg");
      return d ? d.scrollHeight + 60 : 0;
    });
    if (h > vp.height) await page.setViewportSize({ width: vp.width, height: Math.min(h, 7000) });
    await page.waitForTimeout(120);
    await page.screenshot({ path: path.join(SHOTS, file) });
    if (h > vp.height) await page.setViewportSize(vp);
  }
  async function openTab(page, id) {
    await page.click(`.mo-dlg [data-tab="${id}"]`);
    await page.waitForFunction((t) => {
      const b = document.querySelector(`.mo-dlg [data-tab="${t}"]`);
      const body = document.querySelector(".mo-dlg .mo-body");
      return b && b.getAttribute("aria-selected") === "true" && body && body.innerText.trim().length > 0;
    }, id, { timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(250);
  }

  for (const vp of [{ width: 1440, height: 900 }, { width: 375, height: 800 }]) {
    const page = await newPage(vp);
    await loadMomentum(page, "index.html");
    await page.evaluate(() => window.CurioMomentumUI.open());
    await page.waitForSelector(".mo-dlg[open] [role=tab]");
    const tabs = await page.evaluate(() => [...document.querySelectorAll(".mo-dlg .mo-tabgroup")].map((g) => ({ group: g.dataset.tabgroup, tabs: [...g.querySelectorAll("[role=tab]")].map((t) => t.dataset.tab) })));
    const flat = tabs.reduce((a, g) => a.concat(g.tabs), []);
    ok(tabs.length === 5 && flat.length >= 16, `${vp.width}px: ${flat.length} tabs in ${tabs.length} groups (${tabs.map((g) => g.group + " " + g.tabs.length).join(", ")})`);
    for (const id of flat) {
      errors = [];
      await openTab(page, id);
      const seen = await look(page);
      const bits = [];
      if (seen.over > 0 || seen.dlgOver > 0) bits.push(`sideways ${seen.over}/${seen.dlgOver}px`);
      if (seen.found.length) bits.push("text: " + seen.found.join(" | "));
      if (!seen.body) bits.push("draws nothing");
      if (errors.length) bits.push("errors: " + errors.slice(0, 3).join(" | "));
      ok(!bits.length, `${vp.width}px ${id}` + (bits.length ? ": " + bits.join("; ") : ""));
      await shot(page, `qa-${vp.width}-${id}.png`);
    }

    /* Panel timing with no storyboard scene: its button opens the Storyboard (it used to offer no button). */
    if (flat.includes("timing")) {
      await openTab(page, "timing");
      const sb = await page.$(".mo-dlg [data-mpt-open]");
      if (sb) {
        errors = [];
        await sb.click();
        await page.waitForTimeout(300);
        const went = await page.evaluate(() => ({ closed: !document.querySelector(".mo-dlg[open]"), hash: location.hash, sb: !!document.querySelector('[data-ws-page="storyboard"], .sb-root, .storyboard, #storyboard') }));
        ok(went.closed && !errors.length, `${vp.width}px Panel timing's "Open the Storyboard" closes Momentum and opens the Storyboard` + (errors.length ? ": " + errors.join(" | ") : ""));
        await page.evaluate(() => window.CurioMomentumUI.open("timing"));
        await page.waitForSelector(".mo-dlg[open] [role=tab]");
      }
    }

    /* Two other films: every tab draws once with each. */
    const films = await page.evaluate(() => window.CurioMomentumUI.context().sources().map((s) => s.id));
    const now = await page.evaluate(() => window.CurioMomentumUI.context().source());
    const pick = [films.find((f) => f === "board"), films.find((f) => f.startsWith("study:") && f !== now)].filter(Boolean);
    const other = films.filter((f) => f.startsWith("study:") && f !== now && !pick.includes(f))[0];
    if (pick.length < 2 && other) pick.push(other);
    for (const film of pick.slice(0, 2)) {
      await page.evaluate((f) => window.CurioMomentumUI.context().setSource(f), film);
      const bad = [];
      for (const id of flat) {
        errors = [];
        await openTab(page, id);
        const seen = await look(page);
        if (seen.over > 0 || seen.dlgOver > 0 || seen.found.length || errors.length || !seen.body) bad.push(`${id} (${[seen.over > 0 || seen.dlgOver > 0 ? "sideways" : "", seen.found.join(" | "), errors.slice(0, 2).join(" | "), seen.body ? "" : "empty"].filter(Boolean).join("; ")})`);
        if (vp.width === 1440 && film === pick[1]) await shot(page, `qa-${vp.width}-${id}-film2.png`);
      }
      ok(!bad.length, `${vp.width}px every tab redraws with ${film}` + (bad.length ? ": " + bad.join(", ") : ""));
    }

    /* My film starts empty, so the engine tabs show their empty state above. Press "Start the example film"
       (it must do something) and draw every tab once more with the engine's film. */
    await openTab(page, "engine");
    const startBtn = await page.$('.mo-dlg [data-m="start-film"]');
    ok(!!startBtn, `${vp.width}px On the engine offers "Start the example film" while My film is empty`);
    if (startBtn) {
      await startBtn.click();
      await page.waitForTimeout(300);
      ok(await page.evaluate(() => window.CurioEngine.state().rows.length > 0 && !!document.querySelector(".mo-dlg .mo-lanes")), `${vp.width}px Start the example film fills My film and draws its lanes`);
    }
    if (films.includes("engine") || (await page.evaluate(() => window.CurioMomentumUI.context().sources().some((s) => s.id === "engine")))) {
      await page.evaluate(() => window.CurioMomentumUI.context().setSource("engine"));
      const bad = [];
      for (const id of flat) {
        errors = [];
        await openTab(page, id);
        const seen = await look(page);
        if (seen.over > 0 || seen.dlgOver > 0 || seen.found.length || errors.length || !seen.body) bad.push(`${id} (${[seen.over > 0 || seen.dlgOver > 0 ? `sideways ${seen.over}/${seen.dlgOver}px` : "", seen.found.join(" | "), errors.slice(0, 2).join(" | "), seen.body ? "" : "empty"].filter(Boolean).join("; ")})`);
        await shot(page, `qa-${vp.width}-${id}-engine.png`);
      }
      ok(!bad.length, `${vp.width}px every tab draws with the engine's film` + (bad.length ? ": " + bad.join(", ") : ""));
    }
    await page.close();
  }

  /* The Screen: the Attention lane under the timeline and the momentum section in Details. */
  errors = [];
  const sp = await newPage({ width: 1440, height: 900 });
  await loadMomentum(sp, "index.html?screen=1");
  await sp.evaluate(() => window.CurioScreen && !window.CurioScreen.isOpen() && window.CurioScreen.open());
  const lane = await sp.waitForSelector(".sc-timeline .mo-al .mo-al-c", { timeout: 10000 }).then(() => true, () => false);
  ok(lane, "Screen: the Attention lane draws its cells");
  const det = await sp.waitForSelector(".sc-inspector > .mo-sd .mo-sd-h", { timeout: 8000 }).then(() => true, () => false);
  ok(det, "Screen: Details has its momentum section");
  const sseen = await sp.evaluate((bad) => {
    const parts = [".mo-al", ".mo-sd", ".mo-sp"].map((s) => document.querySelector(s)).filter(Boolean);
    const text = parts.map((p) => p.innerText).join("\n");
    return bad.map((b) => new RegExp(".{0,40}" + b[0] + ".{0,40}", b[1])).map((re) => (text.match(re) || [""])[0]).filter(Boolean);
  }, BAD.map((b) => [b.source, b.flags]));
  ok(!sseen.length, "Screen: momentum parts show no bad words" + (sseen.length ? ": " + sseen.join(" | ") : ""));
  await sp.screenshot({ path: path.join(SHOTS, "qa-screen-1440.png") });
  await sp.setViewportSize({ width: 375, height: 800 });
  await sp.waitForTimeout(300);
  await sp.screenshot({ path: path.join(SHOTS, "qa-screen-375.png"), fullPage: true });
  ok(!errors.length, "Screen: no page errors" + (errors.length ? ": " + errors.slice(0, 3).join(" | ") : ""));

  await browser.close();
  server.close();
  console.log(failed ? `\n${failed} failed` : "\nall passed");
  process.exit(failed ? 1 : 0);
})();
