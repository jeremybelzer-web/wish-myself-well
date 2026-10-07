/* Save a project to a file, start fresh, open the file again: everything comes back. In a real browser:
     node apps/curiosities/tests/save-open.js
   (needs Playwright and Chromium; set NODE_PATH to where Playwright is installed if it is not local).

   Uses the app the way a person does: changes My film, a workspace cell and the Storyboard, then
   Library > Save project (the browser's download, as on a browser with no save window), Library > Open or
   new project > New project, then Open… with the saved file. Checks every saved part comes back exactly,
   that History can go back to the fresh project, that a reload changes nothing, and that a broken file is
   refused with a message and changes nothing. */
const http = require("http");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { chromium } = require("playwright");

const ROOT = path.join(__dirname, "..");
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".webmanifest": "application/manifest+json" };
let failed = 0;
const ok = (cond, what) => {
  console.log((cond ? "ok   " : "FAIL ") + what);
  if (!cond) failed++;
};

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

/* The saved work: every curiosities-* part except the project's own bookkeeping and view settings. */
const WORK = () => {
  const out = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k.startsWith("curiosities-") && !/project|history|-view-|workspace-v1|glossary|studio-tab|-ui-|-prefs-|-tab-/.test(k)) out[k] = localStorage.getItem(k);
  }
  return out;
};
const diff = (a, b) => [...new Set([...Object.keys(a), ...Object.keys(b)])].filter((k) => a[k] !== b[k]);

(async () => {
  const server = await serve();
  const url = `http://127.0.0.1:${server.address().port}/index.html`;
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "curio-save-"));
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: 1400, height: 900 }, acceptDownloads: true })).newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && !/Failed to load resource|net::|three/i.test(m.text()) && errors.push(m.text()));
  page.on("dialog", (d) => d.accept().catch(() => {}));
  /* A browser with no save window, so Save is a download the test can catch. */
  await page.addInitScript(() => {
    delete window.showSaveFilePicker;
    delete window.showOpenFilePicker;
    window.showSaveFilePicker = undefined;
    window.showOpenFilePicker = undefined;
  });
  await page.route(/fonts\.(googleapis|gstatic)|cdnjs|jsdelivr|unpkg/, (r) => r.abort());
  await page.goto(url);
  await page.waitForTimeout(1200);
  const work = () => page.evaluate(`(${WORK})()`);
  const lib = async (label) => {
    await page.click("#lib-btn");
    await page.click(`#lib-menu button:has-text("${label}")`);
    await page.waitForTimeout(300);
  };
  const pick = (sel, index) =>
    page.evaluate(
      ([sel, index]) => {
        const e = document.querySelector(sel);
        e.selectedIndex = index;
        e.dispatchEvent(new Event("change", { bubbles: true }));
      },
      [sel, index]
    );

  /* 1. Make some work: My film, a workspace cell, the Storyboard. */
  const fresh = await work();
  await pick('#controls select', 1);
  const sel2 = await page.evaluate(() => [...document.querySelectorAll("#controls select")].length);
  if (sel2 > 3) await pick("#controls select:nth-of-type(1)", 2);
  await page.click('#tabs button[data-tab="board"]');
  const toBoard = await page.$('button:has-text("Save into the storyboard")');
  if (toBoard) await toBoard.click();
  await page.waitForTimeout(400);
  /* The workspaces live in a pop-up from the "Workspaces" button. */
  await page.click("#ws-pick");
  await page.click('#ws-buttons button[data-ws="emotion"]');
  await page.waitForTimeout(400);
  await page.evaluate(() => {
    const s = [...document.querySelectorAll("#workspace select")].find((e) => e.offsetParent);
    s.selectedIndex = s.options.length - 1;
    s.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.waitForTimeout(1600);
  const made = await work();
  ok(diff(fresh, made).length >= 2, "the changes are saved in the browser (" + diff(fresh, made).join(", ") + ")");
  ok(/not saved/i.test(await page.textContent(".proj-ind")), "the bar says the project is not saved to a file");

  /* 2. Save project: a .curio file. */
  const [download] = await Promise.all([page.waitForEvent("download", { timeout: 10000 }), lib("Save project")]);
  const file = path.join(dir, download.suggestedFilename());
  await download.saveAs(file);
  ok(/\.curio$/.test(file), "Save project gives a .curio file (" + path.basename(file) + ")");
  const saved = JSON.parse(fs.readFileSync(file, "utf8"));
  ok(saved && typeof saved === "object", "the file is readable JSON");
  await page.waitForTimeout(400);
  ok(!/not saved/i.test(await page.textContent(".proj-ind")), "the bar no longer says not saved (" + (await page.textContent(".proj-ind")).trim() + ")");

  /* 3. New project: back to nothing. */
  await lib("Open or new project");
  await page.click('[data-p="new"]');
  await Promise.all([page.waitForNavigation({ timeout: 15000 }), page.click('[data-p="ok"]')]);
  await page.waitForTimeout(1200);
  const cleared = await work();
  ok(diff(made, cleared).length > 0, "New project clears the work");

  /* 4. Open the saved file. */
  await lib("Open or new project");
  const [chooser] = await Promise.all([page.waitForEvent("filechooser"), page.click('[data-p="open"]')]);
  await chooser.setFiles(file);
  await page.waitForSelector('[data-p="ok"]');
  ok(/Open/.test(await page.textContent('[data-p="ok"]')), "opening asks first and shows what is inside");
  await Promise.all([page.waitForNavigation({ timeout: 15000 }), page.click('[data-p="ok"]')]);
  await page.waitForTimeout(1200);
  const opened = await work();
  ok(diff(made, opened).length === 0, "every saved part comes back exactly" + (diff(made, opened).length ? " (differs: " + diff(made, opened).join(", ") + ")" : ""));

  /* 5. A reload changes nothing. */
  await page.reload();
  await page.waitForTimeout(1200);
  ok(diff(opened, await work()).length === 0, "a reload changes nothing");

  /* 6. A broken file is refused and changes nothing. */
  const bad = path.join(dir, "broken.curio");
  fs.writeFileSync(bad, "{ this is not a project");
  await lib("Open or new project");
  const [chooser2] = await Promise.all([page.waitForEvent("filechooser"), page.click('[data-p="open"]')]);
  await chooser2.setFiles(bad);
  await page.waitForTimeout(600);
  const said = await page.evaluate(() => document.body.innerText);
  ok(/could not be read/i.test(said), "a broken file says it could not be read");
  ok(diff(opened, await work()).length === 0, "a broken file changes nothing");

  /* 7. History goes back to before the open (the fresh project). */
  await page.keyboard.press("Escape");
  await lib("History");
  await page.waitForTimeout(800);
  const restore = await page.$$('[data-p="restore"]');
  ok(restore.length > 0, "History lists snapshots (" + restore.length + ")");
  const before = await page.evaluate(() => [...document.querySelectorAll('[data-p="restore"]')].findIndex((b) => /Before opening/i.test(b.closest("li").innerText)));
  ok(before >= 0, "History has a 'Before opening' snapshot");
  if (before >= 0) {
    const nav = page.waitForNavigation({ timeout: 15000 });
    await page.locator('[data-p="restore"]').nth(before).click();
    /* Restoring may ask first. */
    const okBtn = await page.waitForSelector('[data-p="ok"]', { timeout: 1500 }).catch(() => null);
    if (okBtn) await okBtn.click();
    await nav;
    await page.waitForTimeout(1200);
    ok(diff(cleared, await work()).length === 0, "restoring it brings back the fresh project");
  }

  ok(errors.length === 0, "no page errors" + (errors.length ? ": " + errors.slice(0, 3).join(" | ") : ""));
  await browser.close();
  server.close();
  console.log(failed ? `\n${failed} failed` : "\nall passed");
  process.exit(failed ? 1 : 0);
})().catch((e) => {
  console.error("FAIL the test could not finish: " + e.message);
  process.exit(1);
});
