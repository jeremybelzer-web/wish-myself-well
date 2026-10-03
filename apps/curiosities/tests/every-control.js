/* Every control on every page, in a real browser:
     node apps/curiosities/tests/every-control.js [--width 1400] [--three three.min.js] [--only "Emotion,Prism"]
       [--max 250] [--jobs 4] [--all] [--debug] [--out report.json]
   (needs Playwright and Chromium; set NODE_PATH to where Playwright is installed if it is not local).

   Opens the app with nothing saved (a fresh browser profile per page, --jobs pages at a time), then for each page (My film, Storyboard, every workspace in the bar, every
   item in the Library menu): presses every visible button, ticks every checkbox and picks every choice of every
   dropdown, one at a time, the way a curious beginner would. After each one it goes back to that page if the
   control took it somewhere else.

   Fails on: a page error or a console error (with the page and the control that caused it), a page that
   scrolls sideways, a page that shows almost nothing, or a control that throws when used.
   Lists, without failing: buttons that changed nothing anyone could see (worth a look; some only move focus).
   Skipped on purpose: Print, file saves and opens, sharing, MIDI and VCV connections (they open system windows). */
const http = require("http");
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const args = process.argv.slice(2);
const arg = (n, d) => (args.includes(n) ? args[args.indexOf(n) + 1] : d);
const WIDTH = Number(arg("--width", 1400));
const HEIGHT = WIDTH > 800 ? 900 : 844;
const THREE = arg("--three", "");
const ONLY = arg("--only", "").split(",").filter(Boolean);
const MAX = Number(arg("--max", 250));
const OUT = arg("--out", "");
const JOBS = Number(arg("--jobs", 4));
const DEBUG = args.includes("--debug");
/* Grids repeat one control per panel or scene; by default only the first of each is used. --all uses every one. */
const ALL = args.includes("--all");
const kindOf = (c) => c.tag + ":" + c.label.replace(/,? (panel|scene|moment|beat) \d+/gi, "").replace(/\d+/g, "#");
const ROOT = path.join(__dirname, "..");
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".webmanifest": "application/manifest+json" };
const SKIP = /print|download|save to file|save project|export|open a file|choose file|open or new|connect|midi|vcv|^share|back to the app|back to book/i;

function serve() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const p = path.join(ROOT, decodeURIComponent(req.url.split("?")[0]).replace(/^\/+/, "") || "index.html");
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

/* Everything a person can press, outside the top bar (the bar is how the test moves between pages). */
const CONTROLS = () =>
  [...document.querySelectorAll("button,select,input[type=checkbox],input[type=radio],summary,[role=button],[role=tab],[role=menuitem]")].filter(
    (e) => e.getClientRects().length && !e.disabled && !e.closest("#tabs")
  );

const problems = [];
const quiet = [];
const report = [];
let used = 0;

async function newPage(browser, url, onProblem) {
  const context = await browser.newContext({ viewport: { width: WIDTH, height: HEIGHT }, acceptDownloads: true });
  const page = await context.newPage();
  await page.route(/three\.min\.js$/, (r) => (THREE ? r.fulfill({ contentType: "text/javascript", body: fs.readFileSync(THREE, "utf8") }) : r.fulfill({ contentType: "text/javascript", body: "" })));
  await page.route(/fonts\.(googleapis|gstatic)|cdnjs|jsdelivr|unpkg/, (r) => r.abort());
  page.on("pageerror", (e) => onProblem("page error: " + e.message.slice(0, 200)));
  page.on("console", (m) => {
    if (m.type() === "error" && !/Failed to load resource|net::|three/i.test(m.text())) onProblem("console error: " + m.text().slice(0, 200));
  });
  page.on("dialog", (d) => d.dismiss().catch(() => {}));
  page.on("popup", (p) => p.close().catch(() => {}));
  page.on("download", (d) => d.cancel().catch(() => {}));
  await page.goto(url);
  await page.waitForTimeout(1200);
  return { page, context };
}

/* One page of the app, in its own fresh browser profile. */
async function testPage(browser, url, [name, kind, key]) {
  let where = name;
  let last = "opening it";
  const before0 = problems.length;
  const { page, context } = await newPage(browser, url, (text) => problems.push(`${where}, after ${last}: ${text}`));
  async function open(kind, key) {
    await page.keyboard.press("Escape").catch(() => {});
    await page.evaluate(() => {
      const back = [...document.querySelectorAll("button")].find((b) => b.offsetParent && b.textContent.trim() === "Back to the app");
      if (back) back.click();
    });
    if (kind === "lib")
      await page.evaluate((i) => {
        document.querySelector("#lib-btn").click();
        document.querySelectorAll("#lib-menu button")[i].click();
      }, key);
    else await page.evaluate((s) => document.querySelector(s) && document.querySelector(s).click(), key);
    await page.waitForTimeout(400);
  }
  /* Which page is showing: the visible main sections and overlays, and the lit bar button. */
  const pageId = () =>
    page.evaluate(
      () =>
        [...document.querySelectorAll("main > section, body > div, body > section")]
          .filter((e) => e.getClientRects().length && getComputedStyle(e).visibility !== "hidden")
          .map((e) => e.id || e.className)
          .join(",") + "|" + ((document.querySelector("#tabs .on") || {}).textContent || "")
    );
  /* What a person could notice changing: anything on the page, anything saved, focus, scroll. Counted by
     a watcher installed once, so checking is cheap even on pages with thousands of elements. */
  await page.evaluate(() => {
    window.__every = 0;
    new MutationObserver((m) => (window.__every += m.length)).observe(document.body, { subtree: true, childList: true, attributes: true, characterData: true });
    const set = Storage.prototype.setItem;
    Storage.prototype.setItem = function (k, v) {
      window.__every++;
      return set.call(this, k, v);
    };
  });
  const look = () => page.evaluate(() => window.__every + "|" + (document.activeElement ? document.activeElement.outerHTML.slice(0, 80) : "") + "|" + scrollY);
  /* Give every control on the page a stable name (tag, label, and which repeat of that label it is) so the
     test can find it again after the page redraws. Returns the names in page order. */
  const tagAll = () =>
    page.evaluate((list) => {
      const count = {};
      return eval(`(${list})()`).map((e) => {
        const label = (e.getAttribute("aria-label") || e.title || e.textContent || e.name || "").trim().replace(/\s+/g, " ").slice(0, 50);
        const base = e.tagName.toLowerCase() + ":" + label;
        count[base] = (count[base] || 0) + 1;
        e.dataset.every = base + "#" + count[base];
        return { id: e.dataset.every, tag: e.tagName.toLowerCase(), label, options: e.tagName === "SELECT" ? e.options.length : 0 };
      });
    }, String(CONTROLS));
  const find = (id) => page.evaluate((id) => !!document.querySelector(`[data-every="${CSS.escape(id)}"]`), id);

  {
    where = name;
    last = "opening it";
    await open(kind, key);
    const text = await page.evaluate(() => (document.querySelector("main") || document.body).innerText.length + document.body.innerText.length);
    if (text < 100) problems.push(`${name}: the page shows almost nothing`);
    const home = await pageId();
    const plan = [];
    const kinds = new Set();
    for (const c of await tagAll()) {
      if (c.tag !== "select" && SKIP.test(c.label)) continue;
      if (!ALL && kinds.has(kindOf(c))) continue;
      kinds.add(kindOf(c));
      plan.push(c);
    }
    const seen = new Set();
    let n = 0;
    for (const c of plan.slice(0, MAX)) {
      if (!(await find(c.id))) {
        await tagAll();
        if (!(await find(c.id))) continue; /* gone after an earlier control changed the page: fine */
      }
      const sel = `[data-every="${c.id.replace(/["\\]/g, "\\$&")}"]`;
      last = `${c.tag} "${c.label}"`;
      n++;
      if (DEBUG) console.log(`   ${Date.now() % 100000} ${last}`);
      try {
        if (c.tag === "select") {
          /* The second, middle and last choice, then back to the first. */
          const picks = [...new Set([1, Math.floor(c.options / 2), c.options - 1, 0])].filter((o) => o >= 0 && o < c.options);
          for (const o of picks)
            await page.evaluate(([sel, o]) => {
              const e = document.querySelector(sel);
              if (!e) return;
              e.selectedIndex = o;
              e.dispatchEvent(new Event("input", { bubbles: true }));
              e.dispatchEvent(new Event("change", { bubbles: true }));
            }, [sel, o]);
        } else {
          const before = await look();
          await page.click(sel, { timeout: 1000 }).catch(() => page.evaluate((sel) => document.querySelector(sel) && document.querySelector(sel).click(), sel));
          await page.waitForTimeout(60);
          if (before === (await look()) && !seen.has(c.label)) {
            seen.add(c.label);
            quiet.push(`${name}: ${c.tag} "${c.label}"`);
          }
        }
      } catch (e) {
        problems.push(`${name}, ${last}: ${e.message.split("\n")[0]}`);
      }
      const now = await pageId();
      if (now !== home) {
        if (DEBUG) console.log("     left the page: " + now.slice(0, 160) + "  vs  " + home.slice(0, 160));
        await open(kind, key);
      }
    }
    used += n;
    report.push(`${problems.length > before0 ? "    " : "ok  "} ${name}: ${n} controls`);
    const over = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    if (over > 2) problems.push(`${name}: the page scrolls sideways by ${over}px`);
  }

  await context.close();
}

(async () => {
  const server = await serve();
  const url = `http://127.0.0.1:${server.address().port}/index.html`;
  const browser = await chromium.launch();

  /* The pages: My film, Storyboard, every workspace in the bar, every Library item. */
  const scout = await newPage(browser, url, (text) => problems.push(`opening the app: ${text}`));
  const pages = [
    ["My film", "bar", '#tabs button[data-tab="board"]'],
    ["Storyboard", "bar", '#tabs button[data-ws="storyboard"]'],
  ];
  for (const [label, id] of await scout.page.$$eval("#ws-buttons button[data-ws]", (bs) => bs.map((b) => [b.textContent.trim(), b.dataset.ws]))) pages.push([label, "bar", `#ws-buttons button[data-ws="${id}"]`]);
  for (const [label, i] of await scout.page.$$eval("#lib-menu button", (bs) => bs.map((b, i) => [b.firstChild.textContent.trim(), i]))) pages.push(["Library: " + label, "lib", i]);
  await scout.context.close();

  const todo = pages.filter(([name]) => !ONLY.length || ONLY.some((w) => name.includes(w)));
  await Promise.all(
    Array.from({ length: Math.max(1, JOBS) }, async () => {
      while (todo.length) {
        const p = todo.shift();
        await testPage(browser, url, p).catch((e) => problems.push(`${p[0]}: the test could not finish: ${e.message.split("\n")[0]}`));
        console.log(report[report.length - 1] || "");
      }
    })
  );

  console.log(`\n${used} controls used at ${WIDTH}px wide.`);
  if (quiet.length) console.log(`\nChanged nothing visible (not a failure, worth a look):\n  ` + quiet.join("\n  "));
  if (OUT) fs.writeFileSync(OUT, JSON.stringify({ width: WIDTH, used, problems, quiet }, null, 1));
  console.log(problems.length ? `\nFAIL ${problems.length} problem(s):\n  ` + problems.join("\n  ") : "\nall passed");
  await browser.close();
  server.close();
  process.exit(problems.length ? 1 : 0);
})();
